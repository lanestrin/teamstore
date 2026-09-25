import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import {
  decorateProductCardFromData,
  getProductColorsForProduct,
  getResolvedProductImages,
  getVariantsForProduct,
} from "./lib/productCatalog";
import {
  prepareDraftStoreProductSelections,
  replaceStoreProductSelections,
  resolveStoreProductSelections,
  storeProductSelection,
} from "./lib/storeProducts";
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

const productColorFamily = v.union(
  v.literal("black"),
  v.literal("white"),
  v.literal("gray"),
  v.literal("silver"),
  v.literal("red"),
  v.literal("orange"),
  v.literal("yellow"),
  v.literal("green"),
  v.literal("blue"),
  v.literal("navy"),
  v.literal("purple"),
  v.literal("pink"),
  v.literal("brown"),
  v.literal("multicolor"),
  v.literal("unknown"),
);

const storeArtworkSnapshot = v.object({
  artworkTemplateId: v.string(),
  svg: v.string(),
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
 * Returns an active store owned by the signed-in user for store management.
 *
 * This query is intentionally separate from the public storefront query.
 * Management access requires ownership and exposes the persisted configuration
 * needed by the store editor.
 */
export const getStoreForManagement = query({
  args: {
    storeId: v.id("stores"),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError("You must be signed in to manage a store.");
    }

    const store = await ctx.db.get(args.storeId);

    if (store === null || store.createdBy !== userId || store.status !== "active") {
      return null;
    }

    const storeProducts = await ctx.db
      .query("storeProducts")
      .withIndex("by_store", (q) => q.eq("storeId", store._id))
      .collect();

    const orderedStoreProducts = [...storeProducts].sort((first, second) => first.sortOrder - second.sortOrder);

    const products = await Promise.all(
      orderedStoreProducts.map(async (storeProduct) => {
        const product = await ctx.db.get(storeProduct.productId);

        if (product === null) {
          return null;
        }

        const [variants, productColors, productImages] = await Promise.all([
          getVariantsForProduct(ctx, product._id),
          getProductColorsForProduct(ctx, product._id),
          getResolvedProductImages(ctx, product._id),
        ]);

        const decoratedProduct = await decorateProductCardFromData(ctx, product, variants, productColors, "front");

        const selectedColor = decoratedProduct.colorOptions.find((color) => color.colorKey === storeProduct.colorKey);

        const selectedColorImages = productImages
          .filter((image) => image.colorKey === storeProduct.colorKey)
          .map((image) => ({
            imageUrl: image.imageUrl,
            view: image.view,
            sortOrder: image.sortOrder,
            decorationPreviewBounds: image.decorationPreviewBounds,
          }));

        return {
          storeProductId: storeProduct._id,
          productId: product._id,

          name: product.name,
          slug: product.slug,
          category: product.category,
          status: product.status,

          color: selectedColor?.color ?? storeProduct.colorKey,
          colorKey: storeProduct.colorKey,

          imageUrl: selectedColor?.imageUrl,
          primaryHexValue: selectedColor?.primaryHexValue,

          images: selectedColorImages,

          artworkTemplateId: storeProduct.artworkTemplateId,
          artworkPlacement: storeProduct.artworkPlacement,

          isRequired: storeProduct.isRequired,
          sortOrder: storeProduct.sortOrder,
        };
      }),
    );

    const uploadedArtworks = await Promise.all(
      (store.uploadedArtworks ?? []).map(async (artwork) => ({
        ...artwork,
        storageUrl: await ctx.storage.getUrl(artwork.storageId),
      })),
    );

    return {
      storeId: store._id,

      organizationName: store.organizationName,
      organizationSlug: store.organizationSlug,

      name: store.name,
      slug: store.slug,
      description: store.description,

      activity: store.activity,
      storeType: store.storeType,

      primaryColor: store.primaryColor,
      secondaryColor: store.secondaryColor,

      productColorFamily: store.productColorFamily,
      productSecondaryColorFamily: store.productSecondaryColorFamily,
      productGenerationSeed: store.productGenerationSeed,
      requiredItemsDeadline: store.requiredItemsDeadline,

      artworkText: store.artworkText,
      artworkTemplates: store.artworkTemplates ?? [],
      artworkSnapshots: store.artworkSnapshots ?? [],
      uploadedArtworks,

      logoUrl: store.logoStorageId ? await ctx.storage.getUrl(store.logoStorageId) : null,

      status: store.status,
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,

      products: products.flatMap((product) => (product === null ? [] : [product])),
    };
  },
});

/**
 * Replaces the product configuration for an active store owned by
 * the signed-in user.
 *
 * Published-store management uses the same normalized storeProducts
 * representation as store creation, but remains a separate mutation
 * from the draft workflow.
 */
export const updateStoreProducts = mutation({
  args: {
    storeId: v.id("stores"),

    activity: storeActivity,
    productColorFamily,
    productSecondaryColorFamily: v.optional(productColorFamily),
    productGenerationSeed: v.number(),

    productSelections: v.array(storeProductSelection),
    requiredItemsDeadline: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError("You must be signed in to manage a store.");
    }

    const existingStore = await ctx.db.get(args.storeId);

    if (existingStore === null || existingStore.createdBy !== userId || existingStore.status !== "active") {
      throw new ConvexError("Active store not found.");
    }

    if (!Number.isInteger(args.productGenerationSeed) || args.productGenerationSeed < 1) {
      throw new ConvexError("Product generation seed must be a positive whole number.");
    }

    const productSelections = prepareDraftStoreProductSelections(args.productSelections);

    if (productSelections.length === 0) {
      throw new ConvexError("An active store must contain at least one product.");
    }

    const hasRequiredProducts = productSelections.some((selection) => selection.isRequired);

    const requiredItemsDeadline = hasRequiredProducts ? normalizeRequiredItemsDeadline(args.requiredItemsDeadline) : undefined;

    if (hasRequiredProducts && !requiredItemsDeadline) {
      throw new ConvexError("A required items deadline is required when the store has required products.");
    }

    const now = Date.now();

    await ctx.db.patch(args.storeId, {
      activity: args.activity,
      productColorFamily: args.productColorFamily,
      productSecondaryColorFamily: args.productSecondaryColorFamily,
      productGenerationSeed: args.productGenerationSeed,
      requiredItemsDeadline,
      updatedAt: now,
    });

    await replaceStoreProductSelections(ctx, args.storeId, productSelections, now);

    return {
      storeId: args.storeId,
      productCount: productSelections.length,
      updatedAt: now,
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
 * Finalizes an existing persisted draft.
 *
 * Convex is the source of truth for all wizard-owned state. The client
 * supplies only the draft ID plus the browser-derived artwork snapshots
 * needed by the published storefront.
 */
export const finalizeStore = mutation({
  args: {
    storeId: v.id("stores"),
    artworkSnapshots: v.array(storeArtworkSnapshot),
  },

  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError("You must be signed in to create a store.");
    }

    const existingDraft = await ctx.db.get(args.storeId);

    if (existingDraft === null || existingDraft.createdBy !== userId || existingDraft.status !== "draft") {
      throw new ConvexError("Draft store not found.");
    }

    if (existingDraft.currentStep < 5) {
      throw new ConvexError("Complete store setup before publishing.");
    }

    const organizationName = existingDraft.organizationName?.trim() ?? "";
    const organizationSlug = existingDraft.organizationSlug?.trim().toLowerCase() ?? "";

    const storeName = existingDraft.name?.trim() ?? "";
    const storeSlug = existingDraft.slug?.trim().toLowerCase() ?? "";
    const storeDescription = normalizeOptionalText(existingDraft.description);

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

    if (!existingDraft.activity) {
      throw new ConvexError("Store activity is required.");
    }

    if (!existingDraft.storeType) {
      throw new ConvexError("Store type is required.");
    }

    if (!existingDraft.primaryColor || !existingDraft.secondaryColor) {
      throw new ConvexError("Store colors are required.");
    }

    validateSlug(organizationSlug, "Organization slug");
    validateSlug(storeSlug, "Store slug");

    validateColor(existingDraft.primaryColor, "Primary color");
    validateColor(existingDraft.secondaryColor, "Secondary color");

    const persistedStoreProducts = await ctx.db
      .query("storeProducts")
      .withIndex("by_store", (q) => q.eq("storeId", args.storeId))
      .collect();

    const productSelections = [...persistedStoreProducts]
      .sort((first, second) => first.sortOrder - second.sortOrder)
      .map((storeProduct) => ({
        productId: storeProduct.productId,
        colorKey: storeProduct.colorKey,
        artworkTemplateId: storeProduct.artworkTemplateId,
        artworkPlacement: storeProduct.artworkPlacement,
        isRequired: storeProduct.isRequired,
      }));

    const selectedProducts = await resolveStoreProductSelections(ctx, productSelections);
    const hasRequiredProducts = selectedProducts.some((selection) => selection.isRequired);
    const requiredItemsDeadline = hasRequiredProducts ? normalizeRequiredItemsDeadline(existingDraft.requiredItemsDeadline) : undefined;

    if (hasRequiredProducts && !requiredItemsDeadline) {
      throw new ConvexError("A required items deadline is required when the store has required products.");
    }

    const artworkSnapshots = args.artworkSnapshots.map((snapshot) => ({
      artworkTemplateId: snapshot.artworkTemplateId.trim(),
      svg: snapshot.svg,
    }));

    const seenArtworkIds = new Set<string>();

    for (const snapshot of artworkSnapshots) {
      if (!snapshot.artworkTemplateId) {
        throw new ConvexError("Artwork template ID is required.");
      }

      if (!snapshot.svg.trim()) {
        throw new ConvexError(`Artwork ${snapshot.artworkTemplateId} is empty.`);
      }

      if (seenArtworkIds.has(snapshot.artworkTemplateId)) {
        throw new ConvexError(`Artwork ${snapshot.artworkTemplateId} was provided more than once.`);
      }

      seenArtworkIds.add(snapshot.artworkTemplateId);
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

    await ctx.db.patch(args.storeId, {
      organizationId,
      organizationName,
      organizationSlug,
      activity: existingDraft.activity,
      storeType: existingDraft.storeType,
      name: storeName,
      slug: storeSlug,
      description: storeDescription,
      artworkSnapshots,
      primaryColor: existingDraft.primaryColor,
      secondaryColor: existingDraft.secondaryColor,
      requiredItemsDeadline,
      currentStep: Math.max(existingDraft.currentStep, 5),
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
 *
 * Store products are resolved into storefront-ready product data
 * so the client does not need to reconstruct the catalog itself.
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

    const store = matchingStores.find((candidate) => candidate.status === "active") ?? null;

    if (!store) {
      return null;
    }

    const storeProducts = await ctx.db
      .query("storeProducts")
      .withIndex("by_store", (q) => q.eq("storeId", store._id))
      .collect();

    const orderedStoreProducts = [...storeProducts].sort((first, second) => first.sortOrder - second.sortOrder);

    const products = await Promise.all(
      orderedStoreProducts.map(async (storeProduct) => {
        const product = await ctx.db.get(storeProduct.productId);

        if (!product || product.status !== "active") {
          return null;
        }

        const [variants, productColors] = await Promise.all([
          getVariantsForProduct(ctx, product._id),
          getProductColorsForProduct(ctx, product._id),
        ]);

        const decoratedProduct = await decorateProductCardFromData(ctx, product, variants, productColors, "front");
        const selectedColor = decoratedProduct.colorOptions.find((color) => color.colorKey === storeProduct.colorKey);

        if (!selectedColor) {
          return null;
        }

        return {
          storeProductId: storeProduct._id,
          productId: product._id,
          name: product.name,
          slug: product.slug,
          category: product.category,
          color: selectedColor.color,
          colorKey: storeProduct.colorKey,
          imageUrl: selectedColor.imageUrl,
          primaryHexValue: selectedColor.primaryHexValue,
          tone: selectedColor.tone,
          decorationPreviewBounds: selectedColor.decorationPreviewBounds,
          minPriceInCents: decoratedProduct.minPriceInCents,
          maxPriceInCents: decoratedProduct.maxPriceInCents,
          artworkTemplateId: storeProduct.artworkTemplateId,
          artworkPlacement: storeProduct.artworkPlacement,
          isRequired: storeProduct.isRequired,
          sortOrder: storeProduct.sortOrder,
        };
      }),
    );

    const uploadedArtworks = await Promise.all(
      (store.uploadedArtworks ?? []).map(async (artwork) => ({
        ...artwork,

        storageUrl: await ctx.storage.getUrl(artwork.storageId),
      })),
    );

    return {
      ...store,

      uploadedArtworks,
      logoUrl: store.logoStorageId ? await ctx.storage.getUrl(store.logoStorageId) : null,
      products: products.flatMap((product) => (product ? [product] : [])),
    };
  },
});
