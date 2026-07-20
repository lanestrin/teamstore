import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue || undefined;
}

function normalizeOptionalSlug(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim().toLowerCase();

  return normalizedValue || undefined;
}

function validateSlug(slug: string, label: string): void {
  if (!SLUG_PATTERN.test(slug)) {
    throw new ConvexError(
      `${label} must contain only lowercase letters, numbers, and hyphens.`,
    );
  }
}

function validateColor(color: string, label: string): void {
  if (!HEX_COLOR_PATTERN.test(color)) {
    throw new ConvexError(`${label} must be a valid six-digit hex color.`);
  }
}

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

    storeName: v.optional(v.string()),
    storeSlug: v.optional(v.string()),
    storeDescription: v.optional(v.string()),

    logoStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),

    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),

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

      if (
        existingStore === null ||
        existingStore.createdBy !== userId ||
        existingStore.status !== "draft"
      ) {
        throw new ConvexError("Draft store not found.");
      }

      await ctx.db.patch(args.storeId, {
        organizationName,
        organizationSlug,

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

        primaryColor: args.primaryColor,
        secondaryColor: args.secondaryColor,

        currentStep: args.currentStep,
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

      name: storeName,
      slug: storeSlug,
      description: storeDescription,

      logoStorageId: args.logoStorageId,
      bannerStorageId: args.bannerStorageId,

      primaryColor: args.primaryColor,
      secondaryColor: args.secondaryColor,

      currentStep: args.currentStep,
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

    if (
      store === null ||
      store.createdBy !== userId ||
      store.status !== "draft"
    ) {
      return null;
    }

    return store;
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
      .withIndex("by_creator_status", (q) =>
        q.eq("createdBy", userId).eq("status", "draft"),
      )
      .order("desc")
      .collect();
  },
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
      .withIndex("by_creator_status", (q) =>
        q.eq("createdBy", userId).eq("status", "active"),
      )
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

    if (
      store === null ||
      store.createdBy !== userId ||
      store.status !== "draft"
    ) {
      throw new ConvexError("Draft store not found.");
    }

    await ctx.db.delete(args.storeId);

    return {
      deleted: true,
    };
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

    if (
      store === null ||
      store.createdBy !== userId ||
      store.status !== "active"
    ) {
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
 * The organization, owner membership, and active store are
 * created in one transaction.
 */
export const createOrganizationWithStore = mutation({
  args: {
    storeId: v.optional(v.id("stores")),

    organizationName: v.string(),
    organizationSlug: v.string(),

    storeName: v.string(),
    storeSlug: v.string(),
    storeDescription: v.optional(v.string()),

    logoStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),

    primaryColor: v.string(),
    secondaryColor: v.string(),

    currentStep: v.number(),
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

      if (
        existingDraft === null ||
        existingDraft.createdBy !== userId ||
        existingDraft.status !== "draft"
      ) {
        throw new ConvexError("Draft store not found.");
      }
    }

    const existingOrganization = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", organizationSlug))
      .unique();

    if (existingOrganization) {
      throw new ConvexError("That organization URL is already in use.");
    }

    const storesWithSlug = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", storeSlug))
      .collect();

    const conflictingStore = storesWithSlug.find(
      (store) => store.status === "active" && store._id !== args.storeId,
    );

    if (conflictingStore) {
      throw new ConvexError("That store URL is already in use.");
    }

    const now = Date.now();

    const organizationId = await ctx.db.insert("organizations", {
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

    if (args.storeId) {
      await ctx.db.patch(args.storeId, {
        organizationId,

        organizationName,
        organizationSlug,

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

        primaryColor: args.primaryColor,
        secondaryColor: args.secondaryColor,

        currentStep: args.currentStep,
        status: "active",
        updatedAt: now,
      });

      return {
        organizationId,
        storeId: args.storeId,
        storeSlug,
      };
    }

    const storeId = await ctx.db.insert("stores", {
      organizationId,
      createdBy: userId,

      organizationName,
      organizationSlug,

      name: storeName,
      slug: storeSlug,
      description: storeDescription,

      logoStorageId: args.logoStorageId,
      bannerStorageId: args.bannerStorageId,

      primaryColor: args.primaryColor,
      secondaryColor: args.secondaryColor,

      currentStep: args.currentStep,
      status: "active",

      createdAt: now,
      updatedAt: now,
    });

    return {
      organizationId,
      storeId,
      storeSlug,
    };
  },
});

/**
 * Checks whether a public store slug is available.
 *
 * Draft stores do not reserve a public slug.
 */
export const checkStoreSlugAvailability = query({
  args: {
    slug: v.string(),
    excludeStoreId: v.optional(v.id("stores")),
  },
  handler: async (ctx, args) => {
    const slug = args.slug.trim().toLowerCase();

    if (!slug || !SLUG_PATTERN.test(slug)) {
      return {
        available: false,
      };
    }

    const matchingStores = await ctx.db
      .query("stores")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .collect();

    const conflictingStore = matchingStores.find(
      (store) => store.status === "active" && store._id !== args.excludeStoreId,
    );

    return {
      available: conflictingStore === undefined,
    };
  },
});
