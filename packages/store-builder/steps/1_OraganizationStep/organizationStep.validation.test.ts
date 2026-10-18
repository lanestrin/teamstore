import { describe, expect, it } from "vitest";

import { getUpdatedAddressSlug, validateAddressSlug } from "./organizationStep.validation";

describe("editable store addresses", () => {
  it("updates generated URLs when the display name changes", () => {
    expect(getUpdatedAddressSlug("team", "Team", "New Team")).toBe("new-team");
    expect(getUpdatedAddressSlug("", "", "Team")).toBe("team");
  });

  it("preserves a customized URL when editing the display name", () => {
    expect(getUpdatedAddressSlug("team-2", "Team", "Team")).toBe("team-2");
    expect(getUpdatedAddressSlug("team-2", "Team", "Team Athletics")).toBe("team-2");
  });

  it.each(["", "Team", "team club", "-team", "team-", "team--club", "../team"])("rejects invalid URL: %s", (slug) => {
    expect(validateAddressSlug(slug)).toBeDefined();
  });

  it("accepts a distinct URL for a same-name organization", () => {
    expect(validateAddressSlug("team-2")).toBeUndefined();
  });
});
