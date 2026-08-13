# NorthStar Project Policy

This document is the repository’s **authoritative product-policy reference**. It supersedes planning-only wording found in historical discovery materials when that wording conflicts with the active codebase, the repository license, or the governance documents.

## License, Copyright, and Attribution

NorthStar is distributed under the [MIT License](./LICENSE). The MIT License at the repository root is the authoritative licensing instrument for this codebase. Historical documents that describe the license as “TBD,” reserve all rights, or propose unapproved attribution language are planning artifacts and do not change the repository license.

Contributors must not add third-party trademarks, endorsements, customer claims, adoption claims, testimonials, or commercial attribution to NorthStar without documented permission from the relevant rights holder. Project acknowledgements belong in release notes or a dedicated credits file only when the project owner has approved their wording.

## Governance and Moderation

NorthStar follows the maintainer-led model described in [GOVERNANCE.md](./GOVERNANCE.md). Maintainers are responsible for release decisions, data-quality policy, security response, and assignment of moderator or administrator roles. Human moderation is final for public resource records, relationship edges, evidence sources, edit suggestions, duplicate decisions, reports, freshness reviews, and AI-assisted drafts.

Contributors may request reconsideration by submitting new, relevant evidence through the same contribution channel or a maintainer-approved private contact route. Appeals are evidence reviews, not an entitlement to publication or reversal. The project will document the final escalation contact before inviting broad public moderation participation.

## Identity and Account Expectations

NorthStar currently uses the platform-provided **Manus OAuth** flow for authenticated actions. Public browsing does not require an account. Sign-in creates or continues an account linked to the connected identity provider; NorthStar does not currently offer separate local passwords, direct email sign-in, magic links, or independently selectable Google/GitHub identity providers.

Product copy, contributor documentation, and future API documentation must describe this limitation accurately. A separate identity-provider programme requires an explicit design, privacy review, threat model, and release decision.

## Resource Data, Provenance, and Retention

Resources and relationships are treated as reviewable claims rather than unquestioned facts. The active release supports attributed resource sources, public history events, freshness guidance, and canonical duplicate aliases. Only approved sources and intentionally public history events may be shown in public trust context. Private reports, reviewer notes, unapproved evidence, and audit details remain restricted.

A confirmed duplicate resolution preserves the original resource and its linked community records as a canonical alias; it is not a destructive merge or blanket record rewrite. The application does not yet provide a complete retention schedule, data export, anonymisation, source scoring programme, automatic freshness workflow, or rollbackable record-migration system. Maintainers must avoid promises that the code cannot honor.

## Release Truthfulness

NorthStar is a client-rendered React application with server-injected public metadata and fallback content. It is not full server-side rendering and does not enable semantic/vector search. It provides a stable versioned, read-only `/v1` REST API with owner-managed API keys, scopes, daily quotas, and OpenAPI documentation; it does not provide public write or moderation API contracts. Privileged browser QA remains CAPTCHA-limited; automated authorization and integration tests are the current evidence for those operations.

## Change-Control Requirements

The following changes require a written proposal and maintainer approval: schema migrations, authorization, moderation policy, public API contracts, data retention, source ingestion, AI publication boundaries, identity flows, and legal/governance wording. Each proposal must identify user impact, Arabic/RTL implications, security and privacy impact, tests, documentation updates, and rollback conditions. Deferred proposals belong in [`suggest.md`](./suggest.md) until the owner explicitly approves implementation.
