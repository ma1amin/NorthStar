# Current QA Notes

## Locale and RTL Shell — 2026-08-11

The `/welcome` route was visually checked in the active preview in English and after switching to Arabic. The locale toggle persists within the browser session, flips the document direction, mirrors the primary navigation and onboarding card order, and keeps the header controls readable.

The check also identified a deliberate follow-up: the shared shell labels are translated, while the longer welcome, profile, and moderator content still needs Arabic copy. That copy work remains in the active bilingual-experience task and is not represented as complete by this note.

## Administrator Command Center — 2026-08-11

The browser preview could not visually inspect `/admin` because the sandbox session reached a CAPTCHA and the available signed-in context did not expose moderator privileges. The access-denied state remained readable. The command-center layout is therefore verified by TypeScript and component review only; privileged browser QA remains a final acceptance item that requires a valid moderator session.

## Experience refinement browser verification — 2026-08-12

The refreshed public shell loaded successfully at the active preview URL. The landing page rendered the branded NorthStar navigation, relationship-aware search prompt, graph-oriented feature cards, gradient visual treatment, and accessible skip link. The page was also observed with Arabic locale state persisted from the browser session; navigation labels switched to Arabic and the direction-aware layout rendered without a blocking runtime error.

The unauthenticated `/profile` route rendered the localized sign-in guard in Arabic, including a clear sign-in action and an escape route back to resource discovery. The route remained available without authentication and did not redirect unexpectedly. Privileged moderation QA is still pending because the current browser session is unauthenticated; no claim is made about authenticated admin rendering until a valid moderator/admin session is available.

Automated verification after the refinement changes: `pnpm check` passed and `pnpm test` passed with 13 test files and 73 tests.

## Privileged Browser QA and CAPTCHA Limitation — 2026-08-12

Privileged moderation browser QA for `/admin` could not be completed because the preview session encountered a CAPTCHA and lacked an authenticated administrator session. In accordance with honest release practices, this limitation is documented explicitly rather than fabricating visual inspection. Authorization security, role checks, and command-center procedures remain fully covered by automated Vitest integration tests (13 test files, 73 tests passing) and TypeScript checks (`pnpm check` clean).

## UI/UX Refinement Browser Verification — 2026-08-12

Preview URL: https://3000-ist3xnc5ujjxf46o35jkj-7ddd2839.sg1.manus.computer

The refreshed Home route visually verified the new NorthStar shell, elevated translucent header, stronger landing-page typography, gradient/glow badge, relationship-aware search widget, resource-node preview, discovery path cards, and mobile-aware navigation controls. The public landing experience now presents a clearer visual hierarchy and more intentional relationship-centric styling.

The refreshed Browse route rendered the new resource-directory header and filter workspace. The desktop view shows a sticky filter column, visible search/pricing/tag controls, grid/list controls, and resource results with a clear information hierarchy. During the first data load, the skeleton cards and “Showing 0 of 0 resources” state were visible without layout shift; the loaded page then exposed the approved resource cards and category filters. No blocking runtime error was observed in the refreshed public routes.

The refreshed Search route visually verified a centered relationship-intent hero, compact search shell, prompt chips, and two-column empty-state cards for live trends and common graph queries. The Graph Explorer entry route visually verified a search-first knowledge-graph header with accessible copy and a clean bounded surface ready for node selection. Both routes retained the shared navigation, sign-in, language switcher, and footer escape paths.

The refreshed Collections route visually verified the curated-knowledge header, count/status chips, prominent New collection CTA, and a stable loading state. The unauthenticated Submit route visually verified the elevated sign-in guard, human-review explanation, clear primary CTA, and Browse escape route. Both surfaces preserved the shared shell and responsive spacing.

The unauthenticated Profile guard rendered with the refined elevated card and clear sign-in/Browse actions. Switching the shell language to Arabic updated the primary navigation, sign-in controls, guard heading, supporting copy, and CTA direction; the RTL layout remained visually coherent in the preview. Footer utility labels remain English in this route and are documented as a low-priority localization follow-up rather than a blocker.

The Welcome route was verified in Arabic with RTL navigation, localized onboarding headline/body/CTA, and three balanced onboarding cards for profile, discovery, and contribution. The `/admin` route’s unauthenticated fallback content was available in the extracted page, but the browser preview again blocked the route behind CAPTCHA before a screenshot could be captured. Privileged moderation interaction remains unverified; automated authorization and full Vitest coverage remain the source of truth for access control.

The Figma Node View verified the refreshed relationship-first layout: compact resource identity header, graph connection badges, action strip, metadata summary, relationship tabs, empty-state card, community feedback, and collection organization panels. The Figma Graph Explorer detail route exposed the bounded map, focus node, adjacent Notion node, and accessible Integrates With list with verified strength and direction context. The map briefly showed a loading state during navigation and then resolved to semantic graph content without a blocking error.

## Priority Remediation Localization Verification — 2026-08-12

Arabic RTL verification on `/submit` confirmed the protected contribution guard uses localized heading, explanatory copy, sign-in action, and Browse recovery action without disrupting the event-driven sign-in flow. Arabic RTL verification on `/browse` confirmed the localized directory header, filter labels, pricing choices, sort controls, result summary, and responsive filter rail render without visible overflow.

The global footer remains English by project instruction. Remaining low-priority localization follow-up includes the command-palette trigger, a sample tag placeholder, and display data supplied by resource records rather than interface copy.

## Resource Trust Context and Data-Quality Foundation — 2026-08-12

The Figma Resource Detail route was browser-verified in Arabic RTL mode after the data-quality release. The new trust-context card renders without exposing private moderation records and shows localized empty states when no approved evidence, public history, or freshness review exists.

TypeScript validation and the full Vitest suite passed after the provenance, history, freshness, and duplicate-alias contracts were added: 13 files and 77 tests passed. The non-destructive database migration was verified against the live schema: the four new data-quality tables, the `resources.canonicalResourceId` alias column, and the four shortened duplicate-resolution foreign-key constraints are present.

Privileged moderator interaction remains unverified in the browser because the preview environment’s CAPTCHA restriction persists. Router-level authorization and audit coverage is the current verification evidence for source review, freshness recording, and duplicate alias confirmation.
