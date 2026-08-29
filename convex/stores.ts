import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

import { replaceStoreProductSelections, resolveStoreProductSelections, storeProductSelection } from "./lib/storeProducts";
import { isValidSlug, normalizeOptionalText, normalizeRequiredItemsDeadline, validateColor, validateSlug } from "./lib/storeValidation";

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
 * Lists all active stores created by the signed-in user.
 */
export const listMyActiveStores = query({
  args: {},

  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      return [];
    }

    return await ctx.db
      .query("stores")
      .withIndex("by_creator_status", (q) => q.eq("createdBy", userId).eq("status", "active"))
      .order("desc")
      .collect();
  },
});

/**
 * Archives an active store.
 *
 * Active stores are not permanently deleted because products,
 * customers, and orders may reference them later.
 */
export const archiveStore = mutation({
  args: {
    storeId: v.id("stores"),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError("You must be signed in to archive a store.");
    }

    const store = await ctx.db.get(args.storeId);

    if (store === null || store.createdBy !== userId || store.status !== "active") {
      throw new ConvexError("Active store not found.");
    }

    await ctx.db.patch(args.storeId, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return {
      storeId: args.storeId,
      archived: true,
    };
  },
});

/**
 * Finalizes either:
 *
 * - an existing saved draft, or
 * - a store that has not previously been saved.
 *
 * The mutation creates or reuses the organization,
 * activates the store, and persists the selected products.
 */
export const finalizeStore = mutation({
  args: {
    storeId: v.optional(v.id("stores")),
    organizationName: v.string(),
    organizationSlug: v.string(),
    activity: storeActivity,
    storeType,
    storeName: v.string(),
    storeSlug: v.string(),
    storeDescription: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),
    uploadedArtworks: v.optional(v.array(storeUploadedArtwork)),
    primaryColor: v.string(),
    secondaryColor: v.string(),
    currentStep: v.number(),
    productSelections: v.array(storeProductSelection),
    requiredItemsDeadline: v.optional(v.string()),
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

    const storeDescription = normalizeOptionalText(args.storeDescription);

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

    validateColor(args.primaryColor, "Primary color");
    validateColor(args.secondaryColor, "Secondary color");

    if (args.storeId) {
      const existingDraft = await ctx.db.get(args.storeId);

      if (existingDraft === null || existingDraft.createdBy !== userId || existingDraft.status !== "draft") {
        throw new ConvexError("Draft store not found.");
      }
    }

    const selectedProducts = await resolveStoreProductSelections(ctx, args.productSelections);

    const hasRequiredProducts = selectedProducts.some((selection) => selection.isRequired);

    const requiredItemsDeadline = hasRequiredProducts ? normalizeRequiredItemsDeadline(args.requiredItemsDeadline) : undefined;

    if (hasRequiredProducts && !requiredItemsDeadline) {
      throw new ConvexError("A required items deadline is required when the store has required products.");
    }

    const existingOrganization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", organizationSlug))
      .unique();

    const storesWithSlug = await ctx.db
      .query("stores")
      .withIndex("by_organization_slug_and_slug", (q) => q.eq("organizationSlug", organizationSlug).eq("slug", storeSlug))
      .collect();

    const conflictingStore = storesWithSlug.find((store) => store.status === "active" && store._id !== args.storeId);

    if (conflictingStore) {
      throw new ConvexError("That store URL is already in use for this organization.");
    }

    const now = Date.now();

    let organizationId: Id<"organizations">;

    if (existingOrganization) {
      const membership = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization_user", (q) => q.eq("organizationId", existingOrganization._id).eq("userId", userId))
        .unique();

      if (membership === null || (membership.role !== "owner" && membership.role !== "admin")) {
        throw new ConvexError("That organization URL is already in use.");
      }

      organizationId = existingOrganization._id;
    } else {
      organizationId = await ctx.db.insert("organizations", {
        name: organizationName,
        slug: organizationSlug,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("organizationMembers", {
        organizationId,
        userId,
        role: "owner",
        createdAt: now,
      });
    }

    if (args.storeId) {
      await ctx.db.patch(args.storeId, {
        organizationId,
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
        status: "active",
        updatedAt: now,
      });

      await replaceStoreProductSelections(ctx, args.storeId, selectedProducts, now);

      return {
        organizationId,
        storeId: args.storeId,
        organizationSlug,
        storeSlug,
      };
    }

    const storeId = await ctx.db.insert("stores", {
      organizationId,
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
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    await replaceStoreProductSelections(ctx, storeId, selectedProducts, now);

    return {
      organizationId,
      storeId,
      organizationSlug,
      storeSlug,
    };
  },
});

/**
 * Checks whether a public store URL is available
 * within an organization.
 *
 * Draft stores do not reserve a public URL.
 */
export const checkStoreSlugAvailability = query({
  args: {
    organizationSlug: v.string(),
    storeSlug: v.string(),
    excludeStoreId: v.optional(v.id("stores")),
  },

  handler: async (ctx, args) => {
    const organizationSlug = args.organizationSlug.trim().toLowerCase();

    const storeSlug = args.storeSlug.trim().toLowerCase();

    if (!organizationSlug || !storeSlug || !isValidSlug(organizationSlug) || !isValidSlug(storeSlug)) {
      return {
        available: false,
      };
    }

    const matchingStores = await ctx.db
      .query("stores")
      .withIndex("by_organization_slug_and_slug", (q) => q.eq("organizationSlug", organizationSlug).eq("slug", storeSlug))
      .collect();

    const conflictingStore = matchingStores.find((store) => store.status === "active" && store._id !== args.excludeStoreId);

    return {
      available: conflictingStore === undefined,
    };
  },
});

/**
 * Lists active stores for the public store directory.
 */
export const listActiveStores = query({
  args: {},

  handler: async (ctx) => {
    const stores = await ctx.db.query("stores").collect();

    const activeStores = stores.filter((store) => store.status === "active" && store.organizationSlug && store.slug);

    return await Promise.all(
      activeStores.map(async (store) => {
        const storeProducts = await ctx.db
          .query("storeProducts")
          .withIndex("by_store", (q) => q.eq("storeId", store._id))
          .collect();

        return {
          id: store._id,
          organizationSlug: store.organizationSlug!,
          slug: store.slug!,
          name: store.name ?? store.organizationName ?? "Team Store",
          activity: store.activity,
          productCount: storeProducts.length,
          logoUrl: store.logoStorageId ? await ctx.storage.getUrl(store.logoStorageId) : null,
        };
      }),
    );
  },
});

/**
 * Returns an active public store using its organization
 * and store URL slugs.
 */
export const getActiveStoreBySlugs = query({
  args: {
    organizationSlug: v.string(),
    storeSlug: v.string(),
  },

  handler: async (ctx, args) => {
    const organizationSlug = args.organizationSlug.trim().toLowerCase();

    const storeSlug = args.storeSlug.trim().toLowerCase();

    if (!organizationSlug || !storeSlug || !isValidSlug(organizationSlug) || !isValidSlug(storeSlug)) {
      return null;
    }

    const matchingStores = await ctx.db
      .query("stores")
      .withIndex("by_organization_slug_and_slug", (q) => q.eq("organizationSlug", organizationSlug).eq("slug", storeSlug))
      .collect();

    return matchingStores.find((store) => store.status === "active") ?? null;
  },
});
