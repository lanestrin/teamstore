import { useEffect, useMemo, useState } from "react";

import { ART_TEMPLATE_LIST } from "../../../assets/art-templates";
import useFileDataUrl from "../hooks/useFileDataUrl";
import { applySavedArtworkAdjustments, createCustomizedSvg } from "../steps/3_ArtworkStep/lib/artworkSvg";
import type { ArtworkSvgMap, CreateStoreDraft } from "../context/CreateStoreContext.types";

interface CreateStoreArtworkState {
  mascotDataUrl: string | null;
  artworkBaseSvgsByTemplateId: ArtworkSvgMap;
  artworkSvgsByTemplateId: ArtworkSvgMap;
}

export function useCreateStoreArtwork(storeDraft: CreateStoreDraft): CreateStoreArtworkState {
  const mascotDataUrl = useFileDataUrl(storeDraft.logoFile);
  const [fontLoadVersion, setFontLoadVersion] = useState(0);

  useEffect(() => {
    if (typeof document === "undefined" || !document.fonts) {
      return;
    }

    let isCancelled = false;

    void document.fonts.ready.then(() => {
      if (!isCancelled) {
        setFontLoadVersion((currentVersion) => currentVersion + 1);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, []);

  const { artworkBaseSvgsByTemplateId, artworkSvgsByTemplateId } = useMemo(() => {
    void fontLoadVersion;

    const baseSvgs: Record<string, string> = {};
    const finalSvgs: Record<string, string> = {};

    for (const template of ART_TEMPLATE_LIST) {
      const templateDraft = storeDraft.artworkTemplates[template.id];
      const baseSvg = createCustomizedSvg(template, storeDraft.artworkText, mascotDataUrl);

      baseSvgs[template.id] = baseSvg;
      finalSvgs[template.id] = applySavedArtworkAdjustments(baseSvg, template.editableElements, templateDraft?.artworkAdjustments ?? {});
    }

    return {
      artworkBaseSvgsByTemplateId: baseSvgs,
      artworkSvgsByTemplateId: finalSvgs,
    };
  }, [fontLoadVersion, mascotDataUrl, storeDraft.artworkTemplates, storeDraft.artworkText]);

  return {
    mascotDataUrl,
    artworkBaseSvgsByTemplateId,
    artworkSvgsByTemplateId,
  };
}
