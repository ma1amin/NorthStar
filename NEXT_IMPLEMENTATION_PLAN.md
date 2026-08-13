# NorthStar: Repository Publication, Product-Gap Remediation, and Experience Redesign Plan

# Historical Plan Closure Notice

**Status:** This plan is **closed as a historical implementation record**. Its P0/P1/P2 programme was completed through the documented remediation and enhancement checkpoints, including relationship-taxonomy completion, graph exploration, moderation and contributor workflows, localization, public API/PWA/search/AI/provider boundaries, operations documentation, and GitHub synchronization. It must not be read as a live gap register.

The authoritative current state is [`CURRENT_IMPLEMENTATION_AUDIT.md`](./CURRENT_IMPLEMENTATION_AUDIT.md). The active owner-requested platform-visibility release is defined in [`NORTHSTAR_COMPLETION_PLAN.md`](./NORTHSTAR_COMPLETION_PLAN.md) and tracked in [`todo.md`](./todo.md). External-provider activation, billing/experiment enrolment, and privileged browser QA remain governed boundaries rather than unfinished implementation claims.

| Historical section | Closure outcome | Current evidence |
| --- | --- | --- |
| Phases 1–3 | Completed | Release documentation, migrations, tests, API/search/PWA/AI/graph-provider records, and contributor-programme evidence. |
| Phase 4 | Completed and refined in the current release | Atlas 2 design-system record, shared semantic themes, live directory preview, and graph-explorer workspace. |
| Phase 5 | Completed for prior releases; refreshed validation pending for the current owner-requested slice | Current browser-smoke notes, updated test suite, `VERIFICATION.md`, and the active tracker. |
| New work | Active | Rich sanitized fixtures, curated public directory expansion, practical graph testing, and final cross-route evidence are tracked in the current plan. |

---

## Original Historical Goal

Prepare NorthStar for an open-source GitHub release at `github.com/ma1amin/NorthStar` while closing the most consequential gaps against the supplied ORIG, relationship-intelligence, and initiation specifications. The work will also redesign the onboarding, profile, and moderation journeys into a coherent, accessible, mobile-first experience without changing the platform’s truthful architectural claims.

## Confirmed Decisions

| Decision | Chosen approach |
| --- | --- |
| GitHub target | Preserve and use the currently empty repository; commit and push NorthStar on its default branch after final verification. |
| Database in Git | Commit Drizzle schema, reviewed migrations, and a reproducible sanitized seed dataset only. Never commit TiDB/MySQL connection strings, live database dumps, OAuth cookies, API keys, user PII, audit history, or other production-like data. |
| Authentication language | Preserve Manus OAuth as the identity mechanism. The product UX will call this **“Create or continue your account”**, not promise a separate local registration system that does not exist. |
| Design reference | During execution, review the supplied Securify reference task for transferable visual principles only. NorthStar will retain its own resource-graph identity, palette, information architecture, copy, and components. |
| Publication | A final explicit confirmation will be requested immediately before the external GitHub push, after the commit summary and changed-file list are available. |

## Preliminary Specification-Gap Register

This register is based on the attached product specifications and the current implementation evidence. The execution phase will validate each item against code and live behaviour, then publish a traceable `SPECIFICATION_GAP_AUDIT.md` with the outcome: implemented, partially implemented, deliberately deferred, or newly implemented.

| Priority | Feature or requirement mentioned in the supplied files | Current finding | Planned disposition |
| --- | --- | --- | --- |
| P0 | **Maintained By**, **Funded By**, and **Used By** graph relationships | The live relationship enum currently implements seven types but not these three required types. | Add the types end-to-end: schema migration, validation, labels, filtering, moderation, Node View grouping, search handling, seed records, and tests. |
| P0 | Contributor-suggested resource edits and duplicate reports | Resource submission and generic reporting exist, but the specification calls out structured edit and duplicate contribution flows. | Add a human-reviewed edit-suggestion workflow and a clear duplicate-report path, reusing moderation audit and anti-duplication rules. |
| P0 | Open-source readiness | The current README is template-oriented rather than a project onboarding document. | Replace it with NorthStar documentation; add license, contribution, code-of-conduct, security, architecture, and seed/setup documentation. |
| P1 | Evidence-backed, high-quality relationships | Existing relationships do not yet expose first-class citations/provenance or a moderator evidence review surface. | Add optional evidence URL, rationale, and source-context metadata; require reviewable evidence for high-impact relationship types. |
| P1 | Visual Graph Explorer | Explicitly named as a future feature; no interactive graph exploration surface is present. | Deliver a bounded first release: accessible 1–2 hop graph explorer with deterministic layout, filters, detail drawer, and list fallback. Do not introduce a graph database yet. |
| P1 | Relationship API surface | The specifications name resource and graph exploration endpoints; the app currently exposes tRPC contracts rather than the documented public REST shape. | Document the tRPC API now and add narrowly scoped public REST-compatible read routes or an adapter only where needed for open-source/API consumers. |
| P1 | AI-assisted discovery | No verified AI workflow is present for category, tag, summary, duplicate, or relationship suggestions. | Add moderator-only, non-publishing suggestion drafts behind an explicit review queue; feature-flag it and document cost/privacy boundaries. |
| P1 | Semantic-search readiness | Fuzzy and relationship-aware search exist, but embeddings/vector retrieval are not implemented. | Introduce a search-provider interface and data model readiness; defer vector retrieval until a self-hostable provider and relevance evaluation corpus are chosen. |
| P1 | Graph-store portability | The current relational edge model is a useful starting point, but a graph-store adapter boundary is not explicit. | Add a graph-query service interface with MySQL/Drizzle implementation plus migration notes for Neo4j, ArangoDB, and Neptune. |
| P2 | Full SSR | The project correctly documents a client-rendered SPA with server-injected metadata and fallback content, not full SSR. | Preserve truthful claims; evaluate SSR migration separately only if crawl/render measurement justifies the complexity. |
| P2 | English and Arabic readiness | The supplied initiation specification calls for bilingual readiness; no i18n framework or RTL foundation is evidenced. | Add locale architecture, message catalog conventions, RTL-safe primitives, and ship the core shell/auth/profile strings in English and Arabic. |
| P2 | Rate limiting and API protection | Required in the project instructions but not yet verified in the current record. | Audit the gateway controls; add application-level, route-sensitive rate limits for unauthenticated search, submissions, reports, and AI drafts if absent. |

## Execution Plan

### Phase 1 — Baseline, Repository Safety, and Gap Audit

1. Inspect the Git history, remote configuration, default branch, ignored files, migration history, database schema, route inventory, tRPC procedures, and current test coverage. Check that the GitHub repository is empty before adding a remote.
2. Retrieve and review the attached Securify task reference for visual patterns. Record only transferable observations such as hierarchy, color depth, movement, surfaces, and feedback mechanics; do not reproduce its brand, content, or layout.
3. Produce `SPECIFICATION_GAP_AUDIT.md`, mapping every requirement from the four supplied documents to source evidence and one of four dispositions: implemented, partial, deferred with rationale, or in-scope remediation.
4. Replace template-era project metadata with safe open-source release foundations: a project README, `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `ARCHITECTURE.md`, `.env.example`, and explicit data/seed documentation. Update `.gitignore` and scan tracked files for secrets, user data, and generated artifacts.
5. Create a deterministic, sanitized seed strategy representing only public-style sample resources, categories, tags, relationships, and moderator-safe sample states. The script must be idempotent and must not query, export, or modify the live database.

### Phase 2 — Relationship Intelligence Completion

1. Extend the relationship schema and all relevant Zod contracts with **Maintained By**, **Funded By**, and **Used By**. Generate a non-destructive migration, review it, and apply it only to the project database.
2. Model relationship provenance with optional evidence URL, rationale, verification state, and source metadata. Define validation rules so low-confidence or high-risk relationship claims remain pending until moderator approval.
3. Update Resource Detail, Browse, Search, contribution, and moderation experiences so all ten relationship types are discoverable, accurately labelled, filterable, and auditable. Maintain the existing exact five Node View tabs by mapping the additional organization/adoption relationships into the **Ecosystem** tab rather than expanding the required tabs.
4. Add user-facing edit suggestions and duplicate-report flows. Route all changes through the current human-in-the-loop moderation system, de-duplicate open reports, and record audit/reputation outcomes only after review.
5. Extract a graph-query abstraction over the existing Drizzle/MySQL model. Add architectural guidance for future Neo4j, ArangoDB, and Neptune adapters without prematurely introducing infrastructure lock-in.
6. Add an accessible, bounded visual Graph Explorer: focus on a selected node, 1–2 hops, type filters, keyboard focus, relationship details, and a list/table fallback for reduced-motion, small screens, and assistive technologies.

### Phase 3 — Search and AI-Assisted Quality Controls

1. Formalize a search-provider interface around the current database-backed fuzzy and relationship-aware search. Preserve latency monitoring, explicit filter semantics, and future vector-search compatibility.
2. Add a moderator-only AI suggestion workflow for summaries, categories, tags, duplicate candidates, and relationships. Drafts will contain a confidence explanation and provenance, will never publish automatically, and will be accessible only through a review queue.
3. If gateway protection is not already sufficient, add tested application-level rate limits for public search, submissions, reports, and AI draft generation, with useful recovery messages and audit-safe observability.
4. Add relevance and safety tests for new relationship types, evidence validation, report/edit workflows, graph traversal, and non-publishing AI suggestions.

### Phase 4 — NorthStar Design System and Experience Redesign

1. Establish a documented **NorthStar Atlas** visual language derived from the final reference review: a restrained deep-space/aurora graph palette, layered translucent surfaces, network-line accents, clear elevation, purposeful gradients, and motion limited to transform/opacity under 300 ms. All new motion will honor `prefers-reduced-motion`.
2. Refresh the public shell, Home, Browse, Search, Node View, Collections, and Submit page hierarchy without diluting discovery. Prioritize command-style exploration, visible graph context, readable filter state, responsive density, and truthful empty/loading/error states.
3. Rebuild onboarding around the existing OAuth boundary: sign-in intent preservation, an explicit value preview before authentication, return-to-task after OAuth, optional first-session profile completion, category-interest selection, contextual guidance, and no forced profile form. Include cancellation, loading, and recovery states.
4. Rework the profile into a durable personal knowledge workspace: profile completeness that can be dismissed, contribution and reputation explanations, collections/bookmarks/contribution tabs, edit preview, privacy-aware sharing controls, and empty-state pathways that lead back to discovery.
5. Consolidate the scattered admin routes into a role-aware **Moderation Command Center** with persistent internal navigation, queue counts, safe bulk-action boundaries, audit history, report triage, resource editing, and user management. Keep moderator versus administrator authority unmistakable and every destructive action confirmable, attributable, and reversible where the data model permits.
6. Add English/Arabic localization foundations and RTL-safe layout decisions for the revised core shell, onboarding, profile, and admin areas. Complete translation breadth only for the flows changed in this release, with a catalog process for the remaining product surfaces.

### Phase 5 — Verification, Documentation, and GitHub Publication

1. Add and run unit, router-level integration, and end-to-end coverage. Core end-to-end scenarios will include public discovery, relationship exploration, OAuth return intent (mocked where necessary), profile completion/skipping, resource/relationship/edit/duplicate contribution, moderator triage, admin role protection, and graph explorer keyboard fallback.
2. Perform desktop, tablet, narrow-mobile, dark/light, keyboard-only, and reduced-motion QA. Validate SEO document output, JSON-LD, canonical metadata, accessibility landmarks, contrast, error states, and the public no-login path.
3. Run `pnpm check`, `pnpm test`, production build, migration validation, seed idempotence validation, and a repository secret/license scan. Record results and unresolved limitations in the release documentation.
4. Create focused commits with a final release note. Reconfirm the file manifest contains source, docs, schema, migrations, and seed data only—no live database data, secrets, environment files, or generated deployment artifacts.
5. Request final confirmation, add `https://github.com/ma1amin/NorthStar` as `origin`, push the default branch, and verify the remote repository contains the expected commit, documentation, migrations, and sanitized seed assets.

## Acceptance Criteria

| Area | Completion evidence |
| --- | --- |
| Specification review | `SPECIFICATION_GAP_AUDIT.md` maps all supplied-file requirements to evidence and disposition. |
| Graph completeness | All ten specified relationship types work in schema, API, search, contribution, moderation, Node View, and tests. |
| Human oversight | Resource edits, duplicate reports, relationship evidence, and AI drafts remain reviewable and never auto-publish. |
| Experience quality | Onboarding preserves user intent; profile and admin experiences have responsive loading, empty, error, permission, confirmation, and success states. |
| Accessibility | Keyboard navigation, visible focus, semantic landmarks, sensible mobile layouts, contrast, and reduced-motion behavior pass documented QA. |
| Open source | Repository documentation, license, contribution governance, architecture guidance, schema/migrations, and sanitized seed instructions are present and no secrets/live data are committed. |
| Verification | TypeScript, full test suite, production build, migration/seed checks, and focused browser QA pass; known deferred items are documented. |
| GitHub delivery | The empty repository receives the verified default-branch commit after a final push confirmation. |

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Incorrect graph claims degrade trust | Require structured evidence and human moderation; show verification state rather than inventing certainty. |
| OAuth cannot support an independent registration flow | Use wording and UX that match the existing OAuth system; preserve return intent and avoid a fake local-account UI. |
| UI polish harms performance or accessibility | Use CSS/tokens before heavy imagery, motion only on compositor-friendly properties, and verify reduced motion and contrast. |
| Scope expansion delays GitHub release | Maintain P0/P1/P2 sequencing; publish documented deferrals rather than silently claiming them complete. |
| Repository exposes sensitive data | Use allowlisted release files, environment templates only, secret scanning, and sanitized seed generation. |
| Remote push modifies an external service | Inspect the empty remote, show a final manifest/commit, and request confirmation immediately before push. |

## Assumptions

The GitHub repository is empty as stated, the provided OAuth integration remains the intended authentication method, and initial multilingual work should establish English/Arabic readiness rather than translate every historical page. The Graph Explorer will be a deliberately bounded relational-graph visualization; migrating to a dedicated graph database remains a future operational decision based on real scale and query complexity.
