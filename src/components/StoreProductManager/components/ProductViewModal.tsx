import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LuX } from "react-icons/lu";

import GarmentArtworkPreview from "../../../../packages/store-builder/components/GarmentArtworkPreview/GarmentArtworkPreview";
import type { ManagedProductPreview, ManagedStoreProduct } from "../types";
import styles from "./ProductViewModal.module.scss";

interface ProductViewModalProps {
  product: ManagedStoreProduct;
  preview: ManagedProductPreview | null;
  onClose: () => void;
}

export default function ProductViewModal({ product, preview, onClose }: ProductViewModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const images = product.images ?? [];
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex] ?? null;

  useEffect(() => {
    setSelectedIndex(0);
  }, [product.storeProductId]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function renderImage(
    image: NonNullable<ManagedStoreProduct["images"]>[number],
    thumbnail = false,
  ) {
    const canShowArtwork = Boolean(preview?.artworkSvg && image.decorationPreviewBounds);

    if (preview) {
      return (
        <GarmentArtworkPreview
          garmentImageUrl={image.imageUrl}
          garmentName={`${product.name} ${image.view}`}
          artworkSvg={canShowArtwork ? preview.artworkSvg ?? undefined : undefined}
          surfaceHex={preview.color.primaryHexValue}
          surfaceTone={preview.color.tone}
          decorationProfileId={preview.suggestion.decorationProfileId}
          decorationPreviewBounds={image.decorationPreviewBounds}
          placement={preview.placement}
        />
      );
    }

    return <img src={image.imageUrl} alt={thumbnail ? "" : `${product.name} ${image.view}`} />;
  }

  return createPortal(
    <div
      className={styles.overlay}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="product-view-title">
        <header className={styles.header}>
          <div>
            <h2 id="product-view-title">Product Preview</h2>
            <p>{product.name} · {product.color}</p>
          </div>
          <button ref={closeButtonRef} type="button" className={styles.close} aria-label="Close product preview" onClick={onClose}>
            <LuX aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          {images.length > 1 && (
            <div className={styles.thumbnails} aria-label="Product views">
              {images.map((image, index) => (
                <button
                  key={`${image.view}-${image.sortOrder}-${index}`}
                  type="button"
                  className={styles.thumbnail}
                  data-selected={index === selectedIndex}
                  aria-label={`View ${image.view}`}
                  aria-pressed={index === selectedIndex}
                  onClick={() => setSelectedIndex(index)}
                >
                  {renderImage(image, true)}
                </button>
              ))}
            </div>
          )}

          <div className={styles.stage}>
            {selectedImage ? (
              <>
                <div className={styles.largePreview}>{renderImage(selectedImage)}</div>
                <span className={styles.viewLabel}>{selectedImage.view}</span>
              </>
            ) : product.imageUrl ? (
              <img className={styles.fallbackImage} src={product.imageUrl} alt={product.name} />
            ) : (
              <p className={styles.empty}>No product images are available for this color.</p>
            )}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}
