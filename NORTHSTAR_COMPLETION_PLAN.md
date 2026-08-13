# NorthStar Completion Plan

## Goal

Make NorthStar feel and operate as a polished, graph-first resource-intelligence platform rather than a sparse demonstration. The work will improve the public and authenticated user experience, establish dependable light and dark themes, add a realistic sanitized directory and relationship graph for testing, reconcile stale planning documents, and close all approved documented work with evidence-led implementation, testing, checkpoints, and GitHub synchronization.

## Current Audit Conclusion

The inherited `NEXT_IMPLEMENTATION_PLAN.md` is substantially historical. Its cited gaps—such as the ten relationship types, Graph Explorer, EN/AR foundations, AI proposal boundaries, public API, PWA, moderation workspace, and repository release—have later implementation evidence. It must be replaced by a current, source-linked plan rather than treated as an active backlog.

The current product gap is primarily experiential and demonstrative. The public directory’s sanitized seed has only three categories, three resources, and no relationship-rich sample graph, which prevents practical testing of discovery, relationship filtering, Node Views, and Graph Explorer. The existing visual system has light/dark support, but this release will audit its consistency across public, account, contributor, and moderator routes and rebuild the most important surfaces as a unified graph-native experience.

## Delivery Principles

| Principle | Delivery rule |
| --- | --- |
| Public knowledge remains open | No paid, verified, or organization status can hide, degrade, or paywall approved public resources, relationships, or public collections. |
| Human moderation remains final authority | New resources, evidence, relationships, contributor claims, and AI drafts remain proposals until a human decision. |
| Test data is safe and truthful | Only deterministic fictional or clearly labelled public-style seed data will be added. No live database export, user data, fabricated reviews, ratings, or community signals will be used. |
| Design is functional | Visual polish must make resource discovery, relationship context, and contribution state easier to understand—not merely decorate the interface. |
| Accessibility and performance are release criteria | Keyboard access, RTL, reduced motion, contrast, responsive layouts, and lightweight graph rendering are verified with every public-surface change. |

## Phase 1 — Reconcile Plans, Evidence, and the Actual Product Surface

First, create an evidence-led `CURRENT_IMPLEMENTATION_AUDIT.md` that maps the current code, migrations, routes, automated coverage, and browser QA against `NEXT_IMPLEMENTATION_PLAN.md`, `todo.md`, `suggest.md`, `VERIFICATION.md`, `SPECIFICATION_GAP_AUDIT.md`, and the remaining project documentation. Every item will be classified as **implemented**, **partial**, **intentionally inactive**, **blocked by owner/provider configuration**, or **requires implementation**.

`NEXT_IMPLEMENTATION_PLAN.md` will then be superseded by a current plan that links to the audit and avoids repeating retired claims. Historical documents will be retained, clearly labelled, and never silently rewritten to fabricate a new history. The tracker and traceability matrix will become the single source of active completion status.

**Acceptance criteria:** There is no unresolved unchecked task hidden in the documentation, and every remaining item has a defined owner decision, technical dependency, safety boundary, and testable acceptance signal.

## Phase 2 — Design System, Light/Dark Theme, and Navigation Repair

Establish a documented **NorthStar Atlas 2** design specification with an original relationship-graph identity: calm light surfaces, a deep navy/aurora dark mode, graph-line accents, consistent elevation, readable data density, and a clear action hierarchy. The design will remain code-first; no decorative image generation is necessary unless a later visual asset requirement is explicitly identified.

The global token system and all semantic component surfaces will be audited for contrast and text/background mismatches in both themes. The public shell, mobile navigation, command palette, account menu, contributor actions, settings, and responsive footer treatment will be made visually coherent. A new theme-preview matrix will verify Home, Browse, Search, Graph, Node View, Collections, Capture, Profile, and Moderation in both light and dark modes, English and Arabic where the flow is localized.

**Acceptance criteria:** Theme choice persists, all route shells use semantic theme tokens rather than hard-coded light colors, key views remain legible at narrow and desktop widths, and reduced-motion mode disables non-essential visual effects.

## Phase 3 — Graph-First Discovery and Realistic Sanitized Directory Data

Replace the minimal development seed with a versioned, idempotent sanitized directory fixture. It will include a coherent taxonomy with multiple top-level categories and subcategories, a diverse set of fictional or clearly labelled public-style resources, tags, approved sources, collections, and an intentionally dense but meaningful relationship network spanning all ten exact relationship types: Alternative To, Similar To, Integrates With, Built By, Maintained By, Funded By, Used By, Depends On, Part Of, and Competitor Of.

The seed will represent multiple discovery paths—for example development tooling, design/collaboration, data/AI, knowledge/research, and learning/productivity—and will create cross-category integrations as well as alternatives and ecosystem links. It will be deterministic, contain no external user data, and support repeatable Browse, Search, Node View, public collection, API, and Graph Explorer tests.

The Graph Explorer will then be upgraded from a shallow pseudo-map into an interactive, bounded graph canvas with relationship-type filtering, selected-node context, legend, focused-neighborhood depth controls within a safe cap, linkable state, and a semantic list/table fallback. It will preserve keyboard navigation, RTL considerations, small-screen usability, and no-motion operation rather than pursuing an unbounded simulation.

**Acceptance criteria:** A clean development database can be seeded twice without duplicate records; each of the ten relationship types appears in verified graph fixtures; Browse/Search/Node View/Graph show meaningful linked results; graph filtering and fallback behavior are covered by automated tests and browser QA.

## Phase 4 — Complete Public, Contributor, and Moderator Journeys

Rework the homepage from a marketing-first landing page into a usable discovery launchpad with live featured taxonomy, relationship-led entry points, graph preview tied to seed data, a clear contribution invitation, and truthful state messaging. Improve Browse/Search/Node View information density, collection curation affordances, and empty/loading/error states so users can understand the platform within minutes.

For registered contributors, refine onboarding, Profile, Capture, verification, and appeals into a coherent guided journey with a visible next action, intake allowance feedback, moderation-state clarity, and helpful return paths. For moderators and administrators, consolidate contributor review alongside existing data-quality queues into a discoverable, role-aware command center with safe actions, sampling explanation, audit context, and no authority ambiguity.

All altered user-facing copy will be added to the EN/AR catalog, rendered RTL-safe, and intentionally leave the footer untranslated as requested. No community metrics or reviews will be invented; all displayed activity will be real seeded or live data and clearly designated where it is sample data.

**Acceptance criteria:** A new visitor can discover resources and relationships without authentication; a contributor can understand capture-to-review-to-verification; a moderator can understand queue status and limits; each journey has responsive loading, empty, error, permission, success, and recovery states.

## Phase 5 — Implement All Remaining Approved Documentation Work

Use the Phase 1 audit to implement, in explicit dependency order, every still-unimplemented approved requirement in project documentation. Work will be separated into small release slices so each includes its own schema/migration review where needed, tRPC/database/UI changes, unit and integration coverage, documentation evidence, visual QA, checkpoint, and GitHub synchronization.

Items needing external provider credentials, production access, CAPTCHA-capable moderation sessions, billing authorization, or separate owner decisions will not be claimed complete. They will receive a precise inactive boundary, setup requirement, and verification plan. This includes ecosystem messaging integrations such as WhatsApp: the product may expose consent-first configuration foundations, but no transfer, message ingestion, or provider activation occurs without supplied credentials and explicit user approval.

**Acceptance criteria:** The evidence matrix has no false-complete statements; every approved feature is either validated as delivered or carries a documented external block with its exact activation conditions.

## Phase 6 — Verification, Release Evidence, and Synchronization

Each release slice will run `git diff --check`, TypeScript validation, targeted and full Vitest suites, and relevant migration/seed checks. Browser QA will cover desktop, mobile, keyboard, reduced motion, light/dark, EN/AR/RTL, public discovery, graph interaction, contributor capture, profile verification, and moderator queues where access is available.

The final release will update `todo.md`, `VERIFICATION.md`, `DOCUMENTATION_TRACEABILITY.md`, the current implementation audit, testing notes, and release documentation. Every validated slice will be saved as a checkpoint and pushed to `ma1amin/NorthStar` `main` after validation. The final handoff will distinguish verified behavior from environment-limited items such as privileged CAPTCHA-bound browser walkthroughs.

## Risks and Controls

| Risk | Control |
| --- | --- |
| A richer seed is mistaken for live community evidence | Use a `sanitized` fixture namespace, neutral sample labels, and documentation stating it is deterministic development data. |
| Visual changes break dark-mode legibility | Enforce semantic token usage and capture a route-by-theme QA matrix before release. |
| Graph rendering harms mobile performance | Use bounded neighborhood queries, node/edge caps, progressive detail, and an accessible non-canvas fallback. |
| “All documentation” creates unbounded or contradictory scope | Use the audit as a signed-off source of truth; retain historical plans but only execute active, approved, non-conflicting requirements. |
| Provider-dependent integrations are prematurely activated | Keep credentials, consent, scopes, and destination selection mandatory, with no external calls before owner-authorized configuration. |

## Sequencing and Checkpoints

1. Audit and reconcile active versus historical documentation.
2. Establish and validate the Atlas 2 visual system and theme matrix.
3. Deliver the rich sanitized taxonomy, directory, relationship fixtures, and graph explorer upgrade.
4. Polish complete public, contributor, and moderation journeys around the richer graph.
5. Close remaining audited requirements in scoped, testable slices.
6. Run final release verification, document real limitations, checkpoint, and synchronize the verified main branch.

## Assumptions

This plan assumes the owner’s instruction to implement all documented enhancements supersedes the earlier staged completion wording, while retaining the platform’s non-negotiable safeguards: open public knowledge, no fabricated social proof, human moderation, consent-first external integrations, and accurate documentation. Where a document conflicts with newer verified implementation, the newer code and verification evidence take precedence and the older document is retained as historical context.
