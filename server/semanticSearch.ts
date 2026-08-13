import { createHash } from "crypto";

export const SEMANTIC_INDEX_VERSION = "public-resource-v1";

export type ApprovedPublicResourceForIndex = {
  id: number;
  title: string;
  description: string | null;
  categoryName?: string | null;
  subcategoryName?: string | null;
  tags?: string[];
  pricing?: string | null;
};

/**
 * Produces the sole document type eligible for semantic indexing. It accepts
 * only already-approved public resource metadata and deliberately has no path
 * for private workspace notes, user intake text, accounts, or reports.
 */
export function buildPublicSemanticDocument(resource: ApprovedPublicResourceForIndex) {
  const parts = [
    resource.title.trim(),
    resource.description?.trim(),
    resource.categoryName?.trim(),
    resource.subcategoryName?.trim(),
    resource.pricing?.trim(),
    ...(resource.tags ?? []).map((tag) => tag.trim()),
  ].filter((part): part is string => Boolean(part));
  const content = parts.join("\n");
  return {
    resourceId: resource.id,
    indexVersion: SEMANTIC_INDEX_VERSION,
    content,
    documentHash: createHash("sha256").update(content).digest("hex"),
  };
}

export type SemanticProviderRuntime = {
  state: "not_configured" | "configured_unavailable" | "active";
  providerId: string | null;
  canIndex: boolean;
  canSearch: boolean;
};

/**
 * Provider configuration is intentionally server-only. A missing endpoint or
 * credential is a safe, explicit state—not a reason to weaken lexical search.
 */
export function getSemanticProviderRuntime(environment: NodeJS.ProcessEnv = process.env): SemanticProviderRuntime {
  const endpoint = environment.SEMANTIC_SEARCH_ENDPOINT?.trim();
  const apiKey = environment.SEMANTIC_SEARCH_API_KEY?.trim();
  if (!endpoint || !apiKey) return { state: "not_configured", providerId: null, canIndex: false, canSearch: false };
  if (environment.SEMANTIC_SEARCH_HEALTH !== "active") return { state: "configured_unavailable", providerId: environment.SEMANTIC_SEARCH_PROVIDER?.trim() || "semantic", canIndex: false, canSearch: false };
  return { state: "active", providerId: environment.SEMANTIC_SEARCH_PROVIDER?.trim() || "semantic", canIndex: true, canSearch: true };
}

/** A provider result must remain visibly distinct from a verified graph edge. */
export function semanticResultProvenance(runtime: SemanticProviderRuntime) {
  return {
    mode: "semantic" as const,
    providerId: runtime.providerId,
    isVerifiedGraphRelationship: false,
    enabled: runtime.canSearch,
  };
}
