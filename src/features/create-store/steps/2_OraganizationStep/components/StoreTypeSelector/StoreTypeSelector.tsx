import type { Ref } from "react";
import { LuCircleHelp } from "react-icons/lu";
import type { StoreType } from "../../../../context/CreateStoreContext";
import styles from "./StoreTypeSelector.module.scss";
import { STORE_TYPES } from "./storeTypeOptions";

interface StoreTypeSelectorProps {
  value: StoreType | "";
  error?: string;
  inputRef: Ref<HTMLInputElement>;
  onChange: (value: StoreType) => void;
}

export default function StoreTypeSelector({ value, error, inputRef, onChange }: StoreTypeSelectorProps) {
  return (
    <fieldset className={styles.field}>
      <legend>
        What are you creating?
        <span className={styles.required}>*</span>
      </legend>

      <div className={styles.options}>
        {STORE_TYPES.map((storeType, index) => (
          <label key={storeType.value} className={styles.option}>
            <input
              ref={index === 0 ? inputRef : undefined}
              className={styles.radio}
              type="radio"
              name="storeType"
              value={storeType.value}
              checked={value === storeType.value}
              onChange={() => onChange(storeType.value)}
            />

            <span className={styles.title}>
              <strong>{storeType.title}</strong>

              {storeType.helpText && (
                <span className={styles.help} tabIndex={0} aria-label={storeType.helpText}>
                  <LuCircleHelp aria-hidden="true" />

                  <span className={styles.tooltip} role="tooltip">
                    {storeType.helpText}
                  </span>
                </span>
              )}
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <p className={styles.helper}>This determines which products and ordering options are available in your store.</p>
    </fieldset>
  );
}
