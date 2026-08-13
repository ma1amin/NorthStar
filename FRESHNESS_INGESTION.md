# Governed Freshness and Ingestion

NorthStar’s freshness sweep is **review-only**. An authorized moderator can queue approved canonical resources that have no current review within a bounded 30–365-day threshold. The sweep records `needs_review` guidance and a restricted history record; it never edits, unpublishes, aliases, or otherwise changes a resource automatically.

| Control | Boundary |
|---|---|
| Idempotency | Resources already marked `needs_review` or `stale` are skipped. |
| Authority | Moderator or administrator action only; every run writes an audit entry. |
| Public data | The queued history event is restricted; public metadata changes still require human review. |
| Scheduled activation | A Heartbeat callback may be activated only after deployment, with cron authentication, a durable task UID, and owner approval. No recurring job is active in this checkpoint. |
| Ingestion | Adapters only normalize candidates. HTTPS, attribution, license/reuse note, and context are scored as review inputs, not evidence verification. |
| Publishing | No ingestion adapter may publish a resource, approve a source, create a relationship, or override a duplicate decision. |

External-source ingestion requires an approved adapter, documented source terms, request limits, attribution mapping, a review queue, and a rollback/audit plan before it is enabled. The current adapter contract contains no outbound fetcher and no active external connection.
