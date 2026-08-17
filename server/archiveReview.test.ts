import { describe, expect, it } from "vitest";
import { ARCHIVE_BULK_REVIEW_LIMIT, ARCHIVE_METADATA_RETRY_LIMIT, getArchiveContentExclusion, getRegistrableDomain, mayRetryArchiveCandidate, normalizeTrustedDomain, suggestArchiveClassification } from "./archiveReview";

describe("archive review policy", () => {
  it("excludes video hosts and editorial URLs before moderation", () => {
    expect(getArchiveContentExclusion("https://youtu.be/example")).toBe("video_host");
    expect(getArchiveContentExclusion("https://medium.com/example")).toBe("editorial_content");
    expect(getArchiveContentExclusion("https://blog.google/innovation/example")).toBe("editorial_content");
    expect(getArchiveContentExclusion("https://www.reddit.com/r/example")).toBe("social_or_profile");
    expect(getArchiveContentExclusion("https://drive.google.com/file/d/example/view")).toBe("google_workspace");
    expect(getArchiveContentExclusion("https://lu.ma/event-example")).toBe("luma_calendar");
    expect(getArchiveContentExclusion("https://meet.google.com/example")).toBe("meeting_link");
    expect(getArchiveContentExclusion("https://vendor.example/download/report.pdf")).toBe("direct_document");
    expect(getArchiveContentExclusion("https://vendor.example/blog/product-update")).toBe("editorial_content");
    expect(getArchiveContentExclusion("https://github.com/org/repository")).toBeUndefined();
  });

  it("offers deterministic category and tag suggestions without treating them as approval", () => {
    expect(suggestArchiveClassification({ url: "https://github.com/org/tool", title: "Developer API toolkit" })).toEqual({ categorySlug: "developer-tools", tags: ["developer-tools", "engineering"] });
    expect(suggestArchiveClassification({ url: "https://example.com", title: "Figma design kit" }).categorySlug).toBe("design");
  });

  it("normalizes strict root domains through the public suffix list", () => {
    expect(getRegistrableDomain("https://workspace.ecosystemsa.com/modules/vcs")).toBe("ecosystemsa.com");
    expect(getRegistrableDomain("https://docs.platform.example.co.uk/path")).toBe("example.co.uk");
    expect(normalizeTrustedDomain("HTTPS://Sub.EcosystemSA.com/path")).toBe("ecosystemsa.com");
  });

  it("keeps reviewer handoffs bounded and metadata retries limited to failed candidates", () => {
    expect(ARCHIVE_BULK_REVIEW_LIMIT).toBe(25);
    expect(ARCHIVE_METADATA_RETRY_LIMIT).toBe(3);
    expect(mayRetryArchiveCandidate("failed", 0)).toBe(true);
    expect(mayRetryArchiveCandidate("failed", 2)).toBe(true);
    expect(mayRetryArchiveCandidate("failed", 3)).toBe(false);
    expect(mayRetryArchiveCandidate("review_ready", 1)).toBe(false);
  });
});
