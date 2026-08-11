# NorthStar Specification Gap Audit

## Scope and Method

This audit compares the supplied `PROJECTINSTRUCTIONS.md`, `NorthStar-ProjectInitiationPrompt.md`, `NORTHSTAR.md`, and `ResourceRelationshipIntelligenceLayer.md` with the current NorthStar schema, implementation records, page inventory, and current verification evidence. A status of **not implemented** means no corresponding verified implementation was found. **Partial** means a capability exists but does not meet the stated specification in full. This document deliberately does not equate plans, placeholders, or earlier completion claims with delivered functionality.

## Verified Foundations Already Present

NorthStar already provides public browsing, category/tag/pricing filtering, typo-tolerant and relationship-aware search, resources as relational graph nodes, seven relationship types, Node View relationship tabs, resource submissions with duplicate feedback, profile/collections/bookmarks/voting/reputation, resource reporting, relationship/submission moderation, audit history, administrator user management, bounded bulk rejection, responsive UI, route metadata, JSON-LD, and a client-rendered SPA shell with server-injected public metadata and fallback content.

## Missing or Partial Requirements

| Area | Requirement stated in supplied specifications | Status | Evidence and remediation scope |
| --- | --- | --- |
| Relationship taxonomy | **Maintained By**, **Funded By**, and **Used By** | **Not implemented** | The relationship enum currently contains only Alternative To, Similar To, Integrates With, Built By, Depends On, Part Of, and Competitor Of. Add the three missing types to schema, contracts, UI labels, moderation, search, seed data, and tests. |
| Relationship evidence | Relationships must be meaningful, verifiable, and non-redundant | **Partial** | Status/verification fields and uniqueness exist, but first-class evidence URLs, source context, and moderator rationale are not yet consistently modeled or reviewed. |
| Community edit flow | Community members can suggest edits | **Not implemented** | Administrators can edit resources, but no contributor-facing, reviewable resource-edit suggestion workflow is verified. |
| Duplicate reporting | Community can report duplicates | **Partial** | General resource reports and duplicate prevention exist, but an explicit duplicate-report reason and moderator merge/duplicate-resolution workflow are not yet verified. |
| Relationship contribution | Community can suggest relationships | **Partial** | Existing relationship moderation exists, but the evidence-backed suggestion flow needs validation and expansion to the full relationship taxonomy. |
| AI-assisted enrichment | Suggest summaries, categories, tags, relationships, alternatives; never auto-publish | **Not implemented** | No verified moderator-only AI draft workflow or explanation/provenance interface is present. |
| Semantic search readiness | Search should be semantic-search ready | **Partial** | Fuzzy and relationship-aware search are implemented; no provider interface, embedding strategy, relevance dataset, or vector retrieval layer is verified. |
| Graph exploration | Interactive Visual Graph Explorer | **Not implemented** | Node View tabs exist; no interactive one/two-hop graph visualization or accessible graph-navigation fallback is verified. |
| Graph database portability | Future readiness for Neo4j, ArangoDB, and Amazon Neptune | **Partial** | Current relationships are relational/MySQL-backed. A formal graph-query service boundary and migration strategy are not implemented. |
| Knowledge Graph API | Public graph/resource relationship endpoints named in the relationship layer brief | **Partial** | Typed tRPC contracts exist; the documented REST-compatible graph endpoints and public API documentation are not verified. |
| Resource taxonomy | Initial GitHub, AI, developer, cybersecurity, design, SaaS, accelerator, incubator, research, learning, and open-source resource types | **Partial** | Generic category support exists, but the complete prescribed taxonomy and scalable type-specific metadata strategy are not verified. |
| Historical context | Resources should contain historical context | **Not implemented** | No verified resource timeline, provenance history, change history visible to public users, or archival metadata model is present. |
| Multi-language readiness | English and Arabic readiness | **Not implemented** | No message catalog, locale selection, Arabic translations, or RTL-safe layout system is verified. |
| Full SSR | SEO-by-design support for server-side rendering | **Partial / deliberately deferred** | The current app is accurately a client-rendered SPA with server-injected metadata and fallback content. Full SSR has not been implemented and should not be claimed. |
| Security controls | RBAC, audit logging, input validation, rate limiting, secure authentication, API protection | **Partial** | RBAC, audit logging, validation, and OAuth are verified. Route-sensitive rate limiting and an explicit API-protection review are not verified. |
| Documentation | Technical, API, and architecture documentation for major components | **Partial** | Completion/verification records exist; the project README is still template-oriented and open-source contributor, API, architecture, security, and governance documentation are incomplete. |
| Testing | Unit, integration, and end-to-end tests | **Partial** | Unit and router-level integration tests exist. A durable end-to-end suite covering public, onboarding, profile, moderation, and graph flows is not verified. |
| Onboarding | Simple, frictionless onboarding | **Partial** | OAuth sign-in exists, but no intent-preserving first-session guide, profile completion decision, category interests, or recovery UX is verified. |
| Profile workspace | Profile as a comprehensible contribution and knowledge workspace | **Partial** | Editing, reputation, contributions, collections, and bookmarks exist. Completion guidance, privacy/share choices, edit preview, and polished first-use pathways are incomplete. |
| Moderation command center | Professional, simple, role-aware admin experience | **Partial** | Separate moderation, reports, bulk, and user-management pages exist, but no unified internal command center with persistent role-aware navigation, priority metrics, and coherent queue handoffs is verified. |
| Open-source release | Public GitHub-ready source, sanitized reproducible data, contribution governance | **Not implemented** | The target repository is empty; source has not yet been pushed and sanitized seed/release documentation are not complete. |

## Explicitly Deferred Rather Than Missing

| Capability | Rationale |
| --- | --- |
| Dedicated graph database | Defer until relational traversal performance, graph breadth, or contributor/query requirements justify operating a second persistence system. Introduce an adapter boundary first. |
| Automatic AI publishing | Do not implement; it conflicts with the supplied human-oversight requirement. |
| Full SSR migration | Evaluate separately using crawl/render and performance evidence; do not trade a stable application architecture for an unmeasured requirement. |
| Community ratings | Do not fabricate ratings or reviews. Add only if authentic, policy-compliant user-generated signals and moderation rules are designed. |

## Execution Priority

The immediate P0 release scope is: open-source repository safety and documentation; the three missing relationship types; evidence-aware relationship and community edit/duplicate flows; onboarding/profile/admin redesign; rate-limit/API audit; localization foundations; and test/seed/release verification. Graph Explorer, AI drafts, REST adapters, semantic provider abstraction, and full taxonomy expansion are P1/P2 workstreams that will be planned and implemented in bounded increments rather than claimed complete prematurely.
