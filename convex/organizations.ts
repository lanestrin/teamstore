import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const MAX_STORE_PRODUCTS = 50;

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

const storeProductSelection = v.object({
  productId: v.id("products"),
  colorKey: v.string(),
  artworkTemplateId: v.string(),
  isRequired: v.boolean(),
});

const storeUploadedArtwork = v.object({
  id: v.string(),
  fileName: v.string(),
  storageId: v.id("_storage"),
  isSelected: v.boolean(),
});

interface StoreProductSelectionInput {
  productId: Id<"products">;
  colorKey: string;
  artworkTemplateId: string;
  isRequired: boolean;
}

interface ResolvedStoreProductSelection {
  productId: Id<"products">;
  colorKey: string;
  artworkTemplateId: string;
  isRequired: boolean;
  sortOrder: number;
}

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
    throw new ConvexError(`${label} must contain only lowercase letters, numbers, and hyphens.`);
  }
}

function validateColor(color: string, label: string): void {
  if (!HEX_COLOR_PATTERN.test(color)) {
    throw new ConvexError(`${label} must be a valid six-digit hex color.`);
  }
}

function normalizeStoreProductSelections(selections: StoreProductSelectionInput[]): StoreProductSelectionInput[] {
  if (selections.length === 0) {
    throw new ConvexError("Select at least one product for the store.");
  }

  if (selections.length > MAX_STORE_PRODUCTS) {
    throw new ConvexError(`A store can contain a maximum of ${MAX_STORE_PRODUCTS} products during setup.`);
  }

  const seenProductIds = new Set<Id<"products">>();

  return selections.map((selection) => {
    if (seenProductIds.has(selection.productId)) {
      throw new ConvexError(`Product ${selection.productId} was selected more than once.`);
    }

    seenProductIds.add(selection.productId);

    return selection;
  });
}

async function resolveStoreProductSelections(
  ctx: MutationCtx,
  selections: StoreProductSelectionInput[],
): Promise<ResolvedStoreProductSelection[]> {
  const normalizedSelections = normalizeStoreProductSelections(selections);

  return await Promise.all(
    normalizedSelections.map(async (selection, sortOrder) => {
      const product = await ctx.db.get(selection.productId);

      if (!product || product.status !== "active") {
        throw new ConvexError(`Selected product ${selection.productId} is not available.`);
      }

      const activeVariants = await ctx.db
        .query("productVariants")
        .withIndex("by_product_status", (q) => q.eq("productId", product._id).eq("status", "active"))
        .collect();

      const hasAvailableVariant = activeVariants.some((variant) => variant.availability === "available");

      if (!hasAvailableVariant) {
        throw new ConvexError(`${product.name} currently has no available variants.`);
      }

      return {
        productId: product._id,
        colorKey: selection.colorKey,
        artworkTemplateId: selection.artworkTemplateId,
        isRequired: selection.isRequired,
        sortOrder,
      };
    }),
  );
}

async function replaceStoreProductSelections(
  ctx: MutationCtx,
  storeId: Id<"stores">,
  selections: ResolvedStoreProductSelection[],
  now: number,
): Promise<void> {
  const existingStoreProducts = await ctx.db
    .query("storeProducts")
    .withIndex("by_store", (q) => q.eq("storeId", storeId))
    .collect();

  for (const storeProduct of existingStoreProducts) {
    await ctx.db.delete(storeProduct._id);
  }

  for (const selection of selections) {
    await ctx.db.insert("storeProducts", {
      storeId,
      productId: selection.productId,
      colorKey: selection.colorKey,
      artworkTemplateId: selection.artworkTemplateId,
      isRequired: selection.isRequired,
      sortOrder: selection.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export const generateArtworkUploadUrl = mutation({
  args: {},

  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError("You must be signed in to upload artwork.");
    }

    return await ctx.storage.generateUploadUrl();
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

      if (existingStore === null || existingStore.createdBy !== userId || existingStore.status !== "draft") {
        throw new ConvexError("Draft store not found.");
      }

      await ctx.db.patch(args.storeId, {
        organizationName,
        organizationSlug,

        activity: args.activity,

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

    if (store === null || store.createdBy !== userId || store.status !== "draft") {
      return null;
    }

    const uploadedArtworks = await Promise.all(
      (store.uploadedArtworks ?? []).map(async (artwork) => ({
        ...artwork,
        storageUrl: await ctx.storage.getUrl(artwork.storageId),
      })),
    );

    return {
      ...store,
      uploadedArtworks,
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
 * Only products explicitly selected by the user are attached
 * to the store.
 *
 * The organization, owner membership, active store, and selected
 * store products are created in one transaction.
 */
export const createOrganizationWithStore = mutation({
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

    if (!organizationSlug || !storeSlug || !SLUG_PATTERN.test(organizationSlug) || !SLUG_PATTERN.test(storeSlug)) {
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

    if (!organizationSlug || !storeSlug || !SLUG_PATTERN.test(organizationSlug) || !SLUG_PATTERN.test(storeSlug)) {
      return null;
    }

    const matchingStores = await ctx.db
      .query("stores")
      .withIndex("by_organization_slug_and_slug", (q) => q.eq("organizationSlug", organizationSlug).eq("slug", storeSlug))
      .collect();

    return matchingStores.find((store) => store.status === "active") ?? null;
  },
});
