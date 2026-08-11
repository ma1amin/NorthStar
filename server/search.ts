/**
 * Search Service
 * Provides full-text search, fuzzy matching, and relationship-aware query parsing
 * Integrates with Meilisearch for advanced search capabilities
 */

import { getDb } from "./db";
import { resources, relationships, resourceTags, tags } from "../drizzle/schema";
import { eq, and, like, desc, inArray, or, sql } from "drizzle-orm";

export type SearchFilters = {
  categoryId?: number;
  pricing?: "free" | "freemium" | "paid" | "open_source" | "enterprise";
  tag?: string;
};

export function normalizeSearchFilters(filters?: SearchFilters): SearchFilters {
  const categoryId = filters?.categoryId && Number.isInteger(filters.categoryId) && filters.categoryId > 0
    ? filters.categoryId
    : undefined;
  const tag = filters?.tag?.trim().toLowerCase();
  return {
    ...(categoryId ? { categoryId } : {}),
    ...(filters?.pricing ? { pricing: filters.pricing } : {}),
    ...(tag ? { tag } : {}),
  };
}

function buildApprovedResourceConditions(filters?: SearchFilters) {
  const normalized = normalizeSearchFilters(filters);
  const conditions = [eq(resources.status, "approved")];
  if (normalized.categoryId) conditions.push(eq(resources.categoryId, normalized.categoryId));
  if (normalized.pricing) conditions.push(eq(resources.pricing, normalized.pricing));
  if (normalized.tag) {
    conditions.push(sql`exists (
      select 1 from ${resourceTags}
      inner join ${tags} on ${tags.id} = ${resourceTags.tagId}
      where ${resourceTags.resourceId} = ${resources.id}
        and lower(${tags.name}) = ${normalized.tag}
    )`);
  }
  return conditions;
}

/**
 * Parse search query for relationship-aware results
 * Examples:
 * - "Jira alternatives" -> { baseQuery: "Jira", relationshipType: "alternative_to" }
 * - "Slack integrations" -> { baseQuery: "Slack", relationshipType: "integrates_with" }
 * - "GitHub competitors" -> { baseQuery: "GitHub", relationshipType: "competitor_of" }
 */
export function parseRelationshipQuery(query: string): {
  baseQuery: string;
  relationshipType?: "alternative_to" | "similar_to" | "integrates_with" | "built_by" | "maintained_by" | "funded_by" | "used_by" | "depends_on" | "part_of" | "competitor_of";
} {
  const lowerQuery = query.toLowerCase();

  // Map of keywords to relationship types
  const relationshipKeywords: Record<string, string> = {
    alternatives: "alternative_to",
    alternative: "alternative_to",
    similar: "similar_to",
    similar_to: "similar_to",
    integrations: "integrates_with",
    integration: "integrates_with",
    integrates: "integrates_with",
    integrates_with: "integrates_with",
    competitors: "competitor_of",
    competitor: "competitor_of",
    competitor_of: "competitor_of",
    maintainers: "maintained_by",
    maintained: "maintained_by",
    maintained_by: "maintained_by",
    funding: "funded_by",
    funded: "funded_by",
    funded_by: "funded_by",
    users: "used_by",
    used: "used_by",
    used_by: "used_by",
    dependencies: "depends_on",
    dependency: "depends_on",
    depends_on: "depends_on",
    ecosystem: "part_of",
    part_of: "part_of",
  };

  // Check for relationship keywords at the end of the query
  for (const [keyword, relationshipType] of Object.entries(relationshipKeywords)) {
    if (lowerQuery.endsWith(keyword)) {
      const baseQuery = query.substring(0, query.length - keyword.length).trim();
      if (baseQuery.length > 0) {
        return {
          baseQuery,
          relationshipType: relationshipType as "alternative_to" | "similar_to" | "integrates_with" | "built_by" | "maintained_by" | "funded_by" | "used_by" | "depends_on" | "part_of" | "competitor_of",
        };
      }
    }
  }

  return { baseQuery: query };
}

export function shouldFilterBaseResources(query: string) {
  return !parseRelationshipQuery(query).relationshipType;
}

/**
 * Search for resources with optional relationship awareness
 * Supports:
 * - Full-text search on title, description, builtBy
 * - Fuzzy matching
 * - Relationship-aware queries (e.g., "Jira alternatives")
 */
export async function searchResourcesAdvanced(
  query: string,
  limit: number = 50,
  offset: number = 0,
  filters?: SearchFilters
) {
  const db = await getDb();
  if (!db) return [];

  // Parse query for relationship awareness
  const parsed = parseRelationshipQuery(query);
  const baseQuery = parsed.baseQuery;
  const relationshipType = parsed.relationshipType as any;

  // Step 1: Find base resource by title/description
  const approvedConditions = buildApprovedResourceConditions(filters);
  const baseLookupConditions = shouldFilterBaseResources(query)
    ? approvedConditions
    : [eq(resources.status, "approved")];
  let baseResources = await db
    .select()
    .from(resources)
    .where(
      and(
        ...baseLookupConditions,
        or(
          like(resources.title, `%${baseQuery}%`),
          like(resources.description, `%${baseQuery}%`),
          like(resources.builtBy, `%${baseQuery}%`)
        )
      )
    )
    .orderBy(desc(resources.upvotes))
    .limit(Math.min(Math.max(limit + offset, 10), 100));

  let usedFuzzyFallback = false;
  if (baseResources.length === 0) {
    const fuzzyMatches = await fuzzySearchResources(baseQuery, Math.min(Math.max(limit + offset, 10), 50));
    const normalized = normalizeSearchFilters(filters);
    baseResources = fuzzyMatches.filter((resource) => {
      if (relationshipType) return true;
      if (normalized.tag) return false;
      return (!normalized.categoryId || resource.categoryId === normalized.categoryId)
        && (!normalized.pricing || resource.pricing === normalized.pricing);
    });
    usedFuzzyFallback = baseResources.length > 0;
  }

  if (baseResources.length === 0) {
    return [];
  }

  // If no relationship type specified, return base resources
  if (!relationshipType) {
    return usedFuzzyFallback ? baseResources.slice(offset, offset + limit) : baseResources.slice(offset, offset + limit);
  }

  // Step 2: If relationship type specified, find related resources
  const relatedResourceIds = new Set<number>();

  for (const baseResource of baseResources) {
    // Get relationships where this resource is the target
    // (e.g., for "Jira alternatives", find resources that are alternatives TO Jira)
    if (relationshipType) {
      const rels = await db
        .select()
        .from(relationships)
        .where(
          and(
            eq(relationships.targetId, baseResource.id),
            eq(relationships.type, relationshipType as "alternative_to" | "similar_to" | "integrates_with" | "built_by" | "maintained_by" | "funded_by" | "used_by" | "depends_on" | "part_of" | "competitor_of"),
            eq(relationships.status, "approved")
          )
        )
        .orderBy(desc(relationships.upvotes));

      rels.forEach((relationship) => relatedResourceIds.add(relationship.sourceId));
    }
  }

  if (relatedResourceIds.size === 0) {
    return [];
  }

  // Step 3: Fetch related resources
  const relatedResources = await db
    .select()
    .from(resources)
    .where(
      and(...approvedConditions, inArray(resources.id, Array.from(relatedResourceIds)))
    )
    .orderBy(desc(resources.upvotes))
    .limit(limit)
    .offset(offset);

  return relatedResources;
}

/**
 * Fuzzy search on resource titles
 * Returns resources with similar titles (useful for autocomplete/suggestions)
 */
export function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= right.length; column += 1) {
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
    for (let index = 0; index < current.length; index += 1) previous[index] = current[index];
  }
  return previous[right.length];
}

function fuzzyWordScore(word: string, text: string, directScore: number) {
  if (text.includes(word)) return directScore;
  if (word.length < 3) return 0;
  const threshold = word.length <= 5 ? 1 : 2;
  const tokenDistance = text.split(/[^a-z0-9]+/).filter(Boolean).reduce((best, token) => Math.min(best, editDistance(word, token)), Number.POSITIVE_INFINITY);
  return tokenDistance <= threshold ? Math.max(1, directScore - tokenDistance - 1) : 0;
}

export async function fuzzySearchResources(
  query: string,
  limit: number = 10
) {
  const db = await getDb();
  if (!db) return [];

  // Simple fuzzy matching: split query into words and match each
  const words = query.toLowerCase().split(/\s+/);

  const results = await db
    .select()
    .from(resources)
    .where(eq(resources.status, "approved"))
    .orderBy(desc(resources.upvotes))
    .limit(limit * 2); // Get more to filter

  // Score direct and bounded typo-tolerant word matches.
  const scored = results
    .map((r) => {
      let score = 0;
      const titleLower = r.title.toLowerCase();
      const descLower = (r.description || "").toLowerCase();

      for (const word of words) {
        score += fuzzyWordScore(word, titleLower, 4);
        score += fuzzyWordScore(word, descLower, 1);
      }

      return { resource: r, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.resource);
}

/**
 * Get search suggestions based on partial query
 * Returns:
 * - Matching resource titles
 * - Matching categories
 * - Suggested relationship queries
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 5
) {
  const db = await getDb();
  if (!db) return { resources: [], suggestions: [] };

  const lowerQuery = query.toLowerCase();

  // Get matching resources
  const matchingResources = await db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.status, "approved"),
        like(resources.title, `%${query}%`)
      )
    )
    .orderBy(desc(resources.upvotes))
    .limit(limit);

  // Generate relationship suggestions
  const relationshipSuggestions = [
    `${query} alternatives`,
    `${query} integrations`,
    `${query} competitors`,
    `${query} maintainers`,
    `${query} funding`,
    `${query} users`,
    `similar to ${query}`,
  ];

  return {
    resources: matchingResources.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
    })),
    suggestions: relationshipSuggestions.slice(0, limit),
  };
}

/**
 * Get trending searches (based on resource popularity)
 */
export async function getTrendingSearches(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];

  const trending = await db
    .select()
    .from(resources)
    .where(eq(resources.status, "approved"))
    .orderBy(desc(resources.upvotes))
    .limit(limit);

  return trending.map((r) => r.title);
}

/**
 * Advanced search with filters
 */
export async function advancedSearch(
  query: string,
  filters: {
    categoryId?: number;
    subcategoryId?: number;
    pricing?: string[];
    tags?: string[];
    minUpvotes?: number;
  },
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(resources.status, "approved"),
    like(resources.title, `%${query}%`),
  ];

  if (filters.categoryId) {
    conditions.push(eq(resources.categoryId, filters.categoryId));
  }

  if (filters.subcategoryId) {
    conditions.push(eq(resources.subcategoryId, filters.subcategoryId));
  }

  if (filters.pricing && filters.pricing.length > 0) {
    conditions.push(inArray(resources.pricing, filters.pricing as ("free" | "freemium" | "paid" | "open_source" | "enterprise")[]));
  }

  if (filters.minUpvotes) {
    // Note: Use drizzle-orm's gte function for proper SQL generation
    // conditions.push(gte(resources.upvotes, filters.minUpvotes));
  }

  return db
    .select()
    .from(resources)
    .where(and(...conditions))
    .orderBy(desc(resources.upvotes))
    .limit(limit)
    .offset(offset);
}

/**
 * Calculate relationship strength between two resources
 * Considers:
 * - Direct relationship strength
 * - Community votes on the relationship
 * - Verified status
 */
export async function calculateRelationshipStrength(
  sourceId: number,
  targetId: number,
  relationshipType: string
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const rel = await db
    .select()
    .from(relationships)
    .where(
      and(
        eq(relationships.sourceId, sourceId),
        eq(relationships.targetId, targetId),
        eq(relationships.type, relationshipType as "alternative_to" | "similar_to" | "integrates_with" | "built_by" | "maintained_by" | "funded_by" | "used_by" | "depends_on" | "part_of" | "competitor_of")
      )
    )
    .limit(1);

  if (rel.length === 0) return 0;

  const relationship = rel[0];
  let strength = parseFloat(relationship.strength.toString());

  // Boost strength based on verification
  if (relationship.verified) {
    strength = Math.min(1, strength + 0.1);
  }

  // Boost strength based on upvotes (normalized)
  const voteBoost = Math.min(0.2, relationship.upvotes * 0.01);
  strength = Math.min(1, strength + voteBoost);

  return strength;
}



/**
 * Search service object for tRPC integration
 */
export const searchService = {
  advancedSearch: async (query: string, limit: number = 50, offset: number = 0, filters?: SearchFilters) => {
    return searchResourcesAdvanced(query, limit, offset, filters);
  },
  getSuggestions: getSearchSuggestions,
  getTrending: getTrendingSearches,
};
