import type { Express, NextFunction, Request, Response } from "express";
import { createHash } from "crypto";
import { consumeApiKeyQuota, getActiveApiKeyByHash, getCategories, getPublicCollections, getResourceBySlug, listApprovedResources } from "./db";

const API_VERSION = "v1";
const WINDOW_MS = 60_000;
const RATE_LIMIT_PER_MINUTE = 60;
const requestWindows = new Map<number, { startedAt: number; count: number }>();

export const API_SCOPES = ["resources:read", "search:read", "categories:read", "collections:read"] as const;
export type ApiScope = (typeof API_SCOPES)[number];

export const OPENAPI_DOCUMENT = {
  openapi: "3.1.0",
  info: { title: "NorthStar Public Read API", version: API_VERSION, description: "A versioned, read-only resource-intelligence API. All endpoints except this document require an owner-managed API key." },
  servers: [{ url: "/v1" }],
  components: {
    securitySchemes: { ApiKeyAuth: { type: "apiKey", in: "header", name: "X-API-Key" } },
    schemas: {
      Error: { type: "object", required: ["error"], properties: { error: { type: "object", required: ["code", "message"], properties: { code: { type: "string" }, message: { type: "string" } } } } },
      Resource: { type: "object", properties: { id: { type: "integer" }, title: { type: "string" }, slug: { type: "string" }, description: { type: ["string", "null"] }, url: { type: "string" }, category: { type: ["string", "null"] }, pricing: { type: "string" }, license: { type: ["string", "null"] }, builtBy: { type: ["string", "null"] }, updatedAt: { type: "string", format: "date-time" } } },
    },
  },
  paths: {
    "/resources": { get: { security: [{ ApiKeyAuth: [] }], summary: "List approved canonical resources", parameters: [{ name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } }, { name: "offset", in: "query", schema: { type: "integer", minimum: 0 } }, { name: "query", in: "query", schema: { type: "string", maxLength: 255 } }], responses: { "200": { description: "Approved resources" }, "401": { description: "Missing or invalid key" }, "403": { description: "Missing scope" }, "429": { description: "Quota or rate limit exceeded" } } } },
    "/resources/{slug}": { get: { security: [{ ApiKeyAuth: [] }], summary: "Get an approved canonical resource", parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Resource" }, "404": { description: "Resource not found" } } } },
    "/search": { get: { security: [{ ApiKeyAuth: [] }], summary: "Search approved resources", parameters: [{ name: "q", in: "query", required: true, schema: { type: "string", minLength: 1, maxLength: 255 } }], responses: { "200": { description: "Search results" } } } },
    "/categories": { get: { security: [{ ApiKeyAuth: [] }], summary: "List categories", responses: { "200": { description: "Categories" } } } },
    "/collections": { get: { security: [{ ApiKeyAuth: [] }], summary: "List public collections only", responses: { "200": { description: "Public collection summaries" } } } },
  },
} as const;

export function extractApiKey(request: Pick<Request, "headers">) {
  const direct = request.headers["x-api-key"];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const authorization = request.headers.authorization;
  return typeof authorization === "string" && authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : undefined;
}

export function hashApiKey(value: string) { return createHash("sha256").update(value).digest("hex"); }

export function parseBoundedInt(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function mapResource(resource: any) {
  return { id: resource.id, title: resource.title, slug: resource.slug, description: resource.description ?? null, url: resource.url, category: resource.categoryName ?? null, subcategory: resource.subcategoryName ?? null, pricing: resource.pricing, license: resource.license ?? null, builtBy: resource.builtBy ?? null, builtByUrl: resource.builtByUrl ?? null, logo: resource.logo ?? null, updatedAt: resource.updatedAt?.toISOString?.() ?? resource.updatedAt };
}

function apiError(response: Response, status: number, code: string, message: string) { return response.status(status).json({ error: { code, message } }); }

function isRateLimited(apiKeyId: number, now = Date.now()) {
  const current = requestWindows.get(apiKeyId);
  if (!current || now - current.startedAt >= WINDOW_MS) { requestWindows.set(apiKeyId, { startedAt: now, count: 1 }); return false; }
  if (current.count >= RATE_LIMIT_PER_MINUTE) return true;
  current.count += 1;
  return false;
}

function requireScope(scope: ApiScope) {
  return async (request: Request, response: Response, next: NextFunction) => {
    const rawKey = extractApiKey(request);
    if (!rawKey) return apiError(response, 401, "api_key_required", "Provide an API key using X-API-Key or Bearer authorization.");
    const apiKey = await getActiveApiKeyByHash(hashApiKey(rawKey));
    if (!apiKey) return apiError(response, 401, "invalid_api_key", "The API key is invalid, expired, or revoked.");
    const scopes = Array.isArray(apiKey.scopes) ? apiKey.scopes : [];
    if (!scopes.includes(scope)) return apiError(response, 403, "insufficient_scope", `This endpoint requires the ${scope} scope.`);
    if (isRateLimited(apiKey.id)) return apiError(response, 429, "rate_limited", "The per-minute API rate limit has been exceeded.");
    const quota = await consumeApiKeyQuota(apiKey.id, apiKey.dailyQuota);
    if (!quota.allowed) return apiError(response, 429, "daily_quota_exceeded", "The API key has reached its daily request quota.");
    response.setHeader("X-RateLimit-Limit", RATE_LIMIT_PER_MINUTE);
    response.setHeader("X-RateLimit-Remaining", quota.remaining);
    response.setHeader("X-Quota-Reset", `${quota.usageDay}T23:59:59.999Z`);
    (request as Request & { apiKeyId?: number }).apiKeyId = apiKey.id;
    return next();
  };
}

export function registerPublicApi(app: Express) {
  app.get(`/${API_VERSION}/openapi.json`, (_request, response) => response.set("Cache-Control", "public, max-age=300").json(OPENAPI_DOCUMENT));
  app.use(`/${API_VERSION}`, (_request, response, next) => { response.set("Cache-Control", "private, max-age=60"); response.set("Vary", "X-API-Key, Authorization"); next(); });

  app.get(`/${API_VERSION}/resources`, requireScope("resources:read"), async (request, response, next) => {
    try {
      const limit = parseBoundedInt(request.query.limit, 20, 1, 100);
      const offset = parseBoundedInt(request.query.offset, 0, 0, 100_000);
      const categoryId = parseBoundedInt(request.query.category_id, 0, 1, Number.MAX_SAFE_INTEGER);
      const pricing = typeof request.query.pricing === "string" && ["free", "freemium", "paid", "open_source", "enterprise"].includes(request.query.pricing) ? request.query.pricing as any : undefined;
      const result = await listApprovedResources({ limit, offset, query: typeof request.query.query === "string" ? request.query.query.slice(0, 255) : undefined, categoryId: categoryId || undefined, pricing, tag: typeof request.query.tag === "string" ? request.query.tag.slice(0, 100) : undefined, sort: request.query.sort === "newest" ? "newest" : "popular" });
      return response.json({ data: result.items.map(mapResource), meta: { version: API_VERSION, total: result.total, limit, offset } });
    } catch (error) { return next(error); }
  });

  app.get(`/${API_VERSION}/resources/:slug`, requireScope("resources:read"), async (request, response, next) => {
    try {
      const resource = await getResourceBySlug(request.params.slug);
      if (!resource || resource.status !== "approved") return apiError(response, 404, "not_found", "Approved resource not found.");
      return response.json({ data: mapResource(resource), meta: { version: API_VERSION } });
    } catch (error) { return next(error); }
  });

  app.get(`/${API_VERSION}/search`, requireScope("search:read"), async (request, response, next) => {
    try {
      const query = typeof request.query.q === "string" ? request.query.q.trim().slice(0, 255) : "";
      if (!query) return apiError(response, 400, "invalid_request", "The q search parameter is required.");
      const limit = parseBoundedInt(request.query.limit, 20, 1, 100);
      const result = await listApprovedResources({ query, limit, offset: 0, sort: "popular" });
      return response.json({ data: result.items.map(mapResource), meta: { version: API_VERSION, query, total: result.total, limit } });
    } catch (error) { return next(error); }
  });

  app.get(`/${API_VERSION}/categories`, requireScope("categories:read"), async (_request, response, next) => {
    try { return response.json({ data: await getCategories(), meta: { version: API_VERSION } }); } catch (error) { return next(error); }
  });

  app.get(`/${API_VERSION}/collections`, requireScope("collections:read"), async (request, response, next) => {
    try {
      const limit = parseBoundedInt(request.query.limit, 20, 1, 100);
      const offset = parseBoundedInt(request.query.offset, 0, 0, 100_000);
      return response.json({ data: await getPublicCollections(limit, offset), meta: { version: API_VERSION, limit, offset } });
    } catch (error) { return next(error); }
  });

  app.use(`/${API_VERSION}`, (_request, response) => apiError(response, 404, "not_found", "Public API endpoint not found."));
}
