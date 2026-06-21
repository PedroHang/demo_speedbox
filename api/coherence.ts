import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runCoherence } from "./_core";
import type { ShipmentForm } from "../src/lib/schema";

const KEY =
  process.env.GOOGLE_AI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const body =
    typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const { form } = body as { form?: ShipmentForm };
  const { result } = await runCoherence(KEY, form);
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(result);
}
