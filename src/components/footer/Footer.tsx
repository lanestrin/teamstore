import { Link } from "react-router-dom";
import { LuMessageCircleMore, LuPhone } from "react-icons/lu";
import { FaInstagram, FaFacebookF, FaXTwitter, FaYoutube, FaTiktok } from "react-icons/fa6";

import styles from "./Footer.module.scss";
import { images } from "../../assets/images";
import ComingSoonBadge from "../coming-soon-badge/ComingSoonBadge";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <img src={images.teamstore.teamstoreLogo} alt="TeamStore" className={styles.logo} />

          <p>Custom apparel and fan gear for teams, schools, clubs, and organizations.</p>

          <div className={styles.brandSocials}>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <FaInstagram />
            </a>

            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              <FaFacebookF />
            </a>

            <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X">
              <FaXTwitter />
            </a>

            <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube">
              <FaYoutube />
            </a>

            <a href="https://tiktok.com" target="_blank" rel="noreferrer" aria-label="TikTok">
              <FaTiktok />
            </a>
          </div>
        </div>

        <nav className={styles.navigation}>
          <div>
            <h4>Shop</h4>
            <Link to="/stores">Stores</Link>
            <Link to="/products">Catalog</Link>
            <Link to="/new">New Arrivals</Link>
          </div>

          <div>
            <h4>Company</h4>
            <Link to="/about">About</Link>
            <Link to="/how-it-works">How It Works</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/careers">Careers</Link>
          </div>

          <div>
            <h4>Help</h4>
            <Link to="/sizechart">Size Chart</Link>
            <Link to="/faqs">FAQs</Link>
            <Link to="/terms">Terms of Use</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/accessibility">Accessibility</Link>
          </div>
        </nav>

        <div className={styles.supportCard}>
          <span className={styles.supportLabel}>REAL PEOPLE. REAL SUPPORT.</span>

          <a href="#" className={`${styles.supportItem} ${styles.supportLink}`}>
            <div className={styles.iconCircle}>
              <LuMessageCircleMore />
            </div>

            <div>
              <div className={styles.supportTitleRow}>
                <strong>Live Chat</strong>
                <ComingSoonBadge />
              </div>

              <span className={styles.online}>
                <span className={styles.onlineDot} />
                Chat with a real TeamStore specialist
              </span>
            </div>
          </a>

          <div className={styles.supportItem}>
            <div className={styles.iconCircle}>
              <LuPhone />
            </div>

            <div>
              <div className={styles.supportTitleRow}>
                <strong>Call Us</strong>
                <ComingSoonBadge />
              </div>

              <span>877.597.8086</span>
              <span>Monday – Friday 7am – 6pm CT</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} TeamStore. All rights reserved.</span>
      </div>
    </footer>
  );
}
