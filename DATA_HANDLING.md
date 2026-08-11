# Data Handling and Seed Policy

NorthStar’s source repository contains code, schema, reviewed migrations, documentation, and a reproducible **sanitized** seed script. It must never contain a database dump, a connection string, production-like user data, audit logs, real moderation records, session data, API keys, OAuth material, or any other sensitive export.

The seed script creates a clearly labelled synthetic curator account and public-style sample categories, tags, and resources. It only runs when `NORTHSTAR_ALLOW_SEED=1` is supplied explicitly, and it is designed for a local disposable database. Review the script before use and do not point it at a shared or production-like database.

Resource data should be treated as claims, not truth by default. Relationship evidence, contribution history, reports, and moderation outcomes require separate quality and retention rules; their live records are not source-control artifacts.
