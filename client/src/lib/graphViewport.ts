export type GraphViewport = {
  x: number;
  y: number;
  scale: number;
};

export const MIN_GRAPH_SCALE = 0.72;
export const MAX_GRAPH_SCALE = 1.8;

export function clampGraphScale(value: number) {
  return Math.min(MAX_GRAPH_SCALE, Math.max(MIN_GRAPH_SCALE, value));
}

export function zoomGraphViewport(viewport: GraphViewport, delta: number): GraphViewport {
  return { ...viewport, scale: clampGraphScale(viewport.scale + delta) };
}

export function panGraphViewport(viewport: GraphViewport, deltaX: number, deltaY: number): GraphViewport {
  return { ...viewport, x: viewport.x + deltaX, y: viewport.y + deltaY };
}
