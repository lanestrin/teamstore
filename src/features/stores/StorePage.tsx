import { useQuery } from "convex/react";
import { useParams } from "react-router-dom";

import { api } from "../../../convex/_generated/api";

import jaguarsLogo from "../../assets/images/jaguars_logo.png";
import knightsLogo from "../../assets/images/knights_logo.png";
import lionsLogo from "../../assets/images/lions_logo.png";
import tigersLogo from "../../assets/images/tigers_logo.png";
import trojanLogo from "../../assets/images/trojan_logo.png";

import ProductCard from "../../components/product-card/ProductCard";

import GarmentArtworkPreview from "../create-store/steps/4_ProductsStep/components/GarmentArtworkPreview/GarmentArtworkPreview";
import { getDecorationProfileIdForProductCategory } from "../create-store/steps/4_ProductsStep/lib/decorationProfiles";
import { getUploadedArtworkId } from "../create-store/steps/4_ProductsStep/lib/productGeneration";

import { fanwearProducts, requiredProducts } from "../../mocks/products";

import styles from "./StorePage.module.scss";

const demoStores = {
  "jaguars-soccer": {
    name: "Jaguars Soccer",
    organizationName: "Jaguars Athletics",
    description: "Official apparel and merchandise for Jaguars Soccer.",
    activity: "soccer",
    logo: jaguarsLogo,
  },

  "knights-baseball": {
    name: "Knights Baseball",
    organizationName: "Knights Athletics",
    description: "Official apparel and merchandise for Knights Baseball.",
    activity: "baseball",
    logo: knightsLogo,
  },

  "lions-track": {
    name: "Lions Track",
    organizationName: "Lions Athletics",
    description: "Official apparel and merchandise for Lions Track.",
    activity: "other",
    logo: lionsLogo,
  },

  "tigers-athletics": {
    name: "Tigers Athletics",
    organizationName: "Tigers Athletics",
    description: "Official apparel and merchandise for Tigers Athletics.",
    activity: "other",
    logo: tigersLogo,
  },

  "trojans-lacrosse": {
    name: "Trojans Lacrosse",
    organizationName: "Trojans Athletics",
    description: "Official apparel and merchandise for Trojans Lacrosse.",
    activity: "other",
    logo: trojanLogo,
  },
} as const;

function getDemoStore(storeSlug: string | undefined) {
  if (!storeSlug || !(storeSlug in demoStores)) {
    return null;
  }

  return demoStores[storeSlug as keyof typeof demoStores];
}

function createDemoProductCardData(product: (typeof requiredProducts)[number]) {
  return {
    id: String(product.id),
    name: product.name,
    imageUrl: product.image,
    priceLabel: `$${product.price.toFixed(2)}`,
    productUrl: `/product/${product.slug}`,
    deadline: product.deadline,
    inCart: product.inCart,
  };
}

function formatPrice(minPriceInCents: number | null, maxPriceInCents: number | null): string {
  if (minPriceInCents === null) {
    return "Price unavailable";
  }

  const minimumPrice = `$${(minPriceInCents / 100).toFixed(2)}`;

  if (maxPriceInCents !== null && maxPriceInCents !== minPriceInCents) {
    return `${minimumPrice}–$${(maxPriceInCents / 100).toFixed(2)}`;
  }

  return minimumPrice;
}

function formatActivity(activity: string | undefined): string | null {
  if (!activity) {
    return null;
  }

  return activity
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function getTodayDateValue(): string {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDaysUntilDeadline(deadline: string): number {
  const [year, month, day] = deadline.split("-").map(Number);

  if (!year || !month || !day) {
    return 0;
  }

  const today = new Date();

  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const deadlineDate = new Date(year, month - 1, day);

  return Math.ceil((deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
}

function escapeSvgAttribute(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
}

function createUploadedArtworkSvg(imageUrl: string): string {
  const escapedImageUrl = escapeSvgAttribute(imageUrl);

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <image
        href="${escapedImageUrl}"
        x="0"
        y="0"
        width="100"
        height="100"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  `;
}

export default function StorePage() {
  const { organizationSlug, storeSlug } = useParams<{
    organizationSlug: string;
    storeSlug: string;
  }>();

  const isDemoRoute = organizationSlug === "demo";

  const liveStore = useQuery(
    api.stores.getActiveStoreBySlugs,
    organizationSlug && storeSlug && !isDemoRoute
      ? {
          organizationSlug,
          storeSlug,
        }
      : "skip",
  );

  const demoStore = isDemoRoute ? getDemoStore(storeSlug) : null;

  if (!organizationSlug || !storeSlug) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div>
              <span className={styles.storeLabel}>TEAMSTORE</span>

              <h1>Store not found</h1>

              <p>The requested store address is invalid.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!isDemoRoute && liveStore === undefined) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div>
              <span className={styles.storeLabel}>TEAMSTORE</span>

              <h1>Loading store...</h1>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (isDemoRoute && demoStore === null) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div>
              <span className={styles.storeLabel}>TEAMSTORE</span>

              <h1>Store not found</h1>

              <p>This store does not exist or is not currently active.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!isDemoRoute && liveStore === null) {
    return (
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div>
              <span className={styles.storeLabel}>TEAMSTORE</span>

              <h1>Store not found</h1>

              <p>This store does not exist or is not currently active.</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const storeName = demoStore ? demoStore.name : (liveStore?.name ?? liveStore?.organizationName ?? "Team Store");

  const organizationName = demoStore ? demoStore.organizationName : (liveStore?.organizationName ?? null);

  const storeDescription = demoStore
    ? demoStore.description
    : (liveStore?.description ?? `Official apparel and merchandise for ${organizationName ?? "this organization"}.`);

  const activity = demoStore ? demoStore.activity : liveStore?.activity;

  const activityLabel = formatActivity(activity);

  const storeLogo = demoStore ? demoStore.logo : (liveStore?.logoUrl ?? null);

  const liveRequiredProducts = !demoStore && liveStore ? liveStore.products.filter((product) => product.isRequired) : [];

  const liveFeaturedProducts = !demoStore && liveStore ? liveStore.products.filter((product) => !product.isRequired) : [];

  const productCount = demoStore ? requiredProducts.length + fanwearProducts.length : (liveStore?.products.length ?? 0);

  const requiredItemsDeadline = !demoStore && liveStore ? liveStore.requiredItemsDeadline : undefined;

  const todayDate = getTodayDateValue();

  const isDeadlinePast = Boolean(requiredItemsDeadline) && requiredItemsDeadline! < todayDate;

  const daysRemaining = requiredItemsDeadline ? getDaysUntilDeadline(requiredItemsDeadline) : null;

  const artworkSnapshotsById = new Map((liveStore?.artworkSnapshots ?? []).map((snapshot) => [snapshot.artworkTemplateId, snapshot.svg]));

  const uploadedArtworksById = new Map((liveStore?.uploadedArtworks ?? []).map((artwork) => [artwork.id, artwork.storageUrl]));

  function getArtworkSvg(artworkTemplateId: string): string | undefined {
    const templateSnapshot = artworkSnapshotsById.get(artworkTemplateId);

    if (templateSnapshot) {
      return templateSnapshot;
    }

    const uploadedArtworkId = getUploadedArtworkId(artworkTemplateId);

    if (!uploadedArtworkId) {
      return undefined;
    }

    const storageUrl = uploadedArtworksById.get(uploadedArtworkId);

    if (!storageUrl) {
      return undefined;
    }

    return createUploadedArtworkSvg(storageUrl);
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          {storeLogo && <img src={storeLogo} alt={organizationName ?? storeName} className={styles.logo} />}

          <div>
            <span className={styles.storeLabel}>OFFICIAL TEAM STORE</span>

            <h1>{storeName}</h1>

            <p>{storeDescription}</p>

            <div className={styles.storeMeta}>
              <span>
                {productCount} {productCount === 1 ? "Product" : "Products"}
              </span>

              {activityLabel && <span>{activityLabel}</span>}

              {organizationName && <span>{organizationName}</span>}
            </div>
          </div>
        </div>
      </section>

      {demoStore && requiredProducts.length > 0 && (
        <section className={styles.requiredSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Required Team Items</h2>

              <p>These items are required for all rostered players.</p>
            </div>
          </div>

          <div className={styles.deadlineBanner}>
            <div className={styles.deadlineIcon}>⚠</div>

            <div>
              <strong>REQUIRED ITEMS ORDER DEADLINE</strong>

              <span>August 15, 2026 • 12 Days Remaining</span>

              <small>All required team items must be ordered before the deadline.</small>
            </div>
          </div>

          <div className={styles.requiredGrid}>
            {requiredProducts.map((product) => (
              <ProductCard key={product.id} product={createDemoProductCardData(product)} showDeadline showRequiredStatus />
            ))}
          </div>
        </section>
      )}

      {!demoStore && liveStore && liveRequiredProducts.length > 0 && (
        <section className={styles.requiredSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Required Team Items</h2>

              <p>These items are required for all rostered players.</p>
            </div>
          </div>

          {requiredItemsDeadline && isDeadlinePast ? (
            <div className={styles.deadlineBanner}>
              <div className={styles.deadlineIcon}>!</div>

              <div>
                <strong>REQUIRED ORDERING HAS CLOSED</strong>

                <span>Next drop coming soon</span>

                <small>Contact the store owner for information about the next required-items ordering window.</small>
              </div>
            </div>
          ) : requiredItemsDeadline ? (
            <div className={styles.deadlineBanner}>
              <div className={styles.deadlineIcon}>⚠</div>

              <div>
                <strong>REQUIRED ITEMS ORDER DEADLINE</strong>

                <span>
                  {formatDateOnly(requiredItemsDeadline)}
                  {" • "}
                  {daysRemaining === 0 ? "Orders Close Today" : `${daysRemaining} ${daysRemaining === 1 ? "Day" : "Days"} Remaining`}
                </span>

                <small>All required team items must be ordered before the deadline.</small>
              </div>
            </div>
          ) : null}

          <div className={styles.requiredGrid}>
            {liveRequiredProducts.map((product) => {
              const artworkSvg = getArtworkSvg(product.artworkTemplateId);

              return (
                <ProductCard
                  key={product.storeProductId}
                  product={{
                    id: String(product.storeProductId),
                    name: product.name,
                    imageUrl: product.imageUrl,
                    priceLabel: formatPrice(product.minPriceInCents, product.maxPriceInCents),
                    productUrl: `/product/${product.slug}`,
                    deadline: requiredItemsDeadline ? formatDateOnly(requiredItemsDeadline) : undefined,
                    inCart: false,
                  }}
                  showDeadline={!isDeadlinePast}
                  showRequiredStatus
                  renderPreview={
                    artworkSvg
                      ? ({ imageUrl, alt }) => (
                          <GarmentArtworkPreview
                            garmentImageUrl={imageUrl}
                            garmentName={alt}
                            artworkSvg={artworkSvg}
                            surfaceHex={product.primaryHexValue}
                            surfaceTone={product.tone}
                            decorationProfileId={getDecorationProfileIdForProductCategory(product.category)}
                            decorationPreviewBounds={product.decorationPreviewBounds}
                            placement={product.artworkPlacement}
                          />
                        )
                      : undefined
                  }
                />
              );
            })}
          </div>
        </section>
      )}

      {demoStore && fanwearProducts.length > 0 && (
        <section className={styles.fanwearSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Featured Fanwear</h2>

              <p>Optional apparel and accessories for family, friends, alumni, and supporters.</p>
            </div>
          </div>

          <div className={styles.fanwearGrid}>
            {fanwearProducts.map((product) => (
              <ProductCard key={product.id} product={createDemoProductCardData(product)} />
            ))}
          </div>
        </section>
      )}

      {!demoStore && liveStore && liveFeaturedProducts.length > 0 && (
        <section className={styles.fanwearSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Featured Fanwear</h2>

              <p>Optional apparel and accessories for family, friends, alumni, and supporters.</p>
            </div>
          </div>

          <div className={styles.fanwearGrid}>
            {liveFeaturedProducts.map((product) => {
              const artworkSvg = getArtworkSvg(product.artworkTemplateId);

              return (
                <ProductCard
                  key={product.storeProductId}
                  product={{
                    id: String(product.storeProductId),
                    name: product.name,
                    imageUrl: product.imageUrl,
                    priceLabel: formatPrice(product.minPriceInCents, product.maxPriceInCents),
                    productUrl: `/product/${product.slug}`,
                    inCart: false,
                  }}
                  renderPreview={
                    artworkSvg
                      ? ({ imageUrl, alt }) => (
                          <GarmentArtworkPreview
                            garmentImageUrl={imageUrl}
                            garmentName={alt}
                            artworkSvg={artworkSvg}
                            surfaceHex={product.primaryHexValue}
                            surfaceTone={product.tone}
                            decorationProfileId={getDecorationProfileIdForProductCategory(product.category)}
                            decorationPreviewBounds={product.decorationPreviewBounds}
                            placement={product.artworkPlacement}
                          />
                        )
                      : undefined
                  }
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
