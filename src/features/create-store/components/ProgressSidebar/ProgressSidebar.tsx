import { Link } from "react-router-dom";
import { LuCheck, LuLogOut } from "react-icons/lu";

import { images } from "../../../../assets/images";

import styles from "./ProgressSidebar.module.scss";

interface ProgressSidebarProps {
  currentStep: number;

  isSaving: boolean;
  isFinalizing: boolean;

  onSaveAndExit: () => Promise<void>;
  onCreateStore: () => Promise<void>;
}

const steps = [
  {
    title: "Choose Colors",
    description: "Pick your team colors",
  },
  {
    title: "Organization",
    description: "Tell us about your team",
  },
  {
    title: "Artwork",
    description: "Choose and customize your artwork",
  },
  {
    title: "Products",
    description: "Choose what to sell",
  },
  {
    title: "Review",
    description: "Review and publish",
  },
];

export default function ProgressSidebar({
  currentStep,
  isSaving,
  isFinalizing,
  onSaveAndExit,
  onCreateStore,
}: ProgressSidebarProps) {
  const isWorking = isSaving || isFinalizing;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <Link to="/" className={styles.logo}>
          <img
            src={images.teamstore.teamstoreLogo}
            alt="TeamStore"
            className={styles.logoImage}
          />
        </Link>

        <span className={styles.label}>Create Your Store</span>

        <h2>TeamStore Setup</h2>

        <p>Build your online store in just a few minutes.</p>
      </div>

      <nav className={styles.steps} aria-label="Store creation progress">
        {steps.map((step, index) => {
          const stepNumber = index + 1;

          const isActive = stepNumber === currentStep;

          const isComplete = stepNumber < currentStep;

          return (
            <div
              key={step.title}
              className={styles.step}
              aria-current={isActive ? "step" : undefined}
            >
              {index < steps.length - 1 && (
                <div
                  className={`${styles.line} ${
                    isComplete ? styles.lineComplete : ""
                  }`}
                />
              )}

              <div
                className={`${styles.circle} ${isActive ? styles.active : ""} ${
                  isComplete ? styles.complete : ""
                }`}
              >
                {isComplete ? <LuCheck aria-hidden="true" /> : stepNumber}
              </div>

              <div className={styles.content}>
                <h3>{step.title}</h3>

                <p>{step.description}</p>
              </div>
            </div>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.exitButton}
          onClick={() => void onSaveAndExit()}
          disabled={isWorking}
        >
          <LuLogOut aria-hidden="true" />

          <div>
            <span>{isSaving ? "Saving..." : "Save & Exit"}</span>

            <small>Save your progress and return later</small>
          </div>
        </button>

        {currentStep === 5 && (
          <button
            type="button"
            className={styles.createButton}
            onClick={() => void onCreateStore()}
            disabled={isWorking}
          >
            {isFinalizing ? "Creating Store..." : "Create Store"}
          </button>
        )}
      </div>
    </aside>
  );
}
