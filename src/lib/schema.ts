// Canonical data contract for the Allied Express (Speedbox) demo.
// Every screen, component, and API function imports types from here.
// Do not redefine these shapes elsewhere.

export type Confidence = "high" | "medium" | "low";
export type Severity = "error" | "warn";

export interface Party {
  name: string;
  company: string;
  mobileCountryCode: string; // e.g. "+91"
  mobile: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface ShipperExtras {
  idType: string; // e.g. "GSTIN", "PAN", "IEC", "Aadhaar", ""
  idNumber: string;
}

export type PickupType = "Pickup" | "Dropoff";

export interface Pickup {
  type: PickupType;
  date: string; // ISO yyyy-mm-dd
}

export interface Box {
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  weightKg: number;
}

export type ShipmentType = "Parcel" | "Document";
export type ShipmentMode = "B2B" | "B2C";

export interface ShipmentMeta {
  shipmentType: ShipmentType;
  mode: ShipmentMode;
  pieces: number;
  insurance: boolean;
  packaging: boolean;
}

export interface GoodsLine {
  description: string;
  quantity: number;
  unitValueINR: number;
  commodityCode: string;
  hsnCode: string;
}

export interface ServiceChoice {
  carrier: string; // "FedEx"
  serviceName: string; // "FedEx Export - Small Parcels"
  etaDays: number; // 3
  costINR: number; // 4050.16
}

export interface ShipmentForm {
  shipper: Party;
  shipperExtras: ShipperExtras;
  consignee: Party;
  pickup: Pickup;
  box: Box;
  meta: ShipmentMeta;
  goods: GoodsLine[];
  declaredValueINR: number;
  service: ServiceChoice;
}

// Per-field provenance, keyed by dot/bracket path e.g. "shipper.name", "goods.0.hsnCode".
export type FieldPath = string;

export interface FieldMeta {
  confidence: Confidence;
  sourceSnippet?: string; // the literal invoice text the value was read from
}

// Token usage reported by the model for one call (from Gemini usageMetadata).
export interface TokenUsage {
  inputTokens: number; // promptTokenCount (text + image)
  outputTokens: number; // candidates + thinking tokens (both billed at output rate)
  totalTokens: number;
}

// ----- Ops Copilot assistant contract -----
// The lifecycle status of a shipment, surfaced in the Admin table and reasoned
// over by the Ops Copilot.
export type ShipmentStatus =
  | "Placed"
  | "At Warehouse"
  | "In Transit"
  | "Customs Hold"
  | "Delivered"
  | "Exception"
  | "RTO";

// A shipment flattened to exactly what the assistant needs to reason (no PII the
// model does not need). Built from a ShipmentRecord via store.toAssistantShipment.
export interface AssistantShipment {
  id: string;
  createdAt: number;
  method: "manual" | "ai";
  status: ShipmentStatus;
  shipperCompany: string;
  consigneeCompany: string;
  origin: string;
  destination: string;
  carrier: string;
  declaredValueINR: number;
  weightKg: number;
  goods: { description: string; hsnCode: string; quantity: number }[];
  openWarnings: { path: string; severity: "error" | "warn"; message: string }[];
  hasUnaddressed: boolean;
}

// A pointer from an answer to a specific shipment, with a short reason.
export interface AssistantRef {
  id: string;
  reason: string;
}

// A label/value figure the assistant surfaces alongside its answer.
export interface AssistantMetric {
  label: string;
  value: string;
}

// Request body for POST /api/assistant.
export interface AssistantRequest {
  question: string;
  shipments: AssistantShipment[];
  history?: { role: "user" | "assistant"; text: string }[];
}

// Response body for POST /api/assistant.
export interface AssistantResponse {
  answer: string;
  refs: AssistantRef[];
  metrics?: AssistantMetric[];
  usage?: TokenUsage;
  source?: "gemini" | "mock";
  aiError?: string;
}

// What /api/extract returns (after the function assembles Gemini's flat output).
export interface ExtractionResult {
  form: ShipmentForm;
  fieldMeta: Record<FieldPath, FieldMeta>;
  notes?: string;
  usage?: TokenUsage;
  source?: "gemini" | "mock"; // where the result actually came from
  aiError?: string; // set when we fell back to mock because the model failed
}

// What Gemini is asked to emit (flat, schema-friendly). The function maps this -> ExtractionResult.
export interface FlatExtractedField {
  path: FieldPath;
  value: string; // always a string; numbers/bools coerced when assembling the form
  confidence: Confidence;
  sourceSnippet?: string;
}
export interface GeminiExtractOutput {
  fields: FlatExtractedField[];
  notes?: string;
}

// What /api/critic returns. The critic re-reads the (possibly user-edited) form against the invoice.
export interface ValidationIssue {
  path: FieldPath;
  severity: Severity;
  message: string; // human-readable reason, shown in the Needs-Review badge tooltip
  suggestedValue?: string | number | null;
}
export interface ValidationResult {
  issues: ValidationIssue[];
  summary: string; // one-line e.g. "2 fields need review before booking."
  usage?: TokenUsage;
  source?: "gemini" | "mock";
  aiError?: string;
}

// Convenience: a field is flagged if any issue references its path.
export function issueFor(
  issues: ValidationIssue[],
  path: FieldPath
): ValidationIssue | undefined {
  return issues.find((i) => i.path === path);
}

// The screens of the demo, in order.
export type Screen =
  | "login"
  | "dashboard"
  | "rates"
  | "create"
  | "placed"
  | "admin";

const DEFAULT_SERVICE: ServiceChoice = {
  carrier: "FedEx",
  serviceName: "FedEx Export - Small Parcels",
  etaDays: 3,
  costINR: 4050.16,
};

// A blank shipment for the MANUAL entry path (user types everything). Optional
// `service` lets a carrier chosen on the Get Rates screen carry through.
export function emptyShipmentForm(service?: ServiceChoice): ShipmentForm {
  const party = (code: string): Party => ({
    name: "",
    company: "",
    mobileCountryCode: code,
    mobile: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  });
  return {
    shipper: party("+91"),
    shipperExtras: { idType: "", idNumber: "" },
    consignee: party("+1"),
    pickup: { type: "Pickup", date: "" },
    box: { lengthCm: 0, widthCm: 0, heightCm: 0, weightKg: 0 },
    meta: {
      shipmentType: "Parcel",
      mode: "B2B",
      pieces: 1,
      insurance: false,
      packaging: false,
    },
    goods: [
      { description: "", quantity: 0, unitValueINR: 0, commodityCode: "", hsnCode: "" },
    ],
    declaredValueINR: 0,
    service: service ?? { ...DEFAULT_SERVICE },
  };
}

// A bundled sample invoice the user can click to try the flow.
export interface SampleInvoice {
  id: "apparel" | "electronics" | "manufacturer";
  label: string; // shown on the card
  hint: string; // small descriptor
  imgPath: string; // /sample-invoices/<id>.png
}
