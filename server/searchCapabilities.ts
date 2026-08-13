export type SearchMode = "lexical" | "semantic";

import { getSemanticProviderRuntime } from "./semanticSearch";

export type SearchCapabilities = {
  activeProvider: "relational" | "semantic";
  supportedModes: SearchMode[];
  semanticSearchEnabled: boolean;
  externalProviderConfigured: boolean;
  semanticIndexStatus: "not_configured" | "configured_unavailable" | "active";
  semanticProviderId: string | null;
};

/**
 * Stable capability contract for future provider adapters. NorthStar currently
 * uses its relational relationship-aware search service; no external provider
 * or vector index is enabled until configured and independently tested.
 */
export function getSearchCapabilities(environment: NodeJS.ProcessEnv = process.env): SearchCapabilities {
  const semantic = getSemanticProviderRuntime(environment);
  return {
    activeProvider: semantic.canSearch ? "semantic" : "relational",
    supportedModes: semantic.canSearch ? ["lexical", "semantic"] : ["lexical"],
    semanticSearchEnabled: semantic.canSearch,
    externalProviderConfigured: semantic.state !== "not_configured",
    semanticIndexStatus: semantic.state,
    semanticProviderId: semantic.providerId,
  };
}
