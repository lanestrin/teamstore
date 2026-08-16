import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requirePlatformAdmin } from "./lib/authz";

const variantStatusValidator = v.union(v.literal("active"), v.literal("inactive"));

const availabilityValidator = v.union(v.literal("available"), v.literal("unavailable"), v.literal("discontinued"));

const DEFAULT_CURRENCY = "USD";

const newVariantValidator = v.object({
  sku: v.string(),
  color: v.string(),
  providerColor: v.optional(v.string()),
  size: v.string(),
  provider: v.optional(v.string()),
  providerVariantId: v.optional(v.string()),
  baseCostInCents: v.number(),
  directPriceInCents: v.number(),
  compareAtPriceInCents: v.optional(v.number()),
  currency: v.optional(v.string()),
  availability: v.optional(availabilityValidator),
  status: v.optional(variantStatusValidator),
});

type VariantStatus = "active" | "inactive";

type VariantAvailability = "available" | "unavailable" | "discontinued";

interface NewVariantInput {
  sku: string;
  color: string;
  providerColor?: string;
  size: string;
  provider?: string;
  providerVariantId?: string;
  baseCostInCents: number;
  directPriceInCents: number;
  compareAtPriceInCents?: number;
  currency?: string;
  availability?: VariantAvailability;
  status?: VariantStatus;
}

interface PurchasableVariantState {
  color: string;
  colorKey: string;
  status: VariantStatus;
  availability: VariantAvailability;
}

function normalizeRequiredText(value: string, label: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new ConvexError(`${label} is required.`);
  }

  return normalized;
}

function normalizeOptionalText(value?: string) {
  return value?.trim() || undefined;
}

function normalizeSku(value: string) {
  return normalizeRequiredText(value, "SKU").toUpperCase();
}

function normalizeColorKey(color: string) {
  return color.trim().toLowerCase();
}

function normalizeCurrency(currency?: string) {
  return normalizeRequiredText(currency ?? DEFAULT_CURRENCY, "Currency").toUpperCase();
}

function normalizeProviderIdentity(provider?: string, providerVariantId?: string) {
  const normalizedProvider = normalizeOptionalText(provider)?.toLowerCase();

  const normalizedProviderVariantId = normalizeOptionalText(providerVariantId);

  if ((normalizedProvider && !normalizedProviderVariantId) || (!normalizedProvider && normalizedProviderVariantId)) {
    throw new ConvexError("Provider and provider variant ID must be supplied together.");
  }

  return {
    provider: normalizedProvider,
    providerVariantId: normalizedProviderVariantId,
  };
}

function validateMoney(value: number, label: string) {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new ConvexError(`${label} must be a non-negative integer in cents.`);
  }
}

function validatePricing(baseCostInCents: number, directPriceInCents: number, compareAtPriceInCents?: number) {
  validateMoney(baseCostInCents, "Base cost");

  validateMoney(directPriceInCents, "Direct price");

  if (directPriceInCents < baseCostInCents) {
    throw new ConvexError("Direct price cannot be lower than base cost.");
  }

  if (compareAtPriceInCents !== undefined) {
    validateMoney(compareAtPriceInCents, "Compare-at price");

    if (compareAtPriceInCents <= directPriceInCents) {
      throw new ConvexError("Compare-at price must be greater than direct price.");
    }
  }
}

async function assertUniqueSku(ctx: MutationCtx, sku: string, excludeVariantId?: Id<"productVariants">) {
  const existing = await ctx.db
    .query("productVariants")
    .withIndex("by_sku", (q) => q.eq("sku", sku))
    .unique();

  if (existing && existing._id !== excludeVariantId) {
    throw new ConvexError(`SKU ${sku} is already in use.`);
  }
}

async function assertUniqueProviderVariant(
  ctx: MutationCtx,
  provider?: string,
  providerVariantId?: string,
  excludeVariantId?: Id<"productVariants">,
) {
  if (!provider || !providerVariantId) {
    return;
  }

  const existing = await ctx.db
    .query("productVariants")
    .withIndex("by_provider_variant", (q) => q.eq("provider", provider).eq("providerVariantId", providerVariantId))
    .unique();

  if (existing && existing._id !== excludeVariantId) {
    throw new ConvexError("This provider variant has already been imported.");
  }
}

async function getRequiredProduct(ctx: MutationCtx, productId: Id<"products">) {
  const product = await ctx.db.get(productId);

  if (!product) {
    throw new ConvexError("Product not found.");
  }

  return product;
}

function productImageHasSource(image: Doc<"productImages">) {
  return image.imageStorageId !== undefined || Boolean(image.externalImageUrl?.trim());
}

async function assertPurchasableColorsHaveImages(ctx: MutationCtx, product: Doc<"products">, variants: PurchasableVariantState[]) {
  if (product.status !== "active") {
    return;
  }

  const requiredColors = new Map<string, string>();

  for (const variant of variants) {
    if (variant.status !== "active" || variant.availability !== "available") {
      continue;
    }

    const color = normalizeRequiredText(variant.color, "Color");

    requiredColors.set(variant.colorKey, color);
  }

  if (requiredColors.size === 0) {
    return;
  }

  const images = await ctx.db
    .query("productImages")
    .withIndex("by_product", (q) => q.eq("productId", product._id))
    .collect();

  const colorsWithImages = new Set(images.filter(productImageHasSource).map((image) => image.colorKey));

  const missingColor = [...requiredColors.entries()].find(([colorKey]) => !colorsWithImages.has(colorKey));

  if (missingColor) {
    throw new ConvexError(`Add at least one product image for ${missingColor[1]} before making that variant purchasable.`);
  }
}

async function assertProductKeepsPurchasableVariant(
  ctx: MutationCtx,
  variant: Doc<"productVariants">,
  nextStatus: VariantStatus,
  nextAvailability: VariantAvailability,
) {
  const product = await ctx.db.get(variant.productId);

  if (!product || product.status !== "active") {
    return;
  }

  const remainsPurchasable = nextStatus === "active" && nextAvailability === "available";

  if (remainsPurchasable) {
    return;
  }

  const activeVariants = await ctx.db
    .query("productVariants")
    .withIndex("by_product_status", (q) => q.eq("productId", variant.productId).eq("status", "active"))
    .collect();

  const hasOtherPurchasableVariant = activeVariants.some(
    (candidate) => candidate._id !== variant._id && candidate.availability === "available",
  );

  if (!hasOtherPurchasableVariant) {
    throw new ConvexError("Unpublish the product before removing its final purchasable variant.");
  }
}

function buildVariantInsert(productId: Id<"products">, variant: NewVariantInput) {
  const providerIdentity = normalizeProviderIdentity(variant.provider, variant.providerVariantId);

  const sku = normalizeSku(variant.sku);

  const color = normalizeRequiredText(variant.color, "Color");

  const providerColor = normalizeOptionalText(variant.providerColor);

  const colorKey = normalizeColorKey(providerColor ?? color);

  const size = normalizeRequiredText(variant.size, "Size");

  const currency = normalizeCurrency(variant.currency);

  validatePricing(variant.baseCostInCents, variant.directPriceInCents, variant.compareAtPriceInCents);

  const now = Date.now();

  return {
    productId,
    sku,
    color,
    colorKey,
    ...(providerColor ? { providerColor } : {}),
    size,

    ...(providerIdentity.provider && providerIdentity.providerVariantId
      ? {
          provider: providerIdentity.provider,
          providerVariantId: providerIdentity.providerVariantId,
        }
      : {}),

    baseCostInCents: variant.baseCostInCents,

    directPriceInCents: variant.directPriceInCents,

    currency,

    ...(variant.compareAtPriceInCents !== undefined
      ? {
          compareAtPriceInCents: variant.compareAtPriceInCents,
        }
      : {}),

    availability: variant.availability ?? "available",

    status: variant.status ?? "active",

    createdAt: now,
    updatedAt: now,
  };
}

/** Public variants for an active blank product. */
export const listActiveByProduct = query({
  args: {
    productId: v.id("products"),
  },

  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);

    if (!product || product.status !== "active") {
      return [];
    }

    return await ctx.db
      .query("productVariants")
      .withIndex("by_product_status", (q) => q.eq("productId", args.productId).eq("status", "active"))
      .collect();
  },
});

export const listForManagement = query({
  args: {
    productId: v.id("products"),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new ConvexError("Product not found.");
    }

    return await ctx.db
      .query("productVariants")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
  },
});

export const getForManagement = query({
  args: {
    variantId: v.id("productVariants"),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    return await ctx.db.get(args.variantId);
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    sku: v.string(),
    color: v.string(),
    providerColor: v.optional(v.string()),
    size: v.string(),
    provider: v.optional(v.string()),
    providerVariantId: v.optional(v.string()),
    baseCostInCents: v.number(),
    directPriceInCents: v.number(),
    compareAtPriceInCents: v.optional(v.number()),
    currency: v.optional(v.string()),
    availability: v.optional(availabilityValidator),
    status: v.optional(variantStatusValidator),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const product = await getRequiredProduct(ctx, args.productId);

    const insert = buildVariantInsert(args.productId, args);

    await assertUniqueSku(ctx, insert.sku);

    await assertUniqueProviderVariant(ctx, insert.provider, insert.providerVariantId);

    await assertPurchasableColorsHaveImages(ctx, product, [insert]);

    return await ctx.db.insert("productVariants", insert);
  },
});

export const createMany = mutation({
  args: {
    productId: v.id("products"),
    variants: v.array(newVariantValidator),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const product = await getRequiredProduct(ctx, args.productId);

    if (args.variants.length === 0) {
      throw new ConvexError("Add at least one variant.");
    }

    if (args.variants.length > 100) {
      throw new ConvexError("Create no more than 100 variants at a time.");
    }

    const inserts = args.variants.map((variant) => buildVariantInsert(args.productId, variant));

    const skuSet = new Set<string>();

    const providerSet = new Set<string>();

    for (const insert of inserts) {
      if (skuSet.has(insert.sku)) {
        throw new ConvexError(`Duplicate SKU in request: ${insert.sku}`);
      }

      skuSet.add(insert.sku);

      if (insert.provider && insert.providerVariantId) {
        const key = `${insert.provider}:${insert.providerVariantId}`;

        if (providerSet.has(key)) {
          throw new ConvexError(`Duplicate provider variant in request: ${key}`);
        }

        providerSet.add(key);
      }
    }

    for (const insert of inserts) {
      await assertUniqueSku(ctx, insert.sku);

      await assertUniqueProviderVariant(ctx, insert.provider, insert.providerVariantId);
    }

    await assertPurchasableColorsHaveImages(ctx, product, inserts);

    const variantIds: Id<"productVariants">[] = [];

    for (const insert of inserts) {
      variantIds.push(await ctx.db.insert("productVariants", insert));
    }

    return variantIds;
  },
});

export const update = mutation({
  args: {
    variantId: v.id("productVariants"),
    sku: v.optional(v.string()),
    color: v.optional(v.string()),
    providerColor: v.optional(v.union(v.string(), v.null())),
    size: v.optional(v.string()),
    baseCostInCents: v.optional(v.number()),
    directPriceInCents: v.optional(v.number()),
    compareAtPriceInCents: v.optional(v.union(v.number(), v.null())),
    currency: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const variant = await ctx.db.get(args.variantId);

    if (!variant) {
      throw new ConvexError("Product variant not found.");
    }

    const product = await getRequiredProduct(ctx, variant.productId);

    const nextSku = args.sku !== undefined ? normalizeSku(args.sku) : variant.sku;

    const nextColor = args.color !== undefined ? normalizeRequiredText(args.color, "Color") : variant.color;

    const nextProviderColor =
      args.providerColor === null
        ? undefined
        : args.providerColor !== undefined
          ? normalizeOptionalText(args.providerColor)
          : variant.providerColor;

    const nextColorKey = normalizeColorKey(nextProviderColor ?? nextColor);

    const nextCurrency = args.currency !== undefined ? normalizeCurrency(args.currency) : variant.currency;

    const nextBaseCost = args.baseCostInCents ?? variant.baseCostInCents;

    const nextDirectPrice = args.directPriceInCents ?? variant.directPriceInCents;

    const nextCompareAt = args.compareAtPriceInCents === null ? undefined : (args.compareAtPriceInCents ?? variant.compareAtPriceInCents);

    validatePricing(nextBaseCost, nextDirectPrice, nextCompareAt);

    if (nextSku !== variant.sku) {
      await assertUniqueSku(ctx, nextSku, variant._id);
    }

    await assertPurchasableColorsHaveImages(ctx, product, [
      {
        color: nextColor,
        colorKey: nextColorKey,
        status: variant.status,
        availability: variant.availability,
      },
    ]);

    await ctx.db.patch(variant._id, {
      ...(args.sku !== undefined ? { sku: nextSku } : {}),

      ...(args.color !== undefined ? { color: nextColor } : {}),

      ...(args.color !== undefined || args.providerColor !== undefined
        ? {
            colorKey: nextColorKey,
            providerColor: nextProviderColor,
          }
        : {}),

      ...(args.size !== undefined
        ? {
            size: normalizeRequiredText(args.size, "Size"),
          }
        : {}),

      ...(args.baseCostInCents !== undefined
        ? {
            baseCostInCents: nextBaseCost,
          }
        : {}),

      ...(args.directPriceInCents !== undefined
        ? {
            directPriceInCents: nextDirectPrice,
          }
        : {}),

      ...(args.compareAtPriceInCents !== undefined
        ? {
            compareAtPriceInCents: nextCompareAt,
          }
        : {}),

      ...(args.currency !== undefined ? { currency: nextCurrency } : {}),

      updatedAt: Date.now(),
    });

    return variant._id;
  },
});

export const setAvailability = mutation({
  args: {
    variantId: v.id("productVariants"),
    availability: availabilityValidator,
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const variant = await ctx.db.get(args.variantId);

    if (!variant) {
      throw new ConvexError("Product variant not found.");
    }

    const product = await getRequiredProduct(ctx, variant.productId);

    await assertProductKeepsPurchasableVariant(ctx, variant, variant.status, args.availability);

    await assertPurchasableColorsHaveImages(ctx, product, [
      {
        color: variant.color,
        colorKey: variant.colorKey,
        status: variant.status,
        availability: args.availability,
      },
    ]);

    await ctx.db.patch(variant._id, {
      availability: args.availability,
      updatedAt: Date.now(),
    });

    return variant._id;
  },
});

export const activate = mutation({
  args: {
    variantId: v.id("productVariants"),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const variant = await ctx.db.get(args.variantId);

    if (!variant) {
      throw new ConvexError("Product variant not found.");
    }

    const product = await getRequiredProduct(ctx, variant.productId);

    await assertPurchasableColorsHaveImages(ctx, product, [
      {
        color: variant.color,
        colorKey: variant.colorKey,
        status: "active",
        availability: variant.availability,
      },
    ]);

    await ctx.db.patch(variant._id, {
      status: "active",
      updatedAt: Date.now(),
    });

    return variant._id;
  },
});

export const deactivate = mutation({
  args: {
    variantId: v.id("productVariants"),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const variant = await ctx.db.get(args.variantId);

    if (!variant) {
      throw new ConvexError("Product variant not found.");
    }

    await assertProductKeepsPurchasableVariant(ctx, variant, "inactive", variant.availability);

    await ctx.db.patch(variant._id, {
      status: "inactive",
      updatedAt: Date.now(),
    });

    return variant._id;
  },
});
