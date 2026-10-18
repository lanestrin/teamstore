import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { action, internalMutation } from "./_generated/server";
import { requireAuthenticatedUser } from "./lib/authz";
import {
  getImageContentType,
  MAX_FILE_BYTES,
  MAX_UPLOADS_PER_HOUR,
  MAX_USER_FILE_BYTES,
  MAX_USER_FILES,
  UNUSED_FILE_TTL,
} from "./lib/storeFiles";

/** All uploads pass through server validation; no unrestricted storage URL is exposed. */
export const uploadFile = action({
  args: { bytes: v.bytes() },
  handler: async (ctx, args): Promise<Id<"_storage">> => {
    if (!(await getAuthUserId(ctx))) {
      throw new ConvexError("You must be signed in to upload store files.");
    }

    const contentType = getImageContentType(new Uint8Array(args.bytes));
    const fileId = await ctx.runMutation(internal.storeUploads.reserveUpload, { size: args.bytes.byteLength });
    let storageId: Id<"_storage"> | undefined;
    try {
      storageId = await ctx.storage.store(new Blob([args.bytes], { type: contentType }));
      await ctx.runMutation(internal.storeUploads.completeUpload, { fileId, storageId });
      return storageId;
    } catch (error) {
      if (storageId) await ctx.storage.delete(storageId);
      await ctx.runMutation(internal.storeUploads.cancelUpload, { fileId });
      throw error;
    }
  },
});

export const reserveUpload = internalMutation({
  args: { size: v.number() },
  handler: async (ctx, { size }) => {
    const userId = await requireAuthenticatedUser(ctx);
    if (!Number.isInteger(size) || size < 1 || size > MAX_FILE_BYTES) throw new ConvexError("Invalid file size.");

    const now = Date.now();
    const limit = await ctx.db
      .query("storeUploadLimits")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    const withinWindow = limit !== null && now - limit.windowStart < 60 * 60 * 1000;
    if (withinWindow && limit.count >= MAX_UPLOADS_PER_HOUR) {
      throw new ConvexError("Upload limit reached. Please try again in an hour.");
    }

    // Pending uploads count toward the quota too, including concurrent requests.
    const files = await ctx.db
      .query("storeFiles")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .take(MAX_USER_FILES + 1);
    if (files.length >= MAX_USER_FILES || files.reduce((total, file) => total + file.size, size) > MAX_USER_FILE_BYTES) {
      throw new ConvexError("Your upload storage limit has been reached.");
    }

    if (limit) {
      await ctx.db.patch(limit._id, { windowStart: withinWindow ? limit.windowStart : now, count: withinWindow ? limit.count + 1 : 1 });
    } else {
      await ctx.db.insert("storeUploadLimits", { userId, windowStart: now, count: 1 });
    }

    const fileId = await ctx.db.insert("storeFiles", { ownerId: userId, size, storeIds: [], createdAt: now });
    await ctx.scheduler.runAfter(UNUSED_FILE_TTL, internal.storeUploads.cleanupUnusedFile, { fileId });
    return fileId;
  },
});

export const completeUpload = internalMutation({
  args: { fileId: v.id("storeFiles"), storageId: v.id("_storage") },
  handler: async (ctx, { fileId, storageId }) => {
    const userId = await requireAuthenticatedUser(ctx);
    const file = await ctx.db.get(fileId);
    if (!file || file.ownerId !== userId || file.storageId) throw new ConvexError("Invalid upload reservation.");
    const metadata = await ctx.db.system.get(storageId);
    if (!metadata || metadata.size !== file.size) throw new ConvexError("Upload size does not match its reservation.");
    await ctx.db.patch(fileId, { storageId });
  },
});

export const cancelUpload = internalMutation({
  args: { fileId: v.id("storeFiles") },
  handler: async (ctx, { fileId }) => {
    const userId = await requireAuthenticatedUser(ctx);
    const file = await ctx.db.get(fileId);
    if (file?.ownerId === userId && !file.storageId) await ctx.db.delete(fileId);
  },
});

export const cleanupUnusedFile = internalMutation({
  args: { fileId: v.id("storeFiles") },
  handler: async (ctx, { fileId }) => {
    const file = await ctx.db.get(fileId);
    if (!file || file.storeIds.length > 0 || Date.now() - file.createdAt < UNUSED_FILE_TTL) return;
    if (file.storageId) await ctx.storage.delete(file.storageId);
    await ctx.db.delete(fileId);
  },
});
