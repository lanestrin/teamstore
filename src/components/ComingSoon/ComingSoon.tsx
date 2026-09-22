import { Link } from "react-router-dom";
import { LuConstruction } from "react-icons/lu";

import styles from "./ComingSoon.module.scss";

interface ComingSoonProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export default function ComingSoon({ title, description, actionLabel = "Return Home", actionHref = "/" }: ComingSoonProps) {
  return (
    <section className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon} aria-hidden="true">
          <LuConstruction />
        </div>

        <span className={styles.eyebrow}>In Development</span>

        <h1>{title}</h1>

        <p>{description}</p>

        <Link to={actionHref} className={styles.action}>
          {actionLabel}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
