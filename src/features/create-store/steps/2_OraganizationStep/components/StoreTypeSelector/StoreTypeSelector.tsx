import { useState } from "react";
import type { Ref } from "react";
import { LuCircleHelp } from "react-icons/lu";

import ComingSoonBadge from "../../../../../../components/coming-soon-badge/ComingSoonBadge";

import type { StoreType } from "../../../../context/CreateStoreContext.types";
import { STORE_TYPES } from "./storeTypeOptions";

import styles from "./StoreTypeSelector.module.scss";

interface StoreTypeSelectorProps {
  value: StoreType | "";
  error?: string;
  inputRef: Ref<HTMLInputElement>;
  onChange: (value: StoreType) => void;
}

export default function StoreTypeSelector({ value, error, inputRef, onChange }: StoreTypeSelectorProps) {
  const [openHelp, setOpenHelp] = useState<StoreType | null>(null);

  const describedBy = error ? "store-type-helper store-type-error" : "store-type-helper";

  return (
    <fieldset className={styles.field}>
      <legend>
        What are you creating?
        <span className={styles.required}>*</span>
      </legend>

      <div className={styles.options}>
        {STORE_TYPES.map((storeType, index) => {
          const isDisabled = Boolean(storeType.comingSoon);
          const helpId = `store-type-${storeType.value}-help`;
          const isHelpOpen = openHelp === storeType.value;

          return (
            <div key={storeType.value} className={styles.optionRow}>
              <label className={`${styles.option} ${isDisabled ? styles.disabledOption : ""}`}>
                <input
                  ref={index === 0 ? inputRef : undefined}
                  className={styles.radio}
                  type="radio"
                  name="storeType"
                  value={storeType.value}
                  checked={value === storeType.value}
                  disabled={isDisabled}
                  aria-describedby={describedBy}
                  onChange={() => onChange(storeType.value)}
                />

                <span className={styles.title}>
                  <strong>{storeType.title}</strong>

                  {storeType.comingSoon && <ComingSoonBadge />}
                </span>
              </label>

              {storeType.helpText && (
                <span className={styles.helpWrapper}>
                  <button
                    type="button"
                    className={styles.helpButton}
                    aria-label={`More information about ${storeType.title}`}
                    aria-describedby={helpId}
                    onClick={() => setOpenHelp((current) => (current === storeType.value ? null : storeType.value))}
                    onBlur={() => setOpenHelp(null)}
                  >
                    <LuCircleHelp aria-hidden="true" />
                  </button>

                  <span id={helpId} className={`${styles.tooltip} ${isHelpOpen ? styles.tooltipOpen : ""}`} role="tooltip">
                    {storeType.helpText}
                  </span>
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p id="store-type-error" className={styles.error} role="alert">
          {error}
        </p>
      )}

      <p id="store-type-helper" className={styles.helper}>
        This determines which products and ordering options are available in your store.
      </p>
    </fieldset>
  );
}
