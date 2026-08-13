import { describe, expect, it } from "vitest";
import { filterGraphEdges, getGraphVisibleNodes } from "./graphExplorer";

describe("Graph Explorer helpers", () => {
  const edges = [
    { sourceId: 1, targetId: 2, type: "integrates_with" },
    { sourceId: 1, targetId: 3, type: "alternative_to" },
    { sourceId: 4, targetId: 1, type: "used_by" },
  ];
  const nodes = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];

  it("returns every edge when no relationship-type filter is selected", () => {
    expect(filterGraphEdges(edges, [])).toEqual(edges);
  });

  it("keeps only the selected relationship types", () => {
    expect(filterGraphEdges(edges, ["alternative_to", "used_by"])).toEqual([edges[1], edges[2]]);
  });

  it("derives adjacent nodes without repeating the focus node and respects the display cap", () => {
    expect(getGraphVisibleNodes(1, edges, nodes, 2)).toEqual([{ id: 2 }, { id: 3 }]);
  });
});
