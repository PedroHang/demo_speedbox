import { useMemo, useState, useSyncExternalStore } from "react";
import type { ShipmentForm, ValidationIssue } from "../lib/schema";
import {
  subscribeShipments,
  getShipments,
  updateShipment,
  computeUnaddressed,
  type ShipmentRecord,
} from "../lib/store";
import { checkCoherence } from "../lib/api";
import { recordUsage } from "../lib/usage";
import ReviewForm from "../components/ReviewForm";

function fmtDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function AdminPanel() {
  const shipments = useSyncExternalStore(subscribeShipments, getShipments);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => shipments.find((s) => s.id === selectedId) || null,
    [shipments, selectedId]
  );

  if (selected) {
    return (
      <AdminDetail
        key={selected.id}
        record={selected}
        onBack={() => setSelectedId(null)}
      />
    );
  }

  const flagged = shipments.filter((s) => s.hasUnaddressed).length;
  const openCount = (s: ShipmentRecord) =>
    s.issues.filter((i) => !s.acknowledged.includes(i.path)).length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Admin · Shipment History</h1>
      <p className="mt-1 text-sm text-muted">
        Every shipment placed by customers.{" "}
        {flagged > 0
          ? `${flagged} flagged for unaddressed AI warnings.`
          : "No open AI warnings."}
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-navy text-left text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">Shipment No</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Consignee</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Carrier</th>
              <th className="px-4 py-3">AI</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  No shipments yet. Place one from the customer side.
                </td>
              </tr>
            )}
            {shipments.map((s) => (
              <tr key={s.id} className="border-t border-[#E5E7EB] hover:bg-fieldBg">
                <td className="px-4 py-3 font-medium text-ink">{s.id}</td>
                <td className="px-4 py-3 text-muted">{fmtDate(s.createdAt)}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-fieldBg px-2 py-0.5 text-xs">
                    {s.method === "ai" ? "AI invoice" : "Manual"}
                  </span>
                </td>
                <td className="px-4 py-3 text-ink">
                  {s.form.consignee.company || s.form.consignee.name || "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {[s.form.consignee.city, s.form.consignee.country]
                    .filter(Boolean)
                    .join(", ") || "—"}
                </td>
                <td className="px-4 py-3 text-muted">{s.form.service.carrier}</td>
                <td className="px-4 py-3">
                  {s.hasUnaddressed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warn/15 px-2 py-0.5 text-xs font-semibold text-[#9A6A00]">
                      ⚑ {openCount(s)} open
                    </span>
                  ) : s.issues.length > 0 ? (
                    <span className="rounded-full bg-ok/10 px-2 py-0.5 text-xs font-semibold text-ok">
                      all confirmed
                    </span>
                  ) : (
                    <span className="text-xs text-muted">clean</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setSelectedId(s.id)}
                    className="rounded-lg border border-navy px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5"
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminDetail({
  record,
  onBack,
}: {
  record: ShipmentRecord;
  onBack: () => void;
}) {
  const [form, setForm] = useState<ShipmentForm>(() =>
    JSON.parse(JSON.stringify(record.form))
  );
  const [issues, setIssues] = useState<ValidationIssue[]>(record.issues);
  const [acknowledged, setAcknowledged] = useState<string[]>(record.acknowledged);
  const [revalidating, setRevalidating] = useState(false);

  const handleChange = (path: string, value: string | number | boolean) => {
    setForm((prev) => {
      const next: ShipmentForm = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let obj: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
        if (obj == null) return prev;
      }
      obj[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const handleAcknowledge = (path: string) => {
    setAcknowledged((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  };

  const handleRecheck = async () => {
    setRevalidating(true);
    try {
      const result = await checkCoherence(form);
      recordUsage("Admin re-check", result.usage);
      setIssues(result.issues);
    } finally {
      setRevalidating(false);
    }
  };

  const handleSave = () => {
    updateShipment(record.id, {
      form,
      issues,
      acknowledged,
      hasUnaddressed: computeUnaddressed(issues, acknowledged),
    });
    onBack();
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <button
        onClick={onBack}
        className="mb-3 text-sm font-medium text-navy hover:underline"
      >
        ← Back to history
      </button>
      <h1 className="text-2xl font-semibold text-ink">Shipment {record.id}</h1>
      <p className="mt-1 text-sm text-muted">
        Placed {fmtDate(record.createdAt)} ·{" "}
        {record.method === "ai" ? "AI invoice" : "Manual"} · every field the
        customer's AI flagged is shown below for review and correction.
      </p>
      <div className="mt-6">
        <ReviewForm
          form={form}
          fieldMeta={{}}
          issues={issues}
          revalidating={revalidating}
          mode="admin"
          checked
          acknowledged={acknowledged}
          onChange={handleChange}
          onRevalidate={handleRecheck}
          onAcknowledge={handleAcknowledge}
          onConfirm={handleSave}
          confirmLabel="Save corrections"
        />
      </div>
    </div>
  );
}
