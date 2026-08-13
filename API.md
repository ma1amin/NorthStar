# NorthStar Public API

NorthStar provides a **versioned, read-only REST API** under `/v1`. The browser application continues to use its internal tRPC contracts under `/api/trpc`; those internal procedures are not a stability promise for external consumers.

## Access model

Every `/v1` data endpoint requires an owner-managed API key through either `X-API-Key` or `Authorization: Bearer <key>`. Keys are created in the authenticated [Developer portal](/developer). NorthStar returns the full plaintext key exactly once and stores only a SHA-256 hash, a short prefix, scopes, expiry metadata, and lifecycle state.

| Property | Current behavior |
|---|---|
| API version | `/v1` |
| Data access | Read-only approved canonical resources and public collections |
| Authentication | `X-API-Key` or bearer token |
| Scopes | `resources:read`, `search:read`, `categories:read`, `collections:read` |
| Rate limit | 60 requests per active key per minute, held in process memory |
| Daily quota | Owner-selected 100–10,000 requests; defaults to 1,000 and is recorded per key/day without payload or IP retention |
| Revocation | Immediate owner-only revocation through the Developer portal |
| Versioning | New breaking changes require a new `/vN` path rather than silent contract mutation |

> **Key safety.** Never place an API key in a browser bundle, public repository, client-side source code, or URL. Revoke it immediately if exposure is suspected. The platform cannot recover a lost plaintext key; create a replacement instead.

## OpenAPI contract

The machine-readable OpenAPI 3.1 document is available at [`/v1/openapi.json`](/v1/openapi.json). It publishes the stable endpoint paths, API-key security scheme, core parameter bounds, and response/error expectations.

## Endpoints

| Endpoint | Scope | Purpose |
|---|---|---|
| `GET /v1/resources` | `resources:read` | List approved canonical resources; supports `limit`, `offset`, `query`, `category_id`, `pricing`, `tag`, and `sort`. |
| `GET /v1/resources/{slug}` | `resources:read` | Retrieve an approved canonical resource by stable slug. |
| `GET /v1/search?q=…` | `search:read` | Search approved canonical resources. |
| `GET /v1/categories` | `categories:read` | List resource categories. |
| `GET /v1/collections` | `collections:read` | List public collections only, with owner attribution and resource counts. |

Responses use a stable envelope. For example:

```json
{
  "data": [{ "id": 42, "title": "Example", "slug": "example" }],
  "meta": { "version": "v1", "total": 1, "limit": 20, "offset": 0 }
}
```

Errors use the following envelope and never return unapproved content, private reports, reviewer notes, key hashes, or plaintext credentials.

```json
{ "error": { "code": "insufficient_scope", "message": "This endpoint requires the search:read scope." } }
```

## Example

```bash
curl --request GET "https://your-northstar-host/v1/search?q=Figma" \
  --header "X-API-Key: ns_live_replace_with_your_key"
```

## Operational boundaries

The public API intentionally excludes all writes, community submissions, moderation queues, audit logs, private collections, pending evidence, private reports, and AI drafts. Resource aliases resolve to their canonical public resource. Rate limiting is process-local in the current autoscaled runtime, while daily quotas are database-backed; a distributed limiter is an operational-scale follow-up rather than a claim made by this release.

NorthStar records owner-visible API-key creation and revocation in its moderation audit history. It does not log request bodies, raw keys, key hashes in audit records, user IP addresses, or API request payloads for quota accounting.
