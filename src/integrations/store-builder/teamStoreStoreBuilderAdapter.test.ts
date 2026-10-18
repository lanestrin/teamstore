import { ConvexReactClient } from "convex/react";
import { ConvexError } from "convex/values";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createTeamStoreStoreBuilderAdapter } from "./teamStoreStoreBuilderAdapter";
import { StoreAddressError } from "../../../packages/store-builder/lib/storeAddressError";

afterEach(() => vi.restoreAllMocks());

describe("store address error mapping", () => {
  it("turns publication conflicts into actionable errors without the server stack", async () => {
    const client = new ConvexReactClient("https://example.convex.cloud");
    vi.spyOn(client, "mutation").mockRejectedValue(
      new ConvexError({
        code: "STORE_ADDRESS_UNAVAILABLE",
        available: false,
        field: "organizationSlug",
        message: "Choose another organization URL.",
        suggestedOrganizationSlug: "team-2",
      }),
    );
    const adapter = createTeamStoreStoreBuilderAdapter(client);
    await expect(adapter.finalizeStore({ storeId: "draft", artworkSnapshots: [] })).rejects.toBeInstanceOf(StoreAddressError);
    await expect(adapter.finalizeStore({ storeId: "draft", artworkSnapshots: [] })).rejects.toMatchObject({
      field: "organizationSlug",
      message: "Choose another organization URL.",
      suggestedOrganizationSlug: "team-2",
    });
    await client.close();
  });

  it("maps conflicts found during a first-step save too", async () => {
    const client = new ConvexReactClient("https://example.convex.cloud");
    vi.spyOn(client, "mutation").mockRejectedValue(
      new ConvexError({
        code: "STORE_ADDRESS_UNAVAILABLE",
        available: false,
        field: "storeSlug",
        message: "Choose another store URL.",
      }),
    );
    const adapter = createTeamStoreStoreBuilderAdapter(client);
    await expect(
      adapter.saveOrganizationStep({
        organizationName: "Team",
        organizationSlug: "team",
        storeName: "Fanwear",
        storeSlug: "fanwear",
        activity: "soccer",
        storeType: "fanwear",
      }),
    ).rejects.toMatchObject({ name: "StoreAddressError", field: "storeSlug", message: "Choose another store URL." });
    await client.close();
  });
});
