import { LuTrash2, LuUpload } from "react-icons/lu";

import WizardLayout from "../../components/WizardLayout/WizardLayout";
import { useCreateStore } from "../../context/CreateStoreContext";

import formStyles from "../../../../styles/Forms.module.scss";
import styles from "./OrganizationStep.module.scss";
import useFileDataUrl from "../../hooks/useFileDataUrl";

const STORE_ACTIVITIES = [
  { value: "basketball", label: "Basketball" },
  { value: "baseball", label: "Baseball" },
  { value: "football", label: "Football" },
  { value: "soccer", label: "Soccer" },
  { value: "softball", label: "Softball" },
  { value: "volleyball", label: "Volleyball" },
  { value: "wrestling", label: "Wrestling" },
  { value: "spirit-wear", label: "Spirit Wear" },
  { value: "other", label: "Other" },
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OrganizationStep() {
  const { currentStep, setCurrentStep, storeDraft, updateStoreDraft } = useCreateStore();

  const logoPreviewUrl = useFileDataUrl(storeDraft.logoFile);

  function handleOrganizationNameChange(value: string) {
    updateStoreDraft({
      organizationName: value,
      organizationSlug: slugify(value),
    });
  }

  function handleStoreNameChange(value: string) {
    updateStoreDraft({
      storeName: value,
      storeSlug: slugify(value),
    });
  }

  function handleLogoChange(file: File | null) {
    updateStoreDraft({
      logoFile: file,
    });
  }

  const logoExtension = storeDraft.logoFile ? storeDraft.logoFile.name.split(".").pop()?.toUpperCase() : null;

  const logoSize = storeDraft.logoFile ? `${Math.round(storeDraft.logoFile.size / 1024)} KB` : null;

  const isNextDisabled = !storeDraft.organizationName.trim() || !storeDraft.activity || !storeDraft.storeName.trim();

  return (
    <WizardLayout
      step={currentStep}
      title="Tell us about your organization"
      description="This information will help us create your store and customize your experience."
      onBack={() => setCurrentStep(1)}
      onNext={() => setCurrentStep(3)}
      nextDisabled={isNextDisabled}
    >
      <div className={styles.form}>
        <div className={formStyles.field}>
          <label htmlFor="organizationName">
            Organization Name
            <span className={styles.required}>*</span>
          </label>

          <input
            id="organizationName"
            type="text"
            placeholder="e.g. Smallville High School"
            value={storeDraft.organizationName}
            onChange={(event) => handleOrganizationNameChange(event.target.value)}
          />

          <p className={styles.helper}>This is the name of your organization or club.</p>
        </div>

        <div className={formStyles.field}>
          <label htmlFor="activity">
            Store Activity
            <span className={styles.required}>*</span>
          </label>

          <select
            id="activity"
            value={storeDraft.activity}
            onChange={(event) =>
              updateStoreDraft({
                activity: event.target.value,
              })
            }
            required
          >
            <option value="" disabled>
              Select an activity
            </option>

            {STORE_ACTIVITIES.map((activity) => (
              <option key={activity.value} value={activity.value}>
                {activity.label}
              </option>
            ))}
          </select>

          <p className={styles.helper}>We’ll use this to show relevant uniforms and fanwear.</p>
        </div>

        <div className={formStyles.field}>
          <label htmlFor="storeName">
            Store Name
            <span className={styles.required}>*</span>
          </label>

          <input
            id="storeName"
            type="text"
            placeholder="e.g. 2026 Spring Store"
            value={storeDraft.storeName}
            onChange={(event) => handleStoreNameChange(event.target.value)}
          />

          <p className={styles.helper}>This is the name displayed on your storefront.</p>
        </div>

        <div className={formStyles.field}>
          <label>Store Address</label>

          <div className={styles.slug}>
            <strong>
              teamstore.com/store/
              {storeDraft.organizationSlug || "your-organization"}/{storeDraft.storeSlug || "your-store-name"}
            </strong>
          </div>

          <p className={styles.helper}>Your store address is generated automatically from the organization and store names.</p>
        </div>

        <div className={formStyles.field}>
          <label htmlFor="logo">Organization Logo</label>

          <input
            id="logo"
            type="file"
            accept=".png,.jpg,.jpeg,.svg"
            className={styles.fileInput}
            onChange={(event) => handleLogoChange(event.target.files?.[0] ?? null)}
          />

          {storeDraft.logoFile ? (
            <div className={`${styles.upload} ${styles.uploadWithLogo}`}>
              <div className={styles.logoPreviewRow}>
                <div className={styles.logoPreview}>
                  {logoPreviewUrl && <img src={logoPreviewUrl} alt={`${storeDraft.organizationName || "Organization"} logo preview`} />}
                </div>

                <div className={styles.logoDetails}>
                  <h3>{storeDraft.logoFile.name}</h3>
                  <p>
                    {logoExtension} • {logoSize}
                  </p>

                  <div className={styles.actions}>
                    <label htmlFor="logo" className={styles.replaceLogo}>
                      <LuUpload />
                      Replace Logo
                    </label>

                    <button type="button" className={styles.removeLogo} onClick={() => handleLogoChange(null)}>
                      <LuTrash2 />
                      Remove Logo
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <label htmlFor="logo" className={styles.upload}>
              <div className={styles.uploadIcon}>
                <LuUpload />
              </div>

              <h3>Upload your logo</h3>
              <p>PNG, JPG or SVG (max 5 MB)</p>
            </label>
          )}
        </div>

        <div className={formStyles.field}>
          <label htmlFor="description">
            Store Description
            <span className={styles.optional}>(Optional)</span>
          </label>

          <textarea
            id="description"
            rows={5}
            placeholder="Tell customers about your organization, season, or what makes your store unique."
            value={storeDraft.storeDescription}
            onChange={(event) =>
              updateStoreDraft({
                storeDescription: event.target.value,
              })
            }
          />

          <p className={styles.helper}>This description appears on your store homepage.</p>
        </div>
      </div>
    </WizardLayout>
  );
}
