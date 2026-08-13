export type IngestionSourceType = "official" | "documentation" | "repository" | "community" | "archive" | "other";
export type IngestionCandidate = { url: string; sourceType: IngestionSourceType; attribution?: string; licenseNote?: string; title?: string; summary?: string; adapterId: string };
export type IngestionAssessment = { accepted: boolean; score: number; reasons: string[] };
export type IngestionAdapter = { id: string; normalize: (input: unknown) => IngestionCandidate | undefined };

const sourceWeights: Record<IngestionSourceType, number> = { official: 45, documentation: 35, repository: 32, archive: 18, community: 12, other: 5 };

/** Evaluates provenance completeness only; it neither fetches nor verifies a claim and never publishes a resource. */
export function assessIngestionCandidate(candidate: IngestionCandidate): IngestionAssessment {
  const reasons: string[] = [];
  let score = sourceWeights[candidate.sourceType];
  let url: URL;
  try { url = new URL(candidate.url); } catch { return { accepted: false, score: 0, reasons: ["A valid HTTPS URL is required."] }; }
  if (url.protocol !== "https:") return { accepted: false, score: 0, reasons: ["Only HTTPS sources are eligible for review."] };
  if (candidate.attribution?.trim()) { score += 20; reasons.push("Attribution supplied."); } else reasons.push("Attribution missing.");
  if (candidate.licenseNote?.trim()) { score += 15; reasons.push("License or reuse note supplied."); } else reasons.push("License or reuse note missing.");
  if (candidate.title?.trim() && candidate.summary?.trim()) { score += 10; reasons.push("Context supplied."); } else reasons.push("Title or summary context missing.");
  return { accepted: score >= 40, score: Math.min(score, 100), reasons };
}
