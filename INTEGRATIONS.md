# Consent-First Ecosystem Integrations

NorthStar defines foundations for a browser extension and Telegram, WhatsApp, Discord, and Slack integrations. None is configured or active in this release; no provider credential, connector, webhook, bot, outbound message, or user data transfer is created automatically.

Activation requires an explicit user consent timestamp, a user-selected destination, least-privilege scope selection, a provider credential stored in managed secrets, and end-to-end testing. The browser extension must use the versioned read-only API and never collect browsing history without a separately documented user permission.
