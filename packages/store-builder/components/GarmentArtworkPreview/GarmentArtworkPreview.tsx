import { useMemo } from "react";

import {
  type DecorationProfileId,
  type ProductArtworkPlacement,
  getDecorationProfile,
  createDefaultProductArtworkPlacement,
  type DecorationPreviewBounds,
} from "../../lib/decorationProfiles";

import styles from "./GarmentArtworkPreview.module.scss";
import { applyArtworkContrast, type ArtworkSurfaceTone } from "../../lib/artworkContrast";

interface GarmentArtworkPreviewProps {
  garmentImageUrl: string;
  garmentName: string;
  artworkSvg?: string;
  surfaceHex?: string;
  surfaceTone?: ArtworkSurfaceTone;
  decorationProfileId: DecorationProfileId;
  decorationPreviewBounds?: DecorationPreviewBounds;
  placement?: ProductArtworkPlacement;
  showDecorationZone?: boolean;
}

export default function GarmentArtworkPreview({
  garmentImageUrl,
  garmentName,
  artworkSvg,
  surfaceHex,
  surfaceTone,
  decorationProfileId,
  decorationPreviewBounds,
  placement,
  showDecorationZone = false,
}: GarmentArtworkPreviewProps) {
  const decorationProfile = getDecorationProfile(decorationProfileId);
  const artworkPlacement = placement ?? createDefaultProductArtworkPlacement(decorationProfileId);
  const previewBounds = decorationPreviewBounds ?? decorationProfile.previewBounds;

  const renderedArtworkSvg = useMemo(
    () => (artworkSvg ? applyArtworkContrast(artworkSvg, surfaceHex, surfaceTone) : undefined),
    [artworkSvg, surfaceHex, surfaceTone],
  );

  return (
    <div
      className={styles.garmentArtworkPreview}
      data-garment-artwork-preview
      role="img"
      aria-label={renderedArtworkSvg ? `${garmentName} with artwork preview` : `${garmentName} preview`}
    >
      <img src={garmentImageUrl} alt="" aria-hidden="true" className={styles.garmentArtworkImage} />

      {renderedArtworkSvg && (
        <div
          className={[styles.decorationZone, showDecorationZone ? styles.decorationZoneVisible : ""].filter(Boolean).join(" ")}
          style={{
            left: `${previewBounds.x * 100}%`,
            top: `${previewBounds.y * 100}%`,
            width: `${previewBounds.width * 100}%`,
            height: `${previewBounds.height * 100}%`,
          }}
        >
          <div
            className={styles.garmentArtworkOverlay}
            style={{
              left: `${artworkPlacement.x * 100}%`,
              top: `${artworkPlacement.y * 100}%`,
              width: `${artworkPlacement.width * 100}%`,
            }}
            dangerouslySetInnerHTML={{
              __html: renderedArtworkSvg,
            }}
          />
        </div>
      )}
    </div>
  );
}
