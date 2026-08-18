import { describe, expect, it } from "vitest";
import { buildArchiveCandidateEnrichmentPatch } from "./db";

describe("archive candidate enrichment patch", () => {
  it("updates only fields supplied by a public-page refresh", () => {
    const fetchedAt = new Date("2026-08-18T00:00:00.000Z");
    expect(buildArchiveCandidateEnrichmentPatch({
      candidateId: 7,
      status: "review_ready",
      canonicalUrl: "https://example.org/",
      metadataVerificationStatus: "public_page_fetched",
      metadataFetchedAt: fetchedAt,
    })).toEqual({
      status: "review_ready",
      failureCode: null,
      canonicalUrl: "https://example.org/",
      metadataVerificationStatus: "public_page_fetched",
      metadataFetchedAt: fetchedAt,
    });
  });

  it("allows explicit nulls but never introduces omitted fields", () => {
    expect(buildArchiveCandidateEnrichmentPatch({ candidateId: 8, status: "duplicate", duplicateResourceId: 42 })).toEqual({
      status: "duplicate",
      failureCode: null,
      duplicateResourceId: 42,
    });
    expect(buildArchiveCandidateEnrichmentPatch({ candidateId: 9, status: "failed", description: null, failureCode: "metadata_unavailable" })).toEqual({
      status: "failed",
      failureCode: "metadata_unavailable",
      description: null,
    });
  });
});
