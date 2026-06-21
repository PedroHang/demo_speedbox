import type {
  ExtractionResult,
  ShipmentForm,
  ValidationResult,
} from "./schema";
import { mockExtract, mockCritic, mockCoherence } from "./mock";

// A document handed to the model: either raw bytes (image / PDF, read natively
// by the vision model) or extracted text (HTML / DOCX, converted client-side).
export interface DocPayload {
  base64?: string;
  mimeType?: string;
  text?: string;
  sampleId?: string;
}

// No caching anywhere: every analysis is a fresh model call. `cache: "no-store"`
// stops the browser from reusing any response, and the functions send
// `Cache-Control: no-store` too.
async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return (await res.json()) as T;
}

const NET_ERR = "Could not reach the AI service.";

// Calls the serverless function; if it is unavailable (plain `vite dev`, or a
// transient failure in production) we fall back to the bundled mock so the demo
// never breaks. On Vercel with GOOGLE_AI_API_KEY set, the function answers with
// real Gemini output and this fallback never runs.
export async function extractInvoice(
  input: DocPayload
): Promise<ExtractionResult> {
  try {
    return await postJSON<ExtractionResult>("/api/extract", input);
  } catch {
    return { ...mockExtract(input.sampleId), source: "mock", aiError: NET_ERR };
  }
}

export async function validateForm(
  form: ShipmentForm,
  image?: DocPayload
): Promise<ValidationResult> {
  try {
    return await postJSON<ValidationResult>("/api/critic", { form, image });
  } catch {
    return { ...mockCritic(image?.sampleId, form), source: "mock", aiError: NET_ERR };
  }
}

// Text-only coherence check for the manual path (no invoice image).
export async function checkCoherence(
  form: ShipmentForm
): Promise<ValidationResult> {
  try {
    return await postJSON<ValidationResult>("/api/coherence", { form });
  } catch {
    return { ...mockCoherence(form), source: "mock", aiError: NET_ERR };
  }
}

// Read a File into raw base64 (no `data:` prefix) + its mime type.
export function fileToBase64(
  file: File
): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      const base64 = comma >= 0 ? result.slice(comma + 1) : result;
      resolve({ base64, mimeType: file.type || "application/octet-stream" });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Turn any accepted invoice file into a model payload:
//   image/* and PDF  -> raw bytes (the vision model reads them natively)
//   HTML             -> the markup as text
//   DOCX             -> plain text via mammoth (lazy-loaded only when needed)
//   other text       -> the text
export async function fileToPayload(file: File): Promise<DocPayload> {
  const name = file.name.toLowerCase();
  const type = file.type || "";

  if (
    type.startsWith("image/") ||
    type === "application/pdf" ||
    /\.(png|jpe?g|webp|pdf)$/.test(name)
  ) {
    return fileToBase64(file);
  }

  if (type === "text/html" || /\.html?$/.test(name)) {
    return { text: await file.text() };
  }

  if (
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    /\.docx$/.test(name)
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const mod: any = await import("mammoth");
    const extractRawText = mod.extractRawText || mod.default?.extractRawText;
    const { value } = await extractRawText({ arrayBuffer });
    return { text: value };
  }

  if (type.startsWith("text/") || /\.(txt|csv|md)$/.test(name)) {
    return { text: await file.text() };
  }

  // unknown type: let the vision model try the raw bytes
  return fileToBase64(file);
}

// Fetch a bundled sample png and return raw base64 + mime type.
export async function loadSampleAsBase64(
  imgPath: string
): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(imgPath);
  const blob = await res.blob();
  const file = new File([blob], "sample", {
    type: blob.type || "image/png",
  });
  return fileToBase64(file);
}
