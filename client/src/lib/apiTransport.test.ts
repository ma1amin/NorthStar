import { describe, expect, it } from "vitest";
import { ensureJsonTrpcResponse } from "./apiTransport";

describe("ensureJsonTrpcResponse", () => {
  it("accepts JSON responses returned by the tRPC endpoint", () => {
    const response = new Response("[]", { status: 200, headers: { "content-type": "application/json; charset=utf-8" } });
    expect(ensureJsonTrpcResponse(response)).toBe(response);
  });

  it("rejects an HTML fallback before the tRPC transformer attempts JSON parsing", () => {
    const response = new Response("<!doctype html><html></html>", { status: 200, headers: { "content-type": "text/html" } });
    expect(() => ensureJsonTrpcResponse(response)).toThrow("TRPC_NON_JSON_RESPONSE");
  });
});
