import { describe, expect, it } from "vitest";
import { buildIntakeCandidates, extractIntakeUrls, MAX_INTAKE_CANDIDATES } from "./intake";

describe("intake extraction", () => {
  it("normalizes, deduplicates, and strips fragments from contributor-provided URLs", () => {
    expect(extractIntakeUrls("See https://example.com/a#section and https://example.com/a.")).toEqual(["https://example.com/a"]);
  });

  it("bounds candidate production", () => {
    const text = Array.from({ length: MAX_INTAKE_CANDIDATES + 4 }, (_, index) => `https://example.com/${index}`).join(" ");
    expect(buildIntakeCandidates(text)).toHaveLength(MAX_INTAKE_CANDIDATES);
  });
});
