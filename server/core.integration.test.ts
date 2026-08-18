import { describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  advancedSearch: vi.fn(),
  listApprovedResources: vi.fn(),
  checkDuplicateByUrl: vi.fn(),
  checkPendingSubmissionByUrl: vi.fn(),
  getUserReputationEvents: vi.fn(),
  getAuditLogs: vi.fn(),
  recordSearchAnalytics: vi.fn(),
  getResourceById: vi.fn(),
  getGraphNeighborhood: vi.fn(),
  draftResourceReview: vi.fn(),
  createResourceReport: vi.fn(),
  reviewResourceReport: vi.fn(),
  createResourceEditSuggestion: vi.fn(),
  getPendingResourceEditSuggestions: vi.fn(),
  reviewResourceEditSuggestion: vi.fn(),
  createAuditLog: vi.fn(),
  getDb: vi.fn(),
  getSubmissionById: vi.fn(),
  getApprovedResourceSources: vi.fn(),
  getPublicResourceHistory: vi.fn(),
  getLatestResourceFreshness: vi.fn(),
  createResourceSource: vi.fn(),
  reviewResourceSource: vi.fn(),
  recordResourceHistory: vi.fn(),
  createFreshnessReview: vi.fn(),
  previewDuplicateResolution: vi.fn(),
  createDuplicateResolutionProposal: vi.fn(),
  confirmDuplicateResolution: vi.fn(),
  getPublicCollections: vi.fn(),
  getPendingResourceSources: vi.fn(),
  getFreshnessReviewQueue: vi.fn(),
  getProposedDuplicateResolutions: vi.fn(),
  createApiKeyRecord: vi.fn(),
  listOwnerApiKeys: vi.fn(),
  getApiKeyUsageForOwner: vi.fn(),
  revokeApiKeyRecord: vi.fn(),
  getSearchQualitySummary: vi.fn(),
  createSearchEvaluationCase: vi.fn(),
  listSearchEvaluationCases: vi.fn(),
  reviewSearchEvaluationCase: vi.fn(),
  runFreshnessReviewSweep: vi.fn(),
  getPiiFreeArchiveImportBatch: vi.fn(),
}));

vi.mock("./search", () => ({ searchService: { advancedSearch: mocks.advancedSearch, getSuggestions: vi.fn(), getTrending: vi.fn() } }));
vi.mock("./aiReview", () => ({ draftResourceReview: mocks.draftResourceReview }));
vi.mock("./db", () => ({
  getDb: mocks.getDb, listApprovedResources: mocks.listApprovedResources,
  checkDuplicateByUrl: mocks.checkDuplicateByUrl, checkPendingSubmissionByUrl: mocks.checkPendingSubmissionByUrl,
  getUserReputationEvents: mocks.getUserReputationEvents,
  getAuditLogs: mocks.getAuditLogs,
  recordSearchAnalytics: mocks.recordSearchAnalytics,
  getResourceById: mocks.getResourceById,
  getGraphNeighborhood: mocks.getGraphNeighborhood,
  createResourceReport: mocks.createResourceReport,
  reviewResourceReport: mocks.reviewResourceReport,
  createResourceEditSuggestion: mocks.createResourceEditSuggestion,
  getPendingResourceEditSuggestions: mocks.getPendingResourceEditSuggestions,
  reviewResourceEditSuggestion: mocks.reviewResourceEditSuggestion,
  createAuditLog: mocks.createAuditLog,
  getSubmissionById: mocks.getSubmissionById,
  getApprovedResourceSources: mocks.getApprovedResourceSources,
  getPublicResourceHistory: mocks.getPublicResourceHistory,
  getLatestResourceFreshness: mocks.getLatestResourceFreshness,
  createResourceSource: mocks.createResourceSource,
  reviewResourceSource: mocks.reviewResourceSource,
  recordResourceHistory: mocks.recordResourceHistory,
  createFreshnessReview: mocks.createFreshnessReview,
  previewDuplicateResolution: mocks.previewDuplicateResolution,
  createDuplicateResolutionProposal: mocks.createDuplicateResolutionProposal,
  confirmDuplicateResolution: mocks.confirmDuplicateResolution,
  getPublicCollections: mocks.getPublicCollections,
  getPendingResourceSources: mocks.getPendingResourceSources,
  getFreshnessReviewQueue: mocks.getFreshnessReviewQueue,
  getProposedDuplicateResolutions: mocks.getProposedDuplicateResolutions,
  createApiKeyRecord: mocks.createApiKeyRecord,
  listOwnerApiKeys: mocks.listOwnerApiKeys,
  getApiKeyUsageForOwner: mocks.getApiKeyUsageForOwner,
  revokeApiKeyRecord: mocks.revokeApiKeyRecord,
  getSearchQualitySummary: mocks.getSearchQualitySummary,
  createSearchEvaluationCase: mocks.createSearchEvaluationCase,
  listSearchEvaluationCases: mocks.listSearchEvaluationCases,
  reviewSearchEvaluationCase: mocks.reviewSearchEvaluationCase,
  runFreshnessReviewSweep: mocks.runFreshnessReviewSweep,
  getPiiFreeArchiveImportBatch: mocks.getPiiFreeArchiveImportBatch,
}));

import { appRouter } from "./routers";

function context(role: "user" | "moderator" | "admin" = "user"): TrpcContext {
  return { user: { id: 7, openId: "integration-user", name: "Integration User", email: "integration@example.com", loginMethod: "manus", role, reputation: 12, createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() } as TrpcContext["user"], req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as TrpcContext["res"] };
}

describe("core tRPC workflows", () => {
  it("forwards relationship-aware structured search through the public router", async () => {
    mocks.advancedSearch.mockResolvedValue([{ id: 2, title: "Linear" }]);
    const result = await appRouter.createCaller(context()).search.advancedSearch({ query: "Jira alternatives", filters: { categoryId: 3, pricing: "freemium", tag: "planning" } });
    expect(mocks.advancedSearch).toHaveBeenCalledWith("Jira alternatives", 20, 0, { categoryId: 3, pricing: "freemium", tag: "planning" });
    expect(result).toEqual([{ id: 2, title: "Linear" }]);
    expect(mocks.recordSearchAnalytics).toHaveBeenCalledWith(expect.objectContaining({ query: "Jira alternatives", resultCount: 1, relationshipIntent: "alternatives", latencyMs: expect.any(Number), hadPreviousQuery: false }));
  });

  it("accepts bounded anonymous result-click telemetry without an account", async () => {
    await expect(appRouter.createCaller(context()).search.recordResultClick({ query: "Figma", resultCount: 3, resourceId: 12 })).resolves.toEqual({ accepted: true });
    expect(mocks.recordSearchAnalytics).toHaveBeenCalledWith({ query: "Figma", resultCount: 3, eventType: "result_click", clickedResourceId: 12 });
  });

  it("restricts quality aggregates and relevance-case workflows to moderators while auditing human judgements", async () => {
    await expect(appRouter.createCaller(context()).moderation.searchQuality({ days: 30 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    mocks.getSearchQualitySummary.mockResolvedValue({ periodDays: 30, searchCount: 8, zeroResultCount: 1, clickCount: 4, reformulationCount: 2, averageLatencyMs: 76, zeroResultRate: 0.125, clickThroughRate: 0.5, reformulationRate: 0.25 });
    await expect(appRouter.createCaller(context("moderator")).moderation.searchQuality({ days: 30 })).resolves.toMatchObject({ searchCount: 8, zeroResultRate: 0.125 });
    mocks.createSearchEvaluationCase.mockResolvedValue(22);
    await expect(appRouter.createCaller(context("moderator")).moderation.createSearchEvaluationCase({ query: "Figma alternatives", expectedResourceIds: [3, 8], notes: "Reviewed by moderator." })).resolves.toEqual({ id: 22 });
    expect(mocks.createAuditLog).toHaveBeenCalledWith(7, "create", "search_evaluation_case", 22, expect.objectContaining({ expectedResourceIds: [3, 8] }));
  });

  it("limits the review-only freshness sweep to moderators and records its queue outcome", async () => {
    await expect(appRouter.createCaller(context()).moderation.runFreshnessSweep({ reviewAfterDays: 90, limit: 20 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    mocks.runFreshnessReviewSweep.mockResolvedValue({ reviewAfterDays: 90, scanned: 2, queued: 1, resourceIds: [33] });
    await expect(appRouter.createCaller(context("moderator")).moderation.runFreshnessSweep({ reviewAfterDays: 90, limit: 20 })).resolves.toMatchObject({ queued: 1, resourceIds: [33] });
    expect(mocks.runFreshnessReviewSweep).toHaveBeenCalledWith({ checkedBy: 7, reviewAfterDays: 90, limit: 20 });
    expect(mocks.createAuditLog).toHaveBeenCalledWith(7, "queue_freshness_review", "freshness_sweep", 0, expect.objectContaining({ scanned: 2, queued: 1, resourceIds: [33] }));
  });

  it("serves filtered Browse results through the public router", async () => {
    mocks.listApprovedResources.mockResolvedValue({ items: [{ id: 1, slug: "figma" }], total: 1 });
    await expect(appRouter.createCaller(context()).resources.listFiltered({ limit: 12, offset: 0, categoryId: 2, sort: "popular" })).resolves.toEqual({ items: [{ id: 1, slug: "figma" }], total: 1 });
  });

  it("exposes public collection discovery without requiring a session", async () => {
    mocks.getPublicCollections.mockResolvedValue([{ id: 6, name: "Research stack", resourceCount: 3 }]);
    await expect(appRouter.createCaller(context()).collections.discover({ limit: 20, offset: 0 })).resolves.toEqual([{ id: 6, name: "Research stack", resourceCount: 3 }]);
    expect(mocks.getPublicCollections).toHaveBeenCalledWith(20, 0);
  });

  it("creates a scoped owner API key once, without placing its plaintext value in the audit record", async () => {
    mocks.createApiKeyRecord.mockResolvedValue({ id: 91, keyPrefix: "ns_live_example", name: "Read client", scopes: ["resources:read"], dailyQuota: 1000, expiresAt: null });
    const result = await appRouter.createCaller(context()).apiKeys.create({ name: "Read client", scopes: ["resources:read"], dailyQuota: 1000 });
    expect(result).toMatchObject({ id: 91, keyPrefix: "ns_live_example", name: "Read client", key: expect.stringMatching(/^ns_live_/) });
    expect(mocks.createApiKeyRecord).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 7, name: "Read client", scopes: ["resources:read"], dailyQuota: 1000, keyHash: expect.any(String) }));
    expect(mocks.createAuditLog).toHaveBeenCalledWith(7, "create", "api_key", 91, expect.not.objectContaining({ key: expect.anything(), keyHash: expect.anything() }));
  });

  it("limits API-key usage and revocation to the credential owner", async () => {
    mocks.getApiKeyUsageForOwner.mockResolvedValue({ usageDay: "2026-08-13", requestCount: 12, dailyQuota: 1000, remaining: 988, status: "active" });
    await expect(appRouter.createCaller(context()).apiKeys.usage({ apiKeyId: 91 })).resolves.toMatchObject({ remaining: 988 });
    expect(mocks.getApiKeyUsageForOwner).toHaveBeenCalledWith(7, 91);
    mocks.revokeApiKeyRecord.mockResolvedValue(true);
    await expect(appRouter.createCaller(context()).apiKeys.revoke({ apiKeyId: 91 })).resolves.toEqual({ success: true });
    expect(mocks.revokeApiKeyRecord).toHaveBeenCalledWith(7, 91);
    expect(mocks.createAuditLog).toHaveBeenCalledWith(7, "revoke", "api_key", 91, { reason: "owner_revoked" });
  });

  it("serves a bounded approved graph neighborhood through the public graph contract", async () => {
    mocks.getGraphNeighborhood.mockResolvedValue({ center: { id: 1, slug: "figma", title: "Figma" }, nodes: [{ id: 2, slug: "miro", title: "Miro" }], edges: [{ id: 9, sourceId: 1, targetId: 2, type: "alternative_to" }] });
    await expect(appRouter.createCaller(context()).graph.neighborhood({ resourceId: 1, maxEdges: 40 })).resolves.toMatchObject({ center: { slug: "figma" }, nodes: [{ slug: "miro" }], edges: [{ id: 9 }] });
    expect(mocks.getGraphNeighborhood).toHaveBeenCalledWith(1, undefined, 40);
  });

  it("returns duplicate submission feedback before persistence", async () => {
    mocks.checkDuplicateByUrl.mockResolvedValue({ id: 44, title: "Existing resource" }); mocks.checkPendingSubmissionByUrl.mockResolvedValue(undefined);
    await expect(appRouter.createCaller(context()).resources.checkDuplicateByUrl({ url: "https://example.com" })).resolves.toMatchObject({ duplicateType: "published_resource", id: 44 });
  });

  it("requires sign-in and records a valid community resource report", async () => {
    const anonymousContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as TrpcContext["res"] };
    await expect(appRouter.createCaller(anonymousContext).resources.report({ resourceId: 1, reason: "spam" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    mocks.getResourceById.mockResolvedValue({ id: 1, title: "Reported resource" });
    mocks.createResourceReport.mockResolvedValue({ created: true, duplicate: false });
    await expect(appRouter.createCaller(context()).resources.report({ resourceId: 1, reason: "spam", details: "Unwanted promotional content" })).resolves.toEqual({ success: true });
    expect(mocks.createResourceReport).toHaveBeenCalledWith({ resourceId: 1, reporterId: 7, reason: "spam", details: "Unwanted promotional content" });
  });

  it("records a protected contributor edit suggestion without changing the resource directly", async () => {
    const anonymousContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as TrpcContext["res"] };
    await expect(appRouter.createCaller(anonymousContext).resources.suggestEdit({ resourceId: 1, changes: { title: "Corrected title" } })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    mocks.getResourceById.mockResolvedValue({ id: 1, title: "Resource" });
    mocks.createResourceEditSuggestion.mockResolvedValue({ created: true, duplicate: false, id: 41 });
    await expect(appRouter.createCaller(context()).resources.suggestEdit({ resourceId: 1, changes: { title: "Corrected title" }, note: "Official naming has changed." })).resolves.toEqual({ success: true, id: 41 });
    expect(mocks.createResourceEditSuggestion).toHaveBeenCalledWith({ resourceId: 1, suggestedBy: 7, changes: { title: "Corrected title" }, note: "Official naming has changed." });
    expect(mocks.createAuditLog).toHaveBeenCalledWith(7, "suggest_edit", "resource_edit_suggestion", 41, { resourceId: 1, fields: ["title"] });
  });

  it("allows only administrators to apply a pending edit suggestion", async () => {
    mocks.reviewResourceEditSuggestion.mockResolvedValue({ updated: true, resourceId: 1, changes: { title: "Corrected title" } });
    await expect(appRouter.createCaller(context("moderator")).moderation.reviewEditSuggestion({ suggestionId: 41, status: "approved" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("admin")).moderation.reviewEditSuggestion({ suggestionId: 41, status: "approved", reviewNote: "Verified against source." })).resolves.toEqual({ success: true });
    expect(mocks.reviewResourceEditSuggestion).toHaveBeenCalledWith({ suggestionId: 41, status: "approved", reviewNote: "Verified against source.", reviewerId: 7 });
  });

  it("limits AI review drafts to administrators and keeps generated context separate from resource updates", async () => {
    mocks.getResourceById.mockResolvedValue({ id: 1, title: "Resource", url: "https://example.com", pricing: "free" });
    mocks.draftResourceReview.mockResolvedValue({ draft: { summary: "Metadata needs human verification.", suggestedTags: [], suggestedRelationshipNotes: [], risks: ["Sparse description"], moderationRecommendation: "needs_manual_review", confidence: 0.42, provenance: "Generated from supplied metadata only." }, model: "gpt-5-mini", usage: { total_tokens: 101 } });
    await expect(appRouter.createCaller(context("moderator")).moderation.draftResourceReview({ resourceId: 1 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("admin")).moderation.draftResourceReview({ resourceId: 1 })).resolves.toMatchObject({ model: "gpt-5-mini", draft: { moderationRecommendation: "needs_manual_review" } });
    expect(mocks.createAuditLog).toHaveBeenCalledWith(7, "generate_ai_review_draft", "resource", 1, expect.objectContaining({ model: "gpt-5-mini" }));
  });

  it("refuses to audit a report review when no open report was updated", async () => {
    mocks.reviewResourceReport.mockResolvedValue(false);
    await expect(appRouter.createCaller(context("admin")).moderation.reviewReport({ reportId: 999, status: "dismissed" })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(mocks.createAuditLog).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), "resource_report", 999, expect.anything());
  });

  it("bulk-rejects only selected submissions that are still pending and audits each one", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn().mockReturnValue({ where });
    mocks.getDb.mockResolvedValue({ update: vi.fn().mockReturnValue({ set }) });
    mocks.getSubmissionById.mockResolvedValueOnce({ id: 2, status: "pending" }).mockResolvedValueOnce({ id: 3, status: "rejected" });
    const result = await appRouter.createCaller(context("admin")).moderation.bulkRejectSubmissions({ submissionIds: [2, 3], reason: "Duplicate campaign" });
    expect(result).toEqual({ rejectedIds: [2], skippedIds: [3] });
    expect(mocks.createAuditLog).toHaveBeenCalledWith(7, "bulk_reject", "submission", 2, { reason: "Duplicate campaign", batchSize: 2 });
    expect(mocks.createAuditLog).not.toHaveBeenCalledWith(7, "bulk_reject", "submission", 3, expect.anything());
  });

  it("refuses to approve a submission that has already left the pending queue", async () => {
    const limit = vi.fn().mockResolvedValue([]);
    const where = vi.fn().mockReturnValue({ limit });
    const from = vi.fn().mockReturnValue({ where });
    const tx = { select: vi.fn().mockReturnValue({ from }) };
    mocks.getDb.mockResolvedValue({ transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx) });

    await expect(appRouter.createCaller(context("admin")).moderation.approveSubmission({ submissionId: 444 })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(tx.select).toHaveBeenCalledTimes(1);
    expect(mocks.createAuditLog).not.toHaveBeenCalledWith(7, "approve", "submission", 444, expect.anything());
  });

  it("reserves archive governance for administrators, caps bulk handoff at 25, and creates pending submissions rather than public resources", async () => {
    await expect(appRouter.createCaller(context()).archiveIntake.listRetryQueue({ limit: 25 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).archiveIntake.addTrustedDomain({ domain: "example.org" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("admin")).archiveIntake.bulkSubmitCandidatesToModeration({ batchId: 1, candidateIds: Array.from({ length: 26 }, (_, index) => index + 1), categoryId: 2, pricing: "free", tags: [] })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    mocks.getPiiFreeArchiveImportBatch.mockResolvedValue({ candidates: [{ id: 1, status: "review_ready", url: "https://github.com/org/repository", canonicalUrl: null, title: "Repository", description: "Public developer repository" }] });
    mocks.checkDuplicateByUrl.mockResolvedValue(undefined);
    mocks.checkPendingSubmissionByUrl.mockResolvedValue(undefined);
    const submissionValues = vi.fn().mockResolvedValue([{ insertId: 64 }]);
    const claimed = vi.fn().mockResolvedValue([{ affectedRows: 1 }]);
    const tx = { insert: vi.fn().mockReturnValue({ values: submissionValues }), update: vi.fn().mockReturnValue({ set: vi.fn().mockReturnValue({ where: claimed }) }) };
    mocks.getDb.mockResolvedValue({ transaction: async (callback: (transaction: typeof tx) => Promise<number>) => callback(tx) });

    await expect(appRouter.createCaller(context("admin")).archiveIntake.bulkSubmitCandidatesToModeration({ batchId: 1, candidateIds: [1], categoryId: 2, pricing: "free", tags: ["engineering"] })).resolves.toEqual({ submittedCount: 1, skippedCount: 0 });
    expect(submissionValues).toHaveBeenCalledWith(expect.objectContaining({ status: "pending", url: "https://github.com/org/repository", tags: ["engineering"] }));
    expect(mocks.createAuditLog).toHaveBeenCalledWith(7, "bulk_submit_archive_candidate_to_moderation", "archive_import_candidate", 1, expect.objectContaining({ submissionId: 64 }));
  });

  it("rejects missing or blank reasons before a bulk moderation action reaches storage", async () => {
    await expect(appRouter.createCaller(context("admin")).moderation.bulkRejectSubmissions({ submissionIds: [2], reason: " " })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(appRouter.createCaller(context("admin")).moderation.bulkRejectSubmissions({ submissionIds: [2] } as any)).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("enforces admin moderation access and returns a signed-in reputation summary", async () => {
    mocks.getUserReputationEvents.mockResolvedValue([{ eventType: "resource_approved", points: 10 }]);
    await expect(appRouter.createCaller(context()).user.getReputationSummary()).resolves.toMatchObject({ score: 12, events: [{ points: 10 }] });
    await expect(appRouter.createCaller(context()).moderation.getPendingSubmissions({ limit: 20, offset: 0 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).resources.update({ id: 42, title: "Edited resource" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("moderator")).resources.update({ id: 42, title: "Edited resource" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("moderator")).moderation.listUsers({ limit: 20, offset: 0 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).moderation.setUserRole({ userId: 8, role: "moderator" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller({ user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as TrpcContext["res"] }).moderation.bulkRejectSubmissions({ submissionIds: [1] })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("serves moderation history only to an admin caller", async () => {
    mocks.getAuditLogs.mockResolvedValue([{ id: 8, action: "approve", entityType: "submission", entityId: 4, userId: 1, createdAt: new Date() }]);
    await expect(appRouter.createCaller(context("admin")).moderation.getAuditLogs({ limit: 20, offset: 0 })).resolves.toHaveLength(1);
    expect(mocks.getAuditLogs).toHaveBeenCalledWith(20, 0);
  });

  it("returns approved trust context through the public resource contract", async () => {
    mocks.getResourceById.mockResolvedValue({ id: 1, title: "Trusted resource" });
    mocks.getApprovedResourceSources.mockResolvedValue([{ id: 4, url: "https://docs.example.com", sourceType: "documentation" }]);
    mocks.getPublicResourceHistory.mockResolvedValue([{ id: 2, summary: "Verified documentation evidence" }]);
    mocks.getLatestResourceFreshness.mockResolvedValue({ id: 8, status: "current" });
    await expect(appRouter.createCaller(context()).resources.getTrustContext({ resourceId: 1 })).resolves.toMatchObject({ sources: [{ id: 4 }], history: [{ summary: "Verified documentation evidence" }], freshness: { status: "current" } });
    expect(mocks.getApprovedResourceSources).toHaveBeenCalledWith(1);
    expect(mocks.getPublicResourceHistory).toHaveBeenCalledWith(1);
  });

  it("requires sign-in for source submission and stores a pending evidence record with an audit", async () => {
    const anonymousContext = { user: null, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as TrpcContext["res"] };
    await expect(appRouter.createCaller(anonymousContext).resources.submitSource({ resourceId: 1, url: "https://docs.example.com", sourceType: "documentation" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    mocks.getResourceById.mockResolvedValue({ id: 1, title: "Resource" });
    mocks.createResourceSource.mockResolvedValue(51);
    await expect(appRouter.createCaller(context()).resources.submitSource({ resourceId: 1, url: "https://docs.example.com", sourceType: "documentation", attribution: "Official docs" })).resolves.toEqual({ success: true, sourceId: 51 });
    expect(mocks.createResourceSource).toHaveBeenCalledWith({ resourceId: 1, url: "https://docs.example.com", sourceType: "documentation", attribution: "Official docs", addedBy: 7 });
    expect(mocks.createAuditLog).toHaveBeenCalledWith(7, "submit_source", "resource_source", 51, { resourceId: 1, sourceType: "documentation" });
  });

  it("allows moderators to verify evidence and record freshness with public history and audit traces", async () => {
    mocks.reviewResourceSource.mockResolvedValue({ id: 5, resourceId: 1, sourceType: "official" });
    mocks.getResourceById.mockResolvedValue({ id: 1, title: "Resource" });
    mocks.createFreshnessReview.mockResolvedValue(9);
    await expect(appRouter.createCaller(context("moderator")).moderation.reviewSource({ sourceId: 5, status: "approved" })).resolves.toEqual({ success: true, resourceId: 1 });
    await expect(appRouter.createCaller(context("moderator")).moderation.recordFreshness({ resourceId: 1, status: "current", note: "Official site reachable." })).resolves.toEqual({ success: true, reviewId: 9 });
    expect(mocks.recordResourceHistory).toHaveBeenCalledWith(expect.objectContaining({ resourceId: 1, eventType: "source_verified", isPublic: true }));
    expect(mocks.createAuditLog).toHaveBeenCalledWith(7, "record_freshness", "resource", 1, { reviewId: 9, status: "current" });
  });

  it("permits preview and proposal to moderators but reserves duplicate alias confirmation for administrators", async () => {
    const preview = { duplicate: { id: 3, title: "Duplicate" }, canonical: { id: 1, title: "Canonical" }, impact: { relationshipCount: 2, bookmarkCount: 1, collectionCount: 1 } };
    mocks.previewDuplicateResolution.mockResolvedValue(preview);
    mocks.createDuplicateResolutionProposal.mockResolvedValue({ created: true, id: 44, preview });
    await expect(appRouter.createCaller(context("moderator")).moderation.previewDuplicateResolution({ duplicateResourceId: 3, canonicalResourceId: 1 })).resolves.toMatchObject({ canonical: { id: 1 } });
    await expect(appRouter.createCaller(context("moderator")).moderation.proposeDuplicateResolution({ duplicateResourceId: 3, canonicalResourceId: 1, rationale: "The official URLs and metadata identify the same product." })).resolves.toMatchObject({ success: true, resolutionId: 44 });
    await expect(appRouter.createCaller(context("moderator")).moderation.confirmDuplicateResolution({ resolutionId: 44 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    mocks.confirmDuplicateResolution.mockResolvedValue({ resolution: { id: 44, duplicateResourceId: 3, canonicalResourceId: 1 }, preview });
    await expect(appRouter.createCaller(context("admin")).moderation.confirmDuplicateResolution({ resolutionId: 44, reviewNote: "Confirmed against official sources." })).resolves.toEqual({ success: true, canonicalResourceId: 1, duplicateResourceId: 3 });
    expect(mocks.createAuditLog).toHaveBeenCalledWith(7, "confirm_duplicate_resolution", "resource_duplicate_resolution", 44, expect.objectContaining({ duplicateResourceId: 3, canonicalResourceId: 1 }));
  });

  it("serves data-quality queues to moderators and denies them to ordinary users", async () => {
    mocks.getPendingResourceSources.mockResolvedValue([{ id: 5, resourceTitle: "Resource" }]);
    mocks.getFreshnessReviewQueue.mockResolvedValue([{ resourceId: 1, resourceTitle: "Resource" }]);
    mocks.getProposedDuplicateResolutions.mockResolvedValue([{ id: 9, duplicateTitle: "Old name", canonicalTitle: "Current name" }]);

    await expect(appRouter.createCaller(context("moderator")).moderation.getPendingSources({ limit: 20, offset: 0 })).resolves.toHaveLength(1);
    await expect(appRouter.createCaller(context("moderator")).moderation.getFreshnessQueue({ limit: 20, offset: 0 })).resolves.toHaveLength(1);
    await expect(appRouter.createCaller(context("moderator")).moderation.getProposedDuplicateResolutions({ limit: 20, offset: 0 })).resolves.toHaveLength(1);
    await expect(appRouter.createCaller(context()).moderation.getPendingSources({ limit: 20, offset: 0 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.getPendingResourceSources).toHaveBeenCalledWith(20, 0);
    expect(mocks.getFreshnessReviewQueue).toHaveBeenCalledWith(20, 0);
    expect(mocks.getProposedDuplicateResolutions).toHaveBeenCalledWith(20, 0);
  });
});
