import { describe, expect, it } from "vitest";
import { prioritizeStylesheetLinks } from "./stylesheetPriority";

describe("prioritizeStylesheetLinks", () => {
  it("places extracted stylesheets before application module scripts", () => {
    const document = `<!doctype html><html><head><meta charset="UTF-8"><script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css"></head><body></body></html>`;

    const result = prioritizeStylesheetLinks(document);

    expect(result.indexOf('href="/assets/app.css"')).toBeLessThan(result.indexOf('src="/assets/app.js"'));
    expect(result).toContain('<meta charset="UTF-8">');
  });

  it("leaves documents without a stylesheet or module script unchanged", () => {
    const withoutStylesheet = "<html><head><script type=\"module\" src=\"/app.js\"></script></head></html>";
    const withoutModule = "<html><head><link rel=\"stylesheet\" href=\"/app.css\"></head></html>";

    expect(prioritizeStylesheetLinks(withoutStylesheet)).toBe(withoutStylesheet);
    expect(prioritizeStylesheetLinks(withoutModule)).toBe(withoutModule);
  });

  it("does not promote stylesheet examples contained in HTML comments", () => {
    const document = `<!doctype html><html><head><!-- <link rel="stylesheet" href="https://example.com/example.css"> --><script type="module" src="/assets/app.js"></script><link rel="stylesheet" href="/assets/app.css"></head><body></body></html>`;

    const result = prioritizeStylesheetLinks(document);

    expect(result).toContain('<!-- <link rel="stylesheet" href="https://example.com/example.css"> -->');
    expect(result.indexOf('href="/assets/app.css"')).toBeLessThan(result.indexOf('src="/assets/app.js"'));
  });
});
