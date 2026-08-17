import { describe, expect, it } from "vitest";
import { shouldServeStaticClient } from "./previewMode";

describe("shouldServeStaticClient", () => {
  it("uses the static bundle in production", () => {
    expect(shouldServeStaticClient("production", undefined)).toBe(true);
  });

  it("uses the static bundle for the managed preview when explicitly enabled", () => {
    expect(shouldServeStaticClient("development", "true")).toBe(true);
  });

  it("keeps Vite middleware available only for explicit local development", () => {
    expect(shouldServeStaticClient("development", undefined)).toBe(false);
  });
});
