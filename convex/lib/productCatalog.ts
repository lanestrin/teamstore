import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export type CatalogReadCtx = {
  db: QueryCtx["db"];
  storage: QueryCtx["storage"];
};

export type ResolvedProductImage = Doc<"productImages"> & {
  imageUrl: string;
};

type ProductCardPreferredImageView = "leftQuarter" | "front";

/**
 * Builds availability and pricing information from a product's variants.
 */
export function summarizeVariants(variants: Doc<"productVariants">[]) {
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

/**
 * Loads all variants belonging to a product.
 */
export async function getVariantsForProduct(ctx: CatalogReadCtx, productId: Id<"products">) {
  return await ctx.db
    .query("productVariants")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();
}

/**
 * Loads the color classification records belonging to a product.
 */
export async function getProductColorsForProduct(ctx: CatalogReadCtx, productId: Id<"products">) {
  return await ctx.db
    .query("productColors")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();
}

/**
 * Returns the filterable color families that currently have at least
 * one active, available variant.
 */
export function getAvailableColorFamilies(variants: Doc<"productVariants">[], productColors: Doc<"productColors">[]) {
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

/**
 * Loads product image records in their display order.
 */
async function getProductImagesForProduct(ctx: CatalogReadCtx, productId: Id<"products">) {
  const images = await ctx.db
    .query("productImages")
    .withIndex("by_product", (q) => q.eq("productId", productId))
    .collect();

  return images.sort(
    (first, second) =>
      first.sortOrder - second.sortOrder || first.color.localeCompare(second.color) || first._creationTime - second._creationTime,
  );
}

/**
 * Resolves the usable URL for a product image.
 *
 * Convex storage is preferred when present, with the external URL
 * acting as the fallback.
 */
async function getProductImageUrl(ctx: CatalogReadCtx, image: Doc<"productImages">) {
  if (image.imageStorageId) {
    const storageUrl = await ctx.storage.getUrl(image.imageStorageId);

    if (storageUrl) {
      return storageUrl;
    }
  }

  return image.externalImageUrl ?? null;
}

/**
 * Loads product images and removes records that do not resolve
 * to a usable image URL.
 */
export async function getResolvedProductImages(ctx: CatalogReadCtx, productId: Id<"products">): Promise<ResolvedProductImage[]> {
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

/**
 * Builds the detailed color options used on product detail pages.
 */
export function buildProductColorOptions(variants: Doc<"productVariants">[], productImages: ResolvedProductImage[]) {
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

/**
 * Builds the lighter-weight color options displayed on catalog cards.
 */
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
          decorationPreviewBounds: previewImage.decorationPreviewBounds,

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

/**
 * Builds a catalog-card product when variants and color records
 * have already been loaded by the caller.
 */
export async function decorateProductCardFromData(
  ctx: CatalogReadCtx,
  product: Doc<"products">,
  variants: Doc<"productVariants">[],
  productColors: Doc<"productColors">[],
  preferredImageView: ProductCardPreferredImageView = "leftQuarter",
) {
  const images = await getResolvedProductImages(ctx, product._id);

  return {
    ...product,

    imageUrls: [...new Set(images.map((image) => image.imageUrl))],
    colorOptions: buildProductCardColorOptions(variants, images, productColors, preferredImageView),
    availableColorFamilies: getAvailableColorFamilies(variants, productColors),

    ...summarizeVariants(variants),
  };
}

/**
 * Loads the supporting product data and builds a complete catalog card.
 */
export async function decorateProductCard(
  ctx: CatalogReadCtx,
  product: Doc<"products">,
  preferredImageView: ProductCardPreferredImageView = "leftQuarter",
) {
  const [variants, productColors] = await Promise.all([
    getVariantsForProduct(ctx, product._id),
    getProductColorsForProduct(ctx, product._id),
  ]);

  return await decorateProductCardFromData(ctx, product, variants, productColors, preferredImageView);
}
