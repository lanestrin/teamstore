import { ConvexError, v } from "convex/values";

import { query } from "./_generated/server";
import { buildProductColorOptions, decorateProductCard, getResolvedProductImages, summarizeVariants } from "./lib/productCatalog";

function normalizeOptionalText(value?: string) {
  return value?.trim() || undefined;
}

function normalizeSlug(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    throw new ConvexError("A valid product slug could not be created.");
  }

  return slug;
}

/** Public catalog cards for direct buyers. */
export const listActive = query({
  args: {
    category: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const category = normalizeOptionalText(args.category);

    const products = category
      ? await ctx.db
          .query("products")
          .withIndex("by_status_category", (q) => q.eq("status", "active").eq("category", category))
          .order("desc")
          .collect()
      : await ctx.db
          .query("products")
          .withIndex("by_status", (q) => q.eq("status", "active"))
          .order("desc")
          .collect();

    const decoratedProducts = await Promise.all(products.map((product) => decorateProductCard(ctx, product)));

    return decoratedProducts.filter((product) => product.imageUrls.length > 0 && product.availableVariantCount > 0);
  },
});

/** Homepage product cards, currently ordered by newest first. */
export const listTrending = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 5), 1), 20);

    const products = await ctx.db
      .query("products")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    const decoratedProducts = await Promise.all(products.map((product) => decorateProductCard(ctx, product)));

    return decoratedProducts.filter((product) => product.imageUrls.length > 0 && product.availableVariantCount > 0).slice(0, limit);
  },
});

/** Public product detail for direct blank-product purchases. */
export const getActiveBySlug = query({
  args: {
    slug: v.string(),
  },

  handler: async (ctx, args) => {
    const product = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", normalizeSlug(args.slug)))
      .unique();

    if (!product || product.status !== "active") {
      return null;
    }

    const [variants, images] = await Promise.all([
      ctx.db
        .query("productVariants")
        .withIndex("by_product_status", (q) => q.eq("productId", product._id).eq("status", "active"))
        .collect(),

      getResolvedProductImages(ctx, product._id),
    ]);

    const summary = summarizeVariants(variants);

    const colors = buildProductColorOptions(variants, images);

    const imageUrls = [...new Set(images.map((image) => image.imageUrl))];

    const hasColorWithoutImages = colors.some((color) => color.images.length === 0);

    if (imageUrls.length === 0 || summary.availableVariantCount === 0 || colors.length === 0 || hasColorWithoutImages) {
      return null;
    }

    return {
      ...product,
      imageUrls,
      ...summary,
      colors,
    };
  },
});
