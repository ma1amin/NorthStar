# NorthStar Architecture

NorthStar is a React 19 and Vite client application backed by Express, tRPC, Drizzle ORM, and MySQL/TiDB. Public discovery is readable without an account; Manus OAuth establishes authenticated sessions for contributions, collections, voting, profiles, and role-controlled moderation.

Resources are relational graph nodes and relationships are typed edges. The current relational graph is intentionally separated from future graph-store concerns: application code should query graph capabilities through domain helpers so Neo4j, ArangoDB, or Amazon Neptune can be evaluated later without forcing a premature data-store migration.

Public content is a client-rendered SPA with server-injected route metadata, Open Graph data, JSON-LD, canonical data, and public fallback content. It is not full server-side rendering. Search is database-backed with fuzzy and relationship-aware behaviour; it is not presented as an external search-engine integration.

## Core Boundaries

| Layer | Responsibility |
| --- | --- |
| `drizzle/schema.ts` | Schema, relational integrity, and reviewed migrations. |
| `server/db.ts` | Data-access helpers, graph/domain queries, provenance, freshness, and duplicate-alias logic. |
| `server/routers.ts` | Validated tRPC contracts, authentication, authorization, audit-aware mutations, and owner API-key lifecycle. |
| `server/publicApi.ts` | Versioned read-only REST handlers, OpenAPI document, scoped API-key checks, and rate/quota boundary. |
| `client/src/pages` | Public discovery, trust context, contribution, account, and moderation workflows. |
| `client/src/components` | Reusable interaction, layout, accessibility, reporting, and suggestion primitives. |
| Documentation and seed scripts | Reproducible contributor experience without sensitive data. |

## Trust and Data-Quality Model

| Domain record | Purpose | Public boundary |
| --- | --- | --- |
| `resource_sources` | Captures evidence URL, type, attribution, licensing note, capture time, and verification state. | Only **approved** sources appear in public trust context. |
| `resource_history` | Append-only accountability events for accepted resource changes, evidence verification, freshness checks, and confirmed duplicate aliases. | Only records marked public are returned to Node Views. |
| `resource_freshness_reviews` | Point-in-time `current`, `needs_review`, or `stale` moderation guidance. | Latest review may be shown publicly; private review workflows remain restricted. |
| `resource_duplicate_resolutions` | Previewable proposals and confirmed canonical aliases. | Confirmation aliases the duplicate resource to a canonical node; it does not delete records or silently rewrite linked community data. |
| `resources.canonicalResourceId` | Canonical target for a confirmed duplicate alias. | Public discovery filters canonical aliases while old slug resolution returns the canonical node. |

Moderators can review source evidence, record freshness, and propose duplicate resolutions. Only administrators can confirm a canonical alias. Every mutation records an audit event; public history deliberately excludes private reports, reviewer notes, and unapproved evidence.

## Deferred Architecture Decisions

The versioned `/v1` read API, owner-managed API keys, scopes, quotas, and OpenAPI document are active components. Semantic/vector search, worker queues, Redis-backed distributed rate limiting, source ingestion, PWA caching, dedicated graph stores, and ecosystem integrations remain separately governed workstreams in [`todo.md`](./todo.md), with current evidence and decision gates in [`DOCUMENTATION_TRACEABILITY.md`](./DOCUMENTATION_TRACEABILITY.md).

All AI assistance must create reviewable drafts and must never publish content automatically. High-impact changes remain subject to human moderation and audit logging.
