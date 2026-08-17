import { describe, expect, it } from "vitest";
import { extractPiiFreeResourceUrls, normalizeIntakeUrl, sanitizePublicResourceMetadata } from "./resourceIntake";

describe("PII-free resource intake", () => {
  it("normalizes public resource URLs and removes tracking data", () => {
    expect(normalizeIntakeUrl("https://example.com/tool?utm_source=chat&gclid=value#overview")).toBe("https://example.com/tool");
  });

  it("rejects private-network URLs and URLs carrying apparent personal contact data", () => {
    expect(normalizeIntakeUrl("http://127.0.0.1:3000/private")).toBeUndefined();
    expect(normalizeIntakeUrl("https://example.com/?contact=person@example.com")).toBeUndefined();
    expect(normalizeIntakeUrl("https://example.com/?contact=person%40example.com")).toBeUndefined();
  });

  it("returns URL-only candidates without retaining surrounding names, numbers, or message context", () => {
    const result = extractPiiFreeResourceUrls("A contributor shared https://example.com/resource?utm_medium=chat. Contact them at person@example.com or +1 555 010 1234.");

    expect(result).toEqual({
      candidates: ["https://example.com/resource"],
      totalUrlMentions: 1,
      rejectedUrlMentions: 0,
    });
    expect(JSON.stringify(result)).not.toContain("person@example.com");
    expect(JSON.stringify(result)).not.toContain("555");
  });

  it("does not retain enriched text containing contact details or account identifiers", () => {
    expect(sanitizePublicResourceMetadata("A resource description", 255)).toBe("A resource description");
    expect(sanitizePublicResourceMetadata("Contact person@example.com", 255)).toBeUndefined();
    expect(sanitizePublicResourceMetadata("Follow @person for updates", 255)).toBeUndefined();
  });

  it("excludes video and editorial URLs from extracted resource candidates", () => {
    const result = extractPiiFreeResourceUrls("https://youtu.be/example https://medium.com/example https://github.com/org/repository");
    expect(result.candidates).toEqual(["https://github.com/org/repository"]);
    expect(result.rejectedUrlMentions).toBe(2);
  });
});
