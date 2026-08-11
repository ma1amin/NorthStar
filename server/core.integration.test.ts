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
}));

vi.mock("./search", () => ({ searchService: { advancedSearch: mocks.advancedSearch, getSuggestions: vi.fn(), getTrending: vi.fn() } }));
vi.mock("./db", () => ({
  getDb: vi.fn(), listApprovedResources: mocks.listApprovedResources,
  checkDuplicateByUrl: mocks.checkDuplicateByUrl, checkPendingSubmissionByUrl: mocks.checkPendingSubmissionByUrl,
  getUserReputationEvents: mocks.getUserReputationEvents,
  getAuditLogs: mocks.getAuditLogs,
  recordSearchAnalytics: mocks.recordSearchAnalytics,
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

  it("enforces admin moderation access and returns a signed-in reputation summary", async () => {
    mocks.getUserReputationEvents.mockResolvedValue([{ eventType: "resource_approved", points: 10 }]);
    await expect(appRouter.createCaller(context()).user.getReputationSummary()).resolves.toMatchObject({ score: 12, events: [{ points: 10 }] });
    await expect(appRouter.createCaller(context()).moderation.getPendingSubmissions({ limit: 20, offset: 0 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context()).resources.update({ id: 42, title: "Edited resource" })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(appRouter.createCaller(context("moderator")).resources.update({ id: 42, title: "Edited resource" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("serves moderation history only to an admin caller", async () => {
    mocks.getAuditLogs.mockResolvedValue([{ id: 8, action: "approve", entityType: "submission", entityId: 4, userId: 1, createdAt: new Date() }]);
    await expect(appRouter.createCaller(context("admin")).moderation.getAuditLogs({ limit: 20, offset: 0 })).resolves.toHaveLength(1);
    expect(mocks.getAuditLogs).toHaveBeenCalledWith(20, 0);
  });
});
