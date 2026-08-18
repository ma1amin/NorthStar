import { describe, expect, it } from "vitest";
import { normalizeModerationTags } from "./moderationTags";

describe("normalizeModerationTags", () => {
  it("returns deterministic unique tag records and excludes malformed values", () => {
    expect(normalizeModerationTags([" Kanban ", "kanban", "Product  Planning", "", 210001, null])).toEqual([
      { name: "Kanban", slug: "kanban" },
      { name: "Product Planning", slug: "product-planning" },
    ]);
  });

  it("returns no tag records for non-array submission payloads", () => {
    expect(normalizeModerationTags({ tag: "kanban" })).toEqual([]);
  });
});
