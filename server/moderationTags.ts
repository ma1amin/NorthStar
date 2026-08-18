export type ModerationTag = {
  name: string;
  slug: string;
};

/**
 * Converts a stored submission tag payload into a bounded, deterministic set
 * of tag names. Database resolution intentionally happens inside the calling
 * moderation transaction, never in this pure helper.
 */
export function normalizeModerationTags(value: unknown): ModerationTag[] {
  if (!Array.isArray(value)) return [];

  const unique = new Map<string, ModerationTag>();
  for (const entry of value) {
    if (typeof entry !== "string") continue;
    const name = entry.trim().replace(/\s+/g, " ");
    if (!name) continue;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    if (!unique.has(slug)) unique.set(slug, { name, slug });
  }

  return Array.from(unique.values()).slice(0, 20);
}
