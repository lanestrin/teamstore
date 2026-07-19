import ProductCard from "../../components/product-card/ProductCard";
import jaguarsLogo from "../../assets/images/jaguars_logo.png";
import { fanwearProducts, requiredProducts } from "../../mocks/products";
import styles from "./StorePage.module.scss";

function createProductCardData(product: (typeof requiredProducts)[number]) {
  return {
    id: String(product.id),
    name: product.name,
    imageUrl: product.image,
    priceLabel: `$${product.price.toFixed(2)}`,
    productUrl: `/product/${product.slug}`,
    deadline: product.deadline,
    inCart: product.inCart,
  };
}

export default function StorePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <img
            src={jaguarsLogo}
            alt="Jaguars Soccer"
            className={styles.logo}
          />

          <div>
            <span className={styles.storeLabel}>OFFICIAL TEAM STORE</span>

            <h1>Jaguars Soccer</h1>

            <p>
              Team uniforms, required apparel, spirit wear, and fan gear for
              players, families, and supporters.
            </p>

            <div className={styles.storeMeta}>
              <span>124 Products</span>
              <span>Fall 2026 Season</span>
              <span>Deadline Aug 15</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.requiredSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Required Team Items</h2>

            <p>These items are required for all rostered players.</p>
          </div>
        </div>

        <div className={styles.deadlineBanner}>
          <div className={styles.deadlineIcon}>⚠</div>

          <div>
            <strong>REQUIRED ITEMS ORDER DEADLINE</strong>

            <span>August 15, 2026 • 12 Days Remaining</span>

            <small>
              All required team items must be ordered before the deadline.
            </small>
          </div>
        </div>

        <div className={styles.requiredGrid}>
          {requiredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={createProductCardData(product)}
              showDeadline
              showRequiredStatus
            />
          ))}
        </div>
      </section>

      <section className={styles.fanwearSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Featured Fanwear</h2>

            <p>
              Optional apparel and accessories for family, friends, alumni, and
              supporters.
            </p>
          </div>
        </div>

        <div className={styles.fanwearGrid}>
          {fanwearProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={createProductCardData(product)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
