import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const manifestPath = new URL("../curation/github-topic-candidates.json", import.meta.url);
const systemOpenId = "northstar-curation-system";

const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
if (!Array.isArray(manifest.candidates) || manifest.candidates.length !== 200) throw new Error("Expected a 200-candidate curation manifest");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const summary = { inserted: 0, duplicate: 0, categoryCounts: {} };

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

  console.log(JSON.stringify({ source: "GitHub public repository metadata", manifestCandidates: manifest.candidates.length, ...summary, publication: "none; all inserted records remain pending human moderation" }, null, 2));
} finally {
  await connection.end();
}
