import { useEffect, useMemo, useState } from "react";
import { LuCheck } from "react-icons/lu";
import { Link } from "react-router-dom";

import styles from "./ProductCard.module.scss";

const MAX_VISIBLE_COLOR_OPTIONS = 5;

export interface ProductCardColorOption {
  color: string;
  colorKey: string;
  imageUrl: string;
  colorFamilies?: string[];
}

export interface ProductCardData {
  id: string;
  name: string;
  imageUrl: string;
  priceLabel: string;
  productUrl: string;
  deadline?: string;
  inCart?: boolean;
  colorOptions?: ProductCardColorOption[];
  availableSizeCount?: number;
}

interface ProductCardProps {
  product: ProductCardData;
  preferredColorFamily?: string | null;
  showDeadline?: boolean;
  showRequiredStatus?: boolean;
}

export default function ProductCard({
  product,
  preferredColorFamily = null,
  showDeadline = false,
  showRequiredStatus = false,
}: ProductCardProps) {
  const colorOptions = useMemo(
    () => product.colorOptions ?? [],
    [product.colorOptions],
  );

  const preferredColorOption = useMemo(() => {
    if (!preferredColorFamily) {
      return undefined;
    }

    return colorOptions.find((colorOption) =>
      colorOption.colorFamilies?.includes(preferredColorFamily),
    );
  }, [colorOptions, preferredColorFamily]);

  const firstColorKey = colorOptions[0]?.colorKey ?? null;
  const preferredColorKey = preferredColorOption?.colorKey ?? null;

  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(
    preferredColorKey ?? firstColorKey,
  );

  useEffect(() => {
    setSelectedColorKey(preferredColorKey ?? firstColorKey);
  }, [product.id, preferredColorKey, firstColorKey]);

  const selectedColorOption =
    colorOptions.find(
      (colorOption) => colorOption.colorKey === selectedColorKey,
    ) ??
    preferredColorOption ??
    colorOptions[0];

  const previewImageUrl = selectedColorOption?.imageUrl ?? product.imageUrl;

  const visibleColorOptions = useMemo(() => {
    const firstOptions = colorOptions.slice(0, MAX_VISIBLE_COLOR_OPTIONS);

    if (
      !selectedColorOption ||
      firstOptions.some(
        (colorOption) => colorOption.colorKey === selectedColorOption.colorKey,
      )
    ) {
      return firstOptions;
    }

    return [
      ...firstOptions.slice(0, MAX_VISIBLE_COLOR_OPTIONS - 1),
      selectedColorOption,
    ];
  }, [colorOptions, selectedColorOption]);

  const additionalColorCount = Math.max(
    colorOptions.length - visibleColorOptions.length,
    0,
  );

  const hasVariantSummary =
    colorOptions.length > 0 || product.availableSizeCount !== undefined;

  const previewImageAlt = selectedColorOption
    ? `${product.name} in ${selectedColorOption.color}`
    : product.name;

  return (
    <article className={styles.card}>
      {showRequiredStatus && (
        <div
          className={`${styles.statusBadge} ${
            product.inCart ? styles.statusComplete : styles.statusIncomplete
          }`}
        >
          <LuCheck aria-hidden="true" />

          <span>{product.inCart ? "Added to Cart" : "Required"}</span>
        </div>
      )}

      <Link
        to={product.productUrl}
        className={styles.cardLink}
        aria-label={`View ${product.name}`}
      >
        <div className={styles.imageWrapper}>
          <img src={previewImageUrl} alt={previewImageAlt} loading="lazy" />
        </div>

        <div className={styles.content}>
          <h3>{product.name}</h3>

          {showDeadline && product.deadline && (
            <div className={styles.deadline}>
              Order By:{" "}
              {new Date(product.deadline).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          )}

          <div className={styles.footer}>
            <span className={styles.price}>{product.priceLabel}</span>
          </div>
        </div>
      </Link>

      {hasVariantSummary && (
        <div className={styles.variantSummary}>
          {colorOptions.length > 0 && (
            <div
              className={styles.colorOptions}
              aria-label="Available product colors"
            >
              {visibleColorOptions.map((colorOption) => {
                const isSelected =
                  colorOption.colorKey === selectedColorOption?.colorKey;

                return (
                  <button
                    key={colorOption.colorKey}
                    type="button"
                    className={`${styles.colorOption} ${
                      isSelected ? styles.colorOptionSelected : ""
                    }`}
                    aria-label={`Preview ${product.name} in ${colorOption.color}`}
                    aria-pressed={isSelected}
                    title={colorOption.color}
                    onClick={() => setSelectedColorKey(colorOption.colorKey)}
                  >
                    <img src={colorOption.imageUrl} alt="" loading="lazy" />
                  </button>
                );
              })}

              {additionalColorCount > 0 && (
                <span className={styles.additionalColors}>
                  +{additionalColorCount}
                </span>
              )}
            </div>
          )}

          <p className={styles.variantMeta}>
            {colorOptions.length > 0 && (
              <span>
                {colorOptions.length}{" "}
                {colorOptions.length === 1 ? "color" : "colors"}
              </span>
            )}

            {colorOptions.length > 0 &&
              product.availableSizeCount !== undefined && (
                <span aria-hidden="true"> · </span>
              )}

            {product.availableSizeCount !== undefined && (
              <span>
                {product.availableSizeCount}{" "}
                {product.availableSizeCount === 1 ? "size" : "sizes"}
              </span>
            )}
          </p>
        </div>
      )}
    </article>
  );
}
