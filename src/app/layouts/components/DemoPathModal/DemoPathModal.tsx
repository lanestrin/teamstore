import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { LuX } from "react-icons/lu";

import styles from "./DemoPathModal.module.scss";

interface DemoPathModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const demoSteps = [
  {
    number: "01",
    title: "Browse Stores",
    description: "Explore sample team stores.",
  },
  {
    number: "02",
    title: "View Products",
    description: "See products available to teams.",
  },
  {
    number: "03",
    title: "Sign In",
    description: "Access account features.",
  },
  {
    number: "04",
    title: "Create a Store",
    description: "Start the store builder.",
  },
  {
    number: "05",
    title: "Customize Artwork",
    description: "Choose and customize team art.",
  },
  {
    number: "06",
    title: "Select Products",
    description: "Build your store assortment.",
  },
];

export default function DemoPathModal({ isOpen, onClose }: DemoPathModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="demo-path-title">
        <button type="button" className={styles.closeButton} aria-label="Close demo path" onClick={onClose}>
          <LuX aria-hidden="true" />
        </button>

        <div className={styles.header}>
          <span className={styles.eyebrow}>Recommended Demo</span>

          <h2 id="demo-path-title">See How TeamStore Works</h2>

          <p>Follow this path to explore the strongest parts of the current TeamStore preview.</p>
        </div>

        <ol className={styles.steps}>
          {demoSteps.map((step, index) => (
            <li key={step.number} className={styles.step}>
              <div className={styles.stepMarker}>
                <span className={styles.number}>{step.number}</span>

                {index < demoSteps.length - 1 && (
                  <span className={styles.connector} aria-hidden="true">
                    ↓
                  </span>
                )}
              </div>

              <div className={styles.stepContent}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.footer}>
          <Link to="/stores" className={styles.startButton} onClick={onClose}>
            Start Demo
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>,
    document.body,
  );
}
