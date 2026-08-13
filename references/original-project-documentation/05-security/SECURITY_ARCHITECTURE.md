# NorthStar Security Architecture

## Security Principles

- Least privilege
- Zero trust for user input
- Defense in depth
- Auditability
- Secure defaults

## Required Controls

- Secure authentication
- RBAC
- Rate limiting
- Input validation
- Output encoding
- CSRF protection where applicable
- XSS protection
- Secure session management
- Audit logs
- Secrets management
- Dependency monitoring
- Secure file handling
- API abuse protection

## External Sources

Treat ingested content as untrusted. Never execute or render external content without appropriate sanitization.
