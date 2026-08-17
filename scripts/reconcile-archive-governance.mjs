import mysql from "mysql2/promise";
import { getDomain } from "tldts";

const batchId = 1;
const videoHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "vimeo.com", "www.vimeo.com", "tiktok.com", "www.tiktok.com", "dailymotion.com", "www.dailymotion.com"]);
const editorialHosts = new Set(["medium.com", "www.medium.com", "substack.com", "dev.to", "hashnode.com", "news.ycombinator.com"]);
const socialHosts = new Set(["reddit.com", "www.reddit.com", "t.me", "twitter.com", "x.com", "facebook.com", "www.facebook.com", "instagram.com", "www.instagram.com"]);
const googleWorkspaceHosts = new Set(["drive.google.com", "docs.google.com", "sheets.google.com", "slides.google.com"]);
const lumaHosts = new Set(["luma.com", "www.luma.com", "lu.ma", "www.lu.ma"]);
const meetingHosts = new Set(["meet.google.com", "zoom.us", "www.zoom.us", "teams.microsoft.com", "webex.com", "www.webex.com", "meetings.webex.com"]);
const editorialPath = /\/(blog|article|articles|news|post|posts|pulse)\b/i;
const directDocumentPath = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|rtf|odt|ods|odp)(?:$|[?#])/i;

function classify(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (googleWorkspaceHosts.has(host)) return "google_workspace";
    if (lumaHosts.has(host)) return "luma_calendar";
    if (meetingHosts.has(host)) return "meeting_link";
    if (directDocumentPath.test(parsed.pathname)) return "direct_document";
    if (videoHosts.has(host)) return "video_host";
    if (socialHosts.has(host) || (host.endsWith("linkedin.com") && /\/(in|pulse)\//i.test(parsed.pathname))) return "social_or_profile";
    if (editorialHosts.has(host) || host.startsWith("blog.") || editorialPath.test(parsed.pathname)) return "editorial_content";
    return undefined;
  } catch {
    return "editorial_content";
  }
}

function rootDomain(url) {
  const host = new URL(url).hostname.toLowerCase();
  return getDomain(host, { allowPrivateDomains: false }) ?? host;
}

const connection = await mysql.createConnection(process.env.DATABASE_URL);
try {
  const [rows] = await connection.query("SELECT id, url, status FROM archive_import_candidates WHERE batchId = ? ORDER BY id ASC", [batchId]);
  const roots = new Set();
  const summary = { rootsAssigned: 0, policyExcluded: 0, domainExcluded: 0, preserved: 0 };
  for (const candidate of rows) {
    const domain = rootDomain(candidate.url);
    await connection.query("UPDATE archive_import_candidates SET registrableDomain = ? WHERE id = ?", [domain, candidate.id]);
    summary.rootsAssigned += 1;
    if (candidate.status === "submitted") continue;
    const exclusion = classify(candidate.url);
    if (exclusion) {
      await connection.query("UPDATE archive_import_candidates SET status = 'excluded', failureCode = ? WHERE id = ?", [exclusion, candidate.id]);
      summary.policyExcluded += 1;
      continue;
    }
    if (candidate.status !== "review_ready") continue;
    if (roots.has(domain)) {
      await connection.query("UPDATE archive_import_candidates SET status = 'excluded', failureCode = 'root_domain_duplicate' WHERE id = ?", [candidate.id]);
      summary.domainExcluded += 1;
      continue;
    }
    roots.add(domain);
    summary.preserved += 1;
  }
  const [counts] = await connection.query("SELECT status, COALESCE(failureCode, 'none') AS reason, COUNT(*) AS candidateCount FROM archive_import_candidates WHERE batchId = ? GROUP BY status, failureCode ORDER BY status, reason", [batchId]);
  console.log(JSON.stringify({ batchId, summary, counts }, null, 2));
} finally {
  await connection.end();
}
