import type {
  ProductColorCategory,
  ProductColorClassification,
  ProductColorClassificationSource,
  ProductColorComponent,
  ProductColorFamily,
  ProductColorPattern,
  ProductColorReviewReason,
  ProductColorTone,
} from "../types/productColor.types";

export interface ClassifyProductColorInput {
  /** Supplier color name, such as "BA NAVY/WHITE". */
  providerColor: string;

  /**
   * Optional supplier hex data. A single value such as "#041E42" and a
   * compound value such as "#041E42|#FFFFFF" are both supported.
   */
  hexValue?: string | null;
}

interface NameRuleResult {
  component: ProductColorComponent;
  recognized: boolean;
  tone?: ProductColorTone;
}

interface HslColor {
  hue: number;
  saturation: number;
  lightness: number;
}

const UNKNOWN_COMPONENT: ProductColorComponent = {
  family: "unknown",
  category: "unknown",
};

const CATEGORY_FAMILY: Record<ProductColorCategory, ProductColorFamily> = {
  black: "black",
  white: "white",
  "vintage-white": "white",
  graphite: "gray",
  charcoal: "gray",
  "light-charcoal": "gray",
  carbon: "gray",
  gray: "gray",
  silver: "silver",
  red: "red",
  scarlet: "red",
  cardinal: "red",
  maroon: "red",
  orange: "orange",
  "burnt-orange": "orange",
  yellow: "yellow",
  gold: "yellow",
  "light-gold": "yellow",
  "vegas-gold": "yellow",
  green: "green",
  forest: "green",
  lime: "green",
  teal: "green",
  blue: "blue",
  "columbia-blue": "blue",
  royal: "blue",
  navy: "navy",
  purple: "purple",
  pink: "pink",
  brown: "brown",
  tan: "brown",
  multicolor: "multicolor",
  unknown: "unknown",
};

const DEFAULT_CATEGORY_TONE: Record<ProductColorCategory, ProductColorTone> = {
  black: "dark",
  white: "light",
  "vintage-white": "light",
  graphite: "medium",
  charcoal: "dark",
  "light-charcoal": "medium",
  carbon: "dark",
  gray: "medium",
  silver: "light",
  red: "medium",
  scarlet: "medium",
  cardinal: "dark",
  maroon: "dark",
  orange: "medium",
  "burnt-orange": "dark",
  yellow: "light",
  gold: "medium",
  "light-gold": "light",
  "vegas-gold": "medium",
  green: "medium",
  forest: "dark",
  lime: "light",
  teal: "medium",
  blue: "medium",
  "columbia-blue": "light",
  royal: "medium",
  navy: "dark",
  purple: "dark",
  pink: "light",
  brown: "dark",
  tan: "light",
  multicolor: "unknown",
  unknown: "unknown",
};

const EXACT_NAME_RULES: Record<string, { category: ProductColorCategory; tone?: ProductColorTone }> = {
  BLACK: { category: "black" },
  WHITE: { category: "white" },
  "VINTAGE WHITE": { category: "vintage-white" },

  GRAPHITE: { category: "graphite" },
  CHARCOAL: { category: "charcoal" },
  "LIGHT CHARCOAL": { category: "light-charcoal" },
  CARBON: { category: "carbon" },
  GRAY: { category: "gray" },
  GREY: { category: "gray" },
  "ATHLETIC GRAY": { category: "gray" },
  "ATHLETIC GREY": { category: "gray" },
  SILVER: { category: "silver" },

  RED: { category: "red" },
  SCARLET: { category: "scarlet" },
  CARDINAL: { category: "cardinal" },
  MAROON: { category: "maroon" },
  "LIGHT MAROON": { category: "maroon", tone: "light" },

  ORANGE: { category: "orange" },
  "BURNT ORANGE": { category: "burnt-orange" },
  YELLOW: { category: "yellow" },
  GOLD: { category: "gold" },
  "LIGHT GOLD": { category: "light-gold" },
  VEGAS: { category: "vegas-gold" },
  "VEGAS GOLD": { category: "vegas-gold" },

  GREEN: { category: "green" },
  FOREST: { category: "forest" },
  "FOREST GREEN": { category: "forest" },
  LIME: { category: "lime" },
  TEAL: { category: "teal" },

  BLUE: { category: "blue" },
  "COLUMBIA BLUE": { category: "columbia-blue" },
  ROYAL: { category: "royal" },
  "ROYAL BLUE": { category: "royal" },
  NAVY: { category: "navy" },

  PURPLE: { category: "purple" },
  PINK: { category: "pink" },
  BROWN: { category: "brown" },
  TAN: { category: "tan" },
};

/**
 * Removes supplier-only prefixes and normalizes separators without changing
 * the semantic order of compound colors.
 */
export function normalizeProductColorName(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/^BA\s+/, "")
    .replace(/\bBT\.\s*/g, "BURNT ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s*&\s*/g, " & ")
    .replace(/\s*\+\s*/g, " + ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Returns every normalized six-digit hex value found in supplier data. */
export function extractProductColorHexValues(value?: string | null): string[] {
  const normalizedInput = value?.trim();

  if (!normalizedInput) {
    return [];
  }

  const matches = normalizedInput.match(/#?(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g) ?? [];

  return [
    ...new Set(
      matches.map((match) => {
        const token = match.replace(/^#/, "").toUpperCase();

        if (token.length === 3) {
          return `#${token
            .split("")
            .map((character) => `${character}${character}`)
            .join("")}`;
        }

        return `#${token}`;
      }),
    ),
  ];
}

function detectPattern(normalizedName: string): ProductColorPattern {
  if (/\bHEATHER\b|\bHEATH\b|\bHTHR\b|\bMARLED\b|\bMELANGE\b/.test(normalizedName)) {
    return "heather";
  }

  if (/\bDIGITAL\b/.test(normalizedName)) {
    return "digital";
  }

  if (/\bCAMO\b|\bCAMOUFLAGE\b/.test(normalizedName)) {
    return "camo";
  }

  if (/\bPATTERN(?:ED)?\b|\bSTRIPE(?:D)?\b|\bTIE[- ]?DYE\b|\bOMBRE\b|\bSPECKLED\b/.test(normalizedName)) {
    return "patterned";
  }

  return "solid";
}

function stripPatternWords(value: string): string {
  return value
    .replace(
      /\b(?:HEATHER|HEATH|HTHR|MARLED|MELANGE|DIGITAL|CAMO|CAMOUFLAGE|PATTERNED|PATTERN|STRIPED|STRIPE|TIE[- ]?DYE|OMBRE|SPECKLED|SOLID)\b/g,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

function splitColorComponents(normalizedName: string): string[] {
  const withoutPattern = stripPatternWords(normalizedName);

  return withoutPattern
    .split(/\s*(?:\/|&|\+|\bAND\b)\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function componentFromCategory(category: ProductColorCategory, hexValue?: string): ProductColorComponent {
  return {
    family: CATEGORY_FAMILY[category],
    category,
    ...(hexValue ? { hexValue } : {}),
  };
}

function classifyNameComponent(value: string): NameRuleResult {
  const normalized = stripPatternWords(value);
  const exactRule = EXACT_NAME_RULES[normalized];

  if (exactRule) {
    return {
      component: componentFromCategory(exactRule.category),
      recognized: true,
      tone: exactRule.tone,
    };
  }

  return {
    component: { ...UNKNOWN_COMPONENT },
    recognized: false,
  };
}

function hexToRgb(hexValue: string) {
  const token = hexValue.replace(/^#/, "");

  return {
    red: Number.parseInt(token.slice(0, 2), 16),
    green: Number.parseInt(token.slice(2, 4), 16),
    blue: Number.parseInt(token.slice(4, 6), 16),
  };
}

function rgbToHsl(red: number, green: number, blue: number): HslColor {
  const normalizedRed = red / 255;
  const normalizedGreen = green / 255;
  const normalizedBlue = blue / 255;

  const maximum = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
  const minimum = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
  const delta = maximum - minimum;
  const lightness = (maximum + minimum) / 2;

  if (delta === 0) {
    return {
      hue: 0,
      saturation: 0,
      lightness,
    };
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));

  let hue: number;

  if (maximum === normalizedRed) {
    hue = 60 * (((normalizedGreen - normalizedBlue) / delta) % 6);
  } else if (maximum === normalizedGreen) {
    hue = 60 * ((normalizedBlue - normalizedRed) / delta + 2);
  } else {
    hue = 60 * ((normalizedRed - normalizedGreen) / delta + 4);
  }

  if (hue < 0) {
    hue += 360;
  }

  return {
    hue,
    saturation,
    lightness,
  };
}

function channelToLinear(channel: number) {
  const normalized = channel / 255;

  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(hexValue: string) {
  const { red, green, blue } = hexToRgb(hexValue);

  return 0.2126 * channelToLinear(red) + 0.7152 * channelToLinear(green) + 0.0722 * channelToLinear(blue);
}

function getToneFromHex(hexValue: string): ProductColorTone {
  const luminance = getRelativeLuminance(hexValue);

  if (luminance <= 0.18) {
    return "dark";
  }

  if (luminance >= 0.65) {
    return "light";
  }

  return "medium";
}

function classifyHexComponent(hexValue: string): ProductColorComponent {
  const { red, green, blue } = hexToRgb(hexValue);
  const { hue, saturation, lightness } = rgbToHsl(red, green, blue);
  const chroma = (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;

  /**
   * Very dark near-neutral colors should be treated as black before hue is
   * considered. Without this check, values such as #101820 can appear blue
   * even though suppliers use them as garment black.
   */
  if (lightness <= 0.16 && chroma <= 0.08) {
    return componentFromCategory("black", hexValue);
  }

  /**
   * Apply the same principle at the light end of the spectrum so a nearly
   * neutral off-white is not classified from a weak hue.
   */
  if (lightness >= 0.92 && chroma <= 0.08) {
    return componentFromCategory("white", hexValue);
  }

  if (saturation <= 0.12) {
    if (lightness <= 0.14) {
      return componentFromCategory("black", hexValue);
    }

    if (lightness >= 0.9) {
      return componentFromCategory("white", hexValue);
    }

    if (lightness >= 0.68) {
      return componentFromCategory("silver", hexValue);
    }

    return componentFromCategory("gray", hexValue);
  }

  if (hue >= 345 || hue < 12) {
    return componentFromCategory(lightness < 0.32 ? "maroon" : "red", hexValue);
  }

  if (hue < 45) {
    return componentFromCategory(lightness < 0.28 ? "brown" : "orange", hexValue);
  }

  if (hue < 70) {
    return componentFromCategory(lightness < 0.58 ? "gold" : "yellow", hexValue);
  }

  if (hue < 165) {
    return componentFromCategory(lightness < 0.28 ? "forest" : hue < 95 && lightness > 0.55 ? "lime" : "green", hexValue);
  }

  if (hue < 195) {
    return componentFromCategory("teal", hexValue);
  }

  if (hue < 255) {
    if (lightness < 0.28) {
      return componentFromCategory("navy", hexValue);
    }

    if (saturation >= 0.55 && lightness <= 0.58) {
      return componentFromCategory("royal", hexValue);
    }

    if (lightness >= 0.58) {
      return componentFromCategory("columbia-blue", hexValue);
    }

    return componentFromCategory("blue", hexValue);
  }

  if (hue < 315) {
    return componentFromCategory("purple", hexValue);
  }

  if (hue < 345) {
    return componentFromCategory("pink", hexValue);
  }

  return componentFromCategory("red", hexValue);
}

function areFamiliesCompatible(nameFamily: ProductColorFamily, hexFamily: ProductColorFamily) {
  if (nameFamily === hexFamily) {
    return true;
  }

  const compatiblePairs: Array<[ProductColorFamily, ProductColorFamily]> = [
    ["black", "gray"],
    ["gray", "silver"],
    ["white", "silver"],
    ["yellow", "orange"],
    ["yellow", "brown"],
    ["orange", "brown"],
    ["red", "orange"],
    ["green", "blue"],
    ["red", "purple"],
    ["red", "pink"],
    ["purple", "pink"],
  ];

  return compatiblePairs.some(
    ([first, second]) => (nameFamily === first && hexFamily === second) || (nameFamily === second && hexFamily === first),
  );
}

function isHexPlausibleForNamedComponent(nameComponent: ProductColorComponent, hexValue: string) {
  const hexComponent = classifyHexComponent(hexValue);

  if (areFamiliesCompatible(nameComponent.family, hexComponent.family)) {
    return true;
  }

  const { red, green, blue } = hexToRgb(hexValue);
  const { saturation, lightness } = rgbToHsl(red, green, blue);
  const chroma = (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;

  /**
   * Supplier names are authoritative when the hex is still visually
   * plausible. This protects near-black and near-white values from noisy hue
   * calculations without allowing clearly unrelated colors through.
   */
  if (nameComponent.family === "black" && lightness <= 0.18 && chroma <= 0.1) {
    return true;
  }

  if (nameComponent.family === "white" && lightness >= 0.85 && saturation <= 0.25) {
    return true;
  }

  return false;
}

function getComposition(componentCount: number) {
  if (componentCount <= 0) {
    return "unknown" as const;
  }

  if (componentCount === 1) {
    return "single" as const;
  }

  if (componentCount === 2) {
    return "two-tone" as const;
  }

  if (componentCount === 3) {
    return "three-tone" as const;
  }

  return "multicolor" as const;
}

function addReviewReason(reasons: ProductColorReviewReason[], reason: ProductColorReviewReason) {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}

/**
 * Classifies a supplier garment color without making network or AI calls.
 * Known supplier names are handled by explicit rules. Hex color math is used
 * only as supporting evidence or as a fallback for an unknown name.
 */
export function classifyProductColor({ providerColor, hexValue }: ClassifyProductColorInput): ProductColorClassification {
  const normalizedName = normalizeProductColorName(providerColor);
  const pattern = detectPattern(normalizedName);
  const nameParts = splitColorComponents(normalizedName);
  const parts = nameParts.length > 0 ? nameParts : [normalizedName];
  const hexValues = extractProductColorHexValues(hexValue);
  const hasRawHexValue = Boolean(hexValue?.trim());
  const invalidHexValue = hasRawHexValue && hexValues.length === 0;
  const reviewReasons: ProductColorReviewReason[] = [];

  if (invalidHexValue) {
    addReviewReason(reviewReasons, "invalid-hex");
  }

  if (hexValues.length > parts.length && parts.length > 0) {
    addReviewReason(reviewReasons, "conflicting-hex");
  }

  let usedHexFallback = false;
  let allNamesRecognized = true;
  let primaryToneOverride: ProductColorTone | undefined;

  const components = parts.map((part, index) => {
    const nameResult = classifyNameComponent(part);
    const componentHex = hexValues[index];

    if (index === 0 && nameResult.tone) {
      primaryToneOverride = nameResult.tone;
    }

    if (nameResult.recognized) {
      if (componentHex && !isHexPlausibleForNamedComponent(nameResult.component, componentHex)) {
        addReviewReason(reviewReasons, "conflicting-hex");
      }

      return {
        ...nameResult.component,
        ...(componentHex ? { hexValue: componentHex } : {}),
      };
    }

    allNamesRecognized = false;

    if (componentHex) {
      usedHexFallback = true;
      addReviewReason(reviewReasons, "ambiguous-name");
      return classifyHexComponent(componentHex);
    }

    addReviewReason(reviewReasons, "ambiguous-name");
    addReviewReason(reviewReasons, "unknown-category");

    if (!hasRawHexValue) {
      addReviewReason(reviewReasons, "missing-hex");
    }

    return { ...UNKNOWN_COMPONENT };
  });

  const primary = components[0] ?? { ...UNKNOWN_COMPONENT };
  const accents = components.slice(1);
  const composition = getComposition(components.length);

  let source: ProductColorClassificationSource = "name-rule";
  let confidence = 0.92;

  if (usedHexFallback) {
    source = "supplier-hex";
    confidence = 0.76;
  } else if (!allNamesRecognized) {
    confidence = 0.2;
  } else if (hexValues.length > 0) {
    confidence = 0.97;
  }

  if (composition !== "single") {
    confidence -= 0.03;
  }

  if (pattern !== "solid") {
    confidence -= 0.03;
  }

  if (reviewReasons.includes("conflicting-hex")) {
    confidence = Math.min(confidence, 0.55);
  }

  confidence = Number(Math.max(0, Math.min(1, confidence)).toFixed(2));

  if (confidence < 0.75) {
    addReviewReason(reviewReasons, "low-confidence");
  }

  const tone = primary.hexValue ? getToneFromHex(primary.hexValue) : (primaryToneOverride ?? DEFAULT_CATEGORY_TONE[primary.category]);

  return {
    primary,
    accents,
    tone,
    pattern,
    composition,
    source,
    confidence,
    needsReview: reviewReasons.length > 0,
    reviewReasons,
  };
}
