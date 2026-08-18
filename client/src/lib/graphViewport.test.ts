import { describe, expect, it } from "vitest";
import { clampGraphScale, panGraphViewport, zoomGraphViewport } from "./graphViewport";

describe("graph viewport controls", () => {
  it("clamps zoom to the bounded interactive range", () => {
    expect(clampGraphScale(0.1)).toBe(0.72);
    expect(clampGraphScale(2.4)).toBe(1.8);
    expect(zoomGraphViewport({ x: 4, y: -6, scale: 1 }, 0.16)).toEqual({ x: 4, y: -6, scale: 1.16 });
  });

  it("pans without changing the selected zoom level", () => {
    expect(panGraphViewport({ x: 4, y: -6, scale: 1.2 }, 18, -12)).toEqual({ x: 22, y: -18, scale: 1.2 });
  });
});
