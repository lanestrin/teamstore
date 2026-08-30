import { Outlet } from "react-router-dom";

import { CreateStoreProvider, useCreateStore } from "../context/CreateStoreContext";
import { useCreateStoreWorkflow } from "../hooks/useCreateStoreWorkflow";

import ProgressSidebar from "../components/ProgressSidebar/ProgressSidebar";

import styles from "./CreateStoreLayout.module.scss";

export interface CreateStoreOutletContext {
  isFinalizing: boolean;
  createStore: () => Promise<void>;
}

function CreateStoreContent() {
  const { currentStep, furthestStepReached, setCurrentStep } = useCreateStore();

  const { isLoadingDraft, isSaving, isFinalizing, saveAndExit, createStore } = useCreateStoreWorkflow();

  if (isLoadingDraft) {
    return (
      <main className={styles.loading}>
        <p>Loading saved draft...</p>
      </main>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>
        <ProgressSidebar
          currentStep={currentStep}
          furthestStepReached={furthestStepReached}
          isSaving={isSaving}
          isFinalizing={isFinalizing}
          onStepChange={setCurrentStep}
          onSaveAndExit={saveAndExit}
        />
      </div>

      <main className={styles.content}>
        <Outlet
          context={
            {
              isFinalizing,
              createStore,
            } satisfies CreateStoreOutletContext
          }
        />
      </main>
    </div>
  );
}

export default function CreateStoreLayout() {
  return (
    <CreateStoreProvider>
      <CreateStoreContent />
    </CreateStoreProvider>
  );
}
