import { describe, expect, it } from "vitest";
import { nextFeaturedIndex, previousFeaturedIndex } from "./featuredCarousel";

describe("featured resource carousel", () => {
  it("cycles forward and backward through approved resources", () => {
    expect(nextFeaturedIndex(0, 3)).toBe(1);
    expect(nextFeaturedIndex(2, 3)).toBe(0);
    expect(previousFeaturedIndex(0, 3)).toBe(2);
    expect(previousFeaturedIndex(2, 3)).toBe(1);
  });

  it("remains safe when no approved featured resource is available", () => {
    expect(nextFeaturedIndex(0, 0)).toBe(0);
    expect(previousFeaturedIndex(0, 0)).toBe(0);
  });
});
