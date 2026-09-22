import { useState } from "react";

import styles from "./ProductGallery.module.scss";

type ProductImageView = "leftQuarter" | "front" | "back" | "left" | "right" | "detail" | "other";

export interface ProductGalleryImage {
  id: string;
  url: string;
  view: ProductImageView;
  altText?: string;
}

interface ProductGalleryProps {
  name: string;
  color: string;
  images: ProductGalleryImage[];
}

const VIEW_LABELS: Record<ProductImageView, string> = {
  leftQuarter: "Quarter",
  front: "Front",
  back: "Back",
  left: "Left",
  right: "Right",
  detail: "Detail",
  other: "Alternate",
};

function formatViewLabel(view: ProductImageView) {
  return VIEW_LABELS[view];
}

export default function ProductGallery({ name, color, images }: ProductGalleryProps) {
  const [selectedImageId, setSelectedImageId] = useState<string>();

  const selectedImage = images.find((image) => image.id === selectedImageId) ?? images[0];

  if (!selectedImage) {
    return (
      <div className={styles.gallery}>
        <div className={styles.mainImage}>
          <div className={styles.emptyState}>Image unavailable</div>
        </div>
      </div>
    );
  }

  const selectedImageAlt = selectedImage.altText?.trim() || `${name} in ${color} — ${formatViewLabel(selectedImage.view)} view`;

  return (
    <div className={styles.gallery}>
      {images.length > 1 && (
        <div className={styles.thumbnails} aria-label={`${name} in ${color} product views`}>
          {images.map((image) => {
            const isSelected = image.id === selectedImage.id;
            const viewLabel = formatViewLabel(image.view);

            return (
              <button
                key={image.id}
                type="button"
                className={`${styles.thumbnail} ${isSelected ? styles.activeThumb : ""}`}
                aria-label={`View ${viewLabel.toLowerCase()} image`}
                aria-pressed={isSelected}
                onClick={() => setSelectedImageId(image.id)}
              >
                <span className={styles.thumbnailMedia}>
                  <img src={image.url} alt="" loading="lazy" />
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className={styles.mainImage}>
        <img key={selectedImage.id} src={selectedImage.url} alt={selectedImageAlt} />
      </div>
    </div>
  );
}
