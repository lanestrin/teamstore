export type DecorationProfileId = "upper-front" | "left-leg" | "cap-front";

/*
 * Coordinates are normalized from 0–1.
 *
 * These bounds describe where a decoration may
 * be positioned in the product preview.
 *
 * They are NOT final production dimensions.
 */
export interface DecorationPreviewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/*
 * Saved relative to the decoration profile,
 * not relative to raw image pixels.
 *
 * x / y represent the artwork center.
 * width represents artwork width as a percentage
 * of the decoration zone.
 *
 * SVG aspect ratio determines the height.
 */
export interface ProductArtworkPlacement {
  x: number;
  y: number;
  width: number;
}

export interface DecorationProfile {
  id: DecorationProfileId;

  label: string;

  previewBounds: DecorationPreviewBounds;

  defaultPlacement: ProductArtworkPlacement;
}

export const PRODUCTION_PLACEMENT_DISCLAIMER =
  "Placement preview is approximate. Final production placement may be adjusted slightly to account for garment construction, seams, buttons, plackets, pockets, embroidery hooping, decoration method, and production tolerances.";

export const DECORATION_PROFILES: Record<DecorationProfileId, DecorationProfile> = {
  /*
   * Broad enough to support centered chest,
   * full front, or left/right chest positioning.
   *
   * The user chooses the exact placement.
   */
  "upper-front": {
    id: "upper-front",

    label: "Upper Front",

    previewBounds: {
      x: 0.28,
      y: 0.17,
      width: 0.44,
      height: 0.5,
    },

    defaultPlacement: {
      x: 0.5,
      y: 0.42,
      width: 0.68,
    },
  },

  /*
   * Used for shorts and similar lower-body
   * products where decoration belongs on
   * the left leg.
   */
  "left-leg": {
    id: "left-leg",

    label: "Left Leg",

    previewBounds: {
      x: 0.19,
      y: 0.29,
      width: 0.28,
      height: 0.5,
    },

    defaultPlacement: {
      x: 0.5,
      y: 0.45,
      width: 0.68,
    },
  },

  /*
   * Front decoration region for caps.
   *
   * Production embroidery restrictions will
   * eventually be applied separately according
   * to the embellishment method and product.
   */
  "cap-front": {
    id: "cap-front",

    label: "Cap Front",

    previewBounds: {
      x: 0.27,
      y: 0.28,
      width: 0.46,
      height: 0.26,
    },

    defaultPlacement: {
      x: 0.5,
      y: 0.5,
      width: 0.76,
    },
  },
};

export function getDecorationProfile(profileId: DecorationProfileId): DecorationProfile {
  return DECORATION_PROFILES[profileId];
}

export function getDecorationProfileIdForProductCategory(category: string): DecorationProfileId {
  const normalizedCategory = category.trim().toLowerCase();

  if (normalizedCategory === "hats") {
    return "cap-front";
  }

  if (normalizedCategory === "shorts" || normalizedCategory === "pants & joggers") {
    return "left-leg";
  }

  return "upper-front";
}

export function createDefaultProductArtworkPlacement(profileId: DecorationProfileId): ProductArtworkPlacement {
  const placement = DECORATION_PROFILES[profileId].defaultPlacement;

  return {
    ...placement,
  };
}
