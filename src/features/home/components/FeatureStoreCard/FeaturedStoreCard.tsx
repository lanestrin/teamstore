import { Link } from "react-router-dom";

import styles from "./FeaturedStoreCard.module.scss";

interface Props {
  logo: string;
  name: string;
  products: number;
  slug: string;
}

export default function FeaturedStoreCard({ logo, name, products, slug }: Props) {
  return (
    <Link to={`/store/${slug}`} className={styles.card}>
      <div className={styles.logo}>
        <img src={logo} alt={name} className={styles.logoImage} />
      </div>

      <h3>{name}</h3>

      <p>{products} Products</p>
    </Link>
  );
}
