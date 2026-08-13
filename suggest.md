# NorthStar Suggestion Register

This document is the **owner-controlled holding register** for recommendations that are not currently approved for implementation. An entry remains here until the project owner explicitly asks to implement it. Only then should it be copied into the active portion of [`todo.md`](./todo.md) with a scoped acceptance criterion.

> **Status convention:** “Held — owner decision required” means the idea is documented, not scheduled. It must not be represented as an existing platform capability or silently added to a development sprint.

## How to Use This Register

| Field | Meaning |
| --- | --- |
| **Priority** | The relative value or urgency if the owner elects to proceed. It does not authorize implementation. |
| **Status** | All items remain held until the owner decides otherwise. |
| **Decision required** | The specific product, governance, cost, or architecture choice required before planning. |
| **Acceptance signal** | Concrete evidence needed before an item can be considered complete. |

## Held Suggestions

| ID | Suggestion | Priority | Status | Decision required | Acceptance signal |
| --- | --- | --- | --- | --- | --- |
| S-01 | Add a dedicated moderator workspace for source verification, freshness reviews, and duplicate-resolution previews/confirmations. | High | Held — owner decision required | Confirm whether this belongs in the existing Admin command center or a separate data-quality workspace. | Moderators can safely review queues; only administrators can confirm aliases; loading/error/audit states are tested. |
| S-02 | Add authenticated contributor UI for submitting resource evidence sources, with clear pending-review expectations. | High | Held — owner decision required | Confirm where source contribution should appear: Node View, profile, or submission flow. | Contributors submit evidence; public pages show only approved sources; abuse and duplicate controls are verified. |
| S-03 | Show canonical-alias messaging and safe navigation when an old duplicate resource URL resolves to the canonical node. | High | Held — owner decision required | Confirm public language and whether aliases should remain searchable. | Old URLs retain a clear redirect/alias explanation and no user data is lost. |
| S-04 | Evolve the duplicate alias foundation into a carefully reviewed record-migration workflow for relationships, collections, and bookmarks. | High | Held — owner decision required | Approve collision rules, rollback policy, public-history wording, and a data-migration review. | Preview, idempotency, transaction safety, rollback, audit, and data-integrity tests are complete. |
| S-05 | Finish low-priority EN/AR content localization, including footer utility copy, command-palette labels, documentation strategy, and locale-specific public metadata. | Medium | Held — owner decision required | Decide whether documentation itself should be bilingual and whether English remains the default public SEO language. | No agreed critical interface copy remains untranslated; RTL typography and metadata QA pass. |
| S-06 | Add a persisted light/dark theme preference and an accessible theme control. | Low | Held — owner decision required | Confirm the desired visual modes and branding requirements. | Preference persists, contrast is verified, and reduced-motion/accessibility behavior remains intact. |
| S-07 | Expand collections with richer detail interactions, collection discovery, and contributor-activity signals. | Medium | Held — owner decision required | Define privacy posture and avoid fabricated social proof or reviews. | Real, consented activity is visible only where policy permits; no mock reviews/ratings are used. |
| S-08 | Provide a public, versioned, read-only REST API with OpenAPI documentation, stable identifiers, scopes, quotas, and consumer examples. | High | Held — owner decision required | Approve public data scope, key lifecycle, rate limits, and support/maintenance ownership. | `/v1` read API, OpenAPI, authorization, observability, and contract tests are published. |
| S-09 | Add search-quality measurement: latency, zero-result rate, click-through, reformulation, and a judged relevance set. | High | Held — owner decision required | Confirm privacy-safe event policy and reporting cadence. | Baseline dashboard/report exists; quality thresholds guide subsequent provider decisions. |
| S-10 | Pilot a self-hostable lexical search provider, then semantic/vector retrieval, behind an adapter and relevance evaluation gate. | Medium | Held — owner decision required | Approve infrastructure cost, provider, model, retention, and safety boundary. | Provider adapter, benchmark, fallback behavior, and verified separation from approved graph facts are complete. |
| S-11 | Add release automation and operations baseline: CI checks, migration/seed gates, dependency and secret scanning, backup/restore runbook, health metrics, traces, and alerts. | High | Held — owner decision required | Select deployment environment, monitoring stack, alert owner, and recovery objective. | CI and recovery drill pass; dashboards and incident runbook are available. |
| S-12 | Add PWA installability and offline-safe public browsing with explicit cache invalidation. | Medium | Held — owner decision required | Define offline route/data scope and mobile support policy. | Manifest, service worker, cache strategy, install tests, and EN/AR cache QA pass. |
| S-13 | Add governed external-source ingestion with licensing, terms, provenance, queueing, deduplication, freshness, and human review. | Medium | Held — owner decision required | Approve source list, licensing policy, data handling, and moderation capacity. | Pilot source adapter meets legal, quality, and abuse-control acceptance criteria. |
| S-14 | Expand AI assistance from review drafts to controlled enrichment proposals for metadata, tags, duplicate candidates, and relationship candidates. | Medium | Held — owner decision required | Approve model, cost budget, retention, and human-review controls. | Every proposal carries provenance/confidence/reviewer outcome and cannot auto-publish. |
| S-15 | Add graph-scale architecture only when workload evidence warrants it: provider adapter, caching, jobs, Redis, graph projection, or dedicated graph store. | Low | Held — owner decision required | Establish measurable scale/latency threshold and preferred provider. | Load tests demonstrate need; migration and rollback playbook is approved. |
| S-16 | Add ecosystem integrations such as browser extension, Telegram, WhatsApp, Discord, Slack, and advanced graph analytics. | Low | Held — owner decision required | Select a single user problem and apply security/privacy review per integration. | A scoped pilot demonstrates adoption and moderation value without widening data exposure. |
| S-17 | Add dedicated Trending, About, Settings, and Developer portal routes beyond the existing public, Profile, and Admin surfaces. | Medium | Held — owner decision required | Prioritize which route improves discovery or operational usability first. | Each route has a defined user job, accessible navigation, EN/AR copy, and live data or honest empty state. |
| S-18 | Complete privileged browser QA for moderator/admin workflows when a CAPTCHA-capable authenticated session is available. | High | Held — owner decision required | Provide a valid moderation session or alternative approved QA environment. | Moderator queues, source review, freshness, alias confirmation, audit history, and Arabic labels are visually verified. |
| S-19 | Verify authenticated GitHub publication and add a reproducible public release flow once repository authentication is available. | High | Held — owner decision required | Provide/enable the approved GitHub authentication route and confirm intended visibility. | Remote branch, release provenance, CI status, and repository artifacts are independently verified. |

## Decision Log

No item in this register is approved for implementation at the time of writing. The next implementation request should identify one or more IDs above; the resulting scoped task will be added to `todo.md` before code or documentation is changed.

## Evidence Sources

The suggestions were consolidated from the current implementation audit, remaining-work roadmap, QA notes, and prior delivery recommendations. [1] [2] [3]

## References

[1]: [Documentation traceability matrix](./DOCUMENTATION_TRACEABILITY.md)  
[2]: [Remaining work roadmap](./REMAINING_WORK_ROADMAP.md)  
[3]: [Current QA and verification notes](./QA_NOTES.md)
