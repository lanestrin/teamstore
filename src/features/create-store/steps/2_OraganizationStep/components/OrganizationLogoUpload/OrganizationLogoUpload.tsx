import type { Ref } from "react";
import { LuTrash2, LuUpload } from "react-icons/lu";

import formStyles from "../../../../styles/form.module.scss";
import styles from "./OrganizationLogoUpload.module.scss";

interface OrganizationLogoUploadProps {
  organizationName: string;
  logoFile: File | null;
  logoPreviewUrl: string | null;
  error?: string;
  inputRef: Ref<HTMLInputElement>;
  onFileChange: (file: File | null) => boolean;
}

function formatFileSize(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`;
}

export default function OrganizationLogoUpload({
  organizationName,
  logoFile,
  logoPreviewUrl,
  error,
  inputRef,
  onFileChange,
}: OrganizationLogoUploadProps) {
  const logoExtension = logoFile ? logoFile.name.split(".").pop()?.toUpperCase() : null;
  const logoSize = logoFile ? formatFileSize(logoFile.size) : null;

  return (
    <div className={formStyles.field}>
      <label htmlFor="logo">Organization Logo</label>

      <input
        ref={inputRef}
        id="logo"
        type="file"
        accept=".png,.jpg,.jpeg,.svg"
        className={styles.fileInput}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "logo-helper logo-error" : "logo-helper"}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0] ?? null;
          const accepted = onFileChange(file);

          if (!accepted) {
            event.currentTarget.value = "";
          }
        }}
      />

      {logoFile ? (
        <div className={`${styles.upload} ${styles.uploadWithLogo}`}>
          <div className={styles.logoPreviewRow}>
            <div className={styles.logoPreview}>
              {logoPreviewUrl && <img src={logoPreviewUrl} alt={`${organizationName || "Organization"} logo preview`} />}
            </div>

            <div className={styles.logoDetails}>
              <h3>{logoFile.name}</h3>

              <p>
                {logoExtension} • {logoSize}
              </p>

              <div className={styles.actions}>
                <label htmlFor="logo" className={styles.replaceLogo}>
                  <LuUpload aria-hidden="true" />
                  Replace Logo
                </label>

                <button
                  type="button"
                  className={styles.removeLogo}
                  onClick={() => {
                    onFileChange(null);
                  }}
                >
                  <LuTrash2 aria-hidden="true" />
                  Remove Logo
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <label htmlFor="logo" className={`${styles.upload} ${error ? styles.invalidUpload : ""}`}>
          <div className={styles.uploadIcon}>
            <LuUpload aria-hidden="true" />
          </div>

          <h3>Upload your logo</h3>
          <p>PNG, JPG or SVG (max 5 MB)</p>
        </label>
      )}

      {error && (
        <p id="logo-error" className={styles.errorMessage} role="alert">
          {error}
        </p>
      )}

      <span id="logo-helper" className={styles.visuallyHidden}>
        Accepted logo formats are PNG, JPG, JPEG, and SVG. Maximum file size is 5 MB.
      </span>
    </div>
  );
}
