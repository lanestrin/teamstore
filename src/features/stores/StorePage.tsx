import { useQuery } from "convex/react";
import { useParams } from "react-router-dom";

import { api } from "../../../convex/_generated/api";

import ProductCard from "../../components/product-card/ProductCard";
import jaguarsLogo from "../../assets/images/jaguars_logo.png";
import knightsLogo from "../../assets/images/knights_logo.png";
import lionsLogo from "../../assets/images/lions_logo.png";
import tigersLogo from "../../assets/images/tigers_logo.png";
import trojanLogo from "../../assets/images/trojan_logo.png";
import { fanwearProducts, requiredProducts } from "../../mocks/products";

import styles from "./StorePage.module.scss";

const demoStores = {
  "jaguars-soccer": {
    name: "Jaguars Soccer",
    organizationName: "Jaguars Athletics",
    description: "Official apparel and merchandise for Jaguars Soccer.",
    activity: "soccer",
    logo: jaguarsLogo,
  },
  "knights-baseball": {
    name: "Knights Baseball",
    organizationName: "Knights Athletics",
    description: "Official apparel and merchandise for Knights Baseball.",
    activity: "baseball",
    logo: knightsLogo,
  },
  "lions-track": {
    name: "Lions Track",
    organizationName: "Lions Athletics",
    description: "Official apparel and merchandise for Lions Track.",
    activity: "other",
    logo: lionsLogo,
  },
  "tigers-athletics": {
    name: "Tigers Athletics",
    organizationName: "Tigers Athletics",
    description: "Official apparel and merchandise for Tigers Athletics.",
    activity: "other",
    logo: tigersLogo,
  },
  "trojans-lacrosse": {
    name: "Trojans Lacrosse",
    organizationName: "Trojans Athletics",
    description: "Official apparel and merchandise for Trojans Lacrosse.",
    activity: "other",
    logo: trojanLogo,
  },
} as const;

function getDemoStore(storeSlug: string | undefined) {
  if (!storeSlug || !(storeSlug in demoStores)) {
    return null;
  }

  return demoStores[storeSlug as keyof typeof demoStores];
}

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

  const isDemoRoute = organizationSlug === "demo";
  const liveStore = useQuery(
    api.stores.getActiveStoreBySlugs,
    organizationSlug && storeSlug && !isDemoRoute
      ? {
          organizationSlug,
          storeSlug,
        }
      : "skip",
  );
  const demoStore = isDemoRoute ? getDemoStore(storeSlug) : null;
  const store = demoStore ?? liveStore;

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

  if (!isDemoRoute && store === undefined) {
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

  if (store == null) {
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
  const storeLogo = "logo" in store ? store.logo : jaguarsLogo;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <img src={storeLogo} alt={store.organizationName ?? storeName} className={styles.logo} />

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
