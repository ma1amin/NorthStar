import { describe, expect, it } from "vitest";
import { buildArchiveEvidenceProposals } from "./archiveEvidence";

describe("archive evidence proposals", () => {
  it("creates only changed public-page metadata fields with their evidence URL", () => {
    const retrievedAt = new Date("2026-08-18T00:00:00.000Z");
    const proposals = buildArchiveEvidenceProposals({
      candidate: {
        title: "Earlier title",
        description: "Current description",
        canonicalUrl: "https://example.org/old",
        officialSourceUrl: "https://example.org/old",
      },
      metadata: {
        url: "https://example.org/",
        canonicalUrl: "https://example.org/",
        title: "Verified title",
        description: "Current description",
      },
      retrievedAt,
    });

    expect(proposals).toEqual([
      expect.objectContaining({ field: "title", currentValue: "Earlier title", proposedValue: "Verified title", evidenceUrl: "https://example.org/", extractionMethod: "public_page_metadata", retrievedAt }),
      expect.objectContaining({ field: "canonical_url", currentValue: "https://example.org/old", proposedValue: "https://example.org/", evidenceUrl: "https://example.org/", extractionMethod: "canonical_redirect", retrievedAt }),
      expect.objectContaining({ field: "official_source_url", currentValue: "https://example.org/old", proposedValue: "https://example.org/", evidenceUrl: "https://example.org/", extractionMethod: "public_page_metadata", retrievedAt }),
    ]);
  });

  it("does not create review records when public metadata matches stored values", () => {
    expect(buildArchiveEvidenceProposals({
      candidate: { title: "Verified title", description: "Verified description", canonicalUrl: "https://example.org/", officialSourceUrl: "https://example.org/" },
      metadata: { url: "https://example.org/", title: "Verified title", description: "Verified description" },
      retrievedAt: new Date("2026-08-18T00:00:00.000Z"),
    })).toEqual([]);
  });
});
