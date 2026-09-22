import { isStoreActivity } from "../../config/storeActivities";
import { isValidStoreType } from "../../components/StoreTypeSelector/storeTypeOptions";

const ALLOWED_LOGO_EXTENSIONS = ["png", "jpg", "jpeg", "svg"] as const;

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;

export interface OrganizationValidationErrors {
  organizationName?: string;
  activity?: string;
  storeType?: string;
  storeName?: string;
  logo?: string;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateOrganizationName(value: string): string | undefined {
  return value.trim() ? undefined : "Enter your organization name.";
}

export function validateActivity(value: string): string | undefined {
  if (!value) {
    return "Select a store activity.";
  }

  return isStoreActivity(value) ? undefined : "Select a valid store activity.";
}

export function validateStoreType(value: string): string | undefined {
  return isValidStoreType(value) ? undefined : "Select what type of store you want to create.";
}

export function validateStoreName(value: string): string | undefined {
  return value.trim() ? undefined : "Enter your store name.";
}

export function validateLogo(file: File | null): string | undefined {
  if (!file) {
    return undefined;
  }

  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !ALLOWED_LOGO_EXTENSIONS.includes(extension as (typeof ALLOWED_LOGO_EXTENSIONS)[number])) {
    return "Upload a PNG, JPG, JPEG, or SVG file.";
  }

  if (file.size > MAX_LOGO_SIZE_BYTES) {
    return "Logo must be 5 MB or smaller.";
  }

  return undefined;
}
