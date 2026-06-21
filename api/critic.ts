import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runCritic } from "./_core";

const KEY =
  process.env.GOOGLE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const body =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const { form, image } = body as {
    form?: import("../src/lib/schema").ShipmentForm;
    image?: { base64?: string; mimeType?: string; sampleId?: string };
  };
  const { result } = await runCritic(KEY, { form, image });
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(result);
}
