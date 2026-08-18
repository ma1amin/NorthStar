import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const targetedPages = [
  "AdminAIDrafts.tsx",
  "AdminArchiveBulkReview.tsx",
  "AdminArchiveGovernance.tsx",
  "AdminArchiveImports.tsx",
  "AdminBulk.tsx",
  "AdminEditSuggestions.tsx",
  "AdminReports.tsx",
  "AdminUsers.tsx",
  "SearchQuality.tsx",
];

describe("moderation return navigation", () => {
  it("uses one shared moderation dashboard control on every targeted child page", () => {
    for (const page of targetedPages) {
      const source = fs.readFileSync(path.join(projectRoot, "client", "src", "pages", page), "utf8");
      expect(source, page).toContain('ModerationBackLink');
      expect(source, page).not.toContain('setLocation("/admin")');
      expect(source, page).not.toContain("Back to Archive Imports");
    }
  });

  it("does not inject a second dashboard return control from the global layout", () => {
    const layout = fs.readFileSync(path.join(projectRoot, "client", "src", "components", "AppLayout.tsx"), "utf8");
    expect(layout).not.toContain('location.startsWith("/admin/")');
    expect(layout).not.toContain("Moderation dashboard");
  });
});
