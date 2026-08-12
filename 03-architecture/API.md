# NorthStar API Architecture

## Principles

- API-first
- Versioned
- Authenticated where required
- Rate-limited
- Documented with OpenAPI
- Stable resource identifiers

## Proposed Domains

- `/resources`
- `/categories`
- `/tags`
- `/relationships`
- `/collections`
- `/bookmarks`
- `/votes`
- `/submissions`
- `/moderation`
- `/users`
- `/search`
- `/sources`
- `/analytics`

## Public vs Protected

Public endpoints should expose safe discovery data.

Mutation and private-user operations require authentication.

Exact endpoint contract is implementation-phase work.
