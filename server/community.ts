export const REPUTATION_RULES = {
  approvedResource: 10,
  approvedRelationship: 5,
  resourceUpvote: 1,
  relationshipUpvote: 1,
} as const;

export type CollectionVisibility = {
  ownerId: number;
  isPublic: boolean;
};

export function canViewCollection(collection: CollectionVisibility, viewerId?: number) {
  return collection.isPublic || collection.ownerId === viewerId;
}

export function normalizeProfileUpdate(input: { name?: string; bio?: string; avatar?: string }) {
  const update: { name?: string | null; bio?: string | null; avatar?: string | null } = {};
  if (input.name !== undefined) update.name = input.name.trim() || null;
  if (input.bio !== undefined) update.bio = input.bio.trim() || null;
  if (input.avatar !== undefined) update.avatar = input.avatar.trim() || null;
  return update;
}

export function collectionSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "collection";
}
