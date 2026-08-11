import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getApprovedResources,
  listApprovedResources,
  getResourceBySlug,
  getResourceById,
  getResourcesByCategory,
  searchResources,
  getRelationshipsBySource,
  getRelationshipsByTarget,
  getUserVote,
  getUserBookmarks,
  isBookmarked,
  getUserCollections,
  getCollectionBySlug,
  getCollectionResources,
  // bookmarks imported from schema
  getCategories,
  getCategoryBySlug,
  getSubcategoriesByCategory,
  getResourceTags,
  getPendingSubmissions,
  getSubmissionById,
  getUserSubmissions,
  getPendingRelationships,
  getAuditLogs,
  recordSearchAnalytics,
  createAuditLog,
  updateUserReputation,
  recordReputationEvent,
  removeReputationEvent,
  getUserReputationEvents,
  checkDuplicateByUrl,
  checkPendingSubmissionByUrl,
  checkDuplicateByTitle,
  getOrCreateTag,
  getUserById,
} from "./db";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { searchService } from "./search";
import { assertSafePublicUrl, fetchResourceMetadata } from "./urlMetadata";
import { canViewCollection, collectionSlug, normalizeProfileUpdate } from "./community";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Resources Router
  resources: router({
    // Get all approved resources with pagination
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        const resources = await getApprovedResources(input.limit, input.offset);
        return resources;
      }),

    // Filtered resource discovery with pagination and category/pricing/tag facets
    listFiltered: publicProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
          query: z.string().trim().max(200).optional(),
          categoryId: z.number().int().positive().optional(),
          subcategoryId: z.number().int().positive().optional(),
          pricing: z.enum(["free", "freemium", "paid", "open_source", "enterprise"]).optional(),
          tag: z.string().trim().max(80).optional(),
          sort: z.enum(["popular", "newest"]).default("popular"),
        })
      )
      .query(({ input }) => listApprovedResources(input)),

    // Get resource by slug
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const resource = await getResourceBySlug(input.slug);
        if (!resource) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        }
        return resource;
      }),

    // Get resource by ID
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const resource = await getResourceById(input.id);
        if (!resource) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        }
        return resource;
      }),

    // Get resources by category
    getByCategory: publicProcedure
      .input(
        z.object({
          categoryId: z.number(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return getResourcesByCategory(input.categoryId, input.limit, input.offset);
      }),

    // Search resources
    search: publicProcedure
      .input(
        z.object({
          query: z.string().min(1),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return searchResources(input.query, input.limit, input.offset);
      }),

    // Get the current user's submitted resources and moderation statuses
    mySubmissions: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(({ input, ctx }) => getUserSubmissions(ctx.user.id, input.limit, input.offset)),

    // Fetch safe public metadata for submission preview
    previewMetadata: publicProcedure
      .input(z.object({ url: z.string().url() }))
      .query(async ({ input }) => {
        assertSafePublicUrl(input.url);
        return fetchResourceMetadata(input.url);
      }),

    // Check for duplicate by title
    checkDuplicateByTitle: publicProcedure
      .input(z.object({ title: z.string(), categoryId: z.number() }))
      .query(async ({ input }) => {
        const duplicates = await checkDuplicateByTitle(input.title, input.categoryId);
        return duplicates;
      }),

    // Check for duplicate by URL
    checkDuplicateByUrl: publicProcedure
      .input(z.object({ url: z.string() }))
      .query(async ({ input }) => {
        const duplicate = await checkDuplicateByUrl(input.url);
        if (duplicate) return { ...duplicate, duplicateType: "published_resource" as const };
        const pending = await checkPendingSubmissionByUrl(input.url);
        return pending ? { ...pending, duplicateType: "pending_submission" as const } : undefined;
      }),

    // Submit resource for human moderation
    submitResource: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          url: z.string().url(),
          description: z.string().optional(),
          categoryId: z.number(),
          subcategoryId: z.number().optional(),
          pricing: z.enum(["free", "freemium", "paid", "open_source", "enterprise"]),
          license: z.string().optional(),
          builtBy: z.string().optional(),
          builtByUrl: z.string().url().optional(),
          tags: z.array(z.string()).optional(),
          suggestedRelationships: z
            .array(
              z.object({
                targetId: z.number().int().positive(),
                type: z.enum([
                  "alternative_to",
                  "similar_to",
                  "integrates_with",
                  "built_by",
                  "depends_on",
                  "part_of",
                  "competitor_of",
                ]),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const safeUrl = assertSafePublicUrl(input.url).toString();
        const duplicateUrl = await checkDuplicateByUrl(safeUrl);
        const pendingDuplicate = await checkPendingSubmissionByUrl(safeUrl);
        if (duplicateUrl || pendingDuplicate) {
          throw new TRPCError({
            code: "CONFLICT",
            message: duplicateUrl
              ? "A resource with this URL already exists"
              : "A submission with this URL is already awaiting moderation",
          });
        }

        const result = await db.insert(require("../drizzle/schema").submissions).values({
          submittedBy: ctx.user.id,
          title: input.title.trim(),
          url: safeUrl,
          description: input.description?.trim() || undefined,
          categoryId: input.categoryId,
          subcategoryId: input.subcategoryId,
          pricing: input.pricing,
          license: input.license?.trim() || undefined,
          builtBy: input.builtBy?.trim() || undefined,
          builtByUrl: input.builtByUrl,
          tags: input.tags ?? [],
          suggestedRelationships: input.suggestedRelationships ?? [],
          status: "pending",
        });

        const submissionId = result[0].insertId;
        await createAuditLog(ctx.user.id, "create", "submission", submissionId);

        return { id: submissionId, status: "pending" };
      }),

    // Create resource (submit)
    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          url: z.string().url(),
          description: z.string().optional(),
          categoryId: z.number(),
          subcategoryId: z.number().optional(),
          pricing: z.enum(["free", "freemium", "paid", "open_source", "enterprise"]),
          license: z.string().optional(),
          builtBy: z.string().optional(),
          builtByUrl: z.string().url().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Check for duplicates
        const duplicateUrl = await checkDuplicateByUrl(input.url);
        if (duplicateUrl) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A resource with this URL already exists",
          });
        }

        const slug = input.title.toLowerCase().replace(/\s+/g, "-");

        // Create resource (pending approval)
        const result = await db.insert(require("../drizzle/schema").resources).values({
          title: input.title,
          slug,
          description: input.description,
          url: input.url,
          categoryId: input.categoryId,
          subcategoryId: input.subcategoryId,
          pricing: input.pricing,
          license: input.license,
          builtBy: input.builtBy,
          builtByUrl: input.builtByUrl,
          submittedBy: ctx.user.id,
          status: "pending",
        });

        const resourceId = result[0].insertId;

        // Add tags
        if (input.tags && input.tags.length > 0) {
          for (const tagName of input.tags) {
            const tag = await getOrCreateTag(tagName);
            if (tag) {
              await db.insert(require("../drizzle/schema").resourceTags).values({
                resourceId,
                tagId: tag.id,
              });
            }
          }
        }

        // Create audit log
        await createAuditLog(ctx.user.id, "create", "resource", resourceId);

        return { id: resourceId, status: "pending" };
      }),

    // Update resource (admin only)
    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().trim().min(1).max(255).optional(),
          description: z.string().max(5000).optional(),
          pricing: z.enum(["free", "freemium", "paid", "open_source", "enterprise"]).optional(),
          license: z.string().max(255).optional(),
          builtBy: z.string().max(255).optional(),
          status: z.enum(["approved", "pending", "rejected"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can edit published resources" });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const resource = await getResourceById(input.id);
        if (!resource) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        }

        const updateData: any = {};
        if (input.title !== undefined) updateData.title = input.title;
        if (input.description !== undefined) updateData.description = input.description || null;
        if (input.pricing !== undefined) updateData.pricing = input.pricing;
        if (input.license !== undefined) updateData.license = input.license || null;
        if (input.builtBy !== undefined) updateData.builtBy = input.builtBy || null;
        if (input.status) {
          updateData.status = input.status;
          if (input.status === "approved") {
            updateData.approvedAt = new Date();
          }
        }

        await db
          .update(require("../drizzle/schema").resources)
          .set(updateData)
          .where(require("drizzle-orm").eq(require("../drizzle/schema").resources.id, input.id));

        await createAuditLog(ctx.user.id, "update", "resource", input.id, updateData);

        return { success: true };
      }),
  }),

  // Relationships Router
  relationships: router({
    // Get relationships for a resource (outgoing)
    getBySource: publicProcedure
      .input(
        z.object({
          sourceId: z.number(),
          type: z
            .enum([
              "alternative_to",
              "similar_to",
              "integrates_with",
              "built_by",
              "depends_on",
              "part_of",
              "competitor_of",
            ])
            .optional(),
        })
      )
      .query(async ({ input }) => {
        return getRelationshipsBySource(input.sourceId, input.type);
      }),

    // Get relationships for a resource (incoming)
    getByTarget: publicProcedure
      .input(
        z.object({
          targetId: z.number(),
          type: z
            .enum([
              "alternative_to",
              "similar_to",
              "integrates_with",
              "built_by",
              "depends_on",
              "part_of",
              "competitor_of",
            ])
            .optional(),
        })
      )
      .query(async ({ input }) => {
        return getRelationshipsByTarget(input.targetId, input.type);
      }),

    // Create relationship
    create: protectedProcedure
      .input(
        z.object({
          sourceId: z.number(),
          targetId: z.number(),
          type: z.enum([
            "alternative_to",
            "similar_to",
            "integrates_with",
            "built_by",
            "depends_on",
            "part_of",
            "competitor_of",
          ]),
          strength: z.number().min(0).max(1).default(0.5),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const result = await db
          .insert(require("../drizzle/schema").relationships)
          .values({
            sourceId: input.sourceId,
            targetId: input.targetId,
            type: input.type,
            strength: input.strength,
            createdBy: ctx.user.id,
            status: "pending",
          });

        await createAuditLog(ctx.user.id, "create", "relationship", result[0].insertId);

        return { id: result[0].insertId, status: "pending" };
      }),

    // Approve relationship (moderator+)
    approve: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const relationship = await db
          .select()
          .from(require("../drizzle/schema").relationships)
          .where(require("drizzle-orm").eq(require("../drizzle/schema").relationships.id, input.id))
          .limit(1);
        if (!relationship[0]) throw new TRPCError({ code: "NOT_FOUND" });

        await db
          .update(require("../drizzle/schema").relationships)
          .set({ status: "approved", verified: true })
          .where(require("drizzle-orm").eq(require("../drizzle/schema").relationships.id, input.id));

        await createAuditLog(ctx.user.id, "approve", "relationship", input.id);
        await recordReputationEvent({ userId: relationship[0].createdBy, points: 5, reason: "Relationship approved by moderation", entityType: "relationship", entityId: input.id, eventKey: `relationship-approved:${input.id}` });
        return { success: true };
      }),
  }),

  // Voting Router
  votes: router({
    // Vote on resource
    voteResource: protectedProcedure
      .input(
        z.object({
          resourceId: z.number(),
          type: z.enum(["upvote", "downvote"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const resource = await getResourceById(input.resourceId);
        if (!resource) throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        const existingVote = await getUserVote(ctx.user.id, input.resourceId);
        const reputationEventKey = `resource-upvote:${ctx.user.id}:${input.resourceId}`;

        if (existingVote) {
          if (existingVote.type === input.type) {
            await db
              .delete(require("../drizzle/schema").votes)
              .where(require("drizzle-orm").eq(require("../drizzle/schema").votes.id, existingVote.id));
            if (existingVote.type === "upvote") await removeReputationEvent(reputationEventKey);
          } else {
            await db
              .update(require("../drizzle/schema").votes)
              .set({ type: input.type })
              .where(require("drizzle-orm").eq(require("../drizzle/schema").votes.id, existingVote.id));
            if (input.type === "upvote" && resource.submittedBy !== ctx.user.id) {
              await recordReputationEvent({ userId: resource.submittedBy, points: 1, reason: "Resource received an upvote", entityType: "resource", entityId: resource.id, eventKey: reputationEventKey });
            } else if (input.type === "downvote") {
              await removeReputationEvent(reputationEventKey);
            }
          }
        } else {
          await db.insert(require("../drizzle/schema").votes).values({
            userId: ctx.user.id,
            resourceId: input.resourceId,
            type: input.type,
          });
          if (input.type === "upvote" && resource.submittedBy !== ctx.user.id) {
            await recordReputationEvent({ userId: resource.submittedBy, points: 1, reason: "Resource received an upvote", entityType: "resource", entityId: resource.id, eventKey: reputationEventKey });
          }
        }

        return { success: true };
      }),

    // Get user's vote on resource
    getResourceVote: protectedProcedure
      .input(z.object({ resourceId: z.number() }))
      .query(async ({ input, ctx }) => {
        return getUserVote(ctx.user.id, input.resourceId);
      }),

    // Vote on relationship
    voteRelationship: protectedProcedure
      .input(
        z.object({
          relationshipId: z.number(),
          type: z.enum(["upvote", "downvote"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const relationship = await db
          .select()
          .from(require("../drizzle/schema").relationships)
          .where(require("drizzle-orm").eq(require("../drizzle/schema").relationships.id, input.relationshipId))
          .limit(1);
        if (!relationship[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Relationship not found" });
        const existingVote = await getUserVote(ctx.user.id, undefined, input.relationshipId);
        const reputationEventKey = `relationship-upvote:${ctx.user.id}:${input.relationshipId}`;

        if (existingVote) {
          if (existingVote.type === input.type) {
            await db
              .delete(require("../drizzle/schema").votes)
              .where(require("drizzle-orm").eq(require("../drizzle/schema").votes.id, existingVote.id));
            if (existingVote.type === "upvote") await removeReputationEvent(reputationEventKey);
          } else {
            await db
              .update(require("../drizzle/schema").votes)
              .set({ type: input.type })
              .where(require("drizzle-orm").eq(require("../drizzle/schema").votes.id, existingVote.id));
            if (input.type === "upvote" && relationship[0].createdBy !== ctx.user.id) {
              await recordReputationEvent({ userId: relationship[0].createdBy, points: 1, reason: "Relationship received an upvote", entityType: "relationship", entityId: input.relationshipId, eventKey: reputationEventKey });
            } else if (input.type === "downvote") {
              await removeReputationEvent(reputationEventKey);
            }
          }
        } else {
          await db.insert(require("../drizzle/schema").votes).values({
            userId: ctx.user.id,
            relationshipId: input.relationshipId,
            type: input.type,
          });
          if (input.type === "upvote" && relationship[0].createdBy !== ctx.user.id) {
            await recordReputationEvent({ userId: relationship[0].createdBy, points: 1, reason: "Relationship received an upvote", entityType: "relationship", entityId: input.relationshipId, eventKey: reputationEventKey });
          }
        }

        return { success: true };
      }),

    getRelationshipVote: protectedProcedure
      .input(z.object({ relationshipId: z.number() }))
      .query(async ({ input, ctx }) => {
        return getUserVote(ctx.user.id, undefined, input.relationshipId);
      }),
  }),

  // Bookmarks Router
  bookmarks: router({
    // Get user's bookmarks
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        return db
          .select({
            id: require("../drizzle/schema").resources.id,
            title: require("../drizzle/schema").resources.title,
            slug: require("../drizzle/schema").resources.slug,
            description: require("../drizzle/schema").resources.description,
            url: require("../drizzle/schema").resources.url,
            pricing: require("../drizzle/schema").resources.pricing,
            logo: require("../drizzle/schema").resources.logo,
            upvotes: require("../drizzle/schema").resources.upvotes,
            bookmarkedAt: require("../drizzle/schema").bookmarks.createdAt,
          })
          .from(require("../drizzle/schema").bookmarks)
          .innerJoin(
            require("../drizzle/schema").resources,
            require("drizzle-orm").eq(
              require("../drizzle/schema").bookmarks.resourceId,
              require("../drizzle/schema").resources.id
            )
          )
          .where(require("drizzle-orm").eq(require("../drizzle/schema").bookmarks.userId, ctx.user.id))
          .orderBy(require("drizzle-orm").desc(require("../drizzle/schema").bookmarks.createdAt))
          .limit(input.limit)
          .offset(input.offset);
      }),

    // Toggle bookmark
    toggle: protectedProcedure
      .input(z.object({ resourceId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const bookmarked = await isBookmarked(ctx.user.id, input.resourceId);

        if (bookmarked) {
          await db
            .delete(require("../drizzle/schema").bookmarks)
            .where(
              require("drizzle-orm").and(
                require("drizzle-orm").eq(require("../drizzle/schema").bookmarks.userId, ctx.user.id),
                require("drizzle-orm").eq(
                  require("../drizzle/schema").bookmarks.resourceId,
                  input.resourceId
                )
              )
            );
        } else {
          await db.insert(require("../drizzle/schema").bookmarks).values({
            userId: ctx.user.id,
            resourceId: input.resourceId,
          });
        }

        return { bookmarked: !bookmarked };
      }),

    // Check if bookmarked
    isBookmarked: protectedProcedure
      .input(z.object({ resourceId: z.number() }))
      .query(async ({ input, ctx }) => {
        return isBookmarked(ctx.user.id, input.resourceId);
      }),
  }),

  // Categories Router
  categories: router({
    // Get all categories
    list: publicProcedure.query(async () => {
      return getCategories();
    }),

    // Get category by slug
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getCategoryBySlug(input.slug);
      }),

    // Get subcategories
    getSubcategories: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return getSubcategoriesByCategory(input.categoryId);
      }),
  }),

  // Collections Router
  collections: router({
    // Get user's collections
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input, ctx }) => {
        return getUserCollections(ctx.user.id, input.limit, input.offset);
      }),

    // Get collection by slug
    getBySlug: publicProcedure
      .input(
        z.object({
          ownerId: z.number(),
          slug: z.string(),
        })
      )
      .query(async ({ input }) => {
        return getCollectionBySlug(input.ownerId, input.slug);
      }),

    // Get collection resources with full resource details
    getResources: publicProcedure
      .input(z.object({ collectionId: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return [];
        const collection = await db
          .select({ ownerId: require("../drizzle/schema").collections.ownerId, isPublic: require("../drizzle/schema").collections.isPublic })
          .from(require("../drizzle/schema").collections)
          .where(require("drizzle-orm").eq(require("../drizzle/schema").collections.id, input.collectionId))
          .limit(1);
        if (!collection[0] || !canViewCollection(collection[0], ctx.user?.id)) return [];
        const items = await db
          .select({
            id: require("../drizzle/schema").resources.id,
            title: require("../drizzle/schema").resources.title,
            slug: require("../drizzle/schema").resources.slug,
            description: require("../drizzle/schema").resources.description,
            url: require("../drizzle/schema").resources.url,
            pricing: require("../drizzle/schema").resources.pricing,
            logo: require("../drizzle/schema").resources.logo,
            upvotes: require("../drizzle/schema").resources.upvotes,
          })
          .from(require("../drizzle/schema").collectionResources)
          .innerJoin(
            require("../drizzle/schema").resources,
            require("drizzle-orm").eq(
              require("../drizzle/schema").collectionResources.resourceId,
              require("../drizzle/schema").resources.id
            )
          )
          .where(
            require("drizzle-orm").eq(
              require("../drizzle/schema").collectionResources.collectionId,
              input.collectionId
            )
          )
          .orderBy(
            require("drizzle-orm").asc(require("../drizzle/schema").collectionResources.order)
          );
        return items;
      }),

    // Get single collection by id
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) return undefined;
        const result = await db
          .select()
          .from(require("../drizzle/schema").collections)
          .where(
            require("drizzle-orm").eq(
              require("../drizzle/schema").collections.id,
              input.id
            )
          )
          .limit(1);
        const collection = result[0];
        if (!collection || !canViewCollection({ ownerId: collection.ownerId, isPublic: collection.isPublic }, ctx.user?.id)) return undefined;
        return collection;
      }),

    // Create collection
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          isPublic: z.boolean().default(true),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const slug = collectionSlug(input.name);

        const result = await db.insert(require("../drizzle/schema").collections).values({
          ownerId: ctx.user.id,
          name: input.name,
          slug,
          description: input.description,
          isPublic: input.isPublic,
        });

        return { id: result[0].insertId, slug };
      }),

    // Update collection metadata
    update: protectedProcedure
      .input(
        z.object({
          collectionId: z.number(),
          name: z.string().min(1).max(255),
          description: z.string().max(2000).optional(),
          isPublic: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const collection = await db
          .select()
          .from(require("../drizzle/schema").collections)
          .where(require("drizzle-orm").eq(require("../drizzle/schema").collections.id, input.collectionId))
          .limit(1);
        if (!collection[0] || collection[0].ownerId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
        await db
          .update(require("../drizzle/schema").collections)
          .set({ name: input.name.trim(), description: input.description?.trim() || null, isPublic: input.isPublic })
          .where(require("drizzle-orm").eq(require("../drizzle/schema").collections.id, input.collectionId));
        await createAuditLog(ctx.user.id, "update", "collection", input.collectionId, input);
        return { success: true };
      }),

    // Add resource to collection
    addResource: protectedProcedure
      .input(
        z.object({
          collectionId: z.number(),
          resourceId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Verify ownership
        const collection = await db
          .select()
          .from(require("../drizzle/schema").collections)
          .where(require("drizzle-orm").eq(require("../drizzle/schema").collections.id, input.collectionId))
          .limit(1);

        if (!collection || collection[0].ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db.insert(require("../drizzle/schema").collectionResources).values({
          collectionId: input.collectionId,
          resourceId: input.resourceId,
        });

        return { success: true };
      }),

    // Remove resource from collection
    removeResource: protectedProcedure
      .input(
        z.object({
          collectionId: z.number(),
          resourceId: z.number(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const collection = await db
          .select()
          .from(require("../drizzle/schema").collections)
          .where(
            require("drizzle-orm").eq(
              require("../drizzle/schema").collections.id,
              input.collectionId
            )
          )
          .limit(1);

        if (!collection || collection[0].ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db
          .delete(require("../drizzle/schema").collectionResources)
          .where(
            require("drizzle-orm").and(
              require("drizzle-orm").eq(
                require("../drizzle/schema").collectionResources.collectionId,
                input.collectionId
              ),
              require("drizzle-orm").eq(
                require("../drizzle/schema").collectionResources.resourceId,
                input.resourceId
              )
            )
          );

        return { success: true };
      }),

    // Delete collection
    delete: protectedProcedure
      .input(z.object({ collectionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const collection = await db
          .select()
          .from(require("../drizzle/schema").collections)
          .where(
            require("drizzle-orm").eq(
              require("../drizzle/schema").collections.id,
              input.collectionId
            )
          )
          .limit(1);

        if (!collection || collection[0].ownerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        await db
          .delete(require("../drizzle/schema").collections)
          .where(
            require("drizzle-orm").eq(
              require("../drizzle/schema").collections.id,
              input.collectionId
            )
          );

        return { success: true };
      }),
  }),

  // Moderation Router
  moderation: router({
    getAuditLogs: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
      .query(({ input }) => getAuditLogs(input.limit, input.offset)),

    // Get pending relationship suggestions
    getPendingRelationships: adminProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(50),
          offset: z.number().min(0).default(0),
        })
      )
      .query(({ input }) => getPendingRelationships(input.limit, input.offset)),

    // Get pending submissions
    getPendingSubmissions: adminProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(async ({ input }) => {
        return getPendingSubmissions(input.limit, input.offset);
      }),

    // Approve submission
    approveSubmission: adminProcedure
      .input(z.object({ submissionId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const submission = await getSubmissionById(input.submissionId);
        if (!submission) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        if (submission.resourceId) {
          return { success: true, resourceId: submission.resourceId };
        }

        const baseSlug = submission.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const slug = `${baseSlug || "resource"}-${submission.id}`;
        const resourceResult = await db.insert(require("../drizzle/schema").resources).values({
          title: submission.title,
          slug,
          description: submission.description,
          url: submission.url,
          categoryId: submission.categoryId,
          subcategoryId: submission.subcategoryId,
          pricing: submission.pricing,
          license: submission.license,
          builtBy: submission.builtBy,
          builtByUrl: submission.builtByUrl,
          submittedBy: submission.submittedBy,
          status: "approved",
          approvedAt: new Date(),
        });
        const resourceId = resourceResult[0].insertId;

        const tagNames = Array.isArray(submission.tags) ? (submission.tags as string[]) : [];
        for (const tagName of tagNames) {
          const tag = await getOrCreateTag(tagName);
          if (tag) {
            await db.insert(require("../drizzle/schema").resourceTags).values({ resourceId, tagId: tag.id });
          }
        }

        await db
          .update(require("../drizzle/schema").submissions)
          .set({
            status: "approved",
            resourceId,
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
          })
          .where(require("drizzle-orm").eq(require("../drizzle/schema").submissions.id, input.submissionId));

        await createAuditLog(ctx.user.id, "approve", "submission", input.submissionId, { resourceId });
        await recordReputationEvent({ userId: submission.submittedBy, points: 10, reason: "Resource submission approved", entityType: "submission", entityId: input.submissionId, eventKey: `submission-approved:${input.submissionId}` });

        return { success: true, resourceId, slug };
      }),

    // Reject relationship suggestion
    rejectRelationship: adminProcedure
      .input(z.object({ relationshipId: z.number(), reason: z.string().max(1000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await db
          .update(require("../drizzle/schema").relationships)
          .set({ status: "rejected" })
          .where(require("drizzle-orm").eq(require("../drizzle/schema").relationships.id, input.relationshipId));
        await createAuditLog(ctx.user.id, "reject", "relationship", input.relationshipId, { reason: input.reason });
        return { success: true };
      }),

    // Reject submission
    rejectSubmission: adminProcedure
      .input(
        z.object({
          submissionId: z.number(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        await db
          .update(require("../drizzle/schema").submissions)
          .set({
            status: "rejected",
            rejectionReason: input.reason,
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
          })
          .where(require("drizzle-orm").eq(require("../drizzle/schema").submissions.id, input.submissionId));

        await createAuditLog(ctx.user.id, "reject", "submission", input.submissionId, {
          reason: input.reason,
        });

        return { success: true };
      }),
  }),

  // Search Router
  search: router({
    advancedSearch: publicProcedure
      .input(
        z.object({
          query: z.string().min(1),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
          filters: z.object({
            categoryId: z.number().int().positive().optional(),
            pricing: z.enum(["free", "freemium", "paid", "open_source", "enterprise"]).optional(),
            tag: z.string().trim().min(1).max(64).optional(),
          }).optional(),
        })
      )
      .query(async ({ input }) => {
        const results = await searchService.advancedSearch(input.query, input.limit, input.offset, input.filters);
        const relationshipIntent = input.query.toLowerCase().match(/\b(alternatives?|integrations?|competitors?|similar)\b/)?.[1];
        void Promise.resolve(recordSearchAnalytics({ query: input.query, resultCount: results.length, relationshipIntent })).catch(() => undefined);
        return results;
      }),

    getSuggestions: publicProcedure
      .input(
        z.object({
          query: z.string().min(1),
          limit: z.number().min(1).max(10).default(5),
        })
      )
      .query(async ({ input }) => {
        return searchService.getSuggestions(input.query, input.limit);
      }),

    getTrending: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).default(5) }))
      .query(async ({ input }) => {
        return searchService.getTrending(input.limit);
      }),
  }),

  // User Router
  user: router({
    // Get user profile
    getProfile: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const user = await getUserById(input.userId);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        // Return sanitized user data
        return {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          bio: user.bio,
          reputation: user.reputation,
          createdAt: user.createdAt,
        };
      }),

    // Reputation summary for the signed-in member
    getReputationSummary: protectedProcedure.query(async ({ ctx }) => {
      const events = await getUserReputationEvents(ctx.user.id, 20);
      return { score: ctx.user.reputation, events };
    }),

    // Update own profile
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          bio: z.string().optional(),
          avatar: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const updateData = normalizeProfileUpdate(input);

        await db
          .update(require("../drizzle/schema").users)
          .set(updateData)
          .where(require("drizzle-orm").eq(require("../drizzle/schema").users.id, ctx.user.id));

        await createAuditLog(ctx.user.id, "update", "user", ctx.user.id, updateData);

        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
