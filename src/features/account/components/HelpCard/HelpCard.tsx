import { LuBookOpen, LuCircleHelp, LuMessageSquare, LuChevronRight } from "react-icons/lu";

import styles from "./HelpCard.module.scss";

interface HelpCardProps {
  onHowItWorks?: () => void;
  onContactSupport?: () => void;
  onFaq?: () => void;
}

export default function HelpCard({ onHowItWorks, onContactSupport, onFaq }: HelpCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <h2>Need Help?</h2>

        <p>Resources to help you get the most out of TeamStore.</p>
      </div>

      <div className={styles.links}>
        <button type="button" onClick={onHowItWorks}>
          <div className={styles.left}>
            <LuBookOpen />

            <div>
              <h3>How It Works</h3>

              <span>Learn how TeamStore works.</span>
            </div>
          </div>

          <LuChevronRight className={styles.arrow} />
        </button>

        <button type="button" onClick={onFaq}>
          <div className={styles.left}>
            <LuCircleHelp />

            <div>
              <h3>Frequently Asked Questions</h3>

              <span>Find answers to common questions.</span>
            </div>
          </div>

          <LuChevronRight className={styles.arrow} />
        </button>

        <button type="button" onClick={onContactSupport}>
          <div className={styles.left}>
            <LuMessageSquare />

            <div>
              <h3>Contact Support</h3>

              <span>We're here whenever you need help.</span>
            </div>
          </div>

          <LuChevronRight className={styles.arrow} />
        </button>
      </div>
    </section>
  );
}
