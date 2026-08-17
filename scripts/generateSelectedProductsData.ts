import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

interface CliOptions {
  inputPath: string;
  outputPath: string;
}

const DEFAULT_INPUT_PATH = path.resolve(process.cwd(), "scripts/output/catalog-audit/selected-products.json");

const DEFAULT_OUTPUT_PATH = path.resolve(process.cwd(), "convex/docs/selectedProductsData.ts");

function parseArgs(argv: string[]): CliOptions {
  let inputPath = DEFAULT_INPUT_PATH;
  let outputPath = DEFAULT_OUTPUT_PATH;

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
          throw new Error("--output requires a file path.");
        }

        outputPath = path.resolve(process.cwd(), nextValue);
        index += 1;
        break;

      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;

      default:
        throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return {
    inputPath,
    outputPath,
  };
}

function printHelp(): void {
  console.log(`
Generate selectedProductsData.ts

Usage:
  npx tsx scripts/generateSelectedProductsData.ts [options]

Options:
  --input <path>    Source selected-products.json
  --output <path>   Destination TypeScript file
  --help            Show this help message
`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateSelectedProducts(value: unknown): asserts value is Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    throw new Error("selected-products.json must contain a JSON array.");
  }

  for (let index = 0; index < value.length; index += 1) {
    const product = value[index];

    if (!isRecord(product)) {
      throw new Error(`Product at index ${index} must be an object.`);
    }

    if (typeof product.providerProductId !== "string" || !product.providerProductId.trim()) {
      throw new Error(`Product at index ${index} is missing providerProductId.`);
    }

    if (typeof product.name !== "string" || !product.name.trim()) {
      throw new Error(`Product ${product.providerProductId} is missing name.`);
    }

    if (!Array.isArray(product.images)) {
      throw new Error(`Product ${product.providerProductId} is missing images.`);
    }

    if (!Array.isArray(product.colors)) {
      throw new Error(`Product ${product.providerProductId} is missing colors.`);
    }

    if (!Array.isArray(product.variants)) {
      throw new Error(`Product ${product.providerProductId} is missing variants.`);
    }
  }
}

const TYPE_HEADER = `export type CatalogImageView = "leftQuarter" | "front" | "back" | "left" | "right" | "detail" | "other";

export type CatalogImageSource = "csv-main" | "verified-derived" | "manual-upload";

export interface SelectedCatalogImage {
  color: string;
  providerColor: string;
  colorKey: string;
  view: CatalogImageView;
  providerView?: string;
  sortOrder: number;
  externalImageUrl: string;
  altText?: string;
  source?: CatalogImageSource;
}

export interface SelectedCatalogColor {
  color: string;
  providerColor: string;
  colorKey: string;
  colorHexValue?: string | null;
  swatchImageUrl?: string | null;
}

export interface SelectedCatalogVariant {
  providerVariantId: string;
  sku: string;
  upc?: string | null;
  color: string;
  providerColor: string;
  size: string;
  baseCostInCents: number;
  directPriceInCents: number;
  currency: string;
  weight?: number | null;
  weightUnit?: string | null;
}

export interface SelectedCatalogProduct {
  providerProductId: string;
  name: string;
  slug: string;
  description?: string | null;
  category: string;
  categoryBucket: string;
  brand?: string | null;
  division?: string | null;
  sizeChartImageUrl?: string | null;
  productVideoUrl?: string | null;
  images: SelectedCatalogImage[];
  colors: SelectedCatalogColor[];
  variants: SelectedCatalogVariant[];
}
`;

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  console.log(`Reading selected products: ${options.inputPath}`);

  const inputText = await readFile(options.inputPath, "utf8");
  const parsedInput: unknown = JSON.parse(inputText);

  validateSelectedProducts(parsedInput);

  const selectedProductsJson = JSON.stringify(parsedInput, null, 2);

  const output = `${TYPE_HEADER}
export const selectedProducts: SelectedCatalogProduct[] = ${selectedProductsJson};

export const selectedCatalogSummary = {
  products: selectedProducts.length,
  colors: selectedProducts.reduce((total, product) => total + product.colors.length, 0),
  images: selectedProducts.reduce((total, product) => total + product.images.length, 0),
  variants: selectedProducts.reduce((total, product) => total + product.variants.length, 0),
};
`;

  await mkdir(path.dirname(options.outputPath), { recursive: true });
  await writeFile(options.outputPath, output, "utf8");

  const productCount = parsedInput.length;
  const colorCount = parsedInput.reduce((total, product) => total + (product.colors as unknown[]).length, 0);
  const imageCount = parsedInput.reduce((total, product) => total + (product.images as unknown[]).length, 0);
  const variantCount = parsedInput.reduce((total, product) => total + (product.variants as unknown[]).length, 0);

  console.log(`Generated ${options.outputPath}`);
  console.log(`Catalog summary: ${productCount} products, ${colorCount} colors, ${variantCount} variants, ${imageCount} images.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exitCode = 1;
});
