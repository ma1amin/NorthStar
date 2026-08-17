const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [first, second] = parts;
  return first === 0 || first === 10 || first === 127 || first === 169 && second === 254 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

function isPrivateIpv6(hostname: string) {
  const normalized = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  return normalized === "::" || normalized === "::1" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("::ffff:127.") || normalized.startsWith("::ffff:10.") || normalized.startsWith("::ffff:192.168.") || normalized.startsWith("::ffff:169.254.");
}

export function assertSafePublicUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.local') || isPrivateIpv4(hostname) || isPrivateIpv6(hostname)) {
    throw new Error('Local and private network URLs are not supported');
  }
  return parsed;
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}

function getAttribute(tag: string, attribute: string) {
  const match = tag.match(new RegExp(`${attribute}\\s*=\\s*["']([^"']*)["']`, 'i'));
  return match?.[1] ? decodeHtml(match[1]) : undefined;
}

export function extractMetadataFromHtml(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  let description: string | undefined;
  let canonicalUrl: string | undefined;

  for (const tag of metaTags) {
    const name = getAttribute(tag, 'name')?.toLowerCase() ?? getAttribute(tag, 'property')?.toLowerCase();
    if (name === 'description' || name === 'og:description') {
      description = getAttribute(tag, 'content');
      if (description) break;
    }
  }

  for (const tag of linkTags) {
    const rel = getAttribute(tag, "rel")?.toLowerCase();
    if (rel?.split(/\s+/).includes("canonical")) {
      canonicalUrl = getAttribute(tag, "href");
      if (canonicalUrl) break;
    }
  }

  return {
    title: titleMatch?.[1] ? decodeHtml(titleMatch[1].replace(/<[^>]+>/g, ' ')) : undefined,
    description,
    canonicalUrl,
  };
}

export async function fetchResourceMetadata(rawUrl: string) {
  let parsed = assertSafePublicUrl(rawUrl);
  let response: Response | undefined;
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    response = await fetch(parsed, {
      headers: { accept: "text/html,application/xhtml+xml" },
      redirect: "manual",
      signal: AbortSignal.timeout(6000),
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) break;
    const location = response.headers.get("location");
    if (!location) throw new Error("Metadata redirect is missing a location");
    parsed = assertSafePublicUrl(new URL(location, parsed).toString());
    response = undefined;
  }
  if (!response) throw new Error("Metadata redirect limit exceeded");

  if (!response.ok) {
    throw new Error(`Metadata request failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    return { url: parsed.toString(), title: undefined, description: undefined, canonicalUrl: undefined };
  }

  const html = (await response.text()).slice(0, 512_000);
  const metadata = extractMetadataFromHtml(html);
  let canonicalUrl: string | undefined;
  if (metadata.canonicalUrl) {
    try { canonicalUrl = assertSafePublicUrl(new URL(metadata.canonicalUrl, parsed).toString()).toString(); } catch { canonicalUrl = undefined; }
  }
  return { url: parsed.toString(), canonicalUrl, title: metadata.title, description: metadata.description };
}
