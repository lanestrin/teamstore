import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { classifyProductColor, extractProductColorHexValues, normalizeProductColorName } from "../src/lib/classifyProductColor";
import { selectedCatalogSummary, selectedProducts } from "./docs/selectedProductsData";
import { requirePlatformAdmin } from "./lib/authz";
import { getDecorationPreviewBounds } from "./docs/decorationPreviewOverrides";

const PROVIDER = "augusta-csv";
const CONFIRMATION = "REPLACE_CATALOG";
const DEFAULT_DELETE_LIMIT = 200;

type ProductActivity =
  "basketball" | "baseball" | "football" | "soccer" | "softball" | "volleyball" | "wrestling" | "spirit-wear" | "other";

function getProductActivity(providerCategory: string): ProductActivity | undefined {
  const category = providerCategory.toUpperCase();

  if (category.includes("| BASKETBALL |")) {
    return "basketball";
  }

  if (category.includes("| BASEBALL |")) {
    return "baseball";
  }

  if (category.includes("| FOOTBALL |")) {
    return "football";
  }

  if (category.includes("| SOCCER |")) {
    return "soccer";
  }

  if (category.includes("| SOFTBALL |")) {
    return "softball";
  }

  if (category.includes("| VOLLEYBALL |")) {
    return "volleyball";
  }

  if (category.includes("| WRESTLING |")) {
    return "wrestling";
  }

  return undefined;
}

function normalizeOptionalText(value?: string | null) {
  return value?.trim() || undefined;
}

function normalizeColorKey(providerColor: string) {
  return providerColor.trim().toLowerCase();
}

export const getCatalogSummary = query({
  args: {},

  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);

    return selectedCatalogSummary;
  },
});

/**
 * Deletes the existing catalog in bounded batches.
 *
 * Call this repeatedly until `done` is true. Images, variants, and product
 * colors are deleted before products so references are not left behind.
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

    const limit = Math.min(Math.max(Math.floor(args.limit ?? DEFAULT_DELETE_LIMIT), 1), 250);

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

    const productColors = await ctx.db.query("productColors").take(limit);

    if (productColors.length > 0) {
      for (const productColor of productColors) {
        await ctx.db.delete(productColor._id);
      }

      return {
        done: false,
        phase: "productColors" as const,
        deleted: productColors.length,
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

export const reclassifyProductColorsBatch = mutation({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const limit = Math.min(Math.max(Math.floor(args.limit ?? 100), 1), 200);

    const result = await ctx.db.query("productColors").paginate({
      cursor: args.cursor ?? null,
      numItems: limit,
    });

    for (const productColor of result.page) {
      const classification = classifyProductColor({
        providerColor: productColor.providerColor ?? productColor.color,

        hexValue: productColor.supplierHexValues.length > 0 ? productColor.supplierHexValues.join("|") : undefined,
      });

      await ctx.db.patch(productColor._id, {
        primaryFamily: classification.primary.family,
        primaryCategory: classification.primary.category,
        primaryHexValue: classification.primary.hexValue,

        accents: classification.accents.map((accent) => ({
          family: accent.family,
          category: accent.category,
          hexValue: accent.hexValue,
        })),

        tone: classification.tone,
        pattern: classification.pattern,
        composition: classification.composition,

        classificationSource: classification.source,
        classificationConfidence: classification.confidence,

        needsReview: classification.needsReview,
        reviewReasons: classification.reviewReasons,

        updatedAt: Date.now(),
      });
    }

    return {
      updated: result.page.length,
      done: result.isDone,
      nextCursor: result.isDone ? null : result.continueCursor,
    };
  },
});

export const reclassifyProductActivitiesBatch = mutation({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const limit = Math.min(Math.max(Math.floor(args.limit ?? 100), 1), 200);

    const result = await ctx.db.query("products").paginate({
      cursor: args.cursor ?? null,
      numItems: limit,
    });

    let classified = 0;
    let unclassified = 0;
    let skipped = 0;

    const activityCounts = {
      basketball: 0,
      baseball: 0,
      football: 0,
      soccer: 0,
      softball: 0,
      volleyball: 0,
      wrestling: 0,
    };

    for (const product of result.page) {
      /*
       * This classifier understands Augusta's category format.
       * Future vendors should normalize activity inside their own importer.
       */
      if (product.provider !== PROVIDER) {
        skipped += 1;
        continue;
      }

      const activity = product.providerCategory ? getProductActivity(product.providerCategory) : undefined;

      await ctx.db.patch(product._id, {
        activity,
        updatedAt: Date.now(),
      });

      if (activity && activity in activityCounts) {
        activityCounts[activity as keyof typeof activityCounts] += 1;
        classified += 1;
      } else {
        unclassified += 1;
      }
    }

    return {
      processed: result.page.length,
      classified,
      unclassified,
      skipped,
      activityCounts,
      done: result.isDone,
      nextCursor: result.isDone ? null : result.continueCursor,
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
        colorsInserted: 0,
        imagesInserted: 0,
        variantsInserted: 0,
        totalProducts: selectedCatalogSummary.products,
      };
    }

    const product = selectedProducts[startIndex];

    const existingProduct = await ctx.db
      .query("products")
      .withIndex("by_provider_product", (q) => q.eq("provider", PROVIDER).eq("providerProductId", product.providerProductId))
      .unique();

    if (existingProduct) {
      throw new ConvexError(`Product ${product.providerProductId} has already been imported.`);
    }

    const now = Date.now();

    const productId = await ctx.db.insert("products", {
      name: product.name,
      slug: product.slug,
      description: normalizeOptionalText(product.description),
      category: product.categoryBucket,
      providerCategory: product.category,
      activity: getProductActivity(product.category),
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

    for (const color of product.colors) {
      const classification = classifyProductColor({
        providerColor: color.providerColor,
        hexValue: color.colorHexValue,
      });

      await ctx.db.insert("productColors", {
        productId,
        color: color.color,
        colorKey: normalizeColorKey(color.colorKey),
        providerColor: normalizeOptionalText(color.providerColor),
        normalizedProviderColor: normalizeProductColorName(color.providerColor),
        supplierHexValues: extractProductColorHexValues(color.colorHexValue),

        primaryFamily: classification.primary.family,
        primaryCategory: classification.primary.category,
        primaryHexValue: classification.primary.hexValue,

        accents: classification.accents.map((accent) => ({
          family: accent.family,
          category: accent.category,
          hexValue: accent.hexValue,
        })),

        tone: classification.tone,
        pattern: classification.pattern,
        composition: classification.composition,

        classificationSource: classification.source,
        classificationConfidence: classification.confidence,

        needsReview: classification.needsReview,
        reviewReasons: classification.reviewReasons,

        createdAt: now,
        updatedAt: now,
      });
    }

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
        decorationPreviewBounds: getDecorationPreviewBounds(product.providerProductId, image.colorKey, image.view),
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const variant of product.variants) {
      const weight = variant.weight !== undefined && variant.weight !== null && variant.weight > 0 ? variant.weight : undefined;

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
        weightUnit: weight !== undefined ? normalizeOptionalText(variant.weightUnit) : undefined,
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
      colorsInserted: product.colors.length,
      imagesInserted: product.images.length,
      variantsInserted: product.variants.length,
      totalProducts: selectedCatalogSummary.products,
    };
  },
});
