import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { createProductCombinationKey } from "../../../../packages/store-builder/context/CreateStoreContext";
import {
  createDefaultProductArtworkPlacement,
  type ProductArtworkPlacement,
} from "../../../../packages/store-builder/lib/decorationProfiles";
import { PRODUCT_COLOR_OPTIONS } from "../../../../packages/store-builder/lib/productColorOptions";
import {
  createUploadedArtworkId,
  generateProductSuggestions,
  getUploadedArtworkId,
  NO_ARTWORK_TEMPLATE_ID,
} from "../../../../packages/store-builder/lib/productGeneration";
import type { ProductColorFamily } from "../../../../packages/store-builder/types/productColor";
import type {
  GeneratedSuggestion,
  ProductColorOption,
  ProductOption,
} from "../../../../packages/store-builder/types/productStep";
import type {
  EditableProductState,
  EditingProductState,
  ManagedProductPreview,
  ManagedStore,
  ManagedStoreProduct,
  ProductArtworkOption,
  StoreActivity,
} from "../types";

const STORE_ACTIVITIES: readonly StoreActivity[] = [
  "basketball",
  "baseball",
  "football",
  "soccer",
  "softball",
  "volleyball",
  "wrestling",
  "spirit-wear",
  "other",
];

function isStoreActivity(value: string | undefined): value is StoreActivity {
  return Boolean(value) && STORE_ACTIVITIES.some((activity) => activity === value);
}

function isProductColorFamily(value: string | undefined): value is ProductColorFamily {
  return PRODUCT_COLOR_OPTIONS.some((option) => option.value === value);
}

function getTodayDateValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createInitialState(store: ManagedStore): EditableProductState | null {
  if (!isStoreActivity(store.activity) || !isProductColorFamily(store.productColorFamily)) {
    return null;
  }

  const selections: EditableProductState["selections"] = {};

  for (const product of store.products) {
    const combinationKey = createProductCombinationKey(
      product.productId,
      product.colorKey,
      product.artworkTemplateId,
    );

    selections[combinationKey] = {
      combinationKey,
      productId: product.productId,
      colorKey: product.colorKey,
      artworkTemplateId: product.artworkTemplateId,
      artworkPlacement: product.artworkPlacement,
      isRequired: product.isRequired,
    };
  }

  return {
    activity: store.activity,
    primaryColorFamily: store.productColorFamily,
    secondaryColorFamily: isProductColorFamily(store.productSecondaryColorFamily)
      ? store.productSecondaryColorFamily
      : "",
    generationSeed: store.productGenerationSeed ?? 1,
    selections,
    requiredItemsDeadline: store.requiredItemsDeadline ?? "",
  };
}

function createUploadedArtworkPreviewSvg(imageUrl: string): string {
  const escapedImageUrl = imageUrl.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><image href="${escapedImageUrl}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet" /></svg>`;
}

export function useStoreProductsManager(store: ManagedStore) {
  const updateStoreProducts = useMutation(api.stores.updateStoreProducts);
  const [editorState, setEditorState] = useState<EditableProductState | null>(() => createInitialState(store));
  const [savedState, setSavedState] = useState<EditableProductState | null>(() => createInitialState(store));
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EditingProductState | null>(null);
  const [editingColorProduct, setEditingColorProduct] = useState<ManagedStoreProduct | null>(null);
  const [editingColorKey, setEditingColorKey] = useState<string | null>(null);
  const [placementOverrides, setPlacementOverrides] = useState<Record<string, ProductArtworkPlacement>>({});
  const [preservedProductIds, setPreservedProductIds] = useState<string[]>(() => [
    ...new Set(store.products.map((product) => product.productId)),
  ]);

  useEffect(() => {
    const nextState = createInitialState(store);
    setEditorState(nextState);
    setSavedState(nextState);
    setIsAdding(false);
    setEditingProduct(null);
    setEditingColorProduct(null);
    setEditingColorKey(null);
    setPlacementOverrides({});
    setPreservedProductIds([...new Set(store.products.map((product) => product.productId))]);
  }, [store]);

  const catalog = useQuery(
    api.storeProductCatalog.getStoreCreationProducts,
    editorState
      ? {
          activity: editorState.activity,
          colorFamily:
            editorState.primaryColorFamily !== "unknown"
              ? editorState.primaryColorFamily
              : undefined,
          selectedProductIds: preservedProductIds.map(
            (productId) => productId as Id<"products">,
          ),
        }
      : "skip",
  );

  const isLoading = editorState !== null && catalog === undefined;

  const productOptions = useMemo<ProductOption[]>(() => {
    if (!catalog) return [];
    if (store.storeType === "uniform") return catalog.uniforms;
    if (store.storeType === "fanwear") return catalog.fanwear;
    if (store.storeType === "hybrid") return [...catalog.uniforms, ...catalog.fanwear];
    return [];
  }, [catalog, store.storeType]);

  const availableProductColorFamilies = useMemo(
    () =>
      new Set(
        productOptions.flatMap((product) =>
          product.colorOptions.flatMap((color) => color.colorFamilies),
        ),
      ),
    [productOptions],
  );

  const hasExactSecondaryColorCombination = useMemo(() => {
    if (
      !editorState ||
      !editorState.secondaryColorFamily ||
      editorState.primaryColorFamily === "unknown" ||
      editorState.secondaryColorFamily === "unknown"
    ) {
      return true;
    }

    return productOptions.some((product) =>
      product.colorOptions.some((color) => {
        const families = [...new Set(color.colorFamilies)];
        return (
          families.length === 2 &&
          families.includes(editorState.primaryColorFamily) &&
          families.includes(editorState.secondaryColorFamily as ProductColorFamily)
        );
      }),
    );
  }, [editorState, productOptions]);

  const isUsingColorFallback =
    Boolean(editorState?.secondaryColorFamily) &&
    !isLoading &&
    !hasExactSecondaryColorCombination;

  const suggestionSecondaryColorFamily = isUsingColorFallback
    ? ""
    : (editorState?.secondaryColorFamily ?? "");

  const selectedArtworkIds = useMemo(
    () => [
      ...(store.artworkTemplates ?? [])
        .filter((template) => template.isSelected)
        .map((template) => template.artworkTemplateId),
      ...(store.uploadedArtworks ?? [])
        .filter((artwork) => artwork.isSelected)
        .map((artwork) => createUploadedArtworkId(artwork.id)),
    ],
    [store.artworkTemplates, store.uploadedArtworks],
  );

  const artworkPreviewSvgsById = useMemo(() => {
    const entries: Array<readonly [string, string]> = [];

    for (const snapshot of store.artworkSnapshots ?? []) {
      entries.push([snapshot.artworkTemplateId, snapshot.svg]);
    }

    for (const artwork of store.uploadedArtworks ?? []) {
      if (artwork.storageUrl) {
        entries.push([
          createUploadedArtworkId(artwork.id),
          createUploadedArtworkPreviewSvg(artwork.storageUrl),
        ]);
      }
    }

    return Object.fromEntries(entries);
  }, [store.artworkSnapshots, store.uploadedArtworks]);

  const artworkOptions = useMemo<ProductArtworkOption[]>(() => {
    const options: ProductArtworkOption[] = [];
    const artworkIds = new Set([
      ...selectedArtworkIds,
      ...Object.values(editorState?.selections ?? {}).map(
        (selection) => selection.artworkTemplateId,
      ),
    ]);
    let storeArtworkIndex = 1;

    for (const artworkId of artworkIds) {
      if (artworkId === NO_ARTWORK_TEMPLATE_ID) {
        options.push({ id: artworkId, label: "No artwork" });
        continue;
      }

      const uploadedArtworkId = getUploadedArtworkId(artworkId);

      if (uploadedArtworkId) {
        const uploadedArtwork = store.uploadedArtworks?.find(
          (artwork) => artwork.id === uploadedArtworkId,
        );

        options.push({
          id: artworkId,
          label: uploadedArtwork?.fileName ?? "Uploaded artwork",
        });
        continue;
      }

      options.push({
        id: artworkId,
        label: `Store artwork ${storeArtworkIndex}`,
      });
      storeArtworkIndex += 1;
    }

    return options;
  }, [editorState?.selections, selectedArtworkIds, store.uploadedArtworks]);

  const suggestions = useMemo<GeneratedSuggestion[]>(() => {
    if (!editorState || !catalog) return [];

    return generateProductSuggestions({
      products: productOptions,
      selectedArtworkIds,
      primaryColorFamily: editorState.primaryColorFamily,
      secondaryColorFamily: suggestionSecondaryColorFamily,
      productGenerationSeed: editorState.generationSeed,
      productSelections: editorState.selections,
      activity: editorState.activity,
    });
  }, [catalog, editorState, productOptions, selectedArtworkIds, suggestionSecondaryColorFamily]);

  const selectedCount = editorState ? Object.keys(editorState.selections).length : 0;
  const hasRequiredProducts = editorState
    ? Object.values(editorState.selections).some((selection) => selection.isRequired)
    : false;
  const todayDate = getTodayDateValue();
  const deadlineMissing = hasRequiredProducts && !editorState?.requiredItemsDeadline;
  const deadlinePast = Boolean(
    hasRequiredProducts &&
      editorState?.requiredItemsDeadline &&
      editorState.requiredItemsDeadline < todayDate,
  );

  const showUniforms = store.storeType === "uniform" || store.storeType === "hybrid";
  const showFanwear = store.storeType === "fanwear" || store.storeType === "hybrid";

  const editingSuggestion = useMemo(
    () =>
      editingProduct
        ? (suggestions.find(
            (suggestion) => suggestion.combinationKey === editingProduct.suggestionKey,
          ) ?? null)
        : null,
    [editingProduct, suggestions],
  );

  function getArtworkName(artworkId: string): string {
    const uploadedArtworkId = getUploadedArtworkId(artworkId);
    if (!uploadedArtworkId) return "Store artwork";

    return (
      store.uploadedArtworks?.find((artwork) => artwork.id === uploadedArtworkId)
        ?.fileName ?? "Uploaded artwork"
    );
  }

  function getEffectiveColor(suggestion: GeneratedSuggestion): ProductColorOption {
    return suggestion.color;
  }

  function getArtworkPlacement(suggestion: GeneratedSuggestion): ProductArtworkPlacement {
    const selection = editorState?.selections[suggestion.combinationKey];
    return (
      selection?.artworkPlacement ??
      placementOverrides[suggestion.combinationKey] ??
      createDefaultProductArtworkPlacement(suggestion.decorationProfileId)
    );
  }

  function isSuggestionSelected(suggestion: GeneratedSuggestion): boolean {
    return editorState?.selections[suggestion.combinationKey] !== undefined;
  }

  function isSuggestionRequired(suggestion: GeneratedSuggestion): boolean {
    return editorState?.selections[suggestion.combinationKey]?.isRequired ?? false;
  }

  function findSuggestionForStoreProduct(
    productId: string,
    colorKey: string,
    artworkTemplateId: string,
  ): GeneratedSuggestion | null {
    const combinationKey = createProductCombinationKey(
      productId,
      colorKey,
      artworkTemplateId,
    );
    return suggestions.find((suggestion) => suggestion.combinationKey === combinationKey) ?? null;
  }

  function handleActivityChange(activity: StoreActivity) {
    if (!editorState || activity === editorState.activity) return;
    if (
      selectedCount > 0 &&
      !window.confirm("Changing the activity will clear the current product selections. Continue?")
    ) {
      return;
    }

    setEditorState({
      ...editorState,
      activity,
      selections: {},
      requiredItemsDeadline: "",
      generationSeed: editorState.generationSeed + 1,
    });
    setPreservedProductIds([]);
    setPlacementOverrides({});
    setEditingProduct(null);
  }

  function handlePrimaryColorChange(primaryColorFamily: ProductColorFamily) {
    if (!editorState || primaryColorFamily === editorState.primaryColorFamily) return;

    setPreservedProductIds([
      ...new Set(Object.values(editorState.selections).map((selection) => selection.productId)),
    ]);
    setEditorState({
      ...editorState,
      primaryColorFamily,
      secondaryColorFamily: "",
      generationSeed: editorState.generationSeed + 1,
    });
    setPlacementOverrides({});
    setEditingProduct(null);
  }

  function handleSecondaryColorChange(secondaryColorFamily: ProductColorFamily | "") {
    if (!editorState || secondaryColorFamily === editorState.secondaryColorFamily) return;
    setEditorState({
      ...editorState,
      secondaryColorFamily,
      generationSeed: editorState.generationSeed + 1,
    });
    setPlacementOverrides({});
    setEditingProduct(null);
  }

  function handleSelectionChange(suggestion: GeneratedSuggestion, checked: boolean) {
    if (!editorState) return;

    if (!checked) {
      const { [suggestion.combinationKey]: removedSelection, ...remainingSelections } =
        editorState.selections;

      if (removedSelection?.artworkPlacement) {
        setPlacementOverrides((current) => ({
          ...current,
          [suggestion.combinationKey]: removedSelection.artworkPlacement!,
        }));
      }

      setEditorState({ ...editorState, selections: remainingSelections });
      return;
    }

    setEditorState({
      ...editorState,
      selections: {
        ...editorState.selections,
        [suggestion.combinationKey]: {
          combinationKey: suggestion.combinationKey,
          productId: suggestion.productId,
          colorKey: suggestion.color.colorKey,
          artworkTemplateId: suggestion.artworkTemplateId,
          artworkPlacement: getArtworkPlacement(suggestion),
          isRequired: false,
        },
      },
    });
  }

  function handleRequiredClick(suggestion: GeneratedSuggestion) {
    if (!editorState) return;
    const selection = editorState.selections[suggestion.combinationKey];
    if (!selection) return;

    setEditorState({
      ...editorState,
      selections: {
        ...editorState.selections,
        [suggestion.combinationKey]: {
          ...selection,
          isRequired: !selection.isRequired,
        },
      },
    });
  }

  function handleDeadlineChange(event: ChangeEvent<HTMLInputElement>) {
    if (!editorState) return;
    setEditorState({ ...editorState, requiredItemsDeadline: event.currentTarget.value });
  }

  function openSuggestionEditor(suggestion: GeneratedSuggestion) {
    setEditingProduct({
      suggestionKey: suggestion.combinationKey,
      artworkTemplateId: suggestion.artworkTemplateId,
      placement: { ...getArtworkPlacement(suggestion) },
    });
  }

  function openExistingProductEditor(
    productId: string,
    colorKey: string,
    artworkTemplateId: string,
  ) {
    const suggestion = findSuggestionForStoreProduct(productId, colorKey, artworkTemplateId);
    if (!suggestion) {
      window.alert("This product is still loading. Try again in a moment.");
      return;
    }
    openSuggestionEditor(suggestion);
  }

  function handleEditorPlacementChange(placement: ProductArtworkPlacement) {
    setEditingProduct((current) =>
      current ? { ...current, placement: { ...placement } } : null,
    );
  }

  function handleEditorArtworkChange(artworkTemplateId: string) {
    setEditingProduct((current) =>
      current ? { ...current, artworkTemplateId } : null,
    );
  }

  function getManagedProductPreview(product: ManagedStoreProduct): ManagedProductPreview | null {
    const suggestion = findSuggestionForStoreProduct(
      product.productId,
      product.colorKey,
      product.artworkTemplateId,
    );

    if (!suggestion) return null;

    return {
      suggestion,
      color: suggestion.color,
      artworkSvg: artworkPreviewSvgsById[product.artworkTemplateId] ?? null,
      placement:
        product.artworkPlacement ??
        createDefaultProductArtworkPlacement(suggestion.decorationProfileId),
    };
  }

  function getProductColorOptions(productId: string): readonly ProductColorOption[] {
    return productOptions.find((product) => product._id === productId)?.colorOptions ?? [];
  }

  function openColorEditor(product: ManagedStoreProduct) {
    const colorOptions = getProductColorOptions(product.productId);

    if (colorOptions.length === 0) {
      window.alert("This product's colors are still loading. Try again in a moment.");
      return;
    }

    setEditingColorProduct(product);
    setEditingColorKey(product.colorKey);
  }

  async function saveProductColor() {
    if (!editorState || !editingColorProduct || !editingColorKey) return;

    const oldCombinationKey = createProductCombinationKey(
      editingColorProduct.productId,
      editingColorProduct.colorKey,
      editingColorProduct.artworkTemplateId,
    );
    const selection = editorState.selections[oldCombinationKey];

    if (!selection) {
      window.alert("This product configuration could not be found.");
      return;
    }

    if (editingColorKey === editingColorProduct.colorKey) {
      setEditingColorProduct(null);
      setEditingColorKey(null);
      return;
    }

    const newCombinationKey = createProductCombinationKey(
      editingColorProduct.productId,
      editingColorKey,
      editingColorProduct.artworkTemplateId,
    );

    if (editorState.selections[newCombinationKey]) {
      window.alert("That product color is already configured in this store.");
      return;
    }

    const { [oldCombinationKey]: _oldSelection, ...remainingSelections } =
      editorState.selections;

    const nextState: EditableProductState = {
      ...editorState,
      selections: {
        ...remainingSelections,
        [newCombinationKey]: {
          ...selection,
          combinationKey: newCombinationKey,
          colorKey: editingColorKey,
        },
      },
    };

    if (await persistState(nextState)) {
      setEditingColorProduct(null);
      setEditingColorKey(null);
    }
  }

  async function persistState(nextState: EditableProductState): Promise<boolean> {
    const nextSelections = Object.values(nextState.selections);
    const nextHasRequired = nextSelections.some((selection) => selection.isRequired);
    const nextDeadlineMissing = nextHasRequired && !nextState.requiredItemsDeadline;
    const nextDeadlinePast = Boolean(
      nextHasRequired &&
        nextState.requiredItemsDeadline &&
        nextState.requiredItemsDeadline < todayDate,
    );

    if (isSaving || nextSelections.length === 0 || nextDeadlineMissing || nextDeadlinePast) {
      return false;
    }

    setIsSaving(true);
    try {
      await updateStoreProducts({
        storeId: store.storeId,
        activity: nextState.activity,
        productColorFamily: nextState.primaryColorFamily,
        productSecondaryColorFamily: nextState.secondaryColorFamily || undefined,
        productGenerationSeed: nextState.generationSeed,
        productSelections: nextSelections.map((selection) => ({
          productId: selection.productId as Id<"products">,
          colorKey: selection.colorKey,
          artworkTemplateId: selection.artworkTemplateId,
          artworkPlacement: selection.artworkPlacement,
          isRequired: selection.isRequired,
        })),
        requiredItemsDeadline: nextState.requiredItemsDeadline || undefined,
      });

      const saved = structuredClone(nextState);
      setSavedState(saved);
      setEditorState(saved);
      setPlacementOverrides({});
      return true;
    } catch (error) {
      console.error("Could not update store products.", error);
      window.alert(error instanceof Error ? error.message : "Could not update store products.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function saveProductArtwork() {
    if (!editorState || !editingProduct || !editingSuggestion) return;

    const oldCombinationKey = editingSuggestion.combinationKey;
    const selection = editorState.selections[oldCombinationKey];
    if (!selection) return;

    const newCombinationKey = createProductCombinationKey(
      selection.productId,
      selection.colorKey,
      editingProduct.artworkTemplateId,
    );

    if (
      newCombinationKey !== oldCombinationKey &&
      editorState.selections[newCombinationKey]
    ) {
      window.alert("That product and artwork combination is already configured in this store.");
      return;
    }

    const { [oldCombinationKey]: _oldSelection, ...remainingSelections } =
      editorState.selections;

    const nextState: EditableProductState = {
      ...editorState,
      selections: {
        ...remainingSelections,
        [newCombinationKey]: {
          ...selection,
          combinationKey: newCombinationKey,
          artworkTemplateId: editingProduct.artworkTemplateId,
          artworkPlacement: editingProduct.placement,
        },
      },
    };

    if (isAdding) {
      setEditorState(nextState);
      setEditingProduct(null);
      return;
    }

    if (await persistState(nextState)) setEditingProduct(null);
  }

  function beginAdding() {
    if (savedState) setEditorState(structuredClone(savedState));
    setIsAdding(true);
  }

  function cancelAdding() {
    if (savedState) setEditorState(structuredClone(savedState));
    setPlacementOverrides({});
    setEditingProduct(null);
    setIsAdding(false);
  }

  async function saveAddedProducts() {
    if (!editorState || selectedCount === 0 || deadlineMissing || deadlinePast) return;
    if (await persistState(editorState)) setIsAdding(false);
  }

  async function removeProduct(
    productId: string,
    colorKey: string,
    artworkTemplateId: string,
    productName: string,
  ) {
    if (!editorState || isSaving) return;
    if (selectedCount <= 1) {
      window.alert("An active store must contain at least one product.");
      return;
    }
    if (!window.confirm(`Remove ${productName} from this store?`)) return;

    const combinationKey = createProductCombinationKey(
      productId,
      colorKey,
      artworkTemplateId,
    );
    const { [combinationKey]: _removed, ...remainingSelections } = editorState.selections;
    await persistState({ ...editorState, selections: remainingSelections });
  }

  return {
    editorState,
    isAdding,
    isSaving,
    isLoading,
    productOptions,
    suggestions,
    selectedCount,
    hasRequiredProducts,
    todayDate,
    deadlineMissing,
    deadlinePast,
    showUniforms,
    showFanwear,
    isUsingColorFallback,
    availableProductColorFamilies,
    artworkPreviewSvgsById,
    artworkOptions,
    editingProduct,
    editingSuggestion,
    editingColorProduct,
    editingColorKey,
    beginAdding,
    cancelAdding,
    saveAddedProducts,
    removeProduct,
    openExistingProductEditor,
    openSuggestionEditor,
    openColorEditor,
    saveProductColor,
    setEditingColorKey,
    closeColorEditor: () => {
      setEditingColorProduct(null);
      setEditingColorKey(null);
    },
    handleActivityChange,
    handlePrimaryColorChange,
    handleSecondaryColorChange,
    handleSelectionChange,
    handleRequiredClick,
    handleDeadlineChange,
    handleEditorPlacementChange,
    handleEditorArtworkChange,
    saveProductArtwork,
    closeProductEditor: () => setEditingProduct(null),
    getManagedProductPreview,
    getProductColorOptions,
    regenerate: () => {
      if (!editorState) return;
      setEditorState({ ...editorState, generationSeed: editorState.generationSeed + 1 });
      setPlacementOverrides({});
      setEditingProduct(null);
    },
    getArtworkName,
    getEffectiveColor,
    getArtworkPlacement,
    isSuggestionSelected,
    isSuggestionRequired,
  };
}
