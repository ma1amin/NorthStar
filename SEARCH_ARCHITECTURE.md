# Search Architecture and Semantic Readiness

NorthStar’s active search provider is the database-backed relationship-aware search service. It supports lexical title, description, builder, category, pricing, and tag matching; typo-tolerant fallback; and relationship-intent traversal such as `Jira alternatives`.

## Current Truthful Capability State

| Capability | Status |
| --- | --- |
| Relationship-aware lexical search | Active |
| Bounded fuzzy fallback | Active |
| Anonymous aggregate query analytics | Active, with identifier and URL-like query filtering |
| External search provider | **Not configured** |
| Semantic/vector search | **Not enabled** |
| Embedding generation | **Not enabled** |

The public `search.capabilities` contract reports this state so the interface and future clients never imply that semantic results or an external search service are active when they are not.

## Provider Boundary

Future adapters should preserve NorthStar’s normalized search result and filter contracts while supplying one of these provider implementations:

1. **Relational provider** — current baseline and fallback.
2. **External lexical provider** — opt-in only, with indexed approved resources and explicit operational monitoring.
3. **Semantic provider** — opt-in only, using a versioned embedding field, provenance-aware reindex jobs, and similarity scores clearly labelled as recommendations rather than verified relationships.

Any semantic result must remain distinct from approved graph edges. AI may suggest candidates, but a human moderator must validate and publish graph relationships.
