# NorthStar Progressive Web Application

NorthStar provides a **progressive enhancement** for installation and resilient public navigation. It is not an offline-first write client and it never queues, replays, or caches authenticated or moderation mutations.

| Capability | Behavior |
|---|---|
| Manifest | `manifest.webmanifest` defines standalone launch, colors, and a maskable vector icon. |
| Registration | The service worker registers only in production builds; local development remains cache-free for reliable hot reload. |
| Public shell | The root shell, manifest, icon, and selected same-origin static assets are cached after a successful fetch. |
| Offline navigation | A cached public shell is tried first only after a failed navigation request; an explicit offline page is the fallback. |
| Live data | `/api/trpc`, `/v1`, storage URLs, sign-in, search requests, contributions, moderation, and API-key operations are excluded from service-worker caching. |
| Installation | Browsers that emit `beforeinstallprompt` show an accessible install action in the desktop navigation. |

> **Integrity boundary.** A cached shell is not evidence that resource data, search results, account state, freshness guidance, moderation queues, or API quotas are current. Network access remains required for all live and protected operations.

The service worker increments its cache name when shell-cache semantics change. It removes obsolete application-shell caches on activation. It does not use background sync, offline writes, or client-side mutation replay.
