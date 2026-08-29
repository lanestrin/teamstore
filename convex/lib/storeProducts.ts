import { ConvexError, v, type Infer } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

const MAX_STORE_PRODUCTS = 50;

export const storeProductSelection = v.object({
  productId: v.id("products"),
  colorKey: v.string(),
  artworkTemplateId: v.string(),
  isRequired: v.boolean(),
});

export type StoreProductSelectionInput = Infer<typeof storeProductSelection>;

export interface ResolvedStoreProductSelection {
  productId: Id<"products">;
  colorKey: string;
  artworkTemplateId: string;
  isRequired: boolean;
  sortOrder: number;
}

/**
 * Validates the basic structure of selected store products.
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

  const seenProductIds = new Set<Id<"products">>();

  return selections.map((selection) => {
    if (seenProductIds.has(selection.productId)) {
      throw new ConvexError(`Product ${selection.productId} was selected more than once.`);
    }

    seenProductIds.add(selection.productId);

    return selection;
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
      isRequired: selection.isRequired,
      sortOrder: selection.sortOrder,
      createdAt: now,
      updatedAt: now,
    });
  }
}
