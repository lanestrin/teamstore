const NON_VISIBLE_SVG_CONTAINERS = new Set(["defs", "mask", "clippath", "filter", "pattern"]);

type NeutralColor = "black" | "white";

export type ArtworkSurfaceTone = "light" | "medium" | "dark" | "unknown";

function shouldUseLightArtwork(surfaceHex?: string, surfaceTone: ArtworkSurfaceTone = "unknown") {
  if (surfaceHex) {
    const normalizedHex = normalizeHexColor(surfaceHex);

    if (normalizedHex) {
      return isDarkSurface(surfaceHex);
    }
  }

  return surfaceTone === "dark";
}

function normalizeHexColor(hex: string) {
  const normalized = hex.trim().replace(/^#/, "");

  if (/^[0-9a-fA-F]{3}$/.test(normalized)) {
    return normalized
      .split("")
      .map((character) => character + character)
      .join("");
  }

  if (/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized;
  }

  return null;
}

function convertSrgbChannelToLinear(value: number) {
  const channel = value / 255;

  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(hex: string) {
  const normalized = normalizeHexColor(hex);

  if (!normalized) {
    return null;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  const linearRed = convertSrgbChannelToLinear(red);
  const linearGreen = convertSrgbChannelToLinear(green);
  const linearBlue = convertSrgbChannelToLinear(blue);

  return 0.2126 * linearRed + 0.7152 * linearGreen + 0.0722 * linearBlue;
}

export function isDarkSurface(hex: string) {
  const luminance = getRelativeLuminance(hex);

  if (luminance === null) {
    return false;
  }

  const whiteContrast = 1.05 / (luminance + 0.05);
  const blackContrast = (luminance + 0.05) / 0.05;

  return whiteContrast > blackContrast;
}

function getNeutralColor(value: string): NeutralColor | null {
  const normalized = value.trim().toLowerCase();

  if (normalized === "black") {
    return "black";
  }

  if (normalized === "white") {
    return "white";
  }

  return null;
}

function invertNeutralColor(value: string) {
  const neutralColor = getNeutralColor(value);

  if (neutralColor === "black") {
    return "white";
  }

  if (neutralColor === "white") {
    return "black";
  }

  return value;
}

function isInsideNonVisibleContainer(element: Element) {
  let current: Element | null = element;

  while (current) {
    if (NON_VISIBLE_SVG_CONTAINERS.has(current.tagName.toLowerCase())) {
      return true;
    }

    current = current.parentElement;
  }

  return false;
}

function invertPresentationAttribute(element: Element, attributeName: "fill" | "stroke") {
  const value = element.getAttribute(attributeName);

  if (!value) {
    return;
  }

  const invertedValue = invertNeutralColor(value);

  if (invertedValue !== value) {
    element.setAttribute(attributeName, invertedValue);
  }
}

function invertInlineStyle(element: Element) {
  const style = element.getAttribute("style");

  if (!style) {
    return;
  }

  const updatedStyle = style
    .split(";")
    .map((declaration) => {
      const separatorIndex = declaration.indexOf(":");

      if (separatorIndex === -1) {
        return declaration;
      }

      const property = declaration.slice(0, separatorIndex).trim().toLowerCase();

      if (property !== "fill" && property !== "stroke") {
        return declaration;
      }

      const value = declaration.slice(separatorIndex + 1).trim();

      const invertedValue = invertNeutralColor(value);

      if (invertedValue === value) {
        return declaration;
      }

      return `${property}: ${invertedValue}`;
    })
    .join(";");

  element.setAttribute("style", updatedStyle);
}

function invertVisibleNeutralColors(svgDocument: Document) {
  const elements = Array.from(svgDocument.documentElement.querySelectorAll("*"));

  for (const element of elements) {
    if (isInsideNonVisibleContainer(element)) {
      continue;
    }

    invertPresentationAttribute(element, "fill");
    invertPresentationAttribute(element, "stroke");
    invertInlineStyle(element);
  }
}

export function applyArtworkContrast(svg: string, surfaceHex?: string, surfaceTone: ArtworkSurfaceTone = "unknown") {
  if (!shouldUseLightArtwork(surfaceHex, surfaceTone)) {
    return svg;
  }

  const parser = new DOMParser();

  const svgDocument = parser.parseFromString(svg, "image/svg+xml");

  if (svgDocument.querySelector("parsererror")) {
    console.error("Artwork SVG could not be parsed for contrast rendering.");

    return svg;
  }

  invertVisibleNeutralColors(svgDocument);

  return new XMLSerializer().serializeToString(svgDocument.documentElement);
}
