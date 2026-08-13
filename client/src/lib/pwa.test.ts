import { describe, expect, it } from "vitest";
import { canRegisterServiceWorker } from "./pwa";

describe("PWA registration boundary", () => {
  it("only registers when production mode and the browser service-worker capability are both present", () => {
    expect(canRegisterServiceWorker(false, { serviceWorker: {} } as any)).toBe(false);
    expect(canRegisterServiceWorker(true, undefined)).toBe(false);
    expect(canRegisterServiceWorker(true, { serviceWorker: {} } as any)).toBe(true);
  });
});
