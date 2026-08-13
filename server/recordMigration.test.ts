import { describe, expect, it } from "vitest";
import { previewRecordMigration } from "./recordMigration";
describe("record migration preview", () => it("identifies self-migration and community-record collision boundaries", () => {
  expect(previewRecordMigration({ duplicateResourceId: 1, canonicalResourceId: 1 })).toMatchObject({ allowed: false, auditRequired: true });
  expect(previewRecordMigration({ duplicateResourceId: 1, canonicalResourceId: 2, affectedVoteRecords: 3 })).toMatchObject({ allowed: false, collisions: [expect.stringContaining("Community records")] });
}));
