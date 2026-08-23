import styles from "./FeaturedStores.module.scss";

import jaguarsLogo from "../../../../assets/images/jaguars_logo.png";
import knightsLogo from "../../../../assets/images/knights_logo.png";
import lionsLogo from "../../../../assets/images/lions_logo.png";
import tigersLogo from "../../../../assets/images/tigers_logo.png";
import trojanLogo from "../../../../assets/images/trojan_logo.png";
import FeaturedStoreCard from "../FeatureStoreCard/FeaturedStoreCard";

const stores = [
  {
    organizationSlug: "demo",
    slug: "jaguars-soccer",
    name: "Jaguars Soccer",
    products: 124,
    logo: jaguarsLogo,
  },
  {
    organizationSlug: "demo",
    slug: "knights-baseball",
    name: "Knights Baseball",
    products: 96,
    logo: knightsLogo,
  },
  {
    organizationSlug: "demo",
    slug: "lions-track",
    name: "Lions Track",
    products: 88,
    logo: lionsLogo,
  },
  {
    organizationSlug: "demo",
    slug: "tigers-athletics",
    name: "Tigers Athletics",
    products: 156,
    logo: tigersLogo,
  },
  {
    organizationSlug: "demo",
    slug: "trojans-lacrosse",
    name: "Trojans Lacrosse",
    products: 74,
    logo: trojanLogo,
  },
];
export default function FeaturedStores() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Featured Stores</h2>

        <a href="/stores">View all stores →</a>
      </div>

      <div className={styles.grid}>
        {stores.map((store) => (
          <FeaturedStoreCard key={store.slug} {...store} />
        ))}
      </div>
    </section>
  );
}
