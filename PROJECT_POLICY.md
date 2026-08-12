# NorthStar Project Policy

This document is the repository’s **authoritative product-policy reference**. It supersedes planning-only wording found in historical discovery materials when that wording conflicts with the active codebase, the repository license, or the governance documents.

## License, Copyright, and Attribution

NorthStar is distributed under the [MIT License](./LICENSE). The MIT License at the repository root is the authoritative licensing instrument for this codebase. Historical documents that describe the license as “TBD,” reserve all rights, or propose unapproved attribution language are planning artifacts and do not change the repository license.

Contributors must not add third-party trademarks, endorsements, customer claims, adoption claims, testimonials, or commercial attribution to NorthStar without documented permission from the relevant rights holder. Project acknowledgements belong in release notes or a dedicated credits file only when the project owner has approved their wording.

## Governance and Moderation

NorthStar follows the maintainer-led model described in [GOVERNANCE.md](./GOVERNANCE.md). Maintainers are responsible for release decisions, data-quality policy, security response, and assignment of moderator or administrator roles. Human moderation is final for public resource records, relationship edges, edit suggestions, duplicate decisions, reports, and AI-assisted drafts.

Contributors may request reconsideration by submitting new, relevant evidence through the same contribution channel or a maintainer-approved private contact route. Appeals are evidence reviews, not an entitlement to publication or reversal. The project will document the final escalation contact before inviting broad public moderation participation.

## Identity and Account Expectations

NorthStar currently uses the platform-provided **Manus OAuth** flow for authenticated actions. Public browsing does not require an account. Sign-in creates or continues an account linked to the connected identity provider; NorthStar does not currently offer separate local passwords, direct email sign-in, magic links, or independently selectable Google/GitHub identity providers.

Product copy, contributor documentation, and future API documentation must describe this limitation accurately. A separate identity-provider programme requires an explicit design, privacy review, threat model, and release decision.

## Resource Data, Provenance, and Retention

Resources and relationships are treated as reviewable claims rather than unquestioned facts. Approved public data may be displayed while it remains relevant and policy-compliant. Relationship evidence, contributor suggestions, reports, and moderation outcomes remain subject to access controls and are not automatically published in full.

The active release does not yet provide a complete public history, source-retention, data-export, anonymisation, or duplicate-merge system. Until those workflows are implemented, maintainers must avoid making retention or deletion promises that the code cannot honor. New provenance and freshness features must include an explicit retention decision, safe access boundaries, auditability, and a migration/rollback plan.

## Release Truthfulness

NorthStar is a client-rendered React application with server-injected public metadata and fallback content. It is not full server-side rendering, does not currently provide a stable public REST API, does not enable semantic/vector search, and is not verified as published to the configured GitHub remote from this environment. Release notes must retain these distinctions.

## Change-Control Requirements

The following changes require a written proposal and maintainer approval: schema migrations, authorization, moderation policy, public API contracts, data retention, source ingestion, AI publication boundaries, identity flows, and legal/governance wording. Each proposal must identify user impact, Arabic/RTL implications, security and privacy impact, tests, documentation updates, and rollback conditions.
