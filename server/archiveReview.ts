import { getDomain } from "tldts";

export const ARCHIVE_BULK_REVIEW_LIMIT = 25;
export const ARCHIVE_METADATA_RETRY_LIMIT = 3;

export function mayRetryArchiveCandidate(status: string, retryCount: number): boolean {
  return status === "failed" && retryCount < ARCHIVE_METADATA_RETRY_LIMIT;
}

export type ArchiveExclusion = "video_host" | "editorial_content" | "social_or_profile" | "google_workspace" | "luma_calendar" | "meeting_link" | "direct_document";

const VIDEO_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "vimeo.com", "www.vimeo.com", "tiktok.com", "www.tiktok.com", "dailymotion.com", "www.dailymotion.com"]);
const EDITORIAL_HOSTS = new Set(["medium.com", "www.medium.com", "substack.com", "dev.to", "hashnode.com", "news.ycombinator.com"]);
const SOCIAL_HOSTS = new Set(["reddit.com", "www.reddit.com", "t.me", "twitter.com", "x.com", "facebook.com", "www.facebook.com", "instagram.com", "www.instagram.com"]);
const GOOGLE_WORKSPACE_HOSTS = new Set(["drive.google.com", "docs.google.com", "sheets.google.com", "slides.google.com"]);
const LUMA_HOSTS = new Set(["luma.com", "www.luma.com", "lu.ma", "www.lu.ma"]);
const MEETING_HOSTS = new Set(["meet.google.com", "zoom.us", "www.zoom.us", "teams.microsoft.com", "webex.com", "www.webex.com", "meetings.webex.com"]);
const EDITORIAL_PATH = /\/(blog|article|articles|news|post|posts|pulse)\b/i;
const DIRECT_DOCUMENT_PATH = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|rtf|odt|ods|odp)(?:$|[?#])/i;

export function getRegistrableDomain(urlOrDomain: string) {
  try {
    const candidate = urlOrDomain.includes("://") ? new URL(urlOrDomain).hostname : urlOrDomain.replace(/^\.+|\.+$/g, "");
    const hostname = candidate.toLowerCase();
    return getDomain(hostname, { allowPrivateDomains: false }) ?? hostname;
  } catch {
    return undefined;
  }
}

export function normalizeTrustedDomain(value: string) {
  const candidate = value.trim().toLowerCase();
  if (!candidate) return undefined;
  return getRegistrableDomain(candidate.includes("://") ? candidate : `https://${candidate}`);
}

export function getArchiveContentExclusion(url: string): ArchiveExclusion | undefined {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (GOOGLE_WORKSPACE_HOSTS.has(host)) return "google_workspace";
    if (LUMA_HOSTS.has(host)) return "luma_calendar";
    if (MEETING_HOSTS.has(host)) return "meeting_link";
    if (DIRECT_DOCUMENT_PATH.test(parsed.pathname)) return "direct_document";
    if (VIDEO_HOSTS.has(host)) return "video_host";
    if (SOCIAL_HOSTS.has(host) || (host.endsWith("linkedin.com") && /\/(in|pulse)\//i.test(parsed.pathname))) return "social_or_profile";
    if (EDITORIAL_HOSTS.has(host) || host.startsWith("blog.") || EDITORIAL_PATH.test(parsed.pathname)) return "editorial_content";
  } catch {
    return "editorial_content";
  }
  return undefined;
}

export function suggestArchiveClassification(input: { url: string; title?: string | null; description?: string | null }) {
  const text = `${input.url} ${input.title ?? ""} ${input.description ?? ""}`.toLowerCase();
  const matches = (terms: string[]) => terms.some((term) => text.includes(term));
  if (matches(["figma", "sketch", "adobe", "design", "wireframe", "prototype", "typography"])) return { categorySlug: "design", tags: ["design", "creative-tools"] };
  if (matches(["slack", "discord", "zoom", "meeting", "email", "communication", "messaging"])) return { categorySlug: "communication", tags: ["communication", "collaboration"] };
  if (matches(["jira", "asana", "trello", "project", "kanban", "roadmap", "sprint"])) return { categorySlug: "project-management", tags: ["project-management", "planning"] };
  if (matches(["github", "gitlab", "api", "sdk", "code", "developer", "docker", "kubernetes", "terminal", "database"])) return { categorySlug: "developer-tools", tags: ["developer-tools", "engineering"] };
  if (matches(["security", "sentry", "observability", "monitoring", "privacy", "vpn", "password"])) return { categorySlug: "security-observability", tags: ["security", "observability"] };
  if (matches(["ai", "machine learning", "model", "llm", "data", "analytics"])) return { categorySlug: "data-ai", tags: ["data", "ai"] };
  if (matches(["research", "paper", "knowledge", "documentation", "reference", "learn"])) return { categorySlug: "research-knowledge", tags: ["research", "knowledge"] };
  return { categorySlug: "productivity", tags: ["productivity"] };
}
