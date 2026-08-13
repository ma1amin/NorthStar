# NorthStar Documentation-to-Implementation Traceability

**Last reconciled:** 13 August 2026
**Author:** Manus AI  
**Evidence rule:** A capability is marked **implemented** only when current code plus tests or documented browser/migration evidence establish it. Planning text, old release claims, and unchecked roadmap entries are not evidence.

## Current Conclusion

NorthStar has a complete **core resource-intelligence platform**: public discovery, structured/fuzzy/relationship-aware search, ten relationship types, a bounded and filterable graph explorer, contributions, collections, votes, reputation, human moderation, audit history, bilingual critical flows, evidence-led data-quality workflows, consent-first resource capture, governed verified-contributor workflows, and an Atlas 2 semantic light/dark visual system. [1] [2] [3] [9]

The current release completes the owner-requested visibility remediation by expanding the live public directory to 20 approved resources across seven categories and recording a deterministic, relationship-rich local fixture for all ten graph types. Staged value experimentation remains inactive until a separate owner-approved brief; external integrations and infrastructure providers remain consent/configuration boundaries. [3] [4]

## Evidence Matrix

| Requirement area | Current disposition | Evidence | Remaining boundary |
| --- | --- | --- | --- |
| Public directory, categories, tags, filters, Node Views, and account-free discovery | **Implemented and expanded** | Browse/Search/Resource routes, public QA, seven categories, 18 subcategories, 13 tags, 20 approved resources, 11 approved sources, and real official-source curation record. [1] [3] | Content growth remains a human-reviewed operating practice; no artificial review/rating signals are used. |
| Exact, fuzzy, faceted, and relationship-aware search | **Implemented** | Database-backed search provider and search tests. [1] [5] | Latency/relevance measurement and any external provider are held decisions. |
| Typed relationships, evidence, moderation, and graph explorer | **Implemented with provider boundary** | Schema, tRPC contracts, filter/list helpers, Node View, tested bounded visual Graph Explorer, relational `GraphProvider` adapter, and all-ten-type sanitized local fixture. [1] [2] [3] | Traversal is intentionally bounded; external graph stores, queues, and caches are not configured. |
| Community submissions, duplicate detection, edit suggestions, collections, votes, reputation, reports | **Implemented** | Schema, protected contracts, and integration tests. [1] [2] | Social curation expansion remains held. |
| Consent-first resource capture from pasted text, links, and accepted text exports | **Implemented** | `RESOURCE_INTAKE_CONTRACT.md`, `server/intake.ts`, Capture Resources UI, intake schema/migration, and focused unit/integration tests. [1] [3] [10] | No automatic publication, background fetching, or external message ingestion is enabled. Files remain a user-directed local input. |
| Hybrid verified-contributor programme | **Implemented with human-review guardrail** | `CONTRIBUTOR_MODEL.md`, manual portfolio application/review, accepted-work history, appeal records, daily allowance enforcement, server-authoritative remaining-capacity feedback, verified-first sampled queue ordering, Profile status UI, Admin Contributors workspace, and 106-test validation. [1] [3] [9] | Verified status does not authorize automatic publishing. |
| Non-blocking professional-workspace, organization-management, and governed-API-capacity experiments | **Implemented as an inactive governance framework** | `VALUE_EXPERIMENTS.md` defines hypotheses, stage gates, consent, privacy, least-privilege, audit, rollback, public-access, and stop requirements; existing collection, API-key, audit, and appeal boundaries provide prerequisites. [1] [3] [9] | No billing, participant cohort, organization-claim flow, external identity provider, or enhanced API entitlement is active without a separate owner-approved experiment brief. |
| Human oversight, RBAC, audits, bulk moderation, roles, AI drafts | **Implemented** | Role-gated router contracts and audit test coverage. [1] [3] | Privileged browser walkthrough is CAPTCHA-limited. |
| EN/AR critical product flows, RTL layouts, and local theme preference | **Implemented with intentional footer exception** | Locale catalog, Atlas 2 semantic light/dark tokens, public Home/Search/Graph/collection/route UI, RTL browser QA, locale tests, and theme-persistence tests. [3] [6] | Footer copy remains intentionally English; broader documentation localization remains a separate decision. |
| Public discovery routes and collection curation | **Implemented** | Trending uses live public resource momentum; About and Developer state current platform boundaries; Settings stores local theme/locale preferences; public collections expose only shareable stacks, owner attribution, and aggregate resource counts. [1] [3] | Public developer API capability is delivered through the versioned API boundary below. |
| Attributed sources, public history, freshness guidance, canonical aliases | **Implemented with operating UX** | Migration `0007`, schema, Node View evidence submission/alias notice, Admin source/freshness/duplicate queues, protected source/freshness/alias contracts, and 78-test verification. [1] [3] | Automatic freshness jobs, source scoring, and a governed cross-record migration workflow remain pending. |
| Public REST API, OpenAPI, API keys, quota lifecycle | **Implemented with scale boundary** | `/v1` read endpoints, OpenAPI 3.1 document, one-time hashed-key lifecycle, explicit read scopes, owner revocation, process-local minute limits, database-backed daily quotas, Developer portal, and contract tests. [7] | Distributed rate limiting and advanced API analytics remain operational-scale follow-up work. |
| Semantic/vector search and external search provider | **Not implemented** | Search capability documentation and current dependencies. [5] | Held as `S-09` and `S-10`. |
| Search quality analytics, evaluation, and provider boundary | **Implemented with governed external boundary** | Privacy-filtered latency, zero-result, click, and reformulation signals; moderator relevance cases; ranking metrics; relational provider adapter; Search Quality workspace; and benchmark license gate. [1] [5] | No external lexical/semantic provider, imported benchmark corpus, or reported external benchmark score is configured. |
| PWA/offline experience | **Implemented with safe cache boundary** | Manifest, service worker, installation control, public shell/static cache, cache invalidation, production-only registration, and explicit offline fallback. [1] [9] | No background sync, offline write queue, or cache of live/protected data. |
| CI/CD and operations baseline | **Implemented with bounded operating maturity** | GitHub Actions verification gate and `OPERATIONS.md`. [1] [3] | No claim of distributed tracing, uptime alerts, automated production backups, or a load-test baseline. |
| Governed ingestion and ecosystem-integration foundations | **Implemented with inactive-provider boundary** | Review-only freshness callback, provenance scoring adapter, consent/configuration guard, and associated governance documents. [1] [3] | No external provider credential, connector, webhook, message transfer, or automatic data ingestion is active. |
| Graph scale architecture and asynchronous jobs | **Deferred by design** | Relational graph boundary isolates future providers. [2] | Held as `S-15`; no premature infrastructure commitment. |
| SSR | **Deferred by design** | Current SPA with injected metadata and fallback content is documented accurately. [2] [3] | Revisit only with crawler/performance evidence. |
| Open-source policy, governance, and identity posture | **Implemented** | MIT license, project policy, governance, contribution, and security documents. [8] | Auth-provider expansion remains a separate decision. |
| GitHub publication and privileged browser QA | **Delivered with environment-qualified QA** | Checkpoint/GitHub synchronization history, role-gated authorization coverage, and QA/release records. [3] | CAPTCHA/session-limited environments cannot replace independent authenticated visual moderation walkthrough or independent external repository/CI inspection. |

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
[9]: [Contributor model and value-experiment framework](./CONTRIBUTOR_MODEL.md)
