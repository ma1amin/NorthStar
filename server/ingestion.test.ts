import { describe, expect, it } from "vitest";
import { assessIngestionCandidate } from "./ingestion";

describe("ingestion provenance boundary", () => {
  it("requires HTTPS and scores provenance completeness without claiming verification", () => {
    expect(assessIngestionCandidate({ url: "http://example.com", sourceType: "official", adapterId: "test" })).toMatchObject({ accepted: false, score: 0 });
    expect(assessIngestionCandidate({ url: "https://example.com", sourceType: "official", attribution: "Example", licenseNote: "Terms reviewed", title: "Example", summary: "A public source", adapterId: "test" })).toMatchObject({ accepted: true, score: 90 });
  });
});
