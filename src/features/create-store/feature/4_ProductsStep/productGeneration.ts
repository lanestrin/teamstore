import {
  createProductCombinationKey,
  type ProductColorFamily,
  type ProductSelectionsDraft,
} from "../../context/CreateStoreContext";

import type {
  ProductCollectionItem,
} from "./productCollections";

import type {
  GeneratedSuggestion,
  ProductOption,
} from "./productStep.types";

export const MAX_GENERATED_SUGGESTIONS = 30;

interface GenerateProductSuggestionsArgs {
  collection: readonly ProductCollectionItem[];

  productsByProviderId: ReadonlyMap<
    string,
    ProductOption
  >;

  selectedArtworkTemplateIds: readonly string[];

  productColorFamily:
    | ProductColorFamily
    | "";

  productGenerationSeed: number;

  productSelections: ProductSelectionsDraft;

  activity: string;

  providerProductIds: readonly string[];
}

interface ProductColorCandidate {
  providerProductId: string;

  section:
    ProductCollectionItem["section"];

  product: ProductOption;

  color:
    ProductOption["colorOptions"][number];
}

function hashString(
  value: string,
): number {
  let hash = 2166136261;

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^= value.charCodeAt(index);

    hash = Math.imul(
      hash,
      16777619,
    );
  }

  return hash >>> 0;
}

function createSeededRandom(
  seed: number,
): () => number {
  let value = seed >>> 0;

  return () => {
    value += 0x6d2b79f5;

    let result = value;

    result = Math.imul(
      result ^ (result >>> 15),
      result | 1,
    );

    result ^=
      result +
      Math.imul(
        result ^ (result >>> 7),
        result | 61,
      );

    return (
      ((result ^ (result >>> 14)) >>> 0) /
      4294967296
    );
  };
}

function shuffleWithSeed<T>(
  values: readonly T[],
  seed: number,
): T[] {
  const random =
    createSeededRandom(seed);

  const shuffled = [...values];

  for (
    let index = shuffled.length - 1;
    index > 0;
    index -= 1
  ) {
    const targetIndex = Math.floor(
      random() * (index + 1),
    );

    [
      shuffled[index],
      shuffled[targetIndex],
    ] = [
      shuffled[targetIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

function getProductColorPairKey(
  providerProductId: string,
  colorKey: string,
): string {
  return [
    providerProductId,
    colorKey,
  ].join("::");
}

function rebuildSelectedSuggestions(
  collection: readonly ProductCollectionItem[],
  productsByProviderId: ReadonlyMap<
    string,
    ProductOption
  >,
  productSelections: ProductSelectionsDraft,
): {
  suggestions: GeneratedSuggestion[];
  selectedProductColorPairs: Set<string>;
} {
  const suggestions:
    GeneratedSuggestion[] = [];

  const selectedProductColorPairs =
    new Set<string>();

  for (const selection of Object.values(
    productSelections,
  )) {
    const product =
      productsByProviderId.get(
        selection.providerProductId,
      );

    if (!product) {
      continue;
    }

    const collectionItem =
      collection.find(
        (item) =>
          item.providerProductId ===
          selection.providerProductId,
      );

    if (!collectionItem) {
      continue;
    }

    const color =
      product.colorOptions.find(
        (candidate) =>
          candidate.colorKey ===
          selection.colorKey,
      );

    if (!color) {
      continue;
    }

    selectedProductColorPairs.add(
      getProductColorPairKey(
        selection.providerProductId,
        selection.colorKey,
      ),
    );

    suggestions.push({
      combinationKey:
        selection.combinationKey,

      providerProductId:
        selection.providerProductId,

      section:
        collectionItem.section,

      product,

      color,

      artworkTemplateId:
        selection.artworkTemplateId,
    });
  }

  return {
    suggestions,
    selectedProductColorPairs,
  };
}

function buildColorCandidates(
  collection: readonly ProductCollectionItem[],
  productsByProviderId: ReadonlyMap<
    string,
    ProductOption
  >,
  productColorFamily: ProductColorFamily,
  selectedProductColorPairs: ReadonlySet<string>,
): ProductColorCandidate[] {
  const candidates:
    ProductColorCandidate[] = [];

  for (const collectionItem of collection) {
    const product =
      productsByProviderId.get(
        collectionItem.providerProductId,
      );

    if (!product) {
      continue;
    }

    const matchingColors =
      product.colorOptions.filter(
        (color) =>
          color.colorFamilies.includes(
            productColorFamily,
          ),
      );

    for (const color of matchingColors) {
      const pairKey =
        getProductColorPairKey(
          collectionItem.providerProductId,
          color.colorKey,
        );

      /*
       * If this garment + supplier color is
       * already selected, don't generate a
       * second artwork variation beside it.
       */
      if (
        selectedProductColorPairs.has(
          pairKey,
        )
      ) {
        continue;
      }

      candidates.push({
        providerProductId:
          collectionItem.providerProductId,

        section:
          collectionItem.section,

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
  const artworkSeed =
    hashString(
      [
        generationSeed,
        candidate.providerProductId,
        candidate.color.colorKey,
      ].join("|"),
    );

  return selectedArtworkTemplateIds[
    artworkSeed %
      selectedArtworkTemplateIds.length
  ];
}

export function generateProductSuggestions({
  collection,
  productsByProviderId,
  selectedArtworkTemplateIds,
  productColorFamily,
  productGenerationSeed,
  productSelections,
  activity,
  providerProductIds,
}: GenerateProductSuggestionsArgs): GeneratedSuggestion[] {
  const {
    suggestions:
      selectedSuggestions,

    selectedProductColorPairs,
  } =
    rebuildSelectedSuggestions(
      collection,
      productsByProviderId,
      productSelections,
    );

  /*
   * Selected products are preserved even if
   * the user changes the Product Color filter.
   */
  if (
    !productColorFamily ||
    selectedArtworkTemplateIds.length === 0
  ) {
    return selectedSuggestions;
  }

  const colorCandidates =
    buildColorCandidates(
      collection,
      productsByProviderId,
      productColorFamily,
      selectedProductColorPairs,
    );

  const generationSeed =
    hashString(
      [
        productGenerationSeed,
        activity,
        productColorFamily,
        ...selectedArtworkTemplateIds,
        ...providerProductIds,
      ].join("|"),
    );

  const randomizedCandidates =
    shuffleWithSeed(
      colorCandidates,
      generationSeed,
    );

  const generated =
    new Map<
      string,
      GeneratedSuggestion
    >();

  /*
   * Explicit user selections always win.
   */
  for (const suggestion of selectedSuggestions) {
    generated.set(
      suggestion.combinationKey,
      suggestion,
    );
  }

  for (const candidate of randomizedCandidates) {
    if (
      generated.size >=
      MAX_GENERATED_SUGGESTIONS
    ) {
      break;
    }

    /*
     * Each matching garment/color receives
     * one randomly assigned selected artwork.
     *
     * Because the randomness is seeded, the
     * assignment stays stable until the user
     * clicks Regenerate Suggestions.
     */
    const artworkTemplateId =
      chooseArtworkTemplate(
        candidate,
        selectedArtworkTemplateIds,
        generationSeed,
      );

    const combinationKey =
      createProductCombinationKey(
        candidate.providerProductId,
        candidate.color.colorKey,
        artworkTemplateId,
      );

    generated.set(
      combinationKey,
      {
        combinationKey,

        providerProductId:
          candidate.providerProductId,

        section:
          candidate.section,

        product:
          candidate.product,

        color:
          candidate.color,

        artworkTemplateId,
      },
    );
  }

  return [...generated.values()];
}

export function getAvailableProductColorFamilies(
  products: readonly ProductOption[],
): Set<string> {
  const families =
    new Set<string>();

  for (const product of products) {
    for (const color of product.colorOptions) {
      for (const family of color.colorFamilies) {
        families.add(family);
      }
    }
  }

  return families;
}