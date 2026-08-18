import { describe, expect, it } from "vitest";
import { assertSafePublicUrl, extractMetadataFromHtml } from "./urlMetadata";

describe("resource URL metadata", () => {
  it("extracts title and description metadata from HTML", () => {
    const result = extractMetadataFromHtml(`
      <html><head>
        <title>Example Tool</title>
        <meta name="description" content="A useful example resource">
      </head></html>
    `);

    expect(result).toEqual({
      title: "Example Tool",
      description: "A useful example resource",
      canonicalUrl: undefined,
      iconUrl: undefined,
    });
  });

  it("prefers the standard description tag", () => {
    const result = extractMetadataFromHtml(`
      <meta property="og:description" content="Social preview">
      <meta name="description" content="Canonical description">
    `);

    expect(result.description).toBe("Social preview");
  });

  it("extracts a public canonical-link candidate without collecting author data", () => {
    const result = extractMetadataFromHtml(`
      <link rel="canonical" href="https://example.com/resources/tool">
      <meta name="author" content="A personal name that must not be collected">
    `);

    expect(result.canonicalUrl).toBe("https://example.com/resources/tool");
    expect(JSON.stringify(result)).not.toContain("personal name");
  });

  it("extracts a page-declared icon candidate without using a social preview image", () => {
    const result = extractMetadataFromHtml(`
      <link rel="icon" href="/brand-icon.svg">
      <meta property="og:image" content="https://example.com/social-card.png">
    `);

    expect(result.iconUrl).toBe("/brand-icon.svg");
    expect(result).not.toHaveProperty("ogImage");
  });

  it("accepts public HTTP and HTTPS URLs", () => {
    expect(assertSafePublicUrl("https://example.com/tools").hostname).toBe("example.com");
    expect(assertSafePublicUrl("http://example.com").protocol).toBe("http:");
  });

  it("rejects unsupported protocols and private network targets", () => {
    expect(() => assertSafePublicUrl("javascript:alert(1)")).toThrow();
    expect(() => assertSafePublicUrl("http://localhost:3000")).toThrow();
    expect(() => assertSafePublicUrl("http://192.168.1.10")).toThrow();
  });

  it("rejects IPv6 loopback, private, link-local, and unspecified targets", () => {
    expect(() => assertSafePublicUrl("http://[::1]")).toThrow();
    expect(() => assertSafePublicUrl("http://[::]")).toThrow();
    expect(() => assertSafePublicUrl("http://[fc00::1]")).toThrow();
    expect(() => assertSafePublicUrl("http://[fe80::1]")).toThrow();
    expect(() => assertSafePublicUrl("http://169.254.10.20")).toThrow();
    expect(() => assertSafePublicUrl("http://0.0.0.0")).toThrow();
  });
});
