import { LuCheck } from "react-icons/lu";
import styles from "./ProductCard.module.scss";
import type { IProduct } from "../../types/product";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: IProduct;
  showDeadline?: boolean;
  showRequiredStatus?: boolean;
}

export default function ProductCard({
  product,
  showDeadline = false,
  showRequiredStatus = false,
}: ProductCardProps) {

  if (!product) {
    console.error("Product is undefined");
    return null;
  }

  return (
    <article className={styles.card}>
      {showRequiredStatus && (
        <div
          className={`${styles.statusBadge} ${product.inCart
              ? styles.statusComplete
              : styles.statusIncomplete
            }`}
        >
          <LuCheck />

          <span>
            {product.inCart
              ? "Added to Cart"
              : "Required"}
          </span>
        </div>
      )}

      <div className={styles.imageWrapper}>
        <img
          src={product.image}
          alt={product.name}
        />
      </div>

      <div className={styles.content}>
        <h3>{product.name}</h3>

        {showDeadline && product.deadline && (
          <div className={styles.deadline}>
            Order By:{" "}
            {new Date(product.deadline).toLocaleDateString(
              "en-US",
              {
                month: "long",
                day: "numeric",
                year: "numeric",
              }
            )}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.price}>
            ${product.price.toFixed(2)}
          </span>

          <Link
            to={`/product/${product.sku}`}
            className={styles.button}
          >
            View Product
          </Link>
        </div>
      </div>
    </article>
  );
}
