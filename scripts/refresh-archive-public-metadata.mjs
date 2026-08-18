import mysql from "mysql2/promise";

const batchId = Number(process.env.ARCHIVE_BATCH_ID ?? 1);
const concurrency = Math.min(Math.max(Number(process.env.ARCHIVE_REFRESH_CONCURRENCY ?? 4), 1), 6);
const maxCandidates = Math.min(Math.max(Number(process.env.ARCHIVE_REFRESH_LIMIT ?? 300), 1), 300);
const blockedHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIpv4(hostname) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false;
  const [first, second] = parts;
  return first === 0 || first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

function isPrivateIpv6(hostname) {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return normalized === "::" || normalized === "::1" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") || normalized.startsWith("::ffff:192.168.") || normalized.startsWith("::ffff:169.254.");
}

function safeUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  const hostname = parsed.hostname.toLowerCase();
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || blockedHosts.has(hostname) || hostname.endsWith(".local") || isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) throw new Error("unsafe_url");
  return parsed;
}

function decodeHtml(value) {
  return value.replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function attribute(tag, name) {
  return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1];
}

function sanitizeMetadata(value, maxLength) {
  if (!value) return null;
  const normalized = decodeHtml(value).slice(0, maxLength).trim();
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
  const phone = /(?:\+?\d[\d\s().-]{7,}\d)/;
  if (!normalized || email.test(normalized) || phone.test(normalized) || /@[A-Za-z0-9_]{1,64}/.test(normalized)) return null;
  return normalized;
}

async function fetchPublicPage(rawUrl) {
  let parsed = safeUrl(rawUrl);
  let response;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    response = await fetch(parsed, { headers: { accept: "text/html,application/xhtml+xml" }, redirect: "manual", signal: AbortSignal.timeout(6000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location");
    if (!location) throw new Error("missing_redirect");
    parsed = safeUrl(new URL(location, parsed).toString());
    response = undefined;
  }
  if (!response || !response.ok) throw new Error("public_page_unavailable");
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) throw new Error("not_html");

  const html = (await response.text()).slice(0, 512_000);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const links = html.match(/<link\b[^>]*>/gi) ?? [];
  let description;
  for (const tag of tags) {
    const name = (attribute(tag, "name") ?? attribute(tag, "property") ?? "").toLowerCase();
    if (name === "description" || name === "og:description") { description = attribute(tag, "content"); break; }
  }
  let canonical = parsed.toString();
  for (const link of links) {
    if ((attribute(link, "rel") ?? "").toLowerCase().split(/\s+/).includes("canonical")) {
      try { canonical = safeUrl(new URL(attribute(link, "href"), parsed).toString()).toString(); } catch { /* Retain fetched public URL. */ }
      break;
    }
  }
  return { canonical, title: sanitizeMetadata(title, 255), description: sanitizeMetadata(description, 5000) };
}

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const summary = { fetched: 0, unavailable: 0, skipped: 0 };
  try {
    const [rows] = await connection.query(
      "SELECT id, url FROM archive_import_candidates WHERE batchId = ? AND status = 'review_ready' AND metadataVerificationStatus <> 'public_page_fetched' ORDER BY id ASC LIMIT ?",
      [batchId, maxCandidates],
    );
    let cursor = 0;
    async function worker() {
      while (cursor < rows.length) {
        const candidate = rows[cursor++];
        try {
          const metadata = await fetchPublicPage(candidate.url);
          await connection.query(
            "UPDATE archive_import_candidates SET canonicalUrl = ?, officialSourceUrl = ?, title = ?, description = ?, metadataVerificationStatus = 'public_page_fetched', metadataFetchedAt = UTC_TIMESTAMP(), failureCode = NULL WHERE id = ? AND status = 'review_ready'",
            [metadata.canonical, metadata.canonical, metadata.title, metadata.description, candidate.id],
          );
          summary.fetched += 1;
        } catch {
          await connection.query(
            "UPDATE archive_import_candidates SET status = 'failed', failureCode = 'metadata_unavailable', metadataVerificationStatus = 'unverified' WHERE id = ? AND status = 'review_ready'",
            [candidate.id],
          );
          summary.unavailable += 1;
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, () => worker()));
    summary.skipped = Math.max(0, maxCandidates - rows.length);
    console.log(JSON.stringify({ batchId, selected: rows.length, ...summary }, null, 2));
  } finally {
    await connection.end();
  }
}

await run();
