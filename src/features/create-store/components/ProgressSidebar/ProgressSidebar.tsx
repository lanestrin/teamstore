import { Link } from "react-router-dom";
import { LuCheck, LuLogOut } from "react-icons/lu";

import { images } from "../../../../assets/images";

import styles from "./ProgressSidebar.module.scss";
import ComingSoonBadge from "../../../../components/coming-soon-badge/ComingSoonBadge";

interface ProgressSidebarProps {
  currentStep: number;
  furthestStepReached: number;

  isSaving: boolean;
  isFinalizing: boolean;

  onStepChange: (step: number) => void;
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
    comingSoon: true,
  },
];

export default function ProgressSidebar({
  currentStep,
  furthestStepReached,
  isSaving,
  isFinalizing,
  onStepChange,
  onSaveAndExit,
  onCreateStore,
}: ProgressSidebarProps) {
  const isWorking = isSaving || isFinalizing;

  return (
    <aside className={styles.sidebar}>
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

          /*
           * Review is not implemented yet, so only
           * Steps 1–4 can be used for sidebar navigation.
           */
          const canNavigate = stepNumber <= furthestStepReached && stepNumber <= 4 && !isWorking;

          return (
            <button
              key={step.title}
              type="button"
              className={styles.step}
              aria-current={isActive ? "step" : undefined}
              disabled={!canNavigate}
              onClick={() => onStepChange(stepNumber)}
            >
              {index < steps.length - 1 && <div className={`${styles.line} ${isComplete ? styles.lineComplete : ""}`} aria-hidden="true" />}

              <div className={`${styles.circle} ${isActive ? styles.active : ""} ${isComplete ? styles.complete : ""}`}>
                {isComplete && !isActive ? <LuCheck aria-hidden="true" /> : stepNumber}
              </div>

              <div className={styles.content}>
                <div className={styles.stepTitle}>
                  <h3>{step.title}</h3>

                  {step.comingSoon && <ComingSoonBadge />}
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

        {currentStep === 5 && (
          <button type="button" className={styles.createButton} onClick={() => void onCreateStore()} disabled={isWorking}>
            {isFinalizing ? "Creating Store..." : "Create Store"}
          </button>
        )}
      </div>
    </aside>
  );
}
