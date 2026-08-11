# NorthStar Architecture

NorthStar is a React 19 and Vite client application backed by Express, tRPC, Drizzle ORM, and MySQL/TiDB. Public discovery is readable without an account; Manus OAuth establishes authenticated sessions for contributions, collections, voting, profiles, and role-controlled moderation.

Resources are relational graph nodes and relationships are typed edges. The current relational graph is intentionally separated from future graph-store concerns: application code should query graph capabilities through domain helpers so Neo4j, ArangoDB, or Amazon Neptune can be evaluated later without forcing a premature data-store migration.

Public content is a client-rendered SPA with server-injected route metadata, Open Graph data, JSON-LD, canonical data, and public fallback content. It is not full server-side rendering. Search is database-backed with fuzzy and relationship-aware behaviour; it is not presented as an external search-engine integration.

## Core Boundaries

| Layer | Responsibility |
| --- | --- |
| `drizzle/schema.ts` | Schema, relational integrity, and migrations. |
| `server/db.ts` | Data-access helpers and graph/domain queries. |
| `server/routers.ts` | Validated tRPC contracts, authentication, authorization, and audit-aware mutations. |
| `client/src/pages` | Public discovery, contribution, account, and moderation workflows. |
| `client/src/components` | Reusable interaction, layout, and accessibility primitives. |
| Documentation and seed scripts | Reproducible contributor experience without sensitive data. |

All AI assistance must create reviewable drafts and must never publish content automatically. High-impact changes remain subject to human moderation and audit logging.
