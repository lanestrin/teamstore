import { Link } from "react-router-dom";

import { useCart } from "./CartContext";
import CartEmptyState from "./components/CartEmptyState/CartEmptyState";
import CartItem from "./components/CartItem/CartItem";
import CartSummary from "./components/CartSummary/CartSummary";
import styles from "./CartPage.module.scss";

export default function CartPage() {
  const { items, itemCount, subtotalInCents, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <span className={styles.eyebrow}>Your order</span>

            <h1>Shopping Cart</h1>

            <p>Review your products, quantities, and selected options.</p>
          </div>

          {items.length > 0 && (
            <button type="button" className={styles.clearButton} onClick={clearCart}>
              Clear Cart
            </button>
          )}
        </header>

        {items.length === 0 ? (
          <CartEmptyState />
        ) : (
          <>
            <div className={styles.cartToolbar}>
              <p>
                <strong>{itemCount}</strong> {itemCount === 1 ? "item" : "items"} in your cart
              </p>

              <Link to="/products">Continue Shopping</Link>
            </div>

            <div className={styles.layout}>
              <section className={styles.items} aria-label="Shopping cart items">
                {items.map((item) => (
                  <CartItem
                    key={item.lineId}
                    slug={item.slug}
                    imageUrl={item.imageUrl}
                    name={item.name}
                    color={item.color}
                    size={item.size}
                    unitPriceInCents={item.unitPriceInCents}
                    quantity={item.quantity}
                    onDecrease={() => updateQuantity(item.lineId, item.quantity - 1)}
                    onIncrease={() => updateQuantity(item.lineId, item.quantity + 1)}
                    onRemove={() => removeItem(item.lineId)}
                  />
                ))}
              </section>

              <div className={styles.summaryColumn}>
                <CartSummary itemCount={itemCount} subtotalInCents={subtotalInCents} />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
