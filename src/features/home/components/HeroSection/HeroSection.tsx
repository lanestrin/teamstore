import { Link } from "react-router-dom";

import heroBanner from "../../../../assets/images/hero-banner.webp";
import FeaturesBar from "../FeaturesBar/FeaturesBar";

import styles from "./HeroSection.module.scss";

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      <img
        src={heroBanner}
        alt="TeamStore Hero"
        className={styles.background}
      />

      <div className={styles.overlay}>
        <div className={styles.content}>
          <span className={styles.kicker}>GEAR UP.</span>

          <h1 className={styles.title}>
            REP YOUR TEAM.
            <br />
            <span>MAKE IT HAPPEN.</span>
          </h1>

          <p className={styles.description}>
            Custom apparel and fan gear for teams,
            schools, clubs, and organizations.
          </p>

          <div className={styles.actions}>
            <Link to="/stores" className={styles.primaryButton}>
              SHOP STORES
            </Link>

            <Link to="/categories" className={styles.secondaryButton}>
              BROWSE CATEGORIES
            </Link>
          </div>
        </div>
      </div>

      <div className={styles.heroFooter}>
        <FeaturesBar />
      </div>
    </section>
  );
}
