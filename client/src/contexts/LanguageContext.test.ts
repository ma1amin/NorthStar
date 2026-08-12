import { describe, expect, it } from "vitest";
import { getInitialLocale, syncLocale } from "./LanguageContext";

describe("language persistence and direction", () => {
  it("restores Arabic from persisted locale state", () => {
    expect(getInitialLocale((key) => (key === "northstar-locale" ? "ar" : null))).toBe("ar");
  });

  it("falls back to English for missing or unsupported locale state", () => {
    expect(getInitialLocale(() => null)).toBe("en");
    expect(getInitialLocale(() => "fr")).toBe("en");
  });

  it("synchronizes document direction and persisted locale", () => {
    const documentLike = { documentElement: { lang: "", dir: "" } };
    const writes: Array<[string, string]> = [];

    syncLocale("ar", documentLike, (key, value) => writes.push([key, value]));

    expect(documentLike.documentElement).toEqual({ lang: "ar", dir: "rtl" });
    expect(writes).toEqual([["northstar-locale", "ar"]]);

    syncLocale("en", documentLike, (key, value) => writes.push([key, value]));
    expect(documentLike.documentElement).toEqual({ lang: "en", dir: "ltr" });
    expect(writes.at(-1)).toEqual(["northstar-locale", "en"]);
  });
});
