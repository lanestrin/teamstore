import { LuEye, LuPalette, LuTrash2, LuWandSparkles } from "react-icons/lu";

import GarmentArtworkPreview from "../../../../packages/store-builder/components/GarmentArtworkPreview/GarmentArtworkPreview";
import type { ManagedProductPreview, ManagedStoreProduct } from "../types";
import styles from "./StoreProductRow.module.scss";

interface StoreProductRowProps {
  product: ManagedStoreProduct;
  preview: ManagedProductPreview | null;
  isBusy: boolean;
  onView: (product: ManagedStoreProduct) => void;
  onEditColor: (product: ManagedStoreProduct) => void;
  onEditArtwork: (product: ManagedStoreProduct) => void;
  onRemove: (product: ManagedStoreProduct) => void;
}

export default function StoreProductRow({ product, preview, isBusy, onView, onEditColor, onEditArtwork, onRemove }: StoreProductRowProps) {
  return (
    <article className={styles.row}>
      <div className={styles.productInfo}>
        <div className={styles.productImage}>
          {preview ? (
            <GarmentArtworkPreview
              garmentImageUrl={preview.color.imageUrl}
              garmentName={product.name}
              artworkSvg={preview.artworkSvg ?? undefined}
              surfaceHex={preview.color.primaryHexValue}
              surfaceTone={preview.color.tone}
              decorationProfileId={preview.suggestion.decorationProfileId}
              decorationPreviewBounds={preview.color.decorationPreviewBounds}
              placement={preview.placement}
            />
          ) : product.imageUrl ? (
            <img src={product.imageUrl} alt="" />
          ) : (
            <span className={styles.colorFallback} style={{ backgroundColor: product.primaryHexValue ?? undefined }} aria-hidden="true" />
          )}
        </div>

        <div className={styles.productCopy}>
          <h4>{product.name}</h4>
          <p>{product.category} · {product.color}</p>
        </div>
      </div>

      <div className={styles.actions}>
        {product.isRequired && <span className={styles.requiredBadge}>Required</span>}

        <button type="button" className={styles.editAction} disabled={isBusy} onClick={() => onView(product)}>
          <LuEye aria-hidden="true" />
          View
        </button>
        <button type="button" className={styles.editAction} disabled={isBusy} onClick={() => onEditColor(product)}>
          <LuPalette aria-hidden="true" />
          Color
        </button>
        <button type="button" className={styles.editAction} disabled={isBusy} onClick={() => onEditArtwork(product)}>
          <LuWandSparkles aria-hidden="true" />
          Artwork
        </button>
        <button type="button" className={styles.removeAction} disabled={isBusy} onClick={() => onRemove(product)}>
          <LuTrash2 aria-hidden="true" />
          Remove
        </button>
      </div>
    </article>
  );
}
