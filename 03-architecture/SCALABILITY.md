# NorthStar Scalability Strategy

## Scale Dimensions

NorthStar must scale across:
- resources
- relationships
- users
- search traffic
- ingestion jobs
- AI jobs
- graph traversal
- media assets

## Principles

- Stateless application services where practical
- Horizontal scaling
- Asynchronous jobs for expensive operations
- Cache hot reads
- Separate write and search workloads
- Search indexes as derived data
- Provider adapters for external services

## Real-Time Growth

Use event-driven updates for:
- resource approval
- relationship approval
- index refresh
- notification events
- graph projection updates

## Infrastructure Provider

TBD.
