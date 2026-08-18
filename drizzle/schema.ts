import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  index,
  uniqueIndex,
  foreignKey,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).unique(),
    avatar: text("avatar"),
    bio: text("bio"),
    loginMethod: varchar("loginMethod", { length: 64 }),
    role: mysqlEnum("role", ["user", "moderator", "admin"]).default("user").notNull(),
    reputation: int("reputation").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    openIdIdx: uniqueIndex("openId_idx").on(table.openId),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categories and subcategories for organizing resources.
 */
export const categories = mysqlTable(
  "categories",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    icon: varchar("icon", { length: 255 }),
    order: int("order").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("slug_idx").on(table.slug),
  })
);

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Subcategories under categories.
 */
export const subcategories = mysqlTable(
  "subcategories",
  {
    id: int("id").autoincrement().primaryKey(),
    categoryId: int("categoryId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    order: int("order").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    categoryIdIdx: index("categoryId_idx").on(table.categoryId),
    slugIdx: index("slug_idx").on(table.slug),
    categorySlugUq: uniqueIndex("category_slug_uq").on(table.categoryId, table.slug),
    categoryFk: foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
    }).onDelete("cascade"),
  })
);

export type Subcategory = typeof subcategories.$inferSelect;
export type InsertSubcategory = typeof subcategories.$inferInsert;

/**
 * Tags for flexible resource classification.
 */
export const tags = mysqlTable(
  "tags",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull().unique(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    slugIdx: index("slug_idx").on(table.slug),
  })
);

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;

/**
 * Core resource table - represents tools, services, libraries, etc.
 */
export const resources = mysqlTable(
  "resources",
  {
    id: int("id").autoincrement().primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    description: text("description"),
    url: varchar("url", { length: 2048 }).notNull(),
    categoryId: int("categoryId").notNull(),
    subcategoryId: int("subcategoryId"),
    logo: text("logo"),
    pricing: mysqlEnum("pricing", [
      "free",
      "freemium",
      "paid",
      "open_source",
      "enterprise",
    ]).notNull(),
    license: varchar("license", { length: 255 }),
    builtBy: varchar("builtBy", { length: 255 }),
    builtByUrl: varchar("builtByUrl", { length: 2048 }),
    canonicalResourceId: int("canonicalResourceId"),
    submittedBy: int("submittedBy").notNull(),
    status: mysqlEnum("status", ["approved", "pending", "rejected"]).default("pending").notNull(),
    upvotes: int("upvotes").default(0).notNull(),
    views: int("views").default(0).notNull(),
    featured: boolean("featured").default(false).notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    approvedAt: timestamp("approvedAt"),
  },
  (table) => ({
    slugIdx: uniqueIndex("slug_idx").on(table.slug),
    categoryIdIdx: index("categoryId_idx").on(table.categoryId),
    subcategoryIdIdx: index("subcategoryId_idx").on(table.subcategoryId),
    submittedByIdx: index("submittedBy_idx").on(table.submittedBy),
    statusIdx: index("status_idx").on(table.status),
    canonicalResourceIdx: index("canonicalResource_idx").on(table.canonicalResourceId),
    categoryFk: foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
    }).onDelete("restrict"),
    subcategoryFk: foreignKey({
      columns: [table.subcategoryId],
      foreignColumns: [subcategories.id],
    }).onDelete("set null"),
    submittedByFk: foreignKey({
      columns: [table.submittedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    canonicalResourceFk: foreignKey({
      columns: [table.canonicalResourceId],
      foreignColumns: [table.id],
    }).onDelete("set null"),
  })
);

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

/**
 * Attributed evidence for resource facts. Sources are first-class records so
 * metadata provenance does not rely on opaque JSON blobs.
 */
export const resourceSources = mysqlTable(
  "resource_sources",
  {
    id: int("id").autoincrement().primaryKey(),
    resourceId: int("resourceId").notNull(),
    url: varchar("url", { length: 2048 }).notNull(),
    sourceType: mysqlEnum("sourceType", ["official", "documentation", "repository", "community", "archive", "other"]).notNull(),
    attribution: varchar("attribution", { length: 500 }),
    licenseNote: varchar("licenseNote", { length: 500 }),
    capturedAt: timestamp("capturedAt").defaultNow().notNull(),
    verificationStatus: mysqlEnum("verificationStatus", ["pending", "approved", "rejected", "superseded"]).default("pending").notNull(),
    addedBy: int("addedBy").notNull(),
    verifiedBy: int("verifiedBy"),
    verifiedAt: timestamp("verifiedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    resourceStatusIdx: index("resource_sources_resource_status_idx").on(table.resourceId, table.verificationStatus),
    sourceUrlIdx: index("resource_sources_url_idx").on(table.url),
    resourceFk: foreignKey({ columns: [table.resourceId], foreignColumns: [resources.id] }).onDelete("cascade"),
    addedByFk: foreignKey({ columns: [table.addedBy], foreignColumns: [users.id] }).onDelete("restrict"),
    verifiedByFk: foreignKey({ columns: [table.verifiedBy], foreignColumns: [users.id] }).onDelete("set null"),
  })
);

export type ResourceSource = typeof resourceSources.$inferSelect;
export type InsertResourceSource = typeof resourceSources.$inferInsert;

/**
 * Append-only resource accountability events. Public history only records
 * accepted resource facts and intentionally excludes private reports/notes.
 */
export const resourceHistory = mysqlTable(
  "resource_history",
  {
    id: int("id").autoincrement().primaryKey(),
    resourceId: int("resourceId").notNull(),
    eventType: mysqlEnum("eventType", ["resource_created", "metadata_updated", "source_verified", "freshness_checked", "duplicate_resolution_proposed", "duplicate_resolution_confirmed"]).notNull(),
    summary: varchar("summary", { length: 500 }).notNull(),
    changes: json("changes"),
    isPublic: boolean("isPublic").default(true).notNull(),
    recordedBy: int("recordedBy").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    resourceCreatedIdx: index("resource_history_resource_created_idx").on(table.resourceId, table.createdAt),
    publicIdx: index("resource_history_public_idx").on(table.resourceId, table.isPublic),
    resourceFk: foreignKey({ columns: [table.resourceId], foreignColumns: [resources.id] }).onDelete("cascade"),
    recordedByFk: foreignKey({ columns: [table.recordedBy], foreignColumns: [users.id] }).onDelete("restrict"),
  })
);

export type ResourceHistoryEvent = typeof resourceHistory.$inferSelect;
export type InsertResourceHistoryEvent = typeof resourceHistory.$inferInsert;

/**
 * Point-in-time freshness review records. A resource can be reviewed many
 * times; the most recent review represents current moderation guidance.
 */
export const resourceFreshnessReviews = mysqlTable(
  "resource_freshness_reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    resourceId: int("resourceId").notNull(),
    status: mysqlEnum("status", ["current", "needs_review", "stale"]).notNull(),
    note: text("note"),
    checkedBy: int("checkedBy").notNull(),
    checkedAt: timestamp("checkedAt").defaultNow().notNull(),
  },
  (table) => ({
    resourceCheckedIdx: index("resource_freshness_resource_checked_idx").on(table.resourceId, table.checkedAt),
    statusCheckedIdx: index("resource_freshness_status_checked_idx").on(table.status, table.checkedAt),
    resourceFk: foreignKey({ columns: [table.resourceId], foreignColumns: [resources.id] }).onDelete("cascade"),
    checkedByFk: foreignKey({ columns: [table.checkedBy], foreignColumns: [users.id] }).onDelete("restrict"),
  })
);

export type ResourceFreshnessReview = typeof resourceFreshnessReviews.$inferSelect;
export type InsertResourceFreshnessReview = typeof resourceFreshnessReviews.$inferInsert;

/**
 * Moderator-owned duplicate-resolution records. Confirmation preserves the
 * original node as an alias of a canonical resource; no resource is deleted.
 */
export const resourceDuplicateResolutions = mysqlTable(
  "resource_duplicate_resolutions",
  {
    id: int("id").autoincrement().primaryKey(),
    duplicateResourceId: int("duplicateResourceId").notNull(),
    canonicalResourceId: int("canonicalResourceId").notNull(),
    status: mysqlEnum("status", ["proposed", "confirmed", "cancelled"]).default("proposed").notNull(),
    rationale: text("rationale").notNull(),
    createdBy: int("createdBy").notNull(),
    reviewedBy: int("reviewedBy"),
    reviewNote: text("reviewNote"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
  },
  (table) => ({
    duplicateStatusIdx: index("resource_duplicate_duplicate_status_idx").on(table.duplicateResourceId, table.status),
    canonicalStatusIdx: index("resource_duplicate_canonical_status_idx").on(table.canonicalResourceId, table.status),
    pairIdx: uniqueIndex("resource_duplicate_pair_idx").on(table.duplicateResourceId, table.canonicalResourceId),
    duplicateFk: foreignKey({ name: "res_dup_dup_fk", columns: [table.duplicateResourceId], foreignColumns: [resources.id] }).onDelete("restrict"),
    canonicalFk: foreignKey({ name: "res_dup_can_fk", columns: [table.canonicalResourceId], foreignColumns: [resources.id] }).onDelete("restrict"),
    createdByFk: foreignKey({ name: "res_dup_creator_fk", columns: [table.createdBy], foreignColumns: [users.id] }).onDelete("restrict"),
    reviewedByFk: foreignKey({ name: "res_dup_reviewer_fk", columns: [table.reviewedBy], foreignColumns: [users.id] }).onDelete("set null"),
  })
);

export type ResourceDuplicateResolution = typeof resourceDuplicateResolutions.$inferSelect;
export type InsertResourceDuplicateResolution = typeof resourceDuplicateResolutions.$inferInsert;

/**
 * Resource-Tag association (many-to-many).
 */
export const resourceTags = mysqlTable(
  "resource_tags",
  {
    id: int("id").autoincrement().primaryKey(),
    resourceId: int("resourceId").notNull(),
    tagId: int("tagId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    resourceIdIdx: index("resourceId_idx").on(table.resourceId),
    tagIdIdx: index("tagId_idx").on(table.tagId),
    resourceTagUq: uniqueIndex("resource_tag_uq").on(table.resourceId, table.tagId),
    resourceFk: foreignKey({
      columns: [table.resourceId],
      foreignColumns: [resources.id],
    }).onDelete("cascade"),
    tagFk: foreignKey({
      columns: [table.tagId],
      foreignColumns: [tags.id],
    }).onDelete("cascade"),
  })
);

export type ResourceTag = typeof resourceTags.$inferSelect;
export type InsertResourceTag = typeof resourceTags.$inferInsert;

/**
 * Knowledge graph relationships between resources.
 * Supported types: Alternative To, Similar To, Integrates With, Built By, Maintained By, Funded By, Used By, Depends On, Part Of, Competitor Of
 */
export const relationships = mysqlTable(
  "relationships",
  {
    id: int("id").autoincrement().primaryKey(),
    sourceId: int("sourceId").notNull(),
    targetId: int("targetId").notNull(),
    type: mysqlEnum("type", [
      "alternative_to",
      "similar_to",
      "integrates_with",
      "built_by",
      "maintained_by",
      "funded_by",
      "used_by",
      "depends_on",
      "part_of",
      "competitor_of",
    ]).notNull(),
    strength: decimal("strength", { precision: 3, scale: 2 }).default("0.50").notNull(),
    verified: boolean("verified").default(false).notNull(),
    upvotes: int("upvotes").default(0).notNull(),
    createdBy: int("createdBy").notNull(),
    status: mysqlEnum("status", ["approved", "pending", "rejected"]).default("pending").notNull(),
    evidenceUrl: varchar("evidenceUrl", { length: 2048 }),
    rationale: text("rationale"),
    sourceContext: varchar("sourceContext", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    sourceIdIdx: index("sourceId_idx").on(table.sourceId),
    targetIdIdx: index("targetId_idx").on(table.targetId),
    typeIdx: index("type_idx").on(table.type),
    statusIdx: index("status_idx").on(table.status),
    sourceTargetTypeUq: uniqueIndex("source_target_type_uq").on(
      table.sourceId,
      table.targetId,
      table.type
    ),
    sourceFk: foreignKey({
      columns: [table.sourceId],
      foreignColumns: [resources.id],
    }).onDelete("cascade"),
    targetFk: foreignKey({
      columns: [table.targetId],
      foreignColumns: [resources.id],
    }).onDelete("cascade"),
    createdByFk: foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
  })
);

export type Relationship = typeof relationships.$inferSelect;
export type InsertRelationship = typeof relationships.$inferInsert;

/**
 * User votes on resources and relationships.
 */
export const votes = mysqlTable(
  "votes",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    resourceId: int("resourceId"),
    relationshipId: int("relationshipId"),
    type: mysqlEnum("type", ["upvote", "downvote"]).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    resourceIdIdx: index("resourceId_idx").on(table.resourceId),
    relationshipIdIdx: index("relationshipId_idx").on(table.relationshipId),
    userResourceUq: uniqueIndex("user_resource_uq").on(table.userId, table.resourceId),
    userRelationshipUq: uniqueIndex("user_relationship_uq").on(
      table.userId,
      table.relationshipId
    ),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    resourceFk: foreignKey({
      columns: [table.resourceId],
      foreignColumns: [resources.id],
    }).onDelete("cascade"),
    relationshipFk: foreignKey({
      columns: [table.relationshipId],
      foreignColumns: [relationships.id],
    }).onDelete("cascade"),
  })
);

export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

/**
 * User bookmarks for resources.
 */
export const bookmarks = mysqlTable(
  "bookmarks",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    resourceId: int("resourceId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    resourceIdIdx: index("resourceId_idx").on(table.resourceId),
    userResourceUq: uniqueIndex("user_resource_uq").on(table.userId, table.resourceId),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
    resourceFk: foreignKey({
      columns: [table.resourceId],
      foreignColumns: [resources.id],
    }).onDelete("cascade"),
  })
);

export type Bookmark = typeof bookmarks.$inferSelect;
export type InsertBookmark = typeof bookmarks.$inferInsert;

/**
 * User collections (curated resource stacks).
 */
export const collections = mysqlTable(
  "collections",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    description: text("description"),
    isPublic: boolean("isPublic").default(true).notNull(),
    upvotes: int("upvotes").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    ownerIdIdx: index("ownerId_idx").on(table.ownerId),
    slugIdx: index("slug_idx").on(table.slug),
    ownerSlugUq: uniqueIndex("owner_slug_uq").on(table.ownerId, table.slug),
    ownerFk: foreignKey({
      columns: [table.ownerId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  })
);

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = typeof collections.$inferInsert;

/**
 * Collection-Resource association (many-to-many).
 */
export const collectionResources = mysqlTable(
  "collection_resources",
  {
    id: int("id").autoincrement().primaryKey(),
    collectionId: int("collectionId").notNull(),
    resourceId: int("resourceId").notNull(),
    order: int("order").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    collectionIdIdx: index("collectionId_idx").on(table.collectionId),
    resourceIdIdx: index("resourceId_idx").on(table.resourceId),
    collectionResourceUq: uniqueIndex("collection_resource_uq").on(
      table.collectionId,
      table.resourceId
    ),
    collectionFk: foreignKey({
      columns: [table.collectionId],
      foreignColumns: [collections.id],
    }).onDelete("cascade"),
    resourceFk: foreignKey({
      columns: [table.resourceId],
      foreignColumns: [resources.id],
    }).onDelete("cascade"),
  })
);

export type CollectionResource = typeof collectionResources.$inferSelect;
export type InsertCollectionResource = typeof collectionResources.$inferInsert;

/**
 * User-owned credentials for the public, versioned, read-only REST API.
 * Plaintext keys are returned once at creation; only their SHA-256 hashes persist.
 */
export const apiKeys = mysqlTable(
  "api_keys",
  {
    id: int("id").autoincrement().primaryKey(),
    ownerId: int("ownerId").notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    keyPrefix: varchar("keyPrefix", { length: 24 }).notNull(),
    keyHash: varchar("keyHash", { length: 64 }).notNull(),
    scopes: json("scopes").$type<string[]>().notNull(),
    dailyQuota: int("dailyQuota").notNull().default(1000),
    status: mysqlEnum("status", ["active", "revoked"]).notNull().default("active"),
    expiresAt: timestamp("expiresAt"),
    lastUsedAt: timestamp("lastUsedAt"),
    revokedAt: timestamp("revokedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    ownerStatusIdx: index("api_key_owner_status_idx").on(table.ownerId, table.status),
    hashUq: uniqueIndex("api_key_hash_uq").on(table.keyHash),
    prefixIdx: index("api_key_prefix_idx").on(table.keyPrefix),
    ownerFk: foreignKey({ columns: [table.ownerId], foreignColumns: [users.id] }).onDelete("cascade"),
  })
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/** Aggregate per-key, per-day usage for quota enforcement without storing request payloads or IP addresses. */
export const apiKeyDailyUsage = mysqlTable(
  "api_key_daily_usage",
  {
    id: int("id").autoincrement().primaryKey(),
    apiKeyId: int("apiKeyId").notNull(),
    usageDay: varchar("usageDay", { length: 10 }).notNull(),
    requestCount: int("requestCount").notNull().default(0),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    keyDayUq: uniqueIndex("api_key_day_uq").on(table.apiKeyId, table.usageDay),
    keyDayIdx: index("api_key_day_idx").on(table.apiKeyId, table.usageDay),
    apiKeyFk: foreignKey({ columns: [table.apiKeyId], foreignColumns: [apiKeys.id] }).onDelete("cascade"),
  })
);

export type ApiKeyDailyUsage = typeof apiKeyDailyUsage.$inferSelect;
export type InsertApiKeyDailyUsage = typeof apiKeyDailyUsage.$inferInsert;

/**
 * Resource submissions (pending approval).
 */
export const submissions = mysqlTable(
  "submissions",
  {
    id: int("id").autoincrement().primaryKey(),
    submittedBy: int("submittedBy").notNull(),
    resourceId: int("resourceId"),
    title: varchar("title", { length: 255 }).notNull(),
    url: varchar("url", { length: 2048 }).notNull(),
    description: text("description"),
    categoryId: int("categoryId").notNull(),
    subcategoryId: int("subcategoryId"),
    tags: json("tags"),
    pricing: mysqlEnum("pricing", [
      "free",
      "freemium",
      "paid",
      "open_source",
      "enterprise",
    ]).notNull(),
    sourceUrl: varchar("sourceUrl", { length: 2048 }),
    sourceType: mysqlEnum("sourceType", ["official", "documentation", "repository", "community", "archive", "other"]),
    license: varchar("license", { length: 255 }),
    builtBy: varchar("builtBy", { length: 255 }),
    builtByUrl: varchar("builtByUrl", { length: 2048 }),
    suggestedRelationships: json("suggestedRelationships"),
    status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
    rejectionReason: text("rejectionReason"),
    reviewedBy: int("reviewedBy"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
  },
  (table) => ({
    submittedByIdx: index("submittedBy_idx").on(table.submittedBy),
    resourceIdIdx: index("resourceId_idx").on(table.resourceId),
    statusIdx: index("status_idx").on(table.status),
    submittedByFk: foreignKey({
      columns: [table.submittedBy],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
    resourceFk: foreignKey({
      columns: [table.resourceId],
      foreignColumns: [resources.id],
    }).onDelete("set null"),
    reviewedByFk: foreignKey({
      columns: [table.reviewedBy],
      foreignColumns: [users.id],
    }).onDelete("set null"),
  })
);

export type Submission = typeof submissions.$inferSelect;
export type InsertSubmission = typeof submissions.$inferInsert;

/**
 * Non-identifying, PII-free archive import batches. Source files, source text,
 * submitter identity, contact data, timestamps, and file metadata are never
 * stored here; only aggregate parser outcomes are retained.
 */
export const archiveImportBatches = mysqlTable(
  "archive_import_batches",
  {
    id: int("id").autoincrement().primaryKey(),
    status: mysqlEnum("status", ["parsed", "review_ready", "completed", "failed"]).default("parsed").notNull(),
    totalUrlMentions: int("totalUrlMentions").default(0).notNull(),
    uniqueCandidates: int("uniqueCandidates").default(0).notNull(),
    rejectedUrlMentions: int("rejectedUrlMentions").default(0).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    completedAt: timestamp("completedAt"),
  },
  (table) => ({
    statusCreatedIdx: index("archive_import_batches_status_created_idx").on(table.status, table.createdAt),
  })
);

export type ArchiveImportBatch = typeof archiveImportBatches.$inferSelect;

/**
 * PII-free candidates derived from ephemeral source parsing. Each field must be
 * a normalized URL or a fact obtained from that URL's public resource page.
 */
export const archiveImportCandidates = mysqlTable(
  "archive_import_candidates",
  {
    id: int("id").autoincrement().primaryKey(),
    batchId: int("batchId").notNull(),
    candidateHash: varchar("candidateHash", { length: 64 }).notNull(),
    url: varchar("url", { length: 2048 }).notNull(),
    registrableDomain: varchar("registrableDomain", { length: 255 }),
    canonicalUrl: varchar("canonicalUrl", { length: 2048 }),
    title: varchar("title", { length: 255 }),
    description: text("description"),
    builtBy: varchar("builtBy", { length: 255 }),
    builtByUrl: varchar("builtByUrl", { length: 2048 }),
    suggestedPricing: mysqlEnum("suggestedPricing", ["free", "freemium", "paid", "open_source", "enterprise"]),
    suggestedLicense: varchar("suggestedLicense", { length: 255 }),
    suggestedTags: json("suggestedTags").$type<string[]>(),
    officialSourceUrl: varchar("officialSourceUrl", { length: 2048 }),
    metadataVerificationStatus: mysqlEnum("metadataVerificationStatus", ["unverified", "public_page_fetched", "reviewed"]).default("unverified").notNull(),
    metadataFetchedAt: timestamp("metadataFetchedAt"),
    duplicateResourceId: int("duplicateResourceId"),
    status: mysqlEnum("status", ["review_ready", "duplicate", "excluded", "submitted", "failed"]).default("review_ready").notNull(),
    failureCode: varchar("failureCode", { length: 96 }),
    submissionId: int("submissionId"),
    retryCount: int("retryCount").default(0).notNull(),
    lastRetryAt: timestamp("lastRetryAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    batchStatusIdx: index("archive_import_candidates_batch_status_idx").on(table.batchId, table.status),
    batchDomainIdx: index("archive_import_candidates_batch_domain_idx").on(table.batchId, table.registrableDomain),
    batchHashUq: uniqueIndex("archive_import_candidates_batch_hash_uq").on(table.batchId, table.candidateHash),
    duplicateResourceIdx: index("archive_import_candidates_duplicate_resource_idx").on(table.duplicateResourceId),
    batchFk: foreignKey({ columns: [table.batchId], foreignColumns: [archiveImportBatches.id] }).onDelete("cascade"),
    duplicateResourceFk: foreignKey({ columns: [table.duplicateResourceId], foreignColumns: [resources.id] }).onDelete("set null"),
    submissionFk: foreignKey({ columns: [table.submissionId], foreignColumns: [submissions.id] }).onDelete("set null"),
  })
);

export type ArchiveImportCandidate = typeof archiveImportCandidates.$inferSelect;

/**
 * Reviewable public-page facts proposed for an archive candidate. Values are
 * limited to safe metadata fields and public evidence URLs; source artifacts,
 * chat content, contact data, and reviewer identity are deliberately absent.
 */
export const archiveCandidateFieldReviews = mysqlTable(
  "archive_candidate_field_reviews",
  {
    id: int("id").autoincrement().primaryKey(),
    candidateId: int("candidateId").notNull(),
    field: mysqlEnum("field", ["title", "description", "canonical_url", "official_source_url"]).notNull(),
    currentValue: text("currentValue"),
    proposedValue: text("proposedValue").notNull(),
    evidenceUrl: varchar("evidenceUrl", { length: 2048 }).notNull(),
    extractionMethod: mysqlEnum("extractionMethod", ["public_page_metadata", "canonical_redirect"]).notNull(),
    state: mysqlEnum("state", ["pending", "accepted", "rejected"]).default("pending").notNull(),
    retrievedAt: timestamp("retrievedAt").notNull(),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    candidateStateIdx: index("archive_candidate_field_reviews_candidate_state_idx").on(table.candidateId, table.state),
    candidateFieldIdx: index("archive_candidate_field_reviews_candidate_field_idx").on(table.candidateId, table.field),
    candidateFk: foreignKey({ columns: [table.candidateId], foreignColumns: [archiveImportCandidates.id] }).onDelete("cascade"),
  })
);

export type ArchiveCandidateFieldReview = typeof archiveCandidateFieldReviews.$inferSelect;

/** A non-publishing curation register groups exactly the staged expansion work and its evidence standard. */
export const curationRegisters = mysqlTable(
  "curation_registers",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    targetSize: int("targetSize").notNull(),
    status: mysqlEnum("status", ["staged", "reviewing", "completed"]).default("staged").notNull(),
    evidenceStandard: varchar("evidenceStandard", { length: 160 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    slugUq: uniqueIndex("curation_registers_slug_uq").on(table.slug),
    statusIdx: index("curation_registers_status_idx").on(table.status),
  })
);

export type CurationRegister = typeof curationRegisters.$inferSelect;

/** Maps a staged pending submission to one curation register without exposing contributor personal data. */
export const curationRegisterEntries = mysqlTable(
  "curation_register_entries",
  {
    id: int("id").autoincrement().primaryKey(),
    registerId: int("registerId").notNull(),
    candidateUrl: varchar("candidateUrl", { length: 2048 }).notNull(),
    submissionId: int("submissionId"),
    sequence: int("sequence").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    registerSequenceUq: uniqueIndex("curation_register_entries_register_sequence_uq").on(table.registerId, table.sequence),
    candidateUrlUq: uniqueIndex("curation_register_entries_candidate_url_uq").on(table.candidateUrl),
    registerFk: foreignKey({ columns: [table.registerId], foreignColumns: [curationRegisters.id] }).onDelete("cascade"),
    submissionFk: foreignKey({ columns: [table.submissionId], foreignColumns: [submissions.id] }).onDelete("cascade"),
  })
);

export type CurationRegisterEntry = typeof curationRegisterEntries.$inferSelect;

/** Owner-managed, non-identifying trusted source domains. Advisory mode does not auto-publish or auto-approve candidates. */
export const trustedSourceDomains = mysqlTable(
  "trusted_source_domains",
  {
    id: int("id").autoincrement().primaryKey(),
    domain: varchar("domain", { length: 255 }).notNull(),
    status: mysqlEnum("status", ["active", "disabled"]).default("active").notNull(),
    mode: mysqlEnum("mode", ["advisory"]).default("advisory").notNull(),
    note: varchar("note", { length: 500 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    domainUq: uniqueIndex("trusted_source_domains_domain_uq").on(table.domain),
    statusIdx: index("trusted_source_domains_status_idx").on(table.status),
  })
);

export type TrustedSourceDomain = typeof trustedSourceDomains.$inferSelect;

/**
 * Audit log for tracking changes and moderation actions.
 */
export const auditLogs = mysqlTable(
  "audit_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    action: varchar("action", { length: 255 }).notNull(),
    entityType: varchar("entityType", { length: 255 }).notNull(),
    entityId: int("entityId").notNull(),
    changes: json("changes"),
    reason: text("reason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("userId_idx").on(table.userId),
    actionIdx: index("action_idx").on(table.action),
    entityTypeIdx: index("entityType_idx").on(table.entityType),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("restrict"),
  })
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Anonymous search events used to understand resource-discovery quality.
 * No user identifier, IP address, or session identifier is persisted.
 */
export const searchAnalytics = mysqlTable(
  "search_analytics",
  {
    id: int("id").autoincrement().primaryKey(),
    query: varchar("query", { length: 255 }).notNull(),
    normalizedQuery: varchar("normalizedQuery", { length: 255 }).notNull(),
    resultCount: int("resultCount").notNull(),
    relationshipIntent: varchar("relationshipIntent", { length: 64 }),
    eventType: mysqlEnum("eventType", ["search", "result_click"]).notNull().default("search"),
    latencyMs: int("latencyMs"),
    clickedResourceId: int("clickedResourceId"),
    hadPreviousQuery: boolean("hadPreviousQuery").notNull().default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    normalizedQueryIdx: index("search_analytics_normalized_query_idx").on(table.normalizedQuery),
    createdAtIdx: index("search_analytics_created_at_idx").on(table.createdAt),
    eventTypeCreatedIdx: index("search_analytics_event_created_idx").on(table.eventType, table.createdAt),
  })
);

export type SearchAnalyticsEvent = typeof searchAnalytics.$inferSelect;
export type InsertSearchAnalyticsEvent = typeof searchAnalytics.$inferInsert;

/**
 * Maintainer-authored relevance cases. Expected resource IDs are human judgements,
 * not generated relevance claims, and cases remain non-public until approved.
 */
export const searchEvaluationCases = mysqlTable(
  "search_evaluation_cases",
  {
    id: int("id").autoincrement().primaryKey(),
    query: varchar("query", { length: 255 }).notNull(),
    expectedResourceIds: json("expectedResourceIds").$type<number[]>().notNull(),
    notes: text("notes"),
    status: mysqlEnum("status", ["draft", "approved", "rejected"]).notNull().default("draft"),
    createdBy: int("createdBy").notNull(),
    reviewedBy: int("reviewedBy"),
    reviewNote: text("reviewNote"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
  },
  (table) => ({
    statusCreatedIdx: index("search_eval_status_created_idx").on(table.status, table.createdAt),
    createdByFk: foreignKey({ columns: [table.createdBy], foreignColumns: [users.id] }).onDelete("restrict"),
    reviewedByFk: foreignKey({ columns: [table.reviewedBy], foreignColumns: [users.id] }).onDelete("set null"),
  })
);

export type SearchEvaluationCase = typeof searchEvaluationCases.$inferSelect;
export type InsertSearchEvaluationCase = typeof searchEvaluationCases.$inferInsert;

/**
 * Community resource reports are queued for moderator review; they never alter
 * public resource data automatically.
 */
export const resourceReports = mysqlTable(
  "resource_reports",
  {
    id: int("id").autoincrement().primaryKey(),
    resourceId: int("resourceId").notNull(),
    reporterId: int("reporterId").notNull(),
    reason: mysqlEnum("reason", ["spam", "duplicate", "inaccurate", "malicious", "other"]).notNull(),
    details: text("details"),
    status: mysqlEnum("status", ["open", "resolved", "dismissed"]).default("open").notNull(),
    reviewedBy: int("reviewedBy"),
    reviewNote: text("reviewNote"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
  },
  (table) => ({
    resourceStatusIdx: index("resource_reports_resource_status_idx").on(table.resourceId, table.status),
    reporterIdx: index("resource_reports_reporter_idx").on(table.reporterId),
    statusCreatedIdx: index("resource_reports_status_created_idx").on(table.status, table.createdAt),
    resourceFk: foreignKey({ columns: [table.resourceId], foreignColumns: [resources.id] }).onDelete("cascade"),
    reporterFk: foreignKey({ columns: [table.reporterId], foreignColumns: [users.id] }).onDelete("restrict"),
    reviewerFk: foreignKey({ columns: [table.reviewedBy], foreignColumns: [users.id] }).onDelete("set null"),
  })
);

export type ResourceReport = typeof resourceReports.$inferSelect;
export type InsertResourceReport = typeof resourceReports.$inferInsert;

/**
 * Contributor-proposed resource corrections. Suggestions are never applied
 * automatically; moderators review them against the existing resource data.
 */
export const resourceEditSuggestions = mysqlTable(
  "resource_edit_suggestions",
  {
    id: int("id").autoincrement().primaryKey(),
    resourceId: int("resourceId").notNull(),
    suggestedBy: int("suggestedBy").notNull(),
    changes: json("changes").notNull(),
    note: text("note"),
    status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
    reviewedBy: int("reviewedBy"),
    reviewNote: text("reviewNote"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    reviewedAt: timestamp("reviewedAt"),
  },
  (table) => ({
    resourceStatusIdx: index("resource_edit_suggestions_resource_status_idx").on(table.resourceId, table.status),
    suggestedByIdx: index("resource_edit_suggestions_suggested_by_idx").on(table.suggestedBy),
    statusCreatedIdx: index("resource_edit_suggestions_status_created_idx").on(table.status, table.createdAt),
    resourceFk: foreignKey({ columns: [table.resourceId], foreignColumns: [resources.id] }).onDelete("cascade"),
    suggestedByFk: foreignKey({ columns: [table.suggestedBy], foreignColumns: [users.id] }).onDelete("restrict"),
    reviewedByFk: foreignKey({ columns: [table.reviewedBy], foreignColumns: [users.id] }).onDelete("set null"),
  })
);

export type ResourceEditSuggestion = typeof resourceEditSuggestions.$inferSelect;
export type InsertResourceEditSuggestion = typeof resourceEditSuggestions.$inferInsert;

/**
 * Immutable reputation events used to explain and safely aggregate user karma.
 */
export const reputationEvents = mysqlTable(
  "reputation_events",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    points: int("points").notNull(),
    reason: varchar("reason", { length: 120 }).notNull(),
    entityType: varchar("entityType", { length: 80 }).notNull(),
    entityId: int("entityId").notNull(),
    eventKey: varchar("eventKey", { length: 255 }).notNull().unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("reputation_user_idx").on(table.userId),
    reasonIdx: index("reputation_reason_idx").on(table.reason),
    entityIdx: index("reputation_entity_idx").on(table.entityType, table.entityId),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    }).onDelete("cascade"),
  })
);

export type ReputationEvent = typeof reputationEvents.$inferSelect;
export type InsertReputationEvent = typeof reputationEvents.$inferInsert;
