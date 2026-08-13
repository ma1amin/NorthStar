import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, contributionProcedure, metadataProcedure, aiDraftProcedure, router } from "./_core/trpc";
import { z } from "zod";

const relationshipTypeValues = [
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
] as const;

import {
  createApiKeyRecord,
  getApiKeyUsageForOwner,
  getApprovedResources,
  listApprovedResources,
  getResourceBySlug,
  getResourceById,
  getResourcesByCategory,
  searchResources,
  getRelationshipsBySource,
  getRelationshipsByTarget,
  getGraphNeighborhood,
  getUserVote,
  getUserBookmarks,
  isBookmarked,
  getUserCollections,
  getPublicCollections,
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
  listUsersForAdmin,
  setUserRole,
  createResourceReport,
  getOpenResourceReports,
  reviewResourceReport,
  createResourceEditSuggestion,
  getPendingResourceEditSuggestions,
  reviewResourceEditSuggestion,
  recordSearchAnalytics,
  getSearchQualitySummary,
  createSearchEvaluationCase,
  listSearchEvaluationCases,
  reviewSearchEvaluationCase,
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
  getApprovedResourceSources,
  getPublicResourceHistory,
  getLatestResourceFreshness,
  createResourceSource,
  reviewResourceSource,
  recordResourceHistory,
  createFreshnessReview,
  previewDuplicateResolution,
  createDuplicateResolutionProposal,
  confirmDuplicateResolution,
  getPendingResourceSources,
  getFreshnessReviewQueue,
  runFreshnessReviewSweep,
  getProposedDuplicateResolutions,
  listOwnerApiKeys,
  revokeApiKeyRecord,
  createTextIntake,
  getIntakesForOwner,
  getIntakeForOwner,
  submitIntakeForOwner,
  listIntakeCandidatesForModeration,
  reviewIntakeCandidate,
  createVerificationApplication,
  getVerificationForUser,
  listVerificationApplications,
  reviewVerificationApplication,
  createContributorAppeal,
  getContributorAppeals,
  getContributorIntakeAllowance,
  createIngestionSource,
  listIngestionSources,
  reviewIngestionSource,
  createIngestionBatch,
  addIngestionCandidates,
  listIngestionCandidatesForModeration,
  reviewIngestionCandidate,
  createResearchWorkspace,
  listResearchWorkspaces,
  addResourceToWorkspace,
  createOrganizationClaim,
  listOrganizationClaims,
  reviewOrganizationClaim,
  createApiCapacityRequest,
  listApiCapacityRequests,
  reviewApiCapacityRequest,
} from "./db";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { submissions } from "../drizzle/schema";
import { searchService } from "./search";
import { assertSafePublicUrl, fetchResourceMetadata } from "./urlMetadata";
import { canViewCollection, collectionSlug, normalizeProfileUpdate } from "./community";
import { draftResourceReview } from "./aiReview";
import { getSearchCapabilities } from "./searchCapabilities";
import { createHash, randomBytes } from "crypto";
import { buildIntakeCandidates, MAX_INTAKE_TEXT_CHARS } from "./intake";

export const appRouter = router({
  system: systemRouter,

  graph: router({
    neighborhood: publicProcedure
      .input(z.object({ resourceId: z.number().int().positive(), relationshipTypes: z.array(z.enum(relationshipTypeValues)).max(10).optional(), maxEdges: z.number().int().min(1).max(80).default(40) }))
      .query(async ({ input }) => {
        const graph = await getGraphNeighborhood(input.resourceId, input.relationshipTypes, input.maxEdges);
        if (!graph) throw new TRPCError({ code: "NOT_FOUND", message: "Approved resource not found" });
        return graph;
      }),
  }),

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

  apiKeys: router({
    list: protectedProcedure.query(({ ctx }) => listOwnerApiKeys(ctx.user.id)),

    create: protectedProcedure
      .input(z.object({
        name: z.string().trim().min(1).max(100),
        scopes: z.array(z.enum(["resources:read", "search:read", "categories:read", "collections:read"])).min(1).max(4),
        dailyQuota: z.number().int().min(100).max(10000).default(1000),
        expiresAt: z.date().min(new Date()).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const plaintextKey = `ns_live_${randomBytes(24).toString("base64url")}`;
        const keyHash = createHash("sha256").update(plaintextKey).digest("hex");
        const keyPrefix = plaintextKey.slice(0, 16);
        const record = await createApiKeyRecord({ ...input, ownerId: ctx.user.id, keyPrefix, keyHash, expiresAt: input.expiresAt ?? null });
        await createAuditLog(ctx.user.id, "create", "api_key", record.id, { name: input.name, scopes: input.scopes, dailyQuota: input.dailyQuota, expiresAt: input.expiresAt?.toISOString() ?? null });
        return { ...record, key: plaintextKey };
      }),

    usage: protectedProcedure
      .input(z.object({ apiKeyId: z.number().int().positive() }))
      .query(async ({ input, ctx }) => {
        const usage = await getApiKeyUsageForOwner(ctx.user.id, input.apiKeyId);
        if (!usage) throw new TRPCError({ code: "NOT_FOUND", message: "API key not found" });
        return usage;
      }),

    revoke: protectedProcedure
      .input(z.object({ apiKeyId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const revoked = await revokeApiKeyRecord(ctx.user.id, input.apiKeyId);
        if (!revoked) throw new TRPCError({ code: "NOT_FOUND", message: "Active API key not found" });
        await createAuditLog(ctx.user.id, "revoke", "api_key", input.apiKeyId, { reason: "owner_revoked" });
        return { success: true };
      }),
    requestCapacity: protectedProcedure
      .input(z.object({ apiKeyId: z.number().int().positive(), requestedDailyQuota: z.number().int().min(1001).max(100000), rationale: z.string().trim().min(20).max(2000) }))
      .mutation(async ({ input, ctx }) => {
        const id = await createApiCapacityRequest({ ...input, requestedBy: ctx.user.id });
        if (!id) throw new TRPCError({ code: "CONFLICT", message: "A pending request already exists or the active API key was not found" });
        await createAuditLog(ctx.user.id, "request", "api_capacity_request", id, { apiKeyId: input.apiKeyId, requestedDailyQuota: input.requestedDailyQuota });
        return { id };
      }),
  }),

  workspaces: router({
    list: protectedProcedure.query(({ ctx }) => listResearchWorkspaces(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({ name: z.string().trim().min(2).max(255), slug: z.string().trim().min(2).max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), description: z.string().trim().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const id = await createResearchWorkspace({ ...input, ownerId: ctx.user.id });
        if (!id) throw new TRPCError({ code: "CONFLICT", message: "A workspace with this slug already exists" });
        await createAuditLog(ctx.user.id, "create", "research_workspace", id, { name: input.name });
        return { id };
      }),
    pinResource: protectedProcedure
      .input(z.object({ workspaceId: z.number().int().positive(), resourceId: z.number().int().positive(), note: z.string().trim().max(1200).optional() }))
      .mutation(async ({ input, ctx }) => {
        const pinned = await addResourceToWorkspace({ ...input, ownerId: ctx.user.id });
        if (!pinned) throw new TRPCError({ code: "NOT_FOUND", message: "Active workspace not found" });
        await createAuditLog(ctx.user.id, "pin", "workspace_resource", input.resourceId, { workspaceId: input.workspaceId });
        return { success: true };
      }),
  }),

  organizations: router({
    claim: protectedProcedure
      .input(z.object({ organizationName: z.string().trim().min(2).max(255), websiteUrl: z.string().url().max(2048).refine((value) => new URL(value).protocol === "https:", "HTTPS website required"), contactEmail: z.string().trim().email().max(320), evidenceUrl: z.string().url().max(2048).optional(), resourceId: z.number().int().positive().optional(), rationale: z.string().trim().min(20).max(2000) }))
      .mutation(async ({ input, ctx }) => {
        const id = await createOrganizationClaim({ ...input, applicantId: ctx.user.id });
        if (!id) throw new TRPCError({ code: "CONFLICT", message: "A pending claim for this organization already exists" });
        await createAuditLog(ctx.user.id, "request", "organization_claim", id, { organizationName: input.organizationName, resourceId: input.resourceId ?? null });
        return { id };
      }),
  }),

  intake: router({
    list: protectedProcedure.query(({ ctx }) => getIntakesForOwner(ctx.user.id)),
    allowance: protectedProcedure.query(async ({ ctx }) => {
      const allowance = await getContributorIntakeAllowance(ctx.user.id);
      return { ...allowance, remaining: Math.max(0, allowance.limit - allowance.used) };
    }),
    get: protectedProcedure
      .input(z.object({ intakeId: z.number().int().positive() }))
      .query(({ input, ctx }) => getIntakeForOwner(ctx.user.id, input.intakeId)),
    create: contributionProcedure
      .input(z.object({ text: z.string().trim().min(1).max(MAX_INTAKE_TEXT_CHARS), inputType: z.enum(["pasted_text", "links", "text_export"]), inputName: z.string().trim().max(255).optional(), retentionMode: z.enum(["minimized", "review_evidence"]).default("minimized"), consentConfirmed: z.literal(true) }))
      .mutation(async ({ input, ctx }) => {
        const allowance = await getContributorIntakeAllowance(ctx.user.id);
        if (allowance.used >= allowance.limit) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Your daily resource-capture allowance has been reached. Try again tomorrow." });
        const candidates = buildIntakeCandidates(input.text);
        if (!candidates.length) throw new TRPCError({ code: "BAD_REQUEST", message: "No safe web links were found. Add an http or https link to continue." });
        const intakeId = await createTextIntake({ ...input, ownerId: ctx.user.id, candidates });
        if (!intakeId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create intake" });
        await createAuditLog(ctx.user.id, "create", "resource_intake", intakeId, { inputType: input.inputType, retentionMode: input.retentionMode, candidateCount: candidates.length });
        return { intakeId, candidateCount: candidates.length, allowance: { remaining: allowance.limit - allowance.used - 1, verified: allowance.verified } };
      }),
    submit: contributionProcedure
      .input(z.object({ intakeId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const submitted = await submitIntakeForOwner(ctx.user.id, input.intakeId);
        if (!submitted) throw new TRPCError({ code: "CONFLICT", message: "This intake is not ready to submit" });
        await createAuditLog(ctx.user.id, "submit", "resource_intake", input.intakeId, { moderation: "human_required" });
        return { success: true };
      }),
  }),

  contributor: router({
    verification: protectedProcedure.query(({ ctx }) => getVerificationForUser(ctx.user.id)),
    applyForVerification: contributionProcedure
      .input(z.object({ portfolioUrl: z.string().url().max(2048).optional(), rationale: z.string().trim().min(80).max(3000) }))
      .mutation(async ({ input, ctx }) => {
        const id = await createVerificationApplication({ ...input, userId: ctx.user.id });
        if (!id) throw new TRPCError({ code: "CONFLICT", message: "A verification application is already pending" });
        await createAuditLog(ctx.user.id, "create", "contributor_verification_application", id, { portfolioUrl: input.portfolioUrl ?? null });
        return { id };
      }),
    appeals: protectedProcedure.query(({ ctx }) => getContributorAppeals(ctx.user.id)),
    appeal: contributionProcedure
      .input(z.object({ targetType: z.enum(["verification", "intake_candidate", "submission", "account_action"]), targetId: z.number().int().positive(), rationale: z.string().trim().min(30).max(3000) }))
      .mutation(async ({ input, ctx }) => {
        const id = await createContributorAppeal({ ...input, userId: ctx.user.id });
        if (!id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to create appeal" });
        await createAuditLog(ctx.user.id, "create", "contributor_appeal", id, { targetType: input.targetType, targetId: input.targetId });
        return { id };
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

    getTrustContext: publicProcedure
      .input(z.object({ resourceId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const resource = await getResourceById(input.resourceId);
        if (!resource) throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        const [sources, history, freshness] = await Promise.all([
          getApprovedResourceSources(input.resourceId),
          getPublicResourceHistory(input.resourceId),
          getLatestResourceFreshness(input.resourceId),
        ]);
        return { sources, history, freshness };
      }),

    submitSource: contributionProcedure
      .input(z.object({
        resourceId: z.number().int().positive(),
        url: z.string().url().max(2048),
        sourceType: z.enum(["official", "documentation", "repository", "community", "archive", "other"]),
        attribution: z.string().trim().max(500).optional(),
        licenseNote: z.string().trim().max(500).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const resource = await getResourceById(input.resourceId);
        if (!resource) throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        const sourceId = await createResourceSource({ ...input, addedBy: ctx.user.id });
        if (!sourceId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to store source" });
        await createAuditLog(ctx.user.id, "submit_source", "resource_source", sourceId, { resourceId: input.resourceId, sourceType: input.sourceType });
        return { success: true, sourceId };
      }),

    report: contributionProcedure
      .input(z.object({ resourceId: z.number().int().positive(), reason: z.enum(["spam", "duplicate", "inaccurate", "malicious", "other"]), details: z.string().trim().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const resource = await getResourceById(input.resourceId);
        if (!resource) throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        const result = await createResourceReport({ ...input, reporterId: ctx.user.id });
        if (result.duplicate) throw new TRPCError({ code: "CONFLICT", message: "You already have an open report for this resource" });
        if (!result.created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        return { success: true };
      }),

    suggestEdit: contributionProcedure
      .input(z.object({
        resourceId: z.number().int().positive(),
        changes: z.object({
          title: z.string().trim().min(1).max(255).optional(),
          description: z.string().trim().max(5000).optional(),
          url: z.string().url().optional(),
          pricing: z.enum(["free", "freemium", "paid", "open_source", "enterprise"]).optional(),
          license: z.string().trim().max(255).optional(),
          builtBy: z.string().trim().max(255).optional(),
          builtByUrl: z.string().url().optional(),
        }).refine((changes) => Object.values(changes).some((value) => value !== undefined && value !== ""), "Add at least one proposed change"),
        note: z.string().trim().max(2000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const resource = await getResourceById(input.resourceId);
        if (!resource) throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        const changes = Object.fromEntries(Object.entries(input.changes).filter(([, value]) => value !== undefined && value !== ""));
        const result = await createResourceEditSuggestion({ resourceId: input.resourceId, suggestedBy: ctx.user.id, changes, note: input.note });
        if (result.duplicate) throw new TRPCError({ code: "CONFLICT", message: "You already have a pending edit suggestion for this resource" });
        if (!result.created || !result.id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await createAuditLog(ctx.user.id, "suggest_edit", "resource_edit_suggestion", result.id, { resourceId: input.resourceId, fields: Object.keys(changes) });
        return { success: true, id: result.id };
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
    previewMetadata: metadataProcedure
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
                type: z.enum(relationshipTypeValues),
                evidenceUrl: z.string().url().optional(),
                rationale: z.string().trim().min(12).max(2000).optional(),
                sourceContext: z.string().trim().max(255).optional(),
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
          type: z.enum(relationshipTypeValues).optional(),
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
          type: z.enum(relationshipTypeValues).optional(),
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
          type: z.enum(relationshipTypeValues),
          strength: z.number().min(0).max(1).default(0.5),
          evidenceUrl: z.string().url().optional(),
          rationale: z.string().trim().min(12).max(2000).optional(),
          sourceContext: z.string().trim().max(255).optional(),
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
            evidenceUrl: input.evidenceUrl,
            rationale: input.rationale,
            sourceContext: input.sourceContext,
            createdBy: ctx.user.id,
            status: "pending",
          });

        await createAuditLog(ctx.user.id, "create", "relationship", result[0].insertId, { evidenceUrl: input.evidenceUrl, rationale: input.rationale, sourceContext: input.sourceContext });

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
    discover: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(20), offset: z.number().min(0).default(0) }))
      .query(({ input }) => getPublicCollections(input.limit, input.offset)),

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
    getOrganizationClaims: adminProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected", "suspended", "expired"]).default("pending") }))
      .query(({ input }) => listOrganizationClaims(input.status)),
    reviewOrganizationClaim: adminProcedure
      .input(z.object({ claimId: z.number().int().positive(), status: z.enum(["approved", "rejected", "suspended"]), expiresAt: z.date().optional(), reviewNote: z.string().trim().max(2000).optional() }).superRefine((input, context) => {
        if (input.status === "approved" && !input.expiresAt) context.addIssue({ code: z.ZodIssueCode.custom, message: "Approved claims require an expiry date", path: ["expiresAt"] });
      }))
      .mutation(async ({ input, ctx }) => {
        const updated = await reviewOrganizationClaim({ ...input, reviewerId: ctx.user.id });
        if (!updated) throw new TRPCError({ code: "CONFLICT", message: "Claim is no longer pending" });
        await createAuditLog(ctx.user.id, `review_organization_claim_${input.status}`, "organization_claim", input.claimId, { expiresAt: input.expiresAt?.toISOString() ?? null, reviewNote: input.reviewNote ?? null });
        return { success: true };
      }),
    getApiCapacityRequests: adminProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected", "expired", "revoked"]).default("pending") }))
      .query(({ input }) => listApiCapacityRequests(input.status)),
    reviewApiCapacityRequest: adminProcedure
      .input(z.object({ requestId: z.number().int().positive(), status: z.enum(["approved", "rejected", "revoked"]), grantedDailyQuota: z.number().int().min(1001).max(100000).optional(), expiresAt: z.date().optional(), reviewNote: z.string().trim().max(2000).optional() }).superRefine((input, context) => {
        if (input.status === "approved" && (!input.grantedDailyQuota || !input.expiresAt)) context.addIssue({ code: z.ZodIssueCode.custom, message: "Approval requires a quota and expiry", path: ["grantedDailyQuota"] });
      }))
      .mutation(async ({ input, ctx }) => {
        const updated = await reviewApiCapacityRequest({ ...input, reviewerId: ctx.user.id });
        if (!updated) throw new TRPCError({ code: "CONFLICT", message: "Capacity request is no longer pending or lacks approval fields" });
        await createAuditLog(ctx.user.id, `review_api_capacity_${input.status}`, "api_capacity_request", input.requestId, { grantedDailyQuota: input.grantedDailyQuota ?? null, expiresAt: input.expiresAt?.toISOString() ?? null, reviewNote: input.reviewNote ?? null });
        return { success: true };
      }),
    getIngestionSources: adminProcedure
      .input(z.object({ status: z.enum(["draft", "approved", "paused", "retired"]).optional() }))
      .query(({ input }) => listIngestionSources(input.status)),
    createIngestionSource: adminProcedure
      .input(z.object({ name: z.string().trim().min(2).max(255), baseUrl: z.string().url().max(2048).refine((value) => new URL(value).protocol === "https:", "HTTPS source required"), termsUrl: z.string().url().max(2048).optional(), sourceType: z.enum(["official_site", "official_docs", "official_repository", "manual_feed"]) }))
      .mutation(async ({ input, ctx }) => {
        const id = await createIngestionSource({ ...input, createdBy: ctx.user.id });
        if (!id) throw new TRPCError({ code: "CONFLICT", message: "Unable to register source" });
        await createAuditLog(ctx.user.id, "create", "ingestion_source", id, { name: input.name, baseUrl: input.baseUrl, sourceType: input.sourceType });
        return { id };
      }),
    reviewIngestionSource: adminProcedure
      .input(z.object({ sourceId: z.number().int().positive(), status: z.enum(["approved", "paused", "retired"]), reviewNote: z.string().trim().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const updated = await reviewIngestionSource({ ...input, reviewerId: ctx.user.id });
        if (!updated) throw new TRPCError({ code: "CONFLICT", message: "Source is no longer awaiting review" });
        await createAuditLog(ctx.user.id, `review_ingestion_source_${input.status}`, "ingestion_source", input.sourceId, { reviewNote: input.reviewNote ?? null });
        return { success: true };
      }),
    createIngestionBatch: adminProcedure
      .input(z.object({ sourceId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const id = await createIngestionBatch({ ...input, requestedBy: ctx.user.id });
        if (!id) throw new TRPCError({ code: "CONFLICT", message: "Only approved sources can create a bounded batch" });
        await createAuditLog(ctx.user.id, "create", "ingestion_batch", id, { sourceId: input.sourceId });
        return { id };
      }),
    addIngestionCandidates: adminProcedure
      .input(z.object({ batchId: z.number().int().positive(), candidates: z.array(z.object({ externalUrl: z.string().url().max(2048).refine((value) => new URL(value).protocol === "https:", "HTTPS candidate required"), contentHash: z.string().regex(/^[a-f0-9]{64}$/i), title: z.string().trim().max(255).optional(), summary: z.string().trim().max(8000).optional(), attribution: z.string().trim().max(500).optional(), licenseNote: z.string().trim().max(500).optional(), assessment: z.unknown().optional() })).min(1).max(50) }))
      .mutation(async ({ input, ctx }) => {
        const count = await addIngestionCandidates(input);
        if (!count) throw new TRPCError({ code: "CONFLICT", message: "Batch is unavailable for candidates" });
        await createAuditLog(ctx.user.id, "queue", "ingestion_batch", input.batchId, { candidateCount: count });
        return { candidateCount: count };
      }),
    getIngestionCandidates: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
      .query(({ input }) => listIngestionCandidatesForModeration(input.limit)),
    reviewIngestionCandidate: adminProcedure
      .input(z.object({ candidateId: z.number().int().positive(), status: z.enum(["accepted", "duplicate", "rejected"]), duplicateResourceId: z.number().int().positive().optional(), reviewNote: z.string().trim().max(2000).optional() }).superRefine((input, context) => {
        if (input.status === "duplicate" && !input.duplicateResourceId) context.addIssue({ code: z.ZodIssueCode.custom, message: "A canonical resource is required for duplicate decisions", path: ["duplicateResourceId"] });
      }))
      .mutation(async ({ input, ctx }) => {
        const updated = await reviewIngestionCandidate({ ...input, reviewerId: ctx.user.id });
        if (!updated) throw new TRPCError({ code: "CONFLICT", message: "Candidate is no longer pending review" });
        await createAuditLog(ctx.user.id, `review_ingestion_candidate_${input.status}`, "ingestion_candidate", input.candidateId, { duplicateResourceId: input.duplicateResourceId ?? null, reviewNote: input.reviewNote ?? null });
        return { success: true };
      }),
    getIntakeCandidates: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(50) }))
      .query(({ input }) => listIntakeCandidatesForModeration(input.limit)),
    reviewIntakeCandidate: adminProcedure
      .input(z.object({ candidateId: z.number().int().positive(), status: z.enum(["accepted", "rejected", "duplicate"]), reviewNote: z.string().trim().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const updated = await reviewIntakeCandidate({ ...input, reviewerId: ctx.user.id });
        if (!updated) throw new TRPCError({ code: "CONFLICT", message: "This candidate is no longer awaiting review" });
        await createAuditLog(ctx.user.id, `review_intake_candidate_${input.status}`, "intake_candidate", input.candidateId, { reviewNote: input.reviewNote ?? null });
        return { success: true };
      }),
    getVerificationApplications: adminProcedure
      .input(z.object({ status: z.enum(["pending", "approved", "rejected", "suspended"]).default("pending") }))
      .query(({ input }) => listVerificationApplications(input.status)),
    reviewVerificationApplication: adminProcedure
      .input(z.object({ applicationId: z.number().int().positive(), status: z.enum(["approved", "rejected", "suspended"]), reviewNote: z.string().trim().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const updated = await reviewVerificationApplication({ ...input, reviewerId: ctx.user.id });
        if (!updated) throw new TRPCError({ code: "CONFLICT", message: "This application is no longer pending" });
        await createAuditLog(ctx.user.id, `review_contributor_verification_${input.status}`, "contributor_verification_application", input.applicationId, { reviewNote: input.reviewNote ?? null });
        return { success: true };
      }),
    runFreshnessSweep: adminProcedure
      .input(z.object({ reviewAfterDays: z.number().int().min(30).max(365).default(90), limit: z.number().int().min(1).max(100).default(50) }))
      .mutation(async ({ input, ctx }) => {
        const result = await runFreshnessReviewSweep({ ...input, checkedBy: ctx.user.id });
        await createAuditLog(ctx.user.id, "queue_freshness_review", "freshness_sweep", 0, { ...input, scanned: result.scanned, queued: result.queued, resourceIds: result.resourceIds });
        return result;
      }),
    searchQuality: adminProcedure
      .input(z.object({ days: z.number().int().min(1).max(90).default(30) }))
      .query(({ input }) => getSearchQualitySummary(input.days)),

    listSearchEvaluationCases: adminProcedure
      .input(z.object({ status: z.enum(["draft", "approved", "rejected"]).optional() }))
      .query(({ input }) => listSearchEvaluationCases(input.status)),

    createSearchEvaluationCase: adminProcedure
      .input(z.object({ query: z.string().trim().min(1).max(255), expectedResourceIds: z.array(z.number().int().positive()).min(1).max(20), notes: z.string().max(1000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const id = await createSearchEvaluationCase({ ...input, createdBy: ctx.user.id });
        await createAuditLog(ctx.user.id, "create", "search_evaluation_case", id, { query: input.query, expectedResourceIds: input.expectedResourceIds, notes: input.notes ?? null });
        return { id };
      }),

    reviewSearchEvaluationCase: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected"]), reviewNote: z.string().max(1000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const updated = await reviewSearchEvaluationCase({ ...input, reviewerId: ctx.user.id });
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Draft relevance case not found" });
        await createAuditLog(ctx.user.id, "review", "search_evaluation_case", input.id, { status: input.status, reviewNote: input.reviewNote ?? null });
        return { success: true };
      }),
    draftResourceReview: aiDraftProcedure
      .input(z.object({ resourceId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can request AI review drafts" });
        const resource = await getResourceById(input.resourceId);
        if (!resource) throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        try {
          const result = await draftResourceReview(resource);
          await createAuditLog(ctx.user.id, "generate_ai_review_draft", "resource", resource.id, { model: result.model, usage: result.usage });
          return result;
        } catch (error) {
          console.error("[Moderation] AI review draft failed", error);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to generate an AI review draft" });
        }
      }),

    getOpenReports: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
      .query(({ input }) => getOpenResourceReports(input.limit, input.offset)),

    reviewReport: adminProcedure
      .input(z.object({ reportId: z.number().int().positive(), status: z.enum(["resolved", "dismissed"]), reviewNote: z.string().trim().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const reviewed = await reviewResourceReport({ ...input, reviewerId: ctx.user.id });
        if (!reviewed) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await createAuditLog(ctx.user.id, input.status === "resolved" ? "resolve_report" : "dismiss_report", "resource_report", input.reportId, { reviewNote: input.reviewNote });
        return { success: true };
      }),

    reviewSource: adminProcedure
      .input(z.object({ sourceId: z.number().int().positive(), status: z.enum(["approved", "rejected", "superseded"]) }))
      .mutation(async ({ input, ctx }) => {
        const source = await reviewResourceSource({ ...input, reviewerId: ctx.user.id });
        if (!source) throw new TRPCError({ code: "CONFLICT", message: "This source is no longer pending" });
        await recordResourceHistory({
          resourceId: source.resourceId,
          eventType: "source_verified",
          summary: input.status === "approved" ? `Verified ${source.sourceType} evidence` : `Reviewed ${source.sourceType} evidence`,
          changes: { sourceId: source.id, verificationStatus: input.status },
          isPublic: input.status === "approved",
          recordedBy: ctx.user.id,
        });
        await createAuditLog(ctx.user.id, `review_source_${input.status}`, "resource_source", input.sourceId, { resourceId: source.resourceId });
        return { success: true, resourceId: source.resourceId };
      }),

    getPendingSources: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
      .query(({ input }) => getPendingResourceSources(input.limit, input.offset)),

    getFreshnessQueue: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
      .query(({ input }) => getFreshnessReviewQueue(input.limit, input.offset)),

    getProposedDuplicateResolutions: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
      .query(({ input }) => getProposedDuplicateResolutions(input.limit, input.offset)),

    recordFreshness: adminProcedure
      .input(z.object({ resourceId: z.number().int().positive(), status: z.enum(["current", "needs_review", "stale"]), note: z.string().trim().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        const resource = await getResourceById(input.resourceId);
        if (!resource) throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        const reviewId = await createFreshnessReview({ ...input, checkedBy: ctx.user.id });
        if (!reviewId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to record freshness review" });
        await recordResourceHistory({ resourceId: input.resourceId, eventType: "freshness_checked", summary: `Freshness marked ${input.status.replace("_", " ")}`, changes: { reviewId, status: input.status }, recordedBy: ctx.user.id });
        await createAuditLog(ctx.user.id, "record_freshness", "resource", input.resourceId, { reviewId, status: input.status });
        return { success: true, reviewId };
      }),

    previewDuplicateResolution: adminProcedure
      .input(z.object({ duplicateResourceId: z.number().int().positive(), canonicalResourceId: z.number().int().positive() }).refine((input) => input.duplicateResourceId !== input.canonicalResourceId, "Choose two different resources"))
      .query(async ({ input }) => {
        const preview = await previewDuplicateResolution(input);
        if (!preview) throw new TRPCError({ code: "BAD_REQUEST", message: "This pair cannot be resolved as a duplicate" });
        return preview;
      }),

    proposeDuplicateResolution: adminProcedure
      .input(z.object({ duplicateResourceId: z.number().int().positive(), canonicalResourceId: z.number().int().positive(), rationale: z.string().trim().min(20).max(2000) }).refine((input) => input.duplicateResourceId !== input.canonicalResourceId, "Choose two different resources"))
      .mutation(async ({ input, ctx }) => {
        const result = await createDuplicateResolutionProposal({ ...input, createdBy: ctx.user.id });
        if (!result.created || !result.id || !result.preview) throw new TRPCError({ code: "CONFLICT", message: "A resolution is already present or this pair is not eligible" });
        await recordResourceHistory({ resourceId: input.duplicateResourceId, eventType: "duplicate_resolution_proposed", summary: "Duplicate resolution proposed for moderator confirmation", changes: { resolutionId: result.id, canonicalResourceId: input.canonicalResourceId }, isPublic: false, recordedBy: ctx.user.id });
        await createAuditLog(ctx.user.id, "propose_duplicate_resolution", "resource_duplicate_resolution", result.id, { duplicateResourceId: input.duplicateResourceId, canonicalResourceId: input.canonicalResourceId });
        return { success: true, resolutionId: result.id, preview: result.preview };
      }),

    confirmDuplicateResolution: adminProcedure
      .input(z.object({ resolutionId: z.number().int().positive(), reviewNote: z.string().trim().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can confirm duplicate aliases" });
        const result = await confirmDuplicateResolution({ ...input, reviewerId: ctx.user.id });
        if (!result) throw new TRPCError({ code: "CONFLICT", message: "This resolution is no longer confirmable" });
        await recordResourceHistory({ resourceId: result.resolution.duplicateResourceId, eventType: "duplicate_resolution_confirmed", summary: `Resolved as an alias of ${result.preview.canonical.title}`, changes: { resolutionId: input.resolutionId, canonicalResourceId: result.resolution.canonicalResourceId }, recordedBy: ctx.user.id });
        await createAuditLog(ctx.user.id, "confirm_duplicate_resolution", "resource_duplicate_resolution", input.resolutionId, { duplicateResourceId: result.resolution.duplicateResourceId, canonicalResourceId: result.resolution.canonicalResourceId, reviewNote: input.reviewNote });
        return { success: true, canonicalResourceId: result.resolution.canonicalResourceId, duplicateResourceId: result.resolution.duplicateResourceId };
      }),

    getPendingEditSuggestions: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
      .query(({ input }) => getPendingResourceEditSuggestions(input.limit, input.offset)),

    reviewEditSuggestion: adminProcedure
      .input(z.object({ suggestionId: z.number().int().positive(), status: z.enum(["approved", "rejected"]), reviewNote: z.string().trim().max(2000).optional() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can apply resource edit suggestions" });
        const result = await reviewResourceEditSuggestion({ ...input, reviewerId: ctx.user.id });
        if (!result.updated) throw new TRPCError({ code: "CONFLICT", message: "This suggestion is no longer pending" });
        await createAuditLog(ctx.user.id, input.status === "approved" ? "approve_edit_suggestion" : "reject_edit_suggestion", "resource_edit_suggestion", input.suggestionId, { resourceId: result.resourceId, fields: Object.keys((result.changes as Record<string, unknown>) ?? {}), reviewNote: input.reviewNote });
        return { success: true };
      }),

    listUsers: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50), offset: z.number().min(0).default(0) }))
      .query(({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can manage user roles" });
        return listUsersForAdmin(input.limit, input.offset);
      }),

    setUserRole: adminProcedure
      .input(z.object({ userId: z.number().int().positive(), role: z.enum(["user", "moderator", "admin"]) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Only administrators can manage user roles" });
        if (input.userId === ctx.user.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot change your own role" });
        const updated = await setUserRole(input.userId, input.role);
        if (!updated) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        await createAuditLog(ctx.user.id, "set_role", "user", input.userId, { role: input.role });
        return { success: true };
      }),

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

        const suggestedRelationships = Array.isArray(submission.suggestedRelationships) ? submission.suggestedRelationships as Array<{ targetId: number; type: (typeof relationshipTypeValues)[number]; evidenceUrl?: string; rationale?: string; sourceContext?: string }> : [];
        for (const suggested of suggestedRelationships) {
          try {
            await db.insert(require("../drizzle/schema").relationships).values({
              sourceId: resourceId,
              targetId: suggested.targetId,
              type: suggested.type,
              strength: "0.50",
              evidenceUrl: suggested.evidenceUrl,
              rationale: suggested.rationale,
              sourceContext: suggested.sourceContext,
              createdBy: submission.submittedBy,
              status: "pending",
            });
          } catch (error) {
            console.warn("[Moderation] Skipped duplicate or invalid suggested relationship", { submissionId: submission.id, targetId: suggested.targetId, type: suggested.type });
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

        await createAuditLog(ctx.user.id, "approve", "submission", input.submissionId, { resourceId, suggestedRelationshipCount: suggestedRelationships.length });
        await recordReputationEvent({ userId: submission.submittedBy, points: 10, reason: "Resource submission approved", entityType: "submission", entityId: input.submissionId, eventKey: `submission-approved:${input.submissionId}` });

        return { success: true, resourceId, slug };
      }),

    bulkRejectSubmissions: adminProcedure
      .input(z.object({ submissionIds: z.array(z.number().int().positive()).min(1).max(25).refine((ids) => new Set(ids).size === ids.length, "Submission IDs must be unique"), reason: z.string().trim().min(1, "A batch rejection reason is required").max(1000) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const rejectedIds: number[] = [];
        const skippedIds: number[] = [];
        for (const submissionId of input.submissionIds) {
          const submission = await getSubmissionById(submissionId);
          if (!submission || submission.status !== "pending") { skippedIds.push(submissionId); continue; }
          await db.update(submissions).set({ status: "rejected", rejectionReason: input.reason, reviewedBy: ctx.user.id, reviewedAt: new Date() }).where(eq(submissions.id, submissionId));
          await createAuditLog(ctx.user.id, "bulk_reject", "submission", submissionId, { reason: input.reason, batchSize: input.submissionIds.length });
          rejectedIds.push(submissionId);
        }
        return { rejectedIds, skippedIds };
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
    capabilities: publicProcedure.query(() => getSearchCapabilities()),
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
          hadPreviousQuery: z.boolean().default(false),
        })
      )
      .query(async ({ input }) => {
        const startedAt = Date.now();
        const results = await searchService.advancedSearch(input.query, input.limit, input.offset, input.filters);
        const relationshipIntent = input.query.toLowerCase().match(/\b(alternatives?|integrations?|competitors?|similar)\b/)?.[1];
        void Promise.resolve(recordSearchAnalytics({ query: input.query, resultCount: results.length, relationshipIntent, latencyMs: Date.now() - startedAt, hadPreviousQuery: input.hadPreviousQuery })).catch(() => undefined);
        return results;
      }),

    recordResultClick: metadataProcedure
      .input(z.object({ query: z.string().min(1).max(255), resultCount: z.number().int().min(0).max(100), resourceId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        void Promise.resolve(recordSearchAnalytics({ query: input.query, resultCount: input.resultCount, eventType: "result_click", clickedResourceId: input.resourceId })).catch(() => undefined);
        return { accepted: true };
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
