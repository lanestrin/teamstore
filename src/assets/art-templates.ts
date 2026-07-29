import E20_31_SVG from "./art-templates/E20_31.svg?raw";
import T12_CH8_SVG from "./art-templates/T12_CH8.svg?raw";
import T15_DN35_SVG from "./art-templates/T15_DN35.svg?raw";

export type ArtTemplateElementMovement =
  | "horizontal"
  | "vertical"
  | "both"
  | "none";

export type ArtTemplateTextField =
  | "organizationName"
  | "yearEstablished"
  | "mascotName";

export type ArtTemplateTextTransform = "none" | "uppercase";

export interface ArtTemplateEditableElement {
  id: string;
  label: string;
  movement: ArtTemplateElementMovement;
}

export interface ArtTemplateTextBinding {
  elementId: string;
  field: ArtTemplateTextField;
  transform?: ArtTemplateTextTransform;
  slice?: readonly [start: number, end: number];
}

export interface ArtTemplate {
  id: string;
  name: string;
  svg: string;
  mascotElementId?: string;
  textBindings: ArtTemplateTextBinding[];
  editableElements: ArtTemplateEditableElement[];
}

export const ART_TEMPLATES = {
  E20_31: {
    id: "E20_31",
    name: "E20_31",
    svg: E20_31_SVG,
    mascotElementId: "Mascot",
    textBindings: [
      {
        elementId: "Line1",
        field: "organizationName",
        transform: "uppercase",
      },
      {
        elementId: "Line2",
        field: "yearEstablished",
        slice: [0, 2],
      },
      {
        elementId: "Line3",
        field: "yearEstablished",
        slice: [2, 4],
      },
      {
        elementId: "Line4",
        field: "mascotName",
        transform: "uppercase",
      },
    ],
    editableElements: [
      {
        id: "Line1",
        label: "Organization Name",
        movement: "both",
      },
      {
        id: "Line2",
        label: "Year — Left",
        movement: "both",
      },
      {
        id: "Line3",
        label: "Year — Right",
        movement: "none",
      },
      {
        id: "Line4",
        label: "Mascot Name",
        movement: "both",
      },
      {
        id: "Mascot",
        label: "Mascot",
        movement: "none",
      },
    ],
  },

  T12_CH8: {
    id: "T12_CH8",
    name: "T12_CH8",
    svg: T12_CH8_SVG,
    mascotElementId: "Mascot",
    textBindings: [
      {
        elementId: "Line1",
        field: "mascotName",
        transform: "none",
      },
      {
        elementId: "Line2",
        field: "organizationName",
        transform: "uppercase",
      },
    ],
    editableElements: [
      {
        id: "Line1",
        label: "Mascot Name",
        movement: "both",
      },
      {
        id: "Line2",
        label: "Organization Name",
        movement: "both",
      },
      {
        id: "Mascot",
        label: "Mascot",
        movement: "none",
      },
    ],
  },

  T15_DN35: {
    id: "T15_DN35",
    name: "T15_DN35",
    svg: T15_DN35_SVG,
    mascotElementId: "Mascot",
    textBindings: [
      {
        elementId: "Line1",
        field: "mascotName",
        transform: "none",
      },
      {
        elementId: "Line2",
        field: "organizationName",
        transform: "uppercase",
      },
    ],
    editableElements: [
      {
        id: "Line1",
        label: "Mascot Name",
        movement: "both",
      },
      {
        id: "Line2",
        label: "Organization Name",
        movement: "both",
      },
      {
        id: "Mascot",
        label: "Mascot",
        movement: "none",
      },
    ],
  },
} satisfies Record<string, ArtTemplate>;

export type ArtTemplateId = keyof typeof ART_TEMPLATES;

export const ART_TEMPLATE_LIST = Object.values(ART_TEMPLATES);