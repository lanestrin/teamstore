import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { LuTriangleAlert } from "react-icons/lu";

import { api } from "../../../../../convex/_generated/api";
import { ART_TEMPLATE_LIST } from "../../../../assets/art-templates";
import type { ProductColorFamily } from "../../../../types/productColor.types";
import WizardLayout from "../../components/WizardLayout/WizardLayout";
import { createProductCombinationKey, useCreateStore } from "../../context/CreateStoreContext";

import ProductSuggestionControls from "./components/ProductSuggestionControls/ProductSuggestionControls";
import { PRODUCT_COLOR_OPTIONS } from "./lib/productColorOptions";

import { getAvailableProductColorFamilies, generateProductSuggestions } from "./lib/productGeneration";

import { PRODUCT_COLLECTION_PROVIDER, PRODUCT_COLLECTIONS, type ProductCollectionActivity } from "./lib/productCollections";

import type { EditingProductState, GeneratedSuggestion, ProductColorOption, ProductOption } from "./lib/productStep.types";
import styles from "./ProductsStep.module.scss";
import ProductEditorModal from "./components/ProductEditorModal/ProductEditorModal";
import ProductSuggestionSection from "./components/ProductSuggestionSection/ProductSuggestionSection";

function isProductCollectionActivity(value: string): value is ProductCollectionActivity {
  return Object.prototype.hasOwnProperty.call(PRODUCT_COLLECTIONS, value);
}

function getActivityLabel(activity: string): string {
  if (!activity) {
    return "your activity";
  }

  return activity
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getProductColorLabel(family: ProductColorFamily | ""): string {
  return PRODUCT_COLOR_OPTIONS.find((option) => option.value === family)?.label ?? "Product color";
}

export default function SelectProductsStep() {
  const {
    currentStep,
    setCurrentStep,
    storeDraft,
    updateStoreDraft,
    artworkSvgsByTemplateId,
    selectProduct,
    removeProduct,
    toggleProductRequired,
    updateProductSelection,
    regenerateProductSuggestions,
  } = useCreateStore();

  const [editingProduct, setEditingProduct] = useState<EditingProductState | null>(null);

  /*
   * Used only when the user edits the color
   * of an unselected suggestion.
   *
   * Selected products store their color directly
   * inside productSelections instead.
   */
  const [colorOverrides, setColorOverrides] = useState<Record<string, string>>({});

  /*
   * Resolve the curated collection for
   * the currently selected activity.
   */
  const collection = useMemo(
    () => (isProductCollectionActivity(storeDraft.activity) ? PRODUCT_COLLECTIONS[storeDraft.activity] : []),
    [storeDraft.activity],
  );

  const providerProductIds = useMemo(() => collection.map((item) => item.providerProductId), [collection]);

  /*
   * Load the real supplier products,
   * available colors, and front images.
   */
  const productOptions = useQuery(
    api.products.listProductOptionsByProviderIds,
    providerProductIds.length > 0
      ? {
          provider: PRODUCT_COLLECTION_PROVIDER,
          providerProductIds,
        }
      : "skip",
  );

  /*
   * Fast lookup for generation and
   * rebuilding selected combinations.
   */
  const productsByProviderId = useMemo(() => {
    return new Map<string, ProductOption>(
      (productOptions ?? []).flatMap((product) => (product.providerProductId ? [[product.providerProductId, product] as const] : [])),
    );
  }, [productOptions]);

  /*
   * Used to display the artwork template
   * name on each suggestion card.
   */
  const artworkTemplatesById = useMemo(() => new Map(ART_TEMPLATE_LIST.map((template) => [template.id, template])), []);

  /*
   * Only artwork templates explicitly selected
   * during Step 3 participate in generation.
   */
  const selectedArtworkTemplateIds = useMemo(
    () =>
      Object.values(storeDraft.artworkTemplates)
        .filter((template) => template.isSelected)
        .map((template) => template.selectedArtTemplateId),
    [storeDraft.artworkTemplates],
  );

  const selectedProductCount = Object.keys(storeDraft.productSelections).length;

  const isLoading = providerProductIds.length > 0 && productOptions === undefined;

  /*
   * Curated products that could not currently
   * be resolved into an available catalog item.
   */
  const unavailableProductCount =
    productOptions === undefined ? 0 : collection.filter((item) => !productsByProviderId.has(item.providerProductId)).length;

  /*
   * Determine which broad product colors
   * exist in this activity's collection.
   */
  const availableProductColorFamilies = useMemo(() => getAvailableProductColorFamilies(productOptions ?? []), [productOptions]);

  /*
   * "unknown" is valid catalog classification data,
   * but it should never act as a selectable product filter.
   */
  const filterableProductColorFamily = storeDraft.productColorFamily === "unknown" ? "" : storeDraft.productColorFamily;

  /*
   * Product generation now lives entirely
   * inside productGeneration.ts.
   */
  const suggestions = useMemo<GeneratedSuggestion[]>(() => {
    if (!productOptions) {
      return [];
    }

    return generateProductSuggestions({
      collection,
      productsByProviderId,
      selectedArtworkTemplateIds,
      productColorFamily: filterableProductColorFamily,
      productGenerationSeed: storeDraft.productGenerationSeed,
      productSelections: storeDraft.productSelections,
      activity: storeDraft.activity,
      providerProductIds,
    });
  }, [
    collection,
    productOptions,
    productsByProviderId,
    providerProductIds,
    selectedArtworkTemplateIds,
    storeDraft.activity,
    filterableProductColorFamily,
    storeDraft.productGenerationSeed,
    storeDraft.productSelections,
  ]);

  /*
   * Temporary card edits should not survive
   * a regenerated assortment.
   */
  useEffect(() => {
    setColorOverrides({});
    setEditingProduct(null);
  }, [storeDraft.productGenerationSeed]);

  function getEffectiveColor(suggestion: GeneratedSuggestion): ProductColorOption {
    const overrideColorKey = colorOverrides[suggestion.combinationKey];

    if (!overrideColorKey) {
      return suggestion.color;
    }

    return suggestion.product.colorOptions.find((color) => color.colorKey === overrideColorKey) ?? suggestion.color;
  }

  function getEffectiveCombinationKey(suggestion: GeneratedSuggestion): string {
    const color = getEffectiveColor(suggestion);

    return createProductCombinationKey(suggestion.providerProductId, color.colorKey, suggestion.artworkTemplateId);
  }

  function getArtworkName(artworkTemplateId: string): string {
    return artworkTemplatesById.get(artworkTemplateId)?.name ?? "Artwork";
  }

  function isSuggestionSelected(suggestion: GeneratedSuggestion): boolean {
    return storeDraft.productSelections[getEffectiveCombinationKey(suggestion)] !== undefined;
  }

  function isSuggestionRequired(suggestion: GeneratedSuggestion): boolean {
    return storeDraft.productSelections[getEffectiveCombinationKey(suggestion)]?.isRequired ?? false;
  }

  /*
   * Activity changes affect the actual curated
   * product collection, so existing selections
   * are cleared after confirmation.
   */
  function handleActivityChange(nextActivity: ProductCollectionActivity) {
    if (nextActivity === storeDraft.activity) {
      return;
    }

    if (selectedProductCount > 0) {
      const confirmed = window.confirm(
        `Changing the activity to ${getActivityLabel(nextActivity)} will clear your current product selections. Continue?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setColorOverrides({});
    setEditingProduct(null);

    updateStoreDraft({
      activity: nextActivity,
      productSelections: {},
      productGenerationSeed: storeDraft.productGenerationSeed + 1,
    });
  }

  /*
   * Changing Product Color does not clear
   * anything the user already selected.
   *
   * It simply generates a new unselected pool.
   */
  function handleProductColorChange(nextColor: ProductColorFamily) {
    if (nextColor === storeDraft.productColorFamily) {
      return;
    }

    setColorOverrides({});
    setEditingProduct(null);

    updateStoreDraft({
      productColorFamily: nextColor,
      productGenerationSeed: storeDraft.productGenerationSeed + 1,
    });
  }

  function handleSelectionChange(suggestion: GeneratedSuggestion, checked: boolean) {
    const color = getEffectiveColor(suggestion);

    const combinationKey = getEffectiveCombinationKey(suggestion);

    if (!checked) {
      removeProduct(combinationKey);
      return;
    }

    selectProduct({
      providerProductId: suggestion.providerProductId,
      colorKey: color.colorKey,
      artworkTemplateId: suggestion.artworkTemplateId,
      isRequired: false,
    });
  }

  function handleRequiredClick(suggestion: GeneratedSuggestion) {
    const color = getEffectiveColor(suggestion);

    const combinationKey = getEffectiveCombinationKey(suggestion);

    const selection = storeDraft.productSelections[combinationKey];

    /*
     * Clicking the star on an unselected
     * suggestion selects it and makes it required.
     */
    if (!selection) {
      selectProduct({
        providerProductId: suggestion.providerProductId,
        colorKey: color.colorKey,
        artworkTemplateId: suggestion.artworkTemplateId,
        isRequired: true,
      });

      return;
    }

    toggleProductRequired(combinationKey);
  }

  function openProductEditor(suggestion: GeneratedSuggestion) {
    const color = getEffectiveColor(suggestion);

    setEditingProduct({
      suggestionKey: suggestion.combinationKey,
      colorKey: color.colorKey,
    });
  }

  /*
   * Resolve the full suggestion associated with
   * the small piece of modal state.
   */
  const editingSuggestion = useMemo(
    () => (editingProduct ? (suggestions.find((suggestion) => suggestion.combinationKey === editingProduct.suggestionKey) ?? null) : null),
    [editingProduct, suggestions],
  );

  function handleEditorColorChange(colorKey: string) {
    setEditingProduct((currentEditingProduct) => {
      if (!currentEditingProduct) {
        return null;
      }

      return {
        ...currentEditingProduct,
        colorKey,
      };
    });
  }

  function saveProductColor() {
    if (!editingSuggestion || !editingProduct) {
      return;
    }

    const previousColor = getEffectiveColor(editingSuggestion);

    const previousCombinationKey = createProductCombinationKey(
      editingSuggestion.providerProductId,
      previousColor.colorKey,
      editingSuggestion.artworkTemplateId,
    );

    const currentSelection = storeDraft.productSelections[previousCombinationKey];

    /*
     * Selected products need their stored
     * combination updated.
     */
    if (currentSelection) {
      updateProductSelection(previousCombinationKey, {
        colorKey: editingProduct.colorKey,
      });

      setColorOverrides((currentOverrides) => {
        const { [editingSuggestion.combinationKey]: removedOverride, ...remainingOverrides } = currentOverrides;

        void removedOverride;

        return remainingOverrides;
      });
    } else {
      /*
       * Unselected cards only need a temporary
       * display override until selected.
       */
      setColorOverrides((currentOverrides) => ({
        ...currentOverrides,
        [editingSuggestion.combinationKey]: editingProduct.colorKey,
      }));
    }

    setEditingProduct(null);
  }

  const activityLabel = getActivityLabel(storeDraft.activity);

  const productColorLabel = getProductColorLabel(storeDraft.productColorFamily);

  const hasMatchingSuggestions = suggestions.length > 0;

  const canRegenerate = Boolean(storeDraft.productColorFamily) && selectedArtworkTemplateIds.length > 0;

  return (
    <>
      <WizardLayout
        step={currentStep}
        title={`Choose products for ${activityLabel}`}
        description={`Choose from ${productColorLabel.toLowerCase()} garments with randomly assigned artwork from the templates you selected.`}
        onBack={() => setCurrentStep(3)}
        onNext={() => setCurrentStep(5)}
        nextDisabled={isLoading || selectedProductCount === 0}
        width="wide"
      >
        <div className={styles.productsStep}>
          <ProductSuggestionControls
            activity={storeDraft.activity}
            productColorFamily={storeDraft.productColorFamily}
            selectedCount={selectedProductCount}
            suggestionCount={suggestions.length}
            availableProductColorFamilies={availableProductColorFamilies}
            isLoading={isLoading}
            canRegenerate={canRegenerate}
            onActivityChange={handleActivityChange}
            onProductColorChange={handleProductColorChange}
            onRegenerate={regenerateProductSuggestions}
          />

          {selectedArtworkTemplateIds.length === 0 ? (
            <div className={styles.emptyState}>
              <LuTriangleAlert aria-hidden="true" />

              <div>
                <h2>Select artwork first</h2>

                <p>Return to the artwork step and select at least one template.</p>
              </div>
            </div>
          ) : collection.length === 0 ? (
            <div className={styles.emptyState}>
              <LuTriangleAlert aria-hidden="true" />

              <div>
                <h2>No product collection is available</h2>

                <p>A curated collection has not been created for {activityLabel} yet.</p>
              </div>
            </div>
          ) : !isLoading && !hasMatchingSuggestions ? (
            <div className={styles.emptyState}>
              <LuTriangleAlert aria-hidden="true" />

              <div>
                <h2>No {productColorLabel.toLowerCase()} products found</h2>

                <p>Choose another Product Color to see available garments.</p>
              </div>
            </div>
          ) : (
            <>
              {unavailableProductCount > 0 && (
                <div className={styles.warning} role="status">
                  <LuTriangleAlert aria-hidden="true" />

                  <span>
                    {unavailableProductCount} recommended {unavailableProductCount === 1 ? "product is" : "products are"} currently
                    unavailable.
                  </span>
                </div>
              )}

              <ProductSuggestionSection
                title="Uniforms"
                description={`${productColorLabel} uniform options with randomly assigned artwork.`}
                section="uniforms"
                suggestions={suggestions}
                isLoading={isLoading}
                artworkSvgsByTemplateId={artworkSvgsByTemplateId}
                getArtworkName={getArtworkName}
                getEffectiveColor={getEffectiveColor}
                isSelected={isSuggestionSelected}
                isRequired={isSuggestionRequired}
                onSelectionChange={handleSelectionChange}
                onRequiredClick={handleRequiredClick}
                onEdit={openProductEditor}
              />

              <ProductSuggestionSection
                title="Fanwear"
                description={`${productColorLabel} fanwear options with randomly assigned artwork.`}
                section="fanwear"
                suggestions={suggestions}
                isLoading={isLoading}
                artworkSvgsByTemplateId={artworkSvgsByTemplateId}
                getArtworkName={getArtworkName}
                getEffectiveColor={getEffectiveColor}
                isSelected={isSuggestionSelected}
                isRequired={isSuggestionRequired}
                onSelectionChange={handleSelectionChange}
                onRequiredClick={handleRequiredClick}
                onEdit={openProductEditor}
              />
            </>
          )}
        </div>
      </WizardLayout>

      {editingSuggestion && editingProduct && (
        <ProductEditorModal
          suggestion={editingSuggestion}
          colorKey={editingProduct.colorKey}
          onColorChange={handleEditorColorChange}
          onSave={saveProductColor}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </>
  );
}
