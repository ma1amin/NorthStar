import { eq, and, or, like, desc, asc, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
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
  resourceReports,
  resourceEditSuggestions,
  reputationEvents,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

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
  const conditions = [eq(resources.status, "approved")];

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
  return result.length > 0 ? result[0] : undefined;
}

export async function getResourceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getResourcesByCategory(categoryId: number, limit: number = 50, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(resources)
    .where(and(eq(resources.categoryId, categoryId), eq(resources.status, "approved")))
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
export async function recordSearchAnalytics(input: { query: string; resultCount: number; relationshipIntent?: string }) {
  const normalizedQuery = input.query.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 255);
  if (!normalizedQuery || /@|:\/\//.test(normalizedQuery) || /\d{12,}/.test(normalizedQuery)) return;

  const db = await getDb();
  if (!db) return;
  await db.insert(searchAnalytics).values({
    query: normalizedQuery,
    normalizedQuery,
    resultCount: Math.max(0, input.resultCount),
    relationshipIntent: input.relationshipIntent,
  });
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
