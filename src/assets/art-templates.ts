import E20_31_SVG from "./art-templates/E20_31.svg?raw";

export type ArtTemplateElementMovement =
  | "horizontal"
  | "vertical"
  | "both"
  | "none";

export interface ArtTemplateEditableElement {
  id: string;
  label: string;
  movement: ArtTemplateElementMovement;
}

export interface ArtTemplate {
  id: string;
  name: string;
  svg: string;
  editableElements: ArtTemplateEditableElement[];
}

export const ART_TEMPLATES = {
  E20_31: {
    id: "E20_31",
    name: "E20_31",
    svg: E20_31_SVG,
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
        id: "Mascot",
        label: "Mascot",
        movement: "none",
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
    ],
  },
} satisfies Record<string, ArtTemplate>;