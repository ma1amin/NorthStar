import { searchResourcesAdvanced, type SearchFilters } from "./search";

export type SearchProviderId = "relational" | "external_lexical" | "semantic";
export type SearchProvider = {
  id: SearchProviderId;
  mode: "lexical" | "semantic";
  isConfigured: boolean;
  search: (query: string, limit: number, offset: number, filters?: SearchFilters) => Promise<Array<{ id: number }>>;
};

/** The only active provider. External and semantic providers remain opt-in future adapters. */
export const relationalSearchProvider: SearchProvider = {
  id: "relational",
  mode: "lexical",
  isConfigured: true,
  search: searchResourcesAdvanced,
};

export function evaluateRanking(expectedResourceIds: number[], resultResourceIds: number[], k = 10) {
  const expected = new Set(expectedResourceIds);
  const top = resultResourceIds.slice(0, k);
  const hits = top.filter((id) => expected.has(id)).length;
  return { k, expectedCount: expected.size, resultCount: top.length, hits, recallAtK: expected.size ? hits / expected.size : 0, precisionAtK: top.length ? hits / top.length : 0, reciprocalRank: top.findIndex((id) => expected.has(id)) >= 0 ? 1 / (top.findIndex((id) => expected.has(id)) + 1) : 0 };
}
