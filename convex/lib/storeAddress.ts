import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AddressCtx = MutationCtx | QueryCtx;
type StoreAddressAvailability =
  { available: true } | { available: false; field: "organizationSlug" | "storeSlug"; message: string; suggestedOrganizationSlug?: string };

export async function getStoreAddressAvailability(
  ctx: AddressCtx,
  organizationSlug: string,
  storeSlug: string,
  excludeStoreId?: Id<"stores">,
): Promise<StoreAddressAvailability> {
  const organization = await ctx.db
    .query("organizations")
    .withIndex("by_slug", (q) => q.eq("slug", organizationSlug))
    .unique();

  if (organization) {
    const userId = await getAuthUserId(ctx);
    const membership = userId
      ? await ctx.db
          .query("organizationMembers")
          .withIndex("by_organization_user", (q) => q.eq("organizationId", organization._id).eq("userId", userId))
          .unique()
      : null;

    if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
      let suggestedOrganizationSlug: string | undefined;
      for (let suffix = 2; suffix <= 25; suffix++) {
        const candidate = `${organizationSlug}-${suffix}`;
        const existing = await ctx.db
          .query("organizations")
          .withIndex("by_slug", (q) => q.eq("slug", candidate))
          .unique();
        if (!existing) {
          suggestedOrganizationSlug = candidate;
          break;
        }
      }
      return {
        available: false,
        field: "organizationSlug",
        message:
          "An organization with this name already exists. Please choose a different organization name or address.",
        ...(suggestedOrganizationSlug ? { suggestedOrganizationSlug } : {}),
      };
    }
  }

  const stores = await ctx.db
    .query("stores")
    .withIndex("by_organization_slug_and_slug", (q) => q.eq("organizationSlug", organizationSlug).eq("slug", storeSlug))
    .collect();
  if (stores.some((store) => store.status === "active" && store._id !== excludeStoreId)) {
    return {
      available: false,
      field: "storeSlug",
      message: "A store with this name already exists for this organization. Please choose a different store name or organization.",
    };
  }

  return { available: true };
}

export async function assertStoreAddressAvailable(
  ctx: AddressCtx,
  organizationSlug: string,
  storeSlug: string,
  excludeStoreId?: Id<"stores">,
) {
  const result = await getStoreAddressAvailability(ctx, organizationSlug, storeSlug, excludeStoreId);
  if (!result.available) {
    throw new ConvexError({ code: "STORE_ADDRESS_UNAVAILABLE", ...result });
  }
}
