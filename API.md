# NorthStar API Overview

NorthStar currently exposes typed application contracts through tRPC under `/api/trpc`. The browser client consumes those contracts directly; they are not a promise of a stable public REST API.

## Public Read Contracts

The public discovery surface includes resource browsing, relationship-aware search, search suggestions, categories, resource detail, collections, and approved resource relationships. Search supports structured category, pricing, and tag filters alongside relationship intent such as `Jira alternatives`.

## Protected Community Contracts

Authenticated users can submit resources, suggest relationships, manage profiles, collections, bookmarks, and votes, and create resource reports. These actions are validated and subject to moderation where they alter public knowledge.

## Moderator and Administrator Contracts

Moderators can review pending submissions, graph suggestions, reports, and bounded bulk rejection batches. Administrators additionally manage users and publish-state resource edits. All privileged mutations are role-checked and recorded in the moderation audit history.

## API Evolution

The future public Graph API will be designed separately, with documented versioning, read-only scopes, rate limits, provenance fields, and a compatibility layer only when open API consumers have concrete needs. Until then, contributors should treat tRPC procedure shapes as application contracts that can change with a documented release.
