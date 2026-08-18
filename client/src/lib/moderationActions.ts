export type ModerationAction = "approve" | "reject" | "supersede";

export function getModerationActionKey(entity: "submission" | "relationship" | "source", entityId: number, action: ModerationAction): string {
  return `${entity}:${entityId}:${action}`;
}

export function getModerationEntityKey(actionKey: string): string {
  return actionKey.split(":").slice(0, 2).join(":");
}

export function isModerationActionPending(pendingActions: readonly string[], actionKey: string): boolean {
  return pendingActions.includes(actionKey);
}

export function isModerationEntityPending(pendingActions: readonly string[], actionKey: string): boolean {
  const entityKey = getModerationEntityKey(actionKey);
  return pendingActions.some((pendingAction) => getModerationEntityKey(pendingAction) === entityKey);
}
