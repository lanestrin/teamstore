import { Link } from "react-router-dom";
import { LuCheck, LuLogOut } from "react-icons/lu";

import { images } from "../../../../assets/images";

import styles from "./ProgressSidebar.module.scss";

interface ProgressSidebarProps {
  currentStep: number;
  furthestStepReached: number;

  isSaving: boolean;
  isFinalizing: boolean;

  onStepChange: (step: number) => void;
  onSaveAndExit: () => Promise<void>;
}

const steps = [
  {
    title: "Organization",
    description: "Tell us about your team",
  },
  {
    title: "Choose Colors",
    description: "Pick your team colors",
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
  furthestStepReached,
  isSaving,
  isFinalizing,
  onStepChange,
  onSaveAndExit,
}: ProgressSidebarProps) {
  const isWorking = isSaving || isFinalizing;
  const currentStepData = steps[currentStep - 1];

  return (
    <>
      <aside className={styles.desktopSidebar}>
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>
            <img src={images.teamstore.teamstoreLogo} alt="TeamStore" className={styles.logoImage} />
          </Link>

          <span className={styles.label}>Create Your Store</span>

          <h2>TeamStore Setup</h2>

          <p>Build your online store in just a few minutes.</p>
        </div>

        <nav className={styles.steps} aria-label="Store creation progress">
          {steps.map((step, index) => {
            const stepNumber = index + 1;

            const isActive = stepNumber === currentStep;
            const isComplete = stepNumber < furthestStepReached;
            const canNavigate = stepNumber <= furthestStepReached && !isWorking;

            return (
              <button
                key={step.title}
                type="button"
                className={styles.step}
                aria-current={isActive ? "step" : undefined}
                disabled={!canNavigate}
                onClick={() => onStepChange(stepNumber)}
              >
                {index < steps.length - 1 && (
                  <div className={`${styles.line} ${isComplete ? styles.lineComplete : ""}`} aria-hidden="true" />
                )}

                <div className={`${styles.circle} ${isActive ? styles.active : ""} ${isComplete ? styles.complete : ""}`}>
                  {isComplete && !isActive ? <LuCheck aria-hidden="true" /> : stepNumber}
                </div>

                <div className={styles.content}>
                  <div className={styles.stepTitle}>
                    <h3>{step.title}</h3>
                  </div>

                  <p>{step.description}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <button type="button" className={styles.exitButton} onClick={() => void onSaveAndExit()} disabled={isWorking}>
            <LuLogOut aria-hidden="true" />

            <div>
              <span>{isSaving ? "Saving..." : "Save & Exit"}</span>

              <small>Save your progress and return later</small>
            </div>
          </button>
        </div>
      </aside>

      <header className={styles.mobileHeader}>
        <div className={styles.mobileTopRow}>
          <div className={styles.mobileStepInfo}>
            <span>
              Step {currentStep} of {steps.length}
            </span>

            <strong>{currentStepData?.title}</strong>
          </div>

          <button
            type="button"
            className={styles.mobileExitButton}
            onClick={() => void onSaveAndExit()}
            disabled={isWorking}
            aria-label={isSaving ? "Saving store" : "Save store and exit"}
          >
            <LuLogOut aria-hidden="true" />

            <span>{isSaving ? "Saving..." : "Save & Exit"}</span>
          </button>
        </div>

        <nav className={styles.mobileSteps} aria-label="Store creation progress">
          {steps.map((step, index) => {
            const stepNumber = index + 1;

            const isActive = stepNumber === currentStep;
            const isComplete = stepNumber < furthestStepReached;
            const canNavigate = stepNumber <= furthestStepReached && !isWorking;

            return (
              <button
                key={step.title}
                type="button"
                className={`${styles.mobileStep} ${isActive ? styles.mobileStepActive : ""} ${isComplete ? styles.mobileStepComplete : ""}`}
                aria-current={isActive ? "step" : undefined}
                aria-label={`${step.title}, step ${stepNumber} of ${steps.length}${isComplete ? ", completed" : ""}${
                  isActive ? ", current step" : ""
                }`}
                disabled={!canNavigate}
                onClick={() => onStepChange(stepNumber)}
              >
                <span className={styles.mobileStepCircle} aria-hidden="true">
                  {isComplete && !isActive ? <LuCheck /> : stepNumber}
                </span>
              </button>
            );
          })}
        </nav>
      </header>
    </>
  );
}
