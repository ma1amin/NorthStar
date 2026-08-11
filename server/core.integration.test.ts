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
    expect(mocks.recordSearchAnalytics).toHaveBeenCalledWith({ query: "Jira alternatives", resultCount: 1, relationshipIntent: "alternatives" });
  });

  it("serves filtered Browse results through the public router", async () => {
    mocks.listApprovedResources.mockResolvedValue({ items: [{ id: 1, slug: "figma" }], total: 1 });
    await expect(appRouter.createCaller(context()).resources.listFiltered({ limit: 12, offset: 0, categoryId: 2, sort: "popular" })).resolves.toEqual({ items: [{ id: 1, slug: "figma" }], total: 1 });
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
});
