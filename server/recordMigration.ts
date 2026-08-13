export type RecordMigrationPreview = { allowed: boolean; idempotent: boolean; collisions: string[]; rollbackPlan: string; auditRequired: boolean };

/** NorthStar preserves duplicate nodes as aliases; this preview forbids destructive community-record migration. */
export function previewRecordMigration(input: { duplicateResourceId: number; canonicalResourceId: number; canonicalAlreadySet?: boolean; affectedCollectionRecords?: number; affectedVoteRecords?: number }): RecordMigrationPreview {
  const collisions: string[] = [];
  if (input.duplicateResourceId === input.canonicalResourceId) collisions.push("A resource cannot migrate to itself.");
  if ((input.affectedCollectionRecords ?? 0) > 0 || (input.affectedVoteRecords ?? 0) > 0) collisions.push("Community records are preserved and are not rewritten by alias confirmation.");
  return { allowed: collisions.length === 0, idempotent: Boolean(input.canonicalAlreadySet), collisions, rollbackPlan: "Cancel the pending proposal before confirmation; confirmed aliases require a separate audited corrective proposal.", auditRequired: true };
}
