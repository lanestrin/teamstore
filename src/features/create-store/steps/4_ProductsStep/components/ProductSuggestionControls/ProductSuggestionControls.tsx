import { LuRefreshCw } from "react-icons/lu";
import type { ProductColorFamily } from "../../../../../../types/productColor.types";
import { PRODUCT_COLOR_OPTIONS } from "../../lib/productColorOptions";
import styles from "./ProductSuggestionControls.module.scss";

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

interface ProductSuggestionControlsProps {
  activity: string;
  primaryColorFamily: ProductColorFamily | "";
  secondaryColorFamily: ProductColorFamily | "";
  selectedCount: number;
  suggestionCount: number;
  availableProductColorFamilies: ReadonlySet<string>;
  isLoading: boolean;
  canRegenerate: boolean;
  onActivityChange: (activity: StoreActivity) => void;
  onPrimaryColorChange: (colorFamily: ProductColorFamily) => void;
  onSecondaryColorChange: (colorFamily: ProductColorFamily | "") => void;
  onRegenerate: () => void;
}

function getActivityLabel(activity: string): string {
  return activity
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function isStoreActivity(value: string): value is StoreActivity {
  return STORE_ACTIVITIES.some((activity) => activity === value);
}

export default function ProductSuggestionControls({
  activity,
  primaryColorFamily,
  secondaryColorFamily,
  selectedCount,
  suggestionCount,
  availableProductColorFamilies,
  isLoading,
  canRegenerate,
  onActivityChange,
  onPrimaryColorChange,
  onSecondaryColorChange,
  onRegenerate,
}: ProductSuggestionControlsProps) {
  return (
    <div className={styles.selectionSummary}>
      <div className={styles.selectionSummaryText}>
        <strong>{selectedCount} selected</strong>

        <span>Showing {suggestionCount} suggestions. Selected products are kept when you regenerate.</span>
      </div>

      <div className={styles.summaryActions}>
        <label className={styles.summaryControl}>
          <span className={styles.summaryControlLabel}>Primary Color</span>

          <select
            value={primaryColorFamily}
            className={styles.summarySelect}
            onChange={(event) => {
              onPrimaryColorChange(event.currentTarget.value as ProductColorFamily);
            }}
          >
            {!primaryColorFamily && (
              <option value="" disabled>
                Choose color
              </option>
            )}

            {PRODUCT_COLOR_OPTIONS.map((option) => {
              const isAvailable = availableProductColorFamilies.has(option.value);

              return (
                <option key={option.value} value={option.value} disabled={!isLoading && !isAvailable}>
                  {isAvailable ? option.label : `${option.label} — Unavailable`}
                </option>
              );
            })}
          </select>
        </label>

        <label className={styles.summaryControl}>
          <span className={styles.summaryControlLabel}>Secondary Color</span>

          <select
            value={secondaryColorFamily}
            className={styles.summarySelect}
            onChange={(event) => {
              onSecondaryColorChange(event.currentTarget.value as ProductColorFamily | "");
            }}
          >
            <option value="">All</option>

            {PRODUCT_COLOR_OPTIONS.map((option) => {
              const isAvailable = availableProductColorFamilies.has(option.value);

              return (
                <option key={option.value} value={option.value} disabled={!isLoading && !isAvailable}>
                  {isAvailable ? option.label : `${option.label} — Unavailable`}
                </option>
              );
            })}
          </select>
        </label>

        <label className={styles.summaryControl}>
          <span className={styles.summaryControlLabel}>Activity</span>

          <select
            value={activity}
            className={styles.summarySelect}
            onChange={(event) => {
              const nextActivity = event.currentTarget.value;

              if (isStoreActivity(nextActivity)) {
                onActivityChange(nextActivity);
              }
            }}
          >
            {STORE_ACTIVITIES.map((activityOption) => (
              <option key={activityOption} value={activityOption}>
                {getActivityLabel(activityOption)}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className={styles.regenerateButton} disabled={isLoading || !canRegenerate} onClick={onRegenerate}>
          <LuRefreshCw aria-hidden="true" />
          Regenerate Suggestions
        </button>
      </div>
    </div>
  );
}
