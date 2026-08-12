# NorthStar Remaining Work Roadmap

This roadmap converts the documentation traceability audit into **small, decision-ready work packages**. It does not re-open delivered discovery, graph, community, moderation, or base UI capabilities. It focuses only on capabilities that remain partial, deferred, unverified, or absent relative to the supplied documentation. For the detailed evidence matrix, read [DOCUMENTATION_TRACEABILITY.md](./DOCUMENTATION_TRACEABILITY.md).

## Recommended Sequence

| Release slice | Objective | Why it is sequenced here |
| --- | --- | --- |
| **R1 — Trust, policy, and bilingual completion** | Remove the highest-risk promise and quality gaps. | A knowledge platform must make its legal posture, content provenance, and public language experience trustworthy before expanding distribution. |
| **R2 — Data-quality operations** | Add source history, freshness, and duplicate-resolution workflows. | These improve the quality of existing nodes before automating intake or exposing them through an API. |
| **R3 — Open ecosystem foundation** | Add public API, quality analytics, and operational automation. | External consumers require stable data contracts, rate controls, observability, and release gates. |
| **R4 — Intelligence and scale experiments** | Validate semantic search, ingestion, PWA, and graph/provider infrastructure. | These need measured relevance, workload, and governance evidence rather than assumption-driven architecture. |

## R1 — Trust, Policy, and Bilingual Completion

### 1. Authoritative project policy resolution

Resolve the conflict between the archived “license TBD / All Rights Reserved / Made with InfoLogix” material and the active MIT repository. Confirm the official copyright notice, contributor license approach, attribution wording, governance authority, moderation appeal path, retention policy, and public authentication promise. The product copy must describe the actual identity flow rather than imply separate native Google, GitHub, email, or magic-link products that have not been independently delivered. [1] [2]

| Layer | Planned change | Acceptance criteria |
| --- | --- | --- |
| Governance and legal documentation | Update the authoritative README, license, governance, contribution, security, and data-handling documents after owner decisions. | No contradictory ownership, license, or authentication claims remain. |
| Product copy | Update onboarding, sign-in, and public policy links. | The user sees accurate identity and contribution expectations before authentication. |
| Release process | Add a release checklist that scans policy-sensitive files. | A release cannot pass without policy and license checks. |

### 2. Full critical-flow localization

Extend the existing EN/AR catalog through Home, Browse, Search, Resource Detail, Graph Explorer, Collections, Collection Detail, Submit, reports, moderation sub-workspaces, footer, toasts, errors, and dynamic labels. Preserve route/query state on switching locale, audit RTL spacing/punctuation, and add Arabic metadata/SEO conventions where public content needs localized discovery. [3]

| Layer | Planned change | Acceptance criteria |
| --- | --- | --- |
| Language catalog | Move all user-facing literals in critical flows into typed catalog keys. | No English-only critical-flow strings remain in Arabic mode. |
| Components and layouts | Audit semantic direction, icon mirroring, text overflow, number/date formatting, and focus order. | RTL browser QA passes on narrow mobile, tablet, and desktop. |
| Tests | Add locale-aware route/unit tests and browser critical-flow cases. | Discovery, contribution, Profile, and moderator-safe access states pass in both locales. |

## R2 — Data-Quality Operations

### 3. Resource sources, change history, and freshness

Add a first-class resource-source model rather than overloading JSON metadata. The model should store source URL, source type, capture time, attribution/licensing note, verification status, freshness state, and a user-visible history of accepted changes. Use an append-only audit/event approach for changes that need public accountability; avoid exposing private moderation or personal data. [4]

| Layer | Planned change | Acceptance criteria |
| --- | --- | --- |
| Schema | Add resource-source, resource-history, and freshness-review records with migrations and indexes. | Resources can have multiple attributed sources and a coherent public history. |
| Moderation | Add source verification and stale-data review states. | Moderators can verify, supersede, or retire evidence with an audit trail. |
| Resource Detail | Show approved provenance/history without exposing sensitive reports or internal notes. | Users can understand why a resource or relationship is trusted. |

### 4. Duplicate merge and redirect workflow

The current report path identifies suspected duplicates but does not merge canonical nodes. Add a moderator-confirmed merge workflow that chooses a canonical resource, migrates safe community relationships/collections/bookmarks, preserves a redirect/alias record, prevents destructive collisions, and records all decisions. [5]

> **Safety requirement:** design the merge as a previewable, idempotent, auditable transaction. It must never silently delete the losing node or its historical evidence.

### 5. Taxonomy and metadata expansion

Introduce resource types and optional, category-relevant structured metadata. Start with the documented core types—GitHub repositories, AI platforms, developer tools, cybersecurity tools, design resources, SaaS, accelerators, incubators, research platforms, learning resources, and open-source projects—without making every field mandatory for every node. Add organization/founder/country and cover-image support only with clear provenance and moderation rules. [6]

## R3 — Open Ecosystem Foundation

### 6. Stable public developer API

Create a separate, read-only versioned REST boundary for approved public discovery data; retain tRPC as the application-internal contract. Publish OpenAPI, stable identifiers, pagination/filter rules, relationship/evidence response semantics, error handling, consumer examples, and changelog policy. Introduce API keys only when external consumers and quotas justify them; do not expose private profiles, pending submissions, reports, or internal audit logs. [7]

| Design decision | Recommendation |
| --- | --- |
| Initial API scope | `/v1/resources`, `/v1/categories`, `/v1/tags`, `/v1/search`, `/v1/collections`, `/v1/graph` as approved-read surfaces only. |
| Authentication | Begin with anonymous low-volume reads plus an owner-managed key path for higher quotas; document revocation and abuse controls. |
| Data trust | Include verification state, relationship provenance, pagination, and freshness timestamps. Never imply unreviewed relationships are facts. |

### 7. Search quality measurement and provider boundary

Measure the current relational provider before replacing it: search latency, zero-result rate, click-through, reformulation, and a small judged relevance set. Then define a provider interface that preserves filters and clear separation between search recommendations and approved graph relationships. Only after baselines are acceptable should the project pilot Meilisearch or another self-hostable lexical provider, and later an embedding/vector workflow. [8]

### 8. Delivery and operations baseline

Add CI that runs `pnpm check`, tests, build, migration review, seed safety, dependency/secret scan, and documentation link checks. Define deployment configuration, environment ownership, backup/restore recovery drill, health endpoint, structured logs, traces/metrics, alert thresholds, and an incident runbook. Containerization should follow the chosen deployment model rather than becoming an untested artifact. [9]

## R4 — Intelligence and Scale Experiments

### 9. Responsible AI and external ingestion pilots

Expand from moderator-only review drafts to controlled enrichment proposals: metadata extraction, category/tag candidates, duplicate candidates, alternatives, and relationship candidates. Every proposal must retain model/version, input provenance, confidence, reviewer decision, and cost/privacy records; it must never publish automatically. Design external-source ingestion as a separate pilot with licensing/robots/terms review, source attribution, rate limits, queues, deduplication, and human review. [10]

### 10. PWA, graph scale, and integrations

Implement PWA installability only after defining safe public caching and invalidation. Delay dedicated graph stores, Redis, workers, real-time projections, browser extensions, and community bots until actual data volume, traversal latency, moderation capacity, and API adoption establish a measured need. The current relational graph remains the appropriate source of truth during this validation period. [11]

## Cross-Cutting Definition of Done

Every roadmap package must satisfy the project’s documented quality standard: a written requirement and UX decision, English/Arabic consideration, security review, tests for critical behaviour, accessible error and recovery states, relevant observability, and updated documentation. [12]

## First Implementation Slice Recommendation

Begin with **R1 and the first half of R2**: authoritative project policy resolution, full critical-flow localization, resource provenance/history model, and a safe duplicate merge design. This is the highest-value combination because it directly strengthens trust, data quality, and public usability without prematurely committing to external vendors, search infrastructure, or community integrations.

## References

[1]: [Uploaded decision log](file:///home/ubuntu/northstar-doc-audit/NorthStar-Project-Documentation/10-execution/DECISION_LOG.md)  
[2]: [Current repository license and release summary](./LICENSE)  
[3]: [Uploaded accessibility and i18n requirements](file:///home/ubuntu/northstar-doc-audit/NorthStar-Project-Documentation/04-ux/ACCESSIBILITY_AND_I18N.md)  
[4]: [Uploaded resource model](file:///home/ubuntu/northstar-doc-audit/NorthStar-Project-Documentation/11-knowledge/RESOURCE_MODEL.md)  
[5]: [Uploaded user stories](file:///home/ubuntu/northstar-doc-audit/NorthStar-Project-Documentation/01-product/USER_STORIES.md)  
[6]: [Uploaded product initiation source](file:///home/ubuntu/northstar-doc-audit/NorthStar-Project-Documentation/SOURCE-NorthStar-Project-Initiation-Prompt.md)  
[7]: [Uploaded API architecture](file:///home/ubuntu/northstar-doc-audit/NorthStar-Project-Documentation/03-architecture/API.md)  
[8]: [Uploaded search architecture](file:///home/ubuntu/northstar-doc-audit/NorthStar-Project-Documentation/03-architecture/SEARCH.md)  
[9]: [Uploaded deployment, observability, and testing strategy](file:///home/ubuntu/northstar-doc-audit/NorthStar-Project-Documentation/07-operations/OBSERVABILITY.md)  
[10]: [Uploaded AI governance](file:///home/ubuntu/northstar-doc-audit/NorthStar-Project-Documentation/08-ai/AI_GOVERNANCE.md)  
[11]: [Uploaded graph architecture](file:///home/ubuntu/northstar-doc-audit/NorthStar-Project-Documentation/03-architecture/GRAPH_ARCHITECTURE.md)  
[12]: [Uploaded definition of done](file:///home/ubuntu/northstar-doc-audit/NorthStar-Project-Documentation/10-execution/DEFINITION_OF_DONE.md)
