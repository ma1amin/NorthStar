import { describe, expect, it } from "vitest";
import { getInitialTheme } from "./ThemeContext";

describe("theme preference persistence", () => {
  it("restores a supported stored theme", () => {
    expect(getInitialTheme((key) => (key === "theme" ? "dark" : null))).toBe("dark");
  });

  it("uses the supplied default for missing or unsupported stored values", () => {
    expect(getInitialTheme(() => null)).toBe("light");
    expect(getInitialTheme(() => "solarized", "dark")).toBe("dark");
  });
});
