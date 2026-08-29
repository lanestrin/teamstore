import { ConvexError } from "convex/values";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  return normalizedValue || undefined;
}

export function normalizeOptionalSlug(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim().toLowerCase();

  return normalizedValue || undefined;
}

export function normalizeRequiredItemsDeadline(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return undefined;
  }

  if (!DATE_ONLY_PATTERN.test(normalizedValue)) {
    throw new ConvexError("Required items deadline must use the YYYY-MM-DD format.");
  }

  const [year, month, day] = normalizedValue.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  const isValidDate = parsedDate.getUTCFullYear() === year && parsedDate.getUTCMonth() === month - 1 && parsedDate.getUTCDate() === day;

  if (!isValidDate) {
    throw new ConvexError("Required items deadline must be a valid date.");
  }

  return normalizedValue;
}

export function isValidSlug(value: string): boolean {
  return SLUG_PATTERN.test(value);
}

export function validateSlug(slug: string, label: string): void {
  if (!SLUG_PATTERN.test(slug)) {
    throw new ConvexError(`${label} must contain only lowercase letters, numbers, and hyphens.`);
  }
}

export function validateColor(color: string, label: string): void {
  if (!HEX_COLOR_PATTERN.test(color)) {
    throw new ConvexError(`${label} must be a valid six-digit hex color.`);
  }
}
