/* eslint-disable react-refresh/only-export-components */

import { createContext, useContext, useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { ART_TEMPLATE_LIST } from "../../../assets/art-templates";

import useFileDataUrl from "../hooks/useFileDataUrl";
import type { ProductColorFamily } from "../../../types/productColor.types";
import type { ArtworkAdjustments } from "../steps/3_ArtworkStep/lib/artworkEditor";
import { createCustomizedSvg, applySavedArtworkAdjustments } from "../steps/3_ArtworkStep/lib/artworkSvg";

const DEFAULT_PRIMARY_COLOR = "#111827";
const DEFAULT_SECONDARY_COLOR = "#DC2626";
const DEFAULT_PRODUCT_GENERATION_SEED = 1;

export interface ArtworkTextDraft {
  organizationName: string;
  yearEstablished: string;
  mascotName: string;
}

export interface ArtworkTemplateDraft {
  selectedArtTemplateId: string;
  isSelected: boolean;
  artworkAdjustments: ArtworkAdjustments;
}

export type ArtworkTemplatesDraft = Record<string, ArtworkTemplateDraft>;
export type ArtworkSvgMap = Readonly<Record<string, string>>;

export interface ProductSelectionInput {
  productId: Id<"products">;
  colorKey: string;
  artworkTemplateId: string;
  isRequired?: boolean;
}

export interface ProductSelectionDraft {
  combinationKey: string;
  productId: Id<"products">;
  colorKey: string;
  artworkTemplateId: string;
  isRequired: boolean;
}

export type ProductSelectionsDraft = Record<string, ProductSelectionDraft>;
export interface CreateStoreDraft {
  organizationName: string;
  organizationSlug: string;
  activity: string;
  storeName: string;
  storeSlug: string;
  storeDescription: string;
  logoFile: File | null;
  logoStorageId: Id<"_storage"> | null;
  artworkTemplates: ArtworkTemplatesDraft;
  artworkText: ArtworkTextDraft;
  productColorFamily: ProductColorFamily | "";
  productSecondaryColorFamily: ProductColorFamily | "";
  productGenerationSeed: number;
  productSelections: ProductSelectionsDraft;
}

interface CreateStoreContextValue {
  storeId: Id<"stores"> | null;
  setStoreId: Dispatch<SetStateAction<Id<"stores"> | null>>;

  currentStep: number;
  furthestStepReached: number;
  setCurrentStep: (step: number) => void;

  primaryColor: string;
  secondaryColor: string;

  setPrimaryColor: Dispatch<SetStateAction<string>>;
  setSecondaryColor: Dispatch<SetStateAction<string>>;

  storeDraft: CreateStoreDraft;

  resolvedArtworkText: ArtworkTextDraft;
  mascotDataUrl: string | null;
  artworkBaseSvgsByTemplateId: ArtworkSvgMap;
  artworkSvgsByTemplateId: ArtworkSvgMap;

  updateStoreDraft: (updates: Partial<CreateStoreDraft>) => void;
  updateArtworkTemplateDraft: (templateId: string, updates: Partial<Omit<ArtworkTemplateDraft, "selectedArtTemplateId">>) => void;
  selectProduct: (selection: ProductSelectionInput) => void;
  removeProduct: (combinationKey: string) => void;
  toggleProductRequired: (combinationKey: string) => void;

  updateProductSelection: (
    combinationKey: string,
    updates: {
      colorKey?: string;
      artworkTemplateId?: string;
    },
  ) => void;

  regenerateProductSuggestions: () => void;
  loadStoreDraft: (draft: Doc<"stores">) => void;
  resetStoreDraft: () => void;
}

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
    storeName: "",
    storeSlug: "",
    storeDescription: "",
    logoFile: null,
    logoStorageId: null,
    artworkTemplates: {},
    artworkText: {
      organizationName: "Smallville",
      yearEstablished: "2026",
      mascotName: "Crows",
    },
    productColorFamily: "",
    productSecondaryColorFamily: "",
    productGenerationSeed: DEFAULT_PRODUCT_GENERATION_SEED,
    productSelections: {},
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
  const resolvedArtworkText = useMemo<ArtworkTextDraft>(
    () => ({
      ...storeDraft.artworkText,

      organizationName: storeDraft.artworkText.organizationName || storeDraft.organizationName,
    }),
    [storeDraft.artworkText, storeDraft.organizationName],
  );

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
      const {
        [normalizedCombinationKey]: removedSelection,

        ...remainingSelections
      } = currentDraft.productSelections;

      if (!removedSelection) {
        return currentDraft;
      }

      return {
        ...currentDraft,

        productSelections: remainingSelections,
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

      return {
        ...currentDraft,

        productSelections: {
          ...currentDraft.productSelections,

          [normalizedCombinationKey]: {
            ...currentSelection,

            isRequired: !currentSelection.isRequired,
          },
        },
      };
    });
  }

  function updateProductSelection(
    combinationKey: string,
    updates: {
      colorKey?: string;
      artworkTemplateId?: string;
    },
  ) {
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
      const nextCombinationKey = createProductCombinationKey(currentSelection.productId, nextColorKey, nextArtworkTemplateId);

      if (nextCombinationKey === normalizedCombinationKey) {
        return currentDraft;
      }

      const existingNextSelection = currentDraft.productSelections[nextCombinationKey];

      const {
        [normalizedCombinationKey]: removedSelection,

        ...remainingSelections
      } = currentDraft.productSelections;

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
          },
        },
      };
    });
  }

  function regenerateProductSuggestions() {
    setStoreDraft((currentDraft) => ({
      ...currentDraft,

      productGenerationSeed: currentDraft.productGenerationSeed + 1,
    }));
  }

  function loadStoreDraft(draft: Doc<"stores">) {
    if (draft.status !== "draft") {
      throw new Error("Only draft stores can be loaded into the store wizard.");
    }

    setStoreId(draft._id);
    setCurrentStepState(draft.currentStep);
    setFurthestStepReached(draft.currentStep);
    setPrimaryColor(draft.primaryColor ?? DEFAULT_PRIMARY_COLOR);
    setSecondaryColor(draft.secondaryColor ?? DEFAULT_SECONDARY_COLOR);
    setStoreDraft({
      organizationName: draft.organizationName ?? "",
      organizationSlug: draft.organizationSlug ?? "",
      activity: draft.activity ?? "",
      storeName: draft.name ?? "",
      storeSlug: draft.slug ?? "",
      storeDescription: draft.description ?? "",
      logoFile: null,
      logoStorageId: draft.logoStorageId ?? null,
      artworkTemplates: {},

      artworkText: {
        organizationName: draft.organizationName ?? "",
        yearEstablished: "2020",
        mascotName: "MUSTANGS",
      },

      productColorFamily: "",
      productSecondaryColorFamily: "",
      productGenerationSeed: DEFAULT_PRODUCT_GENERATION_SEED,
      productSelections: {},
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
