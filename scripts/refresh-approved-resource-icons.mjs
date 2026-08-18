import mysql from "mysql2/promise";

const limit = Math.min(Math.max(Number(process.env.RESOURCE_ICON_REFRESH_LIMIT ?? 100), 1), 100);
const concurrency = Math.min(Math.max(Number(process.env.RESOURCE_ICON_REFRESH_CONCURRENCY ?? 4), 1), 6);
const blockedHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function privateIpv4(hostname) { const parts = hostname.split(".").map(Number); if (parts.length !== 4 || parts.some(Number.isNaN)) return false; const [first, second] = parts; return first === 0 || first === 10 || first === 127 || (first === 169 && second === 254) || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168); }
function privateIpv6(hostname) { const value = hostname.replace(/^\[|\]$/g, "").toLowerCase(); return value === "::" || value === "::1" || value.startsWith("fe80:") || value.startsWith("fc") || value.startsWith("fd") || value.startsWith("::ffff:127.") || value.startsWith("::ffff:10.") || value.startsWith("::ffff:192.168.") || value.startsWith("::ffff:169.254."); }
function safeUrl(value) { const parsed = new URL(value); const host = parsed.hostname.toLowerCase(); if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || blockedHosts.has(host) || host.endsWith(".local") || privateIpv4(host) || privateIpv6(host)) throw new Error("unsafe_url"); return parsed; }
function attribute(tag, name) { return tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"))?.[1]; }

async function declaredIcon(rawUrl) {
  let parsed = safeUrl(rawUrl); let response;
  for (let redirects = 0; redirects <= 3; redirects += 1) {
    response = await fetch(parsed, { headers: { accept: "text/html,application/xhtml+xml" }, redirect: "manual", signal: AbortSignal.timeout(6000) });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location"); if (!location) throw new Error("missing_redirect"); parsed = safeUrl(new URL(location, parsed).toString()); response = undefined;
  }
  if (!response?.ok || !(response.headers.get("content-type") ?? "").includes("text/html")) return undefined;
  const links = (await response.text()).slice(0, 512_000).match(/<link\b[^>]*>/gi) ?? [];
  for (const link of links) {
    const rel = (attribute(link, "rel") ?? "").toLowerCase().split(/\s+/);
    if (!rel.some((value) => value === "icon" || value === "shortcut" || value === "apple-touch-icon")) continue;
    const href = attribute(link, "href");
    try { if (href) return safeUrl(new URL(href, parsed).toString()).toString(); } catch { /* Try a later declared icon. */ }
  }
  return undefined;
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const summary = { selected: 0, updated: 0, noDeclaredIcon: 0, unavailable: 0 };
try {
  const [rows] = await connection.query("SELECT id, url FROM resources WHERE status = 'approved' AND (logo IS NULL OR logo = '') ORDER BY id LIMIT ?", [limit]);
  summary.selected = rows.length;
  let cursor = 0;
  async function worker() { while (cursor < rows.length) { const resource = rows[cursor++]; try { const logo = await declaredIcon(resource.url); if (logo) { await connection.query("UPDATE resources SET logo = ? WHERE id = ? AND (logo IS NULL OR logo = '')", [logo, resource.id]); summary.updated += 1; } else summary.noDeclaredIcon += 1; } catch { summary.unavailable += 1; } } }
  await Promise.all(Array.from({ length: Math.min(concurrency, rows.length) }, () => worker()));
  console.log(JSON.stringify(summary, null, 2));
} finally { await connection.end(); }
