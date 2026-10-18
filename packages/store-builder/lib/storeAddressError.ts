export class StoreAddressError extends Error {
  readonly field: "organizationSlug" | "storeSlug";
  readonly suggestedOrganizationSlug?: string;

  constructor(message: string, field: "organizationSlug" | "storeSlug", suggestedOrganizationSlug?: string) {
    super(message);
    this.name = "StoreAddressError";
    this.field = field;
    this.suggestedOrganizationSlug = suggestedOrganizationSlug;
  }
}
