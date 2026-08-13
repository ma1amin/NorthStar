# Architecture Decision Records

## ADR-001: Primary Data Store

**Status:** Proposed

**Decision:** PostgreSQL as primary system of record.

**Reason:** Strong relational integrity, mature ecosystem, broad tooling, and suitable relationship modeling for the initial scale.

## ADR-002: Search

**Status:** Proposed

**Decision:** Start with Meilisearch.

**Reason:** It is part of the approved starting stack and fits fast discovery requirements.

## ADR-003: Dedicated Graph Database

**Status:** Open

**Decision:** Do not make a dedicated graph database mandatory before workload validation.

**Reason:** Avoid unnecessary operational complexity while preserving a graph-ready domain model.

## ADR-004: AI Provider

**Status:** Open

**Decision:** Provider-agnostic AI abstraction.

**Reason:** The AI provider has not been selected.
