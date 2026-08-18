export type ModerationAction = "approve" | "reject" | "supersede";

export function getModerationActionKey(entity: "submission" | "relationship" | "source", entityId: number, action: ModerationAction): string {
  return `${entity}:${entityId}:${action}`;
}

export function isModerationActionPending(pendingAction: string | null, actionKey: string): boolean {
  return pendingAction === actionKey;
}
