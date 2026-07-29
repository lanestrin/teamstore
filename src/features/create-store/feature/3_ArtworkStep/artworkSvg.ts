import type {
  ArtTemplate,
  ArtTemplateEditableElement,
  ArtTemplateTextBinding,
} from "../../../../assets/art-templates";
import type { ArtworkTextDraft } from "../../context/CreateStoreContext";
import {
  applyArtworkAdjustments,
  type ArtworkAdjustments,
} from "./artworkEditor";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

function getPresentationAttribute(element: Element, name: string) {
  let current: Element | null = element;

  while (current) {
    const directValue = current.getAttribute(name);

    if (directValue) {
      return directValue;
    }

    const inlineStyle = current.getAttribute("style");

    if (inlineStyle) {
      const declaration = inlineStyle
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.toLowerCase().startsWith(`${name.toLowerCase()}:`));

      if (declaration) {
        return declaration.slice(declaration.indexOf(":") + 1).trim();
      }
    }

    current = current.parentElement;
  }

  return null;
}

function parseSvgNumber(value: string | null, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsedValue = Number.parseFloat(value);

  return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

let textMeasurementContext: CanvasRenderingContext2D | null | undefined;

function getTextMeasurementContext() {
  if (typeof document === "undefined") {
    return null;
  }

  if (textMeasurementContext !== undefined) {
    return textMeasurementContext;
  }

  const canvas = document.createElement("canvas");
  textMeasurementContext = canvas.getContext("2d");

  return textMeasurementContext;
}

function measureSvgText(element: Element, value: string) {
  const context = getTextMeasurementContext();

  if (!context || !value) {
    return 0;
  }

  const fontStyle = getPresentationAttribute(element, "font-style") ?? "normal";
  const fontWeight = getPresentationAttribute(element, "font-weight") ?? "normal";
  const fontSize = parseSvgNumber(
    getPresentationAttribute(element, "font-size"),
    16,
  );
  const fontFamily =
    getPresentationAttribute(element, "font-family") ?? "sans-serif";
  const letterSpacing = parseSvgNumber(
    getPresentationAttribute(element, "letter-spacing"),
    0,
  );

  context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;

  const measuredWidth = context.measureText(value).width;
  const spacingWidth = Math.max(0, value.length - 1) * letterSpacing;

  return measuredWidth + spacingWidth;
}

function getTextFitWidth(
  svgDocument: Document,
  element: Element,
  textTarget: Element,
  originalValue: string,
) {
  const configuredWidth =
    textTarget.getAttribute("data-fit-width") ??
    element.getAttribute("data-fit-width");

  if (configuredWidth) {
    return parseSvgNumber(configuredWidth, 0);
  }

  const existingTextLength =
    textTarget.getAttribute("textLength") ?? element.getAttribute("textLength");

  if (existingTextLength) {
    return parseSvgNumber(existingTextLength, 0);
  }

  const originalWidth = measureSvgText(textTarget, originalValue);

  if (originalWidth > 0) {
    return originalWidth;
  }

  const viewBox = svgDocument.documentElement
    .getAttribute("viewBox")
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);

  if (viewBox?.length === 4 && Number.isFinite(viewBox[2])) {
    return viewBox[2] * 0.92;
  }

  return 0;
}

type SvgTextFitMode = "none" | "squeeze" | "stretch" | "font-size";

function getSvgTextTargets(element: Element) {
  const configuredTargets = Array.from(
    element.querySelectorAll(
      "tspan[data-fit-width], textPath[data-fit-width], text[data-fit-width]",
    ),
  );

  if (configuredTargets.length > 0) {
    return configuredTargets;
  }

  const textElements = Array.from(element.querySelectorAll("text"));

  if (textElements.length > 0) {
    return textElements.map(
      (textElement) =>
        textElement.querySelector("tspan") ??
        textElement.querySelector("textPath") ??
        textElement,
    );
  }

  return [
    element.querySelector("tspan") ??
      element.querySelector("textPath") ??
      element,
  ];
}

function getSvgTextFitMode(
  element: Element,
  textTarget: Element,
): SvgTextFitMode {
  const configuredMode =
    textTarget.getAttribute("data-fit-mode") ??
    element.getAttribute("data-fit-mode") ??
    "squeeze";

  switch (configuredMode) {
    case "none":
    case "squeeze":
    case "stretch":
    case "font-size":
      return configuredMode;

    default:
      console.warn(
        `Unsupported SVG text fit mode "${configuredMode}". Falling back to "squeeze".`,
      );
      return "squeeze";
  }
}

function applySvgTextFit(
  svgDocument: Document,
  element: Element,
  textTarget: Element,
  originalValue: string,
  value: string,
) {
  const fitWidth = getTextFitWidth(
    svgDocument,
    element,
    textTarget,
    originalValue,
  );
  const fitMode = getSvgTextFitMode(element, textTarget);

  textTarget.removeAttribute("textLength");
  textTarget.removeAttribute("lengthAdjust");

  if (!value || fitWidth <= 0 || fitMode === "none") {
    return;
  }

  const updatedWidth = measureSvgText(textTarget, value);

  if (updatedWidth <= 0) {
    return;
  }

  if (fitMode === "stretch") {
    textTarget.setAttribute("textLength", fitWidth.toFixed(3));
    textTarget.setAttribute("lengthAdjust", "spacingAndGlyphs");
    return;
  }

  if (updatedWidth <= fitWidth) {
    return;
  }

  if (fitMode === "squeeze") {
    textTarget.setAttribute("textLength", fitWidth.toFixed(3));
    textTarget.setAttribute("lengthAdjust", "spacingAndGlyphs");
    return;
  }

  const originalFontSize = parseSvgNumber(
    getPresentationAttribute(textTarget, "font-size"),
    16,
  );
  const configuredMinimumFontSize =
    textTarget.getAttribute("data-fit-min-font-size") ??
    element.getAttribute("data-fit-min-font-size");
  const minimumFontSize = configuredMinimumFontSize
    ? parseSvgNumber(configuredMinimumFontSize, originalFontSize * 0.5)
    : originalFontSize * 0.5;
  const fittedFontSize = Math.max(
    minimumFontSize,
    originalFontSize * (fitWidth / updatedWidth),
  );

  textTarget.setAttribute("font-size", fittedFontSize.toFixed(3));

  const fittedWidth = measureSvgText(textTarget, value);

  // If the configured minimum font size is still too wide, apply a final
  // horizontal squeeze so the text cannot overflow its safe area.
  if (fittedWidth > fitWidth) {
    textTarget.setAttribute("textLength", fitWidth.toFixed(3));
    textTarget.setAttribute("lengthAdjust", "spacingAndGlyphs");
  }
}

function setSvgText(svgDocument: Document, elementId: string, value: string) {
  const element = svgDocument.getElementById(elementId);

  if (!element) {
    console.warn(`SVG element "#${elementId}" was not found.`);
    return;
  }

  const textTargets = getSvgTextTargets(element);

  for (const textTarget of textTargets) {
    const originalValue = textTarget.textContent?.trim() ?? "";

    textTarget.textContent = value;
    applySvgTextFit(
      svgDocument,
      element,
      textTarget,
      originalValue,
      value,
    );
  }
}

function setSvgMascot(
  svgDocument: Document,
  mascotElementId: string | undefined,
  mascotSource: string | null,
) {
  if (!mascotElementId || !mascotSource) {
    return;
  }

  const currentMascot = svgDocument.getElementById(mascotElementId);

  if (!currentMascot) {
    console.warn(`SVG element "#${mascotElementId}" was not found.`);
    return;
  }

  const mascotImage = svgDocument.createElementNS(SVG_NAMESPACE, "image");

  for (const attribute of [
    "x",
    "y",
    "width",
    "height",
    "transform",
    "clip-path",
  ]) {
    const value = currentMascot.getAttribute(attribute);

    if (value) {
      mascotImage.setAttribute(attribute, value);
    }
  }

  mascotImage.setAttribute("id", mascotElementId);
  mascotImage.setAttribute("preserveAspectRatio", "xMidYMid meet");
  mascotImage.setAttribute("href", mascotSource);

  currentMascot.replaceWith(mascotImage);
}

function getTextBindingValue(
  values: ArtworkTextDraft,
  binding: ArtTemplateTextBinding,
) {
  let value = values[binding.field];

  if (binding.field === "yearEstablished") {
    value = value.replace(/\D/g, "").slice(0, 4);
  } else {
    value = value.trim();
  }

  if (binding.slice) {
    value = value.slice(binding.slice[0], binding.slice[1]);
  }

  if (binding.transform === "uppercase") {
    value = value.toUpperCase();
  }

  return value;
}

export function createCustomizedSvg(
  template: ArtTemplate,
  values: ArtworkTextDraft,
  mascotSource: string | null,
) {
  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(template.svg, "image/svg+xml");

  if (svgDocument.querySelector("parsererror")) {
    console.error(`Artwork template "${template.id}" could not be parsed.`);
    return template.svg;
  }

  for (const binding of template.textBindings) {
    setSvgText(
      svgDocument,
      binding.elementId,
      getTextBindingValue(values, binding),
    );
  }

  setSvgMascot(svgDocument, template.mascotElementId, mascotSource);

  return new XMLSerializer().serializeToString(svgDocument.documentElement);
}

export function applySavedArtworkAdjustments(
  svg: string,
  editableElements: readonly ArtTemplateEditableElement[],
  adjustments: ArtworkAdjustments,
) {
  const parser = new DOMParser();
  const svgDocument = parser.parseFromString(svg, "image/svg+xml");

  if (svgDocument.querySelector("parsererror")) {
    console.error("The customized artwork could not be parsed.");
    return svg;
  }

  applyArtworkAdjustments(svgDocument, editableElements, adjustments);

  return new XMLSerializer().serializeToString(svgDocument.documentElement);
}