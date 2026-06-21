// Shared Gemini logic for the Ops Copilot assistant, used by BOTH the Vercel
// serverless function (production) and the Vite dev-server middleware (local
// `npm run dev`). The API key is passed in by the caller and never reaches the
// browser bundle (this module is only imported server-side). Mirrors api/_core.ts.
import { GoogleGenAI } from "@google/genai";
import { mockAssistant } from "../src/lib/assistantMock.js";
import type {
  AssistantRequest,
  AssistantResponse,
  TokenUsage,
} from "../src/lib/schema";

// Pull exact token counts from the Gemini response. Output billing includes
// thinking tokens, so we add thoughtsTokenCount to candidatesTokenCount.
function readUsage(r: any): TokenUsage {
  const um = r?.usageMetadata || {};
  const inputTokens = um.promptTokenCount || 0;
  const outputTokens =
    (um.candidatesTokenCount || 0) + (um.thoughtsTokenCount || 0);
  const totalTokens = um.totalTokenCount || inputTokens + outputTokens;
  return { inputTokens, outputTokens, totalTokens };
}

const MODEL = "gemini-2.5-flash";

const PROMPT = `You are the Allied Express operations copilot inside the courier company admin panel. You are given the full list of current shipments as JSON and a question from an admin. Answer concisely (1 to 4 sentences), grounded ONLY in the provided shipments. Never invent shipments, ids, or fields. When your answer points to specific shipments, list them in refs with their EXACT id from the data and a short reason. You can count, sum declared values, find the most urgent or problematic shipment (a Customs Hold, an Exception, or one with open AI warnings is more urgent than one In Transit or Delivered), summarize, and surface useful figures in metrics as label/value pairs. Return ONLY JSON of shape {"answer": string, "refs": [{"id": string, "reason": string}], "metrics": [{"label": string, "value": string}]}.`;

export async function runAssistant(
  key: string | undefined,
  body: any
): Promise<{ result: AssistantResponse; usedGemini: boolean; error?: string }> {
  const req = (body || {}) as AssistantRequest;
  if (!key || !req.question || !Array.isArray(req.shipments)) {
    return { result: { ...mockAssistant(req), source: "mock" }, usedGemini: false };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const parts: { text: string }[] = [
      { text: PROMPT },
      { text: "SHIPMENTS JSON:\n" + JSON.stringify(req.shipments) },
    ];
    if (Array.isArray(req.history) && req.history.length > 0) {
      parts.push({
        text:
          "CONVERSATION SO FAR:\n" +
          req.history.map((h) => `${h.role}: ${h.text}`).join("\n"),
      });
    }
    parts.push({ text: "ADMIN QUESTION: " + req.question });

    const r = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: { temperature: 0, responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(r.text || "{}") as AssistantResponse;

    const validIds = new Set(req.shipments.map((s) => s.id));
    const refs = Array.isArray(parsed.refs)
      ? parsed.refs.filter((ref) => ref && validIds.has(ref.id))
      : [];
    const answer =
      typeof parsed.answer === "string" && parsed.answer.trim()
        ? parsed.answer
        : "I could not find anything to report for that question.";

    const result: AssistantResponse = {
      answer,
      refs,
      metrics: Array.isArray(parsed.metrics) ? parsed.metrics : [],
      usage: readUsage(r),
      source: "gemini",
    };
    return { result, usedGemini: true };
  } catch (e) {
    const aiError = String((e as Error)?.message || e);
    console.error("[ai] assistant call failed:", aiError);
    return {
      result: { ...mockAssistant(req), source: "mock", aiError },
      usedGemini: false,
      error: aiError,
    };
  }
}
