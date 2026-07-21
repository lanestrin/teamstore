import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const storeStatus = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("archived"),
);

const productStatus = v.union(
  v.literal("draft"),
  v.literal("active"),
  v.literal("archived"),
);

const productImageView = v.union(
  v.literal("leftQuarter"),
  v.literal("front"),
  v.literal("back"),
  v.literal("left"),
  v.literal("right"),
  v.literal("detail"),
  v.literal("other"),
);

const variantStatus = v.union(v.literal("active"), v.literal("inactive"));

const variantAvailability = v.union(
  v.literal("available"),
  v.literal("unavailable"),
  v.literal("discontinued"),
);

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
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    logoStorageId: v.optional(v.id("_storage")),
    bannerStorageId: v.optional(v.id("_storage")),
    primaryColor: v.optional(v.string()),
    secondaryColor: v.optional(v.string()),
    currentStep: v.number(),
    status: storeStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
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

    status: productStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_status_category", ["status", "category"])
    .index("by_provider_product", ["provider", "providerProductId"]),

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

    source: v.optional(
      v.union(
        v.literal("csv-main"),
        v.literal("verified-derived"),
        v.literal("manual-upload"),
      ),
    ),

    imageStorageId: v.optional(v.id("_storage")),
    externalImageUrl: v.optional(v.string()),
    altText: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_product_color_key", ["productId", "colorKey"])
    .index("by_product_color_key_order", [
      "productId",
      "colorKey",
      "sortOrder",
    ]),

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
    .index("by_product_color_key_status", [
      "productId",
      "colorKey",
      "status",
    ])
    .index("by_sku", ["sku"])
    .index("by_provider_variant", ["provider", "providerVariantId"]),
});