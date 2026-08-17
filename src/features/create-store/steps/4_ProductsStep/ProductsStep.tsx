import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { LuTriangleAlert } from "react-icons/lu";

import { api } from "../../../../../convex/_generated/api";
import { ART_TEMPLATE_LIST } from "../../../../assets/art-templates";
import type { ProductColorFamily } from "../../../../types/productColor.types";
import WizardLayout from "../../components/WizardLayout/WizardLayout";
import { createProductCombinationKey, useCreateStore } from "../../context/CreateStoreContext";

import ProductEditorModal from "./components/ProductEditorModal/ProductEditorModal";
import ProductSuggestionControls from "./components/ProductSuggestionControls/ProductSuggestionControls";
import ProductSuggestionSection from "./components/ProductSuggestionSection/ProductSuggestionSection";
import { PRODUCT_COLOR_OPTIONS } from "./lib/productColorOptions";
import { generateProductSuggestions } from "./lib/productGeneration";
import type { EditingProductState, GeneratedSuggestion, ProductColorOption, ProductOption } from "./lib/productStep.types";
import styles from "./ProductsStep.module.scss";

const STORE_ACTIVITIES = [
  "basketball",
  "baseball",
  "football",
  "soccer",
  "softball",
  "volleyball",
  "wrestling",
  "spirit-wear",
  "other",
] as const;

type StoreActivity = (typeof STORE_ACTIVITIES)[number];

function isStoreActivity(value: string): value is StoreActivity {
  return STORE_ACTIVITIES.some((activity) => activity === value);
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
   * "unknown" is valid catalog classification data,
   * but it should never act as a selectable product filter.
   */
  const filterableProductColorFamily = storeDraft.productColorFamily === "unknown" ? "" : storeDraft.productColorFamily;

  /*
   * Selected product IDs are sent to Convex so selected
   * products remain available even when the color filter changes.
   */
  const selectedProductIds = useMemo(
    () => [...new Set(Object.values(storeDraft.productSelections).map((selection) => selection.productId))],
    [storeDraft.productSelections],
  );

  /*
   * Store Creation is now vendor-independent.
   *
   * Convex returns:
   * - uniforms for the selected activity
   * - global fanwear
   * - available product color families
   *
   * Supplier IDs are no longer used to build the assortment.
   */
  const storeCreationProducts = useQuery(
    api.products.getStoreCreationProducts,
    isStoreActivity(storeDraft.activity)
      ? {
          activity: storeDraft.activity,
          colorFamily: filterableProductColorFamily || undefined,
          selectedProductIds,
        }
      : "skip",
  );

  /*
   * Generation works from one normalized product pool.
   * product.activity determines whether a product belongs
   * in Uniforms or Fanwear.
   */
  const productOptions = useMemo<ProductOption[]>(() => {
    if (!storeCreationProducts) {
      return [];
    }

    return [...storeCreationProducts.uniforms, ...storeCreationProducts.fanwear];
  }, [storeCreationProducts]);

  const availableProductColorFamilies = useMemo(
    () => new Set(storeCreationProducts?.availableProductColorFamilies ?? []),
    [storeCreationProducts],
  );

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

  const isLoading = isStoreActivity(storeDraft.activity) && storeCreationProducts === undefined;

  const suggestions = useMemo<GeneratedSuggestion[]>(() => {
    if (!storeCreationProducts) {
      return [];
    }

    return generateProductSuggestions({
      products: productOptions,
      selectedArtworkTemplateIds,
      productColorFamily: filterableProductColorFamily,
      productGenerationSeed: storeDraft.productGenerationSeed,
      productSelections: storeDraft.productSelections,
      activity: storeDraft.activity,
    });
  }, [
    storeCreationProducts,
    productOptions,
    selectedArtworkTemplateIds,
    filterableProductColorFamily,
    storeDraft.productGenerationSeed,
    storeDraft.productSelections,
    storeDraft.activity,
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

    return createProductCombinationKey(suggestion.productId, color.colorKey, suggestion.artworkTemplateId);
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

  function handleActivityChange(nextActivity: StoreActivity) {
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
      productId: suggestion.productId,
      colorKey: color.colorKey,
      artworkTemplateId: suggestion.artworkTemplateId,
      isRequired: false,
    });
  }

  function handleRequiredClick(suggestion: GeneratedSuggestion) {
    const color = getEffectiveColor(suggestion);

    const combinationKey = getEffectiveCombinationKey(suggestion);

    const selection = storeDraft.productSelections[combinationKey];

    if (!selection) {
      selectProduct({
        productId: suggestion.productId,
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
      editingSuggestion.productId,
      previousColor.colorKey,
      editingSuggestion.artworkTemplateId,
    );

    const currentSelection = storeDraft.productSelections[previousCombinationKey];

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
          ) : !isLoading && availableProductColorFamilies.size === 0 ? (
            <div className={styles.emptyState}>
              <LuTriangleAlert aria-hidden="true" />

              <div>
                <h2>No products are available</h2>
                <p>No available products were found for this catalog.</p>
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
