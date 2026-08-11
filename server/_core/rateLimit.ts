import { TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function clientKey(ctx: TrpcContext) {
  if (ctx.user) return `user:${ctx.user.id}`;
  const forwarded = ctx.req.headers["x-forwarded-for"];
  const address = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0]?.trim();
  return `ip:${address || ctx.req.socket?.remoteAddress || "unknown"}`;
}

/** In-memory limiter for abuse-sensitive routes. It deliberately stores only an
 * ephemeral opaque bucket key and should be replaced with shared storage before
 * multi-instance production deployment. */
export function consumeRateLimit(ctx: TrpcContext, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${scope}:${clientKey(ctx)}`;
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Too many requests. Please wait before trying again." });
  }
  current.count += 1;
}

export function resetRateLimitBucketsForTest() { buckets.clear(); }
