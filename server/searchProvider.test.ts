import { describe, expect, it } from "vitest";
import { evaluateRanking } from "./searchProvider";

describe("search provider evaluation boundary", () => {
  it("calculates deterministic ranking metrics from human-supplied expected resource IDs", () => {
    expect(evaluateRanking([4, 9], [9, 2, 4], 3)).toEqual({ k: 3, expectedCount: 2, resultCount: 3, hits: 2, recallAtK: 1, precisionAtK: 2 / 3, reciprocalRank: 1 });
  });

  it("does not imply relevance when no approved expected resource appears in the ranking", () => {
    expect(evaluateRanking([4], [7, 8], 10)).toMatchObject({ hits: 0, recallAtK: 0, precisionAtK: 0, reciprocalRank: 0 });
  });
});
