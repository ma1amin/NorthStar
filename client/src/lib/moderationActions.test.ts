import { describe, expect, it } from "vitest";
import { getModerationActionKey, isModerationActionPending, isModerationEntityPending } from "./moderationActions";

describe("moderation action state", () => {
  it("keeps a pending state scoped to one record and one action", () => {
    const active = getModerationActionKey("submission", 18, "approve");
    const pending = [active];
    expect(isModerationActionPending(pending, active)).toBe(true);
    expect(isModerationActionPending(pending, getModerationActionKey("submission", 19, "approve"))).toBe(false);
    expect(isModerationActionPending(pending, getModerationActionKey("submission", 18, "reject"))).toBe(false);
    expect(isModerationActionPending(pending, getModerationActionKey("relationship", 18, "approve"))).toBe(false);
  });

  it("locks sibling decisions for the same row without presenting pending feedback on other source rows", () => {
    const active = getModerationActionKey("source", 42, "approve");
    const pending = [active];
    expect(isModerationEntityPending(pending, getModerationActionKey("source", 42, "reject"))).toBe(true);
    expect(isModerationEntityPending(pending, getModerationActionKey("source", 43, "approve"))).toBe(false);
    expect(isModerationActionPending(pending, getModerationActionKey("source", 42, "reject"))).toBe(false);
  });
});
