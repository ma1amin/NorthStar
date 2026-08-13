import { getGraphNeighborhood } from "./db";

export type GraphProviderId = "relational" | "neo4j" | "arangodb" | "neptune";
export type GraphProvider = { id: GraphProviderId; isConfigured: boolean; neighborhood: (resourceId: number, relationshipTypes?: string[], maxEdges?: number) => ReturnType<typeof getGraphNeighborhood> };

/** The current provider preserves the bounded, approved-edge relational graph contract. */
export const relationalGraphProvider: GraphProvider = { id: "relational", isConfigured: true, neighborhood: getGraphNeighborhood };

export function isProposalOnlyEnrichment(input: { provenance: string; confidence: number; publishRequested?: boolean }) {
  return !input.publishRequested && input.confidence >= 0 && input.confidence <= 1 && input.provenance.trim().length > 0;
}
