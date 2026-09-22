import { LuLockKeyhole } from "react-icons/lu";

import styles from "./CartSummary.module.scss";

interface CartSummaryProps {
  itemCount: number;
  subtotalInCents: number;
}

function formatCurrency(amountInCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amountInCents / 100);
}

export default function CartSummary({ itemCount, subtotalInCents }: CartSummaryProps) {
  return (
    <aside className={styles.summary}>
      <h2>Order Summary</h2>

      <div className={styles.summaryRow}>
        <span>
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>

        <strong>{formatCurrency(subtotalInCents)}</strong>
      </div>

      <div className={styles.summaryRow}>
        <span>Shipping</span>
        <span>Calculated at checkout</span>
      </div>

      <div className={styles.divider} />

      <div className={styles.totalRow}>
        <span>Estimated Total</span>

        <strong>{formatCurrency(subtotalInCents)}</strong>
      </div>

      <button type="button" className={styles.checkoutButton} disabled>
        <LuLockKeyhole />
        <span>Checkout Coming Soon</span>
      </button>

      <p className={styles.checkoutNote}>Checkout will be connected after the cart flow is complete.</p>
    </aside>
  );
}
