# Local Environment Configuration

NorthStar requires a private local environment configuration. Do not commit `.env`, connection strings, OAuth credentials, tokens, cookies, or other sensitive values.

| Variable | Purpose | Local guidance |
| --- | --- | --- |
| `DATABASE_URL` | MySQL/TiDB connection for local development | Use a disposable local database and never point seed work at shared data. |
| `JWT_SECRET` | Session-signing secret | Generate a long random value for local use. |
| `VITE_APP_ID` | OAuth application identifier | Obtain from the configured development application. |
| `OAUTH_SERVER_URL` | OAuth backend base URL | Use the development platform value. |
| `VITE_OAUTH_PORTAL_URL` | Browser sign-in portal | Use the development platform value. |

The managed deployment supplies its own environment configuration. Contributors should set private local values through their machine or approved secret manager, not source control.
