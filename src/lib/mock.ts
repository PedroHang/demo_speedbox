import type {
  ExtractionResult,
  FieldMeta,
  ServiceChoice,
  ShipmentForm,
  ValidationResult,
} from "./schema";

const DEFAULT_SERVICE: ServiceChoice = {
  carrier: "FedEx",
  serviceName: "FedEx Export - Small Parcels",
  etaDays: 3,
  costINR: 4050.16,
};

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const HIGH = (sourceSnippet?: string): FieldMeta => ({
  confidence: "high",
  sourceSnippet,
});
const MED = (sourceSnippet?: string): FieldMeta => ({
  confidence: "medium",
  sourceSnippet,
});
const LOW = (sourceSnippet?: string): FieldMeta => ({
  confidence: "low",
  sourceSnippet,
});

// ---------------- APPAREL (clean) ----------------
const apparelForm: ShipmentForm = {
  shipper: {
    name: "Rohan Mehta",
    company: "Mumbai Threads Pvt. Ltd.",
    mobileCountryCode: "+91",
    mobile: "9820012345",
    email: "exports@mumbaithreads.in",
    addressLine1: "Unit 14, Andheri Industrial Estate",
    addressLine2: "Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    pincode: "400069",
  },
  shipperExtras: { idType: "GSTIN", idNumber: "27AABCM1234K1Z5" },
  consignee: {
    name: "James Carter",
    company: "Liberty Apparel LLC",
    mobileCountryCode: "+1",
    mobile: "212 555 0143",
    email: "ops@libertyapparel.com",
    addressLine1: "245 W 39th St",
    addressLine2: "Suite 800",
    city: "New York",
    state: "NY",
    country: "United States",
    pincode: "10018",
  },
  pickup: { type: "Pickup", date: tomorrowISO() },
  box: { lengthCm: 60, widthCm: 40, heightCm: 35, weightKg: 18 },
  meta: {
    shipmentType: "Parcel",
    mode: "B2B",
    pieces: 3,
    insurance: false,
    packaging: false,
  },
  goods: [
    {
      description: "Men's Cotton Trousers",
      quantity: 120,
      unitValueINR: 450,
      commodityCode: "Apparel",
      hsnCode: "620342",
    },
  ],
  declaredValueINR: 54000,
  service: DEFAULT_SERVICE,
};

const apparelMeta: Record<string, FieldMeta> = {
  "shipper.company": HIGH("Mumbai Threads Pvt. Ltd."),
  "shipper.name": HIGH("Rohan Mehta"),
  "shipper.city": HIGH("Mumbai"),
  "shipper.state": HIGH("Maharashtra"),
  "shipper.pincode": HIGH("400069"),
  "shipper.country": HIGH("India"),
  "shipperExtras.idNumber": HIGH("GSTIN 27AABCM1234K1Z5"),
  "consignee.company": HIGH("Liberty Apparel LLC"),
  "consignee.name": HIGH("James Carter"),
  "consignee.city": HIGH("New York"),
  "consignee.pincode": HIGH("10018"),
  "consignee.country": HIGH("United States"),
  "consignee.email": MED("ops@libertyapparel.com"),
  "goods.0.description": HIGH("Men's Cotton Trousers"),
  "goods.0.quantity": HIGH("120"),
  "goods.0.unitValueINR": HIGH("INR 450.00"),
  "goods.0.hsnCode": HIGH("HSN 620342"),
  "box.weightKg": HIGH("18 kg"),
  "declaredValueINR": HIGH("Total INR 54,000"),
};

// ---------------- ELECTRONICS (wrong HSN) ----------------
const electronicsForm: ShipmentForm = {
  shipper: {
    name: "Vikram Rao",
    company: "Bengaluru Microsystems Pvt Ltd",
    mobileCountryCode: "+91",
    mobile: "80 4123 6789",
    email: "exports@blrmicro.in",
    addressLine1: "Plot 22, Electronic City Phase 1",
    addressLine2: "",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    pincode: "560100",
  },
  shipperExtras: { idType: "GSTIN", idNumber: "29AAGCB9876P1Z2" },
  consignee: {
    name: "Emily Nguyen",
    company: "NorthStar Electronics Inc.",
    mobileCountryCode: "+1",
    mobile: "512 555 0199",
    email: "ops@northstar-elec.com",
    addressLine1: "1100 Congress Ave",
    addressLine2: "",
    city: "Austin",
    state: "TX",
    country: "United States",
    pincode: "78701",
  },
  pickup: { type: "Pickup", date: tomorrowISO() },
  box: { lengthCm: 50, widthCm: 40, heightCm: 30, weightKg: 12 },
  meta: {
    shipmentType: "Parcel",
    mode: "B2B",
    pieces: 4,
    insurance: false,
    packaging: false,
  },
  goods: [
    {
      description: "Wireless Bluetooth Earbuds (Model NS-200)",
      quantity: 200,
      unitValueINR: 600,
      commodityCode: "Electronics",
      hsnCode: "620520",
    },
    {
      description: "USB-C Wireless Charger",
      quantity: 100,
      unitValueINR: 350,
      commodityCode: "Electronics",
      hsnCode: "850440",
    },
  ],
  declaredValueINR: 155000,
  service: DEFAULT_SERVICE,
};

const electronicsMeta: Record<string, FieldMeta> = {
  "shipper.company": HIGH("Sold By: Bengaluru Microsystems Pvt Ltd"),
  "shipper.name": HIGH("Vikram Rao"),
  "shipper.city": HIGH("Bengaluru"),
  "shipper.state": HIGH("Karnataka"),
  "shipper.pincode": HIGH("560100"),
  "shipperExtras.idNumber": HIGH("GSTIN 29AAGCB9876P1Z2"),
  "consignee.company": HIGH("Ship To: NorthStar Electronics Inc."),
  "consignee.name": HIGH("Emily Nguyen"),
  "consignee.city": HIGH("Austin"),
  "consignee.pincode": HIGH("78701"),
  "goods.0.description": HIGH("Wireless Bluetooth Earbuds (Model NS-200)"),
  "goods.0.quantity": HIGH("200"),
  "goods.0.unitValueINR": HIGH("INR 600.00"),
  "goods.0.hsnCode": HIGH("HSN 620520"),
  "goods.1.description": HIGH("USB-C Wireless Charger"),
  "goods.1.hsnCode": HIGH("HSN 850440"),
  "box.weightKg": HIGH("12 kg"),
};

// ---------------- MANUFACTURER (missing HSN) ----------------
const manufacturerForm: ShipmentForm = {
  shipper: {
    name: "Anil Desai",
    company: "Surat Polymers & Components",
    mobileCountryCode: "+91",
    mobile: "261 2398776",
    email: "sales@suratpoly.co.in",
    addressLine1: "Survey 88, GIDC Sachin",
    addressLine2: "",
    city: "Surat",
    state: "Gujarat",
    country: "India",
    pincode: "394230",
  },
  shipperExtras: { idType: "IEC", idNumber: "0388123456" },
  consignee: {
    name: "Maria Gomez",
    company: "Apex Industrial Supply",
    mobileCountryCode: "+1",
    mobile: "305 555 0177",
    email: "purchasing@apexindustrial.com",
    addressLine1: "8800 NW 33rd St",
    addressLine2: "",
    city: "Doral",
    state: "FL",
    country: "United States",
    pincode: "33172",
  },
  pickup: { type: "Pickup", date: tomorrowISO() },
  box: { lengthCm: 80, widthCm: 60, heightCm: 55, weightKg: 64 },
  meta: {
    shipmentType: "Parcel",
    mode: "B2B",
    pieces: 10,
    insurance: false,
    packaging: false,
  },
  goods: [
    {
      description: "Industrial Rubber Gaskets (assorted)",
      quantity: 5000,
      unitValueINR: 12,
      commodityCode: "",
      hsnCode: "",
    },
  ],
  declaredValueINR: 60000,
  service: DEFAULT_SERVICE,
};

const manufacturerMeta: Record<string, FieldMeta> = {
  "shipper.company": HIGH("Consignor: Surat Polymers & Components"),
  "shipper.name": HIGH("Anil Desai"),
  "shipper.city": HIGH("Despatch From: Surat"),
  "shipper.state": HIGH("Gujarat"),
  "shipper.pincode": HIGH("394230"),
  "shipperExtras.idNumber": HIGH("IEC 0388123456"),
  "consignee.company": HIGH("Buyer: Apex Industrial Supply"),
  "consignee.name": HIGH("Maria Gomez"),
  "consignee.city": HIGH("Doral"),
  "consignee.pincode": HIGH("33172"),
  "goods.0.description": HIGH("Industrial Rubber Gaskets (assorted)"),
  "goods.0.quantity": HIGH("5000"),
  "goods.0.unitValueINR": HIGH("INR 12.00"),
  "goods.0.hsnCode": LOW(""),
  "box.weightKg": HIGH("64 kg"),
  "declaredValueINR": HIGH("Total INR 60,000"),
};

// ---------------- generic clean fallback ----------------
const genericForm: ShipmentForm = JSON.parse(JSON.stringify(apparelForm));
const genericMeta: Record<string, FieldMeta> = Object.fromEntries(
  Object.entries(apparelMeta).map(([k, v]) => [
    k,
    { confidence: "high", sourceSnippet: v.sourceSnippet },
  ])
);

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function mockExtract(sampleId?: string): ExtractionResult {
  switch (sampleId) {
    case "electronics":
      return { form: clone(electronicsForm), fieldMeta: clone(electronicsMeta) };
    case "manufacturer":
      return {
        form: clone(manufacturerForm),
        fieldMeta: clone(manufacturerMeta),
      };
    case "apparel":
      return { form: clone(apparelForm), fieldMeta: clone(apparelMeta) };
    default:
      return { form: clone(genericForm), fieldMeta: clone(genericMeta) };
  }
}

const CLEAN: ValidationResult = {
  issues: [],
  summary: "All fields look good. Ready to book.",
};

// `form` is optional: when re-validating after the user fixes a field, the mock
// inspects the corrected value and clears the issue, so the offline demo closes
// the loop (fix -> Re-validate -> green) the same way real Gemini would.
export function mockCritic(
  sampleId?: string,
  form?: ShipmentForm
): ValidationResult {
  const hsn0 = form?.goods?.[0]?.hsnCode?.trim();
  switch (sampleId) {
    case "electronics":
      if (hsn0 && hsn0 !== "620520") return CLEAN;
      return {
        issues: [
          {
            path: "goods.0.hsnCode",
            severity: "error",
            message:
              "HSN 620520 is apparel (men's shirts), but the item is electronic earbuds. Expected ~8518.30.",
            suggestedValue: "851830",
          },
        ],
        summary: "1 field needs review: HSN does not match the goods.",
      };
    case "manufacturer":
      if (hsn0) return CLEAN;
      return {
        issues: [
          {
            path: "goods.0.hsnCode",
            severity: "error",
            message:
              "HSN code is missing for 'Industrial Rubber Gaskets'. It is required for export customs.",
            suggestedValue: "401693",
          },
        ],
        summary: "1 field needs review: missing HSN.",
      };
    case "apparel":
    default:
      return CLEAN;
  }
}

// Text-only coherence check used by the MANUAL path (no invoice image). Flags
// internally implausible values as warnings. Mirrors what real Gemini returns
// so the offline demo behaves the same.
export function mockCoherence(form?: ShipmentForm): ValidationResult {
  const issues: ValidationResult["issues"] = [];
  if (form) {
    const w = form.box?.weightKg || 0;
    const desc = (form.goods?.[0]?.description || "").toLowerCase();
    const light =
      /pant|trouser|shirt|apparel|cloth|garment|document|paper|earbud|phone|sock|t-?shirt/.test(
        desc
      );
    if (light && w >= 40) {
      issues.push({
        path: "box.weightKg",
        severity: "warn",
        message: `${form.goods[0].description || "These goods"} weighing ${w} kg looks high. Are you sure?`,
      });
    }
    if (form.goods?.[0] && !form.goods[0].hsnCode) {
      issues.push({
        path: "goods.0.hsnCode",
        severity: "error",
        message: "HSN code is missing. It is required for export customs.",
      });
    }
    if (
      (form.declaredValueINR || 0) === 0 &&
      (form.goods?.[0]?.unitValueINR || 0) > 0
    ) {
      issues.push({
        path: "declaredValueINR",
        severity: "warn",
        message:
          "Declared value is 0 but the goods have a unit value. Please confirm.",
      });
    }
  }
  return {
    issues,
    summary:
      issues.length === 0
        ? "No coherence issues found."
        : `${issues.length} field(s) to review.`,
  };
}
