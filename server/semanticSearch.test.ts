import { describe, expect, it } from "vitest";
import { buildPublicSemanticDocument, getSemanticProviderRuntime, SEMANTIC_INDEX_VERSION, semanticResultProvenance } from "./semanticSearch";

describe("semantic search safety foundation", () => {
  it("builds deterministic documents from approved public resource metadata only", () => {
    const document = buildPublicSemanticDocument({ id: 7, title: "Figma", description: "Collaborative design", categoryName: "Design", subcategoryName: "Interface Design", tags: ["design", "prototype"], pricing: "freemium" });
    expect(document).toMatchObject({ resourceId: 7, indexVersion: SEMANTIC_INDEX_VERSION });
    expect(document.content).toContain("Figma");
    expect(document.content).toContain("prototype");
    expect(document.documentHash).toHaveLength(64);
  });

  it("stays disabled unless a managed endpoint, credential, and active health state are all present", () => {
    expect(getSemanticProviderRuntime({})).toMatchObject({ state: "not_configured", canIndex: false, canSearch: false });
    expect(getSemanticProviderRuntime({ SEMANTIC_SEARCH_ENDPOINT: "https://vector.example", SEMANTIC_SEARCH_API_KEY: "secret" })).toMatchObject({ state: "configured_unavailable", canSearch: false });
    const active = getSemanticProviderRuntime({ SEMANTIC_SEARCH_ENDPOINT: "https://vector.example", SEMANTIC_SEARCH_API_KEY: "secret", SEMANTIC_SEARCH_HEALTH: "active", SEMANTIC_SEARCH_PROVIDER: "qdrant" });
    expect(semanticResultProvenance(active)).toEqual({ mode: "semantic", providerId: "qdrant", isVerifiedGraphRelationship: false, enabled: true });
  });
});
