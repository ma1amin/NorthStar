import fs from "node:fs/promises";

const manifest = JSON.parse(await fs.readFile(new URL("../curation/github-topic-candidates.json", import.meta.url), "utf8"));
const personalMarker = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|(?:\+?\d[\d\s().-]{7,}\d)|@[A-Za-z0-9_]{1,64}/i;
const permittedCategories = new Set(["project-management", "design", "communication", "developer-tools", "productivity", "data-ai", "research-knowledge", "security-observability"]);
const urls = new Set();
const errors = [];

if (manifest.candidateCount !== 200 || manifest.candidates.length !== 200) errors.push("Manifest must contain exactly 200 candidates");
for (const candidate of manifest.candidates) {
  for (const key of ["title", "description", "url", "sourceUrl", "license"]) if (!candidate[key] || personalMarker.test(String(candidate[key]))) errors.push(`Unsafe or missing ${key} for ${candidate.title ?? "unknown candidate"}`);
  if (!permittedCategories.has(candidate.categorySlug)) errors.push(`Unsupported category ${candidate.categorySlug}`);
  if (candidate.pricing !== "open_source" || candidate.sourceType !== "repository") errors.push(`Unexpected source/pricing contract for ${candidate.title}`);
  if (urls.has(candidate.sourceUrl)) errors.push(`Duplicate primary source URL ${candidate.sourceUrl}`);
  urls.add(candidate.sourceUrl);
}
if (errors.length) throw new Error(errors.slice(0, 10).join("; "));
console.log(JSON.stringify({ valid: true, candidates: manifest.candidates.length, uniquePrimarySources: urls.size }, null, 2));
