# NorthStar System Architecture

## Architecture Goals

- Modular
- Scalable
- Search-optimized
- Relationship-aware
- AI-ready
- Bilingual
- Vendor-neutral
- Open-source friendly

## Approved Starting Stack

The owner approved the previously proposed stack, with permission to adjust it as project needs evolve:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- NestJS
- PostgreSQL
- Redis
- Meilisearch
- S3-compatible storage
- Docker

This is an approved starting point, not an immutable constraint.

## Recommended High-Level Architecture

### Presentation Layer

Next.js application for:
- public discovery
- authenticated experiences
- bilingual UI
- SEO

### Application Layer

NestJS modular backend for:
- resources
- users
- contributions
- moderation
- collections
- relationships
- search orchestration
- ingestion
- AI orchestration
- APIs

### Data Layer

PostgreSQL as the primary system of record.

Redis for caching, rate limiting, queues, and transient workloads.

Object storage for images and other binary assets.

Search engine for optimized discovery.

### Integration Layer

External connectors should be isolated behind provider-specific adapters.

### Intelligence Layer

AI services should operate through an abstraction layer so providers can change without redesigning the product.
