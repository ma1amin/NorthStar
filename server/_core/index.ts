import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerPublicApi } from "../publicApi";
import { runScheduledFreshnessSweep } from "../freshnessSchedule";
import { shouldServeStaticClient } from "../previewMode";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  registerPublicApi(app);
  app.post("/api/scheduled/freshness-review", runScheduledFreshnessSweep);
  // The managed browser preview uses a built bundle to avoid first-load Vite
  // transformation stalls. Vite middleware remains available for local work
  // only when PREVIEW_STATIC_CLIENT is not enabled.
  if (shouldServeStaticClient(process.env.NODE_ENV, process.env.PREVIEW_STATIC_CLIENT)) {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  const port = parseInt(process.env.PORT || "3000");

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
