import fs from "node:fs/promises";

const manifestPath = new URL("../curation/github-topic-candidates.json", import.meta.url);
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const seen = new Map();

for (const [index, candidate] of manifest.candidates.entries()) {
  const matches = seen.get(candidate.url) ?? [];
  matches.push(index + 1);
  seen.set(candidate.url, matches);
}

const duplicates = [...seen.entries()]
  .filter(([, positions]) => positions.length > 1)
  .map(([url, positions]) => ({ url, positions }));

console.log(JSON.stringify({ candidateCount: manifest.candidates.length, uniqueUrlCount: seen.size, duplicates }, null, 2));
