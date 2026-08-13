# NorthStar

NorthStar is an open-source **Resource Intelligence Platform** for discovering, understanding, organizing, and connecting digital resources through structured metadata, verified relationships, curated collections, community contributions, and human moderation.

> **NorthStar is a knowledge platform, not a flat link directory.** A resource is a reviewable knowledge object with metadata, categories, tags, relationship evidence, freshness context, and a place in a wider graph.

## Current Capabilities

| Area | Included and verified today |
| --- | --- |
| Discovery | Public Browse, filters, pagination, sort controls, typo-tolerant search, and relationship-aware queries. |
| Knowledge graph | Resource nodes, ten typed graph edges, evidence-aware suggestions, exact Node View relationship tabs, and a bounded accessible graph explorer. |
| Community | Resource submissions with duplicate feedback, edit suggestions, collections, bookmarks, votes, reputation, and reports. |
| Trust and data quality | Attributed source records, public resource-history events, freshness reviews, and non-destructive canonical aliases for confirmed duplicates. Public Node Views show only approved evidence and public history. |
| Moderation | Submission and relationship queues, report triage, audit history, bounded bulk rejection, administrator resource editing, AI review drafts, role management, source review, freshness recording, and previewable duplicate-resolution contracts. |
| Localization and UX | English/Arabic critical flows with RTL-safe layouts across discovery, contribution, collections, reports, Profile, and moderation surfaces. |
| Verification | TypeScript validation and 77 passing Vitest tests across 13 files at the latest documented checkpoint. [1] |

## Truthful Scope

NorthStar is a client-rendered React SPA with server-injected SEO metadata and public fallback content. It is **not** full server-side rendering. Search is database-backed with lexical, fuzzy, filtered, and relationship-aware retrieval; no external search provider, embeddings, or semantic/vector index is enabled. The internal application uses tRPC contracts and NorthStar also provides a versioned, read-only `/v1` REST API with owner-managed scoped keys, quotas, and OpenAPI documentation.

Public browsing requires no account. Authenticated contributions use the connected **Manus OAuth** identity flow. NorthStar does not currently provide local passwords, direct email sign-in, magic links, or independently selectable Google/GitHub login providers. Confirmed duplicate aliases preserve the original resource record and linked community records; they are not a destructive record-merging engine.

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

## Documentation and Decision Boundaries

| Document | Purpose |
| --- | --- |
| [PROJECT_POLICY.md](./PROJECT_POLICY.md) | Authoritative policy for license, governance, identity, retention, and release claims. |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Current system boundaries, graph/search architecture, and data-quality model. |
| [API.md](./API.md) | Versioned public read API, key lifecycle, scope, quota, and OpenAPI boundary. |
| [SEARCH_QUALITY.md](./SEARCH_QUALITY.md) | Privacy-safe measurement, human relevance evaluation, provider boundary, and external benchmark gate. |
| [DATA_HANDLING.md](./DATA_HANDLING.md) | Repository, seed, provenance, history, and retention safeguards. |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution workflow and quality expectations. |
| [GOVERNANCE.md](./GOVERNANCE.md) | Maintainer-led decision-making and moderation authority. |
| [SECURITY.md](./SECURITY.md) | Vulnerability-reporting guidance and security principles. |
| [DOCUMENTATION_TRACEABILITY.md](./DOCUMENTATION_TRACEABILITY.md) | Evidence-based comparison of supplied requirements and current implementation. |
| [REMAINING_WORK_ROADMAP.md](./REMAINING_WORK_ROADMAP.md) | Current delivered baseline, verification limits, and decision gates. |
| [suggest.md](./suggest.md) | Approved enhancement register and phased acceptance criteria. |

## Imported Specification Corpus

The folders `01-product` through `13-research` preserve the GitHub repository’s original NorthStar documentation corpus for traceability. They are historical design/reference material and do not supersede current code, the MIT license, or the authoritative policy documents above. See [DOCUMENTATION_TRACEABILITY.md](./DOCUMENTATION_TRACEABILITY.md) for the evidence-led reconciliation.

## License

NorthStar is licensed under the [MIT License](./LICENSE).

## References

[1]: [Verification record](./VERIFICATION.md)
