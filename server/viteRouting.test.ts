import { describe, expect, it } from "vitest";
import { isViteAssetRequest } from "./viteRouting";

describe("isViteAssetRequest", () => {
  it("recognizes Vite modules and static client assets", () => {
    expect(isViteAssetRequest("/src/main.tsx?v=abc")).toBe(true);
    expect(isViteAssetRequest("/@vite/client")).toBe(true);
    expect(isViteAssetRequest("/assets/index.css")).toBe(true);
  });

  it("keeps application routes eligible for the public HTML fallback", () => {
    expect(isViteAssetRequest("/?from_webdev=1")).toBe(false);
    expect(isViteAssetRequest("/resource/figma")).toBe(false);
  });
});
