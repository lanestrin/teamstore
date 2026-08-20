import { useRef, useState, type ChangeEvent } from "react";
import { LuUpload } from "react-icons/lu";

import styles from "./UploadedArtCard.module.scss";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ACCEPTED_FILE_TYPES = ["image/png", "image/jpeg", "image/svg+xml"] as const;

interface UploadedArtCardProps {
  onFilesAdded: (files: File[]) => void;
}

function isSupportedArtworkFile(file: File): boolean {
  if (ACCEPTED_FILE_TYPES.includes(file.type as (typeof ACCEPTED_FILE_TYPES)[number])) {
    return true;
  }

  return /\.(png|jpe?g|svg)$/i.test(file.name);
}

export default function UploadedArtCard({ onFilesAdded }: UploadedArtCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.currentTarget.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of selectedFiles) {
      if (!isSupportedArtworkFile(file)) {
        errors.push(`${file.name}: unsupported file type.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: file must be 5 MB or smaller.`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      onFilesAdded(validFiles);
    }

    setError(errors.length > 0 ? errors.join(" ") : null);

    event.currentTarget.value = "";
  }

  return (
    <div className={styles.uploadedArtCard}>
      <div className={styles.heading}>
        <div className={styles.icon}>
          <LuUpload aria-hidden="true" />
        </div>

        <div>
          <h3>Upload Art</h3>
          <p>Upload one or more finished artwork files to use on your products.</p>
        </div>
      </div>

      <button type="button" className={styles.uploadedButton} onClick={() => inputRef.current?.click()}>
        <LuUpload aria-hidden="true" />
        Choose Artwork
      </button>

      <input
        ref={inputRef}
        type="file"
        className={styles.fileInput}
        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
        multiple
        onChange={handleFileChange}
      />

      <p className={styles.fileHint}>PNG, JPG, or SVG · 5 MB max per file</p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
