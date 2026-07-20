import { Link } from "react-router-dom";
import styles from "./HowItWorksPage.module.scss";

const steps = [
  {
    number: "01",
    title: "Choose your products",
    description:
      "Browse the catalog and select the apparel and accessories that make sense for your team, organization, or event.",
  },
  {
    number: "02",
    title: "Build your team store",
    description:
      "Create a customized storefront where your group can view products, select sizes, and place individual orders.",
  },
  {
    number: "03",
    title: "Share and order",
    description:
      "Send your store link to the team. Everyone orders directly through the store without collecting paper forms or payments.",
  },
];

const benefits = [
  "No paper order forms",
  "No collecting individual payments",
  "One shared store for the entire team",
  "Products and sizing shown in one place",
];

export function HowItWorksPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span className={styles.eyebrow}>How it works</span>

        <h1>A simpler way to outfit your team</h1>

        <p>
          TeamStore gives your organization one place to browse products, manage
          selections, and collect individual orders.
        </p>

        <div className={styles.heroActions}>
          <Link className={styles.primaryButton} to="/catalog">
            Browse the catalog
          </Link>

          <Link className={styles.secondaryButton} to="/account">
            View your account
          </Link>
        </div>
      </section>

      <section className={styles.process} aria-labelledby="process-heading">
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>The process</span>
          <h2 id="process-heading">From product selection to team orders</h2>
          <p>Everything is organized into three straightforward steps.</p>
        </div>

        <div className={styles.steps}>
          {steps.map((step) => (
            <article className={styles.stepCard} key={step.number}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.benefits}>
        <div className={styles.benefitsContent}>
          <span className={styles.eyebrow}>Why TeamStore</span>

          <h2>Less coordination. Fewer headaches.</h2>

          <p>
            Instead of managing spreadsheets, payment reminders, and individual
            order forms, your team gets a single shopping experience.
          </p>
        </div>

        <ul className={styles.benefitsList}>
          {benefits.map((benefit) => (
            <li key={benefit}>
              <span aria-hidden="true">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.cta}>
        <div>
          <span className={styles.eyebrow}>Get started</span>
          <h2>Ready to start building your store?</h2>
          <p>Explore the catalog and begin choosing products for your team.</p>
        </div>

        <Link className={styles.primaryButton} to="/catalog">
          Explore products
        </Link>
      </section>
    </main>
  );
}
