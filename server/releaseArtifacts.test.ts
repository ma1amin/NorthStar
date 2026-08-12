import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");

describe("open-source release artifacts", () => {
  it("ships the required project and community documentation", () => {
    for (const filename of ["README.md", "LICENSE", "CONTRIBUTING.md", "CODE_OF_CONDUCT.md", "SECURITY.md", "GOVERNANCE.md", "ARCHITECTURE.md", "API.md", "DATA_HANDLING.md", "ENVIRONMENT.md", "SPECIFICATION_GAP_AUDIT.md", "PROJECT_POLICY.md"]) {
      expect(readFileSync(resolve(root, filename), "utf8").trim().length, filename).toBeGreaterThan(80);
    }
  });

  it("requires an explicit local-only acknowledgement before sanitized seeding", () => {
    const seed = readFileSync(resolve(root, "scripts/seed-sanitized.mjs"), "utf8");
    expect(seed).toContain('process.env.NORTHSTAR_ALLOW_SEED !== "1"');
    expect(seed).toContain("No live data was exported or imported");
    expect(seed).not.toContain("SELECT * FROM");
  });
});
