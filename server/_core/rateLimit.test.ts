import { describe, expect, it, beforeEach } from "vitest";
import { consumeRateLimit, resetRateLimitBucketsForTest } from "./rateLimit";

const context = (userId?: number) => ({
  user: userId ? { id: userId } : null,
  req: { headers: { "x-forwarded-for": "203.0.113.10" }, socket: { remoteAddress: "203.0.113.10" } },
}) as any;

describe("sensitive request rate limiting", () => {
  beforeEach(() => resetRateLimitBucketsForTest());

  it("limits a scope independently by authenticated user", () => {
    consumeRateLimit(context(7), "contribution", 2, 60_000);
    consumeRateLimit(context(7), "contribution", 2, 60_000);
    expect(() => consumeRateLimit(context(7), "contribution", 2, 60_000)).toThrow(/Too many requests/);
    expect(() => consumeRateLimit(context(8), "contribution", 2, 60_000)).not.toThrow();
  });

  it("uses the forwarded client address for anonymous sensitive metadata requests", () => {
    consumeRateLimit(context(), "metadata", 1, 60_000);
    expect(() => consumeRateLimit(context(), "metadata", 1, 60_000)).toThrow(/Too many requests/);
  });
});
