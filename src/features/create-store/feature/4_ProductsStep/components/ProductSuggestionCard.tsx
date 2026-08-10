import { LuCheck, LuPencil, LuStar } from "react-icons/lu";

import styles from "../ProductsStep.module.scss";
import type {
  GeneratedSuggestion,
  ProductColorOption,
} from "../productStep.types";

interface ProductSuggestionCardProps {
  suggestion: GeneratedSuggestion;
  color: ProductColorOption;
  artworkName: string;
  isSelected: boolean;
  isRequired: boolean;
  onSelectionChange: (checked: boolean) => void;
  onRequiredClick: () => void;
  onEdit: () => void;
}

function formatPriceRange(
  minimumInCents: number | null,
  maximumInCents: number | null,
): string {
  if (minimumInCents === null) {
    return "Price unavailable";
  }

  const minimum = minimumInCents / 100;

  if (maximumInCents === null || maximumInCents === minimumInCents) {
    return minimum.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
  }

  const maximum = maximumInCents / 100;

  return `${minimum.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })}–${maximum.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })}`;
}

export default function ProductSuggestionCard({
  suggestion,
  color,
  artworkName,
  isSelected,
  isRequired,
  onSelectionChange,
  onRequiredClick,
  onEdit,
}: ProductSuggestionCardProps) {
  return (
    <article
      className={[
        styles.productCard,

        isSelected ? styles.productCardSelected : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={styles.productImageArea}>
        <img
          src={color.imageUrl}
          alt={`${suggestion.product.name} in ${color.color}`}
          className={styles.productImage}
        />

        <button
          type="button"
          className={[
            styles.requiredButton,

            isRequired ? styles.requiredButtonActive : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-label={
            isRequired ? "Mark product as optional" : "Mark product as required"
          }
          aria-pressed={isRequired}
          title={isRequired ? "Required product" : "Mark as required"}
          onClick={onRequiredClick}
        >
          <LuStar
            aria-hidden="true"
            fill={isRequired ? "currentColor" : "none"}
          />
        </button>

        {isSelected && (
          <span className={styles.selectedBadge}>
            <LuCheck aria-hidden="true" />
            Selected
          </span>
        )}
      </div>

      <div className={styles.productContent}>
        <div className={styles.productHeading}>
          <div>
            <h3>{suggestion.product.name}</h3>

            <p className={styles.productCategory}>
              {suggestion.product.category}
            </p>
          </div>

          <strong className={styles.productPrice}>
            {formatPriceRange(
              suggestion.product.minPriceInCents,

              suggestion.product.maxPriceInCents,
            )}
          </strong>
        </div>

        <div className={styles.productMeta}>
          <span>{color.color}</span>

          <span>Artwork: {artworkName}</span>
        </div>

        <div className={styles.productActions}>
          <label className={styles.productCheckbox}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(event) =>
                onSelectionChange(event.currentTarget.checked)
              }
            />

            <span>{isSelected ? "Selected" : "Use this product"}</span>
          </label>

          <button
            type="button"
            className={styles.editProductButton}
            onClick={onEdit}
          >
            <LuPencil aria-hidden="true" />

            <span>Edit Product</span>
          </button>
        </div>
      </div>
    </article>
  );
}
