# NorthStar Delivery Status and Decision Gates

NorthStar’s verified core release now includes policy alignment, English/Arabic critical product flows, resource sources, public history, freshness guidance, and non-destructive duplicate aliases. The active codebase should not be described as missing these foundations. [1] [2]

## Delivered Baseline

| Delivered area | Verified scope |
| --- | --- |
| Policy and identity clarity | MIT, governance, moderation, retention boundaries, and Manus OAuth posture are documented consistently. |
| Critical bilingual product flows | Discovery, contribution, collections, reports, Profile, and moderation surfaces have English/Arabic critical copy and RTL-safe layouts. |
| Resource trust context | Approved sources, public history, and latest freshness guidance are available to public Node Views. |
| Quality moderation foundation | Source review, freshness recording, duplicate preview/proposal, and administrator-only alias confirmation are protected and audited. |
| Duplicate safety | Confirmation creates a canonical alias and preserves the original resource plus linked community records rather than deleting or silently rewriting them. |
| Public UX and local preferences | EN/AR core public journeys, RTL, a persisted light/dark preference, public collection discovery, and Trending/About/Developer/Settings routes are delivered; the footer remains intentionally English. |

## Verified Limitations

The data-quality foundation now includes a dedicated moderator command workspace for evidence review, freshness decisions, and duplicate-alias proposals/confirmation, as well as contributor evidence submission and canonical-alias messaging in Node View. Automatic freshness jobs, source scoring, and the governed cross-record migration workflow remain unfinished. The release also has no stable public REST/OpenAPI API, semantic/vector provider, PWA, CI/CD/observability stack, ingestion framework, or verified GitHub publication from this environment. Privileged browser QA remains blocked by CAPTCHA; automated authorization and integration tests are the evidence for those protected workflows. [2] [3]

## Owner Decision Gate

All further recommendations are intentionally held in [`suggest.md`](./suggest.md). They are not active backlog commitments and must be explicitly selected before development begins. The register groups them into five decision domains:

| Decision domain | Held suggestion IDs |
| --- | --- |
| Data-quality operating UX and safe consolidation | `S-01` to `S-04`, `S-18` |
| Localization, theming, and collection experience | `S-05` to `S-07` |
| Public ecosystem, search, and operations | `S-08` to `S-12`, `S-19` |
| Ingestion and AI enrichment | `S-13` to `S-14` |
| Scale, integrations, and additional product areas | `S-15` to `S-17` |

> **Implementation rule:** an item moves from `suggest.md` to the active section of [`todo.md`](./todo.md) only after the owner selects it. The resulting task must define scope, policy impact, acceptance evidence, and rollback conditions.

## References

[1]: [Documentation traceability matrix](./DOCUMENTATION_TRACEABILITY.md)
[2]: [Verification record](./VERIFICATION.md)
[3]: [Suggestion register](./suggest.md)
