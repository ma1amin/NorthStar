# NorthStar Operations Runbook

| Control | Current practice |
|---|---|
| Verification gate | GitHub Actions runs formatting-sensitive diff checks, TypeScript, and Vitest on `main` and pull requests. |
| Schema change | Update Drizzle schema, generate SQL, review migration, apply once through the managed database migration process, then verify tables and constraints. |
| Secrets | Use the managed secret store only. Never commit `.env`, tokens, database URLs, OAuth material, or plaintext API keys. |
| Health | Check build diagnostics and development logs; published runtime investigation uses the platform production-log facility. |
| Backup and restore | Database recovery is provider-managed. Before destructive schema work, take a project checkpoint and review migration reversibility; never assume a local database dump is a recovery plan. |
| Incident response | Disable affected API keys or scheduled jobs, preserve audit evidence, assess affected data, apply a tested fix, checkpoint, and document the remediation. |
| Daily freshness job | Active project-level Heartbeat: `northstar-freshness-review`, task UID `Y69yUd37Mc7cTNqzaXsupG`, daily at 03:00 UTC, callback `/api/scheduled/freshness-review`. The job is review-only and never changes public resource metadata. |

The application intentionally does not claim distributed tracing, uptime alerting, scheduled production backups, or completed load-test baselines. Those require a production observability configuration and owner-approved service settings.
