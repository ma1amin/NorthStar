# Vote Query Regression QA — 2026-08-18

The reported error was traced to `votes.getResourceVote` and `votes.getRelationshipVote` returning `undefined` when the authenticated user had no recorded vote. React Query rejects undefined query results.

The server contract now normalizes an absent vote to explicit `null` in both the shared database helper and public protected query handlers. A focused tRPC integration test calls both handlers with an undefined helper result and verifies `null` is returned.

A read-only Vercel Resource Node View navigation was started after rebuilding the preview. The initial loading skeleton appeared; a My Browser extension HTTP 504 prevented the settled-state capture. No vote, account, moderation, or content action was attempted. The integration regression is the primary verification for this repair.
