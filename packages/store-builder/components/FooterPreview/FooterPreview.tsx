import { LuMessageCircle, LuRuler, LuLock } from "react-icons/lu";

import styles from "./FooterPreview.module.scss";

interface FooterPreviewProps {
  brandColor: string;
}

export default function FooterPreview({ brandColor }: FooterPreviewProps) {
  return (
    <footer className={styles.footer}>
      <div>
        <LuMessageCircle style={{ color: brandColor }} />

        <strong>Need Help?</strong>

        <span>Contact us anytime</span>
      </div>

      <div>
        <LuRuler style={{ color: brandColor }} />

        <strong>Sizing Guide</strong>

        <span>Find your perfect fit</span>
      </div>

      <div>
        <LuLock style={{ color: brandColor }} />

        <strong>Secure Checkout</strong>

        <span>Safe and encrypted</span>
      </div>
    </footer>
  );
}
