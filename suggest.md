# NorthStar Suggestion Register

This document is the **owner-controlled register** for NorthStar recommendations. On **13 August 2026**, the project owner approved every entry for phased implementation. Each item has therefore been mapped to the active **Comprehensive Enhancement Programme** in [`todo.md`](./todo.md), while this register retains the decision context and acceptance criteria.

> **Status convention:** “Approved — phased implementation” means the owner has authorized delivery, but an item must still be implemented, tested, documented, checkpointed, and synchronized before it can be represented as an existing platform capability.

## How to Use This Register

| Field | Meaning |
| --- | --- |
| **Priority** | The relative value or urgency if the owner elects to proceed. It does not authorize implementation. |
| **Status** | The implementation authorization and current delivery state. |
| **Decision required** | The specific product, governance, cost, or architecture choice required before planning. |
| **Acceptance signal** | Concrete evidence needed before an item can be considered complete. |

## Held Suggestions

| ID | Suggestion | Priority | Status | Decision required | Acceptance signal |
| --- | --- | --- | --- | --- | --- |
| S-01 | Add a dedicated moderator workspace for source verification, freshness reviews, and duplicate-resolution previews/confirmations. | High | Approved — phase 2 | Integrate into the existing Admin command center. | Moderators can safely review queues; only administrators can confirm aliases; loading/error/audit states are tested. |
| S-02 | Add authenticated contributor UI for submitting resource evidence sources, with clear pending-review expectations. | High | Approved — phase 2 | Place evidence contribution in the Node View trust context. | Contributors submit evidence; public pages show only approved sources; abuse and duplicate controls are verified. |
| S-03 | Show canonical-alias messaging and safe navigation when an old duplicate resource URL resolves to the canonical node. | High | Approved — phase 2 | Preserve canonical aliases as searchable redirects where appropriate. | Old URLs retain a clear redirect/alias explanation and no user data is lost. |
| S-04 | Evolve the duplicate alias foundation into a carefully reviewed record-migration workflow for relationships, collections, and bookmarks. | High | Approved — phase 2 | Use preview, collision controls, audit history, and rollback-safe outcomes. | Preview, idempotency, transaction safety, rollback, audit, and data-integrity tests are complete. |
| S-05 | Finish low-priority EN/AR content localization, excluding the footer, plus command-palette labels and locale-specific public metadata. | Medium | Approved — phase 3 | English remains the documentation/default public SEO language. | No agreed critical interface copy remains untranslated; RTL typography and metadata QA pass. |
| S-06 | Add a persisted light/dark theme preference and an accessible theme control. | Low | Approved — phase 3 | Provide light and dark modes within existing NorthStar branding. | Preference persists, contrast is verified, and reduced-motion/accessibility behavior remains intact. |
| S-07 | Expand collections with richer detail interactions, collection discovery, and contributor-activity signals. | Medium | Approved — phase 3 | Use only real, consented activity; do not fabricate reviews or social proof. | Real, consented activity is visible only where policy permits; no mock reviews/ratings are used. |
| S-08 | Provide a public, versioned, read-only REST API with OpenAPI documentation, stable identifiers, scopes, quotas, and consumer examples. | High | Approved — phase 4 | Begin with approved public read data and owner-managed access controls. | `/v1` read API, OpenAPI, authorization, observability, and contract tests are published. |
| S-09 | Add search-quality measurement: latency, zero-result rate, click-through, reformulation, and a judged relevance set. | High | Approved — phase 5 | Use privacy-safe event data and reports. | Baseline dashboard/report exists; quality thresholds guide subsequent provider decisions. |
| S-10 | Pilot a self-hostable lexical search provider, then semantic/vector retrieval, behind an adapter and relevance evaluation gate. | Medium | Approved — phase 5 | Start with provider abstraction and relational fallback before any external service. | Provider adapter, benchmark, fallback behavior, and verified separation from approved graph facts are complete. |
| S-11 | Add release automation and operations baseline: CI checks, migration/seed gates, dependency and secret scanning, backup/restore runbook, health metrics, traces, and alerts. | High | Approved — phase 9 | Use repository-native automation and documented managed-service boundaries. | CI and recovery drill pass; dashboards and incident runbook are available. |
| S-12 | Add PWA installability and offline-safe public browsing with explicit cache invalidation. | Medium | Approved — phase 6 | Cache approved public routes only. | Manifest, service worker, cache strategy, install tests, and EN/AR cache QA pass. |
| S-13 | Add governed external-source ingestion with licensing, terms, provenance, queueing, deduplication, freshness, and human review. | Medium | Approved — phase 7 | Begin with policy and adapter foundations; source-specific credentials require secure configuration. | Pilot source adapter meets legal, quality, and abuse-control acceptance criteria. |
| S-14 | Expand AI assistance from review drafts to controlled enrichment proposals for metadata, tags, duplicate candidates, and relationship candidates. | Medium | Approved — phase 8 | Preserve provenance, budget, and human review; never auto-publish. | Every proposal carries provenance/confidence/reviewer outcome and cannot auto-publish. |
| S-15 | Add graph-scale architecture only when workload evidence warrants it: provider adapter, caching, jobs, Redis, graph projection, or dedicated graph store. | Low | Approved — phase 8 | Build interfaces and measurement gates before selecting infrastructure. | Load tests demonstrate need; migration and rollback playbook is approved. |
| S-16 | Add ecosystem integrations such as browser extension, Telegram, WhatsApp, Discord, Slack, and advanced graph analytics. | Low | Approved — phase 10 | Deliver secure configuration surfaces; external credentials and account consent are still required per provider. | A scoped pilot demonstrates adoption and moderation value without widening data exposure. |
| S-17 | Add dedicated Trending, About, Settings, and Developer portal routes beyond the existing public, Profile, and Admin surfaces. | Medium | Approved — phase 3 | Create routes with live data or honest empty states. | Each route has a defined user job, accessible navigation, EN/AR copy, and live data or honest empty state. |
| S-18 | Complete privileged browser QA for moderator/admin workflows when a CAPTCHA-capable authenticated session is available. | High | Approved — phase 11 | Use a valid moderation session or alternate approved QA environment. | Moderator queues, source review, freshness, alias confirmation, audit history, and Arabic labels are visually verified. |
| S-19 | Verify authenticated GitHub publication and add a reproducible public release flow once repository authentication is available. | High | Approved — phase 12 | Use the configured `ma1amin/NorthStar` remote and confirm visibility. | Remote branch, release provenance, CI status, and repository artifacts are independently verified. |

## Decision Log

All items in this register are approved for phased implementation. Individual work remains subject to security, privacy, policy, testing, migration, and credential requirements; delivery status is tracked in [`todo.md`](./todo.md) and release evidence is recorded in `VERIFICATION.md`.

## Evidence Sources

The suggestions were consolidated from the current implementation audit, remaining-work roadmap, QA notes, and prior delivery recommendations. [1] [2] [3]

## References

[1]: [Documentation traceability matrix](./DOCUMENTATION_TRACEABILITY.md)  
[2]: [Remaining work roadmap](./REMAINING_WORK_ROADMAP.md)  
[3]: [Current QA and verification notes](./QA_NOTES.md)
