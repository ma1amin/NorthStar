# Moderation Action Responsiveness Repair — 2026-08-18

## Defect

The dashboard used one global pending-action value. This allowed stale event timing to make moderation controls look coordinated across unrelated rows, while it also blocked new actions globally rather than at the reviewed record. Source-review completion performed history and audit writes sequentially after the decision.

## Repair

The dashboard now tracks action keys per moderation entity. A click locks only the action row being decided, shows the spinner only on the exact selected action, and immediately removes the resolved submission, relationship, or source from its visible queue while the relevant queue refresh reconciles in the background. A reference-backed entity lock prevents concurrent conflicting choices on the same record without affecting unrelated records.

Source review retains its conditional moderator decision, resource history, and audit record. The independent history and audit writes now run concurrently after the decision. The mutation returns `reviewDurationMs`; submission approval already returns `approvalDurationMs`.

## Validation

`client/src/lib/moderationActions.test.ts` verifies action-versus-row behavior, including the guarantee that a pending source approval does not show pending feedback for another source or the sibling reject action. `server/core.integration.test.ts` verifies the source-review history/audit path with timing metadata. TypeScript, the full Vitest suite, production build, and whitespace validation passed. No moderation mutation was issued during this repair’s browser QA.
