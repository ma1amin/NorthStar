# Data Handling and Seed Policy

NorthStar’s source repository contains code, schema, reviewed migrations, documentation, and a reproducible **sanitized** seed script. It must never contain a database dump, a connection string, production-like user data, audit logs, real moderation records, session data, API keys, OAuth material, or any other sensitive export.

The seed script creates a clearly labelled synthetic curator account and public-style sample categories, tags, and resources. It only runs when `NORTHSTAR_ALLOW_SEED=1` is supplied explicitly, and it is designed for a local disposable database. Review the script before use and do not point it at a shared or production-like database.

## Resource Claims and Provenance

Resource data is treated as a claim, not truth by default. The application stores attributed evidence sources, public resource-history events, freshness reviews, duplicate-resolution proposals, and audit records as separate data classes. This prevents opaque JSON metadata from becoming the sole proof for a public claim.

| Record class | Access boundary | Current policy |
| --- | --- | --- |
| Approved resource record | Public | Displayed while relevant and policy-compliant. |
| Approved evidence source | Public | May appear in the Resource Detail trust context with source type, attribution, and capture/verification information. |
| Public resource history | Public | Shows accepted, intentionally public accountability events only. |
| Freshness guidance | Publicly displayable | The latest review can communicate `current`, `needs_review`, or `stale` guidance. |
| Unapproved evidence, reports, reviewer notes, audit payloads | Restricted | Never exposed through public trust context. |
| Duplicate-resolution proposal | Restricted until confirmed | Confirmation creates a canonical alias; it does not delete the original node or silently rewrite community records. |

## Current Retention Boundary

The current application provides source, public-history, freshness, and alias foundations. It does **not** yet provide a complete retention schedule, source scoring programme, personal-data export, anonymisation, destructive duplicate merge, or automatic freshness job. Maintainers must not promise deletion timelines, portable exports, historical completeness, or automatic correction until an owner-approved policy and corresponding workflow exist.

Any future source ingestion, retention, export, anonymisation, or record-migration work requires a written proposal, access review, auditability, migration/rollback plan, and Arabic/RTL implications review. The authoritative policy is maintained in [PROJECT_POLICY.md](./PROJECT_POLICY.md); deferred proposals are held in [suggest.md](./suggest.md).
