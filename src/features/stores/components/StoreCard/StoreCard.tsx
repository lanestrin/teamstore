import { Link } from "react-router-dom";

import styles from "./StoreCard.module.scss";

interface StoreCardProps {
  name: string;
  slug: string;
  description: string;
}

export default function StoreCard({ name, slug, description }: StoreCardProps) {
  return (
    <article className={styles.card}>
      <h3 className={styles.title}>{name}</h3>

      <p className={styles.description}>{description}</p>

      <Link to={`/store/${slug}`} className={styles.button}>
        View Store
      </Link>
    </article>
  );
}
