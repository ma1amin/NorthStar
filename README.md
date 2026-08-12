# NorthStar

NorthStar is an open-source **Resource Intelligence Platform** for discovering, understanding, organizing, and connecting digital resources through structured metadata, verified relationships, curated collections, and human-reviewed community contributions.

> **NorthStar is a knowledge platform, not a flat link directory.** Each resource is a reviewable knowledge object with categories, tags, community context, and a place in a wider relationship graph.

## Current Capabilities

| Area | Included today |
| --- | --- |
| Discovery | Public Browse, filters, pagination, sort controls, typo-tolerant search, and relationship-aware queries. |
| Knowledge graph | Resource nodes, ten typed graph edges, evidence-aware suggestions, exact Node View relationship tabs, and a bounded accessible graph explorer. |
| Community | Resource submissions with duplicate feedback, edit suggestions, collections, bookmarks, votes, reputation, and reports. |
| Moderation | Submission and relationship queues, report triage, audit history, bounded bulk rejection, administrator resource editing, AI review drafts, and role management. |
| Quality | Route metadata, JSON-LD, canonical data, public fallback content, URL metadata safeguards, responsive design, RTL foundations, and automated tests. |

## Truthful Scope

NorthStar is currently a client-rendered React SPA with server-injected SEO metadata and public fallback content. It is **not** full server-side rendering. Search is database-backed with lexical, fuzzy, filtered, and relationship-aware retrieval; no external search provider, embeddings, or semantic/vector index is enabled. The internal application uses tRPC contracts; a stable public REST API is future work.

Public browsing requires no account. Authenticated contributions use the connected **Manus OAuth** identity flow. NorthStar does not currently provide local passwords, direct email sign-in, magic links, or independently selectable Google/GitHub login providers. See [PROJECT_POLICY.md](./PROJECT_POLICY.md) for the authoritative account, licensing, governance, and data-handling posture.

## Development

Install dependencies with `pnpm install`, configure private local values described in [ENVIRONMENT.md](./ENVIRONMENT.md), and apply reviewed schema migrations with `pnpm db:push`.

```bash
pnpm check
pnpm test
pnpm build
```

For a disposable local database only, seed synthetic development data explicitly:

```bash
NORTHSTAR_ALLOW_SEED=1 pnpm db:seed
```

The seed script is idempotent and intentionally contains no live database export, credentials, user information, audit history, or production-like data.

## Documentation

| Document | Purpose |
| --- | --- |
| [PROJECT_POLICY.md](./PROJECT_POLICY.md) | Authoritative policy for license, governance, identity, retention, and release claims. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Current system boundaries and graph/search architecture. |
| [API.md](./API.md) | Current tRPC contract boundary and future public-API direction. |
| [DATA_HANDLING.md](./DATA_HANDLING.md) | Repository and sanitized-seed data safeguards. |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution workflow and quality expectations. |
| [GOVERNANCE.md](./GOVERNANCE.md) | Maintainer-led decision-making and moderation authority. |
| [SECURITY.md](./SECURITY.md) | Vulnerability-reporting guidance and security principles. |
| [DOCUMENTATION_TRACEABILITY.md](./DOCUMENTATION_TRACEABILITY.md) | Evidence-based comparison of the supplied documentation and current implementation. |
| [REMAINING_WORK_ROADMAP.md](./REMAINING_WORK_ROADMAP.md) | Prioritized remediation and future-release roadmap. |

## License

NorthStar is licensed under the [MIT License](./LICENSE).
