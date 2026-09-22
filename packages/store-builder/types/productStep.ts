import type { ProductColorOption, ProductOption, StoreBuilderId } from "./backend";
import type { ProductColorFamily } from "./productColor";
import type { DecorationProfileId, ProductArtworkPlacement } from "../lib/decorationProfiles";

export type { ProductColorOption, ProductOption } from "./backend";

export type ProductSuggestionSection = "uniforms" | "fanwear";

export interface GeneratedSuggestion {
  combinationKey: string;
  productId: StoreBuilderId;
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
