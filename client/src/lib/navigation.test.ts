import { describe, expect, it } from "vitest";
import { isNavigatorRouteActive } from "./navigation";

describe("isNavigatorRouteActive", () => {
  it("marks exact navigator paths as active", () => {
    expect(isNavigatorRouteActive("/collections", "/collections")).toBe(true);
    expect(isNavigatorRouteActive("/search", "/browse")).toBe(false);
  });

  it("keeps resource-detail navigation anchored to Explore", () => {
    expect(isNavigatorRouteActive("/resource/figma", "/browse")).toBe(true);
  });
});
