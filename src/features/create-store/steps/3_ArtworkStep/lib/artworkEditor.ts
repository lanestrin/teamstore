import type { ArtTemplateElementMovement, ArtTemplateEditableElement } from "../../../../../assets/art-templates";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const ADJUSTMENT_ATTRIBUTE = "data-artwork-adjustment-for";

export interface ArtworkElementAdjustment {
  x: number;
  y: number;
}

export type ArtworkAdjustments = Record<string, ArtworkElementAdjustment>;

export function createDefaultArtworkAdjustment(): ArtworkElementAdjustment {
  return {
    x: 0,
    y: 0,
  };
}

function getFiniteNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

export function constrainArtworkAdjustment(
  adjustment: ArtworkElementAdjustment,
  movement: ArtTemplateElementMovement,
): ArtworkElementAdjustment {
  const x = getFiniteNumber(adjustment.x);
  const y = getFiniteNumber(adjustment.y);

  switch (movement) {
    case "none":
      return {
        x: 0,
        y: 0,
      };

    case "horizontal":
      return {
        x,
        y: 0,
      };

    case "vertical":
      return {
        x: 0,
        y,
      };

    case "both":
      return {
        x,
        y,
      };
  }
}

function getOrCreateAdjustmentWrapper(svgDocument: Document, element: Element, elementId: string) {
  const parent = element.parentElement;

  if (!parent) {
    return null;
  }

  if (parent.tagName.toLowerCase() === "g" && parent.getAttribute(ADJUSTMENT_ATTRIBUTE) === elementId) {
    return parent;
  }

  const wrapper = svgDocument.createElementNS(SVG_NAMESPACE, "g");

  wrapper.setAttribute(ADJUSTMENT_ATTRIBUTE, elementId);

  parent.insertBefore(wrapper, element);
  wrapper.appendChild(element);

  return wrapper;
}

export function applyArtworkAdjustment(
  svgDocument: Document,
  editableElement: ArtTemplateEditableElement,
  adjustment: ArtworkElementAdjustment,
) {
  const element = svgDocument.getElementById(editableElement.id);

  if (!element) {
    console.warn(`SVG element "#${editableElement.id}" was not found.`);
    return;
  }

  const constrainedAdjustment = constrainArtworkAdjustment(adjustment, editableElement.movement);

  if (constrainedAdjustment.x === 0 && constrainedAdjustment.y === 0) {
    return;
  }

  const wrapper = getOrCreateAdjustmentWrapper(svgDocument, element, editableElement.id);

  if (!wrapper) {
    return;
  }

  wrapper.setAttribute("transform", `translate(${constrainedAdjustment.x} ${constrainedAdjustment.y})`);
}

export function applyArtworkAdjustments(
  svgDocument: Document,
  editableElements: readonly ArtTemplateEditableElement[],
  adjustments: ArtworkAdjustments,
) {
  for (const editableElement of editableElements) {
    const adjustment = adjustments[editableElement.id];

    if (!adjustment) {
      continue;
    }

    applyArtworkAdjustment(svgDocument, editableElement, adjustment);
  }
}
