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
  createResourceReport: vi.fn(),
  reviewResourceReport: vi.fn(),
  createAuditLog: vi.fn(),
}));

vi.mock("./search", () => ({ searchService: { advancedSearch: mocks.advancedSearch, getSuggestions: vi.fn(), getTrending: vi.fn() } }));
vi.mock("./db", () => ({
  getDb: vi.fn(), listApprovedResources: mocks.listApprovedResources,
  checkDuplicateByUrl: mocks.checkDuplicateByUrl, checkPendingSubmissionByUrl: mocks.checkPendingSubmissionByUrl,
  getUserReputationEvents: mocks.getUserReputationEvents,
  getAuditLogs: mocks.getAuditLogs,
  recordSearchAnalytics: mocks.recordSearchAnalytics,
  getResourceById: mocks.getResourceById,
  createResourceReport: mocks.createResourceReport,
  reviewResourceReport: mocks.reviewResourceReport,
  createAuditLog: mocks.createAuditLog,
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

  it("refuses to audit a report review when no open report was updated", async () => {
    mocks.reviewResourceReport.mockResolvedValue(false);
    await expect(appRouter.createCaller(context("admin")).moderation.reviewReport({ reportId: 999, status: "dismissed" })).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(mocks.createAuditLog).not.toHaveBeenCalledWith(expect.anything(), expect.anything(), "resource_report", 999, expect.anything());
  });

  it("enforces admin moderation access and returns a signed-in reputation summary", async () => {
    mocks.getUserReputationEvents.mockResolvedValue([{ eventType: "resource_approved", points: 10 }]);
    await expect(appRouter.createCaller(context()).user.getReputationSummary()).resolves.toMatchObject({ score: 12, events: [{ points: 10 }] });
    await expect(appRouter.createCaller(context()).moderation.getPendingSubmissions({ limit: 20, offset: 0 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).resources.update({ id: 42, title: "Edited resource" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("moderator")).resources.update({ id: 42, title: "Edited resource" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("moderator")).moderation.listUsers({ limit: 20, offset: 0 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).moderation.setUserRole({ userId: 8, role: "moderator" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("serves moderation history only to an admin caller", async () => {
    mocks.getAuditLogs.mockResolvedValue([{ id: 8, action: "approve", entityType: "submission", entityId: 4, userId: 1, createdAt: new Date() }]);
    await expect(appRouter.createCaller(context("admin")).moderation.getAuditLogs({ limit: 20, offset: 0 })).resolves.toHaveLength(1);
    expect(mocks.getAuditLogs).toHaveBeenCalledWith(20, 0);
  });
});
