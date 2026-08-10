import { LuCheck, LuX } from "react-icons/lu";

import styles from "../ProductsStep.module.scss";
import type { GeneratedSuggestion } from "../productStep.types";

interface ProductEditorModalProps {
  suggestion: GeneratedSuggestion;
  colorKey: string;
  onColorChange: (colorKey: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function ProductEditorModal({
  suggestion,
  colorKey,
  onColorChange,
  onSave,
  onClose,
}: ProductEditorModalProps) {
  const selectedColor =
    suggestion.product.colorOptions.find(
      (color) => color.colorKey === colorKey,
    ) ?? suggestion.color;

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className={styles.productEditorModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-editor-title"
      >
        <div className={styles.modalHeader}>
          <div>
            <h2 id="product-editor-title">Edit Product</h2>

            <p>{suggestion.product.name}</p>
          </div>

          <button
            type="button"
            className={styles.modalCloseButton}
            aria-label="Close product editor"
            onClick={onClose}
          >
            <LuX aria-hidden="true" />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalProductPreview}>
            <img
              src={selectedColor.imageUrl}
              alt={`${suggestion.product.name} in ${selectedColor.color}`}
            />
          </div>

          <div className={styles.colorEditor}>
            <div className={styles.colorEditorHeading}>
              <h3>Product Color</h3>

              <p>Choose any available supplier color for this product.</p>
            </div>

            <div className={styles.colorGrid}>
              {suggestion.product.colorOptions.map((color) => {
                const isActive = color.colorKey === colorKey;

                return (
                  <button
                    key={color.colorKey}
                    type="button"
                    className={[
                      styles.colorOption,

                      isActive ? styles.colorOptionSelected : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-pressed={isActive}
                    onClick={() => onColorChange(color.colorKey)}
                  >
                    <img src={color.imageUrl} alt="" aria-hidden="true" />

                    <span>{color.color}</span>

                    {isActive && <LuCheck aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.modalCancelButton}
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className={styles.modalSaveButton}
            onClick={onSave}
          >
            Save Product
          </button>
        </div>
      </section>
    </div>
  );
}
