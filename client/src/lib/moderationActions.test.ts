import { describe, expect, it } from "vitest";
import { getModerationActionKey, isModerationActionPending } from "./moderationActions";

describe("moderation action state", () => {
  it("keeps a pending state scoped to one record and one action", () => {
    const active = getModerationActionKey("submission", 18, "approve");
    expect(isModerationActionPending(active, active)).toBe(true);
    expect(isModerationActionPending(active, getModerationActionKey("submission", 19, "approve"))).toBe(false);
    expect(isModerationActionPending(active, getModerationActionKey("submission", 18, "reject"))).toBe(false);
    expect(isModerationActionPending(active, getModerationActionKey("relationship", 18, "approve"))).toBe(false);
  });
});
