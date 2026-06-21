import { defineConfig, loadEnv, type Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import react from "@vitejs/plugin-react";

// The /api functions use explicit `.js` extensions on relative imports (required
// by Node ESM on Vercel). esbuild (which bundles this config) can't resolve
// `.js`-pointing-to-`.ts`, so the dev middleware loads the core through Vite's
// own resolver at request time via server.ssrLoadModule instead of a static import.

// Reads a JSON request body from a Node stream.
function readJson(req: IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function sendJson(res: ServerResponse, body: unknown) {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

// Dev-only: serve /api/extract and /api/critic from the same shared core that the
// Vercel functions use, so `npm run dev` runs REAL Gemini when a key is present.
// The key stays in this Node process; it is never sent to the browser bundle.
function devApi(key: string | undefined): Plugin {
  return {
    name: "speedbox-dev-api",
    configureServer(server) {
      // Vite resolves the .js specifiers to .ts here (unlike esbuild config bundling).
      const loadCore = () => server.ssrLoadModule("/api/_core.ts");

      server.middlewares.use("/api/extract", async (req, res, next) => {
        if (req.method !== "POST") return next();
        const body = await readJson(req);
        const { runExtract } = await loadCore();
        const { result, usedGemini, error } = await runExtract(key, body);
        if (error) server.config.logger.warn(`[dev api] extract -> mock (Gemini error: ${error})`);
        else server.config.logger.info(`[dev api] extract via ${usedGemini ? "GEMINI" : "mock"}`);
        sendJson(res, result);
      });
      server.middlewares.use("/api/critic", async (req, res, next) => {
        if (req.method !== "POST") return next();
        const body = await readJson(req);
        const { runCritic } = await loadCore();
        const { result, usedGemini, error } = await runCritic(key, body);
        if (error) server.config.logger.warn(`[dev api] critic -> mock (Gemini error: ${error})`);
        else server.config.logger.info(`[dev api] critic via ${usedGemini ? "GEMINI" : "mock"}`);
        sendJson(res, result);
      });
      server.middlewares.use("/api/coherence", async (req, res, next) => {
        if (req.method !== "POST") return next();
        const body = await readJson(req);
        const { runCoherence } = await loadCore();
        const { result, usedGemini, error } = await runCoherence(key, body.form);
        if (error) server.config.logger.warn(`[dev api] coherence -> mock (Gemini error: ${error})`);
        else server.config.logger.info(`[dev api] coherence via ${usedGemini ? "GEMINI" : "mock"}`);
        sendJson(res, result);
      });
      server.middlewares.use("/api/assistant", async (req, res, next) => {
        if (req.method !== "POST") return next();
        const body = await readJson(req);
        const { runAssistant } = await server.ssrLoadModule("/api/_assistant.ts");
        const { result, usedGemini, error } = await runAssistant(key, body);
        if (error) server.config.logger.warn(`[dev api] assistant -> mock (Gemini error: ${error})`);
        else server.config.logger.info(`[dev api] assistant via ${usedGemini ? "GEMINI" : "mock"}`);
        sendJson(res, result);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // load all env (incl. unprefixed) from .env / .env.local for the dev middleware
  const env = loadEnv(mode, process.cwd(), "");
  const key =
    env.GOOGLE_AI_API_KEY || env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
  return { plugins: [react(), devApi(key)] };
});
