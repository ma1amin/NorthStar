export type ClientSeoInput = {
  title: string;
  description: string;
  canonicalPath: string;
  robots?: string;
};

export function buildClientPageSchema(input: ClientSeoInput, origin: string) {
  const canonicalUrl = new URL(input.canonicalPath, origin).toString();
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.title,
    description: input.description,
    url: canonicalUrl,
    isPartOf: { "@type": "WebSite", name: "NorthStar", url: new URL("/", origin).toString() },
  };
}

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element?.setAttribute(key, value));
}

export function applyClientSeo(input: ClientSeoInput) {
  if (typeof document === "undefined" || typeof window === "undefined") return;
  const canonicalUrl = new URL(input.canonicalPath, window.location.origin).toString();
  document.title = input.title;
  upsertMeta('meta[name="description"]', { name: "description", content: input.description });
  upsertMeta('meta[name="robots"]', { name: "robots", content: input.robots ?? "index,follow" });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: input.title });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: input.description });
  upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: input.title });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: input.description });

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;

  let schema = document.getElementById("northstar-client-page-schema") as HTMLScriptElement | null;
  if (!schema) {
    schema = document.createElement("script");
    schema.id = "northstar-client-page-schema";
    schema.type = "application/ld+json";
    document.head.appendChild(schema);
  }
  schema.textContent = JSON.stringify(buildClientPageSchema(input, window.location.origin));
}
