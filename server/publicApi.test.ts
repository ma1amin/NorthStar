import { describe, expect, it } from "vitest";
import { extractApiKey, hashApiKey, OPENAPI_DOCUMENT, parseBoundedInt } from "./publicApi";

describe("public API contract boundaries", () => {
  it("accepts explicit X-API-Key values and bearer credentials without exposing parsing ambiguity", () => {
    expect(extractApiKey({ headers: { "x-api-key": "ns_live_direct" } } as any)).toBe("ns_live_direct");
    expect(extractApiKey({ headers: { authorization: "Bearer ns_live_bearer" } } as any)).toBe("ns_live_bearer");
    expect(extractApiKey({ headers: { authorization: "Basic credentials" } } as any)).toBeUndefined();
  });

  it("hashes the same plaintext deterministically and never returns the plaintext as a stored representation", () => {
    const key = "ns_live_example";
    expect(hashApiKey(key)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashApiKey(key)).toBe(hashApiKey(key));
    expect(hashApiKey(key)).not.toContain(key);
  });

  it("bounds untrusted pagination and publishes only versioned read endpoints in OpenAPI", () => {
    expect(parseBoundedInt("25", 20, 1, 100)).toBe(25);
    expect(parseBoundedInt("1000", 20, 1, 100)).toBe(20);
    expect(parseBoundedInt("-2", 20, 1, 100)).toBe(20);
    expect(OPENAPI_DOCUMENT.openapi).toBe("3.1.0");
    expect(Object.keys(OPENAPI_DOCUMENT.paths)).toEqual(expect.arrayContaining(["/resources", "/resources/{slug}", "/search", "/categories", "/collections"]));
    expect(JSON.stringify(OPENAPI_DOCUMENT.paths)).not.toContain("post");
  });
});
