export type SearchMode = "lexical" | "semantic";

export type SearchCapabilities = {
  activeProvider: "relational";
  supportedModes: SearchMode[];
  semanticSearchEnabled: false;
  externalProviderConfigured: false;
  semanticIndexStatus: "not_configured";
};

/**
 * Stable capability contract for future provider adapters. NorthStar currently
 * uses its relational relationship-aware search service; no external provider
 * or vector index is enabled until configured and independently tested.
 */
export function getSearchCapabilities(): SearchCapabilities {
  return {
    activeProvider: "relational",
    supportedModes: ["lexical"],
    semanticSearchEnabled: false,
    externalProviderConfigured: false,
    semanticIndexStatus: "not_configured",
  };
}
