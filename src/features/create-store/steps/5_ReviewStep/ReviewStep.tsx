import { useEffect, useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { LuCheck, LuPencil } from "react-icons/lu";

import { api } from "../../../../../convex/_generated/api";
import { ART_TEMPLATE_LIST } from "../../../../assets/art-templates";

import type { ProductPreviewItem } from "../../components/ProductPreview/ProductPreview";
import StorefrontPreview from "../../components/StorefrontPreview/StorefrontPreview";
import WizardLayout from "../../components/WizardLayout/WizardLayout";
import { useCreateStore } from "../../context/CreateStoreContext";
import useFileDataUrl from "../../hooks/useFileDataUrl";

import { getDecorationProfileIdForProductCategory } from "../4_ProductsStep/lib/decorationProfiles";
import { createUploadedArtworkId } from "../4_ProductsStep/lib/productGeneration";
import type { ProductOption } from "../4_ProductsStep/lib/productStep.types";

import styles from "./ReviewStep.module.scss";

const STORE_ACTIVITIES = [
  "basketball",
  "baseball",
  "football",
  "soccer",
  "softball",
  "volleyball",
  "wrestling",
  "spirit-wear",
  "other",
] as const;

type StoreActivity = (typeof STORE_ACTIVITIES)[number];

interface ReviewStepProps {
  isFinalizing: boolean;
  onCreateStore: () => Promise<void>;
}

function isStoreActivity(value: string): value is StoreActivity {
  return STORE_ACTIVITIES.some((activity) => activity === value);
}

function formatLabel(value: string): string {
  if (!value) {
    return "Not provided";
  }

  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDeadline(value: string): string {
  if (!value) {
    return "No deadline";
  }

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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);

        return;
      }

      reject(new Error(`Could not read ${file.name}.`));
    };

    reader.onerror = () => reject(reader.error ?? new Error(`Could not read ${file.name}.`));

    reader.readAsDataURL(file);
  });
}

function createUploadedArtworkPreviewSvg(imageUrl: string): string {
  const escapedImageUrl = imageUrl.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><image href="${escapedImageUrl}" x="0" y="0" width="100" height="100" preserveAspectRatio="xMidYMid meet" /></svg>`;
}

export default function ReviewStep({ isFinalizing, onCreateStore }: ReviewStepProps) {
  const { setCurrentStep, storeDraft, primaryColor, secondaryColor, artworkSvgsByTemplateId } = useCreateStore();

  const [uploadedArtworkPreviewSvgsById, setUploadedArtworkPreviewSvgsById] = useState<Record<string, string>>({});

  const logoUrl = useFileDataUrl(storeDraft.logoFile);

  const organizationName = storeDraft.organizationName || "Your Organization";

  const storeName = storeDraft.storeName || "Your Team Store";

  const storeDescription = storeDraft.storeDescription || "Show your pride. Represent your team.";

  useEffect(() => {
    let isCancelled = false;

    void Promise.all(
      storeDraft.uploadedArtworks.map(async (artwork) => {
        let imageUrl: string | null = null;

        if (artwork.file) {
          imageUrl = await readFileAsDataUrl(artwork.file);
        } else if (artwork.storageUrl) {
          imageUrl = artwork.storageUrl;
        }

        if (!imageUrl) {
          return null;
        }

        return [createUploadedArtworkId(artwork.id), createUploadedArtworkPreviewSvg(imageUrl)] as const;
      }),
    )
      .then((entries) => {
        if (isCancelled) {
          return;
        }

        setUploadedArtworkPreviewSvgsById(
          Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)),
        );
      })
      .catch((error) => {
        console.error("Could not build uploaded artwork previews.", error);

        if (!isCancelled) {
          setUploadedArtworkPreviewSvgsById({});
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [storeDraft.uploadedArtworks]);

  const artworkPreviewSvgsById = useMemo(
    () => ({
      ...artworkSvgsByTemplateId,
      ...uploadedArtworkPreviewSvgsById,
    }),
    [artworkSvgsByTemplateId, uploadedArtworkPreviewSvgsById],
  );

  const selectedProductIds = useMemo(
    () => [...new Set(Object.values(storeDraft.productSelections).map((selection) => selection.productId))],
    [storeDraft.productSelections],
  );

  const storeCreationProducts = useQuery(
    api.storeProductCatalog.getStoreCreationProducts,
    isStoreActivity(storeDraft.activity)
      ? {
          activity: storeDraft.activity,
          selectedProductIds,
        }
      : "skip",
  );

  const productsById = useMemo<Map<ProductOption["_id"], ProductOption>>(() => {
    if (!storeCreationProducts) {
      return new Map<ProductOption["_id"], ProductOption>();
    }

    return new Map<ProductOption["_id"], ProductOption>(
      [...storeCreationProducts.uniforms, ...storeCreationProducts.fanwear].map((product) => [product._id, product] as const),
    );
  }, [storeCreationProducts]);

  const selectedProducts = useMemo(
    () =>
      Object.values(storeDraft.productSelections).map((selection) => {
        const product = productsById.get(selection.productId);

        const color = product?.colorOptions.find((candidate) => candidate.colorKey === selection.colorKey);

        const previewItem: ProductPreviewItem = {
          id: selection.combinationKey,
          name: product?.name ?? "Selected product",

          imageUrl: color?.imageUrl ?? null,

          minPriceInCents: product?.minPriceInCents ?? null,

          maxPriceInCents: product?.maxPriceInCents ?? null,

          statusLabel: selection.isRequired ? "Required" : "Optional",

          artworkSvg: artworkPreviewSvgsById[selection.artworkTemplateId] ?? null,

          surfaceHex: color?.primaryHexValue,

          surfaceTone: color?.tone,

          decorationProfileId: product ? getDecorationProfileIdForProductCategory(product.category) : undefined,

          decorationPreviewBounds: color?.decorationPreviewBounds,

          placement: selection.artworkPlacement,
        };

        return {
          selection,
          previewItem,
        };
      }),
    [artworkPreviewSvgsById, productsById, storeDraft.productSelections],
  );

  /*
   * Undefined keeps the storefront in its
   * skeleton/loading mode.
   */
  const requiredProducts: ProductPreviewItem[] | undefined =
    storeCreationProducts === undefined
      ? undefined
      : selectedProducts.filter(({ selection }) => selection.isRequired).map(({ previewItem }) => previewItem);

  const featuredProducts: ProductPreviewItem[] | undefined =
    storeCreationProducts === undefined
      ? undefined
      : selectedProducts.filter(({ selection }) => !selection.isRequired).map(({ previewItem }) => previewItem);

  const selectedProductCount = Object.keys(storeDraft.productSelections).length;

  const requiredProductCount = Object.values(storeDraft.productSelections).filter((selection) => selection.isRequired).length;

  const selectedTemplateArtworkCount = Object.values(storeDraft.artworkTemplates).filter((template) => template.isSelected).length;

  const selectedUploadedArtworkCount = storeDraft.uploadedArtworks.filter((artwork) => artwork.isSelected).length;

  const selectedArtworkCount = selectedTemplateArtworkCount + selectedUploadedArtworkCount;

  const selectedArtworkNames = [
    ...Object.values(storeDraft.artworkTemplates)
      .filter((template) => template.isSelected)
      .map((template) => {
        const artwork = ART_TEMPLATE_LIST.find((candidate) => candidate.id === template.selectedArtTemplateId);

        return artwork?.name ?? "Artwork template";
      }),

    ...storeDraft.uploadedArtworks.filter((artwork) => artwork.isSelected).map((artwork) => artwork.fileName),
  ];

  const storeUrl =
    storeDraft.organizationSlug && storeDraft.storeSlug
      ? `teamstore.com/store/${storeDraft.organizationSlug}/${storeDraft.storeSlug}`
      : "Store URL not set";

  return (
    <WizardLayout
      step={5}
      title="Review your store"
      description="See what customers will see and confirm everything is ready before publishing."
      onBack={() => setCurrentStep(4)}
      onNext={() => void onCreateStore()}
      nextLabel={isFinalizing ? "Creating Store..." : "Create Store"}
      nextDisabled={isFinalizing}
      width="wide"
    >
      <div className={styles.reviewStep}>
        <section className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <div>
              <span className={styles.sectionEyebrow}>Store preview</span>

              <h2>See what your customers will see</h2>

              <p>This preview uses your store branding and selected products.</p>
            </div>

            <div className={styles.previewUrl}>{storeUrl}</div>
          </div>

          <div className={styles.storefrontPreview}>
            <StorefrontPreview
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              organizationName={organizationName}
              storeName={storeName}
              storeDescription={storeDescription}
              logoUrl={logoUrl}
              requiredProducts={requiredProducts}
              fanwearProducts={featuredProducts}
            />
          </div>
        </section>

        <section className={styles.publishSection}>
          <div className={styles.publishHeader}>
            <div>
              <span className={styles.sectionEyebrow}>Ready to publish</span>

              <h2>Store setup</h2>

              <p>Review the important details below. Use Edit to jump back to any step.</p>
            </div>

            <div className={styles.readyBadge}>
              <LuCheck aria-hidden="true" />
              Ready
            </div>
          </div>

          <div className={styles.reviewChecklist}>
            <article className={styles.checklistItem}>
              <div className={styles.checkIcon}>
                <LuCheck aria-hidden="true" />
              </div>

              <div className={styles.checklistContent}>
                <span>Store</span>

                <strong>{storeName}</strong>

                <p>
                  {organizationName}
                  {" · "}
                  {formatLabel(storeDraft.activity)}
                  {" · "}
                  {formatLabel(storeDraft.storeType)}
                </p>
              </div>

              <button type="button" className={styles.editButton} onClick={() => setCurrentStep(1)}>
                <LuPencil aria-hidden="true" />
                Edit
              </button>
            </article>

            <article className={styles.checklistItem}>
              <div className={styles.checkIcon}>
                <LuCheck aria-hidden="true" />
              </div>

              <div className={styles.checklistContent}>
                <span>Branding</span>

                <strong>Team colors</strong>

                <div className={styles.colorSummary}>
                  <span
                    className={styles.colorSwatch}
                    style={{
                      backgroundColor: primaryColor,
                    }}
                    aria-hidden="true"
                  />

                  <span>{primaryColor}</span>

                  <span
                    className={styles.colorSwatch}
                    style={{
                      backgroundColor: secondaryColor,
                    }}
                    aria-hidden="true"
                  />

                  <span>{secondaryColor}</span>
                </div>
              </div>

              <button type="button" className={styles.editButton} onClick={() => setCurrentStep(2)}>
                <LuPencil aria-hidden="true" />
                Edit
              </button>
            </article>

            <article className={styles.checklistItem}>
              <div className={styles.checkIcon}>
                <LuCheck aria-hidden="true" />
              </div>

              <div className={styles.checklistContent}>
                <span>Artwork</span>

                <strong>
                  {selectedArtworkCount} selected {selectedArtworkCount === 1 ? "design" : "designs"}
                </strong>

                <p>{selectedArtworkNames.length > 0 ? selectedArtworkNames.join(", ") : "Products will be shown without artwork."}</p>
              </div>

              <button type="button" className={styles.editButton} onClick={() => setCurrentStep(3)}>
                <LuPencil aria-hidden="true" />
                Edit
              </button>
            </article>

            <article className={styles.checklistItem}>
              <div className={styles.checkIcon}>
                <LuCheck aria-hidden="true" />
              </div>

              <div className={styles.checklistContent}>
                <span>Products</span>

                <strong>
                  {selectedProductCount} selected {selectedProductCount === 1 ? "product" : "products"}
                </strong>

                <p>
                  {requiredProductCount > 0
                    ? `${requiredProductCount} required · Orders due ${formatDeadline(storeDraft.requiredItemsDeadline)}`
                    : "No required products"}
                </p>
              </div>

              <button type="button" className={styles.editButton} onClick={() => setCurrentStep(4)}>
                <LuPencil aria-hidden="true" />
                Edit
              </button>
            </article>
          </div>
        </section>
      </div>
    </WizardLayout>
  );
}
