import { authTables } from "@convex-dev/auth/server";
import { defineTestApp } from "convex-test";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import schema from "../convex/schema";
import * as storeUploads from "../convex/storeUploads";
import * as storeDrafts from "../convex/storeDrafts";
import * as productVariants from "../convex/productVariants";
import { generateResetCode } from "../convex/lib/resetCode";
import { MAX_FILE_BYTES, MAX_UPLOADS_PER_HOUR, MAX_USER_FILES, UNUSED_FILE_TTL } from "../convex/lib/storeFiles";
import type { Id } from "../convex/_generated/dataModel";

const { api, internal, createTest } = defineTestApp({ schema }).defineModules({ storeUploads, storeDrafts, productVariants });
type Backend = ReturnType<typeof createTest>;
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]).buffer;

async function user(t: Backend, email = "owner@example.com") {
  const userId = await t.run((ctx) => ctx.db.insert("users", { email }));
  return { userId, signedIn: t.withIdentity({ subject: `${userId}|session` }) };
}

function organization(logoStorageId?: Id<"_storage">) {
  return {
    organizationName: "Team",
    organizationSlug: "team",
    storeName: "Fanwear",
    storeSlug: "fanwear",
    activity: "soccer" as const,
    storeType: "fanwear" as const,
    logoStorageId,
  };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("authentication schema", () => {
  it("does not define duplicate index field lists within a table", () => {
    for (const [tableName, table] of Object.entries(schema.tables)) {
      const definition = table.export();
      const indexes = [...definition.indexes, ...definition.stagedDbIndexes];
      const fieldsSeen = new Map<string, string>();
      for (const index of indexes) {
        const fields = JSON.stringify(index.fields);
        expect(fieldsSeen.get(fields), `${tableName}.${index.indexDescriptor} duplicates ${fieldsSeen.get(fields)}`).toBeUndefined();
        fieldsSeen.set(fields, index.indexDescriptor);
      }
    }
  });

  it("retains auth tables, provider profile fields, and the library's exact index names", async () => {
    const t = createTest();
    expect(Object.keys(schema.tables)).toEqual(expect.arrayContaining(Object.keys(authTables)));
    await t.run(async (ctx) => {
      const userId = await ctx.db.insert("users", {
        email: "verified@example.com",
        image: "https://example.com/avatar.png",
        emailVerificationTime: Date.now(),
        phone: "+15555550123",
        phoneVerificationTime: Date.now(),
        isPlatformAdmin: false,
      });
      expect(
        (
          await ctx.db
            .query("users")
            .withIndex("email", (q) => q.eq("email", "verified@example.com"))
            .unique()
        )?._id,
      ).toBe(userId);
      expect(
        (
          await ctx.db
            .query("users")
            .withIndex("phone", (q) => q.eq("phone", "+15555550123"))
            .unique()
        )?._id,
      ).toBe(userId);
    });
  });
});

describe("password reset codes", () => {
  it("uses secure randomness and preserves leading zeroes", () => {
    vi.spyOn(Math, "random").mockImplementation(() => {
      throw new Error("Insecure random source used");
    });
    vi.spyOn(crypto, "getRandomValues").mockImplementation((array) => {
      (array as Uint32Array)[0] = 42;
      return array;
    });
    expect(generateResetCode()).toBe("000042");
  });

  it("rejects the biased end of the random range", () => {
    let calls = 0;
    vi.spyOn(crypto, "getRandomValues").mockImplementation((array) => {
      (array as Uint32Array)[0] = calls++ === 0 ? 0xffffffff : 123456;
      return array;
    });
    expect(generateResetCode()).toBe("123456");
    expect(calls).toBe(2);
  });
});

describe("public variants", () => {
  it("returns retail data without supplier costs or identifiers, while management remains protected", async () => {
    const t = createTest();
    const productId = await t.run(async (ctx) => {
      const productId = await ctx.db.insert("products", {
        name: "Tee",
        slug: "tee",
        category: "tees",
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await ctx.db.insert("productVariants", {
        productId,
        sku: "TEE-S",
        color: "Red",
        colorKey: "red",
        size: "S",
        baseCostInCents: 700,
        directPriceInCents: 1500,
        currency: "USD",
        provider: "supplier",
        providerVariantId: "private-identifier",
        upc: "private-upc",
        availability: "available",
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return productId;
    });
    const variants = await t.query(api.productVariants.listActiveByProduct, { productId });
    expect(variants).toHaveLength(1);
    expect(variants[0]).toMatchObject({ directPriceInCents: 1500, color: "Red", size: "S" });
    for (const key of ["baseCostInCents", "provider", "providerVariantId", "upc"]) expect(variants[0]).not.toHaveProperty(key);
    await expect(t.query(api.productVariants.listForManagement, { productId })).rejects.toThrow("signed in");
  });
});

describe("file upload boundaries and lifecycle", () => {
  it("rejects anonymous uploads before storing anything", async () => {
    const t = createTest();
    await expect(t.action(api.storeUploads.uploadFile, { bytes: png })).rejects.toThrow("signed in");
    expect(await t.run((ctx) => ctx.db.query("storeFiles").collect())).toHaveLength(0);
  });

  it("validates size and actual file format on the server", async () => {
    const t = createTest();
    const { signedIn } = await user(t);
    for (const bytes of [new ArrayBuffer(0), new ArrayBuffer(MAX_FILE_BYTES + 1)]) {
      await expect(signedIn.action(api.storeUploads.uploadFile, { bytes })).rejects.toThrow("5 MB");
    }
    await expect(
      signedIn.action(api.storeUploads.uploadFile, { bytes: new TextEncoder().encode("<html>not an image</html>").buffer }),
    ).rejects.toThrow("PNG, JPG, or SVG");
    const storageId = await signedIn.action(api.storeUploads.uploadFile, { bytes: png });
    expect(await t.run(async (ctx) => (await ctx.storage.get(storageId))?.type)).toBe("image/png");
  });

  it("enforces per-user hourly rate limits and resets the window", async () => {
    const t = createTest();
    const { signedIn } = await user(t);
    for (let i = 0; i < MAX_UPLOADS_PER_HOUR; i++) await signedIn.mutation(internal.storeUploads.reserveUpload, { size: 8 });
    await expect(signedIn.action(api.storeUploads.uploadFile, { bytes: png })).rejects.toThrow("Upload limit reached");
    const other = await user(t, "other@example.com");
    await expect(other.signedIn.action(api.storeUploads.uploadFile, { bytes: png })).resolves.toBeTypeOf("string");
    vi.advanceTimersByTime(60 * 60 * 1000);
    await expect(signedIn.action(api.storeUploads.uploadFile, { bytes: png })).resolves.toBeTypeOf("string");
  });

  it("allows only one concurrent reservation when one rate-limit slot remains", async () => {
    const t = createTest();
    const { userId, signedIn } = await user(t);
    await t.run((ctx) =>
      ctx.db.insert("storeUploadLimits", {
        userId,
        windowStart: Date.now(),
        count: MAX_UPLOADS_PER_HOUR - 1,
      }),
    );
    const results = await Promise.allSettled([
      signedIn.mutation(internal.storeUploads.reserveUpload, { size: png.byteLength }),
      signedIn.mutation(internal.storeUploads.reserveUpload, { size: png.byteLength }),
    ]);
    expect(results.filter((result) => result.status === "rejected").map((result) => String(result.reason))).toEqual([
      expect.stringContaining("Upload limit reached"),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await t.run((ctx) => ctx.db.query("storeFiles").collect())).toHaveLength(1);
  });

  it.each(["bytes", "count"])("enforces the per-user %s quota, including pending uploads", async (quota) => {
    const t = createTest();
    const { userId, signedIn } = await user(t);
    await t.run(async (ctx) => {
      const count = quota === "count" ? MAX_USER_FILES : 20;
      for (let i = 0; i < count; i++) {
        await ctx.db.insert("storeFiles", {
          ownerId: userId,
          size: quota === "count" ? 1 : MAX_FILE_BYTES,
          storeIds: [],
          createdAt: Date.now(),
        });
      }
    });
    await expect(signedIn.action(api.storeUploads.uploadFile, { bytes: png })).rejects.toThrow("storage limit");
  });

  it("rejects another user's storage ID and rolls back the store creation", async () => {
    const t = createTest();
    const owner = await user(t);
    const attacker = await user(t, "attacker@example.com");
    const storageId = await owner.signedIn.action(api.storeUploads.uploadFile, { bytes: png });
    await expect(attacker.signedIn.mutation(api.storeDrafts.saveOrganizationStep, organization(storageId))).rejects.toThrow("permission");
    expect(await t.run((ctx) => ctx.db.query("stores").collect())).toHaveLength(0);
  });

  it("also checks ownership in artwork and general draft saves", async () => {
    const t = createTest();
    const owner = await user(t);
    const attacker = await user(t, "attacker@example.com");
    const storageId = await owner.signedIn.action(api.storeUploads.uploadFile, { bytes: png });
    const { storeId } = await attacker.signedIn.mutation(api.storeDrafts.saveOrganizationStep, organization());
    await expect(
      attacker.signedIn.mutation(api.storeDrafts.saveArtworkStep, {
        storeId,
        artworkText: { organizationName: "Team", mascotName: "", yearEstablished: "" },
        artworkTemplates: [],
        uploadedArtworks: [{ id: "stolen", fileName: "stolen.png", storageId, isSelected: true }],
      }),
    ).rejects.toThrow("permission");
    await expect(
      attacker.signedIn.mutation(api.storeDrafts.saveDraft, {
        storeId,
        bannerStorageId: storageId,
        productSelections: [],
        currentStep: 2,
      }),
    ).rejects.toThrow("permission");
    expect((await t.run((ctx) => ctx.db.get(storeId)))?.bannerStorageId).toBeUndefined();
    expect((await t.run((ctx) => ctx.db.get(storeId)))?.uploadedArtworks).toBeUndefined();
  });

  it("deletes abandoned uploads after their grace period", async () => {
    const t = createTest();
    const { signedIn } = await user(t);
    const storageId = await signedIn.action(api.storeUploads.uploadFile, { bytes: png });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run(async (ctx) => (await ctx.storage.get(storageId)) !== null)).toBe(false);
    expect(await t.run((ctx) => ctx.db.query("storeFiles").collect())).toHaveLength(0);
  });

  it("keeps attached files, then cleans them up when their draft is deleted", async () => {
    const t = createTest();
    const { signedIn } = await user(t);
    const storageId = await signedIn.action(api.storeUploads.uploadFile, { bytes: png });
    const { storeId } = await signedIn.mutation(api.storeDrafts.saveOrganizationStep, organization(storageId));
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run(async (ctx) => (await ctx.storage.get(storageId)) !== null)).toBe(true);
    await signedIn.mutation(api.storeDrafts.deleteDraft, { storeId });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run(async (ctx) => (await ctx.storage.get(storageId)) !== null)).toBe(false);
  });

  it("does not delete a file shared with another store", async () => {
    const t = createTest();
    const { signedIn } = await user(t);
    const storageId = await signedIn.action(api.storeUploads.uploadFile, { bytes: png });
    const first = await signedIn.mutation(api.storeDrafts.saveOrganizationStep, organization(storageId));
    await signedIn.mutation(api.storeDrafts.saveOrganizationStep, organization(storageId));
    await signedIn.mutation(api.storeDrafts.deleteDraft, { storeId: first.storeId });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run(async (ctx) => (await ctx.storage.get(storageId)) !== null)).toBe(true);
  });

  it("cleans up a replaced logo while keeping the replacement", async () => {
    const t = createTest();
    const { signedIn } = await user(t);
    const original = await signedIn.action(api.storeUploads.uploadFile, { bytes: png });
    const replacement = await signedIn.action(api.storeUploads.uploadFile, { bytes: png });
    const { storeId } = await signedIn.mutation(api.storeDrafts.saveOrganizationStep, organization(original));
    await signedIn.mutation(api.storeDrafts.saveOrganizationStep, { ...organization(replacement), storeId });
    await t.finishAllScheduledFunctions(vi.runAllTimers);
    expect(await t.run(async (ctx) => (await ctx.storage.get(original)) !== null)).toBe(false);
    expect(await t.run(async (ctx) => (await ctx.storage.get(replacement)) !== null)).toBe(true);
  });

  it("preserves existing legacy attachments while preventing new unowned attachments", async () => {
    const t = createTest();
    const { userId, signedIn } = await user(t);
    const { storeId, storageId } = await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(new Blob([png], { type: "image/png" }));
      const storeId = await ctx.db.insert("stores", {
        createdBy: userId,
        logoStorageId: storageId,
        currentStep: 2,
        status: "draft",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return { storeId, storageId };
    });
    await expect(signedIn.mutation(api.storeDrafts.saveOrganizationStep, { ...organization(storageId), storeId })).resolves.toMatchObject({
      storeId,
    });
    await expect(signedIn.mutation(api.storeDrafts.saveOrganizationStep, organization(storageId))).rejects.toThrow("uploaded again");
    vi.advanceTimersByTime(UNUSED_FILE_TTL);
    expect(await t.run(async (ctx) => (await ctx.storage.get(storageId)) !== null)).toBe(true);
  });
});
