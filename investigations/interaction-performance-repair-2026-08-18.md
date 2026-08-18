# Interaction and Performance Repair QA — 2026-08-18

## Scope

This repair addresses the reported black primary-navigation selection, duplicate moderation return controls, slow-feeling approval feedback, static graph presentation, generic route loading, and oversized headings.

| Area | Delivered change | Verification evidence |
|---|---|---|
| Primary navigation | The active route now uses a light sky surface, dark readable text, focus treatment, `aria-current`, and a short route-progress indicator. The prior black `bg-slate-950 text-white` active style was removed. | Source review and production build completed. |
| Moderation return navigation | The layout-level `/admin/*` back-control injection was removed. Targeted moderation child pages retain one shared blue `ModerationBackLink`. | `server/moderationNavigation.test.ts` checks every target page and prevents reintroduction from `AppLayout`. |
| Approval responsiveness | Approval retains its transaction-local tag resolution, claim, resource creation, and audit boundaries. Tag lookup is batched, resource-tag writes are batched, and audit/reputation writes run concurrently after the transaction. The UI hides only the resolved submission row immediately and refreshes the queue without forcing the published-resources list to refetch. | Core approval integration suite covers valid transaction-local tags; the returned `approvalDurationMs` supports operational timing visibility. |
| Graph explorer | The Vercel graph now supports zoom controls, pointer pan, wheel zoom, keyboard pan/zoom/reset, selected-node feedback, evidence links, and an accessible relationship list. | Browser verification loaded `/graph/vercel`; zoom changed from 100% to 112% and verified relationships remained visible. |
| Loading and typography | A page-shaped route fallback, graph-specific loading shell, primary-route prefetch on pointer/focus, and compact responsive heading tokens are active. | Production build completed; reduced-motion protection remains global. |

## Automated Validation

The final validation passed `pnpm check`, the full Vitest suite, `pnpm build`, and `git diff --check`. Focused coverage includes graph viewport bounds/panning, primary route activity, transaction-local tag approval, and no duplicate global moderation return control.

## Browser Verification Boundary

The public preview was checked read-only. Graph navigation and zoom were exercised on the verified Vercel neighborhood. An authenticated moderation-action walkthrough was not performed in this pass, so no submission was approved, rejected, published, or altered during browser QA.
