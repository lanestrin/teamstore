import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

/**
 * Audits the supplier color data contained in selected-products.json.
 *
 * Run from the project root:
 *
 *   npx tsx scripts/auditCatalogColors.ts
 *
 * Optional paths:
 *
 *   npx tsx scripts/auditCatalogColors.ts \
 *     --input ./scripts/output/catalog-audit/selected-products.json \
 *     --output ./scripts/output/catalog-audit
 *
 * Generated files:
 *
 *   color-audit.json
 *   unique-colors.csv
 */

type HexStatus =
  | "valid"
  | "partial"
  | "missing"
  | "invalid"
  | "multiple"
  | "conflicting";

type ColorFlag = "compound" | "heather" | "camo" | "patterned";

interface CliOptions {
  inputPath: string;
  outputDir: string;
}

interface SelectedProductColor {
  color: string;
  providerColor: string;
  colorKey: string;
  colorHexValue: string | null;
  swatchImageUrl: string | null;
}

interface SelectedProduct {
  providerProductId: string;
  name: string;
  colors: SelectedProductColor[];
}

interface HexAnalysis {
  status: "valid" | "missing" | "invalid" | "multiple";
  rawValue: string | null;
  normalizedValues: string[];
}

interface ColorOccurrence {
  providerProductId: string;
  productName: string;
  displayColor: string;
  providerColor: string;
  colorKey: string;
  colorHexValue: string | null;
  swatchImageUrl: string | null;
  hexAnalysis: HexAnalysis;
}

interface AuditedColor {
  normalizedProviderColor: string;
  providerColor: string;
  displayColors: string[];
  colorKeys: string[];
  productCount: number;
  occurrenceCount: number;
  rawHexValues: string[];
  normalizedHexValues: string[];
  hexStatus: HexStatus;
  swatchCount: number;
  swatchCoverage: number;
  flags: ColorFlag[];
  needsReview: boolean;
  reviewReasons: string[];
  exampleProducts: Array<{
    providerProductId: string;
    productName: string;
    displayColor: string;
    colorKey: string;
    colorHexValue: string | null;
    swatchImageUrl: string | null;
  }>;
}

const DEFAULT_INPUT_PATH = path.resolve(
  process.cwd(),
  "scripts/output/catalog-audit/selected-products.json",
);

function parseArgs(argv: string[]): CliOptions {
  let inputPath = DEFAULT_INPUT_PATH;
  let outputDir: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const nextValue = argv[index + 1];

    switch (argument) {
      case "--input":
        if (!nextValue) {
          throw new Error("--input requires a file path.");
        }

        inputPath = path.resolve(process.cwd(), nextValue);
        index += 1;
        break;

      case "--output":
        if (!nextValue) {
          throw new Error("--output requires a directory path.");
        }

        outputDir = path.resolve(process.cwd(), nextValue);
        index += 1;
        break;

      case "--help":
      case "-h":
        printHelp();
        process.exit(0);

      // eslint-disable-next-line no-fallthrough
      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return {
    inputPath,
    outputDir: outputDir ?? path.dirname(inputPath),
  };
}

function printHelp() {
  console.log(`
Catalog color audit

Usage:
  npx tsx scripts/auditCatalogColors.ts [options]

Options:
  --input <path>          selected-products.json path
  --output <directory>   Output directory
  --help                 Show this help message
`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getRequiredString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value.trim();
}

function getOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized || null;
}

function parseSelectedProducts(value: unknown): SelectedProduct[] {
  if (!Array.isArray(value)) {
    throw new Error("selected-products.json must contain a JSON array.");
  }

  return value.map((productValue, productIndex) => {
    if (!isRecord(productValue)) {
      throw new Error(`Product at index ${productIndex} must be an object.`);
    }

    const providerProductId = getRequiredString(
      productValue.providerProductId,
      `Product ${productIndex} providerProductId`,
    );

    const name = getRequiredString(
      productValue.name,
      `Product ${providerProductId} name`,
    );

    if (!Array.isArray(productValue.colors)) {
      throw new Error(
        `Product ${providerProductId} must contain a colors array.`,
      );
    }

    const colors = productValue.colors.map((colorValue, colorIndex) => {
      if (!isRecord(colorValue)) {
        throw new Error(
          `Color ${colorIndex} on product ${providerProductId} must be an object.`,
        );
      }

      const color = getRequiredString(
        colorValue.color,
        `Product ${providerProductId} color ${colorIndex} color`,
      );

      const providerColor = getOptionalString(colorValue.providerColor) ?? color;
      const colorKey =
        getOptionalString(colorValue.colorKey) ?? normalizeColorKey(providerColor);

      return {
        color,
        providerColor,
        colorKey,
        colorHexValue: getOptionalString(colorValue.colorHexValue),
        swatchImageUrl: getOptionalString(colorValue.swatchImageUrl),
      };
    });

    return {
      providerProductId,
      name,
      colors,
    };
  });
}

function normalizeColorKey(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeHexToken(value: string) {
  const hex = value.replace(/^#/, "").toUpperCase();

  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((character) => `${character}${character}`)
      .join("")}`;
  }

  return `#${hex}`;
}

function analyzeHex(value: string | null): HexAnalysis {
  const rawValue = value?.trim() || null;

  if (!rawValue) {
    return {
      status: "missing",
      rawValue: null,
      normalizedValues: [],
    };
  }

  const exactMatch = rawValue.match(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/);

  if (exactMatch) {
    return {
      status: "valid",
      rawValue,
      normalizedValues: [normalizeHexToken(exactMatch[1])],
    };
  }

  const tokenMatches =
    rawValue.match(/#?(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g) ??
    [];

  const normalizedValues = [
    ...new Set(tokenMatches.map((token) => normalizeHexToken(token))),
  ];

  if (normalizedValues.length > 1 || tokenMatches.length > 1) {
    return {
      status: "multiple",
      rawValue,
      normalizedValues,
    };
  }

  return {
    status: "invalid",
    rawValue,
    normalizedValues,
  };
}

function detectColorFlags(providerColor: string): ColorFlag[] {
  const normalized = providerColor.toLowerCase();
  const flags: ColorFlag[] = [];

  if (/[/&+]|\b(?:and|with)\b/.test(normalized)) {
    flags.push("compound");
  }

  if (
    /\b(?:heather|heath|hethr|hthr|triblend|tri-blend|marled|melange|mélange)\b/.test(
      normalized,
    )
  ) {
    flags.push("heather");
  }

  if (/\b(?:camo|camouflage)\b/.test(normalized)) {
    flags.push("camo");
  }

  if (
    /\b(?:stripe|striped|tie[- ]?dye|ombre|ombré|speckled|print|pattern|color[- ]?block|two[- ]?tone)\b/.test(
      normalized,
    )
  ) {
    flags.push("patterned");
  }

  return flags;
}

function getGroupHexStatus(occurrences: ColorOccurrence[]): HexStatus {
  const analyses = occurrences.map((occurrence) => occurrence.hexAnalysis);
  const normalizedValues = [
    ...new Set(analyses.flatMap((analysis) => analysis.normalizedValues)),
  ];

  if (normalizedValues.length > 1) {
    return "conflicting";
  }

  if (analyses.some((analysis) => analysis.status === "multiple")) {
    return "multiple";
  }

  if (analyses.some((analysis) => analysis.status === "invalid")) {
    return "invalid";
  }

  if (normalizedValues.length === 0) {
    return "missing";
  }

  if (analyses.some((analysis) => analysis.status === "missing")) {
    return "partial";
  }

  return "valid";
}

function buildReviewReasons(
  hexStatus: HexStatus,
  flags: ColorFlag[],
  swatchCount: number,
): string[] {
  const reasons: string[] = [];

  switch (hexStatus) {
    case "conflicting":
      reasons.push("conflicting-hex-values");
      break;
    case "multiple":
      reasons.push("multiple-hex-values");
      break;
    case "invalid":
      reasons.push("invalid-hex-value");
      break;
    case "missing":
      reasons.push("missing-hex-value");
      break;
    case "partial":
      reasons.push("partial-hex-coverage");
      break;
    case "valid":
      break;
  }

  if (flags.includes("compound")) {
    reasons.push("compound-color-name");
  }

  if (flags.includes("heather")) {
    reasons.push("heather-color");
  }

  if (flags.includes("camo")) {
    reasons.push("camo-color");
  }

  if (flags.includes("patterned")) {
    reasons.push("patterned-color");
  }

  if (
    swatchCount === 0 &&
    (hexStatus === "missing" || hexStatus === "invalid")
  ) {
    reasons.push("missing-usable-hex-and-swatch");
  }

  return reasons;
}

function auditColors(products: SelectedProduct[]): AuditedColor[] {
  const occurrencesByProviderColor = new Map<string, ColorOccurrence[]>();

  for (const product of products) {
    for (const color of product.colors) {
      const normalizedProviderColor = normalizeColorKey(color.providerColor);
      const occurrence: ColorOccurrence = {
        providerProductId: product.providerProductId,
        productName: product.name,
        displayColor: color.color,
        providerColor: color.providerColor,
        colorKey: normalizeColorKey(color.colorKey),
        colorHexValue: color.colorHexValue,
        swatchImageUrl: color.swatchImageUrl,
        hexAnalysis: analyzeHex(color.colorHexValue),
      };

      const existingOccurrences =
        occurrencesByProviderColor.get(normalizedProviderColor) ?? [];

      existingOccurrences.push(occurrence);
      occurrencesByProviderColor.set(
        normalizedProviderColor,
        existingOccurrences,
      );
    }
  }

  const auditedColors: AuditedColor[] = [];

  for (const [normalizedProviderColor, occurrences] of occurrencesByProviderColor) {
    const providerColors = [
      ...new Set(occurrences.map((occurrence) => occurrence.providerColor)),
    ];

    const displayColors = [
      ...new Set(occurrences.map((occurrence) => occurrence.displayColor)),
    ].sort((first, second) => first.localeCompare(second));

    const colorKeys = [
      ...new Set(occurrences.map((occurrence) => occurrence.colorKey)),
    ].sort((first, second) => first.localeCompare(second));

    const productIds = new Set(
      occurrences.map((occurrence) => occurrence.providerProductId),
    );

    const rawHexValues = [
      ...new Set(
        occurrences.flatMap((occurrence) =>
          occurrence.hexAnalysis.rawValue
            ? [occurrence.hexAnalysis.rawValue]
            : [],
        ),
      ),
    ].sort((first, second) => first.localeCompare(second));

    const normalizedHexValues = [
      ...new Set(
        occurrences.flatMap(
          (occurrence) => occurrence.hexAnalysis.normalizedValues,
        ),
      ),
    ].sort((first, second) => first.localeCompare(second));

    const hexStatus = getGroupHexStatus(occurrences);
    const swatchCount = occurrences.filter(
      (occurrence) => occurrence.swatchImageUrl,
    ).length;

    const flags = [
      ...new Set(
        occurrences.flatMap((occurrence) =>
          detectColorFlags(occurrence.providerColor),
        ),
      ),
    ];

    const reviewReasons = buildReviewReasons(hexStatus, flags, swatchCount);

    auditedColors.push({
      normalizedProviderColor,
      providerColor: providerColors.sort((first, second) =>
        first.localeCompare(second),
      )[0],
      displayColors,
      colorKeys,
      productCount: productIds.size,
      occurrenceCount: occurrences.length,
      rawHexValues,
      normalizedHexValues,
      hexStatus,
      swatchCount,
      swatchCoverage:
        occurrences.length === 0
          ? 0
          : Number((swatchCount / occurrences.length).toFixed(4)),
      flags,
      needsReview: reviewReasons.length > 0,
      reviewReasons,
      exampleProducts: occurrences
        .sort(
          (first, second) =>
            first.productName.localeCompare(second.productName) ||
            first.providerProductId.localeCompare(second.providerProductId),
        )
        .slice(0, 10)
        .map((occurrence) => ({
          providerProductId: occurrence.providerProductId,
          productName: occurrence.productName,
          displayColor: occurrence.displayColor,
          colorKey: occurrence.colorKey,
          colorHexValue: occurrence.colorHexValue,
          swatchImageUrl: occurrence.swatchImageUrl,
        })),
    });
  }

  return auditedColors.sort(
    (first, second) =>
      second.productCount - first.productCount ||
      first.providerColor.localeCompare(second.providerColor),
  );
}

function escapeCsvValue(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(headers: string[], rows: unknown[][]) {
  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");
}

function countByHexStatus(colors: AuditedColor[]) {
  const counts: Record<HexStatus, number> = {
    valid: 0,
    partial: 0,
    missing: 0,
    invalid: 0,
    multiple: 0,
    conflicting: 0,
  };

  for (const color of colors) {
    counts[color.hexStatus] += 1;
  }

  return counts;
}

function countByFlag(colors: AuditedColor[]) {
  const counts: Record<ColorFlag, number> = {
    compound: 0,
    heather: 0,
    camo: 0,
    patterned: 0,
  };

  for (const color of colors) {
    for (const flag of color.flags) {
      counts[flag] += 1;
    }
  }

  return counts;
}

async function writeOutputs(
  options: CliOptions,
  products: SelectedProduct[],
  auditedColors: AuditedColor[],
) {
  await mkdir(options.outputDir, { recursive: true });

  const totalColorOccurrences = products.reduce(
    (total, product) => total + product.colors.length,
    0,
  );

  const totalSwatchOccurrences = products.reduce(
    (total, product) =>
      total +
      product.colors.filter((color) => Boolean(color.swatchImageUrl)).length,
    0,
  );

  const straightforwardCandidates = auditedColors.filter(
    (color) =>
      color.hexStatus === "valid" &&
      !color.flags.includes("compound") &&
      !color.flags.includes("camo") &&
      !color.flags.includes("patterned"),
  ).length;

  const summary = {
    generatedAt: new Date().toISOString(),
    source: {
      inputPath: options.inputPath,
      productCount: products.length,
      productColorOccurrences: totalColorOccurrences,
    },
    uniqueColors: {
      total: auditedColors.length,
      needsReview: auditedColors.filter((color) => color.needsReview).length,
      noReviewFlags: auditedColors.filter((color) => !color.needsReview).length,
      straightforwardClassificationCandidates: straightforwardCandidates,
    },
    hexStatusCounts: countByHexStatus(auditedColors),
    flagCounts: countByFlag(auditedColors),
    swatches: {
      occurrencesWithSwatches: totalSwatchOccurrences,
      occurrenceCoverage:
        totalColorOccurrences === 0
          ? 0
          : Number((totalSwatchOccurrences / totalColorOccurrences).toFixed(4)),
    },
  };

  const csvRows = auditedColors.map((color) => [
    color.providerColor,
    color.normalizedProviderColor,
    color.displayColors.join(" | "),
    color.colorKeys.join(" | "),
    color.productCount,
    color.occurrenceCount,
    color.hexStatus,
    color.rawHexValues.join(" | "),
    color.normalizedHexValues.join(" | "),
    color.swatchCount,
    color.swatchCoverage,
    color.flags.join(" | "),
    color.needsReview,
    color.reviewReasons.join(" | "),
    color.exampleProducts
      .map(
        (product) => `${product.productName} (${product.providerProductId})`,
      )
      .join(" | "),
  ]);

  await Promise.all([
    writeFile(
      path.join(options.outputDir, "color-audit.json"),
      `${JSON.stringify(
        {
          ...summary,
          colors: auditedColors,
        },
        null,
        2,
      )}\n`,
      "utf8",
    ),
    writeFile(
      path.join(options.outputDir, "unique-colors.csv"),
      `${toCsv(
        [
          "providerColor",
          "normalizedProviderColor",
          "displayColors",
          "colorKeys",
          "productCount",
          "occurrenceCount",
          "hexStatus",
          "rawHexValues",
          "normalizedHexValues",
          "swatchCount",
          "swatchCoverage",
          "flags",
          "needsReview",
          "reviewReasons",
          "exampleProducts",
        ],
        csvRows,
      )}\n`,
      "utf8",
    ),
  ]);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log(`Reading selected products: ${options.inputPath}`);

  const inputText = await readFile(options.inputPath, "utf8");
  const parsedInput: unknown = JSON.parse(inputText);
  const products = parseSelectedProducts(parsedInput);

  console.log(`Loaded ${products.length.toLocaleString()} selected products.`);

  const auditedColors = auditColors(products);

  await writeOutputs(options, products, auditedColors);

  const needsReviewCount = auditedColors.filter(
    (color) => color.needsReview,
  ).length;

  console.log(
    `Found ${auditedColors.length.toLocaleString()} unique supplier colors.`,
  );
  console.log(
    `${needsReviewCount.toLocaleString()} colors were flagged for review.`,
  );
  console.log(`Output directory: ${options.outputDir}`);
}

main().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );

  process.exitCode = 1;
});