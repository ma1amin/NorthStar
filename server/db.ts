import { eq, and, or, like, desc, asc, inArray, isNull, sql, gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { alias } from "drizzle-orm/mysql-core";
import {
  InsertUser,
  users,
  resources,
  relationships,
  votes,
  bookmarks,
  collections,
  collectionResources,
  submissions,
  categories,
  subcategories,
  tags,
  resourceTags,
  auditLogs,
  searchAnalytics,
  searchEvaluationCases,
  resourceReports,
  resourceEditSuggestions,
  reputationEvents,
  resourceSources,
  resourceHistory,
  resourceFreshnessReviews,
  resourceDuplicateResolutions,
  apiKeys,
  apiKeyDailyUsage,
  archiveImportBatches,
  archiveImportCandidates,
  trustedSourceDomains,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { ARCHIVE_METADATA_RETRY_LIMIT } from "./archiveReview";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "avatar", "bio"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export type PiiFreeArchiveCandidateInput = {
  candidateHash: string;
  url: string;
  registrableDomain?: string;
  canonicalUrl?: string;
  title?: string;
  description?: string;
  builtBy?: string;
  builtByUrl?: string;
  suggestedPricing?: "free" | "freemium" | "paid" | "open_source" | "enterprise";
  suggestedLicense?: string;
  suggestedTags?: string[];
  officialSourceUrl?: string;
  duplicateResourceId?: number;
  status: "review_ready" | "duplicate" | "excluded" | "failed";
  failureCode?: string;
};

export async function createPiiFreeArchiveImportBatch(input: {
  totalUrlMentions: number;
  rejectedUrlMentions: number;
  candidates: PiiFreeArchiveCandidateInput[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [batch] = await db.insert(archiveImportBatches).values({
    status: "review_ready",
    totalUrlMentions: input.totalUrlMentions,
    uniqueCandidates: input.candidates.length,
    rejectedUrlMentions: input.rejectedUrlMentions,
  }).$returningId();
  if (!batch) throw new Error("Unable to create archive import batch");

  if (input.candidates.length) {
    await db.insert(archiveImportCandidates).values(input.candidates.map((candidate) => ({ ...candidate, batchId: batch.id })));
  }
  return batch.id;
}

export async function getPiiFreeArchiveImportBatch(batchId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [batch] = await db.select().from(archiveImportBatches).where(eq(archiveImportBatches.id, batchId)).limit(1);
  if (!batch) return undefined;
  const candidates = await db.select().from(archiveImportCandidates).where(eq(archiveImportCandidates.batchId, batchId)).orderBy(asc(archiveImportCandidates.id));
  return { batch, candidates };
}

export async function getPiiFreeArchiveCandidate(candidateId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const [candidate] = await db.select().from(archiveImportCandidates).where(eq(archiveImportCandidates.id, candidateId)).limit(1);
  return candidate;
}

export async function updatePiiFreeArchiveCandidateDomain(candidateId: number, registrableDomain: string) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(archiveImportCandidates).set({ registrableDomain }).where(eq(archiveImportCandidates.id, candidateId));
  return (result[0] as { affectedRows?: number } | undefined)?.affectedRows === 1;
}

export async function listFailedPiiFreeArchiveCandidates(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(archiveImportCandidates)
    .where(eq(archiveImportCandidates.status, "failed"))
    .orderBy(asc(archiveImportCandidates.lastRetryAt), asc(archiveImportCandidates.id))
    .limit(Math.min(Math.max(limit, 1), 50));
}

export async function beginPiiFreeArchiveCandidateRetry(candidateId: number, maxRetries: number = ARCHIVE_METADATA_RETRY_LIMIT) {
  const db = await getDb();
  if (!db) return undefined;
  const [candidate] = await db.select().from(archiveImportCandidates).where(eq(archiveImportCandidates.id, candidateId)).limit(1);
  if (!candidate || candidate.status !== "failed" || candidate.retryCount >= maxRetries) return undefined;
  const lastRetryAt = new Date();
  const result = await db.update(archiveImportCandidates)
    .set({ retryCount: candidate.retryCount + 1, lastRetryAt })
    .where(and(eq(archiveImportCandidates.id, candidateId), eq(archiveImportCandidates.status, "failed"), eq(archiveImportCandidates.retryCount, candidate.retryCount)));
  if ((result[0] as { affectedRows?: number } | undefined)?.affectedRows !== 1) return undefined;
  return { ...candidate, retryCount: candidate.retryCount + 1, lastRetryAt };
}

export async function markPiiFreeArchiveCandidateSubmitted(input: { candidateId: number; submissionId: number }) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(archiveImportCandidates)
    .set({ status: "submitted", submissionId: input.submissionId })
    .where(and(eq(archiveImportCandidates.id, input.candidateId), eq(archiveImportCandidates.status, "review_ready")));
  return (result[0] as { affectedRows?: number } | undefined)?.affectedRows === 1;
}

export async function excludePiiFreeArchiveCandidate(input: { candidateId: number; reason: "video_host" | "editorial_content" | "social_or_profile" | "google_workspace" | "luma_calendar" | "meeting_link" | "direct_document" }) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(archiveImportCandidates)
    .set({ status: "excluded", failureCode: input.reason })
    .where(and(eq(archiveImportCandidates.id, input.candidateId), eq(archiveImportCandidates.status, "review_ready")));
  return (result[0] as { affectedRows?: number } | undefined)?.affectedRows === 1;
}

export type ArchiveCandidateEnrichmentInput = {
  candidateId: number;
  canonicalUrl?: string | null;
  title?: string | null;
  description?: string | null;
  officialSourceUrl?: string | null;
  duplicateResourceId?: number | null;
  metadataVerificationStatus?: "unverified" | "public_page_fetched" | "reviewed";
  metadataFetchedAt?: Date | null;
  status: "review_ready" | "duplicate" | "excluded" | "failed";
  failureCode?: string;
};

export function buildArchiveCandidateEnrichmentPatch(input: ArchiveCandidateEnrichmentInput): Partial<typeof archiveImportCandidates.$inferInsert> {
  const values: Partial<typeof archiveImportCandidates.$inferInsert> = {
    status: input.status,
    failureCode: input.failureCode ?? null,
  };
  if (input.canonicalUrl !== undefined) values.canonicalUrl = input.canonicalUrl;
  if (input.title !== undefined) values.title = input.title;
  if (input.description !== undefined) values.description = input.description;
  if (input.officialSourceUrl !== undefined) values.officialSourceUrl = input.officialSourceUrl;
  if (input.duplicateResourceId !== undefined) values.duplicateResourceId = input.duplicateResourceId;
  if (input.metadataVerificationStatus !== undefined) values.metadataVerificationStatus = input.metadataVerificationStatus;
  if (input.metadataFetchedAt !== undefined) values.metadataFetchedAt = input.metadataFetchedAt;
  return values;
}

export async function updatePiiFreeArchiveCandidateEnrichment(input: ArchiveCandidateEnrichmentInput) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(archiveImportCandidates)
    .set(buildArchiveCandidateEnrichmentPatch(input))
    .where(eq(archiveImportCandidates.id, input.candidateId));
  return (result[0] as { affectedRows?: number } | undefined)?.affectedRows === 1;
}

export async function listPiiFreeArchiveImportBatches(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(archiveImportBatches).orderBy(desc(archiveImportBatches.createdAt)).limit(Math.min(Math.max(limit, 1), 100));
}

/** Aggregate-only status history; intentionally contains no contributor or artifact identity. */
export async function listPiiFreeArchiveImportHistory(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  const batches = await listPiiFreeArchiveImportBatches(limit);
  if (!batches.length) return [];
  const rows = await db.select({ batchId: archiveImportCandidates.batchId, status: archiveImportCandidates.status, count: sql<number>`count(*)` })
    .from(archiveImportCandidates)
    .where(inArray(archiveImportCandidates.batchId, batches.map((batch) => batch.id)))
    .groupBy(archiveImportCandidates.batchId, archiveImportCandidates.status);
  const counts = new Map<number, Record<string, number>>();
  for (const row of rows) counts.set(row.batchId, { ...(counts.get(row.batchId) ?? {}), [row.status]: Number(row.count) });
  return batches.map((batch) => ({
    ...batch,
    statusCounts: {
      reviewReady: counts.get(batch.id)?.review_ready ?? 0,
      excluded: counts.get(batch.id)?.excluded ?? 0,
      submitted: counts.get(batch.id)?.submitted ?? 0,
      retryNeeded: counts.get(batch.id)?.failed ?? 0,
    },
  }));
}

export async function listTrustedSourceDomains(includeDisabled: boolean = false) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(trustedSourceDomains);
  return includeDisabled
    ? query.orderBy(asc(trustedSourceDomains.domain))
    : query.where(eq(trustedSourceDomains.status, "active")).orderBy(asc(trustedSourceDomains.domain));
}

export async function createTrustedSourceDomain(input: { domain: string; note?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(trustedSourceDomains).values({ domain: input.domain, note: input.note?.trim() || undefined });
  return result[0].insertId;
}

export async function updateTrustedSourceDomain(input: { id: number; status: "active" | "disabled"; note?: string }) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(trustedSourceDomains).set({ status: input.status, note: input.note?.trim() || null }).where(eq(trustedSourceDomains.id, input.id));
  return (result[0] as { affectedRows?: number } | undefined)?.affectedRows === 1;
}

// Resources
export type ResourceListOptions = {
  limit?: number;
  offset?: number;
  query?: string;
  categoryId?: number;
  subcategoryId?: number;
  pricing?: "free" | "freemium" | "paid" | "open_source" | "enterprise";
  tag?: string;
  sort?: "popular" | "newest";
};

export async function listApprovedResources(options: ResourceListOptions = {}) {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const offset = Math.max(options.offset ?? 0, 0);
  const conditions = [eq(resources.status, "approved"), isNull(resources.canonicalResourceId)];

  if (options.query?.trim()) {
    const query = `%${options.query.trim()}%`;
    conditions.push(
      or(
        like(resources.title, query),
        like(resources.description, query),
        like(resources.builtBy, query)
      ) as any
    );
  }

  if (options.categoryId !== undefined) {
    conditions.push(eq(resources.categoryId, options.categoryId));
  }
  if (options.subcategoryId !== undefined) {
    conditions.push(eq(resources.subcategoryId, options.subcategoryId));
  }
  if (options.pricing !== undefined) {
    conditions.push(eq(resources.pricing, options.pricing));
  }
  if (options.tag?.trim()) {
    conditions.push(
      sql`exists (
        select 1 from ${resourceTags}
        inner join ${tags} on ${tags.id} = ${resourceTags.tagId}
        where ${resourceTags.resourceId} = ${resources.id}
          and lower(${tags.name}) = lower(${options.tag.trim()})
      )`
    );
  }

  const whereClause = and(...conditions);
  const [items, countRows] = await Promise.all([
    db
      .select({
        id: resources.id,
        title: resources.title,
        slug: resources.slug,
        description: resources.description,
        url: resources.url,
        categoryId: resources.categoryId,
        categoryName: categories.name,
        subcategoryId: resources.subcategoryId,
        subcategoryName: subcategories.name,
        logo: resources.logo,
        pricing: resources.pricing,
        license: resources.license,
        builtBy: resources.builtBy,
        builtByUrl: resources.builtByUrl,
        upvotes: resources.upvotes,
        views: resources.views,
        featured: resources.featured,
        createdAt: resources.createdAt,
        updatedAt: resources.updatedAt,
      })
      .from(resources)
      .leftJoin(categories, eq(resources.categoryId, categories.id))
      .leftJoin(subcategories, eq(resources.subcategoryId, subcategories.id))
      .where(whereClause)
      .orderBy(
        desc(resources.featured),
        ...(options.sort === "newest"
          ? [desc(resources.createdAt), desc(resources.upvotes)]
          : [desc(resources.upvotes), desc(resources.createdAt)])
      )
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(resources).where(whereClause),
  ]);

  return {
    items,
    total: Number(countRows[0]?.count ?? 0),
  };
}

export async function getApprovedResources(limit: number = 50, offset: number = 0) {
  const result = await listApprovedResources({ limit, offset });
  return result.items;
}

export async function getResourceBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(resources).where(eq(resources.slug, slug)).limit(1);
  const resource = result[0];
  if (!resource) return undefined;
  if (resource.canonicalResourceId) return getResourceById(resource.canonicalResourceId);
  return resource;
}

export async function getResourceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Resource trust, provenance, freshness, and history
export async function getApprovedResourceSources(resourceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: resourceSources.id, url: resourceSources.url, sourceType: resourceSources.sourceType, attribution: resourceSources.attribution, licenseNote: resourceSources.licenseNote, capturedAt: resourceSources.capturedAt, verifiedAt: resourceSources.verifiedAt })
    .from(resourceSources)
    .where(and(eq(resourceSources.resourceId, resourceId), eq(resourceSources.verificationStatus, "approved")))
    .orderBy(desc(resourceSources.verifiedAt), desc(resourceSources.capturedAt));
}

export async function getPublicResourceHistory(resourceId: number, limit: number = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: resourceHistory.id, eventType: resourceHistory.eventType, summary: resourceHistory.summary, changes: resourceHistory.changes, createdAt: resourceHistory.createdAt })
    .from(resourceHistory)
    .where(and(eq(resourceHistory.resourceId, resourceId), eq(resourceHistory.isPublic, true)))
    .orderBy(desc(resourceHistory.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100));
}

export async function getLatestResourceFreshness(resourceId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(resourceFreshnessReviews).where(eq(resourceFreshnessReviews.resourceId, resourceId)).orderBy(desc(resourceFreshnessReviews.checkedAt)).limit(1);
  return rows[0];
}

export async function createResourceSource(input: { resourceId: number; url: string; sourceType: "official" | "documentation" | "repository" | "community" | "archive" | "other"; attribution?: string; licenseNote?: string; addedBy: number }) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(resourceSources).values({ ...input, attribution: input.attribution || null, licenseNote: input.licenseNote || null });
  return result[0].insertId;
}

export async function reviewResourceSource(input: { sourceId: number; reviewerId: number; status: "approved" | "rejected" | "superseded" }) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(resourceSources).where(and(eq(resourceSources.id, input.sourceId), eq(resourceSources.verificationStatus, "pending"))).limit(1);
  const source = rows[0];
  if (!source) return undefined;
  const result = await db.update(resourceSources).set({ verificationStatus: input.status, verifiedBy: input.reviewerId, verifiedAt: new Date() }).where(and(eq(resourceSources.id, input.sourceId), eq(resourceSources.verificationStatus, "pending")));
  if (Number((result as any)[0]?.affectedRows ?? 0) < 1) return undefined;
  return source;
}

export async function recordResourceHistory(input: { resourceId: number; eventType: "resource_created" | "metadata_updated" | "source_verified" | "freshness_checked" | "duplicate_resolution_proposed" | "duplicate_resolution_confirmed"; summary: string; changes?: Record<string, unknown>; isPublic?: boolean; recordedBy: number }) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(resourceHistory).values({ ...input, changes: input.changes, isPublic: input.isPublic ?? true });
  return result[0].insertId;
}

export async function createFreshnessReview(input: { resourceId: number; status: "current" | "needs_review" | "stale"; note?: string; checkedBy: number }) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(resourceFreshnessReviews).values({ ...input, note: input.note || null });
  return result[0].insertId;
}

export async function previewDuplicateResolution(input: { duplicateResourceId: number; canonicalResourceId: number }) {
  const db = await getDb();
  if (!db || input.duplicateResourceId === input.canonicalResourceId) return undefined;
  const rows = await db.select({ id: resources.id, title: resources.title, slug: resources.slug, status: resources.status, canonicalResourceId: resources.canonicalResourceId }).from(resources).where(inArray(resources.id, [input.duplicateResourceId, input.canonicalResourceId]));
  const duplicate = rows.find((row) => row.id === input.duplicateResourceId);
  const canonical = rows.find((row) => row.id === input.canonicalResourceId);
  if (!duplicate || !canonical || duplicate.status !== "approved" || canonical.status !== "approved" || duplicate.canonicalResourceId) return undefined;
  const [relationshipCount, bookmarkCount, collectionCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(relationships).where(or(eq(relationships.sourceId, duplicate.id), eq(relationships.targetId, duplicate.id))),
    db.select({ count: sql<number>`count(*)` }).from(bookmarks).where(eq(bookmarks.resourceId, duplicate.id)),
    db.select({ count: sql<number>`count(*)` }).from(collectionResources).where(eq(collectionResources.resourceId, duplicate.id)),
  ]);
  const existing = await db.select().from(resourceDuplicateResolutions).where(and(eq(resourceDuplicateResolutions.duplicateResourceId, duplicate.id), eq(resourceDuplicateResolutions.canonicalResourceId, canonical.id))).limit(1);
  return { duplicate, canonical, existing: existing[0], impact: { relationshipCount: Number(relationshipCount[0]?.count ?? 0), bookmarkCount: Number(bookmarkCount[0]?.count ?? 0), collectionCount: Number(collectionCount[0]?.count ?? 0), strategy: "Alias confirmation preserves the original resource and all linked community records; no referenced record is deleted or silently rewritten." } };
}

export async function createDuplicateResolutionProposal(input: { duplicateResourceId: number; canonicalResourceId: number; rationale: string; createdBy: number }) {
  const db = await getDb();
  if (!db) return { created: false, id: undefined };
  const preview = await previewDuplicateResolution(input);
  if (!preview || preview.existing) return { created: false, id: undefined };
  const result = await db.insert(resourceDuplicateResolutions).values(input);
  return { created: true, id: result[0].insertId, preview };
}

export async function confirmDuplicateResolution(input: { resolutionId: number; reviewerId: number; reviewNote?: string }) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(resourceDuplicateResolutions).where(and(eq(resourceDuplicateResolutions.id, input.resolutionId), eq(resourceDuplicateResolutions.status, "proposed"))).limit(1);
  const resolution = rows[0];
  if (!resolution) return undefined;
  const preview = await previewDuplicateResolution({ duplicateResourceId: resolution.duplicateResourceId, canonicalResourceId: resolution.canonicalResourceId });
  if (!preview) return undefined;
  const alias = await db.update(resources).set({ canonicalResourceId: resolution.canonicalResourceId }).where(and(eq(resources.id, resolution.duplicateResourceId), isNull(resources.canonicalResourceId)));
  if (Number((alias as any)[0]?.affectedRows ?? 0) < 1) return undefined;
  const updated = await db.update(resourceDuplicateResolutions).set({ status: "confirmed", reviewedBy: input.reviewerId, reviewNote: input.reviewNote || null, reviewedAt: new Date() }).where(and(eq(resourceDuplicateResolutions.id, input.resolutionId), eq(resourceDuplicateResolutions.status, "proposed")));
  if (Number((updated as any)[0]?.affectedRows ?? 0) < 1) return undefined;
  return { resolution, preview };
}

export async function getPendingResourceSources(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: resourceSources.id,
      resourceId: resourceSources.resourceId,
      url: resourceSources.url,
      sourceType: resourceSources.sourceType,
      attribution: resourceSources.attribution,
      licenseNote: resourceSources.licenseNote,
      capturedAt: resourceSources.capturedAt,
      resourceTitle: resources.title,
      resourceSlug: resources.slug,
      contributorName: users.name,
    })
    .from(resourceSources)
    .innerJoin(resources, eq(resourceSources.resourceId, resources.id))
    .innerJoin(users, eq(resourceSources.addedBy, users.id))
    .where(eq(resourceSources.verificationStatus, "pending"))
    .orderBy(desc(resourceSources.capturedAt))
    .limit(Math.min(Math.max(limit, 1), 100))
    .offset(Math.max(offset, 0));
}

export async function getFreshnessReviewQueue(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      resourceId: resources.id,
      resourceTitle: resources.title,
      resourceSlug: resources.slug,
      resourceUrl: resources.url,
      lastReviewedAt: sql<Date | null>`max(${resourceFreshnessReviews.checkedAt})`,
      latestStatus: sql<"current" | "needs_review" | "stale" | null>`substring_index(group_concat(${resourceFreshnessReviews.status} order by ${resourceFreshnessReviews.checkedAt} desc), ',', 1)`,
    })
    .from(resources)
    .leftJoin(resourceFreshnessReviews, eq(resourceFreshnessReviews.resourceId, resources.id))
    .where(and(eq(resources.status, "approved"), isNull(resources.canonicalResourceId)))
    .groupBy(resources.id, resources.title, resources.slug, resources.url)
    .orderBy(sql`case when max(${resourceFreshnessReviews.checkedAt}) is null then 0 else 1 end`, sql`max(${resourceFreshnessReviews.checkedAt}) asc`)
    .limit(Math.min(Math.max(limit, 1), 100))
    .offset(Math.max(offset, 0));
}

export async function runFreshnessReviewSweep(input: { checkedBy: number; reviewAfterDays?: number; limit?: number; now?: Date }) {
  const reviewAfterDays = Math.min(Math.max(input.reviewAfterDays ?? 90, 30), 365);
  const now = input.now ?? new Date();
  const cutoff = now.getTime() - reviewAfterDays * 86_400_000;
  const candidates = await getFreshnessReviewQueue(Math.min(Math.max(input.limit ?? 50, 1), 100), 0);
  const overdue = candidates.filter((candidate) => {
    const reviewedAt = candidate.lastReviewedAt ? new Date(candidate.lastReviewedAt).getTime() : 0;
    return (reviewedAt === 0 || reviewedAt < cutoff) && candidate.latestStatus !== "needs_review" && candidate.latestStatus !== "stale";
  });
  for (const candidate of overdue) {
    await createFreshnessReview({ resourceId: candidate.resourceId, checkedBy: input.checkedBy, status: "needs_review", note: `Queued after ${reviewAfterDays} days without a current freshness review. Human verification is required before changing any public resource data.` });
    await recordResourceHistory({ resourceId: candidate.resourceId, recordedBy: input.checkedBy, eventType: "freshness_checked", summary: "Resource queued for human freshness verification.", isPublic: false });
  }
  return { reviewAfterDays, scanned: candidates.length, queued: overdue.length, resourceIds: overdue.map((candidate) => candidate.resourceId) };
}

export async function getProposedDuplicateResolutions(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  const duplicateResource = alias(resources, "duplicate_resource");
  const canonicalResource = alias(resources, "canonical_resource");
  return db
    .select({
      id: resourceDuplicateResolutions.id,
      duplicateResourceId: resourceDuplicateResolutions.duplicateResourceId,
      canonicalResourceId: resourceDuplicateResolutions.canonicalResourceId,
      rationale: resourceDuplicateResolutions.rationale,
      createdAt: resourceDuplicateResolutions.createdAt,
      duplicateTitle: duplicateResource.title,
      duplicateSlug: duplicateResource.slug,
      canonicalTitle: canonicalResource.title,
      canonicalSlug: canonicalResource.slug,
      proposerName: users.name,
    })
    .from(resourceDuplicateResolutions)
    .innerJoin(duplicateResource, eq(resourceDuplicateResolutions.duplicateResourceId, duplicateResource.id))
    .innerJoin(canonicalResource, eq(resourceDuplicateResolutions.canonicalResourceId, canonicalResource.id))
    .innerJoin(users, eq(resourceDuplicateResolutions.createdBy, users.id))
    .where(eq(resourceDuplicateResolutions.status, "proposed"))
    .orderBy(desc(resourceDuplicateResolutions.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100))
    .offset(Math.max(offset, 0));
}

export async function getResourcesByCategory(categoryId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(resources)
    .where(and(eq(resources.categoryId, categoryId), eq(resources.status, "approved"), isNull(resources.canonicalResourceId)))
    .orderBy(desc(resources.upvotes))
    .limit(limit)
    .offset(offset);
}

export async function searchResources(query: string, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(resources)
    .where(
      and(
        eq(resources.status, "approved"),
        or(
          like(resources.title, `%${query}%`),
          like(resources.description, `%${query}%`),
          like(resources.builtBy, `%${query}%`)
        )
      )
    )
    .orderBy(desc(resources.upvotes))
    .limit(limit)
    .offset(offset);
}

// Relationships
export async function getRelationshipsBySource(sourceId: number, type?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(relationships.sourceId, sourceId),
    eq(relationships.status, "approved"),
  ];

  if (type) {
    conditions.push(eq(relationships.type, type as any));
  }

  const relationshipRows = await db
    .select()
    .from(relationships)
    .where(and(...conditions))
    .orderBy(desc(relationships.upvotes));

  if (relationshipRows.length === 0) return [];

  const targetRows = await db
    .select({
      id: resources.id,
      title: resources.title,
      slug: resources.slug,
      logo: resources.logo,
      description: resources.description,
      pricing: resources.pricing,
    })
    .from(resources)
    .where(inArray(resources.id, relationshipRows.map((row) => row.targetId)));
  const targetById = new Map(targetRows.map((row) => [row.id, row]));

  return relationshipRows.map((row) => ({
    ...row,
    target: targetById.get(row.targetId) ?? null,
  }));
}

export async function getRelationshipsByTarget(targetId: number, type?: string) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(relationships.targetId, targetId),
    eq(relationships.status, "approved"),
  ];

  if (type) {
    conditions.push(eq(relationships.type, type as any));
  }

  const relationshipRows = await db
    .select()
    .from(relationships)
    .where(and(...conditions))
    .orderBy(desc(relationships.upvotes));

  if (relationshipRows.length === 0) return [];

  const sourceRows = await db
    .select({
      id: resources.id,
      title: resources.title,
      slug: resources.slug,
      logo: resources.logo,
      description: resources.description,
      pricing: resources.pricing,
    })
    .from(resources)
    .where(inArray(resources.id, relationshipRows.map((row) => row.sourceId)));
  const sourceById = new Map(sourceRows.map((row) => [row.id, row]));

  return relationshipRows.map((row) => ({
    ...row,
    source: sourceById.get(row.sourceId) ?? null,
  }));
}

/**
 * Portable graph-query boundary. The first implementation reads a single
 * approved relational hop; future Neo4j, ArangoDB, or Neptune adapters can
 * implement this same result shape without changing public routes.
 */
export async function getGraphNeighborhood(resourceId: number, relationshipTypes?: string[], maxEdges: number = 80) {
  const db = await getDb();
  if (!db) return undefined;
  const [center] = await db.select({ id: resources.id, title: resources.title, slug: resources.slug, description: resources.description, pricing: resources.pricing, logo: resources.logo }).from(resources).where(and(eq(resources.id, resourceId), eq(resources.status, "approved"))).limit(1);
  if (!center) return undefined;
  const conditions = [eq(relationships.status, "approved"), or(eq(relationships.sourceId, resourceId), eq(relationships.targetId, resourceId))];
  if (relationshipTypes?.length) conditions.push(inArray(relationships.type, relationshipTypes as any));
  const edges = await db.select().from(relationships).where(and(...conditions)).orderBy(desc(relationships.upvotes)).limit(Math.min(Math.max(maxEdges, 1), 80));
  const nodeIds = Array.from(new Set(edges.flatMap((edge) => [edge.sourceId, edge.targetId]).filter((id) => id !== resourceId)));
  const nodes = nodeIds.length ? await db.select({ id: resources.id, title: resources.title, slug: resources.slug, description: resources.description, pricing: resources.pricing, logo: resources.logo }).from(resources).where(and(eq(resources.status, "approved"), inArray(resources.id, nodeIds))) : [];
  return { center, nodes, edges };
}

// Votes
export async function getUserVote(userId: number, resourceId?: number, relationshipId?: number) {
  const db = await getDb();
  if (!db) return undefined;

  const conditions = [eq(votes.userId, userId)];
  if (resourceId) conditions.push(eq(votes.resourceId, resourceId));
  if (relationshipId) conditions.push(eq(votes.relationshipId, relationshipId));

  const result = await db.select().from(votes).where(and(...conditions)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Bookmarks
export async function getUserBookmarks(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function isBookmarked(userId: number, resourceId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.resourceId, resourceId)))
    .limit(1);

  return result.length > 0;
}

// Collections
export async function getUserCollections(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(collections)
    .where(eq(collections.ownerId, userId))
    .orderBy(desc(collections.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getPublicCollections(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: collections.id,
      ownerId: collections.ownerId,
      name: collections.name,
      slug: collections.slug,
      description: collections.description,
      createdAt: collections.createdAt,
      updatedAt: collections.updatedAt,
      ownerName: users.name,
      resourceCount: sql<number>`count(${collectionResources.resourceId})`,
    })
    .from(collections)
    .innerJoin(users, eq(collections.ownerId, users.id))
    .leftJoin(collectionResources, eq(collectionResources.collectionId, collections.id))
    .where(eq(collections.isPublic, true))
    .groupBy(collections.id, collections.ownerId, collections.name, collections.slug, collections.description, collections.createdAt, collections.updatedAt, users.name)
    .orderBy(desc(collections.updatedAt), desc(collections.createdAt))
    .limit(Math.min(Math.max(limit, 1), 100))
    .offset(Math.max(offset, 0));
}

// Public API credentials and privacy-minimal daily quota accounting.
export async function createApiKeyRecord(input: { ownerId: number; name: string; keyPrefix: string; keyHash: string; scopes: string[]; dailyQuota: number; expiresAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(apiKeys).values({
    ownerId: input.ownerId,
    name: input.name,
    keyPrefix: input.keyPrefix,
    keyHash: input.keyHash,
    scopes: input.scopes,
    dailyQuota: input.dailyQuota,
    expiresAt: input.expiresAt ?? null,
  });
  return { id: Number(result[0].insertId), keyPrefix: input.keyPrefix, name: input.name, scopes: input.scopes, dailyQuota: input.dailyQuota, expiresAt: input.expiresAt ?? null };
}

export async function listOwnerApiKeys(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: apiKeys.id,
    name: apiKeys.name,
    keyPrefix: apiKeys.keyPrefix,
    scopes: apiKeys.scopes,
    dailyQuota: apiKeys.dailyQuota,
    status: apiKeys.status,
    expiresAt: apiKeys.expiresAt,
    lastUsedAt: apiKeys.lastUsedAt,
    revokedAt: apiKeys.revokedAt,
    createdAt: apiKeys.createdAt,
  }).from(apiKeys).where(eq(apiKeys.ownerId, ownerId)).orderBy(desc(apiKeys.createdAt));
}

export async function revokeApiKeyRecord(ownerId: number, apiKeyId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(apiKeys).set({ status: "revoked", revokedAt: new Date() }).where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.ownerId, ownerId), eq(apiKeys.status, "active")));
  return Number(result[0].affectedRows ?? 0) > 0;
}

export async function getActiveApiKeyByHash(keyHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const [record] = await db.select().from(apiKeys).where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.status, "active"))).limit(1);
  if (!record || (record.expiresAt && record.expiresAt.getTime() <= Date.now())) return undefined;
  return record;
}

export async function consumeApiKeyQuota(apiKeyId: number, dailyQuota: number, now: Date = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const usageDay = now.toISOString().slice(0, 10);
  return db.transaction(async (tx) => {
    const [usage] = await tx.select().from(apiKeyDailyUsage).where(and(eq(apiKeyDailyUsage.apiKeyId, apiKeyId), eq(apiKeyDailyUsage.usageDay, usageDay))).limit(1);
    if (usage && usage.requestCount >= dailyQuota) return { allowed: false, remaining: 0, usageDay };
    if (usage) {
      await tx.update(apiKeyDailyUsage).set({ requestCount: usage.requestCount + 1 }).where(eq(apiKeyDailyUsage.id, usage.id));
      await tx.update(apiKeys).set({ lastUsedAt: now }).where(eq(apiKeys.id, apiKeyId));
      return { allowed: true, remaining: Math.max(dailyQuota - usage.requestCount - 1, 0), usageDay };
    }
    await tx.insert(apiKeyDailyUsage).values({ apiKeyId, usageDay, requestCount: 1 });
    await tx.update(apiKeys).set({ lastUsedAt: now }).where(eq(apiKeys.id, apiKeyId));
    return { allowed: true, remaining: Math.max(dailyQuota - 1, 0), usageDay };
  });
}

export async function getApiKeyUsageForOwner(ownerId: number, apiKeyId: number, now: Date = new Date()) {
  const db = await getDb();
  if (!db) return undefined;
  const usageDay = now.toISOString().slice(0, 10);
  const [key] = await db.select({ id: apiKeys.id, dailyQuota: apiKeys.dailyQuota, status: apiKeys.status }).from(apiKeys).where(and(eq(apiKeys.id, apiKeyId), eq(apiKeys.ownerId, ownerId))).limit(1);
  if (!key) return undefined;
  const [usage] = await db.select({ requestCount: apiKeyDailyUsage.requestCount }).from(apiKeyDailyUsage).where(and(eq(apiKeyDailyUsage.apiKeyId, apiKeyId), eq(apiKeyDailyUsage.usageDay, usageDay))).limit(1);
  return { usageDay, requestCount: usage?.requestCount ?? 0, dailyQuota: key.dailyQuota, remaining: Math.max(key.dailyQuota - (usage?.requestCount ?? 0), 0), status: key.status };
}

export async function getCollectionBySlug(ownerId: number, slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(collections)
    .where(and(eq(collections.ownerId, ownerId), eq(collections.slug, slug)))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getCollectionResources(collectionId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(collectionResources)
    .where(eq(collectionResources.collectionId, collectionId))
    .orderBy(asc(collectionResources.order));
}

// Categories
export async function getCategories() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(categories).orderBy(asc(categories.order));
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSubcategoriesByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(subcategories)
    .where(eq(subcategories.categoryId, categoryId))
    .orderBy(asc(subcategories.order));
}

// Tags
export async function getOrCreateTag(name: string) {
  const db = await getDb();
  if (!db) return undefined;

  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const existing = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const result = await db.insert(tags).values({ name, slug });
  return { id: result[0].insertId, name, slug, createdAt: new Date() };
}

export async function getResourceTags(resourceId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(resourceTags).where(eq(resourceTags.resourceId, resourceId));
}

// Submissions
export async function getPendingSubmissions(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(submissions)
    .where(eq(submissions.status, "pending"))
    .orderBy(asc(submissions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getSubmissionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserSubmissions(userId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(submissions)
    .where(eq(submissions.submittedBy, userId))
    .orderBy(desc(submissions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getPendingRelationships(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(relationships)
    .where(eq(relationships.status, "pending"))
    .orderBy(asc(relationships.createdAt))
    .limit(limit)
    .offset(offset);
}

// Audit Logs
export async function createAuditLog(
  userId: number,
  action: string,
  entityType: string,
  entityId: number,
  changes?: any,
  reason?: string
) {
  const db = await getDb();
  if (!db) return;

  await db.insert(auditLogs).values({
    userId,
    action,
    entityType,
    entityId,
    changes,
    reason,
  });
}

export async function getAuditLogs(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
}

export async function listUsersForAdmin(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, reputation: users.reputation, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function setUserRole(userId: number, role: "user" | "moderator" | "admin") {
  const db = await getDb();
  if (!db) return false;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return true;
}

/**
 * Records aggregate discovery quality signals without persisting a user, IP address,
 * session identifier, or unredacted email/URL-like query text.
 */
export async function recordSearchAnalytics(input: { query: string; resultCount: number; relationshipIntent?: string; eventType?: "search" | "result_click"; latencyMs?: number; clickedResourceId?: number; hadPreviousQuery?: boolean }) {
  const normalizedQuery = input.query.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 255);
  if (!normalizedQuery || /@|:\/\//.test(normalizedQuery) || /\d{12,}/.test(normalizedQuery)) return;

  const db = await getDb();
  if (!db) return;
  await db.insert(searchAnalytics).values({
    query: normalizedQuery,
    normalizedQuery,
    resultCount: Math.max(0, input.resultCount),
    relationshipIntent: input.relationshipIntent,
    eventType: input.eventType ?? "search",
    latencyMs: input.latencyMs === undefined ? null : Math.min(Math.max(Math.round(input.latencyMs), 0), 120_000),
    clickedResourceId: input.clickedResourceId,
    hadPreviousQuery: input.hadPreviousQuery ?? false,
  });
}

export async function getSearchQualitySummary(days: number = 30, now: Date = new Date()) {
  const db = await getDb();
  if (!db) return { periodDays: days, searchCount: 0, zeroResultCount: 0, clickCount: 0, reformulationCount: 0, averageLatencyMs: null as number | null, zeroResultRate: 0, clickThroughRate: 0, reformulationRate: 0 };
  const boundedDays = Math.min(Math.max(Math.round(days), 1), 90);
  const since = new Date(now.getTime() - boundedDays * 86_400_000);
  const [row] = await db.select({
    searchCount: sql<number>`sum(case when ${searchAnalytics.eventType} = 'search' then 1 else 0 end)`,
    zeroResultCount: sql<number>`sum(case when ${searchAnalytics.eventType} = 'search' and ${searchAnalytics.resultCount} = 0 then 1 else 0 end)`,
    clickCount: sql<number>`sum(case when ${searchAnalytics.eventType} = 'result_click' then 1 else 0 end)`,
    reformulationCount: sql<number>`sum(case when ${searchAnalytics.eventType} = 'search' and ${searchAnalytics.hadPreviousQuery} = true then 1 else 0 end)`,
    averageLatencyMs: sql<number | null>`avg(case when ${searchAnalytics.eventType} = 'search' then ${searchAnalytics.latencyMs} end)`,
  }).from(searchAnalytics).where(gte(searchAnalytics.createdAt, since));
  const searchCount = Number(row?.searchCount ?? 0);
  const zeroResultCount = Number(row?.zeroResultCount ?? 0);
  const clickCount = Number(row?.clickCount ?? 0);
  const reformulationCount = Number(row?.reformulationCount ?? 0);
  return { periodDays: boundedDays, searchCount, zeroResultCount, clickCount, reformulationCount, averageLatencyMs: row?.averageLatencyMs === null || row?.averageLatencyMs === undefined ? null : Math.round(Number(row.averageLatencyMs)), zeroResultRate: searchCount ? zeroResultCount / searchCount : 0, clickThroughRate: searchCount ? clickCount / searchCount : 0, reformulationRate: searchCount ? reformulationCount / searchCount : 0 };
}

export async function createSearchEvaluationCase(input: { query: string; expectedResourceIds: number[]; notes?: string; createdBy: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.insert(searchEvaluationCases).values({ query: input.query.trim(), expectedResourceIds: input.expectedResourceIds, notes: input.notes?.trim() || null, createdBy: input.createdBy });
  return Number(result[0].insertId);
}

export async function listSearchEvaluationCases(status?: "draft" | "approved" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(searchEvaluationCases).where(status ? eq(searchEvaluationCases.status, status) : undefined).orderBy(desc(searchEvaluationCases.createdAt));
}

export async function reviewSearchEvaluationCase(input: { id: number; status: "approved" | "rejected"; reviewerId: number; reviewNote?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.update(searchEvaluationCases).set({ status: input.status, reviewedBy: input.reviewerId, reviewNote: input.reviewNote?.trim() || null, reviewedAt: new Date() }).where(and(eq(searchEvaluationCases.id, input.id), eq(searchEvaluationCases.status, "draft")));
  return Number(result[0].affectedRows ?? 0) > 0;
}

export async function createResourceReport(input: { resourceId: number; reporterId: number; reason: "spam" | "duplicate" | "inaccurate" | "malicious" | "other"; details?: string }) {
  const db = await getDb();
  if (!db) return { created: false, duplicate: false };
  const existing = await db.select({ id: resourceReports.id }).from(resourceReports).where(and(eq(resourceReports.resourceId, input.resourceId), eq(resourceReports.reporterId, input.reporterId), eq(resourceReports.status, "open"))).limit(1);
  if (existing.length) return { created: false, duplicate: true };
  await db.insert(resourceReports).values(input);
  return { created: true, duplicate: false };
}

export async function getOpenResourceReports(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: resourceReports.id, resourceId: resourceReports.resourceId, reporterId: resourceReports.reporterId, reason: resourceReports.reason, details: resourceReports.details, status: resourceReports.status, createdAt: resourceReports.createdAt, resourceTitle: resources.title, resourceSlug: resources.slug, reporterName: users.name }).from(resourceReports).innerJoin(resources, eq(resourceReports.resourceId, resources.id)).innerJoin(users, eq(resourceReports.reporterId, users.id)).where(eq(resourceReports.status, "open")).orderBy(desc(resourceReports.createdAt)).limit(limit).offset(offset);
}

export async function reviewResourceReport(input: { reportId: number; reviewerId: number; status: "resolved" | "dismissed"; reviewNote?: string }) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.update(resourceReports).set({ status: input.status, reviewedBy: input.reviewerId, reviewNote: input.reviewNote || null, reviewedAt: new Date() }).where(and(eq(resourceReports.id, input.reportId), eq(resourceReports.status, "open")));
  return Number((result as any)[0]?.affectedRows ?? 0) > 0;
}

export async function createResourceEditSuggestion(input: {
  resourceId: number;
  suggestedBy: number;
  changes: Record<string, string>;
  note?: string;
}) {
  const db = await getDb();
  if (!db) return { created: false, duplicate: false };
  const existing = await db
    .select({ id: resourceEditSuggestions.id })
    .from(resourceEditSuggestions)
    .where(and(eq(resourceEditSuggestions.resourceId, input.resourceId), eq(resourceEditSuggestions.suggestedBy, input.suggestedBy), eq(resourceEditSuggestions.status, "pending")))
    .limit(1);
  if (existing.length) return { created: false, duplicate: true };
  const result = await db.insert(resourceEditSuggestions).values(input);
  return { created: true, duplicate: false, id: result[0].insertId };
}

export async function getPendingResourceEditSuggestions(limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      id: resourceEditSuggestions.id,
      resourceId: resourceEditSuggestions.resourceId,
      suggestedBy: resourceEditSuggestions.suggestedBy,
      changes: resourceEditSuggestions.changes,
      note: resourceEditSuggestions.note,
      createdAt: resourceEditSuggestions.createdAt,
      resourceTitle: resources.title,
      resourceSlug: resources.slug,
      contributorName: users.name,
    })
    .from(resourceEditSuggestions)
    .innerJoin(resources, eq(resourceEditSuggestions.resourceId, resources.id))
    .innerJoin(users, eq(resourceEditSuggestions.suggestedBy, users.id))
    .where(eq(resourceEditSuggestions.status, "pending"))
    .orderBy(desc(resourceEditSuggestions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function reviewResourceEditSuggestion(input: {
  suggestionId: number;
  reviewerId: number;
  status: "approved" | "rejected";
  reviewNote?: string;
}) {
  const db = await getDb();
  if (!db) return { updated: false };
  const suggestion = await db.select().from(resourceEditSuggestions).where(and(eq(resourceEditSuggestions.id, input.suggestionId), eq(resourceEditSuggestions.status, "pending"))).limit(1);
  if (!suggestion.length) return { updated: false };
  const current = suggestion[0];
  if (input.status === "approved") {
    await db.update(resources).set(current.changes as Record<string, unknown>).where(eq(resources.id, current.resourceId));
  }
  const result = await db.update(resourceEditSuggestions).set({ status: input.status, reviewedBy: input.reviewerId, reviewNote: input.reviewNote || null, reviewedAt: new Date() }).where(and(eq(resourceEditSuggestions.id, input.suggestionId), eq(resourceEditSuggestions.status, "pending")));
  return { updated: Number((result as any)[0]?.affectedRows ?? 0) > 0, resourceId: current.resourceId, changes: current.changes };
}

// Reputation
export async function updateUserReputation(userId: number, delta: number) {
  const db = await getDb();
  if (!db) return;

  await db
    .update(users)
    .set({ reputation: sql`${users.reputation} + ${delta}` })
    .where(eq(users.id, userId));
}

export async function recordReputationEvent(input: {
  userId: number;
  points: number;
  reason: string;
  entityType: string;
  entityId: number;
  eventKey: string;
}) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db
    .select({ id: reputationEvents.id })
    .from(reputationEvents)
    .where(eq(reputationEvents.eventKey, input.eventKey))
    .limit(1);
  if (existing.length > 0) return false;

  try {
    await db.insert(reputationEvents).values(input);
    await updateUserReputation(input.userId, input.points);
    return true;
  } catch (error) {
    console.warn("[Reputation] Could not record event:", error);
    return false;
  }
}

export async function removeReputationEvent(eventKey: string) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db
    .select()
    .from(reputationEvents)
    .where(eq(reputationEvents.eventKey, eventKey))
    .limit(1);
  if (!existing[0]) return false;

  await db.delete(reputationEvents).where(eq(reputationEvents.id, existing[0].id));
  await updateUserReputation(existing[0].userId, -existing[0].points);
  return true;
}

export async function getUserReputationEvents(userId: number, limit: number = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(reputationEvents)
    .where(eq(reputationEvents.userId, userId))
    .orderBy(desc(reputationEvents.createdAt))
    .limit(limit);
}

// Check for duplicate resources by URL
export async function checkDuplicateByUrl(url: string, excludeId?: number) {
  const db = await getDb();
  if (!db) return undefined;

  const conditions = [like(resources.url, url)];
  if (excludeId) {
    conditions.push(sql`${resources.id} != ${excludeId}`);
  }

  const result = await db
    .select()
    .from(resources)
    .where(and(...conditions))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Check for duplicate resources by title (fuzzy)
export async function checkPendingSubmissionByUrl(url: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(submissions)
    .where(and(eq(submissions.url, url), eq(submissions.status, "pending")))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function checkDuplicateByTitle(title: string, categoryId: number, excludeId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    eq(resources.categoryId, categoryId),
    like(resources.title, `%${title}%`),
  ];

  if (excludeId) {
    conditions.push(sql`${resources.id} != ${excludeId}`);
  }

  return db
    .select()
    .from(resources)
    .where(and(...conditions))
    .limit(5);
}
