import type {
  AssistantShipment,
  ShipmentForm,
  ShipmentStatus,
  ValidationIssue,
} from "./schema";

// Lightweight client-side persistence (localStorage). Survives reloads; shared
// between the customer and admin views since they are the same app. Swap this
// module for a Vercel KV / Postgres-backed API later without touching the UI.

export interface ShipmentRecord {
  id: string;
  createdAt: number;
  method: "manual" | "ai";
  form: ShipmentForm;
  issues: ValidationIssue[];
  acknowledged: string[]; // field paths the user marked "This is correct"
  hasUnaddressed: boolean; // any flag neither fixed nor acknowledged at submit
  status?: ShipmentStatus; // lifecycle status; defaults to "Placed" when absent
}

const KEY = "speedbox.shipments";

function load(): ShipmentRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ShipmentRecord[]) : [];
  } catch {
    return [];
  }
}

let records: ShipmentRecord[] = load();
let snapshot: ShipmentRecord[] = records;
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    // ignore quota / private-mode errors
  }
  snapshot = records;
  listeners.forEach((l) => l());
}

export function computeUnaddressed(
  issues: ValidationIssue[],
  acknowledged: string[]
): boolean {
  return issues.some((i) => !acknowledged.includes(i.path));
}

export function newShipmentId(): string {
  return String(933110010000 + records.length);
}

export function addShipment(rec: ShipmentRecord) {
  records = [rec, ...records];
  persist();
}

export function updateShipment(id: string, patch: Partial<ShipmentRecord>) {
  records = records.map((r) => (r.id === id ? { ...r, ...patch } : r));
  persist();
}

export function subscribeShipments(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getShipments(): ShipmentRecord[] {
  return snapshot;
}

// Flatten a stored record into the shape the Ops Copilot reasons over. Strips
// PII the model does not need and derives origin/destination/open-warning views.
export function toAssistantShipment(rec: ShipmentRecord): AssistantShipment {
  return {
    id: rec.id,
    createdAt: rec.createdAt,
    method: rec.method,
    status: rec.status ?? "Placed",
    shipperCompany: rec.form.shipper.company,
    consigneeCompany: rec.form.consignee.company,
    origin: [rec.form.shipper.city, rec.form.shipper.country]
      .filter(Boolean)
      .join(", "),
    destination: [rec.form.consignee.city, rec.form.consignee.country]
      .filter(Boolean)
      .join(", "),
    carrier: rec.form.service.carrier,
    declaredValueINR: rec.form.declaredValueINR,
    weightKg: rec.form.box.weightKg,
    goods: rec.form.goods.map((g) => ({
      description: g.description,
      hsnCode: g.hsnCode,
      quantity: g.quantity,
    })),
    openWarnings: rec.issues
      .filter((i) => !rec.acknowledged.includes(i.path))
      .map((i) => ({ path: i.path, severity: i.severity, message: i.message })),
    hasUnaddressed: rec.hasUnaddressed,
  };
}

// Seed pre-populated demo shipments exactly once per browser. Guarded by a
// localStorage flag so a reload (or a second call) is a no-op.
export function seedShipments(recs: ShipmentRecord[]): void {
  try {
    if (localStorage.getItem("speedbox.seeded")) return;
  } catch {
    // private mode / no storage: skip seeding rather than risk a loop
    return;
  }
  records = [...recs, ...records];
  try {
    localStorage.setItem("speedbox.seeded", "1");
  } catch {
    // ignore quota / private-mode errors
  }
  persist();
}
