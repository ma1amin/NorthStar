import type { Request, Response } from "express";
import { getUserByOpenId, runFreshnessReviewSweep } from "./db";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

/** Heartbeat callback. It cannot publish or alter resource metadata; it only queues overdue human reviews. */
export async function runScheduledFreshnessSweep(request: Request, response: Response) {
  try {
    const caller = await sdk.authenticateRequest(request);
    if (!caller.isCron || !caller.taskUid) return response.status(403).json({ error: "cron-only" });
    const owner = await getUserByOpenId(ENV.ownerOpenId);
    if (!owner) return response.status(503).json({ error: "freshness-owner-unavailable", taskUid: caller.taskUid });
    const result = await runFreshnessReviewSweep({ checkedBy: owner.id, reviewAfterDays: 90, limit: 100 });
    return response.json({ ok: true, taskUid: caller.taskUid, ...result });
  } catch (error) {
    return response.status(500).json({ error: "freshness-sweep-failed", message: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() });
  }
}
