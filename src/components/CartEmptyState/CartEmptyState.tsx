import { LuShoppingCart } from "react-icons/lu";
import { Link } from "react-router-dom";

import styles from "./CartEmptyState.module.scss";

export default function CartEmptyState() {
  return (
    <section className={styles.emptyState}>
      <div className={styles.iconContainer} aria-hidden="true">
        <LuShoppingCart />
      </div>

      <h2>Your cart is empty</h2>

      <p>Browse the blank-product catalog and select a color, size, and quantity to add an item.</p>

      <Link to="/products" className={styles.continueButton}>
        Continue Shopping
      </Link>
    </section>
  );
}
