import type { ProductColorFamily } from "../../../../../types/productColor.types";
import { createProductCombinationKey, type ProductSelectionsDraft } from "../../../context/CreateStoreContext";
import { getDecorationProfileIdForProductCategory } from "./decorationProfiles";
import type { GeneratedSuggestion, ProductOption, ProductSuggestionSection } from "./productStep.types";

export const MAX_UNIFORM_SUGGESTIONS = 8;
export const MAX_FANWEAR_SUGGESTIONS = 12;
const MAX_ARTWORK_VARIATIONS_PER_PRODUCT_COLOR = 2;

interface GenerateProductSuggestionsArgs {
  products: readonly ProductOption[];
  selectedArtworkTemplateIds: readonly string[];
  primaryColorFamily: ProductColorFamily;
  secondaryColorFamily: ProductColorFamily | "";
  productGenerationSeed: number;
  productSelections: ProductSelectionsDraft;
  activity: string;
}

interface ProductColorCandidate {
  productId: ProductOption["_id"];
  section: ProductSuggestionSection;
  product: ProductOption;
  color: ProductOption["colorOptions"][number];
  priority: number;
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
): GeneratedSuggestion[] {
  const suggestions: GeneratedSuggestion[] = [];

  for (const selection of Object.values(productSelections)) {
    const product = productsById.get(selection.productId);

    if (!product) {
      continue;
    }

    const color = product.colorOptions.find((candidate) => candidate.colorKey === selection.colorKey);

    if (!color) {
      continue;
    }

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

  return suggestions;
}

function getQuickSetupColorPriority(
  colorFamilies: readonly ProductColorFamily[],
  primaryColorFamily: ProductColorFamily,
  secondaryColorFamily: ProductColorFamily | "",
): number {
  if (primaryColorFamily === "unknown") {
    return 0;
  }

  const colors = [...new Set(colorFamilies.filter((color) => color !== "unknown"))];

  if (colors.length === 1 && colors[0] === primaryColorFamily) {
    return 1;
  }

  if (!secondaryColorFamily) {
    if (colors.length === 2 && colors.includes(primaryColorFamily)) {
      return 2;
    }
    return 0;
  }

  if (secondaryColorFamily === "unknown") {
    return 0;
  }

  if (
    colors.length === 2 &&
    primaryColorFamily !== secondaryColorFamily &&
    colors.includes(primaryColorFamily) &&
    colors.includes(secondaryColorFamily)
  ) {
    return 2;
  }

  return 0;
}

function buildColorCandidates(
  products: readonly ProductOption[],
  primaryColorFamily: ProductColorFamily,
  secondaryColorFamily: ProductColorFamily | "",
): ProductColorCandidate[] {
  const candidates: ProductColorCandidate[] = [];

  for (const product of products) {
    for (const color of product.colorOptions) {
      const priority = getQuickSetupColorPriority(color.colorFamilies, primaryColorFamily, secondaryColorFamily);

      if (priority === 0) {
        continue;
      }

      candidates.push({
        productId: product._id,
        section: getProductSection(product),
        product,
        color,
        priority,
      });
    }
  }

  return candidates;
}

function chooseArtworkTemplate(
  candidate: ProductColorCandidate,
  selectedArtworkTemplateIds: readonly string[],
  generationSeed: number,
  usedArtworkTemplateIds: ReadonlySet<string>,
): string | null {
  const availableArtworkTemplateIds = selectedArtworkTemplateIds.filter(
    (artworkTemplateId) => !usedArtworkTemplateIds.has(artworkTemplateId),
  );

  if (availableArtworkTemplateIds.length === 0) {
    return null;
  }

  const artworkSeed = hashString([generationSeed, candidate.productId, candidate.color.colorKey, usedArtworkTemplateIds.size].join("|"));

  return availableArtworkTemplateIds[artworkSeed % availableArtworkTemplateIds.length];
}

export function generateProductSuggestions({
  products,
  selectedArtworkTemplateIds,
  primaryColorFamily,
  secondaryColorFamily,
  productGenerationSeed,
  productSelections,
  activity,
}: GenerateProductSuggestionsArgs): GeneratedSuggestion[] {
  const productsById = new Map<string, ProductOption>(products.map((product) => [product._id, product]));
  const selectedSuggestions = rebuildSelectedSuggestions(productsById, productSelections);

  /*
   * Selected products remain visible even when
   * the Product Color filter changes.
   */

  if (selectedArtworkTemplateIds.length === 0) {
    return selectedSuggestions;
  }

  const colorCandidates = buildColorCandidates(products, primaryColorFamily, secondaryColorFamily);
  const productIds = products.map((product) => product._id).sort();
  const generationSeed = hashString(
    [productGenerationSeed, activity, primaryColorFamily, secondaryColorFamily, ...selectedArtworkTemplateIds, ...productIds].join("|"),
  );

  const twoColorCandidates = colorCandidates.filter((candidate) => candidate.priority === 2);
  const solidColorCandidates = colorCandidates.filter((candidate) => candidate.priority === 1);

  const randomizedCandidates = [
    ...shuffleWithSeed(twoColorCandidates, generationSeed),
    ...shuffleWithSeed(solidColorCandidates, generationSeed + 1),
  ];

  const generated = new Map<string, GeneratedSuggestion>();
  const artworkIdsByProductColor = new Map<string, Set<string>>();

  let uniformCount = selectedSuggestions.filter((suggestion) => suggestion.section === "uniforms").length;

  let fanwearCount = selectedSuggestions.filter((suggestion) => suggestion.section === "fanwear").length;

  /*
   * Explicit selections are preserved first.
   */
  for (const suggestion of selectedSuggestions) {
    generated.set(suggestion.combinationKey, suggestion);

    const pairKey = getProductColorPairKey(suggestion.productId, suggestion.color.colorKey);
    const artworkIds = artworkIdsByProductColor.get(pairKey) ?? new Set<string>();

    artworkIds.add(suggestion.artworkTemplateId);
    artworkIdsByProductColor.set(pairKey, artworkIds);
  }

  for (let variation = 0; variation < MAX_ARTWORK_VARIATIONS_PER_PRODUCT_COLOR; variation += 1) {
    for (const candidate of randomizedCandidates) {
      if (candidate.section === "uniforms" && uniformCount >= MAX_UNIFORM_SUGGESTIONS) {
        continue;
      }

      if (candidate.section === "fanwear" && fanwearCount >= MAX_FANWEAR_SUGGESTIONS) {
        continue;
      }

      const pairKey = getProductColorPairKey(candidate.productId, candidate.color.colorKey);

      const usedArtworkTemplateIds = artworkIdsByProductColor.get(pairKey) ?? new Set<string>();

      if (usedArtworkTemplateIds.size >= MAX_ARTWORK_VARIATIONS_PER_PRODUCT_COLOR) {
        continue;
      }

      /*
       * First pass favors product variety.
       * Second pass allows another artwork variation.
       */
      if (variation === 0 && usedArtworkTemplateIds.size > 0) {
        continue;
      }

      const artworkTemplateId = chooseArtworkTemplate(candidate, selectedArtworkTemplateIds, generationSeed, usedArtworkTemplateIds);

      if (!artworkTemplateId) {
        continue;
      }

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

      usedArtworkTemplateIds.add(artworkTemplateId);
      artworkIdsByProductColor.set(pairKey, usedArtworkTemplateIds);

      if (candidate.section === "uniforms") {
        uniformCount += 1;
      } else {
        fanwearCount += 1;
      }

      if (uniformCount >= MAX_UNIFORM_SUGGESTIONS && fanwearCount >= MAX_FANWEAR_SUGGESTIONS) {
        break;
      }
    }

    if (uniformCount >= MAX_UNIFORM_SUGGESTIONS && fanwearCount >= MAX_FANWEAR_SUGGESTIONS) {
      break;
    }
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
