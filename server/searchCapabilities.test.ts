import { describe, expect, it } from "vitest";
import { getSearchCapabilities } from "./searchCapabilities";

describe("search capabilities", () => {
  it("reports the current relational provider without overstating semantic or external-provider availability", () => {
    expect(getSearchCapabilities()).toEqual({
      activeProvider: "relational",
      supportedModes: ["lexical"],
      semanticSearchEnabled: false,
      externalProviderConfigured: false,
      semanticIndexStatus: "not_configured",
      semanticProviderId: null,
    });
  });
});
