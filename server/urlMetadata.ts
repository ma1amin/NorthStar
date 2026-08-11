const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [first, second] = parts;
  return first === 10 || first === 127 || (first === 172 && second >= 16 && second <= 31) || (first === 192 && second === 168);
}

export function assertSafePublicUrl(rawUrl: string) {
  const parsed = new URL(rawUrl);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith('.local') || isPrivateIpv4(hostname)) {
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
  let description: string | undefined;

  for (const tag of metaTags) {
    const name = getAttribute(tag, 'name')?.toLowerCase() ?? getAttribute(tag, 'property')?.toLowerCase();
    if (name === 'description' || name === 'og:description') {
      description = getAttribute(tag, 'content');
      if (description) break;
    }
  }

  return {
    title: titleMatch?.[1] ? decodeHtml(titleMatch[1].replace(/<[^>]+>/g, ' ')) : undefined,
    description,
  };
}

export async function fetchResourceMetadata(rawUrl: string) {
  const parsed = assertSafePublicUrl(rawUrl);
  const response = await fetch(parsed, {
    headers: { accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
    signal: AbortSignal.timeout(6000),
  });

  if (!response.ok) {
    throw new Error(`Metadata request failed with status ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    return { url: parsed.toString(), title: undefined, description: undefined };
  }

  const html = (await response.text()).slice(0, 512_000);
  const metadata = extractMetadataFromHtml(html);
  return { url: parsed.toString(), ...metadata };
}
