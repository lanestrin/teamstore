import { LuCheck, LuMinus, LuPlus } from "react-icons/lu";
import { Link } from "react-router-dom";

import styles from "./ProductInfo.module.scss";

interface ProductColorOption {
  name: string;
  imageUrl: string;
}

interface ProductInfoProps {
  name: string;
  category?: string;
  priceLabel: string;
  colors: ProductColorOption[];
  selectedColor: string;
  sizes: string[];
  selectedSize: string;
  quantity: number;
  isAddedToCart: boolean;
  onColorChange: (color: string) => void;
  onSizeChange: (size: string) => void;
  onQuantityChange: (quantity: number) => void;
  onAddToCart: () => void;
}

export default function ProductInfo({
  name,
  category,
  priceLabel,
  colors,
  selectedColor,
  sizes,
  selectedSize,
  quantity,
  isAddedToCart,
  onColorChange,
  onSizeChange,
  onQuantityChange,
  onAddToCart,
}: ProductInfoProps) {
  const hasAvailableColors = colors.length > 0;
  const hasAvailableSizes = sizes.length > 0;

  const canAddToCart =
    hasAvailableColors &&
    Boolean(selectedColor) &&
    hasAvailableSizes &&
    Boolean(selectedSize);

  return (
    <div className={styles.info}>
      <h1>{name}</h1>

      {category && <div className={styles.teamName}>{category}</div>}

      <div className={styles.price}>{priceLabel}</div>

      <div className={styles.optionSection}>
        <div className={styles.sectionLabel}>
          COLOR
          {selectedColor && (
            <span className={styles.selectedOption}>{selectedColor}</span>
          )}
        </div>

        {hasAvailableColors ? (
          <div className={styles.colorGrid}>
            {colors.map((color) => {
              const isSelected = selectedColor === color.name;

              return (
                <button
                  key={color.name}
                  type="button"
                  className={`${styles.colorOption} ${
                    isSelected ? styles.activeColor : ""
                  }`}
                  aria-label={`Select ${color.name}`}
                  aria-pressed={isSelected}
                  title={color.name}
                  onClick={() => onColorChange(color.name)}
                >
                  <img
                    src={color.imageUrl}
                    alt=""
                    className={styles.colorThumbnail}
                    loading="lazy"
                  />

                  <span className={styles.colorName}>{color.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.groupLabel}>
            No colors are currently available.
          </div>
        )}
      </div>

      <div className={styles.optionSection}>
        <div className={styles.sectionLabel}>
          SIZE
          {selectedSize && (
            <span className={styles.selectedOption}>{selectedSize}</span>
          )}
        </div>

        {hasAvailableSizes ? (
          <div className={styles.sizeGrid}>
            {sizes.map((size) => {
              const isSelected = selectedSize === size;

              return (
                <button
                  key={size}
                  type="button"
                  className={isSelected ? styles.activeSize : ""}
                  aria-label={`Select size ${size}`}
                  aria-pressed={isSelected}
                  onClick={() => onSizeChange(size)}
                >
                  <span>{size}</span>
                  <small>In Stock</small>
                </button>
              );
            })}
          </div>
        ) : (
          <div className={styles.groupLabel}>
            No sizes are currently available for this color.
          </div>
        )}
      </div>

      <div className={styles.quantitySection}>
        <label>Quantity</label>

        <div className={styles.quantityControls}>
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
          >
            <LuMinus />
          </button>

          <span>{quantity}</span>

          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onQuantityChange(quantity + 1)}
          >
            <LuPlus />
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`${styles.addToCart} ${
          isAddedToCart ? styles.addedToCart : ""
        }`}
        disabled={!canAddToCart}
        onClick={onAddToCart}
      >
        {isAddedToCart && <LuCheck aria-hidden="true" />}

        <span>
          {isAddedToCart
            ? "ADDED TO CART"
            : !hasAvailableColors
              ? "UNAVAILABLE"
              : !selectedColor
                ? "SELECT COLOR"
                : !hasAvailableSizes
                  ? "UNAVAILABLE"
                  : !selectedSize
                    ? "SELECT SIZE"
                    : "ADD TO CART"}
        </span>
      </button>

      {isAddedToCart && (
        <div className={styles.cartConfirmation} role="status">
          <span>This item was added to your cart.</span>

          <Link to="/cart">View Cart</Link>
        </div>
      )}
    </div>
  );
}
