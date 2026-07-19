import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";

import { api } from "../../../../../convex/_generated/api";

import styles from "./ReplaceCatalogButton.module.scss";

const REQUIRED_CONFIRMATION = "REPLACE";
const BACKEND_CONFIRMATION = "REPLACE_CATALOG";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Catalog replacement failed.";
}

export default function ReplaceCatalogButton() {
  const clearCatalogBatch = useMutation(api.csvDemoCatalog.clearCatalogBatch);
  const importCatalogBatch = useMutation(api.csvDemoCatalog.importCatalogBatch);

  const confirmationInputRef = useRef<HTMLInputElement>(null);

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [isReplacing, setIsReplacing] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success",
  );

  const canReplace =
    confirmationText.trim() === REQUIRED_CONFIRMATION && !isReplacing;

  useEffect(() => {
    if (!isConfirmationOpen) {
      return;
    }

    confirmationInputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isReplacing) {
        setIsConfirmationOpen(false);
        setConfirmationText("");
        setProgressText(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isConfirmationOpen, isReplacing]);

  function openConfirmation(): void {
    setConfirmationText("");
    setProgressText(null);
    setIsConfirmationOpen(true);
  }

  function closeConfirmation(): void {
    if (isReplacing) {
      return;
    }

    setIsConfirmationOpen(false);
    setConfirmationText("");
    setProgressText(null);
  }

  async function handleReplace(): Promise<void> {
    if (!canReplace) {
      return;
    }

    setIsReplacing(true);
    setMessage(null);
    setProgressText("Clearing the existing catalog...");

    let productsDeleted = 0;
    let variantsDeleted = 0;
    let imagesDeleted = 0;

    let productsInserted = 0;
    let variantsInserted = 0;
    let imagesInserted = 0;

    try {
      while (true) {
        const result = await clearCatalogBatch({
          confirmation: BACKEND_CONFIRMATION,
          limit: 200,
        });

        if (result.phase === "products") {
          productsDeleted += result.deleted;
        }

        if (result.phase === "productVariants") {
          variantsDeleted += result.deleted;
        }

        if (result.phase === "productImages") {
          imagesDeleted += result.deleted;
        }

        if (result.done) {
          break;
        }

        setProgressText(
          `Clearing catalog... Deleted ${productsDeleted} products, ` +
            `${variantsDeleted} variants, and ${imagesDeleted} images.`,
        );
      }

      let nextIndex = 0;

      while (true) {
        const result = await importCatalogBatch({
          startIndex: nextIndex,
        });

        productsInserted += result.productsInserted;
        variantsInserted += result.variantsInserted;
        imagesInserted += result.imagesInserted;
        nextIndex = result.nextIndex;

        setProgressText(
          `Importing catalog... ${nextIndex} of ` +
            `${result.totalProducts} products complete.`,
        );

        if (result.done) {
          break;
        }
      }

      setMessageType("success");
      setMessage(
        `Catalog replaced. Inserted ${productsInserted} products, ` +
          `${variantsInserted} variants, and ${imagesInserted} images.`,
      );

      setIsConfirmationOpen(false);
      setConfirmationText("");
      setProgressText(null);
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
      setProgressText(null);
    } finally {
      setIsReplacing(false);
    }
  }

  return (
    <>
      <article className={styles.card}>
        <div className={styles.content}>
          <div className={styles.headingRow}>
            <div>
              <span className={styles.eyebrow}>CSV DEMO CATALOG</span>

              <h3>Replace the global catalog</h3>
            </div>
          </div>

          <p className={styles.description}>
            Deletes the current catalog, then loads the audited Augusta catalog
            with product images, colors, sizes, pricing, and variants.
          </p>

          <dl className={styles.summary}>
            <div>
              <dt>Products</dt>
              <dd>60</dd>
            </div>

            <div>
              <dt>Variants</dt>
              <dd>2,143</dd>
            </div>

            <div>
              <dt>Provider</dt>
              <dd>Augusta CSV</dd>
            </div>
          </dl>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.replaceButton}
            onClick={openConfirmation}
            disabled={isReplacing}
          >
            {isReplacing ? "Replacing catalog..." : "Replace catalog"}
          </button>

          <p className={styles.helperText}>Platform administrators only</p>
        </div>

        {message && (
          <p
            className={
              messageType === "success"
                ? styles.successMessage
                : styles.errorMessage
            }
            role="status"
            aria-live="polite"
          >
            {message}
          </p>
        )}
      </article>

      {isConfirmationOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeConfirmation();
            }
          }}
        >
          <section
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="replace-catalog-title"
            aria-describedby="replace-catalog-description"
          >
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.modalEyebrow}>Confirm replacement</span>

                <h2 id="replace-catalog-title">Replace the entire catalog?</h2>
              </div>

              <button
                type="button"
                className={styles.closeButton}
                onClick={closeConfirmation}
                disabled={isReplacing}
                aria-label="Close confirmation"
              >
                ×
              </button>
            </div>

            <p
              id="replace-catalog-description"
              className={styles.modalDescription}
            >
              This permanently deletes the current catalog before inserting the
              audited 60-product catalog. Existing manual catalog edits cannot
              be recovered.
            </p>

            {progressText && (
              <p
                className={styles.modalDescription}
                role="status"
                aria-live="polite"
              >
                {progressText}
              </p>
            )}

            <label className={styles.confirmationField}>
              <span>
                Type <strong>{REQUIRED_CONFIRMATION}</strong> to continue
              </span>

              <input
                ref={confirmationInputRef}
                type="text"
                value={confirmationText}
                onChange={(event) => setConfirmationText(event.target.value)}
                autoComplete="off"
                spellCheck={false}
                disabled={isReplacing}
                placeholder={REQUIRED_CONFIRMATION}
              />
            </label>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeConfirmation}
                disabled={isReplacing}
              >
                Cancel
              </button>

              <button
                type="button"
                className={styles.confirmButton}
                onClick={() => void handleReplace()}
                disabled={!canReplace}
              >
                {isReplacing
                  ? "Replacing catalog..."
                  : "Replace all catalog data"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
