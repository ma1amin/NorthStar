export type IntegrationChannel = "browser_extension" | "telegram" | "whatsapp" | "discord" | "slack";
export type IntegrationRequest = { channel: IntegrationChannel; consentedAt?: Date; destination?: string; scopes?: string[] };

/** Configuration guard only: no provider credential, user consent, and destination means no outbound action. */
export function canActivateIntegration(request: IntegrationRequest, hasProviderCredential: boolean) {
  return Boolean(hasProviderCredential && request.consentedAt && request.destination?.trim() && request.scopes?.length);
}

export const supportedIntegrationChannels: IntegrationChannel[] = ["browser_extension", "telegram", "whatsapp", "discord", "slack"];
