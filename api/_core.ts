// Shared Gemini logic used by BOTH the Vercel serverless functions (production)
// and the Vite dev-server middleware (local `npm run dev`). Keeping it here means
// localhost and Vercel behave identically. The API key is passed in by the caller
// and never reaches the browser bundle (this module is only imported server-side).
import { GoogleGenAI } from "@google/genai";
import type {
  Confidence,
  ExtractionResult,
  FieldMeta,
  GeminiExtractOutput,
  ServiceChoice,
  ShipmentForm,
  TokenUsage,
  ValidationResult,
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
import { mockExtract, mockCritic, mockCoherence } from "./_mock.js";

const MODEL = "gemini-2.5-flash";

const DEFAULT_SERVICE: ServiceChoice = {
  carrier: "FedEx",
  serviceName: "FedEx Export - Small Parcels",
  etaDays: 3,
  costINR: 4050.16,
};

const EXTRACT_PROMPT = `You read commercial/proforma invoices of ANY layout and wording. Extract shipment booking fields. For each field output path, value (string), confidence (high|medium|low), and sourceSnippet (the literal invoice text you read it from). If a required field is absent leave value empty and confidence low. Do not guess shipper vs consignee — for an EXPORT the India-based GST/IEC party is the shipper; if ambiguous mark medium.
Use these paths: shipper.name, shipper.company, shipper.mobileCountryCode, shipper.mobile, shipper.email, shipper.addressLine1, shipper.addressLine2, shipper.city, shipper.state, shipper.country, shipper.pincode, shipperExtras.idType, shipperExtras.idNumber, consignee.* (same keys), box.lengthCm, box.widthCm, box.heightCm, box.weightKg, meta.shipmentType, meta.mode, meta.pieces, goods.<i>.description, goods.<i>.quantity, goods.<i>.unitValueINR, goods.<i>.commodityCode, goods.<i>.hsnCode, declaredValueINR.
Return ONLY JSON of shape {"fields":[{"path","value","confidence","sourceSnippet"}],"notes"?}.`;

const CRITIC_PROMPT = `You are a customs/ops reviewer. Compare the FORM (JSON) against the INVOICE image and logistics rules, and flag fields that need a human look.
Return ONLY JSON: {"issues":[{"path","severity","message","suggestedValue"?}],"summary"}. severity is "error" or "warn". message is one short sentence. suggestedValue (optional) is the corrected value as a string.
CRITICAL: each issue.path MUST be EXACTLY one of these field paths (the single field the user should look at), using this dotted scheme with goods indexed like goods.0.hsnCode:
shipper.name, shipper.company, shipper.mobile, shipper.email, shipper.addressLine1, shipper.city, shipper.state, shipper.country, shipper.pincode, shipperExtras.idNumber, consignee.name, consignee.company, consignee.mobile, consignee.email, consignee.addressLine1, consignee.city, consignee.state, consignee.country, consignee.pincode, box.lengthCm, box.widthCm, box.heightCm, box.weightKg, meta.pieces, goods.<i>.description, goods.<i>.quantity, goods.<i>.unitValueINR, goods.<i>.commodityCode, goods.<i>.hsnCode, declaredValueINR.
Checks: HSN code matches the goods description; HSN present for every goods line; the India GST/IEC party must be the shipper/exporter (if shipper and consignee look reversed, flag shipper.company AND consignee.company); pincode/postal matches the city/country; declared value plausible (not obviously under-declared); weight/dimensions sane; required contact fields present. Be conservative: flag, do not block. summary = one line.`;

// The exact set of field paths the UI renders inputs for. Used to snap the
// model's issue paths onto real fields so every issue lights up a field (and
// the banner count matches the highlights). Goods indices come from the form.
function buildValidPaths(form?: ShipmentForm): Set<string> {
  const partyKeys = [
    "company", "name", "addressLine1", "addressLine2", "city", "state",
    "country", "pincode", "mobileCountryCode", "mobile", "email",
  ];
  const set = new Set<string>();
  for (const base of ["shipper", "consignee"]) {
    for (const k of partyKeys) set.add(`${base}.${k}`);
  }
  [
    "shipperExtras.idType", "shipperExtras.idNumber", "pickup.type",
    "pickup.date", "box.lengthCm", "box.widthCm", "box.heightCm",
    "box.weightKg", "meta.pieces", "declaredValueINR",
  ].forEach((p) => set.add(p));
  (form?.goods || []).forEach((_, i) =>
    ["description", "quantity", "unitValueINR", "commodityCode", "hsnCode"].forEach(
      (k) => set.add(`goods.${i}.${k}`)
    )
  );
  return set;
}

// Snap each issue's path onto a real field path; drop the ones that cannot be
// mapped and dedupe to one issue per field, so the count always matches the UI.
function normalizeIssues(
  issues: ValidationResult["issues"],
  form?: ShipmentForm
): ValidationResult["issues"] {
  if (!Array.isArray(issues)) return [];
  const valid = buildValidPaths(form);
  const lower = new Map([...valid].map((p) => [p.toLowerCase(), p]));
  const out: ValidationResult["issues"] = [];
  const seen = new Set<string>();
  for (const it of issues) {
    if (!it || typeof it.path !== "string") continue;
    let p = it.path.trim().replace(/\[(\d+)\]/g, ".$1");
    if (!valid.has(p)) {
      const hit = lower.get(p.toLowerCase());
      if (hit) p = hit;
      else continue;
    }
    if (seen.has(p)) continue;
    seen.add(p);
    out.push({ ...it, path: p });
  }
  return out;
}

function emptyForm(): ShipmentForm {
  const party = () => ({
    name: "",
    company: "",
    mobileCountryCode: "",
    mobile: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return {
    shipper: party(),
    shipperExtras: { idType: "", idNumber: "" },
    consignee: party(),
    pickup: { type: "Pickup", date: d.toISOString().slice(0, 10) },
    box: { lengthCm: 0, widthCm: 0, heightCm: 0, weightKg: 0 },
    meta: {
      shipmentType: "Parcel",
      mode: "B2B",
      pieces: 1,
      insurance: false,
      packaging: false,
    },
    goods: [],
    declaredValueINR: 0,
    service: { ...DEFAULT_SERVICE },
  };
}

const NUMERIC = new Set([
  "lengthCm",
  "widthCm",
  "heightCm",
  "weightKg",
  "pieces",
  "quantity",
  "unitValueINR",
  "declaredValueINR",
]);

function coerceNumber(v: string): number {
  const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function assemble(out: GeminiExtractOutput): ExtractionResult {
  const form = emptyForm();
  const fieldMeta: Record<string, FieldMeta> = {};
  for (const f of out.fields || []) {
    if (!f || !f.path) continue;
    const segs = f.path.split(".");
    const leaf = segs[segs.length - 1];
    if (segs[0] === "goods") {
      const idx = Number(segs[1]);
      while (form.goods.length <= idx) {
        form.goods.push({
          description: "",
          quantity: 0,
          unitValueINR: 0,
          commodityCode: "",
          hsnCode: "",
        });
      }
    }
    let target: any = form;
    for (let i = 0; i < segs.length - 1; i++) {
      target = target[segs[i]];
      if (target == null) break;
    }
    if (target != null && leaf in target) {
      const conf: Confidence = (f.confidence as Confidence) || "low";
      target[leaf] = NUMERIC.has(leaf) ? coerceNumber(f.value) : f.value;
      fieldMeta[f.path] = { confidence: conf, sourceSnippet: f.sourceSnippet };
    }
  }
  if (form.goods.length === 0) {
    form.goods.push({
      description: "",
      quantity: 0,
      unitValueINR: 0,
      commodityCode: "",
      hsnCode: "",
    });
  }
  return { form, fieldMeta, notes: out.notes };
}

export interface ExtractInput {
  base64?: string;
  mimeType?: string;
  text?: string;
  sampleId?: string;
}
export interface CriticInput {
  form?: ShipmentForm;
  image?: { base64?: string; mimeType?: string; text?: string; sampleId?: string };
}

// Build the document part for the model: extracted text (HTML/DOCX) becomes a
// text part; otherwise the raw bytes go in as inline image/PDF data.
function docPart(d: { base64?: string; mimeType?: string; text?: string }) {
  if (d.text != null && d.text !== "") {
    return { text: `INVOICE (document text):\n${d.text}` };
  }
  return {
    inlineData: { mimeType: d.mimeType || "image/png", data: d.base64 || "" },
  };
}

export interface CoreResult<T> {
  result: T;
  usedGemini: boolean;
  error?: string;
}

export async function runExtract(
  key: string | undefined,
  input: ExtractInput
): Promise<CoreResult<ExtractionResult>> {
  if (!key || (!input.base64 && !input.text)) {
    return { result: { ...mockExtract(input.sampleId), source: "mock" }, usedGemini: false };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const r = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [{ text: EXTRACT_PROMPT }, docPart(input)],
        },
      ],
      config: { temperature: 0, responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(r.text || "{}") as GeminiExtractOutput;
    const out = assemble(parsed);
    out.usage = readUsage(r);
    out.source = "gemini";
    return { result: out, usedGemini: true };
  } catch (e) {
    const aiError = String((e as Error)?.message || e);
    console.error("[ai] model call failed:", aiError);
    return {
      result: { ...mockExtract(input.sampleId), source: "mock", aiError },
      usedGemini: false,
      error: aiError,
    };
  }
}

export async function runCritic(
  key: string | undefined,
  input: CriticInput
): Promise<CoreResult<ValidationResult>> {
  if (!key || (!input.image?.base64 && !input.image?.text) || !input.form) {
    return {
      result: { ...mockCritic(input.image?.sampleId, input.form), source: "mock" },
      usedGemini: false,
    };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const r = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: CRITIC_PROMPT },
            { text: `FORM JSON:\n${JSON.stringify(input.form)}` },
            docPart(input.image),
          ],
        },
      ],
      config: { temperature: 0, responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(r.text || "{}") as ValidationResult;
    parsed.issues = normalizeIssues(parsed.issues, input.form);
    parsed.summary =
      parsed.issues.length === 0
        ? "All fields look good. Ready to book."
        : `${parsed.issues.length} field(s) need review before booking.`;
    parsed.usage = readUsage(r);
    parsed.source = "gemini";
    return { result: parsed, usedGemini: true };
  } catch (e) {
    const aiError = String((e as Error)?.message || e);
    console.error("[ai] model call failed:", aiError);
    return {
      result: { ...mockCritic(input.image?.sampleId, input.form), source: "mock", aiError },
      usedGemini: false,
      error: aiError,
    };
  }
}

const COHERENCE_PROMPT = `You are a logistics data reviewer. You are given a shipment booking FORM as JSON (there is NO invoice image). Check it for INTERNAL inconsistencies and implausible values. These are advisory WARNINGS the user can override, not blockers.
Look for: a declared weight that does not match the goods (e.g. light apparel / documents weighing tens of kg, or heavy machinery at a fraction of a kg); box dimensions that are inconsistent with the weight; a declared value that is implausible for the goods and quantity; an HSN code that does not match the goods description; a pincode/postal that does not match the city or country. Also flag clearly missing required fields (HSN, weight, consignee address).
Return ONLY JSON {"issues":[{"path","severity","message","suggestedValue"?}],"summary"}. Use severity "warn" for plausibility flags and "error" only for missing required fields. message = one short sentence phrased as a caution or question (e.g. "120 pairs of trousers weighing 60 kg looks high. Are you sure?").
CRITICAL: each issue.path MUST be EXACTLY one of: shipper.name, shipper.company, shipper.mobile, shipper.email, shipper.addressLine1, shipper.city, shipper.state, shipper.country, shipper.pincode, shipperExtras.idNumber, consignee.name, consignee.company, consignee.mobile, consignee.email, consignee.addressLine1, consignee.city, consignee.state, consignee.country, consignee.pincode, box.lengthCm, box.widthCm, box.heightCm, box.weightKg, meta.pieces, goods.<i>.description, goods.<i>.quantity, goods.<i>.unitValueINR, goods.<i>.commodityCode, goods.<i>.hsnCode, declaredValueINR.`;

// Text-only coherence/plausibility check for the MANUAL path (no invoice image).
export async function runCoherence(
  key: string | undefined,
  form?: ShipmentForm
): Promise<CoreResult<ValidationResult>> {
  if (!key || !form) {
    return { result: { ...mockCoherence(form), source: "mock" }, usedGemini: false };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const r = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: COHERENCE_PROMPT },
            { text: `FORM JSON:\n${JSON.stringify(form)}` },
          ],
        },
      ],
      config: { temperature: 0, responseMimeType: "application/json" },
    });
    const parsed = JSON.parse(r.text || "{}") as ValidationResult;
    parsed.issues = normalizeIssues(parsed.issues, form);
    parsed.summary =
      parsed.issues.length === 0
        ? "No coherence issues found."
        : `${parsed.issues.length} field(s) to review.`;
    parsed.usage = readUsage(r);
    parsed.source = "gemini";
    return { result: parsed, usedGemini: true };
  } catch (e) {
    const aiError = String((e as Error)?.message || e);
    console.error("[ai] model call failed:", aiError);
    return {
      result: { ...mockCoherence(form), source: "mock", aiError },
      usedGemini: false,
      error: aiError,
    };
  }
}
