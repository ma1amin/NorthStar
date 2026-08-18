import fs from "node:fs/promises";
import path from "node:path";

const sourceDirectory = "/tmp/northstar-curation";
const outputPath = path.resolve("curation/github-topic-candidates.json");
const categorySources = [
  ["project-management", 1, 25],
  ["design", 2, 25],
  ["communication", 3, 24],
  ["developer-tools", 4, 36],
  ["productivity", 5, 24],
  ["data-ai", 30001, 25],
  ["research-knowledge", 30002, 16],
  ["security-observability", 60001, 25],
];

function hasPersonalMarker(value) {
  return /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(value) || /(?:\+?\d[\d\s().-]{7,}\d)/.test(value) || /@[A-Za-z0-9_]{1,64}/.test(value);
}

function safeText(value, maxLength) {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().replace(/\s+/g, " ").slice(0, maxLength);
  return normalized && !hasPersonalMarker(normalized) ? normalized : undefined;
}

function safePublicUrl(value) {
  if (typeof value !== "string" || !value) return undefined;
  try {
    const parsed = new URL(value);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password || hasPersonalMarker(`${parsed.pathname}${parsed.search}${parsed.hash}`)) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

const entries = [];
const seenRepos = new Set();

for (const [categorySlug, categoryId, maxPerCategory] of categorySources) {
  const responseText = (await fs.readFile(path.join(sourceDirectory, `${categorySlug}.json`), "utf8")).replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
  const raw = JSON.parse(responseText);
  const selected = [];
  for (const repository of raw.items ?? []) {
    const repoUrl = safePublicUrl(repository.html_url);
    const homepage = safePublicUrl(repository.homepage);
    const title = safeText(repository.name, 255);
    const description = safeText(repository.description, 5000);
    const license = safeText(repository.license?.spdx_id, 255);
    const ownerIsOrganization = repository.owner?.type === "Organization";
    const key = repository.full_name?.toLowerCase();
    if (!repoUrl || !title || !description || !license || !ownerIsOrganization || !key || seenRepos.has(key)) continue;
    selected.push({
      title,
      url: homepage ?? repoUrl,
      sourceUrl: repoUrl,
      sourceType: "repository",
      categorySlug,
      categoryId,
      description,
      pricing: "open_source",
      license,
      tags: (Array.isArray(repository.topics) ? repository.topics : []).map((topic) => safeText(topic, 64)).filter(Boolean).slice(0, 12),
      repositoryFullName: safeText(repository.full_name, 255),
      githubApiUrl: safePublicUrl(repository.url),
    });
    seenRepos.add(key);
    if (selected.length === maxPerCategory) break;
  }
  if (selected.length !== maxPerCategory) throw new Error(`${categorySlug} yielded ${selected.length}, not ${maxPerCategory}, eligible organization-owned licensed repositories`);
  entries.push(...selected);
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
if (entries.length !== 200) throw new Error(`Expected 200 candidates but selected ${entries.length}`);
await fs.writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), source: "GitHub public repository search metadata", candidateCount: entries.length, candidates: entries }, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, candidateCount: entries.length, categoryCounts: Object.fromEntries(categorySources.map(([slug]) => [slug, entries.filter((entry) => entry.categorySlug === slug).length])) }, null, 2));
