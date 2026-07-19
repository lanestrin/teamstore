import { LuCheck } from "react-icons/lu";
import { Link } from "react-router-dom";

import styles from "./ProductCard.module.scss";

export interface ProductCardData {
  id: string;
  name: string;
  imageUrl: string;
  priceLabel: string;
  productUrl: string;
  deadline?: string;
  inCart?: boolean;
}

interface ProductCardProps {
  product: ProductCardData;
  showDeadline?: boolean;
  showRequiredStatus?: boolean;
}

export default function ProductCard({
  product,
  showDeadline = false,
  showRequiredStatus = false,
}: ProductCardProps) {
  return (
    <article className={styles.card}>
      {showRequiredStatus && (
        <div
          className={`${styles.statusBadge} ${
            product.inCart ? styles.statusComplete : styles.statusIncomplete
          }`}
        >
          <LuCheck />

          <span>{product.inCart ? "Added to Cart" : "Required"}</span>
        </div>
      )}

      <div className={styles.imageWrapper}>
        <img src={product.imageUrl} alt={product.name} loading="lazy" />
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

          <Link to={product.productUrl} className={styles.button}>
            View Product
          </Link>
        </div>
      </div>
    </article>
  );
}
