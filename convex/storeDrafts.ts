import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

import { prepareDraftStoreProductSelections, replaceStoreProductSelections, storeProductSelection } from "./lib/storeProducts";
import {
  normalizeOptionalSlug,
  normalizeOptionalText,
  normalizeRequiredItemsDeadline,
  validateColor,
  validateSlug,
} from "./lib/storeValidation";

const storeActivity = v.union(
  v.literal("basketball"),
  v.literal("baseball"),
  v.literal("football"),
  v.literal("soccer"),
  v.literal("softball"),
  v.literal("volleyball"),
  v.literal("wrestling"),
  v.literal("spirit-wear"),
  v.literal("other"),
);

const storeType = v.union(v.literal("fanwear"), v.literal("uniform"), v.literal("hybrid"));

const storeUploadedArtwork = v.object({
  id: v.string(),
  fileName: v.string(),
  storageId: v.id("_storage"),
  isSelected: v.boolean(),
});

/**
 * Creates a draft store after the Organization step or updates
 * the Organization fields on an existing draft.
 *
 * Large or step-specific data is intentionally not accepted here.
 */
export const saveOrganizationStep = mutation({
  args: {
    storeId: v.optional(v.id("stores")),

    organizationName: v.string(),
    organizationSlug: v.string(),

    activity: storeActivity,
    storeType,

    storeName: v.string(),
    storeSlug: v.string(),

    logoStorageId: v.optional(v.id("_storage")),
    removeLogo: v.optional(v.boolean()),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError("You must be signed in to create a store.");
    }

    const organizationName = args.organizationName.trim();
    const organizationSlug = args.organizationSlug.trim().toLowerCase();

    const storeName = args.storeName.trim();
    const storeSlug = args.storeSlug.trim().toLowerCase();

    if (!organizationName) {
      throw new ConvexError("Organization name is required.");
    }

    if (!organizationSlug) {
      throw new ConvexError("Organization slug is required.");
    }

    if (!storeName) {
      throw new ConvexError("Store name is required.");
    }

    if (!storeSlug) {
      throw new ConvexError("Store slug is required.");
    }

    validateSlug(organizationSlug, "Organization slug");
    validateSlug(storeSlug, "Store slug");

    if (args.logoStorageId && args.removeLogo) {
      throw new ConvexError("A logo cannot be uploaded and removed at the same time.");
    }

    const now = Date.now();

    if (args.storeId) {
      const existingStore = await ctx.db.get(args.storeId);

      if (existingStore === null || existingStore.createdBy !== userId || existingStore.status !== "draft") {
        throw new ConvexError("Draft store not found.");
      }

      await ctx.db.patch(args.storeId, {
        organizationName,
        organizationSlug,

        activity: args.activity,
        storeType: args.storeType,

        name: storeName,
        slug: storeSlug,

        ...(args.logoStorageId !== undefined
          ? {
              logoStorageId: args.logoStorageId,
            }
          : {}),

        ...(args.removeLogo
          ? {
              logoStorageId: undefined,
            }
          : {}),

        updatedAt: now,
      });

      return {
        storeId: args.storeId,
        created: false,
      };
    }

    const storeId = await ctx.db.insert("stores", {
      createdBy: userId,

      organizationName,
      organizationSlug,

      activity: args.activity,
      storeType: args.storeType,

      name: storeName,
      slug: storeSlug,

      logoStorageId: args.logoStorageId,

      currentStep: 2,
      status: "draft",

      createdAt: now,
      updatedAt: now,
    });

    return {
      storeId,
      created: true,
    };
  },
});

/**
 * Saves the Colors step for an existing draft.
 *
 * Organization creates the draft before this step, so this mutation
 * only updates the selected colors and advances draft progress.
 */
export const saveColorsStep = mutation({
  args: {
    storeId: v.id("stores"),
    primaryColor: v.string(),
    secondaryColor: v.string(),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError("You must be signed in to update a store.");
    }

    const existingStore = await ctx.db.get(args.storeId);

    if (existingStore === null || existingStore.createdBy !== userId || existingStore.status !== "draft") {
      throw new ConvexError("Draft store not found.");
    }

    validateColor(args.primaryColor, "Primary color");
    validateColor(args.secondaryColor, "Secondary color");

    await ctx.db.patch(args.storeId, {
      primaryColor: args.primaryColor,
      secondaryColor: args.secondaryColor,
      currentStep: Math.max(existingStore.currentStep, 3),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Creates a new draft store or updates an existing draft.
 *
 * Empty form values are stored as missing optional fields.
 * This mutation does not create an organization.
 */
export const saveDraft = mutation({
  args: {
    storeId: v.optional(v.id("stores")),
    organizationName: v.optional(v.string()),
    organizationSlug: v.optional(v.string()),
    activity: v.optional(storeActivity),
    storeType: v.optional(storeType),
    storeName: v.optional(v.string()),
    storeSlug: v.optional(v.string()),
    storeDescription: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),
    uploadedArtworks: v.optional(v.array(storeUploadedArtwork)),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    productSelections: v.array(storeProductSelection),
    requiredItemsDeadline: v.optional(v.string()),
    currentStep: v.number(),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError("You must be signed in to save a draft.");
    }

    if (!Number.isInteger(args.currentStep) || args.currentStep < 1) {
      throw new ConvexError("Current step must be a positive whole number.");
    }

    const organizationName = normalizeOptionalText(args.organizationName);
    const organizationSlug = normalizeOptionalSlug(args.organizationSlug);
    const storeName = normalizeOptionalText(args.storeName);
    const storeSlug = normalizeOptionalSlug(args.storeSlug);
    const storeDescription = normalizeOptionalText(args.storeDescription);

    const productSelections = prepareDraftStoreProductSelections(args.productSelections);

    const hasRequiredProducts = productSelections.some((selection) => selection.isRequired);

    const requiredItemsDeadline = hasRequiredProducts ? normalizeRequiredItemsDeadline(args.requiredItemsDeadline) : undefined;

    if (organizationSlug) {
      validateSlug(organizationSlug, "Organization slug");
    }

    if (storeSlug) {
      validateSlug(storeSlug, "Store slug");
    }

    if (args.primaryColor) {
      validateColor(args.primaryColor, "Primary color");
    }

    if (args.secondaryColor) {
      validateColor(args.secondaryColor, "Secondary color");
    }

    const now = Date.now();

    if (args.storeId) {
      const existingStore = await ctx.db.get(args.storeId);

      if (existingStore === null || existingStore.createdBy !== userId || existingStore.status !== "draft") {
        throw new ConvexError("Draft store not found.");
      }

      await ctx.db.patch(args.storeId, {
        organizationName,
        organizationSlug,

        activity: args.activity,
        storeType: args.storeType,

        name: storeName,
        slug: storeSlug,
        description: storeDescription,

        ...(args.logoStorageId !== undefined
          ? {
              logoStorageId: args.logoStorageId,
            }
          : {}),

        ...(args.bannerStorageId !== undefined
          ? {
              bannerStorageId: args.bannerStorageId,
            }
          : {}),

        ...(args.uploadedArtworks !== undefined
          ? {
              uploadedArtworks: args.uploadedArtworks,
            }
          : {}),

        primaryColor: args.primaryColor,
        secondaryColor: args.secondaryColor,
        requiredItemsDeadline,

        currentStep: args.currentStep,
        updatedAt: now,
      });

      await replaceStoreProductSelections(ctx, args.storeId, productSelections, now);

      return {
        storeId: args.storeId,
        created: false,
      };
    }

    const storeId = await ctx.db.insert("stores", {
      createdBy: userId,
      organizationName,
      organizationSlug,
      activity: args.activity,
      storeType: args.storeType,
      name: storeName,
      slug: storeSlug,
      description: storeDescription,
      logoStorageId: args.logoStorageId,
      bannerStorageId: args.bannerStorageId,
      uploadedArtworks: args.uploadedArtworks,

      primaryColor: args.primaryColor,
      secondaryColor: args.secondaryColor,
      requiredItemsDeadline,

      currentStep: args.currentStep,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });

    await replaceStoreProductSelections(ctx, storeId, productSelections, now);

    return {
      storeId,
      created: true,
    };
  },
});

/**
 * Returns one draft belonging to the signed-in user.
 */
export const getDraft = query({
  args: {
    storeId: v.id("stores"),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      return null;
    }

    const store = await ctx.db.get(args.storeId);

    if (store === null || store.createdBy !== userId || store.status !== "draft") {
      return null;
    }

    const storeProducts = await ctx.db
      .query("storeProducts")
      .withIndex("by_store", (q) => q.eq("storeId", store._id))
      .collect();

    const productSelections = storeProducts
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map((storeProduct) => ({
        productId: storeProduct.productId,
        colorKey: storeProduct.colorKey,
        artworkTemplateId: storeProduct.artworkTemplateId,
        isRequired: storeProduct.isRequired,
      }));

    const uploadedArtworks = await Promise.all(
      (store.uploadedArtworks ?? []).map(async (artwork) => ({
        ...artwork,
        storageUrl: await ctx.storage.getUrl(artwork.storageId),
      })),
    );

    const logoUrl = store.logoStorageId ? await ctx.storage.getUrl(store.logoStorageId) : null;

    return {
      ...store,
      logoUrl,
      uploadedArtworks,
      productSelections,
    };
  },
});

/**
 * Lists all drafts belonging to the signed-in user.
 */
export const listMyDrafts = query({
  args: {},

  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      return [];
    }

    return await ctx.db
      .query("stores")
      .withIndex("by_creator_status", (q) => q.eq("createdBy", userId).eq("status", "draft"))
      .order("desc")
      .collect();
  },
});

/**
 * Permanently deletes an incomplete draft.
 *
 * Active and archived stores cannot be deleted here.
 */
export const deleteDraft = mutation({
  args: {
    storeId: v.id("stores"),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError("You must be signed in to delete a draft.");
    }

    const store = await ctx.db.get(args.storeId);

    if (store === null || store.createdBy !== userId || store.status !== "draft") {
      throw new ConvexError("Draft store not found.");
    }

    const storeProducts = await ctx.db
      .query("storeProducts")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .collect();

    for (const storeProduct of storeProducts) {
      await ctx.db.delete(storeProduct._id);
    }

    await ctx.db.delete(args.storeId);

    return {
      deleted: true,
    };
  },
});
