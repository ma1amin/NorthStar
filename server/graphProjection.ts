export type ApprovedProjectionResource = { id: number; slug: string; title: string; categoryId: number; status: "approved" };
export type ApprovedProjectionRelationship = { id: number; sourceId: number; targetId: number; type: string; status: "approved" };

export function buildApprovedGraphProjection(resources: ApprovedProjectionResource[], relationships: ApprovedProjectionRelationship[]) {
  const approvedIds = new Set(resources.filter((resource) => resource.status === "approved").map((resource) => resource.id));
  return {
    nodes: resources.filter((resource) => resource.status === "approved").map(({ id, slug, title, categoryId }) => ({ id, slug, title, categoryId })),
    edges: relationships.filter((relationship) => relationship.status === "approved" && approvedIds.has(relationship.sourceId) && approvedIds.has(relationship.targetId)).map(({ id, sourceId, targetId, type }) => ({ id, sourceId, targetId, type })),
  };
}

export type GraphProjectionRuntime = { providerId: "neo4j" | "arangodb" | null; state: "not_configured" | "configured_unavailable" | "active"; canProject: boolean; relationalFallback: true };

export function getGraphProjectionRuntime(environment: NodeJS.ProcessEnv = process.env): GraphProjectionRuntime {
  const provider = environment.GRAPH_PROJECTION_PROVIDER === "neo4j" || environment.GRAPH_PROJECTION_PROVIDER === "arangodb" ? environment.GRAPH_PROJECTION_PROVIDER : null;
  if (!provider || !environment.GRAPH_PROJECTION_ENDPOINT?.trim() || !environment.GRAPH_PROJECTION_API_KEY?.trim()) return { providerId: provider, state: "not_configured", canProject: false, relationalFallback: true };
  if (environment.GRAPH_PROJECTION_HEALTH !== "active") return { providerId: provider, state: "configured_unavailable", canProject: false, relationalFallback: true };
  return { providerId: provider, state: "active", canProject: true, relationalFallback: true };
}
