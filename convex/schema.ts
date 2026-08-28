import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const storeStatus = v.union(v.literal("draft"), v.literal("active"), v.literal("archived"));

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

const storeUploadedArtwork = v.object({
  id: v.string(),
  fileName: v.string(),
  storageId: v.id("_storage"),
  isSelected: v.boolean(),
});

const productStatus = v.union(v.literal("draft"), v.literal("active"), v.literal("archived"));

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

const productColorCategory = v.union(
  v.literal("black"),
  v.literal("white"),
  v.literal("vintage-white"),
  v.literal("graphite"),
  v.literal("charcoal"),
  v.literal("light-charcoal"),
  v.literal("carbon"),
  v.literal("gray"),
  v.literal("silver"),
  v.literal("red"),
  v.literal("scarlet"),
  v.literal("cardinal"),
  v.literal("maroon"),
  v.literal("orange"),
  v.literal("burnt-orange"),
  v.literal("yellow"),
  v.literal("gold"),
  v.literal("light-gold"),
  v.literal("vegas-gold"),
  v.literal("green"),
  v.literal("forest"),
  v.literal("lime"),
  v.literal("teal"),
  v.literal("blue"),
  v.literal("columbia-blue"),
  v.literal("royal"),
  v.literal("navy"),
  v.literal("purple"),
  v.literal("pink"),
  v.literal("brown"),
  v.literal("tan"),
  v.literal("multicolor"),
  v.literal("unknown"),
);

const productColorTone = v.union(v.literal("light"), v.literal("medium"), v.literal("dark"), v.literal("unknown"));

const productColorPattern = v.union(
  v.literal("solid"),
  v.literal("heather"),
  v.literal("digital"),
  v.literal("camo"),
  v.literal("patterned"),
  v.literal("unknown"),
);

const productColorComposition = v.union(
  v.literal("single"),
  v.literal("two-tone"),
  v.literal("three-tone"),
  v.literal("multicolor"),
  v.literal("unknown"),
);

const productColorClassificationSource = v.union(v.literal("supplier-hex"), v.literal("name-rule"), v.literal("ai"), v.literal("manual"));

const productColorReviewReason = v.union(
  v.literal("missing-hex"),
  v.literal("invalid-hex"),
  v.literal("conflicting-hex"),
  v.literal("compound-color"),
  v.literal("ambiguous-name"),
  v.literal("image-name-conflict"),
  v.literal("low-confidence"),
  v.literal("unknown-category"),
  v.literal("inconsistent-classification"),
);

const productColorAccent = v.object({
  family: productColorFamily,
  category: productColorCategory,
  hexValue: v.optional(v.string()),
});

const productImageView = v.union(
  v.literal("leftQuarter"),
  v.literal("front"),
  v.literal("back"),
  v.literal("left"),
  v.literal("right"),
  v.literal("detail"),
  v.literal("other"),
);

const decorationPreviewBounds = v.object({
  x: v.number(),
  y: v.number(),
  width: v.number(),
  height: v.number(),
});

const variantStatus = v.union(v.literal("active"), v.literal("inactive"));

const variantAvailability = v.union(v.literal("available"), v.literal("unavailable"), v.literal("discontinued"));

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    isPlatformAdmin: v.optional(v.boolean()),
  }).index("by_email", ["email"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_creator", ["createdBy"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_organization_user", ["organizationId", "userId"]),

  stores: defineTable({
    createdBy: v.id("users"),
    organizationId: v.optional(v.id("organizations")),
    organizationName: v.optional(v.string()),
    organizationSlug: v.optional(v.string()),
    activity: v.optional(storeActivity),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),
    uploadedArtworks: v.optional(v.array(storeUploadedArtwork)),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    currentStep: v.number(),
    status: storeStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_organization_slug_and_slug", ["organizationSlug", "slug"])
    .index("by_creator", ["createdBy"])
    .index("by_creator_status", ["createdBy", "status"])
    .index("by_organization", ["organizationId"]),

  // Shared TeamStore catalog of blank products.
  // Products are platform-owned and never belong to an
  // individual store.
  products: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),

    // Customer-facing category, such as "T-Shirts".
    category: v.string(),

    // Original supplier category, such as
    // "Adult | TEES | TOPS".
    providerCategory: v.optional(v.string()),

    brand: v.optional(v.string()),
    division: v.optional(v.string()),
    sizeChartImageUrl: v.optional(v.string()),
    productVideoUrl: v.optional(v.string()),

    provider: v.optional(v.string()),
    providerProductId: v.optional(v.string()),

    activity: v.optional(storeActivity),

    status: productStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_status_category", ["status", "category"])
    .index("by_status_activity", ["status", "activity"])
    .index("by_provider_product", ["provider", "providerProductId"]),

  // Products explicitly selected for a store.
  // Catalog product details remain in the shared products table.
  storeProducts: defineTable({
    storeId: v.id("stores"),
    productId: v.id("products"),

    colorKey: v.string(),
    artworkTemplateId: v.string(),

    isRequired: v.boolean(),
    sortOrder: v.number(),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_store", ["storeId"])
    .index("by_product", ["productId"])
    .index("by_store_product", ["storeId", "productId"]),

  // Canonical color options for blank products.
  // One row represents one productId + colorKey pair and stores the
  // deterministic color classification used by catalog filtering.
  productColors: defineTable({
    productId: v.id("products"),

    color: v.string(),
    colorKey: v.string(),
    providerColor: v.optional(v.string()),
    normalizedProviderColor: v.string(),

    // Supplier-provided values only. Use an empty array when none exist.
    supplierHexValues: v.array(v.string()),

    primaryFamily: productColorFamily,
    primaryCategory: productColorCategory,
    primaryHexValue: v.optional(v.string()),

    accents: v.array(productColorAccent),

    tone: productColorTone,
    pattern: productColorPattern,
    composition: productColorComposition,

    classificationSource: productColorClassificationSource,
    classificationConfidence: v.number(),

    needsReview: v.boolean(),
    reviewReasons: v.array(productColorReviewReason),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_product_color_key", ["productId", "colorKey"])
    .index("by_primary_family", ["primaryFamily"])
    .index("by_primary_category", ["primaryCategory"]),

  // Color-specific gallery images.
  // Images represent product views such as front, back,
  // left, right, and detail.
  productImages: defineTable({
    productId: v.id("products"),

    color: v.string(),
    colorKey: v.string(),
    providerColor: v.optional(v.string()),

    view: productImageView,
    providerView: v.optional(v.string()),
    sortOrder: v.number(),

    source: v.optional(v.union(v.literal("csv-main"), v.literal("verified-derived"), v.literal("manual-upload"))),

    imageStorageId: v.optional(v.id("_storage")),
    externalImageUrl: v.optional(v.string()),
    altText: v.optional(v.string()),
    decorationPreviewBounds: v.optional(decorationPreviewBounds),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_product_color_key", ["productId", "colorKey"])
    .index("by_product_color_key_order", ["productId", "colorKey", "sortOrder"]),

  // Exact purchasable blank-product configurations.
  // Store-specific retail pricing will live on
  // storeProductVariants later.
  productVariants: defineTable({
    productId: v.id("products"),

    sku: v.string(),
    upc: v.optional(v.string()),

    color: v.string(),
    colorKey: v.string(),
    providerColor: v.optional(v.string()),
    size: v.string(),

    provider: v.optional(v.string()),
    providerVariantId: v.optional(v.string()),

    baseCostInCents: v.number(),
    directPriceInCents: v.number(),
    compareAtPriceInCents: v.optional(v.number()),
    currency: v.string(),

    weight: v.optional(v.number()),
    weightUnit: v.optional(v.string()),

    availability: variantAvailability,
    status: variantStatus,

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_product_status", ["productId", "status"])
    .index("by_product_color_key", ["productId", "colorKey"])
    .index("by_product_color_key_status", ["productId", "colorKey", "status"])
    .index("by_sku", ["sku"])
    .index("by_provider_variant", ["provider", "providerVariantId"]),
});
