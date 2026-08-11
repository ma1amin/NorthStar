# Contributing to NorthStar

NorthStar welcomes contributions that improve discovery, data quality, graph intelligence, accessibility, and community trust. Before opening substantial work, create or join an issue that explains the user problem, expected behaviour, data-quality impact, and test approach.

## Local Workflow

Install dependencies with `pnpm install`. Configure private local values as described in [ENVIRONMENT.md](./ENVIRONMENT.md). Apply reviewed migrations with `pnpm db:push`, then run the explicitly guarded sample seed with `NORTHSTAR_ALLOW_SEED=1 pnpm db:seed` if you need disposable sample data. The seed is idempotent and is not an export of project data.

Every change must keep `pnpm check` and `pnpm test` green. New product logic requires tests at the appropriate level: pure logic through unit tests, tRPC contracts through integration tests, and critical interactive paths through browser/end-to-end coverage. Never add a fabricated review, testimonial, rating, adoption claim, relationship, or moderation signal to fixtures or product copy.

## Pull Requests

Use focused commits and explain the user-facing effect, schema changes, migration safety, accessibility considerations, test evidence, and documentation updates. Resource and relationship changes must preserve human moderation. Do not introduce credentials, environment files, production database data, personally identifiable user data, audit history, downloaded assets, or build output into a pull request.

## Community Expectations

Participate constructively, respect good-faith review, disclose uncertainty in data claims, and follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Security issues must follow [SECURITY.md](./SECURITY.md), not public issue threads.
