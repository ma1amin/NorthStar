# Verified Curation and Interactive Experience Release

## Release Boundary

This release improves NorthStar’s evidence, moderation reliability, discovery interaction, and loading behavior without relaxing human moderation. It does not automatically approve or publish any newly curated resource or relationship.

## Evidence-Backed Curation Registers

The curated expansion is now recorded in **four explicit, non-publishing curation registers of 50 candidates each**. Every register entry retains its verified candidate URL and, where available, its linked standard moderation submission. The source account remains the non-personal `northstar-curation-system` account. The register itself does not change a submission’s human-moderation status or publish any resource.

| Category | Pending candidates |
| --- | ---: |
| Communication | 22 |
| Data & AI | 25 |
| Design | 25 |
| Developer Tools | 38 |
| Productivity | 24 |
| Project Management | 25 |
| Research & Knowledge | 16 |
| Security & Observability | 25 |
| **Total** | **200** |

The curation manifest was reconciled to 200 unique candidate URLs. Where a public homepage was repeated, the duplicate entry was replaced with a distinct, public GitHub repository-backed resource before register synchronization. Candidate source fields remain through moderation and become a moderator-verified resource source only after an explicit approval decision. Existing public resources remain unchanged by this curation work.

## Archive Evidence Correction

Archive refresh now creates **field-level public-evidence proposals** for title, description, canonical URL, and official source URL. Each proposal preserves its current value, proposed value, evidence URL, extraction method, and retrieval time. A reviewer must explicitly accept or reject each proposal before the stored candidate metadata changes. The workflow never infers category, tags, pricing model, license, builder, or relationships. Reviewers must still explicitly confirm classification before handoff into the ordinary pending moderation queue. The strict registrable-domain, content-exclusion, retry, privacy, and no-publication controls remain in force.

## Moderation Navigation Reliability

All targeted moderation child pages now use one shared, blue **Moderation dashboard** return control. The prior ghost, outlined, and archive-import return variants were removed from the active review views, avoiding duplicate dashboard actions and preserving a consistent escape path from report triage, archive workspaces, AI drafts, bulk review, edit suggestions, user management, and Search Quality.

## Relationship Evidence

Two additional graph proposals were staged as **pending and unverified** from specific primary documentation. They remain unavailable in the public graph until a moderator approves them.

| Source | Target | Proposal | Evidence |
| --- | --- | --- | --- |
| Vercel | Supabase | Integrates with | [Vercel Marketplace: Supabase for Vercel](https://vercel.com/marketplace/supabase) |
| Sentry | GitHub | Integrates with | [Sentry GitHub integration documentation](https://docs.sentry.io/integrations/source-code-mgmt/github/) |

## Experience and Performance Changes

Public routes now load non-home workspaces on demand with an immediate route-loading surface. The production client is further segmented into React, UI, data-query, icon, route, and page chunks. The initial application chunk is approximately **221 kB uncompressed / 54 kB gzip**; the React runtime is a separately cacheable **397 kB uncompressed / 117 kB gzip** chunk.

The home card is now a live carousel driven by approved resource data. It rotates every three seconds unless interaction, pause control, or reduced-motion preference disables automatic movement. Users can select a resource directly or use previous/next controls. The Resource Node View and Graph Explorer now offer bounded interactive navigation, relationship-type filters, selectable connected nodes, icon-backed graph nodes, evidence links, and accessible list fallbacks.

Original resource icons are stored only when an approved resource’s public page declares an icon link. This refresh populated 24 of 30 approved resources; the remaining six intentionally retain the neutral graph fallback rather than displaying invented branding.

## Verification

The completed release passed TypeScript validation, the full Vitest suite, a production build, and `git diff --check`. Focused regression coverage verifies public-evidence proposal construction, preserves omission of inferred classification fields, and confirms that all targeted moderation pages use the shared return control without hardcoded dashboard navigation. The four registers each contain 50 distinct candidate URLs. A temporary preview wake-up failure prevented an additional browser-only visual capture; no content, moderation, or account action was performed during that check.

## References

[1]: https://docs.github.com/en/rest/repos/repos "GitHub REST API — Repositories"
[2]: https://www.cncf.io/projects/ "CNCF Projects"
[3]: https://vercel.com/marketplace/supabase "Supabase for Vercel"
[4]: https://docs.sentry.io/integrations/source-code-mgmt/github/ "Sentry GitHub Integration"
