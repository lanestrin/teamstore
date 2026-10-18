import { ConvexError } from "convex/values";

import { internal } from "../_generated/api";
import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_USER_FILE_BYTES = 100 * 1024 * 1024;
export const MAX_USER_FILES = 100;
export const MAX_UPLOADS_PER_HOUR = 30;
export const UNUSED_FILE_TTL = 24 * 60 * 60 * 1000;

/** Determine the stored MIME type from the bytes, never from client headers. */
export function getImageContentType(bytes: Uint8Array): string {
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_FILE_BYTES) {
    throw new ConvexError("Files must be between 1 byte and 5 MB.");
  }

  const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (pngSignature.every((byte, index) => bytes[index] === byte)) return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";

  // This identifies the format only. SVG displayed inline is sanitized separately.
  const prefix = new TextDecoder().decode(bytes.slice(0, 4096));
  if (/^\s*(?:<\?xml[^?]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*<svg(?:\s|>)/i.test(prefix)) {
    return "image/svg+xml";
  }

  throw new ConvexError("Upload a PNG, JPG, or SVG image.");
}

function storageIds(store: Doc<"stores"> | null): Set<Id<"_storage">> {
  return new Set(
    [store?.logoStorageId, store?.bannerStorageId, ...(store?.uploadedArtworks ?? []).map((artwork) => artwork.storageId)].filter(
      (id): id is Id<"_storage"> => id !== undefined,
    ),
  );
}

async function detachFile(ctx: MutationCtx, storageId: Id<"_storage">, storeId: Id<"stores">) {
  const file = await ctx.db
    .query("storeFiles")
    .withIndex("by_storage", (q) => q.eq("storageId", storageId))
    .unique();
  if (!file) return; // Legacy files have no ownership record; do not delete them blindly.

  const storeIds = file.storeIds.filter((id) => id !== storeId);
  await ctx.db.patch(file._id, { storeIds });
  if (storeIds.length === 0) {
    await ctx.scheduler.runAfter(UNUSED_FILE_TTL, internal.storeUploads.cleanupUnusedFile, { fileId: file._id });
  }
}

/** Called in the same transaction as saving a store, so invalid attachments roll back. */
export async function syncStoreFiles(ctx: MutationCtx, userId: Id<"users">, storeId: Id<"stores">, previous: Doc<"stores"> | null) {
  const next = await ctx.db.get(storeId);
  const previousIds = storageIds(previous);
  const nextIds = storageIds(next);

  for (const storageId of nextIds) {
    const file = await ctx.db
      .query("storeFiles")
      .withIndex("by_storage", (q) => q.eq("storageId", storageId))
      .unique();

    if (!file) {
      // Existing stores can retain their legacy files. New attachments must use
      // the authenticated uploader, which records ownership before returning IDs.
      if (previousIds.has(storageId)) continue;
      throw new ConvexError("This file must be uploaded again before it can be attached.");
    }
    if (file.ownerId !== userId) {
      throw new ConvexError("You do not have permission to use this file.");
    }
    if (!file.storeIds.includes(storeId)) {
      await ctx.db.patch(file._id, { storeIds: [...file.storeIds, storeId] });
    }
  }

  for (const storageId of previousIds) {
    if (!nextIds.has(storageId)) await detachFile(ctx, storageId, storeId);
  }
}

export async function releaseStoreFiles(ctx: MutationCtx, store: Doc<"stores">) {
  for (const storageId of storageIds(store)) {
    await detachFile(ctx, storageId, store._id);
  }
}
