import { describe, expect, it } from "vitest";
import { createDefaultSeo, injectPublicFallback, injectSeoHead, renderPublicFallback, renderSeoHead } from "./seo";

describe("NorthStar public SEO helpers", () => {
  it("creates canonical public metadata for Browse without query parameters", () => {
    const metadata = createDefaultSeo("/browse", "https://northstar.example");
    expect(metadata.title).toContain("Browse verified resources");
    expect(metadata.canonicalUrl).toBe("https://northstar.example/browse");
    expect(metadata.robots).toBe("index,follow");
  });

  it("renders escaped Open Graph tags and safe JSON-LD", () => {
    const head = renderSeoHead({
      title: "A < B — NorthStar",
      description: "Context & connections",
      canonicalUrl: "https://northstar.example/resource/a",
      robots: "index,follow",
      jsonLd: [{ "@context": "https://schema.org", "@type": "WebPage", name: "A < B" }],
    });
    expect(head).toContain("A &lt; B — NorthStar");
    expect(head).toContain("Context &amp; connections");
    expect(head).toContain("\\u003c");
  });

  it("replaces only the marked SEO section in the HTML template", () => {
    const template = "<head><!-- NORTHSTAR_SEO_START --><title>Old</title><!-- NORTHSTAR_SEO_END --></head>";
    const result = injectSeoHead(template, createDefaultSeo("/", "https://northstar.example"));
    expect(result).toContain("NorthStar — Resource Intelligence Platform");
    expect(result).not.toContain("<title>Old</title>");
  });

  it("injects semantic public fallback content into the mount point", async () => {
    const fallback = await renderPublicFallback("/search");
    const result = injectPublicFallback('<div id="root"></div>', fallback);
    expect(result).toContain('id="northstar-server-fallback-styles"');
    expect(result).toContain('data-server-content="search"');
    expect(result).toContain("Relationship-aware resource search");
  });
});
