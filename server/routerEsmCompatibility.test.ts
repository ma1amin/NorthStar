import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("server router ESM compatibility", () => {
  it("defines a server-side compatible require before legacy mutation-time schema lookups", async () => {
    const routerSource = await readFile(new URL("./routers.ts", import.meta.url), "utf8");
    expect(routerSource).toContain('import { createRequire } from "node:module";');
    expect(routerSource).toContain("const require = createRequire(import.meta.url);");
    expect(routerSource).toContain('db.insert(require("../drizzle/schema").submissions)');
  });
});
