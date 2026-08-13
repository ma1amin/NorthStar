import { describe, expect, it } from "vitest";
import { isProposalOnlyEnrichment, relationalGraphProvider } from "./graphProvider";

describe("graph provider and enrichment boundary", () => {
  it("keeps the relational graph as the only configured provider", () => expect(relationalGraphProvider).toMatchObject({ id: "relational", isConfigured: true }));
  it("rejects AI enrichment inputs that request publication or omit provenance", () => {
    expect(isProposalOnlyEnrichment({ provenance: "Input metadata only", confidence: 0.4 })).toBe(true);
    expect(isProposalOnlyEnrichment({ provenance: "", confidence: 0.4 })).toBe(false);
    expect(isProposalOnlyEnrichment({ provenance: "Input metadata only", confidence: 0.4, publishRequested: true })).toBe(false);
  });
});
