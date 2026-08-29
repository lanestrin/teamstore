/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { ART_TEMPLATE_LIST } from "../../../assets/art-templates";

import type { ProductColorFamily } from "../../../types/productColor.types";
import useFileDataUrl from "../hooks/useFileDataUrl";
import { createCustomizedSvg, applySavedArtworkAdjustments } from "../steps/3_ArtworkStep/lib/artworkSvg";

import type {
  ArtworkTemplateDraft,
  CreateStoreContextValue,
  CreateStoreDraft,
  LoadedStoreDraft,
  ProductSelectionInput,
  ProductSelectionsDraft,
  ProductSelectionUpdates,
} from "./CreateStoreContext.types";

const DEFAULT_PRIMARY_COLOR = "#111827";
const DEFAULT_SECONDARY_COLOR = "#DC2626";
const DEFAULT_PRODUCT_GENERATION_SEED = 1;

export function createProductCombinationKey(productId: string, colorKey: string, artworkTemplateId: string): string {
  return [productId.trim(), colorKey.trim(), artworkTemplateId.trim()].map((value) => encodeURIComponent(value)).join("__");
}

export function classifyHexColorFamily(hexColor: string): ProductColorFamily {
  const normalized = hexColor.trim().replace("#", "");

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return "black";
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const green = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(normalized.slice(4, 6), 16) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const lightness = (maximum + minimum) / 2;
  const difference = maximum - minimum;

  if (lightness <= 0.12) {
    return "black";
  }

  if (lightness >= 0.9 && difference <= 0.12) {
    return "white";
  }

  if (difference <= 0.1) {
    if (lightness >= 0.7) {
      return "silver";
    }

    return "gray";
  }

  let hue: number;

  if (maximum === red) {
    hue = ((green - blue) / difference) % 6;
  } else if (maximum === green) {
    hue = (blue - red) / difference + 2;
  } else {
    hue = (red - green) / difference + 4;
  }

  hue *= 60;

  if (hue < 0) {
    hue += 360;
  }

  if (hue >= 345 || hue < 15) {
    return "red";
  }

  if (hue < 45) {
    if (lightness < 0.35) {
      return "brown";
    }

    return "orange";
  }

  if (hue < 70) {
    return "yellow";
  }

  if (hue < 170) {
    return "green";
  }

  if (hue >= 195 && hue < 255 && lightness < 0.28) {
    return "navy";
  }

  if (hue < 260) {
    return "blue";
  }

  if (hue < 320) {
    return "purple";
  }

  return "pink";
}

function createDefaultStoreDraft(): CreateStoreDraft {
  return {
    organizationName: "",
    organizationSlug: "",
    activity: "",
    storeType: "",
    storeName: "",
    storeSlug: "",
    storeDescription: "",
    logoFile: null,
    logoStorageId: null,
    artworkTemplates: {},
    uploadedArtworks: [],
    artworkText: {
      organizationName: "YOUR TEAM",
      mascotName: "Mascot",
      yearEstablished: new Date().getFullYear().toString(),
    },
    productColorFamily: "",
    productSecondaryColorFamily: "",
    productGenerationSeed: DEFAULT_PRODUCT_GENERATION_SEED,
    productSelections: {},
    requiredItemsDeadline: "",
  };
}

const CreateStoreContext = createContext<CreateStoreContextValue | null>(null);

interface CreateStoreProviderProps {
  children: ReactNode;
}

export function CreateStoreProvider({ children }: CreateStoreProviderProps) {
  const [storeId, setStoreId] = useState<Id<"stores"> | null>(null);
  const [currentStep, setCurrentStepState] = useState(1);
  const [furthestStepReached, setFurthestStepReached] = useState(1);
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY_COLOR);
  const [storeDraft, setStoreDraft] = useState<CreateStoreDraft>(createDefaultStoreDraft);
  const mascotDataUrl = useFileDataUrl(storeDraft.logoFile);
  const [fontLoadVersion, setFontLoadVersion] = useState(0);
  const resolvedArtworkText = storeDraft.artworkText;

  /*
   * Text fitting depends on the final loaded font metrics.
   * Rebuild the derived SVG maps once browser fonts are ready.
   */
  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) {
      return;
    }

    let isCancelled = false;

    void document.fonts.ready.then(() => {
      if (!isCancelled) {
        setFontLoadVersion((currentVersion) => currentVersion + 1);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const { artworkBaseSvgsByTemplateId, artworkSvgsByTemplateId } = useMemo(() => {
    /*
     * Font loading affects SVG text measurement even
     * though the version value itself is not rendered.
     * Referencing it here intentionally invalidates
     * this memo when fonts finish loading.
     */
    void fontLoadVersion;

    const baseSvgs: Record<string, string> = {};
    const finalSvgs: Record<string, string> = {};

    for (const template of ART_TEMPLATE_LIST) {
      const templateDraft = storeDraft.artworkTemplates[template.id];
      const baseSvg = createCustomizedSvg(template, resolvedArtworkText, mascotDataUrl);

      baseSvgs[template.id] = baseSvg;
      finalSvgs[template.id] = applySavedArtworkAdjustments(baseSvg, template.editableElements, templateDraft?.artworkAdjustments ?? {});
    }

    return {
      artworkBaseSvgsByTemplateId: baseSvgs,
      artworkSvgsByTemplateId: finalSvgs,
    };
  }, [fontLoadVersion, mascotDataUrl, resolvedArtworkText, storeDraft.artworkTemplates]);

  useEffect(() => {
    if (currentStep !== 4 || storeDraft.productColorFamily) {
      return;
    }

    setStoreDraft((currentDraft) => {
      if (currentDraft.productColorFamily) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        productColorFamily: classifyHexColorFamily(primaryColor),
        productSecondaryColorFamily: classifyHexColorFamily(secondaryColor),
      };
    });
  }, [currentStep, primaryColor, secondaryColor, storeDraft.productColorFamily]);

  function updateStoreDraft(updates: Partial<CreateStoreDraft>) {
    setStoreDraft((currentDraft) => ({
      ...currentDraft,
      ...updates,
    }));
  }

  function updateArtworkTemplateDraft(templateId: string, updates: Partial<Omit<ArtworkTemplateDraft, "selectedArtTemplateId">>) {
    setStoreDraft((currentDraft) => {
      const currentTemplateDraft = currentDraft.artworkTemplates[templateId] ?? {
        selectedArtTemplateId: templateId,
        isSelected: false,
        artworkAdjustments: {},
      };

      return {
        ...currentDraft,
        artworkTemplates: {
          ...currentDraft.artworkTemplates,
          [templateId]: {
            ...currentTemplateDraft,
            ...updates,
            selectedArtTemplateId: templateId,
          },
        },
      };
    });
  }

  function selectProduct(selection: ProductSelectionInput) {
    const productId = selection.productId.trim() as Id<"products">;
    const colorKey = selection.colorKey.trim();
    const artworkTemplateId = selection.artworkTemplateId.trim();

    if (!productId || !colorKey || !artworkTemplateId) {
      return;
    }

    const combinationKey = createProductCombinationKey(productId, colorKey, artworkTemplateId);

    setStoreDraft((currentDraft) => {
      const existingSelection = currentDraft.productSelections[combinationKey];

      return {
        ...currentDraft,
        productSelections: {
          ...currentDraft.productSelections,
          [combinationKey]: {
            combinationKey,
            productId,
            colorKey,
            artworkTemplateId,
            isRequired: existingSelection?.isRequired ?? selection.isRequired ?? false,
            artworkPlacement:
              existingSelection?.artworkPlacement ?? (selection.artworkPlacement ? { ...selection.artworkPlacement } : undefined),
          },
        },
      };
    });
  }

  function removeProduct(combinationKey: string) {
    const normalizedCombinationKey = combinationKey.trim();

    if (!normalizedCombinationKey) {
      return;
    }

    setStoreDraft((currentDraft) => {
      const { [normalizedCombinationKey]: removedSelection, ...remainingSelections } = currentDraft.productSelections;

      if (!removedSelection) {
        return currentDraft;
      }

      const hasRequiredProducts = Object.values(remainingSelections).some((selection) => selection.isRequired);

      return {
        ...currentDraft,
        productSelections: remainingSelections,
        requiredItemsDeadline: hasRequiredProducts ? currentDraft.requiredItemsDeadline : "",
      };
    });
  }

  function toggleProductRequired(combinationKey: string) {
    const normalizedCombinationKey = combinationKey.trim();

    if (!normalizedCombinationKey) {
      return;
    }

    setStoreDraft((currentDraft) => {
      const currentSelection = currentDraft.productSelections[normalizedCombinationKey];

      if (!currentSelection) {
        return currentDraft;
      }

      const nextProductSelections = {
        ...currentDraft.productSelections,
        [normalizedCombinationKey]: {
          ...currentSelection,
          isRequired: !currentSelection.isRequired,
        },
      };

      const hasRequiredProducts = Object.values(nextProductSelections).some((selection) => selection.isRequired);

      return {
        ...currentDraft,
        productSelections: nextProductSelections,
        requiredItemsDeadline: hasRequiredProducts ? currentDraft.requiredItemsDeadline : "",
      };
    });
  }

  function updateProductSelection(combinationKey: string, updates: ProductSelectionUpdates) {
    const normalizedCombinationKey = combinationKey.trim();

    if (!normalizedCombinationKey) {
      return;
    }

    setStoreDraft((currentDraft) => {
      const currentSelection = currentDraft.productSelections[normalizedCombinationKey];

      if (!currentSelection) {
        return currentDraft;
      }

      const nextColorKey = updates.colorKey?.trim() || currentSelection.colorKey;
      const nextArtworkTemplateId = updates.artworkTemplateId?.trim() || currentSelection.artworkTemplateId;
      const nextArtworkPlacement = updates.artworkPlacement
        ? { ...updates.artworkPlacement }
        : currentSelection.artworkPlacement
          ? { ...currentSelection.artworkPlacement }
          : undefined;

      const nextCombinationKey = createProductCombinationKey(currentSelection.productId, nextColorKey, nextArtworkTemplateId);

      if (nextCombinationKey === normalizedCombinationKey) {
        if (!updates.artworkPlacement) {
          return currentDraft;
        }

        return {
          ...currentDraft,
          productSelections: {
            ...currentDraft.productSelections,
            [normalizedCombinationKey]: {
              ...currentSelection,
              artworkPlacement: nextArtworkPlacement,
            },
          },
        };
      }

      const existingNextSelection = currentDraft.productSelections[nextCombinationKey];

      const { [normalizedCombinationKey]: removedSelection, ...remainingSelections } = currentDraft.productSelections;

      void removedSelection;

      return {
        ...currentDraft,
        productSelections: {
          ...remainingSelections,
          [nextCombinationKey]: {
            combinationKey: nextCombinationKey,
            productId: currentSelection.productId,
            colorKey: nextColorKey,
            artworkTemplateId: nextArtworkTemplateId,
            isRequired: currentSelection.isRequired || existingNextSelection?.isRequired === true,
            artworkPlacement: existingNextSelection?.artworkPlacement ?? nextArtworkPlacement,
          },
        },
      };
    });
  }

  function resetProductStep() {
    setStoreDraft((currentDraft) => {
      const hasProductStepState =
        Boolean(currentDraft.productColorFamily) ||
        Boolean(currentDraft.productSecondaryColorFamily) ||
        Object.keys(currentDraft.productSelections).length > 0 ||
        Boolean(currentDraft.requiredItemsDeadline) ||
        currentDraft.productGenerationSeed !== DEFAULT_PRODUCT_GENERATION_SEED;

      if (!hasProductStepState) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        productColorFamily: "",
        productSecondaryColorFamily: "",
        productGenerationSeed: DEFAULT_PRODUCT_GENERATION_SEED,
        productSelections: {},
        requiredItemsDeadline: "",
      };
    });
  }

  function regenerateProductSuggestions() {
    setStoreDraft((currentDraft) => ({
      ...currentDraft,
      productGenerationSeed: currentDraft.productGenerationSeed + 1,
    }));
  }

  function loadStoreDraft(draft: LoadedStoreDraft) {
    if (draft.status !== "draft") {
      throw new Error("Only draft stores can be loaded into the store wizard.");
    }

    const productSelections = (draft.productSelections ?? []).reduce<ProductSelectionsDraft>((selections, selection) => {
      const combinationKey = createProductCombinationKey(selection.productId, selection.colorKey, selection.artworkTemplateId);

      selections[combinationKey] = {
        combinationKey,
        productId: selection.productId,
        colorKey: selection.colorKey,
        artworkTemplateId: selection.artworkTemplateId,
        isRequired: selection.isRequired,
      };

      return selections;
    }, {});

    const hasRequiredProducts = Object.values(productSelections).some((selection) => selection.isRequired);

    setStoreId(draft._id);
    setCurrentStepState(draft.currentStep);
    setFurthestStepReached(draft.currentStep);
    setPrimaryColor(draft.primaryColor ?? DEFAULT_PRIMARY_COLOR);
    setSecondaryColor(draft.secondaryColor ?? DEFAULT_SECONDARY_COLOR);

    setStoreDraft({
      organizationName: draft.organizationName ?? "",
      organizationSlug: draft.organizationSlug ?? "",
      activity: draft.activity ?? "",
      storeType: draft.storeType ?? "",
      storeName: draft.name ?? "",
      storeSlug: draft.slug ?? "",
      storeDescription: draft.description ?? "",
      logoFile: null,
      logoStorageId: draft.logoStorageId ?? null,
      artworkTemplates: {},

      uploadedArtworks: (draft.uploadedArtworks ?? []).map((artwork) => ({
        id: artwork.id,
        fileName: artwork.fileName,
        file: null,
        storageId: artwork.storageId,
        storageUrl: artwork.storageUrl,
        isSelected: artwork.isSelected,
      })),

      artworkText: {
        organizationName: "YOUR TEAM",
        mascotName: "Mascot",
        yearEstablished: new Date().getFullYear().toString(),
      },

      productColorFamily: "",
      productSecondaryColorFamily: "",
      productGenerationSeed: DEFAULT_PRODUCT_GENERATION_SEED,
      productSelections,
      requiredItemsDeadline: hasRequiredProducts ? (draft.requiredItemsDeadline ?? "") : "",
    });
  }

  function setCurrentStep(step: number) {
    setCurrentStepState(step);
    setFurthestStepReached((currentFurthestStep) => Math.max(currentFurthestStep, step));
  }

  function resetStoreDraft() {
    setStoreId(null);
    setCurrentStepState(1);
    setFurthestStepReached(1);

    setPrimaryColor(DEFAULT_PRIMARY_COLOR);
    setSecondaryColor(DEFAULT_SECONDARY_COLOR);
    setStoreDraft(createDefaultStoreDraft());
  }

  return (
    <CreateStoreContext.Provider
      value={{
        storeId,
        setStoreId,

        currentStep,
        furthestStepReached,
        setCurrentStep,

        primaryColor,
        secondaryColor,
        setPrimaryColor,
        setSecondaryColor,

        storeDraft,

        resolvedArtworkText,
        mascotDataUrl,
        artworkBaseSvgsByTemplateId,
        artworkSvgsByTemplateId,

        updateStoreDraft,
        updateArtworkTemplateDraft,

        selectProduct,
        removeProduct,
        toggleProductRequired,
        updateProductSelection,
        regenerateProductSuggestions,
        resetProductStep,

        loadStoreDraft,
        resetStoreDraft,
      }}
    >
      {children}
    </CreateStoreContext.Provider>
  );
}

export function useCreateStore() {
  const context = useContext(CreateStoreContext);

  if (!context) {
    throw new Error("useCreateStore must be used within CreateStoreProvider.");
  }

  return context;
}
