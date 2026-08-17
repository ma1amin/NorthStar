export type ArchiveExclusion = "video_host" | "editorial_content" | "social_or_profile";

const VIDEO_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "vimeo.com", "www.vimeo.com", "tiktok.com", "www.tiktok.com", "dailymotion.com", "www.dailymotion.com"]);
const EDITORIAL_HOSTS = new Set(["medium.com", "www.medium.com", "substack.com", "dev.to", "hashnode.com", "news.ycombinator.com"]);
const SOCIAL_HOSTS = new Set(["reddit.com", "www.reddit.com", "t.me", "twitter.com", "x.com", "facebook.com", "www.facebook.com", "instagram.com", "www.instagram.com"]);
const EDITORIAL_PATH = /\/(blog|article|articles|news|post|posts|pulse)\b/i;

export function getArchiveContentExclusion(url: string): ArchiveExclusion | undefined {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
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
