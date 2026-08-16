import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type DatabaseCtx = QueryCtx | MutationCtx;

export async function requireAuthenticatedUser(ctx: DatabaseCtx) {
  const userId = await getAuthUserId(ctx);

  if (!userId) {
    throw new ConvexError("You must be signed in to perform this action.");
  }

  return userId;
}

export async function requirePlatformAdmin(ctx: DatabaseCtx) {
  const userId = await requireAuthenticatedUser(ctx);
  const user = await ctx.db.get(userId);

  if (!user || user.isPlatformAdmin !== true) {
    throw new ConvexError("You do not have permission to manage the platform catalog.");
  }

  return { userId, user };
}

export async function requireStoreManager(ctx: DatabaseCtx, storeId: Id<"stores">) {
  const userId = await requireAuthenticatedUser(ctx);
  const store = await ctx.db.get(storeId);

  if (!store) {
    throw new ConvexError("Store not found.");
  }

  if (store.createdBy === userId) {
    return { userId, store };
  }

  if (!store.organizationId) {
    throw new ConvexError("You do not have permission to manage this store.");
  }

  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_organization_user", (q) => q.eq("organizationId", store.organizationId!).eq("userId", userId))
    .unique();

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    throw new ConvexError("You do not have permission to manage this store.");
  }

  return { userId, store };
}
