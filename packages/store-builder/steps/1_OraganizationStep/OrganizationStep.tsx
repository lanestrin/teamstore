import { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { useNavigate } from "react-router-dom";

import { api } from "../../../../convex/_generated/api";

import FormErrorSummary from "../../components/FormErrorSummary/FormErrorSummary";
import { STORE_ACTIVITIES, isStoreActivity } from "../../config/storeActivities";
import { useCreateStore } from "../../context/CreateStoreContext";
import type { StoreType } from "../../context/CreateStoreContext.types";
import useFileDataUrl from "../../hooks/useFileDataUrl";
import WizardLayout from "../../layouts/WizardLayout";

import OrganizationLogoUpload from "../../components/OrganizationLogoUpload/OrganizationLogoUpload";
import StoreTypeSelector from "../../components/StoreTypeSelector/StoreTypeSelector";
import { isValidStoreType } from "../../components/StoreTypeSelector/storeTypeOptions";
import {
  type OrganizationValidationErrors,
  slugify,
  validateActivity,
  validateLogo,
  validateOrganizationName,
  validateStoreName,
  validateStoreType,
} from "./organizationStep.validation";

import formStyles from "../../styles/form.module.scss";
import styles from "./OrganizationStep.module.scss";

const VALIDATION_FIELD_ORDER: Array<keyof OrganizationValidationErrors> = [
  "organizationName",
  "activity",
  "storeType",
  "storeName",
  "logo",
];

export default function OrganizationStep() {
  const { storeId, setStoreId, currentStep, setCurrentStep, storeDraft, updateStoreDraft, resetProductStep } = useCreateStore();
  const navigate = useNavigate();
  const generateUploadUrl = useMutation(api.storeUploads.generateUploadUrl);
  const saveOrganizationStep = useMutation(api.storeDrafts.saveOrganizationStep);
  const [errors, setErrors] = useState<OrganizationValidationErrors>({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);
  const [isSavingOrganization, setIsSavingOrganization] = useState(false);
  const [logoWasRemoved, setLogoWasRemoved] = useState(false);
  const organizationNameRef = useRef<HTMLInputElement>(null);
  const activityRef = useRef<HTMLSelectElement>(null);
  const storeTypeRef = useRef<HTMLInputElement>(null);
  const storeNameRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const localLogoPreviewUrl = useFileDataUrl(storeDraft.logoFile);
  const logoPreviewUrl = logoWasRemoved ? null : (localLogoPreviewUrl ?? storeDraft.logoUrl);

  function setFieldError(field: keyof OrganizationValidationErrors, error?: string) {
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

  function handleStoreNameChange(value: string) {
    updateStoreDraft({
      storeName: value,
      storeSlug: slugify(value),
    });

    if (errors.storeName) {
      setFieldError("storeName", validateStoreName(value));
    }
  }

  function handleActivityChange(value: string) {
    if (value === storeDraft.activity) {
      return;
    }

    if (!confirmProductStepReset("activity")) {
      return;
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

    if (!confirmProductStepReset("store type")) {
      return;
    }

    updateStoreDraft({
      storeType: value,
    });

    resetProductStep();

    if (errors.storeType) {
      setFieldError("storeType", validateStoreType(value));
    }
  }

  function confirmProductStepReset(fieldLabel: string): boolean {
    const hasProductSelections = Object.keys(storeDraft.productSelections).length > 0;

    if (!hasProductSelections) {
      return true;
    }

    return window.confirm(`Changing the ${fieldLabel} will clear your current product selections. Continue?`);
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

  function focusAndScrollToField(field: keyof OrganizationValidationErrors) {
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
      element.focus({
        preventScroll: true,
      });

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  function scrollToFirstError(nextErrors: OrganizationValidationErrors) {
    const firstErrorField = VALIDATION_FIELD_ORDER.find((field) => nextErrors[field]);

    if (firstErrorField) {
      focusAndScrollToField(firstErrorField);
    }
  }

  function validateStep(): OrganizationValidationErrors {
    return {
      organizationName: validateOrganizationName(storeDraft.organizationName),

      activity: validateActivity(storeDraft.activity),

      storeType: validateStoreType(storeDraft.storeType),

      storeName: validateStoreName(storeDraft.storeName),

      logo: validateLogo(storeDraft.logoFile),
    };
  }

  async function uploadLogo() {
    if (!storeDraft.logoFile) {
      return storeDraft.logoStorageId;
    }

    const uploadUrl = await generateUploadUrl();

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": storeDraft.logoFile.type || "application/octet-stream",
      },
      body: storeDraft.logoFile,
    });

    if (!response.ok) {
      throw new Error("Could not upload the organization logo.");
    }

    const result = (await response.json()) as {
      storageId: NonNullable<typeof storeDraft.logoStorageId>;
    };

    return result.storageId;
  }

  async function handleNext() {
    if (isSavingOrganization) {
      return;
    }

    const nextErrors = validateStep();

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
    setIsSavingOrganization(true);

    try {
      const logoStorageId = logoWasRemoved ? null : await uploadLogo();

      const result = await saveOrganizationStep({
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

      if (logoWasRemoved) {
        updateStoreDraft({
          logoFile: null,
          logoStorageId: null,
          logoUrl: null,
        });
      } else if (logoStorageId) {
        updateStoreDraft({
          logoStorageId,
        });
      }

      navigate(`/create-store?draftId=${result.storeId}`, {
        replace: true,
      });

      setCurrentStep(2);
    } catch (error) {
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
      onNext={() => void handleNext()}
      nextLabel={isSavingOrganization ? "Saving..." : "Next"}
      nextDisabled={isSavingOrganization}
      hideBack
      width="wide"
    >
      <div className={styles.form}>
        {showErrorSummary && <FormErrorSummary errors={errorSummaryItems} onErrorClick={focusAndScrollToField} />}

        <div className={styles.formGrid}>
          <div className={styles.formColumn}>
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

            <StoreTypeSelector
              value={storeDraft.storeType}
              error={errors.storeType}
              inputRef={storeTypeRef}
              onChange={handleStoreTypeChange}
            />
          </div>

          <div className={styles.formColumn}>
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
          </div>
        </div>
      </div>
    </WizardLayout>
  );
}
