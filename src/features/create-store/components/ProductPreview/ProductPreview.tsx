import Skeleton from "../../../../components/skeleton/Skeleton";

import GarmentArtworkPreview from "../../steps/4_ProductsStep/components/GarmentArtworkPreview/GarmentArtworkPreview";

import type { ArtworkSurfaceTone } from "../../steps/4_ProductsStep/lib/artworkContrast";
import type {
  DecorationPreviewBounds,
  DecorationProfileId,
  ProductArtworkPlacement,
} from "../../steps/4_ProductsStep/lib/decorationProfiles";

import styles from "./ProductPreview.module.scss";

export interface ProductPreviewItem {
  id: string;
  name: string;

  imageUrl?: string | null;

  minPriceInCents?: number | null;
  maxPriceInCents?: number | null;

  statusLabel?: string;

  artworkSvg?: string | null;

  surfaceHex?: string;
  surfaceTone?: ArtworkSurfaceTone;

  decorationProfileId?: DecorationProfileId;
  decorationPreviewBounds?: DecorationPreviewBounds;

  placement?: ProductArtworkPlacement;
}

interface ProductPreviewProps {
  title: string;
  brandColor: string;
  showStatus?: boolean;
  products?: readonly ProductPreviewItem[];
}

function formatPrice(product: ProductPreviewItem): string | null {
  if (product.minPriceInCents === null || product.minPriceInCents === undefined) {
    return null;
  }

  const minimumPrice = `$${(product.minPriceInCents / 100).toFixed(2)}`;

  if (product.maxPriceInCents !== null && product.maxPriceInCents !== undefined && product.maxPriceInCents !== product.minPriceInCents) {
    return `${minimumPrice}–$${(product.maxPriceInCents / 100).toFixed(2)}`;
  }

  return minimumPrice;
}

export default function ProductPreview({ title, brandColor, showStatus = false, products }: ProductPreviewProps) {
  const isPlaceholderPreview = products === undefined;

  return (
    <section className={styles.productSection}>
      <div className={styles.sectionHeader}>
        <h4>{title}</h4>

        <span className={styles.viewAll} style={{ color: brandColor }}>
          View All
        </span>
      </div>

      <div className={styles.products}>
        {isPlaceholderPreview
          ? Array.from({ length: 4 }).map((_, index) => (
              <article key={index} className={styles.productCard}>
                <Skeleton className={styles.productImage} />

                <Skeleton className={styles.productTitleSkeleton} />

                <Skeleton className={styles.productPriceSkeleton} />

                {showStatus && <Skeleton className={styles.productStatusSkeleton} />}
              </article>
            ))
          : products.map((product) => {
              const price = formatPrice(product);

              const canRenderArtwork =
                Boolean(product.imageUrl) && Boolean(product.artworkSvg) && product.decorationProfileId !== undefined;

              return (
                <article key={product.id} className={styles.productCard}>
                  {product.imageUrl ? (
                    canRenderArtwork ? (
                      <GarmentArtworkPreview
                        garmentImageUrl={product.imageUrl}
                        garmentName={product.name}
                        artworkSvg={product.artworkSvg ?? undefined}
                        surfaceHex={product.surfaceHex}
                        surfaceTone={product.surfaceTone}
                        decorationProfileId={product.decorationProfileId!}
                        decorationPreviewBounds={product.decorationPreviewBounds}
                        placement={product.placement}
                      />
                    ) : (
                      <img src={product.imageUrl} alt={product.name} className={styles.productImage} />
                    )
                  ) : (
                    <div className={styles.productImagePlaceholder}>No image</div>
                  )}

                  <h5 className={styles.productName}>{product.name}</h5>

                  {price && <strong className={styles.productPrice}>{price}</strong>}

                  {showStatus && product.statusLabel && <span className={styles.productStatus}>{product.statusLabel}</span>}
                </article>
              );
            })}
      </div>
    </section>
  );
}
