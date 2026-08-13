import { describe, expect, it } from "vitest";

describe("sanitized development seed contract", () => {
  it("ships a meaningful graph fixture that covers each approved relationship type", async () => {
    const fixtures = await import("../scripts/seed-fixtures.mjs");
    const relationshipTypes = new Set(fixtures.fixtureRelationships.map((relationship: string[]) => relationship[2]));
    expect(fixtures.fixtureCategories.length).toBeGreaterThanOrEqual(6);
    expect(fixtures.fixtureSubcategories.length).toBeGreaterThanOrEqual(10);
    expect(fixtures.fixtureResources.length).toBeGreaterThanOrEqual(20);
    expect(fixtures.fixtureCollections.length).toBeGreaterThanOrEqual(4);
    expect(relationshipTypes).toEqual(new Set(["alternative_to", "similar_to", "integrates_with", "built_by", "maintained_by", "funded_by", "used_by", "depends_on", "part_of", "competitor_of"]));
  });

  it("keeps local fixtures explicitly sanitized and scoped to example.com", async () => {
    const fixtures = await import("../scripts/seed-fixtures.mjs");
    expect(fixtures.fixtureResources.every((resource: string[]) => resource[2].toLowerCase().includes("synthetic"))).toBe(true);
    expect(fixtures.fixtureRelationships.every((relationship: string[]) => !relationship.some((value) => typeof value === "string" && value.includes("http")))).toBe(true);
  });
});
