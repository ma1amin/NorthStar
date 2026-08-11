import { describe, expect, it } from "vitest";
import { buildClientPageSchema } from "./seo";

describe("buildClientPageSchema", () => {
  it("builds a canonical page schema without search-query noise", () => {
    const schema = buildClientPageSchema({
      title: "Figma — NorthStar",
      description: "Collaborative design resource.",
      canonicalPath: "/resource/figma",
    }, "https://northstar.example");
    expect(schema.url).toBe("https://northstar.example/resource/figma");
    expect(schema.isPartOf.name).toBe("NorthStar");
  });
});
