import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { LuArrowDown, LuArrowLeft, LuArrowRight, LuArrowUp, LuMinus, LuPlus, LuRotateCcw, LuX } from "react-icons/lu";

import { createDefaultProductArtworkPlacement, getDecorationProfile, type ProductArtworkPlacement } from "../../lib/decorationProfiles";
import type { GeneratedSuggestion, ProductColorOption } from "../../lib/productStep.types";
import GarmentArtworkPreview from "../GarmentArtworkPreview/GarmentArtworkPreview";

import styles from "./ProductEditorModal.module.scss";

const MOVE_STEP = 0.02;
const RESIZE_STEP = 0.05;
const MIN_ARTWORK_WIDTH = 0.2;
const MAX_ARTWORK_WIDTH = 1;

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

interface ProductEditorModalProps {
  suggestion: GeneratedSuggestion;
  color: ProductColorOption;
  artworkSvg: string | null;
  placement: ProductArtworkPlacement;
  onPlacementChange: (placement: ProductArtworkPlacement) => void;
  onSave: () => void;
  onClose: () => void;
}

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startPlacement: ProductArtworkPlacement;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function constrainPlacement(placement: ProductArtworkPlacement): ProductArtworkPlacement {
  const width = clamp(placement.width, MIN_ARTWORK_WIDTH, MAX_ARTWORK_WIDTH);

  const halfWidth = width / 2;

  return {
    x: clamp(placement.x, halfWidth, 1 - halfWidth),
    y: clamp(placement.y, 0.05, 0.95),
    width,
  };
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.tabIndex >= 0 && element.getAttribute("aria-hidden") !== "true",
  );
}

export default function ProductEditorModal({
  suggestion,
  color,
  artworkSvg,
  placement,
  onPlacementChange,
  onSave,
  onClose,
}: ProductEditorModalProps) {
  const modalRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dragStateRef = useRef<DragState | null>(null);

  const [isDragging, setIsDragging] = useState(false);

  const productName = suggestion.product.name ?? suggestion.productId;

  const decorationProfile = getDecorationProfile(suggestion.decorationProfileId);

  const previewBounds = color.decorationPreviewBounds ?? decorationProfile.previewBounds;

  const defaultPlacement = createDefaultProductArtworkPlacement(suggestion.decorationProfileId);

  const canEditArtwork = Boolean(artworkSvg);

  /*
   * Lock the page while the modal is open, focus the modal,
   * and return focus to the Edit Product button afterward.
   */
  useEffect(() => {
    const previouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const animationFrame = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(animationFrame);

      document.body.style.overflow = previousOverflow;

      requestAnimationFrame(() => {
        if (previouslyFocusedElement && previouslyFocusedElement.isConnected) {
          previouslyFocusedElement.focus();
        }
      });
    };
  }, []);

  /*
   * Keep keyboard focus inside the dialog and allow Escape
   * to close it.
   */
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(modalRef.current);

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstElement || !modalRef.current.contains(activeElement)) {
          event.preventDefault();
          lastElement.focus();
        }

        return;
      }

      if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function updatePlacement(updates: Partial<ProductArtworkPlacement>) {
    onPlacementChange(
      constrainPlacement({
        ...placement,
        ...updates,
      }),
    );
  }

  function moveArtwork(deltaX: number, deltaY: number) {
    updatePlacement({
      x: placement.x + deltaX,
      y: placement.y + deltaY,
    });
  }

  function resizeArtwork(deltaWidth: number) {
    updatePlacement({
      width: placement.width + deltaWidth,
    });
  }

  function resetPlacement() {
    onPlacementChange({
      ...defaultPlacement,
    });
  }

  function handlePreviewPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canEditArtwork || event.button !== 0) {
      return;
    }

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    /*
     * Only start a drag when interacting with the garment
     * preview rather than the help text beneath it.
     */
    if (!target.closest("[data-garment-artwork-preview]")) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startPlacement: { ...placement },
    };

    setIsDragging(true);

    event.currentTarget.setPointerCapture(event.pointerId);

    event.preventDefault();
  }

  function handlePreviewPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const previewElement = previewRef.current?.querySelector("[data-garment-artwork-preview]");

    if (!(previewElement instanceof HTMLElement)) {
      return;
    }

    const previewRect = previewElement.getBoundingClientRect();

    const decorationZoneWidth = previewRect.width * previewBounds.width;

    const decorationZoneHeight = previewRect.height * previewBounds.height;

    if (decorationZoneWidth <= 0 || decorationZoneHeight <= 0) {
      return;
    }

    const deltaX = (event.clientX - dragState.startClientX) / decorationZoneWidth;

    const deltaY = (event.clientY - dragState.startClientY) / decorationZoneHeight;

    onPlacementChange(
      constrainPlacement({
        ...dragState.startPlacement,
        x: dragState.startPlacement.x + deltaX,
        y: dragState.startPlacement.y + deltaY,
      }),
    );
  }

  function finishDragging(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStateRef.current?.pointerId !== event.pointerId) {
      return;
    }

    dragStateRef.current = null;
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function cancelDragging() {
    dragStateRef.current = null;
    setIsDragging(false);
  }

  const sizePercent = Math.round(placement.width * 100);

  return createPortal(
    <div
      className={styles.overlay}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-editor-title"
        aria-describedby="product-editor-description"
      >
        <header className={styles.header}>
          <div>
            <h2 id="product-editor-title">Edit Product</h2>

            <p>{productName}</p>
          </div>

          <button ref={closeButtonRef} type="button" className={styles.close} aria-label="Close product editor" onClick={onClose}>
            <LuX aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <div
            ref={previewRef}
            className={styles.preview}
            data-dragging={isDragging}
            role="group"
            aria-label="Product artwork preview"
            onPointerDown={handlePreviewPointerDown}
            onPointerMove={handlePreviewPointerMove}
            onPointerUp={finishDragging}
            onPointerCancel={finishDragging}
            onLostPointerCapture={cancelDragging}
          >
            <GarmentArtworkPreview
              garmentImageUrl={color.imageUrl}
              garmentName={productName}
              artworkSvg={artworkSvg ?? undefined}
              surfaceHex={color.primaryHexValue}
              surfaceTone={color.tone}
              decorationProfileId={suggestion.decorationProfileId}
              decorationPreviewBounds={color.decorationPreviewBounds}
              placement={placement}
              showDecorationZone={canEditArtwork}
            />

            {canEditArtwork ? (
              <p className={styles.previewHint}>Drag the artwork directly on the garment to reposition it.</p>
            ) : (
              <p className={styles.previewHint}>No artwork is currently applied to this product.</p>
            )}
          </div>

          <aside className={styles.sidebar} aria-label="Artwork placement controls">
            <div className={styles.sidebarHeading}>
              <h3>Artwork Placement</h3>

              <p id="product-editor-description">Move and resize the artwork for this garment only.</p>
            </div>

            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Position</span>

              <div className={styles.movement} role="group" aria-label="Move artwork">
                <button
                  type="button"
                  className={`${styles.moveButton} ${styles.moveUp}`}
                  aria-label="Move artwork up"
                  disabled={!canEditArtwork}
                  onClick={() => moveArtwork(0, -MOVE_STEP)}
                >
                  <LuArrowUp aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className={`${styles.moveButton} ${styles.moveLeft}`}
                  aria-label="Move artwork left"
                  disabled={!canEditArtwork}
                  onClick={() => moveArtwork(-MOVE_STEP, 0)}
                >
                  <LuArrowLeft aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className={`${styles.moveButton} ${styles.resetPosition}`}
                  aria-label="Reset artwork placement"
                  disabled={!canEditArtwork}
                  onClick={resetPlacement}
                >
                  <LuRotateCcw aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className={`${styles.moveButton} ${styles.moveRight}`}
                  aria-label="Move artwork right"
                  disabled={!canEditArtwork}
                  onClick={() => moveArtwork(MOVE_STEP, 0)}
                >
                  <LuArrowRight aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className={`${styles.moveButton} ${styles.moveDown}`}
                  aria-label="Move artwork down"
                  disabled={!canEditArtwork}
                  onClick={() => moveArtwork(0, MOVE_STEP)}
                >
                  <LuArrowDown aria-hidden="true" />
                </button>
              </div>

              <p className={styles.positionValue}>
                X: {Math.round(placement.x * 100)} · Y: {Math.round(placement.y * 100)}
              </p>
            </div>

            <div className={styles.controlGroup}>
              <div className={styles.sizeHeading}>
                <span className={styles.controlLabel}>Size</span>

                <strong>{sizePercent}%</strong>
              </div>

              <div className={styles.sizeControls}>
                <button
                  type="button"
                  className={styles.sizeButton}
                  aria-label="Make artwork smaller"
                  disabled={!canEditArtwork || placement.width <= MIN_ARTWORK_WIDTH}
                  onClick={() => resizeArtwork(-RESIZE_STEP)}
                >
                  <LuMinus aria-hidden="true" />
                </button>

                <input
                  type="range"
                  min={MIN_ARTWORK_WIDTH}
                  max={MAX_ARTWORK_WIDTH}
                  step={0.01}
                  value={placement.width}
                  aria-label="Artwork size"
                  disabled={!canEditArtwork}
                  onChange={(event) =>
                    updatePlacement({
                      width: Number(event.currentTarget.value),
                    })
                  }
                />

                <button
                  type="button"
                  className={styles.sizeButton}
                  aria-label="Make artwork larger"
                  disabled={!canEditArtwork || placement.width >= MAX_ARTWORK_WIDTH}
                  onClick={() => resizeArtwork(RESIZE_STEP)}
                >
                  <LuPlus aria-hidden="true" />
                </button>
              </div>
            </div>

            <button type="button" className={styles.resetAllButton} disabled={!canEditArtwork} onClick={resetPlacement}>
              <LuRotateCcw aria-hidden="true" />
              Reset Placement
            </button>
          </aside>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>

          <button type="button" className={styles.saveButton} onClick={onSave}>
            Save Changes
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
