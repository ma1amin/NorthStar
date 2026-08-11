# Security Policy

## Reporting a Vulnerability

Do not open a public issue for a suspected vulnerability. Contact the project owner privately with a concise reproduction, affected surface, impact assessment, and any mitigation already tested. Please avoid accessing data that is not necessary to demonstrate the issue.

## Security Principles

NorthStar treats all input as untrusted. Authentication, role-based authorization, audit logging, validation, network-safe URL metadata fetching, moderation, and rate-sensitive public surfaces are security-critical areas. Never commit secrets, OAuth tokens, database URLs, live exports, user data, audit logs, or screenshots containing private information.

## Supported Work

Security fixes are prioritised for the current default branch. Dependency upgrades, migration changes, and changes to authentication, authorization, moderation, or URL fetching require regression coverage before release.
