import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useQuery } from "convex/react";
import { LuTriangleAlert } from "react-icons/lu";

import { api } from "../../../../../convex/_generated/api";
import { ART_TEMPLATE_LIST } from "../../../../assets/art-templates";
import type { ProductColorFamily } from "../../../../types/productColor.types";
import WizardLayout from "../../components/WizardLayout/WizardLayout";
import { useCreateStore } from "../../context/CreateStoreContext";

import ProductEditorModal from "./components/ProductEditorModal/ProductEditorModal";
import ProductSuggestionControls from "./components/ProductSuggestionControls/ProductSuggestionControls";
import ProductSuggestionSection from "./components/ProductSuggestionSection/ProductSuggestionSection";
import { createDefaultProductArtworkPlacement, type ProductArtworkPlacement } from "./lib/decorationProfiles";
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

function getTodayDateValue(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

  const showUniforms = storeDraft.storeType === "uniform" || storeDraft.storeType === "hybrid";
  const showFanwear = storeDraft.storeType === "fanwear" || storeDraft.storeType === "hybrid";

  const [editingProduct, setEditingProduct] = useState<EditingProductState | null>(null);

  /*
   * Product artwork placement can be edited before a suggestion is selected.
   *
   * Selected products persist placement in productSelections.
   * Unselected suggestions keep temporary placement overrides here.
   */
  const [placementOverrides, setPlacementOverrides] = useState<Record<string, ProductArtworkPlacement>>({});

  /*
   * Keep the Convex catalog query stable while the user selects products.
   *
   * We only snapshot selected product IDs when an upstream catalog filter
   * changes. This lets selected products survive a primary-color change
   * without refetching the catalog on every checkbox click.
   */
  const [preservedProductIds, setPreservedProductIds] = useState(() => [
    ...new Set(Object.values(storeDraft.productSelections).map((selection) => selection.productId)),
  ]);

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
    api.storeProductCatalog.getStoreCreationProducts,
    isStoreActivity(storeDraft.activity)
      ? {
          activity: storeDraft.activity,
          colorFamily: primaryColorFamily && primaryColorFamily !== "unknown" ? primaryColorFamily : undefined,
          selectedProductIds: preservedProductIds,
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

    if (storeDraft.storeType === "uniform") {
      return storeCreationProducts.uniforms;
    }

    if (storeDraft.storeType === "fanwear") {
      return storeCreationProducts.fanwear;
    }

    if (storeDraft.storeType === "hybrid") {
      return [...storeCreationProducts.uniforms, ...storeCreationProducts.fanwear];
    }

    return [];
  }, [storeCreationProducts, storeDraft.storeType]);

  const isLoading = isStoreActivity(storeDraft.activity) && storeCreationProducts === undefined;

  /*
   * A selected secondary color should only be treated as an exact match
   * when the catalog actually contains a two-color option with both
   * the selected primary and secondary families.
   *
   * If that exact pair does not exist, suggestions fall back to
   * primary + All without changing the user's saved team colors.
   */
  const hasExactSecondaryColorCombination = useMemo(() => {
    if (!primaryColorFamily || !secondaryColorFamily || primaryColorFamily === "unknown" || secondaryColorFamily === "unknown") {
      return true;
    }

    return productOptions.some((product) =>
      product.colorOptions.some((color) => {
        const colorFamilies = [...new Set(color.colorFamilies)];

        return colorFamilies.length === 2 && colorFamilies.includes(primaryColorFamily) && colorFamilies.includes(secondaryColorFamily);
      }),
    );
  }, [productOptions, primaryColorFamily, secondaryColorFamily]);

  const isUsingColorFallback = Boolean(secondaryColorFamily) && !isLoading && !hasExactSecondaryColorCombination;
  const suggestionSecondaryColorFamily = isUsingColorFallback ? "" : secondaryColorFamily;

  const availableProductColorFamilies = useMemo(
    () => new Set(productOptions.flatMap((product) => product.colorOptions.flatMap((color) => color.colorFamilies))),
    [productOptions],
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

  const hasRequiredProducts = Object.values(storeDraft.productSelections).some((selection) => selection.isRequired);

  const todayDate = getTodayDateValue();

  const isRequiredItemsDeadlineMissing = hasRequiredProducts && !storeDraft.requiredItemsDeadline;

  const isRequiredItemsDeadlinePast =
    hasRequiredProducts && Boolean(storeDraft.requiredItemsDeadline) && storeDraft.requiredItemsDeadline < todayDate;

  const suggestions = useMemo<GeneratedSuggestion[]>(() => {
    if (!storeCreationProducts || !primaryColorFamily) {
      return [];
    }

    return generateProductSuggestions({
      products: productOptions,
      selectedArtworkIds,
      primaryColorFamily,
      secondaryColorFamily: suggestionSecondaryColorFamily,
      productGenerationSeed: storeDraft.productGenerationSeed,
      productSelections: storeDraft.productSelections,
      activity: storeDraft.activity,
    });
  }, [
    storeCreationProducts,
    productOptions,
    selectedArtworkIds,
    primaryColorFamily,
    suggestionSecondaryColorFamily,
    storeDraft.productGenerationSeed,
    storeDraft.productSelections,
    storeDraft.activity,
  ]);

  /*
   * Temporary product-placement edits should not survive
   * a regenerated assortment.
   */
  useEffect(() => {
    setPlacementOverrides({});
    setEditingProduct(null);
  }, [storeDraft.productGenerationSeed]);

  function getEffectiveColor(suggestion: GeneratedSuggestion): ProductColorOption {
    return suggestion.color;
  }

  function getArtworkPlacement(suggestion: GeneratedSuggestion): ProductArtworkPlacement {
    const selection = storeDraft.productSelections[suggestion.combinationKey];

    if (selection?.artworkPlacement) {
      return selection.artworkPlacement;
    }

    const placementOverride = placementOverrides[suggestion.combinationKey];

    if (placementOverride) {
      return placementOverride;
    }

    return createDefaultProductArtworkPlacement(suggestion.decorationProfileId);
  }

  function getArtworkName(artworkId: string): string {
    const uploadedArtworkId = getUploadedArtworkId(artworkId);

    if (uploadedArtworkId) {
      return uploadedArtworksById.get(uploadedArtworkId)?.fileName ?? "Uploaded artwork";
    }

    return artworkTemplatesById.get(artworkId)?.name ?? "Artwork";
  }

  function isSuggestionSelected(suggestion: GeneratedSuggestion): boolean {
    return storeDraft.productSelections[suggestion.combinationKey] !== undefined;
  }

  function isSuggestionRequired(suggestion: GeneratedSuggestion): boolean {
    return storeDraft.productSelections[suggestion.combinationKey]?.isRequired ?? false;
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

    setPlacementOverrides({});
    setEditingProduct(null);
    setPreservedProductIds([]);

    updateStoreDraft({
      activity: nextActivity,
      productSelections: {},
      requiredItemsDeadline: "",
      productGenerationSeed: storeDraft.productGenerationSeed + 1,
    });
  }

  function handlePrimaryColorChange(nextColor: ProductColorFamily) {
    if (nextColor === storeDraft.productColorFamily) {
      return;
    }

    setPlacementOverrides({});
    setEditingProduct(null);
    setPreservedProductIds([...new Set(Object.values(storeDraft.productSelections).map((selection) => selection.productId))]);

    updateStoreDraft({
      productColorFamily: nextColor,
      productSecondaryColorFamily: "",
      productGenerationSeed: storeDraft.productGenerationSeed + 1,
    });
  }

  function handleSecondaryColorChange(nextColor: ProductColorFamily | "") {
    if (nextColor === storeDraft.productSecondaryColorFamily) {
      return;
    }

    setPlacementOverrides({});
    setEditingProduct(null);

    updateStoreDraft({
      productSecondaryColorFamily: nextColor,
      productGenerationSeed: storeDraft.productGenerationSeed + 1,
    });
  }

  function handleSelectionChange(suggestion: GeneratedSuggestion, checked: boolean) {
    if (!checked) {
      const currentSelection = storeDraft.productSelections[suggestion.combinationKey];
      const artworkPlacement = currentSelection?.artworkPlacement;

      if (artworkPlacement) {
        setPlacementOverrides((currentOverrides) => ({
          ...currentOverrides,
          [suggestion.combinationKey]: { ...artworkPlacement },
        }));
      }

      removeProduct(suggestion.combinationKey);
      return;
    }

    const color = getEffectiveColor(suggestion);

    selectProduct({
      productId: suggestion.productId,
      colorKey: color.colorKey,
      artworkTemplateId: suggestion.artworkTemplateId,
      isRequired: false,
      artworkPlacement: getArtworkPlacement(suggestion),
    });
  }

  function handleRequiredClick(suggestion: GeneratedSuggestion) {
    const selection = storeDraft.productSelections[suggestion.combinationKey];

    if (!selection) {
      return;
    }

    toggleProductRequired(suggestion.combinationKey);
  }

  function handleRequiredItemsDeadlineChange(event: ChangeEvent<HTMLInputElement>) {
    updateStoreDraft({
      requiredItemsDeadline: event.target.value,
    });
  }

  function openProductEditor(suggestion: GeneratedSuggestion) {
    setEditingProduct({
      suggestionKey: suggestion.combinationKey,
      placement: { ...getArtworkPlacement(suggestion) },
    });
  }

  const editingSuggestion = useMemo(
    () => (editingProduct ? (suggestions.find((suggestion) => suggestion.combinationKey === editingProduct.suggestionKey) ?? null) : null),
    [editingProduct, suggestions],
  );

  function handleEditorPlacementChange(placement: ProductArtworkPlacement) {
    setEditingProduct((currentEditingProduct) => {
      if (!currentEditingProduct) {
        return null;
      }

      return {
        ...currentEditingProduct,
        placement: { ...placement },
      };
    });
  }

  function saveProductPlacement() {
    if (!editingSuggestion || !editingProduct) {
      return;
    }

    const currentSelection = storeDraft.productSelections[editingSuggestion.combinationKey];

    if (currentSelection) {
      updateProductSelection(editingSuggestion.combinationKey, {
        artworkPlacement: editingProduct.placement,
      });

      setPlacementOverrides((currentOverrides) => {
        const { [editingSuggestion.combinationKey]: removedOverride, ...remainingOverrides } = currentOverrides;

        void removedOverride;

        return remainingOverrides;
      });
    } else {
      setPlacementOverrides((currentOverrides) => ({
        ...currentOverrides,
        [editingSuggestion.combinationKey]: { ...editingProduct.placement },
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
        nextDisabled={isLoading || selectedProductCount === 0 || isRequiredItemsDeadlineMissing || isRequiredItemsDeadlinePast}
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

          {hasRequiredProducts && (
            <section className={styles.requiredItemsDeadline}>
              <div>
                <h2>Required items deadline</h2>

                <p>Set the deadline for customers to order required products.</p>
              </div>

              <label className={styles.requiredItemsDeadlineField}>
                <span>Order deadline</span>
                <input
                  type="date"
                  value={storeDraft.requiredItemsDeadline}
                  min={todayDate}
                  onChange={handleRequiredItemsDeadlineChange}
                  required
                />
              </label>
            </section>
          )}

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
              {isUsingColorFallback && (
                <aside className={styles.colorFallbackNotice}>
                  <span className={styles.colorFallbackEyebrow}>No exact color match</span>

                  <div className={styles.colorFallbackContent}>
                    <h2>
                      {primaryColorLabel} + {secondaryColorLabel} products aren&apos;t currently available
                    </h2>

                    <p>
                      We couldn&apos;t find products in your exact {primaryColorLabel} and {secondaryColorLabel} combination. May we suggest
                      these {primaryColorLabel} products with other available secondary colors instead?
                    </p>
                  </div>

                  <div className={styles.colorFallbackSuggestion}>
                    <span>Suggested colors</span>
                    <strong>{primaryColorLabel} + All</strong>
                  </div>
                </aside>
              )}

              {showUniforms && (
                <ProductSuggestionSection
                  title="Uniforms"
                  description={
                    isUsingColorFallback
                      ? `${primaryColorLabel} uniform alternatives with available secondary colors ${artworkDescription}.`
                      : `${primaryColorLabel} and ${secondaryColorLabel} uniform options ${artworkDescription}.`
                  }
                  section="uniforms"
                  suggestions={suggestions}
                  isLoading={isLoading}
                  artworkSvgsByTemplateId={artworkPreviewSvgsById}
                  getArtworkName={getArtworkName}
                  getEffectiveColor={getEffectiveColor}
                  getArtworkPlacement={getArtworkPlacement}
                  isSelected={isSuggestionSelected}
                  isRequired={isSuggestionRequired}
                  onSelectionChange={handleSelectionChange}
                  onRequiredClick={handleRequiredClick}
                  onEdit={openProductEditor}
                />
              )}

              {showFanwear && (
                <ProductSuggestionSection
                  title="Fanwear"
                  description={
                    isUsingColorFallback
                      ? `${primaryColorLabel} fanwear alternatives with available secondary colors ${artworkDescription}.`
                      : `${primaryColorLabel} and ${secondaryColorLabel} fanwear options ${artworkDescription}.`
                  }
                  section="fanwear"
                  suggestions={suggestions}
                  isLoading={isLoading}
                  artworkSvgsByTemplateId={artworkPreviewSvgsById}
                  getArtworkName={getArtworkName}
                  getEffectiveColor={getEffectiveColor}
                  getArtworkPlacement={getArtworkPlacement}
                  isSelected={isSuggestionSelected}
                  isRequired={isSuggestionRequired}
                  onSelectionChange={handleSelectionChange}
                  onRequiredClick={handleRequiredClick}
                  onEdit={openProductEditor}
                />
              )}
            </>
          )}
        </div>
      </WizardLayout>

      {editingSuggestion && editingProduct && (
        <ProductEditorModal
          suggestion={editingSuggestion}
          color={getEffectiveColor(editingSuggestion)}
          artworkSvg={artworkPreviewSvgsById[editingSuggestion.artworkTemplateId] ?? null}
          placement={editingProduct.placement}
          onPlacementChange={handleEditorPlacementChange}
          onSave={saveProductPlacement}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </>
  );
}
