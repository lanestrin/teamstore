import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import {
  classifyProductColor,
  normalizeProductColorName,
} from "../src/lib/classifyProductColor";

/**
 * Runs the deterministic product-color classifier against the selected
 * catalog and summarizes the results by normalized supplier color name.
 *
 * Run from the project root:
 *
 *   npx tsx scripts/classifyCatalogColors.ts
 *
 * Optional paths:
 *
 *   npx tsx scripts/classifyCatalogColors.ts \
 *     --input ./scripts/output/catalog-audit/selected-products.json \
 *     --output ./scripts/output/catalog-audit
 *
 * Generated files:
 *
 *   classified-colors.json
 *   classified-colors.csv
 */

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

type Classification = ReturnType<typeof classifyProductColor>;

interface ClassifiedOccurrence {
  providerProductId: string;
  productName: string;
  color: string;
  providerColor: string;
  normalizedProviderColor: string;
  colorKey: string;
  colorHexValue: string | null;
  swatchImageUrl: string | null;
  classification: Classification;
}

interface ClassificationVariation {
  count: number;
  classification: Classification;
}

interface ClassifiedColorSummary {
  providerColor: string;
  normalizedProviderColor: string;
  displayColors: string[];
  colorKeys: string[];
  productCount: number;
  occurrenceCount: number;
  suppliedHexValues: string[];
  swatchCount: number;
  representativeClassification: Classification;
  classificationVariations: ClassificationVariation[];
  classificationIsConsistent: boolean;
  needsReview: boolean;
  reviewReasons: string[];
  exampleProducts: Array<{
    providerProductId: string;
    productName: string;
    color: string;
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
Catalog color classifier

Usage:
  npx tsx scripts/classifyCatalogColors.ts [options]

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

  return value.trim() || null;
}

function normalizeColorKey(value: string): string {
  return value.trim().toLowerCase();
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

      const providerColor =
        getOptionalString(colorValue.providerColor) ?? color;

      return {
        color,
        providerColor,
        colorKey:
          getOptionalString(colorValue.colorKey) ??
          normalizeColorKey(providerColor),
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

function classifyOccurrences(
  products: SelectedProduct[],
): ClassifiedOccurrence[] {
  return products.flatMap((product) =>
    product.colors.map((color) => ({
      providerProductId: product.providerProductId,
      productName: product.name,
      color: color.color,
      providerColor: color.providerColor,
      normalizedProviderColor: normalizeProductColorName(color.providerColor),
      colorKey: normalizeColorKey(color.colorKey),
      colorHexValue: color.colorHexValue,
      swatchImageUrl: color.swatchImageUrl,
      classification: classifyProductColor({
        providerColor: color.providerColor,
        hexValue: color.colorHexValue,
      }),
    })),
  );
}

function classificationKey(classification: Classification): string {
  return JSON.stringify({
    primary: {
      family: classification.primary.family,
      category: classification.primary.category,
    },
    accents: classification.accents.map((accent) => ({
      family: accent.family,
      category: accent.category,
    })),
    pattern: classification.pattern,
    composition: classification.composition,
  });
}

function buildClassificationVariations(
  occurrences: ClassifiedOccurrence[],
): ClassificationVariation[] {
  const variations = new Map<string, ClassificationVariation>();

  for (const occurrence of occurrences) {
    const key = classificationKey(occurrence.classification);
    const existing = variations.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      variations.set(key, {
        count: 1,
        classification: occurrence.classification,
      });
    }
  }

  return [...variations.values()].sort(
    (first, second) =>
      second.count - first.count ||
      second.classification.confidence - first.classification.confidence ||
      first.classification.primary.category.localeCompare(
        second.classification.primary.category,
      ),
  );
}

function summarizeClassifications(
  occurrences: ClassifiedOccurrence[],
): ClassifiedColorSummary[] {
  const groups = new Map<string, ClassifiedOccurrence[]>();

  for (const occurrence of occurrences) {
    const existing = groups.get(occurrence.normalizedProviderColor) ?? [];
    existing.push(occurrence);
    groups.set(occurrence.normalizedProviderColor, existing);
  }

  const summaries: ClassifiedColorSummary[] = [];

  for (const [normalizedProviderColor, colorOccurrences] of groups) {
    const providerColors = [
      ...new Set(colorOccurrences.map((item) => item.providerColor)),
    ].sort((a, b) => a.localeCompare(b));

    const variations = buildClassificationVariations(colorOccurrences);
    const representativeClassification = variations[0]?.classification;

    if (!representativeClassification) {
      throw new Error(
        `No classification was produced for ${normalizedProviderColor}.`,
      );
    }

    const classificationIsConsistent = variations.length === 1;

    const reviewReasons = [
      ...new Set(
        colorOccurrences.flatMap(
          (item) => item.classification.reviewReasons,
        ),
      ),
    ];

    if (!classificationIsConsistent) {
      reviewReasons.push("inconsistent-classification");
    }

    summaries.push({
      providerColor: providerColors[0],
      normalizedProviderColor,
      displayColors: [
        ...new Set(colorOccurrences.map((item) => item.color)),
      ].sort((a, b) => a.localeCompare(b)),
      colorKeys: [
        ...new Set(colorOccurrences.map((item) => item.colorKey)),
      ].sort((a, b) => a.localeCompare(b)),
      productCount: new Set(
        colorOccurrences.map((item) => item.providerProductId),
      ).size,
      occurrenceCount: colorOccurrences.length,
      suppliedHexValues: [
        ...new Set(
          colorOccurrences.flatMap((item) =>
            item.colorHexValue ? [item.colorHexValue] : [],
          ),
        ),
      ].sort((a, b) => a.localeCompare(b)),
      swatchCount: colorOccurrences.filter((item) => item.swatchImageUrl).length,
      representativeClassification,
      classificationVariations: variations,
      classificationIsConsistent,
      needsReview:
        !classificationIsConsistent ||
        colorOccurrences.some((item) => item.classification.needsReview),
      reviewReasons: [...new Set(reviewReasons)].sort((a, b) =>
        a.localeCompare(b),
      ),
      exampleProducts: colorOccurrences
        .sort(
          (first, second) =>
            first.productName.localeCompare(second.productName) ||
            first.providerProductId.localeCompare(second.providerProductId),
        )
        .slice(0, 10)
        .map((item) => ({
          providerProductId: item.providerProductId,
          productName: item.productName,
          color: item.color,
          colorKey: item.colorKey,
          colorHexValue: item.colorHexValue,
          swatchImageUrl: item.swatchImageUrl,
        })),
    });
  }

  return summaries.sort(
    (first, second) =>
      second.productCount - first.productCount ||
      first.providerColor.localeCompare(second.providerColor),
  );
}

function countValues(values: string[]): Record<string, number> {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Object.fromEntries(
    [...counts.entries()].sort(
      ([firstValue, firstCount], [secondValue, secondCount]) =>
        secondCount - firstCount || firstValue.localeCompare(secondValue),
    ),
  );
}

function escapeCsvValue(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");
}

async function writeOutputs(
  options: CliOptions,
  products: SelectedProduct[],
  occurrences: ClassifiedOccurrence[],
  summaries: ClassifiedColorSummary[],
): Promise<void> {
  await mkdir(options.outputDir, { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    source: {
      inputPath: options.inputPath,
      productCount: products.length,
      productColorOccurrences: occurrences.length,
      uniqueNormalizedSupplierColors: summaries.length,
    },
    results: {
      classifiedWithoutReview: summaries.filter((color) => !color.needsReview)
        .length,
      needsReview: summaries.filter((color) => color.needsReview).length,
      inconsistentClassifications: summaries.filter(
        (color) => !color.classificationIsConsistent,
      ).length,
      unknownPrimaryCategories: summaries.filter(
        (color) =>
          color.representativeClassification.primary.category === "unknown",
      ).length,
    },
    primaryCategoryCounts: countValues(
      summaries.map(
        (color) => color.representativeClassification.primary.category,
      ),
    ),
    sourceCounts: countValues(
      summaries.map((color) => color.representativeClassification.source),
    ),
    patternCounts: countValues(
      summaries.map((color) => color.representativeClassification.pattern),
    ),
    compositionCounts: countValues(
      summaries.map((color) => color.representativeClassification.composition),
    ),
  };

  const csvRows = summaries.map((color) => {
    const classification = color.representativeClassification;

    return [
      color.providerColor,
      color.normalizedProviderColor,
      color.displayColors.join(" | "),
      color.colorKeys.join(" | "),
      color.productCount,
      color.occurrenceCount,
      color.suppliedHexValues.join(" | "),
      color.swatchCount,
      classification.primary.family,
      classification.primary.category,
      classification.primary.hexValue ?? "",
      classification.accents.map((accent) => accent.family).join(" | "),
      classification.accents.map((accent) => accent.category).join(" | "),
      classification.accents
        .map((accent) => accent.hexValue ?? "")
        .join(" | "),
      classification.tone,
      classification.pattern,
      classification.composition,
      classification.source,
      classification.confidence,
      color.classificationIsConsistent,
      color.classificationVariations.length,
      color.needsReview,
      color.reviewReasons.join(" | "),
      color.exampleProducts
        .map(
          (product) =>
            `${product.productName} (${product.providerProductId})`,
        )
        .join(" | "),
    ];
  });

  await Promise.all([
    writeFile(
      path.join(options.outputDir, "classified-colors.json"),
      `${JSON.stringify({ ...summary, colors: summaries }, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(options.outputDir, "classified-colors.csv"),
      `${toCsv(
        [
          "providerColor",
          "normalizedProviderColor",
          "displayColors",
          "colorKeys",
          "productCount",
          "occurrenceCount",
          "suppliedHexValues",
          "swatchCount",
          "primaryFamily",
          "primaryCategory",
          "primaryHexValue",
          "accentFamilies",
          "accentCategories",
          "accentHexValues",
          "tone",
          "pattern",
          "composition",
          "source",
          "confidence",
          "classificationIsConsistent",
          "classificationVariationCount",
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

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  console.log(`Reading selected products: ${options.inputPath}`);

  const inputText = await readFile(options.inputPath, "utf8");
  const products = parseSelectedProducts(JSON.parse(inputText) as unknown);

  console.log(`Loaded ${products.length.toLocaleString()} selected products.`);

  const occurrences = classifyOccurrences(products);
  const summaries = summarizeClassifications(occurrences);

  await writeOutputs(options, products, occurrences, summaries);

  const needsReviewCount = summaries.filter((color) => color.needsReview).length;
  const unknownCount = summaries.filter(
    (color) =>
      color.representativeClassification.primary.category === "unknown",
  ).length;

  console.log(
    `Classified ${summaries.length.toLocaleString()} unique supplier colors.`,
  );
  console.log(`${needsReviewCount.toLocaleString()} colors still need review.`);
  console.log(
    `${unknownCount.toLocaleString()} colors have an unknown primary category.`,
  );
  console.log(`Output directory: ${options.outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});