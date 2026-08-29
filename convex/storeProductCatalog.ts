import { ConvexError, v } from "convex/values";

import type { Doc } from "./_generated/dataModel";
import { query } from "./_generated/server";
import {
  decorateProductCard,
  decorateProductCardFromData,
  getAvailableColorFamilies,
  getProductColorsForProduct,
  getVariantsForProduct,
} from "./lib/productCatalog";

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

const filterableProductColorFamily = v.union(
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
);

function normalizeRequiredText(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new ConvexError(`${label} is required.`);
  }

  return normalized;
}

/**
 * Loads active catalog products as selectable options during store setup.
 * This query does not add products to a store or modify store data.
 */
export const listProductOptionsByProviderIds = query({
  args: {
    provider: v.string(),
    providerProductIds: v.array(v.string()),
  },

  handler: async (ctx, args) => {
    const provider = normalizeRequiredText(args.provider, "Provider").toLowerCase();

    const providerProductIds = [...new Set(args.providerProductIds.map((providerProductId) => providerProductId.trim()).filter(Boolean))];

    if (providerProductIds.length > 50) {
      throw new ConvexError("A maximum of 50 products can be requested at once.");
    }

    const products = await Promise.all(
      providerProductIds.map(
        async (providerProductId) =>
          await ctx.db
            .query("products")
            .withIndex("by_provider_product", (q) => q.eq("provider", provider).eq("providerProductId", providerProductId))
            .unique(),
      ),
    );

    const activeProducts = products.flatMap((product) => (product?.status === "active" ? [product] : []));

    const decoratedProducts = await Promise.all(activeProducts.map((product) => decorateProductCard(ctx, product, "front")));

    return decoratedProducts.filter((product) => product.imageUrls.length > 0 && product.availableVariantCount > 0);
  },
});

/**
 * Loads products used during store creation.
 *
 * Products assigned to the selected activity are uniforms.
 * Products without an activity are global fanwear.
 *
 * Color filtering happens on the server so the client does not
 * need to download the entire catalog.
 */
export const getStoreCreationProducts = query({
  args: {
    activity: storeActivity,
    colorFamily: v.optional(filterableProductColorFamily),
    selectedProductIds: v.optional(v.array(v.id("products"))),
  },

  handler: async (ctx, args) => {
    const selectedProductIds = new Set(args.selectedProductIds ?? []);

    const [uniformProducts, fanwearProducts] = await Promise.all([
      ctx.db
        .query("products")
        .withIndex("by_status_activity", (q) => q.eq("status", "active").eq("activity", args.activity))
        .collect(),

      ctx.db
        .query("products")
        .withIndex("by_status_activity", (q) => q.eq("status", "active").eq("activity", undefined))
        .collect(),
    ]);

    async function buildCandidates(products: Doc<"products">[], assortmentType: "uniform" | "fanwear") {
      const candidates = await Promise.all(
        products.map(async (product) => {
          const [variants, productColors] = await Promise.all([
            getVariantsForProduct(ctx, product._id),
            getProductColorsForProduct(ctx, product._id),
          ]);

          const hasPurchasableVariant = variants.some((variant) => variant.status === "active" && variant.availability === "available");

          if (!hasPurchasableVariant) {
            return null;
          }

          return {
            assortmentType,
            product,
            variants,
            productColors,
            availableColorFamilies: getAvailableColorFamilies(variants, productColors),
          };
        }),
      );

      return candidates.flatMap((candidate) => (candidate ? [candidate] : []));
    }

    const [uniformCandidates, fanwearCandidates] = await Promise.all([
      buildCandidates(uniformProducts, "uniform"),
      buildCandidates(fanwearProducts, "fanwear"),
    ]);

    const allCandidates = [...uniformCandidates, ...fanwearCandidates];

    const availableProductColorFamilies = [...new Set(allCandidates.flatMap((candidate) => candidate.availableColorFamilies))].sort();

    const matchingCandidates = args.colorFamily
      ? allCandidates.filter(
          (candidate) => candidate.availableColorFamilies.includes(args.colorFamily!) || selectedProductIds.has(candidate.product._id),
        )
      : allCandidates;

    const resolvedProducts = await Promise.all(
      matchingCandidates.map(async (candidate) => {
        const product = await decorateProductCardFromData(ctx, candidate.product, candidate.variants, candidate.productColors, "front");

        if (product.imageUrls.length === 0 || product.availableVariantCount === 0) {
          return null;
        }

        return {
          assortmentType: candidate.assortmentType,
          product,
        };
      }),
    );

    const products = resolvedProducts.flatMap((item) => (item ? [item] : []));

    return {
      availableProductColorFamilies,

      uniforms: products.filter((item) => item.assortmentType === "uniform").map((item) => item.product),

      fanwear: products.filter((item) => item.assortmentType === "fanwear").map((item) => item.product),
    };
  },
});
