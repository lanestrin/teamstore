import { LuRefreshCw } from "react-icons/lu";

import type { ProductColorFamily } from "../../../context/CreateStoreContext";

import {
  PRODUCT_COLLECTIONS,
  type ProductCollectionActivity,
} from "../productCollections";

import { PRODUCT_COLOR_OPTIONS } from "./productColorOptions";

import styles from "../ProductsStep.module.scss";

interface ProductSuggestionControlsProps {
  activity: string;
  productColorFamily: ProductColorFamily | "";
  selectedCount: number;
  suggestionCount: number;
  availableProductColorFamilies: ReadonlySet<string>;
  isLoading: boolean;
  canRegenerate: boolean;
  onActivityChange: (activity: ProductCollectionActivity) => void;
  onProductColorChange: (colorFamily: ProductColorFamily) => void;
  onRegenerate: () => void;
}

function getActivityLabel(activity: string): string {
  return activity
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ProductSuggestionControls({
  activity,
  productColorFamily,
  selectedCount,
  suggestionCount,
  availableProductColorFamilies,
  isLoading,
  canRegenerate,
  onActivityChange,
  onProductColorChange,
  onRegenerate,
}: ProductSuggestionControlsProps) {
  return (
    <div className={styles.selectionSummary}>
      <div className={styles.selectionSummaryText}>
        <strong>{selectedCount} selected</strong>

        <span>
          Showing {suggestionCount} suggestions. Selected products are kept when
          you regenerate.
        </span>
      </div>

      <div className={styles.summaryActions}>
        <label className={styles.summaryControl}>
          <span className={styles.summaryControlLabel}>Activity</span>

          <select
            value={activity}
            className={styles.summarySelect}
            onChange={(event) => {
              const nextActivity = event.currentTarget
                .value as ProductCollectionActivity;

              onActivityChange(nextActivity);
            }}
          >
            {(
              Object.keys(PRODUCT_COLLECTIONS) as ProductCollectionActivity[]
            ).map((activityOption) => (
              <option key={activityOption} value={activityOption}>
                {getActivityLabel(activityOption)}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.summaryControl}>
          <span className={styles.summaryControlLabel}>Product Color</span>

          <select
            value={productColorFamily}
            className={styles.summarySelect}
            onChange={(event) => {
              const nextColor = event.currentTarget.value as ProductColorFamily;

              onProductColorChange(nextColor);
            }}
          >
            {!productColorFamily && (
              <option value="" disabled>
                Choose color
              </option>
            )}

            {PRODUCT_COLOR_OPTIONS.map((option) => {
              const isAvailable = availableProductColorFamilies.has(
                option.value,
              );

              return (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={!isLoading && !isAvailable}
                >
                  {isAvailable ? option.label : `${option.label} — Unavailable`}
                </option>
              );
            })}
          </select>
        </label>

        <button
          type="button"
          className={styles.regenerateButton}
          disabled={isLoading || !canRegenerate}
          onClick={onRegenerate}
        >
          <LuRefreshCw aria-hidden="true" />
          Regenerate Suggestions
        </button>
      </div>
    </div>
  );
}
