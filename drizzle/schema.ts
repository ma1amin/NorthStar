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
  })
);

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

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
 * Supported types: Alternative To, Similar To, Integrates With, Built By, Depends On, Part Of, Competitor Of
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
      "depends_on",
      "part_of",
      "competitor_of",
    ]).notNull(),
    strength: decimal("strength", { precision: 3, scale: 2 }).default("0.50").notNull(),
    verified: boolean("verified").default(false).notNull(),
    upvotes: int("upvotes").default(0).notNull(),
    createdBy: int("createdBy").notNull(),
    status: mysqlEnum("status", ["approved", "pending", "rejected"]).default("pending").notNull(),
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
