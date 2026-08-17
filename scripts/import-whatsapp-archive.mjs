import "dotenv/config";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { extractResourceCandidatesFromArtifact, sanitizePublicResourceMetadata } from "../server/resourceIntake.ts";
import {
  checkDuplicateByUrl,
  createPiiFreeArchiveImportBatch,
  updatePiiFreeArchiveCandidateEnrichment,
  getPiiFreeArchiveImportBatch,
} from "../server/db.ts";
import { fetchResourceMetadata } from "../server/urlMetadata.ts";

const archivePath = process.argv[2];
if (!archivePath) throw new Error("Usage: tsx scripts/import-whatsapp-archive.mjs <archive.zip>");

const archiveBuffer = await readFile(archivePath);
try {
  const parsed = await extractResourceCandidatesFromArtifact({ filename: "chat-export.zip", data: archiveBuffer });
  const batchId = await createPiiFreeArchiveImportBatch({
    totalUrlMentions: parsed.totalUrlMentions,
    rejectedUrlMentions: parsed.rejectedUrlMentions,
    candidates: parsed.candidates.map((url) => ({
      candidateHash: createHash("sha256").update(url).digest("hex"),
      url,
      officialSourceUrl: url,
      status: "review_ready",
    })),
  });

  const batch = await getPiiFreeArchiveImportBatch(batchId);
  if (!batch) throw new Error("Newly created import batch could not be found");

  let enriched = 0;
  let duplicates = 0;
  let failed = 0;
  const queue = [...batch.candidates];
  const workers = Array.from({ length: 5 }, async () => {
    while (queue.length) {
      const candidate = queue.shift();
      if (!candidate) return;
      try {
        const duplicate = await checkDuplicateByUrl(candidate.url);
        if (duplicate) {
          await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, duplicateResourceId: duplicate.id, status: "duplicate" });
          duplicates += 1;
          continue;
        }
        const metadata = await fetchResourceMetadata(candidate.url);
        await updatePiiFreeArchiveCandidateEnrichment({
          candidateId: candidate.id,
          canonicalUrl: metadata.canonicalUrl ?? metadata.url,
          title: sanitizePublicResourceMetadata(metadata.title, 255),
          description: sanitizePublicResourceMetadata(metadata.description, 5000),
          officialSourceUrl: metadata.canonicalUrl ?? metadata.url,
          status: "review_ready",
        });
        enriched += 1;
      } catch {
        await updatePiiFreeArchiveCandidateEnrichment({ candidateId: candidate.id, status: "failed", failureCode: "metadata_unavailable" });
        failed += 1;
      }
    }
  });
  await Promise.all(workers);

  // No source artifact, raw message text, contact data, filename, or candidate URL
  // is emitted to stdout. The only retained data is the PII-free review batch.
  console.log(JSON.stringify({ batchId, totalUrlMentions: parsed.totalUrlMentions, uniqueCandidates: parsed.candidates.length, rejectedUrlMentions: parsed.rejectedUrlMentions, enriched, duplicates, failed, personalDataRetained: false, sourceContextRetained: false }));
} finally {
  archiveBuffer.fill(0);
}
