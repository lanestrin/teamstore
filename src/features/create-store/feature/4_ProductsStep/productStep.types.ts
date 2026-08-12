import type { FunctionReturnType } from "convex/server";
import { api } from "../../../../../convex/_generated/api";
import type { ProductColorFamily } from "../../context/CreateStoreContext";
import type { DecorationProfileId } from "./decorationProfiles";
import type { ProductCollectionSection } from "./productCollections";

export type ProductOption = NonNullable<
  FunctionReturnType<typeof api.products.listProductOptionsByProviderIds>
>[number];

export type ProductColorOption = ProductOption["colorOptions"][number];

export interface GeneratedSuggestion {
  combinationKey: string;
  providerProductId: string;
  section: ProductCollectionSection;
  decorationProfileId: DecorationProfileId;
  product: ProductOption;
  color: ProductColorOption;
  artworkTemplateId: string;
}

export interface EditingProductState {
  suggestionKey: string;
  colorKey: string;
}

export interface ProductColorOptionDefinition {
  value: ProductColorFamily;
  label: string;
}
