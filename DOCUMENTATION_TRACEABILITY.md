# NorthStar Documentation-to-Implementation Traceability

**Last reconciled:** 12 August 2026
**Author:** Manus AI  
**Evidence rule:** A capability is marked **implemented** only when current code plus tests or documented browser/migration evidence establish it. Planning text, old release claims, and unchecked roadmap entries are not evidence.

## Current Conclusion

NorthStar has a complete **core resource-intelligence platform**: public discovery, structured/fuzzy/relationship-aware search, ten relationship types, bounded graph exploration, contributions, collections, votes, reputation, human moderation, audit history, bilingual critical flows, and evidence-led data-quality foundations. [1] [2] [3]

The primary remaining work is not core directory functionality. It is moderator operating UX for the new data-quality foundations, public-developer API work, measured search quality, delivery/observability maturity, PWA/offline decisions, governed ingestion, and scale experiments. These ideas are preserved in [`suggest.md`](./suggest.md) until the owner chooses to scope them. [4]

## Evidence Matrix

| Requirement area | Current disposition | Evidence | Remaining boundary |
| --- | --- | --- | --- |
| Public directory, categories, tags, filters, Node Views, and account-free discovery | **Implemented** | Browse/Search/Resource routes and verified public QA. [1] [3] | Content growth and production measurement remain ongoing operations. |
| Exact, fuzzy, faceted, and relationship-aware search | **Implemented** | Database-backed search provider and search tests. [1] [5] | Latency/relevance measurement and any external provider are held decisions. |
| Typed relationships, evidence, moderation, and graph explorer | **Implemented** | Schema, tRPC contracts, graph helper, Node View, and tests. [1] [2] | Traversal is intentionally bounded; multi-hop analytics are held. |
| Community submissions, duplicate detection, edit suggestions, collections, votes, reputation, reports | **Implemented** | Schema, protected contracts, and integration tests. [1] [2] | Social curation expansion remains held. |
| Human oversight, RBAC, audits, bulk moderation, roles, AI drafts | **Implemented** | Role-gated router contracts and audit test coverage. [1] [3] | Privileged browser walkthrough is CAPTCHA-limited. |
| EN/AR critical product flows and RTL layouts | **Implemented with documented low-priority follow-up** | Locale catalog, RTL browser QA, and locale tests. [3] [6] | Footer utility copy, some command-palette labels, and a documentation-localization decision remain held. |
| Attributed sources, public history, freshness guidance, canonical aliases | **Implemented foundation** | Migration `0007`, schema, trust-context UI, protected source/freshness/alias contracts, and 77-test verification. [1] [3] | No dedicated moderator queue UI, automatic freshness job, source scoring, or destructive record merge. |
| Public REST API, OpenAPI, API keys, quota lifecycle | **Not implemented** | API documentation retains internal tRPC-only boundary. [7] | Held as `S-08`. |
| Semantic/vector search and external search provider | **Not implemented** | Search capability documentation and current dependencies. [5] | Held as `S-09` and `S-10`. |
| Search quality analytics beyond completed-query counts | **Partial** | Privacy-conscious completed-query analytics exists. [1] | Clicks, reformulation, relevance set, latency baseline, and quality thresholds are held. |
| PWA/offline experience | **Not implemented** | No manifest/service worker/cache evidence. [1] | Held as `S-12`. |
| CI/CD, backups, metrics, traces, alerts, load evidence | **Not implemented / not verifiable** | No checked-in operational stack or CI evidence. [1] | Held as `S-11`. |
| External-source ingestion and ecosystem integrations | **Not implemented** | No ingestion worker/adapter evidence. [1] | Held as `S-13` and `S-16`. |
| Graph scale architecture and asynchronous jobs | **Deferred by design** | Relational graph boundary isolates future providers. [2] | Held as `S-15`; no premature infrastructure commitment. |
| SSR | **Deferred by design** | Current SPA with injected metadata and fallback content is documented accurately. [2] [3] | Revisit only with crawler/performance evidence. |
| Open-source policy, governance, and identity posture | **Implemented** | MIT license, project policy, governance, contribution, and security documents. [8] | Auth-provider expansion remains a separate decision. |
| GitHub publication and privileged browser QA | **Not verifiable from this environment** | QA/release records document CAPTCHA and sandbox authentication limitations. [3] | Held as `S-18` and `S-19`. |

## Current Decision Boundary

No unimplemented capability in this matrix is automatically scheduled. All recommendations, including moderator data-quality queues, API work, search experiments, operational maturity, and integrations, are held in [`suggest.md`](./suggest.md) until explicit owner direction. The active execution history and completed work are maintained in [`todo.md`](./todo.md).

## References

[1]: [Current schema, routers, migrations, and tests](./drizzle/schema.ts)
[2]: [Architecture](./ARCHITECTURE.md)
[3]: [Verification record and QA notes](./VERIFICATION.md)
[4]: [Suggestion register](./suggest.md)
[5]: [Search architecture](./SEARCH_ARCHITECTURE.md)
[6]: [Language context](./client/src/contexts/LanguageContext.tsx)
[7]: [API boundary](./API.md)
[8]: [Project policy](./PROJECT_POLICY.md)
