import { ConvexError, v, type Infer } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const MAX_STORE_PRODUCTS = 50;

export const storeProductArtworkPlacement = v.object({
  x: v.number(),
  y: v.number(),
  width: v.number(),
});

export const storeProductSelection = v.object({
  productId: v.id("products"),
  colorKey: v.string(),
  artworkTemplateId: v.string(),
  isRequired: v.boolean(),
  artworkPlacement: v.optional(storeProductArtworkPlacement),
});

export type StoreProductSelectionInput = Infer<typeof storeProductSelection>;

export interface ResolvedStoreProductSelection {
  productId: Id<"products">;
  colorKey: string;
  artworkTemplateId: string;
  isRequired: boolean;
  artworkPlacement?: {
    x: number;
    y: number;
    width: number;
  };
  sortOrder: number;
}

function createSelectionKey(selection: StoreProductSelectionInput): string {
  return JSON.stringify([selection.productId, selection.colorKey.trim(), selection.artworkTemplateId.trim()]);
}

/**
 * Validates and normalizes selected store products.
 *
 * A product may appear more than once when it uses a different
 * color or artwork combination.
 *
 * Only an exact product + color + artwork combination is treated
 * as a duplicate.
 *
 * Final store creation requires at least one selection.
 * Drafts may temporarily contain no selected products.
 */
function normalizeStoreProductSelections(selections: StoreProductSelectionInput[], requireSelection = true): StoreProductSelectionInput[] {
  if (requireSelection && selections.length === 0) {
    throw new ConvexError("Select at least one product for the store.");
  }

  if (selections.length > MAX_STORE_PRODUCTS) {
    throw new ConvexError(`A store can contain a maximum of ${MAX_STORE_PRODUCTS} products during setup.`);
  }

  const seenSelections = new Set<string>();

  return selections.map((selection) => {
    const colorKey = selection.colorKey.trim();

    const artworkTemplateId = selection.artworkTemplateId.trim();

    if (!colorKey) {
      throw new ConvexError("A color is required for every selected product.");
    }

    if (!artworkTemplateId) {
      throw new ConvexError("Artwork is required for every selected product.");
    }

    const normalizedSelection = {
      ...selection,
      colorKey,
      artworkTemplateId,
    };

    const selectionKey = createSelectionKey(normalizedSelection);

    if (seenSelections.has(selectionKey)) {
      throw new ConvexError(`The same product, color, and artwork combination was selected more than once.`);
    }

    seenSelections.add(selectionKey);

    return normalizedSelection;
  });
}

/**
 * Prepares selections for draft persistence without requiring
 * products to still be active or currently available.
 */
export function prepareDraftStoreProductSelections(selections: StoreProductSelectionInput[]): ResolvedStoreProductSelection[] {
  return normalizeStoreProductSelections(selections, false).map((selection, sortOrder) => ({
    ...selection,
    sortOrder,
  }));
}

/**
 * Validates selected products against the live catalog before
 * a store is finalized.
 */
export async function resolveStoreProductSelections(
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

      const hasSelectedColor = activeVariants.some(
        (variant) => variant.availability === "available" && variant.colorKey === selection.colorKey,
      );

      if (!hasSelectedColor) {
        throw new ConvexError(`${product.name} is not currently available in the selected color.`);
      }

      return {
        productId: product._id,
        colorKey: selection.colorKey,
        artworkTemplateId: selection.artworkTemplateId,
        isRequired: selection.isRequired,
        artworkPlacement: selection.artworkPlacement,
        sortOrder,
      };
    }),
  );
}

/**
 * Replaces every selected product currently persisted for a store.
 */
export async function replaceStoreProductSelections(
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
      artworkPlacement: selection.artworkPlacement,
      isRequired: selection.isRequired,
      sortOrder: selection.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
  }
}
