import { useEffect, useRef, useState } from "react";

import { isStoreActivity } from "../config/storeActivities";
import { useCreateStore } from "../context/CreateStoreContext";
import type { ProductSelectionsDraft } from "../context/CreateStoreContext.types";
import type { FinalizeStoreResult } from "../types/backend";
import { useStoreBuilderAdapter } from "../context/StoreBuilderAdapterContext";

function normalizeOptionalText(value: string): string | undefined {
  const normalizedValue = value.trim();

  return normalizedValue || undefined;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function buildProductSelections(selections: ProductSelectionsDraft) {
  return Object.values(selections)
    .sort((first, second) => first.productId.localeCompare(second.productId))
    .map((selection) => ({
      productId: selection.productId,
      colorKey: selection.colorKey,
      artworkTemplateId: selection.artworkTemplateId,
      artworkPlacement: selection.artworkPlacement,
      isRequired: selection.isRequired,
    }));
}

interface CreateStoreWorkflowOptions {
  draftId: string | null;
  onDraftIdChange: (draftId: string) => void;
  onExit: () => void;
  onComplete: (result: FinalizeStoreResult) => void;
}

interface CreateStoreWorkflow {
  isLoadingDraft: boolean;
  isSaving: boolean;
  isFinalizing: boolean;
  saveAndExit: () => Promise<void>;
  createStore: () => Promise<void>;
}

export function useCreateStoreWorkflow({ draftId, onDraftIdChange, onExit, onComplete }: CreateStoreWorkflowOptions): CreateStoreWorkflow {
  const adapter = useStoreBuilderAdapter();

  const {
    storeId,
    setStoreId,
    currentStep,
    primaryColor,
    secondaryColor,
    storeDraft,
    artworkSvgsByTemplateId,
    updateStoreDraft,
    loadStoreDraft,
    resetStoreDraft,
  } = useCreateStore();

  const loadedDraftIdRef = useRef<string | null>(null);
  const handledMissingDraftRef = useRef(false);
  const [loadedDraftRequest, setLoadedDraftRequest] = useState<{
    draftId: string;
    draft: Awaited<ReturnType<typeof adapter.loadDraft>>;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    if (!draftId) {
      return;
    }

    let isCancelled = false;

    void adapter.loadDraft(draftId).then((draft) => {
      if (!isCancelled) {
        setLoadedDraftRequest({
          draftId,
          draft,
        });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [adapter, draftId]);

  const savedDraft = draftId && loadedDraftRequest?.draftId === draftId ? loadedDraftRequest.draft : undefined;

  useEffect(() => {
    if (!draftId || savedDraft === undefined) {
      return;
    }

    if (savedDraft === null) {
      if (handledMissingDraftRef.current) {
        return;
      }

      handledMissingDraftRef.current = true;

      window.alert("This draft could not be found or you do not have access to it.");

      onExit();

      return;
    }

    handledMissingDraftRef.current = false;

    if (loadedDraftIdRef.current === savedDraft._id) {
      return;
    }

    loadStoreDraft(savedDraft);

    loadedDraftIdRef.current = savedDraft._id;
  }, [draftId, savedDraft, loadStoreDraft, onExit]);

  async function prepareUploadedArtworks() {
    const uploadedArtworks = await Promise.all(
      storeDraft.uploadedArtworks.map(async (artwork) => {
        let storageId = artwork.storageId;

        if (!storageId) {
          if (!artwork.file) {
            throw new Error(`${artwork.fileName} needs to be uploaded again.`);
          }

          storageId = await adapter.uploadFile(artwork.file);
        }

        return {
          id: artwork.id,
          fileName: artwork.fileName,
          storageId,
          isSelected: artwork.isSelected,
        };
      }),
    );

    updateStoreDraft({
      uploadedArtworks: storeDraft.uploadedArtworks.map((artwork) => ({
        ...artwork,

        storageId: uploadedArtworks.find((savedArtwork) => savedArtwork.id === artwork.id)?.storageId ?? artwork.storageId,
      })),
    });

    return uploadedArtworks;
  }

  function buildArtworkSnapshots(productSelections: ReturnType<typeof buildProductSelections>) {
    const usedArtworkTemplateIds = [...new Set(productSelections.map((selection) => selection.artworkTemplateId))];

    return usedArtworkTemplateIds.flatMap((artworkTemplateId) => {
      const svg = artworkSvgsByTemplateId[artworkTemplateId];

      if (!svg) {
        return [];
      }

      return [
        {
          artworkTemplateId,
          svg,
        },
      ];
    });
  }

  async function saveAndExit(): Promise<void> {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const organizationSlug = storeDraft.organizationSlug || slugify(storeDraft.organizationName);
      const uploadedArtworks = await prepareUploadedArtworks();
      const productSelections = buildProductSelections(storeDraft.productSelections);
      const result = await adapter.saveDraft({
        storeId: storeId ?? undefined,
        organizationName: normalizeOptionalText(storeDraft.organizationName),
        organizationSlug: normalizeOptionalText(organizationSlug),
        activity: isStoreActivity(storeDraft.activity) ? storeDraft.activity : undefined,
        storeType: storeDraft.storeType || undefined,
        storeName: normalizeOptionalText(storeDraft.storeName),
        storeSlug: normalizeOptionalText(storeDraft.storeSlug),
        storeDescription: normalizeOptionalText(storeDraft.storeDescription),
        logoStorageId: storeDraft.logoStorageId ?? undefined,
        uploadedArtworks,
        primaryColor,
        secondaryColor,
        productSelections,
        requiredItemsDeadline: normalizeOptionalText(storeDraft.requiredItemsDeadline),
        currentStep,
      });

      setStoreId(result.storeId);
      onDraftIdChange(result.storeId);
      onExit();
    } catch (error) {
      window.alert(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  async function createStore(): Promise<void> {
    if (isFinalizing) {
      return;
    }

    const organizationName = storeDraft.organizationName.trim();
    const organizationSlug = storeDraft.organizationSlug.trim() || slugify(organizationName);
    const activity = storeDraft.activity.trim();
    const storeType = storeDraft.storeType;
    const storeName = storeDraft.storeName.trim();
    const storeSlug = storeDraft.storeSlug.trim();

    if (!organizationName) {
      window.alert("Organization name is required.");

      return;
    }

    if (!storeName) {
      window.alert("Store name is required.");

      return;
    }

    if (!storeSlug) {
      window.alert("Store address is required.");

      return;
    }

    if (!storeType) {
      window.alert("Store type is required.");

      return;
    }

    if (!isStoreActivity(activity)) {
      window.alert("Store activity is required.");

      return;
    }

    const productSelections = buildProductSelections(storeDraft.productSelections);

    if (productSelections.length === 0) {
      window.alert("Select at least one product for your store.");

      return;
    }

    const hasRequiredProducts = productSelections.some((selection) => selection.isRequired);
    const requiredItemsDeadline = normalizeOptionalText(storeDraft.requiredItemsDeadline);

    if (hasRequiredProducts && !requiredItemsDeadline) {
      window.alert("Set a deadline for required products before creating the store.");

      return;
    }

    const artworkSnapshots = buildArtworkSnapshots(productSelections);

    setIsFinalizing(true);

    try {
      const uploadedArtworks = await prepareUploadedArtworks();
      const result = await adapter.finalizeStore({
        storeId: storeId ?? undefined,

        organizationName,
        organizationSlug,
        activity,
        storeType,
        storeName,
        storeSlug,
        storeDescription: normalizeOptionalText(storeDraft.storeDescription),
        logoStorageId: storeDraft.logoStorageId ?? undefined,
        uploadedArtworks,
        artworkSnapshots,
        primaryColor,
        secondaryColor,
        currentStep,
        productSelections,
        requiredItemsDeadline,
      });

      resetStoreDraft();
      onComplete(result);
    } catch (error) {
      window.alert(getErrorMessage(error));
    } finally {
      setIsFinalizing(false);
    }
  }

  return {
    isLoadingDraft: draftId !== null && savedDraft === undefined,

    isSaving,
    isFinalizing,
    saveAndExit,
    createStore,
  };
}
