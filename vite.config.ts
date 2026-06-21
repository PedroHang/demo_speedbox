import { defineConfig, loadEnv, type Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "http";
import react from "@vitejs/plugin-react";
import { runExtract, runCritic, runCoherence } from "./api/_core";

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
      server.middlewares.use("/api/extract", async (req, res, next) => {
        if (req.method !== "POST") return next();
        const body = await readJson(req);
        const { result, usedGemini, error } = await runExtract(key, body);
        if (error) server.config.logger.warn(`[dev api] extract -> mock (Gemini error: ${error})`);
        else server.config.logger.info(`[dev api] extract via ${usedGemini ? "GEMINI" : "mock"}`);
        sendJson(res, result);
      });
      server.middlewares.use("/api/critic", async (req, res, next) => {
        if (req.method !== "POST") return next();
        const body = await readJson(req);
        const { result, usedGemini, error } = await runCritic(key, body);
        if (error) server.config.logger.warn(`[dev api] critic -> mock (Gemini error: ${error})`);
        else server.config.logger.info(`[dev api] critic via ${usedGemini ? "GEMINI" : "mock"}`);
        sendJson(res, result);
      });
      server.middlewares.use("/api/coherence", async (req, res, next) => {
        if (req.method !== "POST") return next();
        const body = await readJson(req);
        const { result, usedGemini, error } = await runCoherence(key, body.form);
        if (error) server.config.logger.warn(`[dev api] coherence -> mock (Gemini error: ${error})`);
        else server.config.logger.info(`[dev api] coherence via ${usedGemini ? "GEMINI" : "mock"}`);
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
