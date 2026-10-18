import { defineTestApp } from "convex-test";
import { describe, expect, it } from "vitest";

import schema from "../convex/schema";
import * as storeDrafts from "../convex/storeDrafts";
import * as stores from "../convex/stores";

const { api, createTest } = defineTestApp({ schema }).defineModules({ storeDrafts, stores });
type Backend = ReturnType<typeof createTest>;

async function setup(t: Backend) {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@example.com" });
    const otherId = await ctx.db.insert("users", { email: "other@example.com" });
    const organizationId = await ctx.db.insert("organizations", {
      name: "Team",
      slug: "team",
      createdBy: otherId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await ctx.db.insert("organizationMembers", { organizationId, userId: otherId, role: "owner", createdAt: Date.now() });
    return { ownerId, otherId, organizationId };
  });
}

const organizationInput = {
  organizationName: "Team",
  organizationSlug: "team",
  storeName: "Fanwear",
  storeSlug: "fanwear",
  activity: "soccer" as const,
  storeType: "fanwear" as const,
};
const artworkSnapshots = [{ artworkTemplateId: "art", svg: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L10 10"/></svg>' }];

async function createReadyDraft(t: Backend, ownerId: Awaited<ReturnType<typeof setup>>["ownerId"]) {
  return await t.run(async (ctx) => {
    const now = Date.now();
    const storeId = await ctx.db.insert("stores", {
      createdBy: ownerId,
      organizationName: "Team",
      organizationSlug: "team",
      name: "Fanwear",
      slug: "fanwear",
      activity: "soccer",
      storeType: "fanwear",
      primaryColor: "#112233",
      secondaryColor: "#ffffff",
      artworkText: { organizationName: "Team", mascotName: "Cats", yearEstablished: "2020" },
      currentStep: 5,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    });
    const productId = await ctx.db.insert("products", {
      name: "Tee",
      slug: "tee",
      category: "tees",
      status: "active",
      createdAt: now,
      updatedAt: now,
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
      availability: "available",
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("storeProducts", {
      storeId,
      productId,
      colorKey: "red",
      artworkTemplateId: "art",
      isRequired: false,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
    return { storeId, productId };
  });
}

describe("store address conflicts", () => {
  it("detects another organization's URL before saving the first step and suggests an unused suffix", async () => {
    const t = createTest();
    const { ownerId, otherId } = await setup(t);
    await t.run((ctx) =>
      ctx.db.insert("organizations", {
        name: "Team",
        slug: "team-2",
        createdBy: otherId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    const signedIn = t.withIdentity({ subject: `${ownerId}|session` });
    expect(await signedIn.query(api.stores.checkStoreSlugAvailability, { organizationSlug: "team", storeSlug: "fanwear" })).toMatchObject({
      available: false,
      field: "organizationSlug",
      suggestedOrganizationSlug: "team-3",
    });
    await expect(signedIn.mutation(api.storeDrafts.saveOrganizationStep, organizationInput)).rejects.toMatchObject({
      data: { code: "STORE_ADDRESS_UNAVAILABLE", field: "organizationSlug", suggestedOrganizationSlug: "team-3" },
    });
    expect(await t.run((ctx) => ctx.db.query("stores").collect())).toHaveLength(0);
  });

  it("repairs an existing conflicted draft by changing only the URL, preserving products and artwork", async () => {
    const t = createTest();
    const { ownerId, organizationId } = await setup(t);
    const { storeId, productId } = await createReadyDraft(t, ownerId);
    const signedIn = t.withIdentity({ subject: `${ownerId}|session` });
    await expect(signedIn.mutation(api.stores.finalizeStore, { storeId, artworkSnapshots })).rejects.toMatchObject({
      data: { code: "STORE_ADDRESS_UNAVAILABLE", field: "organizationSlug" },
    });
    expect((await t.run((ctx) => ctx.db.get(storeId)))?.status).toBe("draft");

    await signedIn.mutation(api.storeDrafts.saveOrganizationStep, { ...organizationInput, storeId, organizationSlug: "team-2" });
    const result = await signedIn.mutation(api.stores.finalizeStore, { storeId, artworkSnapshots });
    expect(result.organizationId).not.toBe(organizationId);
    expect(result.organizationSlug).toBe("team-2");
    const published = await t.run((ctx) => ctx.db.get(storeId));
    expect(published).toMatchObject({ status: "active", organizationName: "Team", organizationSlug: "team-2", artworkSnapshots });
    expect(published?.artworkText?.mascotName).toBe("Cats");
    expect(
      await t.run((ctx) =>
        ctx.db
          .query("storeProducts")
          .withIndex("by_store", (q) => q.eq("storeId", storeId))
          .collect(),
      ),
    ).toEqual([expect.objectContaining({ productId, colorKey: "red", artworkTemplateId: "art" })]);
    expect(await t.run((ctx) => ctx.db.get(organizationId))).toMatchObject({ slug: "team", name: "Team" });
    expect(await t.run((ctx) => ctx.db.get(result.organizationId))).toMatchObject({ slug: "team-2", name: "Team", createdBy: ownerId });
  });

  it.each(["owner", "admin"] as const)("allows an existing organization %s to create another store", async (role) => {
    const t = createTest();
    const { ownerId, organizationId } = await setup(t);
    await t.run((ctx) => ctx.db.insert("organizationMembers", { organizationId, userId: ownerId, role, createdAt: Date.now() }));
    const signedIn = t.withIdentity({ subject: `${ownerId}|session` });
    expect(await signedIn.query(api.stores.checkStoreSlugAvailability, { organizationSlug: "team", storeSlug: "fanwear" })).toEqual({
      available: true,
    });
    const { storeId } = await createReadyDraft(t, ownerId);
    expect((await signedIn.mutation(api.stores.finalizeStore, { storeId, artworkSnapshots })).organizationId).toBe(organizationId);
  });

  it("does not grant an ordinary member permission to publish under an existing organization", async () => {
    const t = createTest();
    const { ownerId, organizationId } = await setup(t);
    await t.run((ctx) => ctx.db.insert("organizationMembers", { organizationId, userId: ownerId, role: "member", createdAt: Date.now() }));
    const signedIn = t.withIdentity({ subject: `${ownerId}|session` });
    expect(await signedIn.query(api.stores.checkStoreSlugAvailability, { organizationSlug: "team", storeSlug: "fanwear" })).toMatchObject({
      available: false,
      field: "organizationSlug",
    });
  });

  it("checks store URL collisions for an authorized organization owner", async () => {
    const t = createTest();
    const { otherId, organizationId } = await setup(t);
    await t.run((ctx) =>
      ctx.db.insert("stores", {
        createdBy: otherId,
        organizationId,
        organizationSlug: "team",
        slug: "fanwear",
        currentStep: 5,
        status: "active",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    const signedIn = t.withIdentity({ subject: `${otherId}|session` });
    expect(await signedIn.query(api.stores.checkStoreSlugAvailability, { organizationSlug: "team", storeSlug: "fanwear" })).toMatchObject({
      available: false,
      field: "storeSlug",
      message: "A store with this name already exists for this organization. Please choose a different store name or organization.",
    });
    await expect(signedIn.mutation(api.storeDrafts.saveOrganizationStep, organizationInput)).rejects.toMatchObject({
      data: { field: "storeSlug" },
    });
  });

  it("rechecks at publication if another organization claims a previously available URL", async () => {
    const t = createTest();
    const { ownerId, otherId } = await setup(t);
    const { storeId } = await createReadyDraft(t, ownerId);
    const signedIn = t.withIdentity({ subject: `${ownerId}|session` });
    await signedIn.mutation(api.storeDrafts.saveOrganizationStep, { ...organizationInput, storeId, organizationSlug: "team-2" });
    await t.run((ctx) =>
      ctx.db.insert("organizations", {
        name: "Team",
        slug: "team-2",
        createdBy: otherId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );
    await expect(signedIn.mutation(api.stores.finalizeStore, { storeId, artworkSnapshots })).rejects.toMatchObject({
      data: { field: "organizationSlug" },
    });
    expect((await t.run((ctx) => ctx.db.get(storeId)))?.status).toBe("draft");
  });
});
