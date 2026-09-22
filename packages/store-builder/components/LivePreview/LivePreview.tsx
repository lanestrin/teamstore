import { useCreateStore } from "../../context/CreateStoreContext";
import useFileDataUrl from "../../hooks/useFileDataUrl";

import StorefrontPreview from "../StorefrontPreview/StorefrontPreview";

import styles from "./LivePreview.module.scss";

export default function LivePreview() {
  const { primaryColor, secondaryColor, storeDraft } = useCreateStore();

  const organizationName = storeDraft.organizationName || "Your Organization";

  const organizationSlug = storeDraft.organizationSlug || "your-organization";

  const storeName = storeDraft.storeName || "Your Team Store";

  const storeDescription = storeDraft.storeDescription || "Show your pride. Represent your team.";

  const storeSlug = storeDraft.storeSlug || "your-store-name";

  const logoUrl = useFileDataUrl(storeDraft.logoFile);

  return (
    <aside className={styles.preview}>
      <div className={styles.header}>
        <span className={styles.badge}>Live Preview</span>

        <div className={styles.titleRow}>
          <h2>{storeName}</h2>

          <div className={styles.colorPalette} aria-label="Selected team colors">
            <span
              className={styles.primaryColor}
              style={{
                backgroundColor: primaryColor,
              }}
            />

            <span
              className={styles.secondaryColor}
              style={{
                backgroundColor: secondaryColor,
              }}
            />
          </div>
        </div>

        <p>
          teamstore.com/store/{organizationSlug}/{storeSlug}
        </p>
      </div>

      <StorefrontPreview
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        organizationName={organizationName}
        storeName={storeName}
        storeDescription={storeDescription}
        logoUrl={logoUrl}
      />
    </aside>
  );
}
