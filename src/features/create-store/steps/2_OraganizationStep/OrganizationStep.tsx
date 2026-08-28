import { useRef, useState } from "react";

import WizardLayout from "../../components/WizardLayout/WizardLayout";
import { useCreateStore, type StoreType } from "../../context/CreateStoreContext";

import FormErrorSummary from "../../components/FormErrorSummary/FormErrorSummary";
import OrganizationLogoUpload from "./components/OrganizationLogoUpload/OrganizationLogoUpload";
import StoreTypeSelector from "./components/StoreTypeSelector/StoreTypeSelector";
import { isValidStoreType } from "./components/StoreTypeSelector/storeTypeOptions";

import formStyles from "../../styles/form.module.scss";
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

const ALLOWED_LOGO_EXTENSIONS = ["png", "jpg", "jpeg", "svg"];
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

type ValidationErrors = {
  organizationName?: string;
  activity?: string;
  storeType?: string;
  storeName?: string;
  logo?: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validateOrganizationName(value: string): string | undefined {
  return value.trim() ? undefined : "Enter your organization name.";
}

function validateActivity(value: string): string | undefined {
  if (!value) {
    return "Select a store activity.";
  }

  const isValidActivity = STORE_ACTIVITIES.some((activity) => activity.value === value);

  return isValidActivity ? undefined : "Select a valid store activity.";
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

export default function OrganizationStep() {
  const { currentStep, setCurrentStep, storeDraft, updateStoreDraft, resetProductStep } = useCreateStore();

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);

  const organizationNameRef = useRef<HTMLInputElement>(null);
  const activityRef = useRef<HTMLSelectElement>(null);
  const storeTypeRef = useRef<HTMLInputElement>(null);
  const storeNameRef = useRef<HTMLInputElement>(null);
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
      organizationSlug: slugify(value),
    });

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
      storeSlug: slugify(value),
    });

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

    updateStoreDraft({
      logoFile: file,
    });

    return true;
  }

  function focusAndScrollToField(field: keyof ValidationErrors) {
    const fieldRefs = {
      organizationName: organizationNameRef,
      activity: activityRef,
      storeType: storeTypeRef,
      storeName: storeNameRef,
      logo: logoRef,
    };

    const element = fieldRefs[field].current;

    if (!element) {
      return;
    }

    requestAnimationFrame(() => {
      element.focus({ preventScroll: true });
      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function scrollToFirstError(nextErrors: ValidationErrors) {
    const fieldOrder: Array<keyof ValidationErrors> = ["organizationName", "activity", "storeType", "storeName", "logo"];
    const firstErrorField = fieldOrder.find((field) => nextErrors[field]);

    if (firstErrorField) {
      focusAndScrollToField(firstErrorField);
    }
  }

  function handleNext() {
    const nextErrors: ValidationErrors = {
      organizationName: validateOrganizationName(storeDraft.organizationName),
      activity: validateActivity(storeDraft.activity),
      storeType: validateStoreType(storeDraft.storeType),
      storeName: validateStoreName(storeDraft.storeName),
      logo: validateLogo(storeDraft.logoFile),
    };

    setErrors(nextErrors);

    const hasErrors = Object.values(nextErrors).some(Boolean);

    if (hasErrors) {
      setShowErrorSummary(true);
      scrollToFirstError(nextErrors);
      return;
    }

    setShowErrorSummary(false);
    setCurrentStep(2);
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
      field: "logo" as const,
      label: "Organization Logo",
      message: errors.logo,
    },
  ];

  return (
    <WizardLayout
      step={currentStep}
      title="Tell us about your organization"
      description="This information will help us create your store and customize your experience."
      onNext={handleNext}
      hideBack
    >
      <div className={styles.form}>
        {showErrorSummary && <FormErrorSummary errors={errorSummaryItems} onErrorClick={focusAndScrollToField} />}

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
            This is the name of your organization or club.
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
            We’ll use this to show relevant uniforms and fanwear.
          </p>
        </div>

        <StoreTypeSelector value={storeDraft.storeType} error={errors.storeType} inputRef={storeTypeRef} onChange={handleStoreTypeChange} />

        <div className={formStyles.field}>
          <label htmlFor="storeName">
            Store Name
            <span className={styles.required}>*</span>
          </label>

          <input
            ref={storeNameRef}
            id="storeName"
            type="text"
            placeholder="e.g. 2026 Spring Store"
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
            This is the name displayed on your storefront.
          </p>
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

        <OrganizationLogoUpload
          organizationName={storeDraft.organizationName}
          logoFile={storeDraft.logoFile}
          logoPreviewUrl={logoPreviewUrl}
          error={errors.logo}
          inputRef={logoRef}
          onFileChange={handleLogoChange}
        />

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
