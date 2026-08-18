# PII-Free Archive Intake Contract

NorthStar processes chat exports and contributor files to discover **resource URLs**, not to retain communications or identity data. The archive-intake workflow is designed so personal data is neither publicly nor privately stored by this feature.

## Non-Retention Rules

| Data class | Treatment |
| --- | --- |
| Source ZIPs, text files, office documents, images, and file metadata | Processed in bounded memory only; never written to object storage or database tables. |
| Chat messages, forwarded text, timestamps, sender names, email addresses, phone numbers, account handles, contact cards, media filenames, and location data | Dropped before a candidate, audit event, error record, or reviewer view is produced. |
| OCR image text | Extracted locally in the contributor’s browser. Only locally detected resource URLs may be selected for normal contribution review. |
| Archive-import batch data | Stores only aggregate counts, normalized resource URLs, safe public-page metadata, public-page provenance, duplicate state, and moderation state. |
| Audit data | Stores only non-identifying batch/candidate IDs and aggregate processing counts. |

## Safety Boundaries

The parser accepts bounded inputs, rejects unsafe archive paths and unsupported ZIP entries, ignores contact-card files, blocks local/private-network destinations, strips common tracking fields, and rejects URLs that contain direct or decoded contact information. Public-page metadata is also omitted when it contains email, phone, or account-identifier markers.

All candidates remain in a review-only state. Importing a candidate batch cannot publish a resource, create a graph edge, or establish a relationship. A moderator must continue through the existing human approval workflow before any public record changes.

## Resource-Type and Root-Domain Exclusions

NorthStar’s archive workflow is a **resource directory**, not a video, editorial, document, event, or meeting archive. Video-hosting links, YouTube URLs, blog/article/news paths, editorial domains, social posts, personal-profile pages, Google Drive/Docs/Sheets/Slides links, Luma events, meeting links, and direct document downloads are excluded before any candidate can enter normal moderation.

The workflow also applies strict public-suffix-aware **registrable-domain deduplication**. Only one eligible candidate per root domain can remain review-ready. Subdomain and path variants are retained only as non-public `root_domain_duplicate` audit records. Excluded candidates remain non-public and non-publishable; they are never deleted silently and cannot be handed to the resource moderation queue.

## Human Governance Controls

Bulk handoff is explicitly reviewer-confirmed and limited to **25 review-ready candidates** per action. The handoff creates ordinary **pending** moderation submissions only; it does not approve or publish a resource. Metadata-unavailable candidates can be retried only while failed and for at most **three** attempts. Trusted source domains are an owner-managed, root-domain-normalized advisory signal only: they never bypass an exclusion, deduplication rule, or human moderation decision.

## Supplied Archive Outcome

The owner-supplied WhatsApp export was processed once through the bounded importer. The initial processing report recorded **98** metadata retrieval failures. After the strict privacy scrub removed contact-bearing candidates and metadata, the final PII-free batch retained **500** unique resource candidates from **697** URL mentions, with **156** rejected mentions and **97** remaining metadata-unavailable candidates. Final aggregate verification found zero URLs or metadata values containing an at-sign marker.

The original archive, its contact-card entry, message text, sender identity, phone data, timestamps, and filenames were not stored by NorthStar’s archive-intake tables.

After strict root-domain reconciliation, batch #1 contained 245 review-ready candidates. A bounded, low-concurrency public-page refresh then fetched sanitized title, description, canonical URL, and source URL from **240** of them. Five current fetches were unavailable and moved to the bounded retry state. The current aggregate state is **240** review-ready candidates with public-page fetch evidence, **47** metadata-unavailable candidates, **6** pending moderation submissions, **101** root-domain duplicate audit records, **70** excluded video-hosting candidates, **14** excluded editorial/blog candidates, **12** excluded social/profile candidates, **7** excluded Google Workspace candidates, **2** excluded Luma candidates, and **1** excluded direct-document candidate.

The refresh process does **not** infer category, tags, pricing, license, builder, or relationships. These fields remain intentionally unverified until a human reviewer checks an official page or documentation source, confirms the values, and creates a standard pending moderation submission. No excluded candidate is eligible for handoff, no review-ready candidate has an exclusion reason, and no root domain has more than one review-ready candidate.
