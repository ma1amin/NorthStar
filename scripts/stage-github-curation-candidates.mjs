import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const manifestPath = new URL("../curation/github-topic-candidates.json", import.meta.url);
const systemOpenId = "northstar-curation-system";

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
if (!Array.isArray(manifest.candidates) || manifest.candidates.length !== 200) throw new Error("Expected a 200-candidate curation manifest");

const registerDefinitions = [
  { slug: "official-repositories-01", label: "Official repositories · 01", start: 0 },
  { slug: "official-repositories-02", label: "Official repositories · 02", start: 50 },
  { slug: "official-repositories-03", label: "Official repositories · 03", start: 100 },
  { slug: "official-repositories-04", label: "Official repositories · 04", start: 150 },
];

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const summary = { inserted: 0, duplicate: 0, categoryCounts: {}, registers: [] };

try {
  await connection.query(
    "INSERT INTO users (openId, name, email, loginMethod, role, reputation) VALUES (?, 'NorthStar curation', NULL, 'system', 'user', 0) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)",
    [systemOpenId],
  );
  const [[systemUser]] = await connection.query("SELECT id FROM users WHERE openId = ? LIMIT 1", [systemOpenId]);
  if (!systemUser?.id) throw new Error("Unable to resolve the non-personal system curation account");

  for (const candidate of manifest.candidates) {
    const [[existingResource]] = await connection.query("SELECT id FROM resources WHERE url = ? LIMIT 1", [candidate.url]);
    const [[existingSubmission]] = await connection.query("SELECT id FROM submissions WHERE url = ? LIMIT 1", [candidate.url]);
    if (existingResource || existingSubmission) {
      summary.duplicate += 1;
      continue;
    }
    await connection.query(
      "INSERT INTO submissions (submittedBy, title, url, description, categoryId, tags, pricing, sourceUrl, sourceType, license, suggestedRelationships, status) VALUES (?, ?, ?, ?, ?, ?, 'open_source', ?, 'repository', ?, JSON_ARRAY(), 'pending')",
      [systemUser.id, candidate.title, candidate.url, candidate.description, candidate.categoryId, JSON.stringify(candidate.tags), candidate.sourceUrl, candidate.license],
    );
    summary.inserted += 1;
    summary.categoryCounts[candidate.categorySlug] = (summary.categoryCounts[candidate.categorySlug] ?? 0) + 1;
  }

  for (const registerDefinition of registerDefinitions) {
    await connection.query(
      "INSERT INTO curation_registers (slug, label, targetSize, status, evidenceStandard) VALUES (?, ?, 50, 'staged', 'official repository primary evidence') ON DUPLICATE KEY UPDATE label = VALUES(label), targetSize = VALUES(targetSize), evidenceStandard = VALUES(evidenceStandard)",
      [registerDefinition.slug, registerDefinition.label],
    );
    const [[register]] = await connection.query("SELECT id FROM curation_registers WHERE slug = ? LIMIT 1", [registerDefinition.slug]);
    if (!register?.id) throw new Error(`Unable to resolve curation register ${registerDefinition.slug}`);

    await connection.query("DELETE FROM curation_register_entries WHERE registerId = ?", [register.id]);
    let mapped = 0;
    let linkedSubmissions = 0;
    for (const [offset, candidate] of manifest.candidates.slice(registerDefinition.start, registerDefinition.start + 50).entries()) {
      const [[submission]] = await connection.query("SELECT id FROM submissions WHERE (url = ? OR sourceUrl = ?) AND submittedBy = ? LIMIT 1", [candidate.url, candidate.sourceUrl, systemUser.id]);
      await connection.query(
        "INSERT INTO curation_register_entries (registerId, candidateUrl, submissionId, sequence) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE registerId = VALUES(registerId), sequence = VALUES(sequence), submissionId = VALUES(submissionId)",
        [register.id, candidate.url, submission?.id ?? null, offset + 1],
      );
      mapped += 1;
      if (submission?.id) linkedSubmissions += 1;
    }
    if (mapped !== 50) throw new Error(`Curation register ${registerDefinition.slug} mapped ${mapped}/50 candidate submissions`);
    summary.registers.push({ slug: registerDefinition.slug, targetSize: 50, stagedCount: mapped, linkedSubmissions });
  }

  console.log(JSON.stringify({ source: "GitHub public repository metadata", manifestCandidates: manifest.candidates.length, ...summary, publication: "none; all inserted records remain pending human moderation" }, null, 2));
} finally {
  connection.destroy();
}
