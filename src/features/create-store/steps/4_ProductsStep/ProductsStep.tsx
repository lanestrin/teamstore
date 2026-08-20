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
import { createUploadedArtworkId, generateProductSuggestions, getUploadedArtworkId } from "./lib/productGeneration";
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
  if (!family) {
    return "All";
  }

  return PRODUCT_COLOR_OPTIONS.find((option) => option.value === family)?.label ?? "Product color";
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error(`Could not read ${file.name}.`));
    };

    reader.onerror = () => reject(reader.error ?? new Error(`Could not read ${file.name}.`));

    reader.readAsDataURL(file);
  });
}

function createUploadedArtworkPreviewSvg(imageUrl: string): string {
  const escapedImageUrl = imageUrl.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><image href="${escapedImageUrl}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet" /></svg>`;
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

  const primaryColorFamily = storeDraft.productColorFamily;
  const secondaryColorFamily = storeDraft.productSecondaryColorFamily;

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
          colorFamily: primaryColorFamily && primaryColorFamily !== "unknown" ? primaryColorFamily : undefined,
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

  const artworkTemplatesById = useMemo(() => new Map(ART_TEMPLATE_LIST.map((template) => [template.id, template])), []);

  const selectedArtworkIds = useMemo(
    () => [
      ...Object.values(storeDraft.artworkTemplates)
        .filter((template) => template.isSelected)
        .map((template) => template.selectedArtTemplateId),

      ...storeDraft.uploadedArtworks.filter((artwork) => artwork.isSelected).map((artwork) => createUploadedArtworkId(artwork.id)),
    ],
    [storeDraft.artworkTemplates, storeDraft.uploadedArtworks],
  );

  const uploadedArtworksById = useMemo(
    () => new Map(storeDraft.uploadedArtworks.map((artwork) => [artwork.id, artwork])),
    [storeDraft.uploadedArtworks],
  );

  const [uploadedArtworkPreviewSvgsById, setUploadedArtworkPreviewSvgsById] = useState<Record<string, string>>({});

  useEffect(() => {
    let isCancelled = false;

    void Promise.all(
      storeDraft.uploadedArtworks.map(async (artwork) => {
        let imageUrl: string | null = null;

        if (artwork.file) {
          imageUrl = await readFileAsDataUrl(artwork.file);
        } else if (artwork.storageUrl) {
          imageUrl = artwork.storageUrl;
        }

        if (!imageUrl) {
          return null;
        }

        return [createUploadedArtworkId(artwork.id), createUploadedArtworkPreviewSvg(imageUrl)] as const;
      }),
    )
      .then((entries) => {
        if (isCancelled) {
          return;
        }

        setUploadedArtworkPreviewSvgsById(
          Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)),
        );
      })
      .catch((error) => {
        console.error("Could not build uploaded artwork previews.", error);

        if (!isCancelled) {
          setUploadedArtworkPreviewSvgsById({});
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [storeDraft.uploadedArtworks]);

  const artworkPreviewSvgsById = useMemo(
    () => ({
      ...artworkSvgsByTemplateId,
      ...uploadedArtworkPreviewSvgsById,
    }),
    [artworkSvgsByTemplateId, uploadedArtworkPreviewSvgsById],
  );

  const selectedProductCount = Object.keys(storeDraft.productSelections).length;

  const isLoading = isStoreActivity(storeDraft.activity) && storeCreationProducts === undefined;

  const suggestions = useMemo<GeneratedSuggestion[]>(() => {
    if (!storeCreationProducts || !primaryColorFamily) {
      return [];
    }

    return generateProductSuggestions({
      products: productOptions,
      selectedArtworkIds,
      primaryColorFamily,
      secondaryColorFamily,
      productGenerationSeed: storeDraft.productGenerationSeed,
      productSelections: storeDraft.productSelections,
      activity: storeDraft.activity,
    });
  }, [
    storeCreationProducts,
    productOptions,
    selectedArtworkIds,
    primaryColorFamily,
    secondaryColorFamily,
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

  function getArtworkName(artworkId: string): string {
    const uploadedArtworkId = getUploadedArtworkId(artworkId);

    if (uploadedArtworkId) {
      return uploadedArtworksById.get(uploadedArtworkId)?.fileName ?? "Uploaded artwork";
    }

    return artworkTemplatesById.get(artworkId)?.name ?? "Artwork";
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

  function handlePrimaryColorChange(nextColor: ProductColorFamily) {
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

  function handleSecondaryColorChange(nextColor: ProductColorFamily | "") {
    if (nextColor === storeDraft.productSecondaryColorFamily) {
      return;
    }

    setColorOverrides({});
    setEditingProduct(null);

    updateStoreDraft({
      productSecondaryColorFamily: nextColor,
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
  const primaryColorLabel = getProductColorLabel(primaryColorFamily);
  const secondaryColorLabel = getProductColorLabel(secondaryColorFamily);
  const hasMatchingSuggestions = suggestions.length > 0;
  const canRegenerate = Boolean(primaryColorFamily);

  const artworkDescription = selectedArtworkIds.length > 0 ? "with randomly assigned artwork" : "without artwork";

  return (
    <>
      <WizardLayout
        step={currentStep}
        title={`Choose products for ${activityLabel}`}
        description={
          secondaryColorFamily
            ? `Choose products that match your ${primaryColorLabel} and ${secondaryColorLabel} product colors.`
            : `Choose ${primaryColorLabel} products with any secondary color.`
        }
        onBack={() => setCurrentStep(3)}
        onNext={() => setCurrentStep(5)}
        nextDisabled={isLoading || selectedProductCount === 0}
        width="wide"
      >
        <div className={styles.productsStep}>
          <ProductSuggestionControls
            activity={storeDraft.activity}
            primaryColorFamily={primaryColorFamily}
            secondaryColorFamily={secondaryColorFamily}
            selectedCount={selectedProductCount}
            suggestionCount={suggestions.length}
            availableProductColorFamilies={availableProductColorFamilies}
            isLoading={isLoading}
            canRegenerate={canRegenerate}
            onActivityChange={handleActivityChange}
            onPrimaryColorChange={handlePrimaryColorChange}
            onSecondaryColorChange={handleSecondaryColorChange}
            onRegenerate={regenerateProductSuggestions}
          />

          {!isLoading && availableProductColorFamilies.size === 0 ? (
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
                <h2>No matching products found</h2>

                <p>
                  {secondaryColorFamily
                    ? `No quick setup products were found for your ${primaryColorLabel} and ${secondaryColorLabel} product colors.`
                    : `No quick setup products were found for ${primaryColorLabel} with any secondary color.`}
                </p>
              </div>
            </div>
          ) : (
            <>
              <ProductSuggestionSection
                title="Uniforms"
                description={`${primaryColorLabel} and ${secondaryColorLabel} uniform options ${artworkDescription}.`}
                section="uniforms"
                suggestions={suggestions}
                isLoading={isLoading}
                artworkSvgsByTemplateId={artworkPreviewSvgsById}
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
                description={`${primaryColorLabel} and ${secondaryColorLabel} fanwear options ${artworkDescription}.`}
                section="fanwear"
                suggestions={suggestions}
                isLoading={isLoading}
                artworkSvgsByTemplateId={artworkPreviewSvgsById}
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
