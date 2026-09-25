import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { LuCheck, LuX } from "react-icons/lu";

import type { ProductColorOption } from "../../../../packages/store-builder/types/productStep";
import styles from "./ProductColorEditorModal.module.scss";

interface ProductColorEditorModalProps {
  productName: string;
  colorOptions: readonly ProductColorOption[];
  selectedColorKey: string;
  isSaving: boolean;
  onSelect: (colorKey: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function ProductColorEditorModal({
  productName,
  colorOptions,
  selectedColorKey,
  isSaving,
  onSelect,
  onSave,
  onClose,
}: ProductColorEditorModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSaving, onClose]);

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-color-editor-title"
      >
        <header className={styles.header}>
          <div>
            <h2 id="product-color-editor-title">Change Product Color</h2>
            <p>{productName}</p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className={styles.close}
            aria-label="Close color editor"
            disabled={isSaving}
            onClick={onClose}
          >
            <LuX aria-hidden="true" />
          </button>
        </header>

        <div className={styles.body}>
          <p className={styles.instructions}>
            Choose one of the catalog colors available for this product.
          </p>

          <div className={styles.colorGrid}>
            {colorOptions.map((color) => {
              const selected = color.colorKey === selectedColorKey;

              return (
                <button
                  key={color.colorKey}
                  type="button"
                  className={styles.colorOption}
                  data-selected={selected}
                  aria-pressed={selected}
                  disabled={isSaving}
                  onClick={() => onSelect(color.colorKey)}
                >
                  <span className={styles.thumbnail}>
                    <img src={color.imageUrl} alt="" />
                  </span>

                  <span className={styles.colorCopy}>
                    <strong>{color.color}</strong>
                    <span>{color.colorKey}</span>
                  </span>

                  {selected && (
                    <span className={styles.selectedIcon} aria-label="Selected">
                      <LuCheck aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.cancelButton} disabled={isSaving} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.saveButton} disabled={isSaving} onClick={onSave}>
            {isSaving ? "Saving..." : "Save Color"}
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
