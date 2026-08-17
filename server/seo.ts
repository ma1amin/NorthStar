import { getResourceBySlug } from "./db";

const SITE_NAME = "NorthStar";
const DEFAULT_TITLE = "NorthStar — Resource Intelligence Platform";
const DEFAULT_DESCRIPTION = "Discover, compare, and organize digital resources through verified knowledge-graph relationships.";
const SERVER_FALLBACK_STYLE_ID = "northstar-server-fallback-styles";
const SERVER_FALLBACK_STYLES = `<style id="${SERVER_FALLBACK_STYLE_ID}">
  [data-server-content] { box-sizing: border-box; max-width: 1180px; margin: 0 auto; padding: clamp(3rem, 8vw, 8rem) clamp(1.5rem, 5vw, 3.5rem); color: #0f172a; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
  [data-server-content] header, [data-server-content] article { max-width: 760px; }
  [data-server-content] header > p:first-child, [data-server-content] article > p:first-child { color: #0369a1; font-size: .76rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
  [data-server-content] h1 { max-width: 720px; margin: .7rem 0 1.25rem; font-size: clamp(2.4rem, 6vw, 5.2rem); line-height: 1.02; letter-spacing: -.055em; }
  [data-server-content] h2 { margin: 2.5rem 0 .65rem; font-size: clamp(1.45rem, 3vw, 2rem); letter-spacing: -.025em; }
  [data-server-content] p, [data-server-content] dd { max-width: 720px; color: #475569; font-size: 1.05rem; line-height: 1.75; }
  [data-server-content] a { display: inline-flex; margin: .4rem .65rem .4rem 0; border: 1px solid #bae6fd; border-radius: .8rem; background: #f0f9ff; padding: .65rem .9rem; color: #0369a1; font-weight: 700; text-decoration: none; }
  [data-server-content] section { margin-top: 2.8rem; border: 1px solid #e2e8f0; border-radius: 1.25rem; background: linear-gradient(135deg, #f8fafc, #f0f9ff); padding: 1.5rem; box-shadow: 0 16px 38px rgba(15, 23, 42, .07); }
  [data-server-content] dl { display: grid; gap: .75rem; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); margin: 1.5rem 0; }
  [data-server-content] dl > div { border: 1px solid #e2e8f0; border-radius: .9rem; background: #fff; padding: 1rem; }
  [data-server-content] dt { color: #64748b; font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
  [data-server-content] dd { margin: .35rem 0 0; color: #0f172a; font-size: .95rem; font-weight: 700; }
</style>`;

export type PublicSeoMetadata = {
  title: string;
  description: string;
  canonicalUrl: string;
  robots: string;
  jsonLd: Record<string, unknown>[];
};

function cleanText(value: string | null | undefined, fallback: string) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized || fallback;
}

function shorten(value: string, limit = 160) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trimEnd()}…`;
}

function canonicalUrl(origin: string, pathname: string) {
  return new URL(pathname, origin).toString();
}

function pageSchema(metadata: Pick<PublicSeoMetadata, "title" | "description" | "canonicalUrl">) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metadata.title,
    description: metadata.description,
    url: metadata.canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: new URL("/", metadata.canonicalUrl).toString(),
    },
  };
}

export function createDefaultSeo(pathname: string, origin: string): PublicSeoMetadata {
  const route = pathname === "/" ? "home" : pathname.split("/").filter(Boolean)[0] ?? "home";
  const routeDetails: Record<string, Pick<PublicSeoMetadata, "title" | "description">> = {
    home: { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
    browse: { title: `Browse verified resources — ${SITE_NAME}`, description: "Browse verified tools, services, and ecosystems with rich metadata and knowledge-graph context." },
    search: { title: `Relationship-aware resource search — ${SITE_NAME}`, description: "Search digital resources by name, category, tags, and relationships such as alternatives or integrations." },
    collections: { title: `Curated resource collections — ${SITE_NAME}`, description: "Explore and build curated resource stacks that preserve useful context and connections." },
  };
  const selected = routeDetails[route] ?? routeDetails.home;
  const metadata = {
    ...selected,
    canonicalUrl: canonicalUrl(origin, pathname),
    robots: "index,follow",
  };
  return { ...metadata, jsonLd: [pageSchema(metadata)] };
}

export async function getPublicSeoMetadata(pathname: string, origin: string): Promise<PublicSeoMetadata> {
  const resourceMatch = pathname.match(/^\/resource\/([^/]+)\/?$/);
  if (!resourceMatch) return createDefaultSeo(pathname, origin);

  const slug = decodeURIComponent(resourceMatch[1]);
  const resource = await getResourceBySlug(slug);
  if (!resource || resource.status !== "approved") {
    const fallback = createDefaultSeo(pathname, origin);
    return { ...fallback, robots: "noindex,follow" };
  }

  const description = shorten(cleanText(resource.description, `Explore ${resource.title} in the NorthStar resource intelligence graph.`));
  const canonical = canonicalUrl(origin, pathname);
  const title = `${resource.title} — ${SITE_NAME}`;
  const page = pageSchema({ title, description, canonicalUrl: canonical });
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "NorthStar", item: canonicalUrl(origin, "/") },
      { "@type": "ListItem", position: 2, name: "Browse resources", item: canonicalUrl(origin, "/browse") },
      { "@type": "ListItem", position: 3, name: resource.title, item: canonical },
    ],
  };
  return {
    title,
    description,
    canonicalUrl: canonical,
    robots: "index,follow",
    jsonLd: [page, breadcrumb],
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function jsonForScript(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

export function renderSeoHead(metadata: PublicSeoMetadata) {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const canonical = escapeHtml(metadata.canonicalUrl);
  const robots = escapeHtml(metadata.robots);
  const jsonLd = metadata.jsonLd.map((schema) => `<script type="application/ld+json">${jsonForScript(schema)}</script>`).join("\n    ");
  return `<title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="${robots}" />
    <link rel="canonical" href="${canonical}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonical}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${jsonLd}`;
}

export function injectSeoHead(template: string, metadata: PublicSeoMetadata) {
  const rendered = `<!-- NORTHSTAR_SEO_START -->\n    ${renderSeoHead(metadata)}\n    <!-- NORTHSTAR_SEO_END -->`;
  return template.replace(/<!-- NORTHSTAR_SEO_START -->[\s\S]*?<!-- NORTHSTAR_SEO_END -->/, rendered);
}

export async function renderPublicFallback(pathname: string) {
  const resourceMatch = pathname.match(/^\/resource\/([^/]+)\/?$/);
  if (resourceMatch) {
    const resource = await getResourceBySlug(decodeURIComponent(resourceMatch[1]));
    if (resource?.status === "approved") {
      const title = escapeHtml(resource.title);
      const description = escapeHtml(cleanText(resource.description, `Explore ${resource.title} in the NorthStar resource intelligence graph.`));
      const url = escapeHtml(resource.url);
      return `<main data-server-content="resource"><nav aria-label="Breadcrumb"><a href="/browse">Browse resources</a></nav><article><p>NorthStar resource node</p><h1>${title}</h1><p>${description}</p><dl><div><dt>Pricing</dt><dd>${escapeHtml(resource.pricing.replace("_", " "))}</dd></div><div><dt>License</dt><dd>${escapeHtml(resource.license || "Not specified")}</dd></div></dl><p><a href="${url}" rel="noopener noreferrer">Visit ${title}</a></p><section><h2>Knowledge graph</h2><p>Explore verified alternatives, integrations, competitors, ecosystems, and similar resources after the interactive graph loads.</p></section></article></main>`;
    }
  }

  const publicPages: Record<string, string> = {
    "/": `<main data-server-content="home"><header><p>NorthStar resource intelligence</p><h1>Discover resources in context.</h1><p>NorthStar connects digital tools through verified relationships, helping people discover alternatives, integrations, dependencies, and surrounding ecosystems.</p><p><a href="/browse">Explore resources</a> <a href="/search">Search the graph</a></p></header><section><h2>Relationship-aware discovery</h2><p>Resources are knowledge objects with metadata, community signals, and verified graph connections.</p></section></main>`,
    "/browse": `<main data-server-content="browse"><header><p>Resource directory</p><h1>Browse the intelligence hub</h1><p>Browse verified tools, services, libraries, and ecosystems with the context needed to make better choices.</p></header><p><a href="/search">Search resources and relationships</a></p></main>`,
    "/search": `<main data-server-content="search"><header><p>NorthStar search</p><h1>Relationship-aware resource search</h1><p>Search resources by name, category, tag, or relationship. Try queries such as “Jira alternatives” or “Slack integrations” in the interactive search experience.</p></header><p><a href="/browse">Browse all resources</a></p></main>`,
    "/collections": `<main data-server-content="collections"><header><p>Curated knowledge</p><h1>Resource collections</h1><p>Collections preserve the context behind a useful stack of resources.</p></header><p><a href="/browse">Explore resources</a></p></main>`,
  };
  return publicPages[pathname] ?? "";
}

export function injectPublicFallback(template: string, content: string) {
  if (!content) return template;
  return template.replace('<div id="root"></div>', `${SERVER_FALLBACK_STYLES}<div id="root">${content}</div>`);
}
