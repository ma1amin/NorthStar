# NorthStar Search Architecture

## Starting Search Technology

Meilisearch is part of the approved starting stack.

## Search Modes

- Exact
- Prefix
- Fuzzy
- Faceted
- Filtered
- Relationship-aware
- Semantic-ready

## Indexing

PostgreSQL remains the source of truth. Search indexes are derived data.

## Future Semantic Search

Semantic search should be introduced after baseline lexical search is measured.

Potential components:
- embedding generation
- vector storage
- hybrid retrieval

Exact provider and vector architecture are TBD.

## Search Quality

Measure:
- precision
- recall
- zero-result rate
- click-through
- reformulation rate
- time to useful result
