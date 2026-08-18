import type { ArchiveCandidateEvidenceField, ArchiveCandidateFieldProposal } from "./db";

type CandidateMetadata = {
  title?: string | null;
  description?: string | null;
  canonicalUrl?: string | null;
  officialSourceUrl?: string | null;
};

type PublicMetadata = {
  url: string;
  canonicalUrl?: string | null;
  title?: string | null;
  description?: string | null;
};

function normalized(value?: string | null) {
  return value?.trim() || undefined;
}

function differs(current?: string | null, proposal?: string | null) {
  return Boolean(normalized(proposal) && normalized(current) !== normalized(proposal));
}

/**
 * Creates only reviewable, source-backed deltas. Category, tags, pricing,
 * license, builder, and relationships are intentionally excluded: public-page
 * metadata alone is not sufficient evidence to infer those fields.
 */
export function buildArchiveEvidenceProposals(input: { candidate: CandidateMetadata; metadata: PublicMetadata; retrievedAt: Date }): ArchiveCandidateFieldProposal[] {
  const sourceUrl = normalized(input.metadata.canonicalUrl) ?? input.metadata.url;
  const values: Array<{ field: ArchiveCandidateEvidenceField; currentValue?: string | null; proposedValue?: string | null; extractionMethod: "public_page_metadata" | "canonical_redirect" }> = [
    { field: "title", currentValue: input.candidate.title, proposedValue: input.metadata.title, extractionMethod: "public_page_metadata" },
    { field: "description", currentValue: input.candidate.description, proposedValue: input.metadata.description, extractionMethod: "public_page_metadata" },
    { field: "canonical_url", currentValue: input.candidate.canonicalUrl, proposedValue: sourceUrl, extractionMethod: input.metadata.canonicalUrl ? "canonical_redirect" : "public_page_metadata" },
    { field: "official_source_url", currentValue: input.candidate.officialSourceUrl, proposedValue: sourceUrl, extractionMethod: "public_page_metadata" },
  ];

  return values
    .filter((value): value is typeof value & { proposedValue: string } => differs(value.currentValue, value.proposedValue))
    .map((value) => ({
      field: value.field,
      currentValue: value.currentValue,
      proposedValue: value.proposedValue.trim(),
      evidenceUrl: sourceUrl,
      extractionMethod: value.extractionMethod,
      retrievedAt: input.retrievedAt,
    }));
}
