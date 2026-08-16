import { ConvexError, v } from "convex/values";

import type { Doc, Id } from "./_generated/dataModel";
import { internalQuery, mutation, query, type QueryCtx } from "./_generated/server";
import { requirePlatformAdmin } from "./lib/authz";

type CatalogReadCtx = {
  db: QueryCtx["db"];
  storage: QueryCtx["storage"];
};

type ResolvedProductImage = Doc<"productImages"> & {
  imageUrl: string;
};

type ProductCardPreferredImageView = "leftQuarter" | "front";

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

function normalizeProviderIdentity(provider?: string, providerProductId?: string) {
  const normalizedProvider = normalizeOptionalText(provider)?.toLowerCase();

  const normalizedProviderProductId = normalizeOptionalText(providerProductId);

  if ((normalizedProvider && !normalizedProviderProductId) || (!normalizedProvider && normalizedProviderProductId)) {
    throw new ConvexError("Provider and provider product ID must be supplied together.");
  }

  return {
    provider: normalizedProvider,
    providerProductId: normalizedProviderProductId,
  };
}

function summarizeVariants(variants: Doc<"productVariants">[]) {
  const activeVariants = variants.filter((variant) => variant.status === "active");

  const purchasableVariants = activeVariants.filter((variant) => variant.availability === "available");

  const prices = purchasableVariants.map((variant) => variant.directPriceInCents);

  return {
    minPriceInCents: prices.length > 0 ? Math.min(...prices) : null,

    maxPriceInCents: prices.length > 0 ? Math.max(...prices) : null,

    activeVariantCount: activeVariants.length,

    availableVariantCount: purchasableVariants.length,

    availableColors: [...new Set(purchasableVariants.map((variant) => variant.color))],

    availableSizes: [...new Set(purchasableVariants.map((variant) => variant.size))],
  };
}

async function getVariantsForProduct(ctx: CatalogReadCtx, productId: Id<"products">) {
  return await ctx.db
    .query("productVariants")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();
}

async function getProductColorsForProduct(ctx: CatalogReadCtx, productId: Id<"products">) {
  return await ctx.db
    .query("productColors")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();
}

function getAvailableColorFamilies(variants: Doc<"productVariants">[], productColors: Doc<"productColors">[]) {
  const purchasableColorKeys = new Set(
    variants.filter((variant) => variant.status === "active" && variant.availability === "available").map((variant) => variant.colorKey),
  );

  const families = new Set<Doc<"productColors">["primaryFamily"]>();

  for (const productColor of productColors) {
    if (!purchasableColorKeys.has(productColor.colorKey)) {
      continue;
    }

    const classifiedFamilies = [productColor.primaryFamily, ...productColor.accents.map((accent) => accent.family)];

    for (const family of classifiedFamilies) {
      if (family !== "unknown") {
        families.add(family);
      }
    }
  }

  return [...families];
}

async function getProductImagesForProduct(ctx: CatalogReadCtx, productId: Id<"products">) {
  const images = await ctx.db
    .query("productImages")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();

  return images.sort((a, b) => a.sortOrder - b.sortOrder || a.color.localeCompare(b.color) || a._creationTime - b._creationTime);
}

async function getProductImageUrl(ctx: CatalogReadCtx, image: Doc<"productImages">) {
  if (image.imageStorageId) {
    const storageUrl = await ctx.storage.getUrl(image.imageStorageId);

    if (storageUrl) {
      return storageUrl;
    }
  }

  return image.externalImageUrl ?? null;
}

async function getResolvedProductImages(ctx: CatalogReadCtx, productId: Id<"products">): Promise<ResolvedProductImage[]> {
  const images = await getProductImagesForProduct(ctx, productId);

  const resolvedImages = await Promise.all(
    images.map(async (image) => {
      const imageUrl = await getProductImageUrl(ctx, image);

      if (!imageUrl) {
        return null;
      }

      return {
        ...image,
        imageUrl,
      };
    }),
  );

  return resolvedImages.flatMap((image) => (image ? [image] : []));
}

function buildProductColorOptions(variants: Doc<"productVariants">[], productImages: ResolvedProductImage[]) {
  const purchasableVariants = variants.filter((variant) => variant.status === "active" && variant.availability === "available");

  const colorNames = new Map<string, string>();

  for (const variant of purchasableVariants) {
    const color = variant.color.trim();

    if (!color || colorNames.has(variant.colorKey)) {
      continue;
    }

    colorNames.set(variant.colorKey, color);
  }

  return [...colorNames.entries()].map(([colorKey, color]) => {
    const colorVariants = purchasableVariants.filter((variant) => variant.colorKey === colorKey);

    const images = productImages
      .filter((image) => image.colorKey === colorKey)
      .map((image) => ({
        id: image._id,
        url: image.imageUrl,
        view: image.view,
        altText: image.altText,
        sortOrder: image.sortOrder,
      }));

    const prices = colorVariants.map((variant) => variant.directPriceInCents);

    return {
      color,
      colorKey,

      images,

      sizes: [...new Set(colorVariants.map((variant) => variant.size))],

      minPriceInCents: prices.length > 0 ? Math.min(...prices) : null,

      maxPriceInCents: prices.length > 0 ? Math.max(...prices) : null,

      variants: colorVariants.map((variant) => ({
        _id: variant._id,
        sku: variant.sku,
        size: variant.size,
        directPriceInCents: variant.directPriceInCents,
        compareAtPriceInCents: variant.compareAtPriceInCents,
      })),
    };
  });
}

function buildProductCardColorOptions(
  variants: Doc<"productVariants">[],
  productImages: ResolvedProductImage[],
  productColors: Doc<"productColors">[],
  preferredImageView: ProductCardPreferredImageView,
) {
  const purchasableVariants = variants.filter((variant) => variant.status === "active" && variant.availability === "available");

  const colorNames = new Map<string, string>();

  for (const variant of purchasableVariants) {
    const color = variant.color.trim();

    if (!color || colorNames.has(variant.colorKey)) {
      continue;
    }

    colorNames.set(variant.colorKey, color);
  }

  const fallbackImageView = preferredImageView === "front" ? "leftQuarter" : "front";

  return [...colorNames.entries()]
    .flatMap(([colorKey, color]) => {
      const colorImages = productImages.filter((image) => image.colorKey === colorKey);

      const previewImage =
        colorImages.find((image) => image.view === preferredImageView) ??
        colorImages.find((image) => image.view === fallbackImageView) ??
        colorImages[0];

      if (!previewImage) {
        return [];
      }

      const productColor = productColors.find((candidate) => candidate.colorKey === colorKey);

      const colorFamilies = productColor
        ? [...new Set([productColor.primaryFamily, ...productColor.accents.map((accent) => accent.family)])].filter(
            (family) => family !== "unknown",
          )
        : [];

      return [
        {
          color,
          colorKey,
          providerColor: productColor?.providerColor,
          normalizedProviderColor: productColor?.normalizedProviderColor,
          supplierHexValues: productColor?.supplierHexValues ?? [],

          imageUrl: previewImage.imageUrl,
          imageView: previewImage.view,

          colorFamilies,
          primaryFamily: productColor?.primaryFamily ?? "unknown",
          primaryCategory: productColor?.primaryCategory ?? "unknown",
          primaryHexValue: productColor?.primaryHexValue,
          accents: productColor?.accents ?? [],
          tone: productColor?.tone ?? "unknown",
          pattern: productColor?.pattern ?? "unknown",
          composition: productColor?.composition ?? "unknown",

          classificationSource: productColor?.classificationSource,
          classificationConfidence: productColor?.classificationConfidence ?? 0,
          needsReview: productColor?.needsReview ?? true,
          reviewReasons: productColor?.reviewReasons ?? [],
        },
      ];
    })
    .sort((first, second) => first.color.localeCompare(second.color));
}

async function decorateProductCard(
  ctx: CatalogReadCtx,
  product: Doc<"products">,
  preferredImageView: ProductCardPreferredImageView = "leftQuarter",
) {
  const [variants, images, productColors] = await Promise.all([
    getVariantsForProduct(ctx, product._id),
    getResolvedProductImages(ctx, product._id),
    getProductColorsForProduct(ctx, product._id),
  ]);

  return {
    ...product,

    imageUrls: [...new Set(images.map((image) => image.imageUrl))],

    colorOptions: buildProductCardColorOptions(variants, images, productColors, preferredImageView),

    availableColorFamilies: getAvailableColorFamilies(variants, productColors),

    ...summarizeVariants(variants),
  };
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

/** Platform-admin catalog list, including drafts and archived products. */
export const listForManagement = query({
  args: {},

  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);

    const products = await ctx.db.query("products").order("desc").collect();

    return await Promise.all(products.map((product) => decorateProductCard(ctx, product)));
  },
});

/** Platform-admin product detail with every variant and image. */
export const getForManagement = query({
  args: {
    productId: v.id("products"),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const product = await ctx.db.get(args.productId);

    if (!product) {
      return null;
    }

    const [variants, images] = await Promise.all([getVariantsForProduct(ctx, product._id), getResolvedProductImages(ctx, product._id)]);

    return {
      ...product,

      imageUrls: [...new Set(images.map((image) => image.imageUrl))],

      images,

      ...summarizeVariants(variants),

      variants,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.string(),
    provider: v.optional(v.string()),
    providerProductId: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const name = normalizeRequiredText(args.name, "Product name");

    const slug = normalizeSlug(args.slug ?? name);

    const providerIdentity = normalizeProviderIdentity(args.provider, args.providerProductId);

    const existingSlug = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existingSlug) {
      throw new ConvexError("A product with this slug already exists.");
    }

    if (providerIdentity.provider && providerIdentity.providerProductId) {
      const existingProviderProduct = await ctx.db
        .query("products")
        .withIndex("by_provider_product", (q) =>
          q.eq("provider", providerIdentity.provider).eq("providerProductId", providerIdentity.providerProductId),
        )
        .unique();

      if (existingProviderProduct) {
        throw new ConvexError("This provider product has already been imported.");
      }
    }

    const now = Date.now();

    return await ctx.db.insert("products", {
      name,
      slug,
      description: normalizeOptionalText(args.description),
      category: normalizeRequiredText(args.category, "Category"),
      ...providerIdentity,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.union(v.string(), v.null())),
    category: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new ConvexError("Product not found.");
    }

    const nextName = args.name !== undefined ? normalizeRequiredText(args.name, "Product name") : undefined;

    const nextSlug = args.slug !== undefined ? normalizeSlug(args.slug) : undefined;

    if (nextSlug && nextSlug !== product.slug) {
      const existingSlug = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", nextSlug))
        .unique();

      if (existingSlug && existingSlug._id !== product._id) {
        throw new ConvexError("A product with this slug already exists.");
      }
    }

    await ctx.db.patch(args.productId, {
      ...(nextName !== undefined ? { name: nextName } : {}),

      ...(nextSlug !== undefined ? { slug: nextSlug } : {}),

      ...(args.description !== undefined
        ? {
            description: args.description === null ? undefined : normalizeOptionalText(args.description),
          }
        : {}),

      ...(args.category !== undefined
        ? {
            category: normalizeRequiredText(args.category, "Category"),
          }
        : {}),

      updatedAt: Date.now(),
    });

    return args.productId;
  },
});

export const publish = mutation({
  args: {
    productId: v.id("products"),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new ConvexError("Product not found.");
    }

    const activeVariants = await ctx.db
      .query("productVariants")
      .withIndex("by_product_status", (q) => q.eq("productId", product._id).eq("status", "active"))
      .collect();

    const purchasableVariants = activeVariants.filter((variant) => variant.availability === "available");

    if (purchasableVariants.length === 0) {
      throw new ConvexError("Add at least one active, available variant before publishing.");
    }

    const productImages = await getResolvedProductImages(ctx, product._id);

    const purchasableColors = new Map<string, string>();

    for (const variant of purchasableVariants) {
      const color = variant.color.trim();

      if (!color) {
        continue;
      }

      purchasableColors.set(variant.colorKey, color);
    }

    const colorsWithImages = new Set(productImages.map((image) => image.colorKey));

    const missingImageColor = [...purchasableColors.entries()].find(([colorKey]) => !colorsWithImages.has(colorKey));

    if (missingImageColor) {
      throw new ConvexError(`Add at least one product image for ${missingImageColor[1]} before publishing.`);
    }

    await ctx.db.patch(product._id, {
      status: "active",
      updatedAt: Date.now(),
    });

    return product._id;
  },
});

export const unpublish = mutation({
  args: {
    productId: v.id("products"),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new ConvexError("Product not found.");
    }

    await ctx.db.patch(product._id, {
      status: "draft",
      updatedAt: Date.now(),
    });

    return product._id;
  },
});

export const archive = mutation({
  args: {
    productId: v.id("products"),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new ConvexError("Product not found.");
    }

    await ctx.db.patch(product._id, {
      status: "archived",
      updatedAt: Date.now(),
    });

    return product._id;
  },
});

export const restore = mutation({
  args: {
    productId: v.id("products"),
  },

  handler: async (ctx, args) => {
    await requirePlatformAdmin(ctx);

    const product = await ctx.db.get(args.productId);

    if (!product) {
      throw new ConvexError("Product not found.");
    }

    await ctx.db.patch(product._id, {
      status: "draft",
      updatedAt: Date.now(),
    });

    return product._id;
  },
});

/** Used by authenticated external-import actions. */
export const authorizeCatalogManagement = internalQuery({
  args: {},

  handler: async (ctx) => {
    await requirePlatformAdmin(ctx);
    return true;
  },
});
