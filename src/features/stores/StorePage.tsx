import { useQuery } from "convex/react";
import { useParams } from "react-router-dom";

import { api } from "../../../convex/_generated/api";

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

function formatActivity(activity: string | undefined): string | null {
  if (!activity) {
    return null;
  }

  return activity
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function StorePage() {
  const { organizationSlug, storeSlug } = useParams<{
    organizationSlug: string;
    storeSlug: string;
  }>();

  const store = useQuery(
    api.organizations.getActiveStoreBySlugs,
    organizationSlug && storeSlug
      ? {
          organizationSlug,
          storeSlug,
        }
      : "skip",
  );

  if (!organizationSlug || !storeSlug) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div>
              <span className={styles.storeLabel}>TEAMSTORE</span>
              <h1>Store not found</h1>
              <p>The requested store address is invalid.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (store === undefined) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div>
              <span className={styles.storeLabel}>TEAMSTORE</span>
              <h1>Loading store...</h1>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (store === null) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div>
              <span className={styles.storeLabel}>TEAMSTORE</span>
              <h1>Store not found</h1>
              <p>This store does not exist or is not currently active.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const activityLabel = formatActivity(store.activity);
  const productCount = requiredProducts.length + fanwearProducts.length;

  const storeName = store.name ?? store.organizationName ?? "Team Store";

  const storeDescription = store.description ?? `Official apparel and merchandise for ${store.organizationName ?? "this organization"}.`;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <img src={jaguarsLogo} alt={store.organizationName ?? storeName} className={styles.logo} />

          <div>
            <span className={styles.storeLabel}>OFFICIAL TEAM STORE</span>

            <h1>{storeName}</h1>

            <p>{storeDescription}</p>

            <div className={styles.storeMeta}>
              <span>{productCount} Products</span>

              {activityLabel && <span>{activityLabel}</span>}

              {store.organizationName && <span>{store.organizationName}</span>}
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

            <small>All required team items must be ordered before the deadline.</small>
          </div>
        </div>

        <div className={styles.requiredGrid}>
          {requiredProducts.map((product) => (
            <ProductCard key={product.id} product={createProductCardData(product)} showDeadline showRequiredStatus />
          ))}
        </div>
      </section>

      <section className={styles.fanwearSection}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>Featured Fanwear</h2>

            <p>Optional apparel and accessories for family, friends, alumni, and supporters.</p>
          </div>
        </div>

        <div className={styles.fanwearGrid}>
          {fanwearProducts.map((product) => (
            <ProductCard key={product.id} product={createProductCardData(product)} />
          ))}
        </div>
      </section>
    </div>
  );
}
