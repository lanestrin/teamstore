import { ART_TEMPLATE_LIST } from "../../../../../assets/art-templates";
import type { ArtworkTemplatesDraft, ArtworkTextDraft } from "../../../context/CreateStoreContext.types";

import { applySavedArtworkAdjustments, createCustomizedSvg } from "../../3_ArtworkStep/lib/artworkSvg";

interface CreateProductArtworkSvgArgs {
  artworkTemplateId: string;
  artworkText: ArtworkTextDraft;
  artworkTemplates: ArtworkTemplatesDraft;
  organizationName: string;
  mascotSource: string | null;
}

export function createProductArtworkSvg({
  artworkTemplateId,
  artworkText,
  artworkTemplates,
  organizationName,
  mascotSource,
}: CreateProductArtworkSvgArgs): string | null {
  const template = ART_TEMPLATE_LIST.find((candidate) => candidate.id === artworkTemplateId);

  if (!template) {
    console.warn(`Artwork template "${artworkTemplateId}" was not found.`);

    return null;
  }

  /*
   * Match the Step 3 behavior:
   * if the artwork-specific organization
   * name is empty, use the store's
   * organization name.
   */
  const resolvedArtworkText: ArtworkTextDraft = {
    ...artworkText,

    organizationName: artworkText.organizationName || organizationName,
  };

  /*
   * Apply text and mascot customization.
   */
  const customizedSvg = createCustomizedSvg(template, resolvedArtworkText, mascotSource);

  const templateDraft = artworkTemplates[template.id];

  /*
   * Then apply any positioning changes
   * the user saved in the artwork editor.
   */
  return applySavedArtworkAdjustments(customizedSvg, template.editableElements, templateDraft?.artworkAdjustments ?? {});
}
