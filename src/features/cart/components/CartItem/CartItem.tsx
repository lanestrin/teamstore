import { LuMinus, LuPlus, LuTrash2 } from "react-icons/lu";
import { Link } from "react-router-dom";

import styles from "./CartItem.module.scss";

interface CartItemProps {
  slug: string;
  imageUrl: string;
  name: string;
  color: string;
  size: string;
  unitPriceInCents: number;
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
}

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountInCents / 100);
}

export default function CartItem({
  slug,
  imageUrl,
  name,
  color,
  size,
  unitPriceInCents,
  quantity,
  onDecrease,
  onIncrease,
  onRemove,
}: CartItemProps) {
  const lineTotalInCents = unitPriceInCents * quantity;

  return (
    <article className={styles.cartItem}>
      <Link to={`/product/${slug}`} className={styles.imageLink}>
        <img src={imageUrl} alt={name} className={styles.image} />
      </Link>

      <div className={styles.content}>
        <div className={styles.topRow}>
          <div className={styles.productInfo}>
            <Link to={`/product/${slug}`} className={styles.name}>
              {name}
            </Link>

            <p className={styles.details}>
              Color: {color}
              <span aria-hidden="true"> · </span>
              Size: {size}
            </p>

            <p className={styles.unitPrice}>
              {formatCurrency(unitPriceInCents)} each
            </p>
          </div>

          <strong className={styles.price}>
            {formatCurrency(lineTotalInCents)}
          </strong>
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.quantitySection}>
            <span className={styles.quantityLabel}>Quantity</span>

            <div className={styles.quantityControls}>
              <button
                type="button"
                aria-label={`Decrease quantity of ${name}`}
                disabled={quantity <= 1}
                onClick={onDecrease}
              >
                <LuMinus />
              </button>

              <span aria-live="polite">{quantity}</span>

              <button
                type="button"
                aria-label={`Increase quantity of ${name}`}
                onClick={onIncrease}
              >
                <LuPlus />
              </button>
            </div>
          </div>

          <button
            type="button"
            className={styles.removeButton}
            onClick={onRemove}
          >
            <LuTrash2 />
            <span>Remove</span>
          </button>
        </div>
      </div>
    </article>
  );
}
