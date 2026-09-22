import type { Dispatch, SetStateAction } from "react";

import type { ArtworkAdjustments } from "../lib/artworkEditor";
import type { ProductArtworkPlacement } from "../lib/decorationProfiles";
import type {
  LoadedProductSelection as BackendLoadedProductSelection,
  LoadedStoreDraft as BackendLoadedStoreDraft,
  StoreBuilderId,
  StoreBuilderStorageId,
  StoreType as BackendStoreType,
} from "../types/backend";
import type { ProductColorFamily } from "../types/productColor";

export type StoreType = BackendStoreType;
export type LoadedProductSelection = BackendLoadedProductSelection;
export type LoadedStoreDraft = BackendLoadedStoreDraft;

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
  storageId: StoreBuilderStorageId | null;
  storageUrl: string | null;
  isSelected: boolean;
}

export type ArtworkTemplatesDraft = Record<string, ArtworkTemplateDraft>;
export type ArtworkSvgMap = Readonly<Record<string, string>>;

export interface ProductSelectionInput {
  productId: StoreBuilderId;
  colorKey: string;
  artworkTemplateId: string;
  isRequired?: boolean;
  artworkPlacement?: ProductArtworkPlacement;
}

export interface ProductSelectionDraft {
  combinationKey: string;
  productId: StoreBuilderId;
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
  logoStorageId: StoreBuilderStorageId | null;
  logoUrl: string | null;

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
  storeId: StoreBuilderId | null;
  setStoreId: Dispatch<SetStateAction<StoreBuilderId | null>>;

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
