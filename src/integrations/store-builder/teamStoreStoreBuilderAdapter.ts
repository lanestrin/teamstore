import type { ConvexReactClient } from "convex/react";

import type {
  SaveArtworkStepInput,
  SaveColorsStepInput,
  StoreBuilderAdapter,
  StoreBuilderProductSelectionInput,
  StoreBuilderUploadedArtworkInput,
} from "../../../packages/store-builder/types/backend";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

function toStoreId(value: string): Id<"stores"> {
  return value as Id<"stores">;
}

function toProductId(value: string): Id<"products"> {
  return value as Id<"products">;
}

function toStorageId(value: string): Id<"_storage"> {
  return value as Id<"_storage">;
}

function toUploadedArtworks(uploadedArtworks: StoreBuilderUploadedArtworkInput[]) {
  return uploadedArtworks.map((artwork) => ({
    id: artwork.id,
    fileName: artwork.fileName,
    storageId: toStorageId(artwork.storageId),
    isSelected: artwork.isSelected,
  }));
}

function toProductSelections(productSelections: StoreBuilderProductSelectionInput[]) {
  return productSelections.map((selection) => ({
    productId: toProductId(selection.productId),
    colorKey: selection.colorKey,
    artworkTemplateId: selection.artworkTemplateId,
    artworkPlacement: selection.artworkPlacement,
    isRequired: selection.isRequired,
  }));
}

export function createTeamStoreStoreBuilderAdapter(client: ConvexReactClient): StoreBuilderAdapter {
  return {
    async loadDraft(storeId) {
      const draft = await client.query(api.storeDrafts.getDraft, {
        storeId: toStoreId(storeId),
      });

      if (!draft) {
        return null;
      }

      return {
        _id: draft._id,
        status: draft.status,
        currentStep: draft.currentStep,

        organizationName: draft.organizationName,
        organizationSlug: draft.organizationSlug,
        activity: draft.activity,
        storeType: draft.storeType,

        name: draft.name,
        slug: draft.slug,
        description: draft.description,

        logoStorageId: draft.logoStorageId,
        logoUrl: draft.logoUrl,

        primaryColor: draft.primaryColor,
        secondaryColor: draft.secondaryColor,
        requiredItemsDeadline: draft.requiredItemsDeadline,

        artworkText: draft.artworkText,
        artworkTemplates: draft.artworkTemplates,

        uploadedArtworks: draft.uploadedArtworks?.map((artwork) => ({
          id: artwork.id,
          fileName: artwork.fileName,
          storageId: artwork.storageId,
          storageUrl: artwork.storageUrl,
          isSelected: artwork.isSelected,
        })),

        productSelections: draft.productSelections?.map((selection) => ({
          productId: selection.productId,
          colorKey: selection.colorKey,
          artworkTemplateId: selection.artworkTemplateId,
          isRequired: selection.isRequired,
        })),
      };
    },

    async uploadFile(file) {
      const uploadUrl = await client.mutation(api.storeUploads.generateUploadUrl, {});

      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Could not upload ${file.name}.`);
      }

      const result = (await response.json()) as {
        storageId: Id<"_storage">;
      };

      return result.storageId;
    },

    async saveOrganizationStep(input) {
      const result = await client.mutation(api.storeDrafts.saveOrganizationStep, {
        storeId: input.storeId ? toStoreId(input.storeId) : undefined,

        organizationName: input.organizationName,
        organizationSlug: input.organizationSlug,

        activity: input.activity,
        storeType: input.storeType,

        storeName: input.storeName,
        storeSlug: input.storeSlug,

        logoStorageId: input.logoStorageId ? toStorageId(input.logoStorageId) : undefined,

        removeLogo: input.removeLogo,
      });

      return {
        storeId: result.storeId,
        created: result.created,
      };
    },

    async saveColorsStep(input: SaveColorsStepInput) {
      await client.mutation(api.storeDrafts.saveColorsStep, {
        storeId: toStoreId(input.storeId),
        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,
      });
    },

    async saveArtworkStep(input: SaveArtworkStepInput) {
      await client.mutation(api.storeDrafts.saveArtworkStep, {
        storeId: toStoreId(input.storeId),

        logoStorageId: input.logoStorageId ? toStorageId(input.logoStorageId) : undefined,

        artworkText: input.artworkText,
        artworkTemplates: input.artworkTemplates,
        uploadedArtworks: toUploadedArtworks(input.uploadedArtworks),
      });
    },

    async saveDraft(input) {
      const result = await client.mutation(api.storeDrafts.saveDraft, {
        storeId: input.storeId ? toStoreId(input.storeId) : undefined,

        organizationName: input.organizationName,
        organizationSlug: input.organizationSlug,

        activity: input.activity,
        storeType: input.storeType,

        storeName: input.storeName,
        storeSlug: input.storeSlug,
        storeDescription: input.storeDescription,

        logoStorageId: input.logoStorageId ? toStorageId(input.logoStorageId) : undefined,

        uploadedArtworks: toUploadedArtworks(input.uploadedArtworks),

        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,

        productSelections: toProductSelections(input.productSelections),
        requiredItemsDeadline: input.requiredItemsDeadline,

        currentStep: input.currentStep,
      });

      return {
        storeId: result.storeId,
        created: result.created,
      };
    },

    async finalizeStore(input) {
      const result = await client.mutation(api.stores.finalizeStore, {
        storeId: input.storeId ? toStoreId(input.storeId) : undefined,

        organizationName: input.organizationName,
        organizationSlug: input.organizationSlug,

        activity: input.activity,
        storeType: input.storeType,

        storeName: input.storeName,
        storeSlug: input.storeSlug,
        storeDescription: input.storeDescription,

        logoStorageId: input.logoStorageId ? toStorageId(input.logoStorageId) : undefined,

        uploadedArtworks: toUploadedArtworks(input.uploadedArtworks),
        artworkSnapshots: input.artworkSnapshots,

        primaryColor: input.primaryColor,
        secondaryColor: input.secondaryColor,

        currentStep: input.currentStep,

        productSelections: toProductSelections(input.productSelections),
        requiredItemsDeadline: input.requiredItemsDeadline,
      });

      return {
        organizationSlug: result.organizationSlug,
        storeSlug: result.storeSlug,
      };
    },

    async getStoreCreationProducts(input) {
      const result = await client.query(api.storeProductCatalog.getStoreCreationProducts, {
        activity: input.activity,
        colorFamily: input.colorFamily,
        selectedProductIds: input.selectedProductIds?.map(toProductId),
      });

      return {
        availableProductColorFamilies: result.availableProductColorFamilies,
        uniforms: result.uniforms,
        fanwear: result.fanwear,
      };
    },
  };
}
