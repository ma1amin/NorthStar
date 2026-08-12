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
