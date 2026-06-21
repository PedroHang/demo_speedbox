import type { ShipmentForm, ValidationIssue } from "./schema";

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
