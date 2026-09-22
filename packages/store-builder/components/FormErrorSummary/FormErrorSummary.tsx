import { useId } from "react";

import styles from "./FormErrorSummary.module.scss";

export interface FormErrorSummaryItem<TField extends string = string> {
  field: TField;
  label: string;
  message?: string;
}

interface FormErrorSummaryProps<TField extends string> {
  errors: FormErrorSummaryItem<TField>[];
  onErrorClick: (field: TField) => void;
}

export default function FormErrorSummary<TField extends string>({ errors, onErrorClick }: FormErrorSummaryProps<TField>) {
  const titleId = useId();
  const visibleErrors = errors.filter((error): error is FormErrorSummaryItem<TField> & { message: string } => Boolean(error.message));

  if (visibleErrors.length === 0) {
    return null;
  }

  return (
    <div className={styles.errorSummary} role="alert" aria-labelledby={titleId}>
      <h2 id={titleId}>{visibleErrors.length === 1 ? "1 field needs attention" : `${visibleErrors.length} fields need attention`}</h2>

      <ul>
        {visibleErrors.map((error) => (
          <li key={error.field}>
            <button type="button" onClick={() => onErrorClick(error.field)}>
              <span>{error.label}:</span> {error.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
