import { Outlet } from "react-router-dom";

import {
  CreateStoreProvider,
  useCreateStore,
} from "../context/CreateStoreContext";

import LivePreview from "../components/LivePreview/LivePreview";
import ProgressSidebar from "../components/ProgressSidebar/ProgressSidebar";
import ResizablePanel from "../components/ResizablePanel/ResizablePanel";

import { useCreateStoreWorkflow } from "./useCreateStoreWorkflow";

import styles from "./CreateStoreLayout.module.scss";

function CreateStoreContent() {
  const { currentStep } = useCreateStore();

  const { isLoadingDraft, isSaving, isFinalizing, saveAndExit, createStore } =
    useCreateStoreWorkflow();

  const showLivePreview = currentStep === 1 || currentStep === 2;

  if (isLoadingDraft) {
    return (
      <div className={styles.layout}>
        <main className={styles.loading}>
          <p>Loading saved draft...</p>
        </main>
      </div>
    );
  }

  const stepContent = (
    <main className={styles.contentInner}>
      <Outlet />
    </main>
  );

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <ProgressSidebar
          currentStep={currentStep}
          isSaving={isSaving}
          isFinalizing={isFinalizing}
          onSaveAndExit={saveAndExit}
          onCreateStore={createStore}
        />
      </aside>

      {showLivePreview ? (
        <ResizablePanel
          className={styles.resizable}
          storageKey="teamstore-create-store-layout"
          defaultLeftPercent={50}
          minLeftPercent={35}
          maxLeftPercent={70}
          leftClassName={styles.content}
          rightClassName={styles.preview}
          left={stepContent}
          right={<LivePreview />}
        />
      ) : (
        stepContent
      )}
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
