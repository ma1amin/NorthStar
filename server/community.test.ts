import { describe, expect, it } from "vitest";
import { canViewCollection, collectionSlug, normalizeProfileUpdate, REPUTATION_RULES } from "./community";

describe("community domain helpers", () => {
  it("allows public collections to be viewed without authentication", () => {
    expect(canViewCollection({ ownerId: 42, isPublic: true })).toBe(true);
  });

  it("only allows the owner to view a private collection", () => {
    const collection = { ownerId: 42, isPublic: false };
    expect(canViewCollection(collection, 42)).toBe(true);
    expect(canViewCollection(collection, 7)).toBe(false);
    expect(canViewCollection(collection)).toBe(false);
  });

  it("creates stable slugs from collection names", () => {
    expect(collectionSlug("  Research & Discovery  ")).toBe("research-discovery");
    expect(collectionSlug("!!!")).toBe("collection");
  });

  it("defines bounded, explainable reputation awards", () => {
    expect(REPUTATION_RULES.approvedResource).toBe(10);
    expect(REPUTATION_RULES.approvedRelationship).toBe(5);
    expect(REPUTATION_RULES.resourceUpvote).toBe(1);
    expect(REPUTATION_RULES.relationshipUpvote).toBe(1);
  });

  it("normalizes profile fields and preserves explicit clears", () => {
    expect(normalizeProfileUpdate({ name: " Dr. Mohammed ", bio: "  ", avatar: " https://example.com/avatar.png " })).toEqual({
      name: "Dr. Mohammed",
      bio: null,
      avatar: "https://example.com/avatar.png",
    });
  });
});
