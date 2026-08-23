import { useState } from "react";

import DemoPathModal from "../demo-path-modal/DemoPathModal";

import styles from "./PreviewBanner.module.scss";

export default function PreviewBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [isDemoOpen, setIsDemoOpen] = useState(false);

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div className={styles.banner} role="region" aria-label="TeamStore preview notice">
        <div className={styles.inner}>
          <p className={styles.message}>
            <strong>TEAMSTORE PREVIEW:</strong>{" "}
            <span>This application is actively being developed. Some features are limited to demo functionality.</span>
          </p>

          <button type="button" className={styles.demoLink} onClick={() => setIsDemoOpen(true)}>
            View Demo Path
          </button>

          <button type="button" className={styles.closeButton} aria-label="Dismiss preview notice" onClick={() => setIsVisible(false)}>
            ×
          </button>
        </div>
      </div>

      <DemoPathModal isOpen={isDemoOpen} onClose={() => setIsDemoOpen(false)} />
    </>
  );
}
