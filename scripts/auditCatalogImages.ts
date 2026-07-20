import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

/**
 * Audits supplier image families and selects a balanced 60-product demo catalog.
 *
 * Run from the project root:
 *
 *   npx tsx scripts/auditCatalogImages.ts \
 *     --csv ./product-data-std-all.csv \
 *     --output ./scripts/output/catalog-audit
 *
 * Generated files:
 *
 *   selected-products.json
 *   verified-images.csv
 *   rejected-products.csv
 *   catalog-image-audit.json
 *   image-url-cache.json
 */

type ProductImageView =
  | "leftQuarter"
  | "front"
  | "back"
  | "left"
  | "right"
  | "detail"
  | "other";

type ProductAudience = "adult" | "youth" | "women" | "accessories";

type ImageSource = "csv-main" | "verified-derived";

type CsvRow = Record<string, string>;

interface CliOptions {
  csvPath: string;
  outputDir: string;
  selectedProductCount: number;
  colorsToAuditPerProduct: number;
  selectedColorsPerProduct: number;
  minimumQualifyingColors: number;
  candidatesPerBucket: number;
  requestConcurrency: number;
  requestTimeoutMs: number;
}

interface VariantRecord {
  providerVariantId: string;
  sku: string;
  upc: string;
  color: string;
  providerColor: string;
  size: string;
  baseCostInCents: number;
  directPriceInCents: number;
  currency: string;
  weight: number | null;
  weightUnit: string | null;
}

interface ColorAggregate {
  color: string;
  colorKey: string;
  mainImageUrl: string;
  swatchImageUrl: string | null;
  colorHexValue: string | null;
  variantRows: CsvRow[];
  imageStems: string[];
}

interface ProductAggregate {
  providerProductId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  categoryBucket: string;
  audience: ProductAudience;
  brand: string | null;
  division: string | null;
  sizeChartImageUrl: string | null;
  productVideoUrl: string | null;
  colors: ColorAggregate[];
  variants: VariantRecord[];
  activeVariantCount: number;
  metadataComplete: boolean;
}

interface VerifiedImage {
  color: string;
  providerColor: string;
  colorKey: string;
  view: ProductImageView;
  providerView: string;
  sortOrder: number;
  externalImageUrl: string;
  altText: string;
  source: ImageSource;
}

interface AuditedColor {
  color: string;
  providerColor: string;
  colorKey: string;
  colorHexValue: string | null;
  swatchImageUrl: string | null;
  images: VerifiedImage[];
  qualifies: boolean;
  score: number;
  missingRequiredViews: string[];
}

interface AuditedProduct {
  product: ProductAggregate;
  auditedColors: AuditedColor[];
  qualifyingColors: AuditedColor[];
  score: number;
  qualifies: boolean;
  rejectionReason: string | null;
}

interface UrlAuditResult {
  exists: boolean;
  status: number | null;
  contentType: string | null;
  finalUrl: string | null;
  checkedAt: string;
  error?: string;
}

interface SelectedProductOutput {
  providerProductId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  categoryBucket: string;
  brand: string | null;
  division: string | null;
  sizeChartImageUrl: string | null;
  productVideoUrl: string | null;
  images: VerifiedImage[];
  colors: Array<{
    color: string;
    providerColor: string;
    colorKey: string;
    colorHexValue: string | null;
    swatchImageUrl: string | null;
  }>;
  variants: VariantRecord[];
}

interface ViewCandidateSpec {
  view: Exclude<ProductImageView, "leftQuarter">;
  providerSuffixes: string[];
  sortOrder: number;
}

const ACTIVE_STATUS = "20";

const IMAGE_VIEW_SORT_ORDER: Record<ProductImageView, number> = {
  leftQuarter: 0,
  front: 1,
  back: 2,
  left: 3,
  right: 4,
  detail: 5,
  other: 6,
};

const VIEW_CANDIDATES: ViewCandidateSpec[] = [
  {
    view: "front",
    providerSuffixes: ["front"],
    sortOrder: IMAGE_VIEW_SORT_ORDER.front,
  },
  {
    view: "back",
    providerSuffixes: ["back"],
    sortOrder: IMAGE_VIEW_SORT_ORDER.back,
  },
  {
    view: "left",
    providerSuffixes: ["lside"],
    sortOrder: IMAGE_VIEW_SORT_ORDER.left,
  },
  {
    view: "right",
    providerSuffixes: ["rside"],
    sortOrder: IMAGE_VIEW_SORT_ORDER.right,
  },
  {
    view: "detail",
    providerSuffixes: ["detail", "detail1", "closeup"],
    sortOrder: IMAGE_VIEW_SORT_ORDER.detail,
  },
  {
    view: "other",
    providerSuffixes: ["rquarter"],
    sortOrder: IMAGE_VIEW_SORT_ORDER.other,
  },
];

const CATEGORY_BUCKET_ORDER = [
  "T-Shirts",
  "Hoodies & Fleece",
  "Polos",
  "Quarter-Zips",
  "Jerseys",
  "Shorts",
  "Pants & Joggers",
  "Jackets",
  "Hats",
  "Bags",
  "Other",
] as const;

const TEAM_COLOR_PRIORITY = [
  "black",
  "navy",
  "royal",
  "red",
  "scarlet",
  "white",
  "graphite",
  "gray",
  "grey",
  "maroon",
  "purple",
  "gold",
  "orange",
  "green",
  "forest",
  "teal",
  "pink",
];

const LICENSED_PRODUCT_TERMS = [
  "NBA",
  "NFL",
  "MLB",
  "NHL",
  "NCAA",
  "LOGO'D",
  "CHICAGO BULLS",
  "MIAMI HEAT",
  "MEMPHIS GRIZZLIES",
  "DENVER NUGGETS",
  "INDIANA PACERS",
  "NEW ORLEANS PELICANS",
  "NEW YORK KNICKS",
  "DETROIT PISTONS",
];

const DEFAULT_OPTIONS: CliOptions = {
  csvPath: path.resolve(process.cwd(), "product-data-std-all.csv"),
  outputDir: path.resolve(process.cwd(), "scripts/output/catalog-audit"),
  selectedProductCount: 60,
  colorsToAuditPerProduct: 8,
  selectedColorsPerProduct: 6,
  minimumQualifyingColors: 4,
  candidatesPerBucket: 15,
  requestConcurrency: 8,
  requestTimeoutMs: 10_000,
};

function parsePositiveInteger(value: string | undefined, label: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsed;
}

function parseArgs(argv: string[]): CliOptions {
  const options = { ...DEFAULT_OPTIONS };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const nextValue = argv[index + 1];

    switch (argument) {
      case "--csv":
        if (!nextValue) {
          throw new Error("--csv requires a file path.");
        }
        options.csvPath = path.resolve(process.cwd(), nextValue);
        index += 1;
        break;

      case "--output":
        if (!nextValue) {
          throw new Error("--output requires a directory path.");
        }
        options.outputDir = path.resolve(process.cwd(), nextValue);
        index += 1;
        break;

      case "--products":
        options.selectedProductCount = parsePositiveInteger(
          nextValue,
          "--products",
        );
        index += 1;
        break;

      case "--audit-colors":
        options.colorsToAuditPerProduct = parsePositiveInteger(
          nextValue,
          "--audit-colors",
        );
        index += 1;
        break;

      case "--selected-colors":
        options.selectedColorsPerProduct = parsePositiveInteger(
          nextValue,
          "--selected-colors",
        );
        index += 1;
        break;

      case "--minimum-colors":
        options.minimumQualifyingColors = parsePositiveInteger(
          nextValue,
          "--minimum-colors",
        );
        index += 1;
        break;

      case "--candidates-per-bucket":
        options.candidatesPerBucket = parsePositiveInteger(
          nextValue,
          "--candidates-per-bucket",
        );
        index += 1;
        break;

      case "--concurrency":
        options.requestConcurrency = parsePositiveInteger(
          nextValue,
          "--concurrency",
        );
        index += 1;
        break;

      case "--timeout-ms":
        options.requestTimeoutMs = parsePositiveInteger(
          nextValue,
          "--timeout-ms",
        );
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

  if (options.selectedColorsPerProduct < options.minimumQualifyingColors) {
    throw new Error("--selected-colors cannot be lower than --minimum-colors.");
  }

  if (options.colorsToAuditPerProduct < options.selectedColorsPerProduct) {
    throw new Error("--audit-colors cannot be lower than --selected-colors.");
  }

  return options;
}

function printHelp() {
  console.log(`
Catalog image audit

Usage:
  npx tsx scripts/auditCatalogImages.ts [options]

Options:
  --csv <path>                    Supplier CSV path
  --output <directory>            Output directory
  --products <count>              Number of products to select (default: 60)
  --audit-colors <count>          Colors audited per candidate product (default: 8)
  --selected-colors <count>       Maximum selected colors per product (default: 6)
  --minimum-colors <count>        Minimum qualifying colors per product (default: 4)
  --candidates-per-bucket <count> Candidate products audited per category bucket (default: 15)
  --concurrency <count>           Maximum simultaneous HTTP requests (default: 8)
  --timeout-ms <milliseconds>     Per-request timeout (default: 10000)
  --help                          Show this help message
`);
}

function normalizeText(value: string | undefined) {
  return value?.trim() ?? "";
}

function isLicensedProduct(product: ProductAggregate) {
  const searchableText = [
    product.name,
    product.description,
    product.category,
    ...product.colors.map((color) => color.color),
  ]
    .join(" ")
    .toUpperCase();

  return LICENSED_PRODUCT_TERMS.some((term) => searchableText.includes(term));
}

function normalizeColorKey(value: string) {
  return value.trim().toLowerCase();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseMoneyToCents(value: string, label: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid non-negative amount: ${value}`);
  }

  return Math.round(parsed * 100);
}

function parseOptionalNumber(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += character;
      }

      continue;
    }

    if (character === '"') {
      inQuotes = true;
      continue;
    }

    if (character === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += character;
  }

  if (inQuotes) {
    throw new Error("CSV ended while a quoted field was still open.");
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  return rows;
}

function mapCsvRows(text: string): CsvRow[] {
  const parsedRows = parseCsv(text);

  if (parsedRows.length < 2) {
    throw new Error("CSV does not contain a header and data rows.");
  }

  const headers = parsedRows[0].map((header, index) =>
    index === 0 ? header.replace(/^\uFEFF/, "") : header,
  );

  const requiredHeaders = [
    "Parent_SKU",
    "Item_SKU",
    "UPC_Code",
    "Item_Name",
    "Item_Description",
    "Category",
    "MSRP",
    "Cost",
    "Currency",
    "Main_Image_URL",
    "Swatch_Image_URL",
    "Size_Chart_Image_URL",
    "Color",
    "Size",
    "Weight",
    "Weight_Unit",
    "Color_Hex_Value",
    "Status",
    "ProductVideoUrl",
  ];

  const missingHeaders = requiredHeaders.filter(
    (header) => !headers.includes(header),
  );

  if (missingHeaders.length > 0) {
    throw new Error(
      `CSV is missing required columns: ${missingHeaders.join(", ")}`,
    );
  }

  return parsedRows.slice(1).flatMap((values) => {
    if (values.every((value) => value.trim() === "")) {
      return [];
    }

    const row: CsvRow = {};

    for (let index = 0; index < headers.length; index += 1) {
      row[headers[index]] = values[index] ?? "";
    }

    return [row];
  });
}

function getCategoryBucket(name: string, category: string) {
  const searchable = `${name} ${category}`.toLowerCase();

  if (/\b(backpack|duffel|bag)\b/.test(searchable)) {
    return "Bags";
  }

  if (/\b(cap|hat|beanie|visor)\b/.test(searchable)) {
    return "Hats";
  }

  if (/\b(short|shorts)\b/.test(searchable)) {
    return "Shorts";
  }

  if (/\b(jogger|pant|pants|sweatpant)\b/.test(searchable)) {
    return "Pants & Joggers";
  }

  if (/\b(jersey|uniform)\b/.test(searchable)) {
    return "Jerseys";
  }

  if (/\b(polo)\b/.test(searchable)) {
    return "Polos";
  }

  if (/\b(quarter[- ]?zip|1\/4[- ]?zip|half[- ]?zip)\b/.test(searchable)) {
    return "Quarter-Zips";
  }

  if (/\b(hoodie|hooded|fleece|crewneck|sweatshirt)\b/.test(searchable)) {
    return "Hoodies & Fleece";
  }

  if (/\b(jacket|parka|windbreaker|shell)\b/.test(searchable)) {
    return "Jackets";
  }

  if (/\b(tee|t-shirt|t shirt|shirt)\b/.test(searchable)) {
    return "T-Shirts";
  }

  return "Other";
}

function getProductAudience(
  name: string,
  category: string,
  categoryBucket: string,
): ProductAudience {
  const searchable = `${name} ${category}`.toLowerCase();

  if (categoryBucket === "Hats" || categoryBucket === "Bags") {
    return "accessories";
  }

  if (/\b(youth|boys?|girls?|junior|child|kids?)\b/.test(searchable)) {
    return "youth";
  }

  if (/\b(ladies|lady|women|womens|women's|female)\b/.test(searchable)) {
    return "women";
  }

  return "adult";
}

function getTeamColorPriority(color: string) {
  const normalized = normalizeColorKey(color);

  for (let index = 0; index < TEAM_COLOR_PRIORITY.length; index += 1) {
    if (normalized.includes(TEAM_COLOR_PRIORITY[index])) {
      return index;
    }
  }

  return TEAM_COLOR_PRIORITY.length;
}

function getUrlFilename(url: string) {
  try {
    return path.posix.basename(new URL(url).pathname);
  } catch {
    return "";
  }
}

function stripImageExtension(filename: string) {
  return filename.replace(/\.[a-z0-9]+$/i, "");
}

function stripKnownViewSuffix(filenameStem: string) {
  return filenameStem.replace(
    /_(?:lquarter|rquarter|quarter|front|back|lside|rside|detail\d*|closeup)$/i,
    "",
  );
}

function getImageStems(row: CsvRow) {
  const stems = new Set<string>();
  const mainImageUrl = normalizeText(row.Main_Image_URL);
  const mainFilename = getUrlFilename(mainImageUrl);

  if (mainFilename) {
    stems.add(stripKnownViewSuffix(stripImageExtension(mainFilename)));
  }

  const skuParts = normalizeText(row.Item_SKU).split(".");

  if (skuParts.length >= 2 && skuParts[0] && skuParts[1]) {
    stems.add(`${skuParts[0]}_${skuParts[1]}`);
  }

  return [...stems].filter(Boolean);
}

function isLeftQuarterMainImage(url: string) {
  return /_lquarter\.jpg(?:$|\?)/i.test(url);
}

function choosePreferredMainImage(rows: CsvRow[]) {
  const imageCandidates = [
    ...new Set(
      rows.map((row) => normalizeText(row.Main_Image_URL)).filter(Boolean),
    ),
  ];

  return (
    imageCandidates.find(isLeftQuarterMainImage) ?? imageCandidates[0] ?? ""
  );
}

function chooseFirstNonEmpty(rows: CsvRow[], field: string) {
  for (const row of rows) {
    const value = normalizeText(row[field]);

    if (value) {
      return value;
    }
  }

  return "";
}

function aggregateProducts(rows: CsvRow[]): ProductAggregate[] {
  const activeRows = rows.filter(
    (row) => normalizeText(row.Status) === ACTIVE_STATUS,
  );

  const rowsByProduct = new Map<string, CsvRow[]>();

  for (const row of activeRows) {
    const productId = normalizeText(row.Parent_SKU);

    if (!productId) {
      continue;
    }

    const existingRows = rowsByProduct.get(productId) ?? [];
    existingRows.push(row);
    rowsByProduct.set(productId, existingRows);
  }

  const products: ProductAggregate[] = [];

  for (const [providerProductId, productRows] of rowsByProduct.entries()) {
    const name = chooseFirstNonEmpty(productRows, "Item_Name");
    const description = chooseFirstNonEmpty(productRows, "Item_Description");
    const category = chooseFirstNonEmpty(productRows, "Category");
    const brand = chooseFirstNonEmpty(productRows, "Brand") || null;
    const division = chooseFirstNonEmpty(productRows, "Division") || null;
    const sizeChartImageUrl =
      chooseFirstNonEmpty(productRows, "Size_Chart_Image_URL") || null;
    const productVideoUrl =
      chooseFirstNonEmpty(productRows, "ProductVideoUrl") || null;

    const rowsByColor = new Map<string, CsvRow[]>();

    for (const row of productRows) {
      const color = normalizeText(row.Color);

      if (!color) {
        continue;
      }

      const colorKey = normalizeColorKey(color);
      const existingRows = rowsByColor.get(colorKey) ?? [];
      existingRows.push(row);
      rowsByColor.set(colorKey, existingRows);
    }

    const colors: ColorAggregate[] = [];

    for (const colorRows of rowsByColor.values()) {
      const color = normalizeText(colorRows[0]?.Color);
      const mainImageUrl = choosePreferredMainImage(colorRows);
      const swatchImageUrl =
        chooseFirstNonEmpty(colorRows, "Swatch_Image_URL") || null;
      const colorHexValue =
        chooseFirstNonEmpty(colorRows, "Color_Hex_Value") || null;

      const imageStems = [
        ...new Set(colorRows.flatMap((row) => getImageStems(row))),
      ];

      colors.push({
        color,
        colorKey: normalizeColorKey(color),
        mainImageUrl,
        swatchImageUrl,
        colorHexValue,
        variantRows: colorRows,
        imageStems,
      });
    }

    const variants = productRows.flatMap((row) => {
      const sku = normalizeText(row.Item_SKU);
      const color = normalizeText(row.Color);
      const size = normalizeText(row.Size);
      const currency = normalizeText(row.Currency) || "USD";

      if (!sku || !color || !size) {
        return [];
      }

      try {
        return [
          {
            providerVariantId: sku,
            sku,
            upc: normalizeText(row.UPC_Code),
            color: normalizeDisplayColor(color),
            providerColor: color,
            size,
            baseCostInCents: parseMoneyToCents(row.Cost, `Cost for ${sku}`),
            directPriceInCents: parseMoneyToCents(row.MSRP, `MSRP for ${sku}`),
            currency,
            weight: parseOptionalNumber(row.Weight),
            weightUnit: normalizeText(row.Weight_Unit) || null,
          },
        ];
      } catch {
        return [];
      }
    });

    const metadataComplete = Boolean(
      providerProductId &&
      name &&
      description &&
      category &&
      variants.length === productRows.length,
    );

    const categoryBucket = getCategoryBucket(name, category);

    products.push({
      providerProductId,
      name,
      slug: slugify(`${name}-${providerProductId}`),
      description,
      category,
      categoryBucket,
      audience: getProductAudience(name, category, categoryBucket),
      brand,
      division,
      sizeChartImageUrl,
      productVideoUrl,
      colors,
      variants,
      activeVariantCount: variants.length,
      metadataComplete,
    });
  }

  return products;
}

function getPreliminaryProductScore(product: ProductAggregate) {
  const leftQuarterColorCount = product.colors.filter((color) =>
    isLeftQuarterMainImage(color.mainImageUrl),
  ).length;

  return (
    Math.min(leftQuarterColorCount, 12) * 100 +
    Math.min(product.activeVariantCount, 200) +
    (product.metadataComplete ? 50 : 0)
  );
}

function buildCandidatePool(products: ProductAggregate[], options: CliOptions) {
  const eligibleProducts = products.filter((product) => {
    const leftQuarterColors = product.colors.filter((color) =>
      isLeftQuarterMainImage(color.mainImageUrl),
    );

    return (
      product.metadataComplete &&
      !isLicensedProduct(product) &&
      leftQuarterColors.length >= options.minimumQualifyingColors
    );
  });

  const productsByBucket = new Map<string, ProductAggregate[]>();

  for (const product of eligibleProducts) {
    const bucketProducts = productsByBucket.get(product.categoryBucket) ?? [];
    bucketProducts.push(product);
    productsByBucket.set(product.categoryBucket, bucketProducts);
  }

  const selectedCandidates: ProductAggregate[] = [];

  for (const bucket of CATEGORY_BUCKET_ORDER) {
    const bucketProducts = productsByBucket.get(bucket) ?? [];

    bucketProducts.sort(
      (first, second) =>
        getPreliminaryProductScore(second) -
          getPreliminaryProductScore(first) ||
        first.name.localeCompare(second.name),
    );

    selectedCandidates.push(
      ...bucketProducts.slice(0, options.candidatesPerBucket),
    );
  }

  return selectedCandidates;
}

function selectColorsToAudit(product: ProductAggregate, options: CliOptions) {
  return product.colors
    .filter((color) => isLeftQuarterMainImage(color.mainImageUrl))
    .sort(
      (first, second) =>
        getTeamColorPriority(first.color) -
          getTeamColorPriority(second.color) ||
        second.variantRows.length - first.variantRows.length ||
        first.color.localeCompare(second.color),
    )
    .slice(0, options.colorsToAuditPerProduct);
}

class Semaphore {
  private activeCount = 0;
  private readonly waiting: Array<() => void> = [];

  private readonly limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }
  async run<T>(task: () => Promise<T>) {
    await this.acquire();

    try {
      return await task();
    } finally {
      this.release();
    }
  }

  private async acquire() {
    if (this.activeCount < this.limit) {
      this.activeCount += 1;
      return;
    }

    await new Promise<void>((resolve) => {
      this.waiting.push(resolve);
    });

    this.activeCount += 1;
  }

  private release() {
    this.activeCount -= 1;
    const next = this.waiting.shift();

    if (next) {
      next();
    }
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "TeamStoreCatalogImageAudit/1.0",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        ...init.headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function responseLooksLikeImage(response: Response) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  return response.ok && contentType.startsWith("image/");
}

async function verifyRemoteImage(
  url: string,
  timeoutMs: number,
): Promise<UrlAuditResult> {
  const checkedAt = new Date().toISOString();

  try {
    const headResponse = await fetchWithTimeout(
      url,
      { method: "HEAD" },
      timeoutMs,
    );

    if (responseLooksLikeImage(headResponse)) {
      return {
        exists: true,
        status: headResponse.status,
        contentType: headResponse.headers.get("content-type"),
        finalUrl: headResponse.url || url,
        checkedAt,
      };
    }

    const getResponse = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          Range: "bytes=0-1023",
        },
      },
      timeoutMs,
    );

    const exists = responseLooksLikeImage(getResponse);
    const result: UrlAuditResult = {
      exists,
      status: getResponse.status,
      contentType: getResponse.headers.get("content-type"),
      finalUrl: getResponse.url || url,
      checkedAt,
    };

    await getResponse.body?.cancel().catch(() => undefined);

    return result;
  } catch (error) {
    return {
      exists: false,
      status: null,
      contentType: null,
      finalUrl: null,
      checkedAt,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function loadUrlCache(cachePath: string) {
  try {
    const contents = await readFile(cachePath, "utf8");
    return new Map<string, UrlAuditResult>(
      Object.entries(JSON.parse(contents) as Record<string, UrlAuditResult>),
    );
  } catch {
    return new Map<string, UrlAuditResult>();
  }
}

async function saveUrlCache(
  cachePath: string,
  cache: Map<string, UrlAuditResult>,
) {
  const sortedEntries = [...cache.entries()].sort(([first], [second]) =>
    first.localeCompare(second),
  );

  await writeFile(
    cachePath,
    `${JSON.stringify(Object.fromEntries(sortedEntries), null, 2)}\n`,
    "utf8",
  );
}

function buildSiblingUrl(mainImageUrl: string, stem: string, suffix: string) {
  try {
    const url = new URL(mainImageUrl);
    const directory = url.pathname.slice(0, url.pathname.lastIndexOf("/") + 1);
    url.pathname = `${directory}${stem}_${suffix}.jpg`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function buildCandidateUrls(color: ColorAggregate, providerSuffix: string) {
  const urls = new Set<string>();

  for (const stem of color.imageStems) {
    const siblingUrl = buildSiblingUrl(
      color.mainImageUrl,
      stem,
      providerSuffix,
    );

    if (siblingUrl) {
      urls.add(siblingUrl);
    }

    urls.add(
      `https://static.momentecbrands.com/product_original_images/${stem}_${providerSuffix}.jpg`,
    );

    urls.add(
      `https://static.augustasportswear.com/product/${stem}_${providerSuffix}.jpg`,
    );
  }

  return [...urls];
}

function createUrlVerifier(
  cache: Map<string, UrlAuditResult>,
  semaphore: Semaphore,
  timeoutMs: number,
) {
  return async function verifyUrl(url: string) {
    const cachedResult = cache.get(url);

    if (cachedResult) {
      return cachedResult;
    }

    const result = await semaphore.run(() => verifyRemoteImage(url, timeoutMs));

    cache.set(url, result);
    return result;
  };
}

async function findFirstVerifiedUrl(
  urls: string[],
  verifyUrl: (url: string) => Promise<UrlAuditResult>,
) {
  for (const url of urls) {
    const result = await verifyUrl(url);

    if (result.exists) {
      return result.finalUrl ?? url;
    }
  }

  return null;
}

function formatViewLabel(view: ProductImageView) {
  const labels: Record<ProductImageView, string> = {
    leftQuarter: "left-quarter",
    front: "front",
    back: "back",
    left: "left-side",
    right: "right-side",
    detail: "detail",
    other: "alternate",
  };

  return labels[view];
}

async function auditColor(
  product: ProductAggregate,
  color: ColorAggregate,
  verifyUrl: (url: string) => Promise<UrlAuditResult>,
): Promise<AuditedColor> {
  const displayColor = normalizeDisplayColor(color.color);
  const images: VerifiedImage[] = [
    {
      color: displayColor,
      providerColor: color.color,
      colorKey: color.colorKey,
      view: "leftQuarter",
      providerView: "lquarter",
      sortOrder: IMAGE_VIEW_SORT_ORDER.leftQuarter,
      externalImageUrl: color.mainImageUrl,
      altText: `${product.name} in ${color.color} — left-quarter view`,
      source: "csv-main",
    },
  ];

  const auditedViews = await Promise.all(
    VIEW_CANDIDATES.map(async (spec) => {
      for (const providerSuffix of spec.providerSuffixes) {
        const verifiedUrl = await findFirstVerifiedUrl(
          buildCandidateUrls(color, providerSuffix),
          verifyUrl,
        );

        const displayColor = normalizeDisplayColor(color.color);

        if (verifiedUrl) {
          return {
            color: displayColor,
            providerColor: color.color,
            colorKey: color.colorKey,
            view: spec.view,
            providerView: providerSuffix,
            sortOrder: spec.sortOrder,
            externalImageUrl: verifiedUrl,
            altText: `${product.name} in ${color.color} — ${formatViewLabel(
              spec.view,
            )} view`,
            source: "verified-derived" as const,
          } satisfies VerifiedImage;
        }
      }

      return null;
    }),
  );

  for (const image of auditedViews) {
    if (image) {
      images.push(image);
    }
  }

  images.sort(
    (first, second) =>
      first.sortOrder - second.sortOrder ||
      first.providerView.localeCompare(second.providerView),
  );

  const views = new Set(images.map((image) => image.view));

  const requiredViews: ProductImageView[] = [
    "leftQuarter",
    "front",
    "back",
    "left",
    "right",
  ];

  const missingRequiredViews = requiredViews.filter((view) => !views.has(view));

  const qualifies = missingRequiredViews.length === 0;

  const viewWeights: Record<ProductImageView, number> = {
    leftQuarter: 10,
    front: 10,
    back: 7,
    left: 6,
    right: 5,
    detail: 4,
    other: 3,
  };

  const score = images.reduce(
    (total, image) => total + viewWeights[image.view],
    0,
  );

  return {
    color: color.color,
    providerColor: color.color,
    colorKey: color.colorKey,
    colorHexValue: color.colorHexValue,
    swatchImageUrl: color.swatchImageUrl,
    images,
    qualifies,
    score,
    missingRequiredViews,
  };
}

function normalizeDisplayColor(providerColor: string) {
  return providerColor
    .replace(/^BA\s+/i, "")
    .replace(/\bBT\.\s*/gi, "")
    .replace(/\s*\/\s*/g, "/")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

async function auditProduct(
  product: ProductAggregate,
  options: CliOptions,
  verifyUrl: (url: string) => Promise<UrlAuditResult>,
): Promise<AuditedProduct> {
  const colorsToAudit = selectColorsToAudit(product, options);
  const auditedColors = await Promise.all(
    colorsToAudit.map((color) => auditColor(product, color, verifyUrl)),
  );

  const qualifyingColors = auditedColors
    .filter((color) => color.qualifies)
    .sort(
      (first, second) =>
        second.score - first.score ||
        getTeamColorPriority(first.color) -
          getTeamColorPriority(second.color) ||
        first.color.localeCompare(second.color),
    );

  const selectedQualifyingColors = qualifyingColors.slice(
    0,
    options.selectedColorsPerProduct,
  );

  const qualifies =
    selectedQualifyingColors.length >= options.minimumQualifyingColors;

  const score =
    selectedQualifyingColors.length * 1_000 +
    selectedQualifyingColors.reduce((total, color) => total + color.score, 0) +
    Math.min(product.activeVariantCount, 300);

  return {
    product,
    auditedColors,
    qualifyingColors: selectedQualifyingColors,
    score,
    qualifies,
    rejectionReason: qualifies
      ? null
      : `Only ${selectedQualifyingColors.length} colors met the image requirement; ${options.minimumQualifyingColors} required.`,
  };
}

function selectBalancedProducts(
  auditedProducts: AuditedProduct[],
  targetCount: number,
) {
  const qualified = auditedProducts
    .filter((product) => product.qualifies)
    .sort(
      (first, second) =>
        second.score - first.score ||
        first.product.name.localeCompare(second.product.name),
    );

  const audienceTargets: Record<ProductAudience, number> = {
    adult: Math.round(targetCount * 0.45),
    youth: Math.round(targetCount * 0.2),
    women: Math.round(targetCount * 0.2),
    accessories: Math.round(targetCount * 0.15),
  };

  const totalAssigned = Object.values(audienceTargets).reduce(
    (total, count) => total + count,
    0,
  );

  audienceTargets.adult += targetCount - totalAssigned;

  const selected: AuditedProduct[] = [];
  const selectedIds = new Set<string>();

  const addProduct = (product: AuditedProduct) => {
    if (selectedIds.has(product.product.providerProductId)) {
      return false;
    }

    selected.push(product);
    selectedIds.add(product.product.providerProductId);
    return true;
  };

  for (const audience of Object.keys(audienceTargets) as ProductAudience[]) {
    const audienceProducts = qualified.filter(
      (product) => product.product.audience === audience,
    );

    const selectedPerCategory = new Map<string, number>();

    for (const product of audienceProducts) {
      if (
        selected.filter(
          (selectedProduct) => selectedProduct.product.audience === audience,
        ).length >= audienceTargets[audience]
      ) {
        break;
      }

      const category = product.product.categoryBucket;
      const categoryCount = selectedPerCategory.get(category) ?? 0;

      if (categoryCount >= 3) {
        continue;
      }

      if (addProduct(product)) {
        selectedPerCategory.set(category, categoryCount + 1);
      }
    }

    for (const product of audienceProducts) {
      if (
        selected.filter(
          (selectedProduct) => selectedProduct.product.audience === audience,
        ).length >= audienceTargets[audience]
      ) {
        break;
      }

      addProduct(product);
    }
  }

  for (const product of qualified) {
    if (selected.length >= targetCount) {
      break;
    }

    addProduct(product);
  }

  return selected.slice(0, targetCount);
}
function buildSelectedProductOutput(
  auditedProduct: AuditedProduct,
): SelectedProductOutput {
  const selectedColorKeys = new Set(
    auditedProduct.qualifyingColors.map((color) => color.colorKey),
  );

  return {
    providerProductId: auditedProduct.product.providerProductId,
    name: auditedProduct.product.name,
    slug: auditedProduct.product.slug,
    description: auditedProduct.product.description,
    category: auditedProduct.product.category,
    categoryBucket: auditedProduct.product.categoryBucket,
    brand: auditedProduct.product.brand,
    division: auditedProduct.product.division,
    sizeChartImageUrl: auditedProduct.product.sizeChartImageUrl,
    productVideoUrl: auditedProduct.product.productVideoUrl,
    images: auditedProduct.qualifyingColors.flatMap((color) => color.images),
    colors: auditedProduct.qualifyingColors.map((color) => ({
      color: normalizeDisplayColor(color.providerColor),
      providerColor: color.providerColor,
      colorKey: color.colorKey,
      colorHexValue: color.colorHexValue,
      swatchImageUrl:
        color.images.find((image) => image.view === "leftQuarter")
          ?.externalImageUrl ?? color.swatchImageUrl,
    })),
    variants: auditedProduct.product.variants.filter((variant) =>
      selectedColorKeys.has(normalizeColorKey(variant.providerColor)),
    ),
  };
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

async function writeOutputs(
  options: CliOptions,
  allProducts: ProductAggregate[],
  candidates: ProductAggregate[],
  auditedProducts: AuditedProduct[],
  selectedProducts: AuditedProduct[],
  cache: Map<string, UrlAuditResult>,
) {
  await mkdir(options.outputDir, { recursive: true });

  const selectedOutput = selectedProducts.map(buildSelectedProductOutput);
  const selectedIds = new Set(
    selectedProducts.map((product) => product.product.providerProductId),
  );

  const draftCandidates = auditedProducts
    .filter(
      (product) =>
        product.qualifies &&
        !selectedIds.has(product.product.providerProductId),
    )
    .map(buildSelectedProductOutput);

  const verifiedImageRows = selectedOutput.flatMap((product) =>
    product.images.map((image) => [
      product.providerProductId,
      product.name,
      product.categoryBucket,
      image.color,
      image.colorKey,
      image.view,
      image.providerView,
      image.sortOrder,
      image.externalImageUrl,
      image.source,
      image.altText,
    ]),
  );

  const rejectedRows = auditedProducts
    .filter((product) => !selectedIds.has(product.product.providerProductId))
    .map((product) => [
      product.product.providerProductId,
      product.product.name,
      product.product.categoryBucket,
      product.qualifies
        ? "Qualified but not selected"
        : product.rejectionReason,
      product.product.colors.length,
      product.auditedColors.length,
      product.qualifyingColors.length,
      product.score,
    ]);

  const summary = {
    generatedAt: new Date().toISOString(),
    configuration: options,
    source: {
      csvPath: options.csvPath,
      activeProducts: allProducts.length,
      candidateProducts: candidates.length,
      auditedProducts: auditedProducts.length,
    },
    results: {
      qualifiedProducts: auditedProducts.filter((product) => product.qualifies)
        .length,
      selectedProducts: selectedProducts.length,
      selectedColors: selectedOutput.reduce(
        (total, product) => total + product.colors.length,
        0,
      ),
      selectedVariants: selectedOutput.reduce(
        (total, product) => total + product.variants.length,
        0,
      ),
      verifiedImages: selectedOutput.reduce(
        (total, product) => total + product.images.length,
        0,
      ),
      cachedUrlChecks: cache.size,
    },
    selectedProducts: selectedProducts.map((product) => ({
      providerProductId: product.product.providerProductId,
      name: product.product.name,
      categoryBucket: product.product.categoryBucket,
      score: product.score,
      selectedColors: product.qualifyingColors.map((color) => ({
        color: normalizeDisplayColor(color.providerColor),
        providerColor: color.providerColor,
        imageCount: color.images.length,
        views: color.images.map((image) => image.view),
      })),
    })),
  };

  const excludedRows = allProducts
    .filter((product) => isLicensedProduct(product))
    .map((product) => [
      product.providerProductId,
      product.name,
      product.categoryBucket,
      product.audience,
      "Licensed or professional-team branded product",
    ]);

  await Promise.all([
    writeFile(
      path.join(options.outputDir, "selected-products.json"),
      `${JSON.stringify(selectedOutput, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(options.outputDir, "verified-images.csv"),
      `${toCsv(
        [
          "providerProductId",
          "productName",
          "categoryBucket",
          "color",
          "colorKey",
          "view",
          "providerView",
          "sortOrder",
          "externalImageUrl",
          "source",
          "altText",
        ],
        verifiedImageRows,
      )}\n`,
      "utf8",
    ),
    writeFile(
      path.join(options.outputDir, "rejected-products.csv"),
      `${toCsv(
        [
          "providerProductId",
          "productName",
          "categoryBucket",
          "reason",
          "availableColors",
          "auditedColors",
          "qualifyingColors",
          "score",
        ],
        rejectedRows,
      )}\n`,
      "utf8",
    ),
    writeFile(
      path.join(options.outputDir, "catalog-image-audit.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(options.outputDir, "draft-candidates.json"),
      `${JSON.stringify(draftCandidates, null, 2)}\n`,
      "utf8",
    ),

    writeFile(
      path.join(options.outputDir, "excluded-products.csv"),
      `${toCsv(
        [
          "providerProductId",
          "productName",
          "categoryBucket",
          "audience",
          "reason",
        ],
        excludedRows,
      )}\n`,
      "utf8",
    ),
  ]);

  await saveUrlCache(
    path.join(options.outputDir, "image-url-cache.json"),
    cache,
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log(`Reading CSV: ${options.csvPath}`);
  const csvText = await readFile(options.csvPath, "utf8");
  const rows = mapCsvRows(csvText);

  console.log(`Parsed ${rows.length.toLocaleString()} CSV rows.`);

  const products = aggregateProducts(rows);
  console.log(`Found ${products.length.toLocaleString()} active products.`);

  const candidates = buildCandidatePool(products, options);
  console.log(
    `Auditing ${candidates.length.toLocaleString()} candidate products across balanced category buckets.`,
  );

  await mkdir(options.outputDir, { recursive: true });

  const cachePath = path.join(options.outputDir, "image-url-cache.json");
  const cache = await loadUrlCache(cachePath);
  const semaphore = new Semaphore(options.requestConcurrency);
  const verifyUrl = createUrlVerifier(
    cache,
    semaphore,
    options.requestTimeoutMs,
  );

  const auditedProducts: AuditedProduct[] = [];

  for (let index = 0; index < candidates.length; index += 1) {
    const product = candidates[index];

    console.log(
      `[${index + 1}/${candidates.length}] ${product.name} (${product.providerProductId})`,
    );

    const auditedProduct = await auditProduct(product, options, verifyUrl);
    auditedProducts.push(auditedProduct);

    console.log(
      `  ${auditedProduct.qualifyingColors.length} qualifying colors; score ${auditedProduct.score}.`,
    );

    if ((index + 1) % 10 === 0) {
      await saveUrlCache(cachePath, cache);
    }
  }

  const selectedProducts = selectBalancedProducts(
    auditedProducts,
    options.selectedProductCount,
  );

  await writeOutputs(
    options,
    products,
    candidates,
    auditedProducts,
    selectedProducts,
    cache,
  );

  console.log("");
  console.log(`Selected ${selectedProducts.length} products.`);
  console.log(`Output directory: ${options.outputDir}`);

  if (selectedProducts.length < options.selectedProductCount) {
    console.warn(
      `Only ${selectedProducts.length} products met the configured requirements. Review rejected-products.csv or lower the thresholds deliberately.`,
    );
  }
}

main().catch((error) => {
  console.error(
    error instanceof Error ? (error.stack ?? error.message) : error,
  );
  process.exitCode = 1;
});
