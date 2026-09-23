import type { DecorationPreviewBounds, ProductArtworkPlacement } from "../lib/decorationProfiles";
import type { ProductColorFamily } from "./productColor";

export type StoreBuilderId = string;
export type StoreBuilderStorageId = string;

export type StoreType = "fanwear" | "uniform" | "hybrid";

export type StoreActivity =
  "basketball" | "baseball" | "football" | "soccer" | "softball" | "volleyball" | "wrestling" | "spirit-wear" | "other";

export type ProductColorTone = "light" | "medium" | "dark" | "unknown";
export type FilterableProductColorFamily = Exclude<ProductColorFamily, "unknown">;

export interface LoadedProductSelection {
  productId: StoreBuilderId;
  colorKey: string;
  artworkTemplateId: string;
  artworkPlacement?: ProductArtworkPlacement;
  isRequired: boolean;
}

export interface LoadedUploadedArtwork {
  id: string;
  fileName: string;
  storageId: StoreBuilderStorageId;
  storageUrl: string | null;
  isSelected: boolean;
}

export interface StoreBuilderArtworkText {
  organizationName: string;
  mascotName: string;
  yearEstablished: string;
}

export interface StoreBuilderArtworkAdjustment {
  elementId: string;
  x: number;
  y: number;
}

export interface StoreBuilderArtworkTemplate {
  artworkTemplateId: string;
  isSelected: boolean;
  adjustments: StoreBuilderArtworkAdjustment[];
}

export interface LoadedStoreDraft {
  _id: StoreBuilderId;
  status: "draft" | "active" | "archived";
  currentStep: number;

  organizationName?: string;
  organizationSlug?: string;
  activity?: StoreActivity;
  storeType?: StoreType;

  name?: string;
  slug?: string;
  description?: string;

  logoStorageId?: StoreBuilderStorageId;
  logoUrl: string | null;

  primaryColor?: string;
  secondaryColor?: string;

  productColorFamily?: ProductColorFamily;
  productSecondaryColorFamily?: ProductColorFamily;
  productGenerationSeed?: number;
  requiredItemsDeadline?: string;

  artworkText?: StoreBuilderArtworkText;
  artworkTemplates?: StoreBuilderArtworkTemplate[];
  uploadedArtworks?: LoadedUploadedArtwork[];
  productSelections?: LoadedProductSelection[];
}

export interface ProductColorOption {
  color: string;
  colorKey: string;

  imageUrl: string;
  decorationPreviewBounds?: DecorationPreviewBounds;

  colorFamilies: ProductColorFamily[];
  primaryHexValue?: string;
  tone: ProductColorTone;
}

export interface ProductOption {
  _id: StoreBuilderId;

  name: string;
  slug: string;
  category: string;
  activity?: StoreActivity;

  minPriceInCents: number | null;
  maxPriceInCents: number | null;

  colorOptions: ProductColorOption[];
}

export interface StoreCreationProducts {
  availableProductColorFamilies: ProductColorFamily[];
  uniforms: ProductOption[];
  fanwear: ProductOption[];
}

export interface StoreBuilderUploadedArtworkInput {
  id: string;
  fileName: string;
  storageId: StoreBuilderStorageId;
  isSelected: boolean;
}

export interface StoreBuilderProductSelectionInput {
  productId: StoreBuilderId;
  colorKey: string;
  artworkTemplateId: string;
  artworkPlacement?: ProductArtworkPlacement;
  isRequired: boolean;
}

export interface StoreBuilderArtworkSnapshotInput {
  artworkTemplateId: string;
  svg: string;
}

export interface SaveOrganizationStepInput {
  storeId?: StoreBuilderId;

  organizationName: string;
  organizationSlug: string;

  activity: StoreActivity;
  storeType: StoreType;

  storeName: string;
  storeSlug: string;

  logoStorageId?: StoreBuilderStorageId;
  removeLogo?: boolean;
}

export interface SaveOrganizationStepResult {
  storeId: StoreBuilderId;
  created: boolean;
}

export interface SaveColorsStepInput {
  storeId: StoreBuilderId;
  primaryColor: string;
  secondaryColor: string;
}

export interface SaveArtworkStepInput {
  storeId: StoreBuilderId;

  logoStorageId?: StoreBuilderStorageId;

  artworkText: StoreBuilderArtworkText;
  artworkTemplates: StoreBuilderArtworkTemplate[];
  uploadedArtworks: StoreBuilderUploadedArtworkInput[];
}

export interface SaveProductsStepInput {
  storeId: StoreBuilderId;

  activity: StoreActivity;
  productColorFamily: ProductColorFamily;
  productSecondaryColorFamily?: ProductColorFamily;
  productGenerationSeed: number;

  productSelections: StoreBuilderProductSelectionInput[];
  requiredItemsDeadline?: string;
}

export interface SaveDraftInput {
  storeId?: StoreBuilderId;

  organizationName?: string;
  organizationSlug?: string;

  activity?: StoreActivity;
  storeType?: StoreType;

  storeName?: string;
  storeSlug?: string;
  storeDescription?: string;

  logoStorageId?: StoreBuilderStorageId;
  uploadedArtworks: StoreBuilderUploadedArtworkInput[];

  primaryColor?: string;
  secondaryColor?: string;

  productSelections: StoreBuilderProductSelectionInput[];
  requiredItemsDeadline?: string;

  currentStep: number;
}

export interface SaveDraftResult {
  storeId: StoreBuilderId;
  created: boolean;
}

export interface FinalizeStoreInput {
  storeId: StoreBuilderId;
  artworkSnapshots: StoreBuilderArtworkSnapshotInput[];
}

export interface FinalizeStoreResult {
  organizationSlug: string;
  storeSlug: string;
}

export interface GetStoreCreationProductsInput {
  activity: StoreActivity;
  colorFamily?: FilterableProductColorFamily;
  selectedProductIds?: StoreBuilderId[];
}

export interface StoreBuilderAdapter {
  loadDraft(storeId: StoreBuilderId): Promise<LoadedStoreDraft | null>;

  uploadFile(file: File): Promise<StoreBuilderStorageId>;

  saveOrganizationStep(input: SaveOrganizationStepInput): Promise<SaveOrganizationStepResult>;

  saveColorsStep(input: SaveColorsStepInput): Promise<void>;

  saveArtworkStep(input: SaveArtworkStepInput): Promise<void>;

  saveProductsStep(input: SaveProductsStepInput): Promise<void>;

  saveDraft(input: SaveDraftInput): Promise<SaveDraftResult>;

  finalizeStore(input: FinalizeStoreInput): Promise<FinalizeStoreResult>;

  getStoreCreationProducts(input: GetStoreCreationProductsInput): Promise<StoreCreationProducts>;
}
