import "dotenv/config";
import { writeFile } from "node:fs/promises";
import { getPiiFreeArchiveImportBatch } from "../server/db.ts";

const batchId = Number(process.argv[2] ?? "1");
const outputPath = process.argv[3] ?? `ARCHIVE_IMPORT_BATCH_${batchId}_INVENTORY.md`;
const contactMarker = /(@|%40|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+?\d[\d\s().-]{7,}\d))/i;

const result = await getPiiFreeArchiveImportBatch(batchId);
if (!result) throw new Error("Archive import batch was not found");

const candidates = result.candidates.filter((candidate) => !contactMarker.test(`${candidate.url}\n${candidate.canonicalUrl ?? ""}\n${candidate.officialSourceUrl ?? ""}`));
const safeUrl = (value) => value ? `<${value}>` : "—";
const rows = candidates.map((candidate, index) => [
  index + 1,
  safeUrl(candidate.url),
  safeUrl(candidate.officialSourceUrl ?? candidate.canonicalUrl),
  candidate.status === "review_ready" ? "Metadata available / human review required" : "Public-page metadata unavailable / human review required",
].join(" | "));

const markdown = `# Archive Import Batch ${batchId} — PII-Screened Resource Inventory

## Purpose and privacy boundary

This inventory lists the **stored resource candidates** extracted from the owner-supplied archive after PII screening. It intentionally excludes source chat text, names, phone numbers, email addresses, sender details, timestamps, file metadata, forwarded-message commentary, and descriptions/titles. The links below are public resource URLs and, where available, the public webpage used for metadata enrichment.

## Aggregate outcome

| Measure | Count |
| --- | ---: |
| URL mentions scanned | ${result.batch.totalUrlMentions} |
| Stored PII-screened candidates | ${result.batch.uniqueCandidates} |
| Unsafe, invalid, duplicate, or privacy-excluded mentions | ${result.batch.rejectedUrlMentions} |
| Candidates listed in this document | ${candidates.length} |
| Candidates withheld from this document after export screening | ${result.candidates.length - candidates.length} |

## How to read the source fields

The **Extracted resource URL** is the original public URL that passed intake safety checks. The **Public-page enrichment source** is the final safe webpage URL used to retrieve metadata; it may be blank when the website could not be fetched within safety/time limits. Every candidate remains review-only. A source URL is **evidence for moderator review**, not an approval or a claim that the linked resource is accurate, safe, or suitable for publication.

## Candidate inventory

| # | Extracted resource URL | Public-page enrichment source | Review state |
| ---: | --- | --- | --- |
${rows.join("\n")}

## Where sources are stored in NorthStar

The candidate-level source is stored in the **archive_import_candidates.officialSourceUrl** field; the canonical URL, when available, is stored in **archive_import_candidates.canonicalUrl**. These values are not yet visible in the general Resource Node View because this batch contains unapproved candidates, not public resources. Once a moderator explicitly approves a candidate through the standard moderation workflow, the public resource can receive a reviewed **resource_sources** evidence record.
`;

await writeFile(outputPath, markdown, "utf8");
console.log(JSON.stringify({ batchId, listedCandidates: candidates.length, withheldCandidates: result.candidates.length - candidates.length, outputPath }));
