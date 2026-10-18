import { useRef, useState } from "react";

import WizardLayout from "../../layouts/WizardLayout";
import { useCreateStore } from "../../context/CreateStoreContext";

import FormErrorSummary from "../../components/FormErrorSummary/FormErrorSummary";

import formStyles from "../../styles/form.module.scss";
import styles from "./OrganizationStep.module.scss";
import useFileDataUrl from "../../hooks/useFileDataUrl";
import type { StoreType } from "../../context/CreateStoreContext.types";
import OrganizationLogoUpload from "../../components/OrganizationLogoUpload/OrganizationLogoUpload";
import { isValidStoreType } from "../../components/StoreTypeSelector/storeTypeOptions";
import StoreTypeSelector from "../../components/StoreTypeSelector/StoreTypeSelector";
import { useStoreBuilderAdapter } from "../../context/StoreBuilderAdapterContext";
import { StoreAddressError } from "../../lib/storeAddressError";
import { getUpdatedAddressSlug, validateAddressSlug } from "./organizationStep.validation";

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

type StoreActivity = (typeof STORE_ACTIVITIES)[number]["value"];

function isStoreActivity(value: string): value is StoreActivity {
  return STORE_ACTIVITIES.some((activity) => activity.value === value);
}

const ALLOWED_LOGO_EXTENSIONS = ["png", "jpg", "jpeg", "svg"];
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

type ValidationErrors = {
  organizationName?: string;
  organizationSlug?: string;
  activity?: string;
  storeType?: string;
  storeName?: string;
  storeSlug?: string;
  logo?: string;
};

function validateOrganizationName(value: string): string | undefined {
  return value.trim() ? undefined : "Enter your organization name.";
}

function validateActivity(value: string): string | undefined {
  if (!value) {
    return "Select a store activity.";
  }

  return isStoreActivity(value) ? undefined : "Select a valid store activity.";
}

function validateStoreType(value: string): string | undefined {
  return isValidStoreType(value) ? undefined : "Select what type of store you want to create.";
}

function validateStoreName(value: string): string | undefined {
  return value.trim() ? undefined : "Enter your store name.";
}

function validateLogo(file: File | null): string | undefined {
  if (!file) {
    return undefined;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !ALLOWED_LOGO_EXTENSIONS.includes(extension)) {
    return "Upload a PNG, JPG, JPEG, or SVG file.";
  }

  if (file.size > MAX_LOGO_SIZE) {
    return "Logo must be 5 MB or smaller.";
  }

  return undefined;
}

interface OrganizationStepProps {
  onDraftIdChange: (draftId: string) => void;
}

export default function OrganizationStep({ onDraftIdChange }: OrganizationStepProps) {
  const { storeId, setStoreId, currentStep, setCurrentStep, storeDraft, updateStoreDraft, resetProductStep } = useCreateStore();
  const adapter = useStoreBuilderAdapter();
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);
  const [logoWasRemoved, setLogoWasRemoved] = useState(false);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [suggestedOrganizationSlug, setSuggestedOrganizationSlug] = useState<string | null>(null);
  const [isEditingLink, setIsEditingLink] = useState(false);

  const organizationNameRef = useRef<HTMLInputElement>(null);
  const organizationSlugRef = useRef<HTMLInputElement>(null);
  const activityRef = useRef<HTMLSelectElement>(null);
  const storeTypeRef = useRef<HTMLInputElement>(null);
  const storeNameRef = useRef<HTMLInputElement>(null);
  const storeSlugRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const logoPreviewUrl = useFileDataUrl(storeDraft.logoFile);

  function setFieldError(field: keyof ValidationErrors, error?: string) {
    setErrors((current) => ({
      ...current,
      [field]: error,
    }));
  }

  function handleOrganizationNameChange(value: string) {
    updateStoreDraft({
      organizationName: value,
      organizationSlug: getUpdatedAddressSlug(storeDraft.organizationSlug, storeDraft.organizationName, value),
    });
    setFieldError("organizationSlug");
    setSuggestedOrganizationSlug(null);

    if (errors.organizationName) {
      setFieldError("organizationName", validateOrganizationName(value));
    }
  }

  function handleActivityChange(value: string) {
    if (value === storeDraft.activity) {
      return;
    }

    const hasProductSelections = Object.keys(storeDraft.productSelections).length > 0;

    if (hasProductSelections) {
      const confirmed = window.confirm("Changing the activity will clear your current product selections. Continue?");

      if (!confirmed) {
        return;
      }
    }

    updateStoreDraft({
      activity: value,
    });

    resetProductStep();

    if (errors.activity) {
      setFieldError("activity", validateActivity(value));
    }
  }

  function handleStoreTypeChange(value: StoreType) {
    if (value === storeDraft.storeType) {
      return;
    }

    const hasProductSelections = Object.keys(storeDraft.productSelections).length > 0;

    if (hasProductSelections) {
      const confirmed = window.confirm("Changing the store type will clear your current product selections. Continue?");

      if (!confirmed) {
        return;
      }
    }

    updateStoreDraft({
      storeType: value,
    });

    resetProductStep();

    if (errors.storeType) {
      setFieldError("storeType", validateStoreType(value));
    }
  }

  function handleStoreNameChange(value: string) {
    updateStoreDraft({
      storeName: value,
      storeSlug: getUpdatedAddressSlug(storeDraft.storeSlug, storeDraft.storeName, value),
    });
    setFieldError("storeSlug");

    if (errors.storeName) {
      setFieldError("storeName", validateStoreName(value));
    }
  }

  function handleLogoChange(file: File | null): boolean {
    const logoError = validateLogo(file);

    setFieldError("logo", logoError);

    if (logoError) {
      return false;
    }

    setLogoWasRemoved(file === null);

    updateStoreDraft({
      logoFile: file,
    });

    return true;
  }

  function focusAndScrollToField(field: keyof ValidationErrors) {
    const fieldRefs = {
      organizationName: organizationNameRef,
      organizationSlug: organizationSlugRef,
      activity: activityRef,
      storeType: storeTypeRef,
      storeName: storeNameRef,
      storeSlug: storeSlugRef,
      logo: logoRef,
    };

    if (field === "organizationSlug" || field === "storeSlug") setIsEditingLink(true);

    requestAnimationFrame(() => {
      const element = fieldRefs[field].current;
      if (!element) return;
      element.focus({ preventScroll: true });
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function scrollToFirstError(nextErrors: ValidationErrors) {
    const fieldOrder: Array<keyof ValidationErrors> = [
      "organizationName",
      "activity",
      "storeType",
      "storeName",
      "organizationSlug",
      "storeSlug",
      "logo",
    ];
    const firstErrorField = fieldOrder.find((field) => nextErrors[field]);

    if (firstErrorField) {
      focusAndScrollToField(firstErrorField);
    }
  }

  async function uploadLogo(): Promise<typeof storeDraft.logoStorageId> {
    if (!storeDraft.logoFile) {
      return storeDraft.logoStorageId;
    }

    const storageId = await adapter.uploadFile(storeDraft.logoFile);

    updateStoreDraft({
      logoStorageId: storageId,
    });

    return storageId;
  }

  async function handleNext() {
    if (isSavingOrganization) {
      return;
    }

    const nextErrors: ValidationErrors = {
      organizationName: validateOrganizationName(storeDraft.organizationName),
      organizationSlug: validateAddressSlug(storeDraft.organizationSlug),
      activity: validateActivity(storeDraft.activity),
      storeType: validateStoreType(storeDraft.storeType),
      storeName: validateStoreName(storeDraft.storeName),
      storeSlug: validateAddressSlug(storeDraft.storeSlug),
      logo: validateLogo(storeDraft.logoFile),
    };

    setErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some(Boolean);

    if (hasErrors) {
      setShowErrorSummary(true);
      scrollToFirstError(nextErrors);
      return;
    }

    if (!isStoreActivity(storeDraft.activity) || !isValidStoreType(storeDraft.storeType)) {
      return;
    }

    setShowErrorSummary(false);
    setSuggestedOrganizationSlug(null);
    setIsSavingOrganization(true);

    try {
      const address = await adapter.checkStoreAddress({
        organizationSlug: storeDraft.organizationSlug,
        storeSlug: storeDraft.storeSlug,
        excludeStoreId: storeId ?? undefined,
      });
      if (!address.available) {
        setFieldError(address.field, address.message);
        setSuggestedOrganizationSlug(address.suggestedOrganizationSlug ?? null);
        setShowErrorSummary(true);
        focusAndScrollToField(address.field);
        return;
      }

      const logoStorageId = logoWasRemoved ? null : await uploadLogo();

      const result = await adapter.saveOrganizationStep({
        storeId: storeId ?? undefined,

        organizationName: storeDraft.organizationName,
        organizationSlug: storeDraft.organizationSlug,

        activity: storeDraft.activity,
        storeType: storeDraft.storeType,

        storeName: storeDraft.storeName,
        storeSlug: storeDraft.storeSlug,

        ...(logoStorageId
          ? {
              logoStorageId,
            }
          : {}),

        ...(logoWasRemoved
          ? {
              removeLogo: true,
            }
          : {}),
      });

      setStoreId(result.storeId);
      onDraftIdChange(result.storeId);
      setCurrentStep(2);
    } catch (error) {
      if (error instanceof StoreAddressError) {
        setFieldError(error.field, error.message);
        setSuggestedOrganizationSlug(error.suggestedOrganizationSlug ?? null);
        setShowErrorSummary(true);
        focusAndScrollToField(error.field);
        return;
      }
      const message = error instanceof Error ? error.message : "Could not save your organization.";

      window.alert(message);
    } finally {
      setIsSavingOrganization(false);
    }
  }

  const errorSummaryItems = [
    {
      field: "organizationName" as const,
      label: "Organization Name",
      message: errors.organizationName,
    },
    {
      field: "activity" as const,
      label: "Store Activity",
      message: errors.activity,
    },
    {
      field: "storeType" as const,
      label: "Store Type",
      message: errors.storeType,
    },
    {
      field: "storeName" as const,
      label: "Store Name",
      message: errors.storeName,
    },
    {
      field: "organizationSlug" as const,
      label: "Organization link",
      message: errors.organizationSlug,
    },
    {
      field: "storeSlug" as const,
      label: "Store link",
      message: errors.storeSlug,
    },
    {
      field: "logo" as const,
      label: "Organization Logo",
      message: errors.logo,
    },
  ];

  return (
    <WizardLayout
      step={currentStep}
      title="Tell us about your organization"
      description="Add your organization details, name your store, and choose what to sell."
      onNext={() => void handleNext()}
      nextLabel={isSavingOrganization ? "Saving..." : "Next"}
      nextDisabled={isSavingOrganization}
      hideBack
      width="wide"
    >
      <div className={styles.form}>
        {showErrorSummary && <FormErrorSummary errors={errorSummaryItems} onErrorClick={focusAndScrollToField} />}

        <div className={styles.detailsGrid}>
          <section className={styles.section} aria-labelledby="organization-details-title">
            <header className={styles.sectionHeader}>
              <h2 id="organization-details-title">Your organization</h2>
              <p>Your team, school, or club.</p>
            </header>
            <div className={formStyles.field}>
              <label htmlFor="organizationName">
                Organization Name
                <span className={styles.required}>*</span>
              </label>

              <input
                ref={organizationNameRef}
                id="organizationName"
                type="text"
                placeholder="e.g. Smallville High School"
                value={storeDraft.organizationName}
                className={errors.organizationName ? styles.invalidControl : undefined}
                aria-invalid={Boolean(errors.organizationName)}
                aria-describedby={errors.organizationName ? "organizationName-helper organizationName-error" : "organizationName-helper"}
                onChange={(event) => handleOrganizationNameChange(event.target.value)}
                onBlur={() => setFieldError("organizationName", validateOrganizationName(storeDraft.organizationName))}
              />

              {errors.organizationName && (
                <p id="organizationName-error" className={styles.errorMessage} role="alert">
                  {errors.organizationName}
                </p>
              )}

              <p id="organizationName-helper" className={styles.helper}>
                The name customers will recognize.
              </p>
            </div>

            <OrganizationLogoUpload
              organizationName={storeDraft.organizationName}
              logoFile={storeDraft.logoFile}
              logoPreviewUrl={logoPreviewUrl}
              error={errors.logo}
              inputRef={logoRef}
              onFileChange={handleLogoChange}
            />
          </section>

          <section className={styles.section} aria-labelledby="store-details-title">
            <header className={styles.sectionHeader}>
              <h2 id="store-details-title">Your store</h2>
              <p>Give this store a name and choose its focus.</p>
            </header>

            <div className={formStyles.field}>
              <label htmlFor="storeName">
                Store Name
                <span className={styles.required}>*</span>
              </label>

              <input
                ref={storeNameRef}
                id="storeName"
                type="text"
                placeholder="e.g. Fall 2026 Fanwear"
                value={storeDraft.storeName}
                className={errors.storeName ? styles.invalidControl : undefined}
                aria-invalid={Boolean(errors.storeName)}
                aria-describedby={errors.storeName ? "storeName-helper storeName-error" : "storeName-helper"}
                onChange={(event) => handleStoreNameChange(event.target.value)}
                onBlur={() => setFieldError("storeName", validateStoreName(storeDraft.storeName))}
              />

              {errors.storeName && (
                <p id="storeName-error" className={styles.errorMessage} role="alert">
                  {errors.storeName}
                </p>
              )}

              <p id="storeName-helper" className={styles.helper}>
                Shown on this store's homepage.
              </p>
            </div>

            <div className={formStyles.field}>
              <label htmlFor="activity">
                Store Activity
                <span className={styles.required}>*</span>
              </label>

              <select
                ref={activityRef}
                id="activity"
                value={storeDraft.activity}
                className={errors.activity ? styles.invalidControl : undefined}
                aria-invalid={Boolean(errors.activity)}
                aria-describedby={errors.activity ? "activity-helper activity-error" : "activity-helper"}
                onChange={(event) => handleActivityChange(event.target.value)}
                onBlur={() => setFieldError("activity", validateActivity(storeDraft.activity))}
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

              {errors.activity && (
                <p id="activity-error" className={styles.errorMessage} role="alert">
                  {errors.activity}
                </p>
              )}

              <p id="activity-helper" className={styles.helper}>
                Helps us suggest the right products for your store.
              </p>
            </div>

            <StoreTypeSelector
              value={storeDraft.storeType}
              error={errors.storeType}
              inputRef={storeTypeRef}
              onChange={handleStoreTypeChange}
            />
          </section>
        </div>

        <section className={styles.section} aria-labelledby="store-link-title">
          <header className={styles.linkHeader}>
            <div className={styles.sectionHeader}>
              <h2 id="store-link-title">Your store link</h2>
              <p>Customers will use this link to visit your store.</p>
            </div>
            <button
              type="button"
              className={styles.customizeButton}
              aria-expanded={isEditingLink}
              aria-controls="store-link-fields"
              onClick={() => setIsEditingLink((isEditing) => !isEditing)}
            >
              {isEditingLink ? "Hide customization" : "Customize link"}
            </button>
          </header>

          <output className={styles.linkPreview} aria-label="Full store link" aria-live="off">
            <span className={styles.linkDomain}>teamstore.com/store/</span>
            <span>
              {storeDraft.organizationSlug || "your-organization"}/{storeDraft.storeSlug || "your-store"}
            </span>
          </output>

          {isEditingLink && (
            <div id="store-link-fields" className={styles.linkFields}>
              <div className={formStyles.field}>
                <label htmlFor="organizationSlug">Organization link</label>
                <input
                  ref={organizationSlugRef}
                  id="organizationSlug"
                  type="text"
                  value={storeDraft.organizationSlug}
                  spellCheck={false}
                  autoCapitalize="none"
                  className={errors.organizationSlug ? styles.invalidControl : undefined}
                  aria-invalid={Boolean(errors.organizationSlug)}
                  aria-describedby={errors.organizationSlug ? "organizationSlug-helper organizationSlug-error" : "organizationSlug-helper"}
                  onChange={(event) => {
                    updateStoreDraft({ organizationSlug: event.target.value.toLowerCase() });
                    setFieldError("organizationSlug");
                    setSuggestedOrganizationSlug(null);
                  }}
                  onBlur={() => setFieldError("organizationSlug", validateAddressSlug(storeDraft.organizationSlug))}
                />
                <p id="organizationSlug-helper" className={styles.helper}>
                  The first part of your link. Choose a different one if your organization name is already in use.
                </p>
                {errors.organizationSlug && (
                  <p id="organizationSlug-error" className={styles.errorMessage} role="alert">
                    {errors.organizationSlug}
                  </p>
                )}
                {suggestedOrganizationSlug && (
                  <button
                    type="button"
                    className={styles.suggestionButton}
                    onClick={() => {
                      updateStoreDraft({ organizationSlug: suggestedOrganizationSlug });
                      setSuggestedOrganizationSlug(null);
                      setFieldError("organizationSlug");
                      focusAndScrollToField("organizationSlug");
                    }}
                  >
                    Use {suggestedOrganizationSlug}
                  </button>
                )}
              </div>

              <div className={formStyles.field}>
                <label htmlFor="storeSlug">Store link</label>
                <input
                  ref={storeSlugRef}
                  id="storeSlug"
                  type="text"
                  value={storeDraft.storeSlug}
                  spellCheck={false}
                  autoCapitalize="none"
                  className={errors.storeSlug ? styles.invalidControl : undefined}
                  aria-invalid={Boolean(errors.storeSlug)}
                  aria-describedby={errors.storeSlug ? "storeSlug-helper storeSlug-error" : "storeSlug-helper"}
                  onChange={(event) => {
                    updateStoreDraft({ storeSlug: event.target.value.toLowerCase() });
                    setFieldError("storeSlug");
                  }}
                  onBlur={() => setFieldError("storeSlug", validateAddressSlug(storeDraft.storeSlug))}
                />
                <p id="storeSlug-helper" className={styles.helper}>
                  The second part of your link. It must be unique within your organization.
                </p>
                {errors.storeSlug && (
                  <p id="storeSlug-error" className={styles.errorMessage} role="alert">
                    {errors.storeSlug}
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </WizardLayout>
  );
}
