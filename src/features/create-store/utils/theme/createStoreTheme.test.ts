import { describe, expect, it } from "vitest";

import { createStoreTheme } from "./createStoreTheme";

const TEAM_RED = "#B91C1C";
const TEAM_YELLOW = "#FACC15";
const WHITE = "#FFFFFF";

const WHITE_TEXT = "#FFFFFF";
const DARK_TEXT = "#111827";

describe("createStoreTheme", () => {
  describe("badge", () => {
    it("uses the secondary color when the secondary color is not white", () => {
      const theme = createStoreTheme(TEAM_RED, TEAM_YELLOW);

      expect(theme.badge.background).toBe(TEAM_YELLOW);
      expect(theme.badge.text).toBe(DARK_TEXT);
    });

    it("uses the primary color when the secondary color is white", () => {
      const theme = createStoreTheme(TEAM_RED, WHITE);

      expect(theme.badge.background).toBe(TEAM_RED);
      expect(theme.badge.text).toBe(WHITE_TEXT);
    });

    it("uses white when both colors are white", () => {
      const theme = createStoreTheme(WHITE, WHITE);

      expect(theme.badge.background).toBe(WHITE);
      expect(theme.badge.text).toBe(DARK_TEXT);
    });
  });
});
