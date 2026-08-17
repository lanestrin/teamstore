import type { ProductColorFamily } from "../../../../../types/productColor.types";
import { createProductCombinationKey, type ProductSelectionsDraft } from "../../../context/CreateStoreContext";
import { getDecorationProfileIdForProductCategory } from "./decorationProfiles";
import type { GeneratedSuggestion, ProductOption, ProductSuggestionSection } from "./productStep.types";

export const MAX_GENERATED_SUGGESTIONS = 30;

type FilterableProductColorFamily = Exclude<ProductColorFamily, "unknown">;

interface GenerateProductSuggestionsArgs {
  products: readonly ProductOption[];
  selectedArtworkTemplateIds: readonly string[];
  productColorFamily: FilterableProductColorFamily | "";
  productGenerationSeed: number;
  productSelections: ProductSelectionsDraft;
  activity: string;
}

interface ProductColorCandidate {
  productId: ProductOption["_id"];
  section: ProductSuggestionSection;
  product: ProductOption;
  color: ProductOption["colorOptions"][number];
}

function hashString(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createSeededRandom(seed: number): () => number {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;

    let result = value;

    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);

    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(values: readonly T[], seed: number): T[] {
  const random = createSeededRandom(seed);

  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const targetIndex = Math.floor(random() * (index + 1));

    [shuffled[index], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[index]];
  }

  return shuffled;
}

function getProductColorPairKey(productId: string, colorKey: string): string {
  return [productId, colorKey].join("::");
}

function getProductSection(product: ProductOption): ProductSuggestionSection {
  return product.activity ? "uniforms" : "fanwear";
}

function rebuildSelectedSuggestions(
  productsById: ReadonlyMap<string, ProductOption>,
  productSelections: ProductSelectionsDraft,
): {
  suggestions: GeneratedSuggestion[];
  selectedProductColorPairs: Set<string>;
} {
  const suggestions: GeneratedSuggestion[] = [];
  const selectedProductColorPairs = new Set<string>();

  for (const selection of Object.values(productSelections)) {
    const product = productsById.get(selection.productId);

    if (!product) {
      continue;
    }

    const color = product.colorOptions.find((candidate) => candidate.colorKey === selection.colorKey);

    if (!color) {
      continue;
    }

    selectedProductColorPairs.add(getProductColorPairKey(selection.productId, selection.colorKey));

    suggestions.push({
      combinationKey: selection.combinationKey,
      productId: selection.productId,
      section: getProductSection(product),
      decorationProfileId: getDecorationProfileIdForProductCategory(product.category),
      product,
      color,
      artworkTemplateId: selection.artworkTemplateId,
    });
  }

  return {
    suggestions,
    selectedProductColorPairs,
  };
}

function buildColorCandidates(
  products: readonly ProductOption[],
  productColorFamily: FilterableProductColorFamily,
  selectedProductColorPairs: ReadonlySet<string>,
): ProductColorCandidate[] {
  const candidates: ProductColorCandidate[] = [];

  for (const product of products) {
    const matchingColors = product.colorOptions.filter((color) => color.colorFamilies.includes(productColorFamily));

    for (const color of matchingColors) {
      const pairKey = getProductColorPairKey(product._id, color.colorKey);

      /*
       * Don't generate another artwork variation
       * beside a garment/color already selected.
       */
      if (selectedProductColorPairs.has(pairKey)) {
        continue;
      }

      candidates.push({
        productId: product._id,
        section: getProductSection(product),
        product,
        color,
      });
    }
  }

  return candidates;
}

function chooseArtworkTemplate(
  candidate: ProductColorCandidate,
  selectedArtworkTemplateIds: readonly string[],
  generationSeed: number,
): string {
  const artworkSeed = hashString([generationSeed, candidate.productId, candidate.color.colorKey].join("|"));

  return selectedArtworkTemplateIds[artworkSeed % selectedArtworkTemplateIds.length];
}

export function generateProductSuggestions({
  products,
  selectedArtworkTemplateIds,
  productColorFamily,
  productGenerationSeed,
  productSelections,
  activity,
}: GenerateProductSuggestionsArgs): GeneratedSuggestion[] {
  const productsById = new Map<string, ProductOption>(products.map((product) => [product._id, product]));

  const { suggestions: selectedSuggestions, selectedProductColorPairs } = rebuildSelectedSuggestions(productsById, productSelections);

  /*
   * Selected products remain visible even when
   * the Product Color filter changes.
   */
  if (!productColorFamily || selectedArtworkTemplateIds.length === 0) {
    return selectedSuggestions;
  }

  const colorCandidates = buildColorCandidates(products, productColorFamily, selectedProductColorPairs);
  const productIds = products.map((product) => product._id).sort();
  const generationSeed = hashString(
    [productGenerationSeed, activity, productColorFamily, ...selectedArtworkTemplateIds, ...productIds].join("|"),
  );

  const randomizedCandidates = shuffleWithSeed(colorCandidates, generationSeed);
  const generated = new Map<string, GeneratedSuggestion>();

  /*
   * Explicit selections are preserved first.
   */
  for (const suggestion of selectedSuggestions) {
    generated.set(suggestion.combinationKey, suggestion);
  }

  for (const candidate of randomizedCandidates) {
    if (generated.size >= MAX_GENERATED_SUGGESTIONS) {
      break;
    }

    const artworkTemplateId = chooseArtworkTemplate(candidate, selectedArtworkTemplateIds, generationSeed);
    const combinationKey = createProductCombinationKey(candidate.productId, candidate.color.colorKey, artworkTemplateId);

    generated.set(combinationKey, {
      combinationKey,
      productId: candidate.productId,
      section: candidate.section,
      decorationProfileId: getDecorationProfileIdForProductCategory(candidate.product.category),
      product: candidate.product,
      color: candidate.color,
      artworkTemplateId,
    });
  }

  return [...generated.values()];
}

export function getAvailableProductColorFamilies(products: readonly ProductOption[]): Set<string> {
  const families = new Set<string>();

  for (const product of products) {
    for (const color of product.colorOptions) {
      for (const family of color.colorFamilies) {
        families.add(family);
      }
    }
  }

  return families;
}
