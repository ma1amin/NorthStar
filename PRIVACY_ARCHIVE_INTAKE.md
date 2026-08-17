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

## Supplied Archive Outcome

The owner-supplied WhatsApp export was processed once through the bounded importer. The initial processing report recorded **98** metadata retrieval failures. After the strict privacy scrub removed contact-bearing candidates and metadata, the final PII-free batch retained **500** unique resource candidates from **697** URL mentions, with **156** rejected mentions and **97** remaining metadata-unavailable candidates. Final aggregate verification found zero URLs or metadata values containing an at-sign marker.

The original archive, its contact-card entry, message text, sender identity, phone data, timestamps, and filenames were not stored by NorthStar’s archive-intake tables.
