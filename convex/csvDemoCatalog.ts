import { ConvexError, v } from "convex/values";

import { mutation } from "./_generated/server";
import {
  selectedCatalogSummary,
  selectedProducts,
} from "./docs/selectedProductsData";
import { requirePlatformAdmin } from "./lib/authz";

const PROVIDER = "augusta-csv";
const CONFIRMATION = "REPLACE_CATALOG";
const DEFAULT_DELETE_LIMIT = 200;

function normalizeOptionalText(value?: string | null) {
  return value?.trim() || undefined;
}

function normalizeColorKey(providerColor: string) {
  return providerColor.trim().toLowerCase();
}

/**
 * Deletes the existing catalog in bounded batches.
 *
 * Call this repeatedly until `done` is true. Images and variants are deleted
 * before products so product references are not left behind.
 */
export const clearCatalogBatch = mutation({
  args: {
    confirmation: v.string(),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    if (args.confirmation !== CONFIRMATION) {
      throw new ConvexError(`Pass confirmation: "${CONFIRMATION}".`);
    }

    const limit = Math.min(
      Math.max(Math.floor(args.limit ?? DEFAULT_DELETE_LIMIT), 1),
      250,
    );

    const images = await ctx.db.query("productImages").take(limit);

    if (images.length > 0) {
      for (const image of images) {
        await ctx.db.delete(image._id);
      }

      return {
        done: false,
        phase: "productImages" as const,
        deleted: images.length,
      };
    }

    const variants = await ctx.db.query("productVariants").take(limit);

    if (variants.length > 0) {
      for (const variant of variants) {
        await ctx.db.delete(variant._id);
      }

      return {
        done: false,
        phase: "productVariants" as const,
        deleted: variants.length,
      };
    }

    const products = await ctx.db.query("products").take(limit);

    if (products.length > 0) {
      for (const product of products) {
        await ctx.db.delete(product._id);
      }

      return {
        done: false,
        phase: "products" as const,
        deleted: products.length,
      };
    }

    return {
      done: true,
      phase: "complete" as const,
      deleted: 0,
    };
  },
});

/**
 * Imports one audited product per call.
 *
 * Keeping each product in its own transaction makes the replacement reliable
 * without sending the full catalog through the browser.
 */
export const importCatalogBatch = mutation({
  args: {
    startIndex: v.number(),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const startIndex = Math.floor(args.startIndex);

    if (startIndex < 0 || startIndex > selectedProducts.length) {
      throw new ConvexError("Invalid catalog import index.");
    }

    if (startIndex === selectedProducts.length) {
      return {
        done: true,
        nextIndex: startIndex,
        productsInserted: 0,
        imagesInserted: 0,
        variantsInserted: 0,
        totalProducts: selectedCatalogSummary.products,
      };
    }

    const product = selectedProducts[startIndex];

    const existingProduct = await ctx.db
      .query("products")
      .withIndex("by_provider_product", (q) =>
        q
          .eq("provider", PROVIDER)
          .eq("providerProductId", product.providerProductId),
      )
      .unique();

    if (existingProduct) {
      throw new ConvexError(
        `Product ${product.providerProductId} has already been imported.`,
      );
    }

    const now = Date.now();

    const productId = await ctx.db.insert("products", {
      name: product.name,
      slug: product.slug,
      description: normalizeOptionalText(product.description),
      category: product.categoryBucket,
      providerCategory: product.category,
      brand: normalizeOptionalText(product.brand),
      division: normalizeOptionalText(product.division),
      sizeChartImageUrl: normalizeOptionalText(product.sizeChartImageUrl),
      productVideoUrl: normalizeOptionalText(product.productVideoUrl),
      provider: PROVIDER,
      providerProductId: product.providerProductId,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });

    for (const image of product.images) {
      await ctx.db.insert("productImages", {
        productId,
        color: image.color,
        colorKey: image.colorKey,
        providerColor: image.providerColor,
        view: image.view,
        providerView: image.providerView,
        sortOrder: image.sortOrder,
        source: image.source,
        externalImageUrl: image.externalImageUrl,
        altText: normalizeOptionalText(image.altText),
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const variant of product.variants) {
      const weight =
        variant.weight !== undefined &&
        variant.weight !== null &&
        variant.weight > 0
          ? variant.weight
          : undefined;

      await ctx.db.insert("productVariants", {
        productId,
        sku: variant.sku,
        upc: normalizeOptionalText(variant.upc),
        color: variant.color,
        colorKey: normalizeColorKey(variant.providerColor),
        providerColor: variant.providerColor,
        size: variant.size,
        provider: PROVIDER,
        providerVariantId: variant.providerVariantId,
        baseCostInCents: variant.baseCostInCents,
        directPriceInCents: variant.directPriceInCents,
        currency: variant.currency,
        weight,
        weightUnit:
          weight !== undefined
            ? normalizeOptionalText(variant.weightUnit)
            : undefined,
        availability: "available",
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
    }

    const nextIndex = startIndex + 1;

    return {
      done: nextIndex >= selectedProducts.length,
      nextIndex,
      productsInserted: 1,
      imagesInserted: product.images.length,
      variantsInserted: product.variants.length,
      totalProducts: selectedCatalogSummary.products,
    };
  },
});