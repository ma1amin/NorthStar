# Verified Curation and Interactive Experience Release

## Release Boundary

This release improves NorthStar’s evidence, moderation reliability, discovery interaction, and loading behavior without relaxing human moderation. It does not automatically approve or publish any newly curated resource or relationship.

## Evidence-Backed Curation Batch

The first curated expansion batch contains **200 non-public pending submissions** under the non-personal `northstar-curation-system` account. Every candidate has a primary public GitHub repository URL and a repository-source marker. The deterministic staging utility rejects duplicates, direct personal-data markers, absent licenses, and missing public repository evidence before a pending submission is created.

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

Candidate source fields are retained through moderation and become a moderator-verified resource source only after an explicit approval decision. Existing public resources remain unchanged by this curation batch.

## Archive Evidence Correction

Archive-candidate refresh now retains only sanitized public-page title, description, canonical URL, declared icon URL, fetch status, and fetch timestamp. It never infers a category, tag, pricing model, or license. Reviewers must explicitly select these classifications before handoff into the ordinary pending moderation queue. The strict registrable-domain, content-exclusion, retry, and no-publication controls remain in force.

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

The release passed TypeScript validation, the full Vitest suite, a production build, and `git diff --check`. The direct resource and graph-neighborhood API probes returned valid public records for Vercel and its approved graph data. A My Browser extension timeout interrupted the visual graph walkthrough after the page began loading; no content, moderation, or account action was performed during that check.

## References

[1]: https://docs.github.com/en/rest/repos/repos "GitHub REST API — Repositories"
[2]: https://www.cncf.io/projects/ "CNCF Projects"
[3]: https://vercel.com/marketplace/supabase "Supabase for Vercel"
[4]: https://docs.sentry.io/integrations/source-code-mgmt/github/ "Sentry GitHub Integration"
