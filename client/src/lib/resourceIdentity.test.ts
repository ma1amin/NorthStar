import { describe, expect, it } from "vitest";
import { getVerifiedLogoUrl } from "./resourceIdentity";

describe("getVerifiedLogoUrl", () => {
  it("accepts public HTTP and HTTPS logo URLs", () => {
    expect(getVerifiedLogoUrl("https://cdn.example.org/logo.svg")).toBe("https://cdn.example.org/logo.svg");
    expect(getVerifiedLogoUrl("http://assets.example.org/icon.png")).toBe("http://assets.example.org/icon.png");
  });

  it("withholds malformed, credential-bearing, and unsupported icon URLs", () => {
    expect(getVerifiedLogoUrl("not a url")).toBeUndefined();
    expect(getVerifiedLogoUrl("data:image/svg+xml,unsafe")).toBeUndefined();
    expect(getVerifiedLogoUrl("https://user:secret@example.org/logo.png")).toBeUndefined();
    expect(getVerifiedLogoUrl(null)).toBeUndefined();
  });
});
