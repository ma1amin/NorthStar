import { describe, expect, it } from "vitest";
import { canActivateIntegration } from "./integrations";
describe("integration consent boundary", () => it("requires credential, consent, destination, and scope", () => {
  expect(canActivateIntegration({ channel: "slack" }, true)).toBe(false);
  expect(canActivateIntegration({ channel: "slack", consentedAt: new Date(), destination: "C123", scopes: ["resource:share"] }, true)).toBe(true);
}));
