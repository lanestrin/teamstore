import {
  type DecorationProfileId,
  type ProductArtworkPlacement,
  getDecorationProfile,
  createDefaultProductArtworkPlacement,
} from "../../lib/decorationProfiles";
import styles from "./GarmentArtworkPreview.module.scss";

interface GarmentArtworkPreviewProps {
  garmentImageUrl: string;
  garmentName: string;
  artworkSvg: string;
  decorationProfileId: DecorationProfileId;
  placement?: ProductArtworkPlacement;
  showDecorationZone?: boolean;
}

export default function GarmentArtworkPreview({
  garmentImageUrl,
  garmentName,
  artworkSvg,
  decorationProfileId,
  placement,
  showDecorationZone = false,
}: GarmentArtworkPreviewProps) {
  const decorationProfile = getDecorationProfile(decorationProfileId);

  const artworkPlacement = placement ?? createDefaultProductArtworkPlacement(decorationProfileId);

  const { previewBounds } = decorationProfile;

  return (
    <div
      className={styles.garmentArtworkPreview}
      data-garment-artwork-preview
      role="img"
      aria-label={`${garmentName} with artwork preview`}
    >
      <img src={garmentImageUrl} alt="" aria-hidden="true" className={styles.garmentArtworkImage} />

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
            __html: artworkSvg,
          }}
        />
      </div>
    </div>
  );
}
