import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

import { mutation } from "./_generated/server";

/**
 * Generates an authenticated upload URL for files that belong
 * to the store creation and management workflows.
 *
 * The returned storage ID is persisted separately on the
 * appropriate domain record, such as a store logo, artwork
 * asset, or regulation document.
 */
export const generateUploadUrl = mutation({
  args: {},

  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError("You must be signed in to upload store files.");
    }

    return await ctx.storage.generateUploadUrl();
  },
});
