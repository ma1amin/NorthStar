import { describe, expect, it } from "vitest";
import { buildApprovedGraphProjection, getGraphProjectionRuntime } from "./graphProjection";

describe("graph projection readiness", () => {
  it("projects only approved resources and edges whose endpoints remain approved", () => {
    const projection = buildApprovedGraphProjection([
      { id: 1, slug: "figma", title: "Figma", categoryId: 1, status: "approved" },
      { id: 2, slug: "draft", title: "Draft", categoryId: 1, status: "approved" },
    ], [
      { id: 1, sourceId: 1, targetId: 2, type: "integrates_with", status: "approved" },
      { id: 2, sourceId: 1, targetId: 3, type: "similar_to", status: "approved" },
    ]);
    expect(projection.nodes).toHaveLength(2);
    expect(projection.edges).toEqual([{ id: 1, sourceId: 1, targetId: 2, type: "integrates_with" }]);
  });

  it("keeps relational fallback active when graph-service credentials are absent", () => {
    expect(getGraphProjectionRuntime({ GRAPH_PROJECTION_PROVIDER: "neo4j" })).toEqual({ providerId: "neo4j", state: "not_configured", canProject: false, relationalFallback: true });
  });
});
