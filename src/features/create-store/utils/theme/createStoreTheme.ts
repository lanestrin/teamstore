import { images } from "../../../../assets/images";
import { getContrastTextColor, isLightColor } from "./color";

export interface StoreTheme {
  hero: {
    backgroundColor: string;
    backgroundImage: string;
    text: string;
    disableGradients: boolean;
  };

  promoBar: {
    background: string;
    text: string;
  };

  header: {
    background: string;
    text: string;
    inverted: boolean;
  };

  badge: {
    background: string;
    text: string;
  };

  buttons: {
    primary: {
      background: string;
      text: string;
    };

    secondary: {
      background: string;
      text: string;
      border: string;
    };
  };

  logo: {
    border: string;
    text: string;
  };

  brand: {
    color: string;
    text: string;
  };
}

export function createStoreTheme(primaryColor: string, secondaryColor: string): StoreTheme {
  const primaryButtonText = getContrastTextColor(secondaryColor);

  const secondaryButtonText = getContrastTextColor("#FFFFFF");

  // White (or other very light colors) make poor accent colors.
  // In those cases we fall back to the primary brand color.
  const brand = isLightColor(secondaryColor) ? primaryColor : secondaryColor;

  const promoBarBackground = isLightColor(primaryColor) ? secondaryColor : primaryColor;

  const promoBarText = getContrastTextColor(promoBarBackground);

  const sameColor = primaryColor.toLowerCase() === secondaryColor.toLowerCase();

  const header = sameColor
    ? isLightColor(primaryColor)
      ? {
          background: "#111827",
          text: "#FFFFFF",
          inverted: true,
        }
      : {
          background: "#FFFFFF",
          text: "#111827",
          inverted: true,
        }
    : {
        background: "#FFFFFF",
        text: "#111827",
        inverted: false,
      };

  const secondaryIsWhite = secondaryColor.toLowerCase() === "#ffffff";

  // Badge uses the secondary color except when secondary is white.
  const badgeBackground = secondaryIsWhite ? primaryColor : secondaryColor;

  const badgeText = getContrastTextColor(badgeBackground);

  function isWhiteColor(color?: string): boolean {
    if (!color) return false;

    const normalized = color.trim().toLowerCase().replace(/\s+/g, "");

    return (
      normalized === "#fff" ||
      normalized === "#ffffff" ||
      normalized === "white" ||
      normalized === "rgb(255,255,255)" ||
      normalized === "rgba(255,255,255,1)"
    );
  }

  const isPrimaryWhite = isWhiteColor(primaryColor);

  return {
    hero: {
      backgroundColor: primaryColor,
      backgroundImage: `url(${images.heroBg.polyBG})`,
      text: getContrastTextColor(primaryColor),
      disableGradients: isPrimaryWhite,
    },

    promoBar: {
      background: promoBarBackground,
      text: promoBarText,
    },

    header,

    badge: {
      background: badgeBackground,
      text: badgeText,
    },

    buttons: {
      primary: {
        background: secondaryColor,
        text: primaryButtonText,
      },

      secondary: {
        background: "#FFFFFF",
        text: secondaryButtonText,
        border: "#E5E7EB",
      },
    },

    logo: {
      border: brand,
      text: brand,
    },

    brand: {
      color: brand,
      text: getContrastTextColor(brand),
    },
  };
}
