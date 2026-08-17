import { describe, expect, it } from "vitest";
import { getArchiveContentExclusion, suggestArchiveClassification } from "./archiveReview";

describe("archive review policy", () => {
  it("excludes video hosts and editorial URLs before moderation", () => {
    expect(getArchiveContentExclusion("https://youtu.be/example")).toBe("video_host");
    expect(getArchiveContentExclusion("https://medium.com/example")).toBe("editorial_content");
    expect(getArchiveContentExclusion("https://blog.google/innovation/example")).toBe("editorial_content");
    expect(getArchiveContentExclusion("https://www.reddit.com/r/example")).toBe("social_or_profile");
    expect(getArchiveContentExclusion("https://vendor.example/blog/product-update")).toBe("editorial_content");
    expect(getArchiveContentExclusion("https://github.com/org/repository")).toBeUndefined();
  });

  it("offers deterministic category and tag suggestions without treating them as approval", () => {
    expect(suggestArchiveClassification({ url: "https://github.com/org/tool", title: "Developer API toolkit" })).toEqual({ categorySlug: "developer-tools", tags: ["developer-tools", "engineering"] });
    expect(suggestArchiveClassification({ url: "https://example.com", title: "Figma design kit" }).categorySlug).toBe("design");
  });
});
