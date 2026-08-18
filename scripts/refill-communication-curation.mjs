import fs from "node:fs/promises";
import mysql from "mysql2/promise";

const sourcePath = "/tmp/northstar-curation/developer-tools.json";
const systemOpenId = "northstar-curation-system";
const required = 2;

function stripAnsi(value) { return value.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, ""); }
function unsafe(value) { return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+?\d[\d\s().-]{7,}\d)|@[A-Za-z0-9_]{1,64}/i.test(value ?? ""); }
function text(value, maxLength) { const normalized = typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : ""; return normalized && !unsafe(normalized) ? normalized : undefined; }
function url(value) { try { const parsed = new URL(value); return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password && !unsafe(`${parsed.pathname}${parsed.search}${parsed.hash}`) ? parsed.toString() : undefined; } catch { return undefined; } }

const response = JSON.parse(stripAnsi(await fs.readFile(sourcePath, "utf8")));
const connection = await mysql.createConnection(process.env.DATABASE_URL);
const inserted = [];
try {
  const [[systemUser]] = await connection.query("SELECT id FROM users WHERE openId = ? LIMIT 1", [systemOpenId]);
  if (!systemUser?.id) throw new Error("System curation account does not exist");
  for (const repo of response.items ?? []) {
    if (inserted.length === required) break;
    const title = text(repo.name, 255); const description = text(repo.description, 5000); const sourceUrl = url(repo.html_url); const homepage = url(repo.homepage); const license = text(repo.license?.spdx_id, 255);
    if (!title || !description || !sourceUrl || !license || repo.owner?.type !== "Organization") continue;
    const [[exists]] = await connection.query("SELECT 1 AS present FROM submissions WHERE sourceUrl = ? OR url = ? UNION SELECT 1 AS present FROM resources WHERE url = ? LIMIT 1", [sourceUrl, homepage ?? sourceUrl, homepage ?? sourceUrl]);
    if (exists?.present) continue;
    const tags = (Array.isArray(repo.topics) ? repo.topics : []).map((topic) => text(topic, 64)).filter(Boolean).slice(0, 12);
    await connection.query("INSERT INTO submissions (submittedBy, title, url, description, categoryId, tags, pricing, sourceUrl, sourceType, license, suggestedRelationships, status) VALUES (?, ?, ?, ?, 4, ?, 'open_source', ?, 'repository', ?, JSON_ARRAY(), 'pending')", [systemUser.id, title, homepage ?? sourceUrl, description, JSON.stringify(tags), sourceUrl, license]);
    inserted.push({ title, sourceUrl });
  }
  if (inserted.length !== required) throw new Error(`Only found ${inserted.length} replacement candidates`);
  console.log(JSON.stringify({ inserted: inserted.length, category: "developer-tools", publication: "none; pending human moderation only" }, null, 2));
} finally { await connection.end(); }
