# NorthStar Value-Experiment Framework

**Status:** Approved research framework; no commercial offer, billing flow, entitlement upgrade, organization claim flow, or capacity increase is active.

## Purpose and Non-Negotiable Boundary

NorthStar may learn whether certain professional workflows are valuable without turning public knowledge into a paid gate. Public visitors continue to browse approved resources, relationships, Node Views, public collections, and public discovery routes without an experiment-dependent account, payment, or organization status.

> **An experiment may add private workflow utility or explicitly governed capacity. It must never remove, degrade, or paywall approved public knowledge.**

This framework operationalizes the value-exchange decisions in [`BUSINESS_MODEL_WORKSHOP.md`](./BUSINESS_MODEL_WORKSHOP.md) and the public-knowledge guardrail in [`CONTRIBUTOR_MODEL.md`](./CONTRIBUTOR_MODEL.md). It is intentionally a governed design contract, not an offer announcement.

## Experiment Portfolio

| Experiment | User problem and hypothesis | Stage 0: research only | Stage 1: invitation-only prototype | Explicitly out of scope until a later approval |
| --- | --- | --- | --- | --- |
| Professional research workspace | Researchers and curators may value a private place to organize discovery context beyond shared public collections. The hypothesis is that private workspace organization improves repeat research use without changing public discovery. | Interview contributors and inspect anonymous aggregate collection behavior. No personal research content is collected beyond the existing account/collection model. | A limited, opt-in private-workspace prototype using only owner-visible collection metadata and existing private collection controls. | Billing, team billing, AI synthesis of private content, automatic enrichment, and access restrictions on public collections. |
| Organization verification and management | Organizations may value a verified affiliation and a responsible contact to correct public facts through accountable moderation. The hypothesis is that verified affiliation improves the quality and turnaround of evidence-backed corrections. | Define evidence requirements, renewal interval, staff review rubric, suspension and appeal paths, and minimum data retention. | A human-reviewed claim request with a responsible contact, organization domain evidence, and a narrow ability to propose corrections. It is not a publisher role. | Automatic resource ownership, direct editing or publishing, employee identity verification by third parties, sales outreach, or public display of unreviewed claims. |
| Governed API capacity | Developers with legitimate high-volume, documented read use may value higher capacity than the standard API-key quota. The hypothesis is that a reviewed capacity process protects service reliability while retaining the existing public API contract. | Record quota/latency evidence and define a review rubric for a bounded pilot. | An administrator-reviewed request to adjust an existing key’s already-supported `dailyQuota`, with explicit scope, time limit, reason, and audit record. | Paid throughput tiers, write scopes, unbounded quota, sensitive endpoints, customer data collection, or capacity granted solely for payment. |

## Common Entry, Consent, and Exit Controls

Every experiment uses the following controls before any user-facing pilot begins.

| Control | Required implementation and decision rule |
| --- | --- |
| Owner approval | The owner approves a written experiment brief before invitation, data collection, entitlement changes, or public messaging. |
| Opt-in | Participation is voluntary, understandable, and separate from contribution verification. A verified-contributor badge, activity level, and payment status do not constitute consent. |
| Human review | Organization claims and capacity changes require a moderator or administrator decision. Workspace research may not infer sensitive interests or make public recommendations. |
| Least privilege | A pilot grants only the minimum private workspace, correction-proposal, or read-capacity capability described in its approved brief. |
| Auditability | Decisions, scope, rationale, reviewer, expiry, suspension, and appeal record must be stored in the existing audit model or an approved extension before activation. |
| Reversibility | Each pilot has an end date, a revocation path, a data export/delete policy, and a rollback plan that preserves public resources and public relationships. |
| Equality of public knowledge | Basic approved resources, relationships, public collections, and public API documentation stay available independently of participation. |

## Required Experiment Brief

No implementation may progress beyond design until a maintainer records the following brief in the repository or an audited administrative record.

| Field | Requirement |
| --- | --- |
| Hypothesis | A falsifiable statement about a private workflow or governed capacity need—not revenue potential alone. |
| Cohort and invitation rule | Small, bounded, opt-in group with a non-discriminatory selection rationale. |
| Capability boundary | Exact capabilities granted, excluded, and the affected data classes. |
| Measurement plan | Aggregate success, safety, quality, and support-load metrics with no unnecessary request content, IP addresses, or behavioral surveillance. |
| Privacy and retention assessment | Data minimization, access controls, retention window, and deletion/export treatment. |
| Integrity assessment | Abuse cases, promotional conflicts, staff review rubric, sampling, suspension, and appeal treatment. |
| Exit criteria | Success threshold, harm or support-load stop threshold, pilot end date, rollback owner, and user notification plan. |

## Success and Stop Rules

The first decision point for any experiment is not pricing. It is whether the pilot improves user work while maintaining discovery, quality, privacy, and moderation standards. A brief must specify its own measurable target before enrollment; targets are not retrofitted after observing results.

| Area | Minimum success evidence | Immediate stop or rollback trigger |
| --- | --- | --- |
| Public access | No decrease in anonymous public discovery capability attributable to the pilot. | Any proposed paywall, feature degradation, or new account requirement for approved public knowledge. |
| Data quality | Evidence-backed corrections or curation maintain the existing human-review standard. | Automatic publication, unsupported affiliation claims, or material increase in deceptive/promotional submissions. |
| Privacy | The pilot collects only the declared minimum data and honors retention/deletion terms. | Undeclared sensitive data collection, third-party sharing, or inability to honor deletion/export commitments. |
| Reliability | API capacity changes remain bounded, scoped, monitored, and revocable. | Sustained reliability impact, quota-bypass behavior, write-access pressure, or inability to audit use. |
| User value | Participants can articulate a concrete workflow benefit through opt-in feedback or task-completion evidence. | Persistent confusion, coerced participation, disproportionate support burden, or no plausible value signal at the planned review point. |

## Initial Technical Boundaries

The current platform already has prerequisites that can support carefully bounded pilots: owner-visible private collections, moderated contribution records, contributor verification and appeal records, role-based controls, audit logs, API-key scopes, per-key quotas, expiry/revocation fields, and daily aggregate API usage. These capabilities are **not** an activated experiment.

New tables, permissions, automation, billing services, external identity vendors, or enhanced API quotas must not be added merely to advertise a future tier. They require an approved brief, migration review, least-privilege access design, automated coverage, and a human-operated moderation or administration path.

## Decision Log

| Decision | State | Evidence |
| --- | --- | --- |
| Keep public knowledge open while assessing additive professional value | Approved | `CONTRIBUTOR_MODEL.md`; `BUSINESS_MODEL_WORKSHOP.md` |
| Start a commercial or billing flow | Not approved | No billing integration is enabled. |
| Invite participants, collect experiment-interest data, or grant pilot access | Not approved | No opt-in cohort or entitlement is active. |
| Implement new identity-provider or organization-domain verification | Not approved | No external identity or domain-verification connector is active. |
| Raise API capacity for a reviewed pilot | Not approved | Existing key quotas remain governed by the current owner-managed API-key contract. |

## References

[1]: [Hybrid Contributor Model](./CONTRIBUTOR_MODEL.md)

[2]: [Business Model Workshop](./BUSINESS_MODEL_WORKSHOP.md)

[3]: [Public API Boundary](./API.md)
