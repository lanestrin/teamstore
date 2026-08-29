import type { FunctionReturnType } from "convex/server";
import { api } from "../../../../../../convex/_generated/api";
import type { ProductColorFamily } from "../../../../../types/productColor.types";
import type { DecorationProfileId, ProductArtworkPlacement } from "./decorationProfiles";
import type { Id } from "../../../../../../convex/_generated/dataModel";

type StoreCreationProducts = NonNullable<FunctionReturnType<typeof api.storeProductCatalog.getStoreCreationProducts>>;

export type ProductOption = StoreCreationProducts["uniforms"][number];
export type ProductColorOption = ProductOption["colorOptions"][number];
export type ProductSuggestionSection = "uniforms" | "fanwear";

export interface GeneratedSuggestion {
  combinationKey: string;
  productId: Id<"products">;
  section: ProductSuggestionSection;
  decorationProfileId: DecorationProfileId;
  product: ProductOption;
  color: ProductColorOption;
  artworkTemplateId: string;
}

export interface EditingProductState {
  suggestionKey: string;
  placement: ProductArtworkPlacement;
}

export interface ProductColorOptionDefinition {
  value: ProductColorFamily;
  label: string;
}
