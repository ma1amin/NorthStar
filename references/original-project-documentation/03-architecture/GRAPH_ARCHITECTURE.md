# NorthStar Knowledge Graph Architecture

## Requirement

NorthStar needs to handle relationships and graph exploration at scale.

## Recommendation

Start with PostgreSQL as the authoritative system of record and model relationships explicitly. Introduce a dedicated graph engine only when real workload characteristics justify it.

This recommendation avoids prematurely operating two authoritative databases while keeping the domain model graph-ready.

## Relationship Model

A relationship should contain:
- source entity
- relationship type
- target entity
- provenance
- confidence where applicable
- status
- created by
- created at
- updated at
- verification state

## Graph Read Model

For high-volume traversal and visualization, a graph-optimized read model can be introduced later.

Candidate technologies for future evaluation:
- Neo4j
- ArangoDB
- Amazon Neptune

No final graph database has been selected.

## Real-Time Graph

For real-time UI updates, use application events and a subscription mechanism rather than making the graph database itself responsible for the user experience.

## Scaling Path

1. PostgreSQL relationship tables.
2. Indexed graph queries.
3. Cached graph neighborhoods.
4. Dedicated graph read model if required.
5. Distributed/event-driven graph projections if scale justifies them.
