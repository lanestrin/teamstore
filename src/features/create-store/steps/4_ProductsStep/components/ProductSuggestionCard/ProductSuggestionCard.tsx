import { LuCheck, LuPencil, LuStar } from "react-icons/lu";
import styles from "./ProductSuggestionCard.module.scss";
import type { GeneratedSuggestion, ProductColorOption } from "../../lib/productStep.types";
import GarmentArtworkPreview from "../GarmentArtworkPreview/GarmentArtworkPreview";

interface ProductSuggestionCardProps {
  suggestion: GeneratedSuggestion;

  color: ProductColorOption;

  artworkName: string;

  artworkSvg: string | null;

  isSelected: boolean;

  isRequired: boolean;

  onSelectionChange: (checked: boolean) => void;

  onRequiredClick: () => void;

  onEdit: () => void;
}

export default function ProductSuggestionCard({
  suggestion,
  color,
  artworkName,
  artworkSvg,
  isSelected,
  isRequired,
  onSelectionChange,
  onRequiredClick,
  onEdit,
}: ProductSuggestionCardProps) {
  const productName = suggestion.product.name ?? suggestion.providerProductId;

  return (
    <article className={styles.productCard} data-selected={isSelected}>
      <div className={styles.productImageArea}>
        {color.imageUrl ? (
          artworkSvg ? (
            <GarmentArtworkPreview
              garmentImageUrl={color.imageUrl}
              garmentName={productName}
              artworkSvg={artworkSvg}
              decorationProfileId={suggestion.decorationProfileId}
            />
          ) : (
            <img src={color.imageUrl} alt={productName} className={styles.productImage} />
          )
        ) : (
          <div className={styles.productImagePlaceholder}>No image</div>
        )}

        <button
          type="button"
          className={styles.requiredButton}
          data-required={isRequired}
          aria-label={isRequired ? `Make ${productName} optional` : `Require ${productName}`}
          aria-pressed={isRequired}
          onClick={onRequiredClick}
        >
          <LuStar aria-hidden="true" />
        </button>

        {isSelected && (
          <div className={styles.selectedBadge}>
            <LuCheck aria-hidden="true" />
            Selected
          </div>
        )}
      </div>

      <div className={styles.productCardBody}>
        <div className={styles.productCardHeading}>
          <div>
            <h3>{productName}</h3>

            {suggestion.product.category && <p>{suggestion.product.category}</p>}
          </div>

          {suggestion.product.minPriceInCents !== null && (
            <strong className={styles.productPrice}>
              {suggestion.product.maxPriceInCents !== null && suggestion.product.maxPriceInCents !== suggestion.product.minPriceInCents
                ? `$${(suggestion.product.minPriceInCents / 100).toFixed(2)}–$${(suggestion.product.maxPriceInCents / 100).toFixed(2)}`
                : `$${(suggestion.product.minPriceInCents / 100).toFixed(2)}`}
            </strong>
          )}
        </div>

        <dl className={styles.productDetails}>
          <div>
            <dt>Color</dt>

            <dd>{color.color}</dd>
          </div>

          <div>
            <dt>Artwork</dt>

            <dd>{artworkName}</dd>
          </div>
        </dl>

        <div className={styles.productCardActions}>
          <label className={styles.productCheckbox}>
            <input type="checkbox" checked={isSelected} onChange={(event) => onSelectionChange(event.currentTarget.checked)} />

            <span>Use this product</span>
          </label>

          <button type="button" className={styles.editProductButton} onClick={onEdit}>
            <LuPencil aria-hidden="true" />
            Edit Product
          </button>
        </div>
      </div>
    </article>
  );
}
