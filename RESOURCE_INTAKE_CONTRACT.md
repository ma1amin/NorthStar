# Resource Intake Contract

## Intake Boundary

NorthStar accepts only material a registered contributor explicitly chooses to provide. The initial supported forms are pasted text, one or more web links, and small text-based exports (`.txt`, `.md`, `.csv`, `.json`). A user-exported chat backup is treated as a selected text export, not as account access or synchronization.

| Control | Contract |
|---|---|
| Authentication | Registration is required for every intake. |
| Consent | The contributor confirms the right to share the material and chooses minimized or review-evidence retention. |
| Retention | Minimized retention discards raw text after candidate extraction; review-evidence retention stores only the permitted managed-storage reference and limited candidate context. |
| File limits | The first release accepts text-based files only, with explicit allowlist, bounded byte size, parsing timeout, and no executable/archive content. |
| URL safety | Only `http` and `https` links are accepted. Unsafe schemes, private-network targets, and malformed URLs are rejected before metadata fetch or candidate creation. |
| Extraction | Deterministic URL parsing runs first. AI-assisted extraction is optional, server-side, schema-constrained, cost-capped, versioned, and never publishes data. |
| Publication | Every candidate becomes a contributor-reviewed draft and then a human-moderated proposal. No automatic publication is permitted. |

## Workflow States

| Entity | States | Meaning |
|---|---|---|
| Intake | `draft`, `processing`, `ready_for_review`, `submitted`, `closed` | Owns consent, retention, input metadata, and candidate set. |
| Candidate | `draft`, `submitted`, `accepted`, `rejected`, `duplicate` | Represents an extracted resource, source, or relationship proposal. |
| Verification application | `pending`, `approved`, `rejected`, `suspended` | Represents manual portfolio review plus accepted-contribution evidence. |
| Appeal | `open`, `upheld`, `overturned`, `withdrawn` | Provides an auditable human-review route for verification and high-impact contributor decisions. |

## Hybrid Queue Rule

All submitted candidates enter a human moderation queue. A contributor with an approved verification application is marked for a **faster lane**, but the item still receives sampled human review. The queue priority is a service-level signal only: it neither changes a candidate’s quality threshold nor bypasses approval, evidence, audit, duplicate, or appeal controls.

## Data Model

| Table | Owner | Sensitive fields | Key relationships |
|---|---|---|---|
| `resource_intakes` | Contributor | storage key, retention choice, source filename | One intake has many candidates. |
| `intake_candidates` | Intake | limited context quote and structured draft metadata | Candidate may become a submission or source/relationship proposal after human decision. |
| `contributor_verification_applications` | Contributor | portfolio URL, rationale, reviewer note | Latest approved record confers verified capability. |
| `contributor_appeals` | Contributor | appeal rationale and reviewer note | References a verification or high-impact contribution decision. |

## Initial Limits and Benefits

Registered contributors receive a conservative daily intake allowance. Verified contributors receive a higher allowance, verified badge, accepted-work history, curator tools, and faster-lane eligibility. Exact allowance values are server-side policy, rate-limited, observable, and adjustable without retroactively changing public records.
