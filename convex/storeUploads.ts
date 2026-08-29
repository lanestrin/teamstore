import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";

import { mutation } from "./_generated/server";

/**
 * Generates an upload URL for store artwork.
 */
export const generateArtworkUploadUrl = mutation({
  args: {},

  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);

    if (userId === null) {
      throw new ConvexError("You must be signed in to upload artwork.");
    }

    return await ctx.storage.generateUploadUrl();
  },
});
