import { LuFileImage, LuTrash2, LuUpload } from "react-icons/lu";

import styles from "./UploadedArtworkCard.module.scss";

interface UploadedArtworkCardProps {
  fileName: string;
  previewUrl?: string;
  isSelected: boolean;
  onSelectionChange: (checked: boolean) => void;
  onRemove: () => void;
}

export default function UploadedArtworkCard({ fileName, previewUrl, isSelected, onSelectionChange, onRemove }: UploadedArtworkCardProps) {
  return (
    <article className={styles.card} data-selected={isSelected}>
      <div className={styles.cardHeader}>
        <h3 title={fileName}>{fileName}</h3>

        <span className={styles.uploadedBadge}>
          <LuUpload aria-hidden="true" />
          Uploaded
        </span>
      </div>

      <div className={styles.preview}>
        {previewUrl ? <img src={previewUrl} alt={`Preview of ${fileName}`} /> : <LuFileImage aria-hidden="true" />}
      </div>

      <div className={styles.actions}>
        <label className={styles.checkbox}>
          <input type="checkbox" checked={isSelected} onChange={(event) => onSelectionChange(event.currentTarget.checked)} />

          <span>Use this artwork</span>
        </label>

        <button type="button" className={styles.removeButton} aria-label={`Remove ${fileName}`} onClick={onRemove}>
          <LuTrash2 aria-hidden="true" />
          Remove
        </button>
      </div>
    </article>
  );
}
