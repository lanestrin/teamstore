import CreateStorePage from "../CreateStorePage";
import ProgressSidebar from "../components/ProgressSidebar/ProgressSidebar";
import { CreateStoreProvider, useCreateStore } from "../context/CreateStoreContext";
import { StoreBuilderAdapterContext } from "../context/StoreBuilderAdapterContext";
import { useCreateStoreWorkflow } from "../hooks/useCreateStoreWorkflow";
import type { FinalizeStoreResult, StoreBuilderAdapter } from "../types/backend";
import type { StoreBuilderBranding } from "../types/branding";

import styles from "./CreateStoreLayout.module.scss";

export interface CreateStoreLayoutProps {
  branding: StoreBuilderBranding;
  adapter: StoreBuilderAdapter;
  draftId: string | null;
  onDraftIdChange: (draftId: string) => void;
  onExit: () => void;
  onComplete: (result: FinalizeStoreResult) => void;
}

interface CreateStoreContentProps {
  branding: StoreBuilderBranding;
  draftId: string | null;
  onDraftIdChange: (draftId: string) => void;
  onExit: () => void;
  onComplete: (result: FinalizeStoreResult) => void;
}

function CreateStoreContent({ branding, draftId, onDraftIdChange, onExit, onComplete }: CreateStoreContentProps) {
  const { currentStep, furthestStepReached, setCurrentStep, storeDraft } = useCreateStore();

  const { isLoadingDraft, isSaving, isFinalizing, saveAndExit, createStore } = useCreateStoreWorkflow({
    draftId,
    onDraftIdChange,
    onExit,
    onComplete,
  });

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
          storeType={storeDraft.storeType}
          branding={branding}
          isSaving={isSaving}
          isFinalizing={isFinalizing}
          onStepChange={setCurrentStep}
          onSaveAndExit={saveAndExit}
        />
      </div>

      <main className={styles.content}>
        <CreateStorePage isFinalizing={isFinalizing} onCreateStore={createStore} onDraftIdChange={onDraftIdChange} />
      </main>
    </div>
  );
}

export default function CreateStoreLayout({ branding, adapter, draftId, onDraftIdChange, onExit, onComplete }: CreateStoreLayoutProps) {
  return (
    <StoreBuilderAdapterContext.Provider value={adapter}>
      <CreateStoreProvider>
        <div className={styles.storeBuilder}>
          <CreateStoreContent
            branding={branding}
            draftId={draftId}
            onDraftIdChange={onDraftIdChange}
            onExit={onExit}
            onComplete={onComplete}
          />
        </div>
      </CreateStoreProvider>
    </StoreBuilderAdapterContext.Provider>
  );
}
