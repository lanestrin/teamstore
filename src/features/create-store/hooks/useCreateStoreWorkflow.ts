import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

import { useCreateStore, type ProductSelectionsDraft } from "../context/CreateStoreContext";

import { PRODUCT_COLLECTIONS } from "../steps/4_ProductsStep/lib/productCollections";

const STORE_ACTIVITIES = [
  "basketball",
  "baseball",
  "football",
  "soccer",
  "softball",
  "volleyball",
  "wrestling",
  "spirit-wear",
  "other",
] as const;

type StoreActivity = (typeof STORE_ACTIVITIES)[number];

function isStoreActivity(value: string): value is StoreActivity {
  return STORE_ACTIVITIES.some((activity) => activity === value);
}

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

function buildProductSelections(activity: StoreActivity, selections: ProductSelectionsDraft) {
  const collection = PRODUCT_COLLECTIONS[activity];

  const collectionProductIds = new Set(collection.map((item) => item.providerProductId));

  const collectionSelections = collection.flatMap((item) => {
    const selection = selections[item.providerProductId];

    if (!selection) {
      return [];
    }

    return [
      {
        providerProductId: selection.providerProductId,
        isRequired: selection.isRequired,
      },
    ];
  });

  const additionalSelections = Object.values(selections)
    .filter((selection) => !collectionProductIds.has(selection.providerProductId))
    .sort((first, second) => first.providerProductId.localeCompare(second.providerProductId))
    .map((selection) => ({
      providerProductId: selection.providerProductId,
      isRequired: selection.isRequired,
    }));

  return [...collectionSelections, ...additionalSelections];
}

interface CreateStoreWorkflow {
  isLoadingDraft: boolean;
  isSaving: boolean;
  isFinalizing: boolean;
  saveAndExit: () => Promise<void>;
  createStore: () => Promise<void>;
}

export function useCreateStoreWorkflow(): CreateStoreWorkflow {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { storeId, setStoreId, currentStep, primaryColor, secondaryColor, storeDraft, loadStoreDraft, resetStoreDraft } = useCreateStore();

  const draftIdParam = searchParams.get("draftId");

  const draftId = draftIdParam ? (draftIdParam as Id<"stores">) : null;

  const savedDraft = useQuery(
    api.organizations.getDraft,
    draftId
      ? {
          storeId: draftId,
        }
      : "skip",
  );

  const saveDraftMutation = useMutation(api.organizations.saveDraft);

  const createOrganizationWithStore = useMutation(api.organizations.createOrganizationWithStore);

  const loadedDraftIdRef = useRef<Id<"stores"> | null>(null);

  const handledMissingDraftRef = useRef(false);

  const [isSaving, setIsSaving] = useState(false);

  const [isFinalizing, setIsFinalizing] = useState(false);

  useEffect(() => {
    loadedDraftIdRef.current = null;
    handledMissingDraftRef.current = false;
  }, [draftId]);

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

      navigate("/account", {
        replace: true,
      });

      return;
    }

    if (loadedDraftIdRef.current === savedDraft._id) {
      return;
    }

    loadStoreDraft(savedDraft);

    loadedDraftIdRef.current = savedDraft._id;
  }, [draftId, savedDraft, loadStoreDraft, navigate]);

  async function saveAndExit(): Promise<void> {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      const organizationSlug = storeDraft.organizationSlug || slugify(storeDraft.organizationName);

      const result = await saveDraftMutation({
        storeId: storeId ?? undefined,

        organizationName: normalizeOptionalText(storeDraft.organizationName),

        organizationSlug: normalizeOptionalText(organizationSlug),

        activity: isStoreActivity(storeDraft.activity) ? storeDraft.activity : undefined,

        storeName: normalizeOptionalText(storeDraft.storeName),

        storeSlug: normalizeOptionalText(storeDraft.storeSlug),

        storeDescription: normalizeOptionalText(storeDraft.storeDescription),

        logoStorageId: storeDraft.logoStorageId ?? undefined,

        primaryColor,
        secondaryColor,
        currentStep,
      });

      setStoreId(result.storeId);

      navigate("/account");
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

    if (!isStoreActivity(activity)) {
      window.alert("Store activity is required.");

      return;
    }

    const productSelections = buildProductSelections(activity, storeDraft.productSelections);

    if (productSelections.length === 0) {
      window.alert("Select at least one product for your store.");

      return;
    }

    setIsFinalizing(true);

    try {
      const result = await createOrganizationWithStore({
        storeId: storeId ?? undefined,

        organizationName,
        organizationSlug,
        activity,

        storeName,
        storeSlug,

        storeDescription: normalizeOptionalText(storeDraft.storeDescription),

        logoStorageId: storeDraft.logoStorageId ?? undefined,

        primaryColor,
        secondaryColor,
        currentStep,

        productSelections,
      });

      resetStoreDraft();

      navigate(`/store/${result.organizationSlug}/${result.storeSlug}`);
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
