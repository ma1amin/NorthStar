# NorthStar Documentation-to-Implementation Traceability

**Last reconciled:** 12 August 2026
**Author:** Manus AI  
**Evidence rule:** A capability is marked **implemented** only when current code plus tests or documented browser/migration evidence establish it. Planning text, old release claims, and unchecked roadmap entries are not evidence.

## Current Conclusion

NorthStar has a complete **core resource-intelligence platform**: public discovery, structured/fuzzy/relationship-aware search, ten relationship types, bounded graph exploration, contributions, collections, votes, reputation, human moderation, audit history, bilingual critical flows, and evidence-led data-quality workflows. [1] [2] [3]

The primary remaining work is not core directory functionality. It is public-developer API work, measured search quality, delivery/observability maturity, PWA/offline decisions, governed ingestion, record-migration safeguards, and scale experiments. These approved workstreams are sequenced in [`todo.md`](./todo.md) and retain their fuller acceptance criteria in [`suggest.md`](./suggest.md). [4]

## Evidence Matrix

| Requirement area | Current disposition | Evidence | Remaining boundary |
| --- | --- | --- | --- |
| Public directory, categories, tags, filters, Node Views, and account-free discovery | **Implemented** | Browse/Search/Resource routes and verified public QA. [1] [3] | Content growth and production measurement remain ongoing operations. |
| Exact, fuzzy, faceted, and relationship-aware search | **Implemented** | Database-backed search provider and search tests. [1] [5] | Latency/relevance measurement and any external provider are held decisions. |
| Typed relationships, evidence, moderation, and graph explorer | **Implemented** | Schema, tRPC contracts, graph helper, Node View, and tests. [1] [2] | Traversal is intentionally bounded; multi-hop analytics are held. |
| Community submissions, duplicate detection, edit suggestions, collections, votes, reputation, reports | **Implemented** | Schema, protected contracts, and integration tests. [1] [2] | Social curation expansion remains held. |
| Human oversight, RBAC, audits, bulk moderation, roles, AI drafts | **Implemented** | Role-gated router contracts and audit test coverage. [1] [3] | Privileged browser walkthrough is CAPTCHA-limited. |
| EN/AR critical product flows, RTL layouts, and local theme preference | **Implemented with intentional footer exception** | Locale catalog, public Home/Search/Graph/collection/route UI, RTL browser QA, locale tests, and theme-persistence tests. [3] [6] | Footer copy remains intentionally English; broader documentation localization remains a separate decision. |
| Public discovery routes and collection curation | **Implemented** | Trending uses live public resource momentum; About and Developer state current platform boundaries; Settings stores local theme/locale preferences; public collections expose only shareable stacks, owner attribution, and aggregate resource counts. [1] [3] | Public developer API capability is delivered through the versioned API boundary below. |
| Attributed sources, public history, freshness guidance, canonical aliases | **Implemented with operating UX** | Migration `0007`, schema, Node View evidence submission/alias notice, Admin source/freshness/duplicate queues, protected source/freshness/alias contracts, and 78-test verification. [1] [3] | Automatic freshness jobs, source scoring, and a governed cross-record migration workflow remain pending. |
| Public REST API, OpenAPI, API keys, quota lifecycle | **Implemented with scale boundary** | `/v1` read endpoints, OpenAPI 3.1 document, one-time hashed-key lifecycle, explicit read scopes, owner revocation, process-local minute limits, database-backed daily quotas, Developer portal, and contract tests. [7] | Distributed rate limiting and advanced API analytics remain operational-scale follow-up work. |
| Semantic/vector search and external search provider | **Not implemented** | Search capability documentation and current dependencies. [5] | Held as `S-09` and `S-10`. |
| Search quality analytics, evaluation, and provider boundary | **Implemented with governed external boundary** | Privacy-filtered latency, zero-result, click, and reformulation signals; moderator relevance cases; ranking metrics; relational provider adapter; Search Quality workspace; and benchmark license gate. [1] [5] | No external lexical/semantic provider, imported benchmark corpus, or reported external benchmark score is configured. |
| PWA/offline experience | **Not implemented** | No manifest/service worker/cache evidence. [1] | Held as `S-12`. |
| CI/CD, backups, metrics, traces, alerts, load evidence | **Not implemented / not verifiable** | No checked-in operational stack or CI evidence. [1] | Held as `S-11`. |
| External-source ingestion and ecosystem integrations | **Not implemented** | No ingestion worker/adapter evidence. [1] | Held as `S-13` and `S-16`. |
| Graph scale architecture and asynchronous jobs | **Deferred by design** | Relational graph boundary isolates future providers. [2] | Held as `S-15`; no premature infrastructure commitment. |
| SSR | **Deferred by design** | Current SPA with injected metadata and fallback content is documented accurately. [2] [3] | Revisit only with crawler/performance evidence. |
| Open-source policy, governance, and identity posture | **Implemented** | MIT license, project policy, governance, contribution, and security documents. [8] | Auth-provider expansion remains a separate decision. |
| GitHub publication and privileged browser QA | **Not verifiable from this environment** | QA/release records document CAPTCHA and sandbox authentication limitations. [3] | Held as `S-18` and `S-19`. |

## Current Decision Boundary

The currently approved capability work is sequenced in [`todo.md`](./todo.md). Any newly proposed capability remains in [`suggest.md`](./suggest.md) until explicit owner direction, and no documentation entry is treated as implementation evidence without current code plus tests or documented QA.

## References

[1]: [Current schema, routers, migrations, and tests](./drizzle/schema.ts)
[2]: [Architecture](./ARCHITECTURE.md)
[3]: [Verification record and QA notes](./VERIFICATION.md)
[4]: [Suggestion register](./suggest.md)
[5]: [Search architecture](./SEARCH_ARCHITECTURE.md)
[6]: [Language context](./client/src/contexts/LanguageContext.tsx)
[7]: [API boundary](./API.md)
[8]: [Project policy](./PROJECT_POLICY.md)
