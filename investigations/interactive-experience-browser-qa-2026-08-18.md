# Interactive Experience Browser QA — 2026-08-18

| Surface | Outcome | Evidence |
| --- | --- | --- |
| Home featured resource | Pass | The public home route showed a loading skeleton first, then replaced it with live approved-resource content. Manual pause, direct resource selection, and previous/next controls were exposed. The observed resources included Vercel, Obsidian, Miro, GitHub, and Notion. |
| Profile menu | Pass | The authenticated menu opened with an opaque white surface, readable text, clear grouping, and visible Profile, Settings, Collections, Moderation, Search quality, Report triage, Bulk rejection, Edit suggestions, AI review drafts, User management, and Log out actions. No account action was taken. |
| Graph Explorer | Browser wait unavailable | Direct public API probes for `resources.getBySlug` and `graph.neighborhood` returned valid Vercel and approved graph data. The initial browser capture showed the route loading surface. Attempts to wait for the client to settle returned a My Browser extension HTTP 504, so the interactive visual walkthrough could not complete. No resource, relationship, moderation, or account action was performed. |
| Resource Node View | Browser wait unavailable | The initial Vercel route capture showed the intended loading skeleton. The corresponding public resource endpoint and batched resource/category request returned valid records. A My Browser extension HTTP 504 prevented the required settled-state capture. |

This record distinguishes verified browser outcomes, direct API evidence, and browser-extension limits. It does not assert a settled-state browser pass for the Graph Explorer or Resource Node View.
