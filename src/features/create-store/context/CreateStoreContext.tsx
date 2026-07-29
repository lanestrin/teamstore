/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type { Doc, Id } from "../../../../convex/_generated/dataModel";

import type { ArtworkAdjustments } from "../feature/3_ArtworkStep/artworkEditor";

const DEFAULT_PRIMARY_COLOR = "#111827";
const DEFAULT_SECONDARY_COLOR = "#DC2626";

export interface ArtworkTextDraft {
  organizationName: string;
  yearEstablished: string;
  mascotName: string;
}

export interface ArtworkTemplateDraft {
  selectedArtTemplateId: string;
  isSelected: boolean;
  artworkAdjustments: ArtworkAdjustments;
}

export type ArtworkTemplatesDraft = Record<string, ArtworkTemplateDraft>;

export interface CreateStoreDraft {
  organizationName: string;
  organizationSlug: string;

  storeName: string;
  storeSlug: string;
  storeDescription: string;

  logoFile: File | null;
  logoStorageId: Id<"_storage"> | null;

  artworkTemplates: ArtworkTemplatesDraft;
  artworkText: ArtworkTextDraft;
}

interface CreateStoreContextValue {
  storeId: Id<"stores"> | null;
  setStoreId: Dispatch<SetStateAction<Id<"stores"> | null>>;

  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;

  primaryColor: string;
  secondaryColor: string;

  setPrimaryColor: Dispatch<SetStateAction<string>>;
  setSecondaryColor: Dispatch<SetStateAction<string>>;

  storeDraft: CreateStoreDraft;

  updateStoreDraft: (updates: Partial<CreateStoreDraft>) => void;

  updateArtworkTemplateDraft: (
    templateId: string,
    updates: Partial<Omit<ArtworkTemplateDraft, "selectedArtTemplateId">>,
  ) => void;

  loadStoreDraft: (draft: Doc<"stores">) => void;

  resetStoreDraft: () => void;
}

function createDefaultStoreDraft(): CreateStoreDraft {
  return {
    organizationName: "",
    organizationSlug: "",

    storeName: "",
    storeSlug: "",
    storeDescription: "",

    logoFile: null,
    logoStorageId: null,

    artworkTemplates: {},

    artworkText: {
      organizationName: "Smallville",
      yearEstablished: "2026",
      mascotName: "Crows",
    },
  };
}

const CreateStoreContext = createContext<CreateStoreContextValue | null>(null);

interface CreateStoreProviderProps {
  children: ReactNode;
}

export function CreateStoreProvider({ children }: CreateStoreProviderProps) {
  const [storeId, setStoreId] = useState<Id<"stores"> | null>(null);

  const [currentStep, setCurrentStep] = useState(1);

  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR);

  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY_COLOR);

  const [storeDraft, setStoreDraft] = useState<CreateStoreDraft>(
    createDefaultStoreDraft,
  );

  function updateStoreDraft(updates: Partial<CreateStoreDraft>) {
    setStoreDraft((currentDraft) => ({
      ...currentDraft,
      ...updates,
    }));
  }

  function updateArtworkTemplateDraft(
    templateId: string,
    updates: Partial<Omit<ArtworkTemplateDraft, "selectedArtTemplateId">>,
  ) {
    setStoreDraft((currentDraft) => {
      const currentTemplateDraft = currentDraft.artworkTemplates[
        templateId
      ] ?? {
        selectedArtTemplateId: templateId,
        isSelected: false,
        artworkAdjustments: {},
      };

      return {
        ...currentDraft,
        artworkTemplates: {
          ...currentDraft.artworkTemplates,
          [templateId]: {
            ...currentTemplateDraft,
            ...updates,
            selectedArtTemplateId: templateId,
          },
        },
      };
    });
  }

  function loadStoreDraft(draft: Doc<"stores">) {
    if (draft.status !== "draft") {
      throw new Error("Only draft stores can be loaded into the store wizard.");
    }

    setStoreId(draft._id);
    setCurrentStep(draft.currentStep);

    setPrimaryColor(draft.primaryColor ?? DEFAULT_PRIMARY_COLOR);

    setSecondaryColor(draft.secondaryColor ?? DEFAULT_SECONDARY_COLOR);

    setStoreDraft({
      organizationName: draft.organizationName ?? "",

      organizationSlug: draft.organizationSlug ?? "",

      storeName: draft.name ?? "",
      storeSlug: draft.slug ?? "",

      storeDescription: draft.description ?? "",

      logoFile: null,

      logoStorageId: draft.logoStorageId ?? null,

      artworkTemplates: {},

      artworkText: {
        organizationName: draft.organizationName ?? "",
        yearEstablished: "2020",
        mascotName: "MUSTANGS",
      },
    });
  }

  function resetStoreDraft() {
    setStoreId(null);
    setCurrentStep(1);

    setPrimaryColor(DEFAULT_PRIMARY_COLOR);

    setSecondaryColor(DEFAULT_SECONDARY_COLOR);

    setStoreDraft(createDefaultStoreDraft());
  }

  return (
    <CreateStoreContext.Provider
      value={{
        storeId,
        setStoreId,

        currentStep,
        setCurrentStep,

        primaryColor,
        secondaryColor,

        setPrimaryColor,
        setSecondaryColor,

        storeDraft,
        updateStoreDraft,
        updateArtworkTemplateDraft,

        loadStoreDraft,
        resetStoreDraft,
      }}
    >
      {children}
    </CreateStoreContext.Provider>
  );
}

export function useCreateStore() {
  const context = useContext(CreateStoreContext);

  if (!context) {
    throw new Error("useCreateStore must be used within CreateStoreProvider.");
  }

  return context;
}
