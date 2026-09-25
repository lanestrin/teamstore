import type { FunctionReturnType } from "convex/server";

import { api } from "../../../convex/_generated/api";
import type { ProductSelectionsDraft } from "../../../packages/store-builder/context/CreateStoreContext.types";
import type { ProductArtworkPlacement } from "../../../packages/store-builder/lib/decorationProfiles";
import type { ProductColorFamily } from "../../../packages/store-builder/types/productColor";
import type {
  GeneratedSuggestion,
  ProductColorOption,
} from "../../../packages/store-builder/types/productStep";

export type ManagedStore = NonNullable<FunctionReturnType<typeof api.stores.getStoreForManagement>>;
export type ManagedStoreProduct = ManagedStore["products"][number];

export type StoreActivity =
  | "basketball"
  | "baseball"
  | "football"
  | "soccer"
  | "softball"
  | "volleyball"
  | "wrestling"
  | "spirit-wear"
  | "other";

export interface EditableProductState {
  activity: StoreActivity;
  primaryColorFamily: ProductColorFamily;
  secondaryColorFamily: ProductColorFamily | "";
  generationSeed: number;
  selections: ProductSelectionsDraft;
  requiredItemsDeadline: string;
}

export interface EditingProductState {
  suggestionKey: string;
  artworkTemplateId: string;
  placement: ProductArtworkPlacement;
}

export interface ProductArtworkOption {
  id: string;
  label: string;
}

export interface ManagedProductPreview {
  suggestion: GeneratedSuggestion;
  color: ProductColorOption;
  artworkSvg: string | null;
  placement: ProductArtworkPlacement;
}
