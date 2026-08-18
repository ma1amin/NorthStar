import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, contributionProcedure, metadataProcedure, aiDraftProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createRequire } from "node:module";

// This router contains legacy schema lookups that use CommonJS require at mutation time.
// Define a scoped Node ESM-compatible loader so those server-only paths remain valid.
const require = createRequire(import.meta.url);

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
  createPiiFreeArchiveImportBatch,
  getPiiFreeArchiveImportBatch,
  updatePiiFreeArchiveCandidateEnrichment,
  listPiiFreeArchiveImportBatches, listPiiFreeArchiveImportHistory,
  excludePiiFreeArchiveCandidate,
  getPiiFreeArchiveCandidate,
  listFailedPiiFreeArchiveCandidates,
  beginPiiFreeArchiveCandidateRetry,
  replaceArchiveCandidateFieldProposals,
  listArchiveCandidateFieldReviews,
  decideArchiveCandidateFieldReview,
  listCurationRegisterSummaries,
  listTrustedSourceDomains,
  createTrustedSourceDomain,
  updateTrustedSourceDomain,
} from "./db";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { archiveImportCandidates, submissions, resourceSources as resourceSourcesTable, resourceTags as resourceTagsTable, relationships as relationshipsTable, resources as resourcesTable, tags as tagsTable } from "../drizzle/schema";
import { searchService } from "./search";
import { assertSafePublicUrl, fetchResourceMetadata } from "./urlMetadata";
import { canViewCollection, collectionSlug, normalizeProfileUpdate } from "./community";
import { draftResourceReview } from "./aiReview";
import { getSearchCapabilities } from "./searchCapabilities";
import { createHash, randomBytes } from "crypto";
import { extractResourceCandidatesFromArtifact, sanitizePublicResourceMetadata } from "./resourceIntake";
import { ARCHIVE_BULK_REVIEW_LIMIT, getArchiveContentExclusion, getRegistrableDomain, normalizeTrustedDomain } from "./archiveReview";
import { buildArchiveEvidenceProposals } from "./archiveEvidence";
import { normalizeModerationTags } from "./moderationTags";

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

  archiveIntake: router({
    /** Parses an artifact only in memory. Raw files, chat messages, and personal data are not persisted. */
    parseEphemeral: contributionProcedure
      .input(z.object({ filename: z.string().trim().min(1).max(255), mimeType: z.string().max(255).optional(), base64: z.string().min(1).max(12_000_000) }))
      .mutation(async ({ input }) => {
        const data = Buffer.from(input.base64, "base64");
        return extractResourceCandidatesFromArtifact({ filename: input.filename, mimeType: input.mimeType, data });
      }),

    /** Persists only normalized URLs and public-page facts; caller identity and source artifact stay out of the batch. */
    createBatch: adminProcedure
      .input(z.object({
        totalUrlMentions: z.number().int().min(0).max(100_000),
        rejectedUrlMentions: z.number().int().min(0).max(100_000),
        candidates: z.array(z.object({ url: z.string().url().max(2048) })).min(1).max(500),
      }))
      .mutation(async ({ input, ctx }) => {
        const normalized = Array.from(new Set(input.candidates.map((candidate) => assertSafePublicUrl(candidate.url).toString())));
        const seenDomains = new Set<string>();
        let policyRejected = 0;
        const batchId = await createPiiFreeArchiveImportBatch({
          totalUrlMentions: input.totalUrlMentions,
          rejectedUrlMentions: input.rejectedUrlMentions,
          candidates: normalized.map((url) => {
            const exclusion = getArchiveContentExclusion(url);
            const registrableDomain = getRegistrableDomain(url);
            const duplicateDomain = !exclusion && Boolean(registrableDomain && seenDomains.has(registrableDomain));
            if (registrableDomain && !exclusion && !duplicateDomain) seenDomains.add(registrableDomain);
            if (exclusion || duplicateDomain) policyRejected += 1;
            return {
              candidateHash: createHash("sha256").update(url).digest("hex"),
              url,
              registrableDomain,
              officialSourceUrl: url,
              status: exclusion || duplicateDomain ? "excluded" as const : "review_ready" as const,
              failureCode: exclusion ?? (duplicateDomain ? "root_domain_duplicate" : undefined),
            };
          }),
        });
        await createAuditLog(ctx.user.id, "create_pii_free_archive_batch", "archive_import_batch", batchId, {
          candidateCount: normalized.length,
          totalUrlMentions: input.totalUrlMentions,
          rejectedUrlMentions: input.rejectedUrlMentions + policyRejected,
        });
        return { batchId, candidateCount: normalized.length };
      }),

    getBatch: adminProcedure
      .input(z.object({ batchId: z.number().int().positive() }))
      .query(async ({ input }) => {
        const result = await getPiiFreeArchiveImportBatch(input.batchId);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Archive import batch not found" });
        const trustedDomains = new Set((await listTrustedSourceDomains()).map((domain) => domain.domain));
        return {
          ...result,
          candidates: result.candidates.map((candidate) => {
            return { ...candidate, suggestedCategoryId: undefined, suggestedTags: candidate.suggestedTags ?? [], isTrustedSource: Boolean(candidate.registrableDomain && trustedDomains.has(candidate.registrableDomain)) };
          }),
        };
      }),

    listBatches: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }))
      .query(({ input }) => listPiiFreeArchiveImportBatches(input.limit)),

    listCurationRegisters: adminProcedure.query(() => listCurationRegisterSummaries()),

    /** Aggregate-only history intentionally has no contributor identity or source-artifact link. */
    contributorHistory: contributionProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).default(20) }))
      .query(({ input }) => listPiiFreeArchiveImportHistory(input.limit)),

    excludeCandidate: adminProcedure
      .input(z.object({ candidateId: z.number().int().positive(), reason: z.enum(["video_host", "editorial_content", "social_or_profile", "google_workspace", "luma_calendar", "meeting_link", "direct_document"]) }))
      .mutation(async ({ input, ctx }) => {
        const updated = await excludePiiFreeArchiveCandidate(input);
        if (!updated) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Candidate is no longer review-ready" });
        await createAuditLog(ctx.user.id, "exclude_archive_candidate", "archive_import_candidate", input.candidateId, { reason: input.reason });
        return { status: "excluded" as const };
      }),

    submitCandidateToModeration: adminProcedure
      .input(z.object({
        batchId: z.number().int().positive(),
        candidateId: z.number().int().positive(),
        title: z.string().trim().min(1).max(255),
        description: z.string().trim().max(5000).optional(),
        categoryId: z.number().int().positive(),
        pricing: z.enum(["free", "freemium", "paid", "open_source", "enterprise"]),
        tags: z.array(z.string().trim().min(1).max(64)).max(12).default([]),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await getPiiFreeArchiveImportBatch(input.batchId);
        const candidate = result?.candidates.find((item) => item.id === input.candidateId);
        if (!candidate || candidate.status !== "review_ready") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Candidate is not ready for moderation handoff" });
        const excluded = getArchiveContentExclusion(candidate.url);
        if (excluded) {
          await excludePiiFreeArchiveCandidate({ candidateId: candidate.id, reason: excluded });
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This URL type cannot enter resource moderation" });
        }
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const safeUrl = assertSafePublicUrl(candidate.canonicalUrl ?? candidate.url).toString();
        if (await checkDuplicateByUrl(safeUrl) || await checkPendingSubmissionByUrl(safeUrl)) throw new TRPCError({ code: "CONFLICT", message: "This resource is already public or awaiting moderation" });
        const submissionId = await db.transaction(async (tx) => {
          const submission = await tx.insert(submissions).values({ submittedBy: ctx.user.id, title: input.title, url: safeUrl, description: input.description, categoryId: input.categoryId, pricing: input.pricing, tags: input.tags, suggestedRelationships: [], status: "pending" });
          const id = submission[0].insertId;
          const claimed = await tx.update(archiveImportCandidates).set({ status: "submitted", submissionId: id, metadataVerificationStatus: "reviewed" }).where(and(eq(archiveImportCandidates.id, candidate.id), eq(archiveImportCandidates.status, "review_ready")));
          if ((claimed[0] as { affectedRows?: number } | undefined)?.affectedRows !== 1) throw new TRPCError({ code: "CONFLICT", message: "Candidate was already handled" });
          return id;
        });
        await createAuditLog(ctx.user.id, "submit_archive_candidate_to_moderation", "archive_import_candidate", candidate.id, { submissionId, categoryId: input.categoryId, tags: input.tags });
        return { submissionId, status: "pending" as const };
      }),

    bulkSubmitCandidatesToModeration: adminProcedure
      .input(z.object({
        batchId: z.number().int().positive(),
        candidateIds: z.array(z.number().int().positive()).min(1).max(ARCHIVE_BULK_REVIEW_LIMIT),
        categoryId: z.number().int().positive(),
        pricing: z.enum(["free", "freemium", "paid", "open_source", "enterprise"]),
        tags: z.array(z.string().trim().min(1).max(64)).max(12).default([]),
      }))
      .mutation(async ({ input, ctx }) => {
        const batch = await getPiiFreeArchiveImportBatch(input.batchId);
        if (!batch) throw new TRPCError({ code: "NOT_FOUND", message: "Archive import batch not found" });
        const selected = batch.candidates.filter((candidate) => input.candidateIds.includes(candidate.id));
        if (selected.length !== input.candidateIds.length || selected.some((candidate) => candidate.status !== "review_ready")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only review-ready candidates can be bulk submitted" });
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
        const created: number[] = [];
        for (const candidate of selected) {
          const exclusion = getArchiveContentExclusion(candidate.url);
          if (exclusion) { await excludePiiFreeArchiveCandidate({ candidateId: candidate.id, reason: exclusion }); continue; }
          const safeUrl = assertSafePublicUrl(candidate.canonicalUrl ?? candidate.url).toString();
          if (await checkDuplicateByUrl(safeUrl) || await checkPendingSubmissionByUrl(safeUrl)) continue;
          const submission = await db.transaction(async (tx) => {
            const result = await tx.insert(submissions).values({ submittedBy: ctx.user.id, title: candidate.title?.trim() || new URL(safeUrl).hostname, url: safeUrl, description: candidate.description ?? undefined, categoryId: input.categoryId, pricing: input.pricing, tags: input.tags, suggestedRelationships: [], status: "pending" });
            const id = result[0].insertId;
            const claimed = await tx.update(archiveImportCandidates).set({ status: "submitted", submissionId: id, metadataVerificationStatus: "reviewed" }).where(and(eq(archiveImportCandidates.id, candidate.id), eq(archiveImportCandidates.status, "review_ready")));
            if ((claimed[0] as { affectedRows?: number } | undefined)?.affectedRows !== 1) throw new TRPCError({ code: "CONFLICT", message: "Candidate was already handled" });
            return id;
          });
          created.push(submission);
          await createAuditLog(ctx.user.id, "bulk_submit_archive_candidate_to_moderation", "archive_import_candidate", candidate.id, { submissionId: submission, categoryId: input.categoryId, tags: input.tags });
        }
        return { submittedCount: created.length, skippedCount: selected.length - created.length };
      }),

    listRetryQueue: adminProcedure
      .input(z.object({ limit: z.number().int().min(1).max(50).default(25) }))
      .query(({ input }) => listFailedPiiFreeArchiveCandidates(input.limit)),

    retryCandidateMetadata: adminProcedure
      .input(z.object({ candidateId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const candidate = await beginPiiFreeArchiveCandidateRetry(input.candidateId);
        if (!candidate) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Candidate is unavailable or has reached the retry limit" });
        const exclusion = getArchiveContentExclusion(candidate.url);
        if (exclusion) {
          await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, status: "excluded", failureCode: exclusion });
          return { status: "excluded" as const };
        }
        try {
          const metadata = await fetchResourceMetadata(candidate.url);
          await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, canonicalUrl: metadata.canonicalUrl ?? metadata.url, title: sanitizePublicResourceMetadata(metadata.title, 255), description: sanitizePublicResourceMetadata(metadata.description, 5_000), officialSourceUrl: metadata.canonicalUrl ?? metadata.url, metadataVerificationStatus: "public_page_fetched", metadataFetchedAt: new Date(), status: "review_ready" });
          await createAuditLog(ctx.user.id, "retry_archive_candidate_metadata", "archive_import_candidate", candidate.id, { retryCount: candidate.retryCount, outcome: "review_ready" });
          return { status: "review_ready" as const };
        } catch {
          await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, status: "failed", failureCode: "metadata_unavailable" });
          await createAuditLog(ctx.user.id, "retry_archive_candidate_metadata", "archive_import_candidate", candidate.id, { retryCount: candidate.retryCount, outcome: "failed" });
          return { status: "failed" as const };
        }
      }),

    /** Public-page refresh only; it does not infer or overwrite reviewer-confirmed category, tags, pricing, or license. */
    refreshCandidateMetadata: adminProcedure
      .input(z.object({ candidateId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const candidate = await getPiiFreeArchiveCandidate(input.candidateId);
        if (!candidate || !["review_ready", "failed"].includes(candidate.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Candidate is unavailable for metadata refresh" });
        const exclusion = getArchiveContentExclusion(candidate.url);
        if (exclusion) {
          await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, status: "excluded", failureCode: exclusion });
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This URL type cannot enter resource moderation" });
        }
        try {
          const metadata = await fetchResourceMetadata(candidate.url);
          const fetchedAt = new Date();
          const sourceUrl = metadata.canonicalUrl ?? metadata.url;
          await updatePiiFreeArchiveCandidateEnrichment({
            candidateId: candidate.id,
            canonicalUrl: sourceUrl,
            title: sanitizePublicResourceMetadata(metadata.title, 255),
            description: sanitizePublicResourceMetadata(metadata.description, 5_000),
            officialSourceUrl: sourceUrl,
            metadataVerificationStatus: "public_page_fetched",
            metadataFetchedAt: fetchedAt,
            status: "review_ready",
          });
          await createAuditLog(ctx.user.id, "refresh_archive_candidate_metadata", "archive_import_candidate", candidate.id, { sourceUrl, fetchedAt: fetchedAt.toISOString() });
          return { status: "review_ready" as const, sourceUrl };
        } catch {
          await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, status: "failed", failureCode: "metadata_unavailable" });
          await createAuditLog(ctx.user.id, "refresh_archive_candidate_metadata", "archive_import_candidate", candidate.id, { outcome: "failed" });
          return { status: "failed" as const };
        }
      }),

    /** Creates public-evidence review proposals; it never applies fetched metadata automatically. */
    refreshCandidateEvidence: adminProcedure
      .input(z.object({ candidateId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const candidate = await getPiiFreeArchiveCandidate(input.candidateId);
        if (!candidate || !["review_ready", "failed"].includes(candidate.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Candidate is unavailable for evidence refresh" });
        const exclusion = getArchiveContentExclusion(candidate.url);
        if (exclusion) {
          await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, status: "excluded", failureCode: exclusion });
          throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This URL type cannot enter resource moderation" });
        }
        try {
          const fetchedAt = new Date();
          const metadata = await fetchResourceMetadata(candidate.url);
          const safeMetadata = {
            url: metadata.url,
            canonicalUrl: metadata.canonicalUrl ?? undefined,
            title: sanitizePublicResourceMetadata(metadata.title, 255),
            description: sanitizePublicResourceMetadata(metadata.description, 5_000),
          };
          const proposals = buildArchiveEvidenceProposals({ candidate, metadata: safeMetadata, retrievedAt: fetchedAt });
          const reviews = await replaceArchiveCandidateFieldProposals(candidate.id, proposals);
          await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, metadataVerificationStatus: "public_page_fetched", metadataFetchedAt: fetchedAt, status: "review_ready" });
          await createAuditLog(ctx.user.id, "refresh_archive_candidate_evidence", "archive_import_candidate", candidate.id, { proposedFields: proposals.map((proposal) => proposal.field), evidenceUrl: safeMetadata.canonicalUrl ?? safeMetadata.url, fetchedAt: fetchedAt.toISOString() });
          return { status: "review_ready" as const, reviews };
        } catch {
          await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, status: "failed", failureCode: "metadata_unavailable" });
          await createAuditLog(ctx.user.id, "refresh_archive_candidate_evidence", "archive_import_candidate", candidate.id, { outcome: "failed" });
          return { status: "failed" as const, reviews: [] };
        }
      }),

    getCandidateFieldReviews: adminProcedure
      .input(z.object({ candidateId: z.number().int().positive() }))
      .query(({ input }) => listArchiveCandidateFieldReviews(input.candidateId)),

    decideCandidateFieldReview: adminProcedure
      .input(z.object({ reviewId: z.number().int().positive(), decision: z.enum(["accepted", "rejected"]) }))
      .mutation(async ({ input, ctx }) => {
        const review = await decideArchiveCandidateFieldReview(input);
        if (!review) throw new TRPCError({ code: "CONFLICT", message: "This evidence decision was already handled" });
        await createAuditLog(ctx.user.id, `archive_candidate_field_${input.decision}`, "archive_candidate_field_review", review.id, { candidateId: review.candidateId, field: review.field, evidenceUrl: review.evidenceUrl });
        return { success: true, review };
      }),

    listTrustedDomains: adminProcedure.query(() => listTrustedSourceDomains(true)),

    addTrustedDomain: adminProcedure
      .input(z.object({ domain: z.string().trim().min(1).max(255), note: z.string().trim().max(500).optional() }))
      .mutation(async ({ input, ctx }) => {
        const domain = normalizeTrustedDomain(input.domain);
        if (!domain) throw new TRPCError({ code: "BAD_REQUEST", message: "Enter a valid public domain" });
        try {
          const id = await createTrustedSourceDomain({ domain, note: input.note });
          await createAuditLog(ctx.user.id, "add_trusted_source_domain", "trusted_source_domain", id, { domain, mode: "advisory" });
          return { id, domain };
        } catch {
          throw new TRPCError({ code: "CONFLICT", message: "This trusted domain already exists" });
        }
      }),

    updateTrustedDomain: adminProcedure
      .input(z.object({ id: z.number().int().positive(), status: z.enum(["active", "disabled"]), note: z.string().trim().max(500).optional() }))
      .mutation(async ({ input, ctx }) => {
        const updated = await updateTrustedSourceDomain(input);
        if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Trusted domain not found" });
        await createAuditLog(ctx.user.id, "update_trusted_source_domain", "trusted_source_domain", input.id, { status: input.status });
        return { success: true };
      }),

    /** Fetches bounded public-page metadata for candidates; it never sends source-chat content anywhere. */
    enrichBatch: adminProcedure
      .input(z.object({ batchId: z.number().int().positive(), limit: z.number().int().min(1).max(50).default(25) }))
      .mutation(async ({ input, ctx }) => {
        const result = await getPiiFreeArchiveImportBatch(input.batchId);
        if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Archive import batch not found" });
        const candidates = result.candidates.filter((candidate) => candidate.status === "review_ready").slice(0, input.limit);
        let enriched = 0;
        let duplicates = 0;
        let failed = 0;
        for (const candidate of candidates) {
          try {
            const excluded = getArchiveContentExclusion(candidate.url);
            if (excluded) {
              await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, status: "excluded", failureCode: excluded });
              continue;
            }
            const duplicate = await checkDuplicateByUrl(candidate.url);
            if (duplicate) {
              await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, duplicateResourceId: duplicate.id, status: "duplicate" });
              duplicates += 1;
              continue;
            }
            const metadata = await fetchResourceMetadata(candidate.url);
            await updatePiiFreeArchiveCandidateEnrichment({
              candidateId: candidate.id,
              canonicalUrl: metadata.canonicalUrl ?? metadata.url,
              title: sanitizePublicResourceMetadata(metadata.title, 255),
              description: sanitizePublicResourceMetadata(metadata.description, 5_000),
              officialSourceUrl: metadata.canonicalUrl ?? metadata.url,
              status: "review_ready",
            });
            enriched += 1;
          } catch {
            await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, status: "failed", failureCode: "metadata_unavailable" });
            failed += 1;
          }
        }
        await createAuditLog(ctx.user.id, "enrich_pii_free_archive_batch", "archive_import_batch", input.batchId, { processed: candidates.length, enriched, duplicates, failed });
        return { processed: candidates.length, enriched, duplicates, failed };
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
          .where(require("drizzle-orm").and(require("drizzle-orm").eq(require("../drizzle/schema").relationships.id, input.id), require("drizzle-orm").eq(require("../drizzle/schema").relationships.status, "pending")))
          .limit(1);
        if (!relationship[0]) throw new TRPCError({ code: "CONFLICT", message: "This relationship is no longer pending" });

        const result = await db
          .update(require("../drizzle/schema").relationships)
          .set({ status: "approved", verified: true })
          .where(require("drizzle-orm").and(require("drizzle-orm").eq(require("../drizzle/schema").relationships.id, input.id), require("drizzle-orm").eq(require("../drizzle/schema").relationships.status, "pending")));
        if (Number(result[0]?.affectedRows ?? 0) !== 1) throw new TRPCError({ code: "CONFLICT", message: "This relationship was handled by another moderator" });

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
        return (await getUserVote(ctx.user.id, input.resourceId)) ?? null;
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
        return (await getUserVote(ctx.user.id, undefined, input.relationshipId)) ?? null;
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
        const startedAt = Date.now();
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const result = await db.transaction(async (tx) => {
          const rows = await tx.select().from(submissions).where(and(eq(submissions.id, input.submissionId), eq(submissions.status, "pending"), isNull(submissions.resourceId))).limit(1);
          const submission = rows[0];
          if (!submission) throw new TRPCError({ code: "CONFLICT", message: "This submission is no longer pending" });

          const reviewedAt = new Date();
          const claim = await tx.update(submissions).set({ status: "approved", reviewedBy: ctx.user.id, reviewedAt }).where(and(eq(submissions.id, input.submissionId), eq(submissions.status, "pending"), isNull(submissions.resourceId)));
          if (Number(claim[0]?.affectedRows ?? 0) !== 1) throw new TRPCError({ code: "CONFLICT", message: "This submission was handled by another moderator" });

          const baseSlug = submission.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const slug = `${baseSlug || "resource"}-${submission.id}`;
          const resourceResult = await tx.insert(resourcesTable).values({ title: submission.title, slug, description: submission.description, url: submission.url, categoryId: submission.categoryId, subcategoryId: submission.subcategoryId, pricing: submission.pricing, license: submission.license, builtBy: submission.builtBy, builtByUrl: submission.builtByUrl, submittedBy: submission.submittedBy, status: "approved", approvedAt: reviewedAt });
          const resourceId = resourceResult[0].insertId;

          if (submission.sourceUrl && submission.sourceType) {
            await tx.insert(resourceSourcesTable).values({
              resourceId,
              url: submission.sourceUrl,
              sourceType: submission.sourceType,
              attribution: "Primary source verified during moderation",
              licenseNote: submission.license ?? undefined,
              verificationStatus: "approved",
              addedBy: ctx.user.id,
              verifiedBy: ctx.user.id,
              verifiedAt: reviewedAt,
            });
          }

          const moderationTags = normalizeModerationTags(submission.tags);
          if (moderationTags.length) {
            const requestedTagSlugs = moderationTags.map((tag) => tag.slug);
            const existingTags = await tx.select({ id: tagsTable.id, slug: tagsTable.slug }).from(tagsTable).where(inArray(tagsTable.slug, requestedTagSlugs));
            const existingSlugs = new Set(existingTags.map((tag) => tag.slug));
            const missingTags = moderationTags.filter((tag) => !existingSlugs.has(tag.slug));
            if (missingTags.length) {
              await tx.insert(tagsTable).values(missingTags).onDuplicateKeyUpdate({ set: { id: sql`${tagsTable.id}` } });
            }
            const resolvedTags = missingTags.length
              ? await tx.select({ id: tagsTable.id, slug: tagsTable.slug }).from(tagsTable).where(inArray(tagsTable.slug, requestedTagSlugs))
              : existingTags;
            if (resolvedTags.length !== moderationTags.length) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Unable to resolve submission tags" });
            await tx.insert(resourceTagsTable).values(resolvedTags.map((tag) => ({ resourceId, tagId: tag.id }))).onDuplicateKeyUpdate({ set: { resourceId } });
          }

          const suggestedRelationships = Array.isArray(submission.suggestedRelationships) ? submission.suggestedRelationships as Array<{ targetId: number; type: (typeof relationshipTypeValues)[number]; evidenceUrl?: string; rationale?: string; sourceContext?: string }> : [];
          for (const suggested of suggestedRelationships) {
            try {
              await tx.insert(relationshipsTable).values({ sourceId: resourceId, targetId: suggested.targetId, type: suggested.type, strength: "0.50", evidenceUrl: suggested.evidenceUrl, rationale: suggested.rationale, sourceContext: suggested.sourceContext, createdBy: submission.submittedBy, status: "pending" });
            } catch (error) {
              console.warn("[Moderation] Skipped duplicate or invalid suggested relationship", { submissionId: submission.id, targetId: suggested.targetId, type: suggested.type });
            }
          }

          await tx.update(submissions).set({ resourceId }).where(eq(submissions.id, input.submissionId));
          return { resourceId, slug, submittedBy: submission.submittedBy, suggestedRelationshipCount: suggestedRelationships.length };
        });

        await Promise.all([
          createAuditLog(ctx.user.id, "approve", "submission", input.submissionId, { resourceId: result.resourceId, suggestedRelationshipCount: result.suggestedRelationshipCount }),
          recordReputationEvent({ userId: result.submittedBy, points: 10, reason: "Resource submission approved", entityType: "submission", entityId: input.submissionId, eventKey: `submission-approved:${input.submissionId}` }),
        ]);
        return { success: true, resourceId: result.resourceId, slug: result.slug, approvalDurationMs: Date.now() - startedAt };
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
        const result = await db
          .update(require("../drizzle/schema").relationships)
          .set({ status: "rejected" })
          .where(require("drizzle-orm").and(require("drizzle-orm").eq(require("../drizzle/schema").relationships.id, input.relationshipId), require("drizzle-orm").eq(require("../drizzle/schema").relationships.status, "pending")));
        if (Number(result[0]?.affectedRows ?? 0) !== 1) throw new TRPCError({ code: "CONFLICT", message: "This relationship is no longer pending" });
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

        const result = await db
          .update(require("../drizzle/schema").submissions)
          .set({
            status: "rejected",
            rejectionReason: input.reason,
            reviewedBy: ctx.user.id,
            reviewedAt: new Date(),
          })
          .where(require("drizzle-orm").and(require("drizzle-orm").eq(require("../drizzle/schema").submissions.id, input.submissionId), require("drizzle-orm").eq(require("../drizzle/schema").submissions.status, "pending"), require("drizzle-orm").isNull(require("../drizzle/schema").submissions.resourceId)));
        if (Number(result[0]?.affectedRows ?? 0) !== 1) throw new TRPCError({ code: "CONFLICT", message: "This submission is no longer pending" });

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
