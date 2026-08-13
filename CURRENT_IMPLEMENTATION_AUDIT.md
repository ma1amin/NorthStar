# NorthStar Current Implementation Audit

**Audit date:** 13 August 2026  
**Status convention:** **Implemented** means present code plus automated, migration, or recorded browser evidence. **Active remediation** means the owner has requested implementation in the current release. **Inactive boundary** means that activation requires credentials, consent, owner approval, an authenticated external environment, or a deliberately deferred infrastructure decision.

## Executive Conclusion

NorthStar already contains the principal resource-intelligence foundations: public discovery, fuzzy and relationship-aware search, all ten relationship types, bounded graph querying, collection curation, moderation, EN/AR and RTL foundations, theme preference, PWA safety controls, public read API, contributor intake, verified-contributor workflows, and source/audit/freshness safeguards. The dominant current gap is **product legibility**, not absence of the original architecture.

The platform presently feels smaller than its capabilities because the sanitized seed offers only three resources and no relationship fixtures, while the Graph Explorer shows a shallow decorative neighborhood. The owner-requested release therefore prioritizes visual cohesion, theme reliability, directory density, relationship-rich fixtures, graph interaction, and current-document reconciliation before introducing new architecture or external-provider activation.

## Historical Plan Reconciliation

`NEXT_IMPLEMENTATION_PLAN.md` was correct at the time it was written but is now primarily historical. Its stated missing relationship types, Graph Explorer, open-source documentation/repository publication, localization, public API, AI proposal boundary, search-provider interface, and graph-provider boundary have later evidence. It is retained as a record and superseded for current delivery by [`NORTHSTAR_COMPLETION_PLAN.md`](./NORTHSTAR_COMPLETION_PLAN.md) and the active tracker in [`todo.md`](./todo.md).

| Historical requirement | Current disposition | Evidence and current boundary |
| --- | --- | --- |
| All ten relationship types | **Implemented** | Schema and Node View include Alternative To, Similar To, Integrates With, Built By, Maintained By, Funded By, Used By, Depends On, Part Of, and Competitor Of. The new seed must exercise all ten. |
| Edit suggestions, duplicate reports, provenance, and moderation | **Implemented** | Protected contribution and moderation contracts, audits, source context, duplicate alias safeguards, and integration coverage exist. |
| Graph Explorer | **Implemented, active remediation** | A bounded graph route and accessible edge list exist. Its pseudo-map lacks sufficient density, filtering, and mobile-first interaction for the owner’s current expectation. |
| Search, API, PWA, AI, graph portability, and operations foundations | **Implemented with explicit boundaries** | These have provider, privacy, caching, human-review, and operational documentation. No external provider or automated publication is claimed active. |
| EN/AR, RTL, and persisted light/dark mode | **Implemented, active remediation** | Locale and theme contexts are present. Theme and route consistency now require a cross-surface visual audit. The footer remains intentionally English. |
| GitHub open-source release | **Implemented** | The approved repository is synchronized through the current release history. No live database dump, user data, secrets, or OAuth material is committed. |

## Active Owner-Requested Remediation

| Workstream | Status | Why it is active now | Completion evidence |
| --- | --- | --- | --- |
| Atlas 2 visual system and dark/light repair | **Active remediation** | Current components use a mix of fixed light colors and theme tokens, reducing the coherence and legibility of dark mode across routes. | Semantic token audit, route-by-theme screenshots, keyboard/reduced-motion/RTL checks, and focused tests where behavior changes. |
| Sanitized category/resource/relationship graph fixture | **Active remediation** | The current `scripts/seed-sanitized.mjs` has three categories, three resources, five tags, and no graph edges. This prevents meaningful discovery and graph testing. | Idempotent seed run, database fixture validation, and visible results for all ten relationship types. |
| Graph Explorer and discovery experience | **Active remediation** | Current graph visualization is intentionally shallow (`maxEdges: 40`, 12 visible nodes) and has no type controls or depth-oriented interaction. | Filterable bounded neighborhood, semantic fallback, mobile/keyboard QA, and route tests. |
| Public, contributor, profile, and moderation journey coherence | **Active remediation** | Important flows exist but need a more unified next-action model, data-rich examples, and consistent visual hierarchy. | Browser QA with public and authenticated states; localized copy and recovery states. |
| Documentation truth and feature closure | **Active remediation** | `suggest.md` status labels and prior audits do not consistently reflect later implementation; no unchecked historical checklist remains, but external activation conditions require clear recording. | Current audit, reconciled plan/register/evidence, and no false-complete statements. |

## Suggestion Register Reconciliation

All entries in [`suggest.md`](./suggest.md) were owner-approved and mapped to the historical enhancement programme. Most foundation work is delivered. Their table-level labels remain historical release-phase markers, not current completion status.

| Suggestion range | Current audit result |
| --- | --- |
| S-01 to S-08 | Implemented foundations: data-quality moderation, contributor evidence/aliases, EN/AR/theme/collections/routes, and versioned read API. The current release improves their experience and sample-data demonstrability. |
| S-09 to S-15 | Implemented guarded foundations: search-quality measurement/provider boundary, PWA, governed ingestion, AI proposal validation, and graph-provider boundary. External provider activation, benchmark imports, or scale infrastructure remain inactive until an owner-approved operational decision. |
| S-16 | Consent-first integration foundation is implemented; no browser extension, WhatsApp, Telegram, Discord, Slack, connector, webhook, credential, message transfer, or user consent flow is activated without provider-specific configuration. |
| S-17 | Implemented: Trending, About, Settings, and Developer routes exist; current experience work improves their visual coherence. |
| S-18 | Browser walkthrough evidence has limits where CAPTCHA/session state is unavailable. Role-gated automated coverage is current; any privileged visual gap remains explicitly recorded. |
| S-19 | Implemented: configured GitHub `main` has been synchronized. Repository visibility, CI status, and independent external viewer checks remain environment-dependent verification rather than a claim inferred from local tooling. |

## Required External or Owner Decisions

| Area | What is not active | Exact prerequisite |
| --- | --- | --- |
| Messaging and ecosystem integrations | No WhatsApp, Telegram, Discord, Slack, browser-extension, or webhook data transfer. | Provider credentials, specific scope/destination, legal/policy confirmation, explicit user consent, secure configuration, end-to-end testing, and owner approval. |
| Professional value experiments | No billing, cohort, organization claim, or enhanced API entitlement. | A separate owner-approved experiment brief meeting the requirements in [`VALUE_EXPERIMENTS.md`](./VALUE_EXPERIMENTS.md). |
| External search, vector retrieval, or graph store | No external provider, benchmark corpus, or production graph projection. | A self-hostable/provider decision, privacy/cost review, relevance evaluation corpus, and workload evidence. |
| Privileged browser moderation walkthrough | Sandbox authentication can be CAPTCHA/session limited. | A valid approved moderation session or alternate QA environment; the existing router-level authorization coverage remains the current evidence. |

## Active Source of Truth

The active delivery order and acceptance rules are in [`NORTHSTAR_COMPLETION_PLAN.md`](./NORTHSTAR_COMPLETION_PLAN.md) and the unchecked work items in [`todo.md`](./todo.md). Historical plans remain evidence records. Future product ideas must be added to the owner-controlled suggestion register and must not be represented as delivered until implementation, testing, documentation, checkpoint, and GitHub synchronization are complete.

## References

[1]: [NorthStar completion plan](./NORTHSTAR_COMPLETION_PLAN.md)

[2]: [Historical next implementation plan](./NEXT_IMPLEMENTATION_PLAN.md)

[3]: [Suggestion register](./suggest.md)

[4]: [Verification record](./VERIFICATION.md)

[5]: [Contributor and value-experiment policy](./CONTRIBUTOR_MODEL.md)
