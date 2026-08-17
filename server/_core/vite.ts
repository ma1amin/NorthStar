import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getPublicSeoMetadata, injectPublicFallback, injectSeoHead, renderPublicFallback } from "../seo.ts";
import { isViteAssetRequest } from "../viteRouting";

function requestOrigin(req: express.Request) {
  const protocol = req.get("x-forwarded-proto")?.split(",")[0] || req.protocol || "http";
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost";
  return `${protocol}://${host}`;
}

async function renderPublicHtml(template: string, requestUrl: string, origin: string) {
  const url = new URL(requestUrl, origin);
  const [metadata, fallback] = await Promise.all([
    getPublicSeoMetadata(url.pathname, origin),
    renderPublicFallback(url.pathname),
  ]);
  return injectPublicFallback(injectSeoHead(template, metadata), fallback);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    // A Vite module or static asset must never receive the HTML fallback. If the
    // middleware cannot serve it, return a clear asset error instead of causing
    // the browser to keep the unstyled server-rendered content indefinitely.
    if (isViteAssetRequest(url)) {
      res.status(404).type("text/plain").send("Preview asset was not found.");
      return;
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = await renderPublicHtml(template, url, requestOrigin(req));
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath, { index: false }));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (req, res, next) => {
    try {
      const template = await fs.promises.readFile(path.resolve(distPath, "index.html"), "utf-8");
      const page = await renderPublicHtml(template, req.originalUrl, requestOrigin(req));
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (error) {
      next(error);
    }
  });
}
