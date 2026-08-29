import type { Dispatch, SetStateAction } from "react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";

import type { ProductColorFamily } from "../../../types/productColor.types";
import type { ArtworkAdjustments } from "../steps/3_ArtworkStep/lib/artworkEditor";
import type { ProductArtworkPlacement } from "../steps/4_ProductsStep/lib/decorationProfiles";

export type StoreType = "fanwear" | "uniform" | "hybrid";

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

export interface UploadedArtworkDraft {
  id: string;
  fileName: string;
  file: File | null;
  storageId: Id<"_storage"> | null;
  storageUrl: string | null;
  isSelected: boolean;
}

export interface LoadedProductSelection {
  productId: Id<"products">;
  colorKey: string;
  artworkTemplateId: string;
  isRequired: boolean;
}

export interface LoadedStoreDraft extends Omit<Doc<"stores">, "uploadedArtworks"> {
  uploadedArtworks?: Array<{
    id: string;
    fileName: string;
    storageId: Id<"_storage">;
    storageUrl: string | null;
    isSelected: boolean;
  }>;

  productSelections?: LoadedProductSelection[];
}

export type ArtworkTemplatesDraft = Record<string, ArtworkTemplateDraft>;
export type ArtworkSvgMap = Readonly<Record<string, string>>;

export interface ProductSelectionInput {
  productId: Id<"products">;
  colorKey: string;
  artworkTemplateId: string;
  isRequired?: boolean;
  artworkPlacement?: ProductArtworkPlacement;
}

export interface ProductSelectionDraft {
  combinationKey: string;
  productId: Id<"products">;
  colorKey: string;
  artworkTemplateId: string;
  isRequired: boolean;
  artworkPlacement?: ProductArtworkPlacement;
}

export type ProductSelectionsDraft = Record<string, ProductSelectionDraft>;

export interface ProductSelectionUpdates {
  colorKey?: string;
  artworkTemplateId?: string;
  artworkPlacement?: ProductArtworkPlacement;
}

export interface CreateStoreDraft {
  organizationName: string;
  organizationSlug: string;
  activity: string;
  storeType: StoreType | "";

  storeName: string;
  storeSlug: string;
  storeDescription: string;

  logoFile: File | null;
  logoStorageId: Id<"_storage"> | null;

  artworkTemplates: ArtworkTemplatesDraft;
  uploadedArtworks: UploadedArtworkDraft[];
  artworkText: ArtworkTextDraft;

  productColorFamily: ProductColorFamily | "";
  productSecondaryColorFamily: ProductColorFamily | "";
  productGenerationSeed: number;
  productSelections: ProductSelectionsDraft;
  requiredItemsDeadline: string;
}

export interface CreateStoreContextValue {
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
  updateProductSelection: (combinationKey: string, updates: ProductSelectionUpdates) => void;

  regenerateProductSuggestions: () => void;
  resetProductStep: () => void;

  loadStoreDraft: (draft: LoadedStoreDraft) => void;
  resetStoreDraft: () => void;
}
