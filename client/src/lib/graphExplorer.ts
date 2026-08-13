export type GraphEdgeLike = {
  sourceId: number;
  targetId: number;
  type: string;
};

export type GraphNodeLike = {
  id: number;
};

export function filterGraphEdges<T extends GraphEdgeLike>(edges: T[], selectedTypes: string[]) {
  if (selectedTypes.length === 0) return edges;
  return edges.filter((edge) => selectedTypes.includes(edge.type));
}

export function getGraphVisibleNodes<T extends GraphNodeLike>(centerId: number, edges: GraphEdgeLike[], nodes: T[], maxNodes = 12) {
  const adjacentIds = new Set(edges.flatMap((edge) => [edge.sourceId, edge.targetId]));
  adjacentIds.delete(centerId);
  return nodes.filter((node) => adjacentIds.has(node.id)).slice(0, maxNodes);
}
