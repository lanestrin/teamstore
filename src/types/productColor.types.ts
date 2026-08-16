/**
 * Shared color-classification types for catalog product colors.
 *
 * These types describe classification results only. They do not duplicate
 * Convex documents such as product colors, variants, or images.
 */

export type ProductColorFamily =
  | "black"
  | "white"
  | "gray"
  | "silver"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "navy"
  | "purple"
  | "pink"
  | "brown"
  | "multicolor"
  | "unknown";

export type ProductColorCategory =
  | "black"
  | "white"
  | "vintage-white"
  | "graphite"
  | "charcoal"
  | "light-charcoal"
  | "carbon"
  | "gray"
  | "silver"
  | "red"
  | "scarlet"
  | "cardinal"
  | "maroon"
  | "orange"
  | "burnt-orange"
  | "yellow"
  | "gold"
  | "light-gold"
  | "vegas-gold"
  | "green"
  | "forest"
  | "lime"
  | "teal"
  | "blue"
  | "columbia-blue"
  | "royal"
  | "navy"
  | "purple"
  | "pink"
  | "brown"
  | "tan"
  | "multicolor"
  | "unknown";

export type ProductColorTone = "light" | "medium" | "dark" | "unknown";

export type ProductColorPattern = "solid" | "heather" | "digital" | "camo" | "patterned" | "unknown";

export type ProductColorComposition = "single" | "two-tone" | "three-tone" | "multicolor" | "unknown";

export type ProductColorClassificationSource = "supplier-hex" | "name-rule" | "ai" | "manual";

export type ProductColorReviewReason =
  | "missing-hex"
  | "invalid-hex"
  | "conflicting-hex"
  | "compound-color"
  | "ambiguous-name"
  | "image-name-conflict"
  | "low-confidence"
  | "unknown-category"
  | "inconsistent-classification";

export interface ProductColorComponent {
  family: ProductColorFamily;
  category: ProductColorCategory;

  /**
   * Normalized six-digit hex value when one is known.
   * Example: "#101820"
   */
  hexValue?: string;
}

export interface ProductColorClassification {
  primary: ProductColorComponent;
  accents: ProductColorComponent[];

  tone: ProductColorTone;
  pattern: ProductColorPattern;
  composition: ProductColorComposition;

  source: ProductColorClassificationSource;

  /**
   * Classification confidence from 0 through 1.
   */
  confidence: number;

  needsReview: boolean;
  reviewReasons: ProductColorReviewReason[];
}
