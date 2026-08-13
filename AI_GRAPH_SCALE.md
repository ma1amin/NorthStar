# AI Enrichment and Graph Scale Boundary

NorthStar’s AI feature remains a structured **moderation draft** generated from supplied metadata only. It has no browse authority, no automatic publication path, and no authority to create resources, relationships, evidence, aliases, or freshness decisions.

The active graph provider is the bounded relational implementation. `GraphProvider` preserves the public neighborhood contract so Neo4j, ArangoDB, or Neptune can be assessed later without rewriting Node View or Graph Explorer. No external graph store, queue, cache, embedding index, or background AI job is configured in this release.

Every future enrichment must carry provenance, bounded confidence, review context, costs, privacy handling, and an explicit human approval step. A publish request or missing provenance fails the proposal-only boundary.
