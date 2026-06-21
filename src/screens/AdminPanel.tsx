import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type {
  ShipmentForm,
  ShipmentStatus,
  ValidationIssue,
} from "../lib/schema";
import {
  subscribeShipments,
  getShipments,
  updateShipment,
  computeUnaddressed,
  toAssistantShipment,
  type ShipmentRecord,
} from "../lib/store";
import { checkCoherence } from "../lib/api";
import { recordUsage } from "../lib/usage";
import { seedShipmentsIfEmpty } from "../lib/seed";
import ReviewForm from "../components/ReviewForm";
import AssistantPanel from "../components/AssistantPanel";

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

// Free-text match across the fields a courier clerk would search by.
function matchesQuery(s: ShipmentRecord, term: string): boolean {
  const hay = [
    s.id,
    s.form.consignee.company,
    s.form.consignee.name,
    s.form.shipper.company,
    s.form.shipper.name,
    s.form.consignee.city,
    s.form.consignee.country,
    s.form.service.carrier,
    s.status ?? "Placed",
    s.method === "ai" ? "ai invoice" : "manual",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(term);
}

// Map a lifecycle status to a small colored badge using the Allied tokens.
function StatusBadge({ status }: { status: ShipmentStatus }) {
  const styles: Record<ShipmentStatus, string> = {
    Delivered: "bg-ok/10 text-ok",
    "In Transit": "bg-navy/10 text-navy",
    "Customs Hold": "bg-danger/10 text-danger",
    Exception: "bg-warn/15 text-[#9A6A00]",
    "At Warehouse": "bg-orange/10 text-orange",
    RTO: "bg-muted/15 text-muted",
    Placed: "bg-muted/15 text-muted",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function AdminPanel({ query }: { query?: string }) {
  const shipments = useSyncExternalStore(subscribeShipments, getShipments);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [q, setQ] = useState(query ?? "");
  const selected = useMemo(
    () => shipments.find((s) => s.id === selectedId) || null,
    [shipments, selectedId]
  );

  // Seed the demo fleet once so the table (and the copilot) has data on open.
  useEffect(() => {
    seedShipmentsIfEmpty();
  }, []);

  // When the copilot references a shipment, leave any open detail, scroll its
  // row into view and pulse it. A rAF lets the list re-render before we look up
  // the row element.
  function focusShipment(id: string) {
    if (selectedId) setSelectedId(null);
    setFocusId(id);
  }

  useEffect(() => {
    if (!focusId) return;
    requestAnimationFrame(() => {
      const el = document.getElementById("ship-row-" + focusId);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("ship-flash");
      setTimeout(() => el?.classList.remove("ship-flash"), 2400);
    });
  }, [focusId, selectedId]);

  const flagged = shipments.filter((s) => s.hasUnaddressed).length;
  const openCount = (s: ShipmentRecord) =>
    s.issues.filter((i) => !s.acknowledged.includes(i.path)).length;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return term ? shipments.filter((s) => matchesQuery(s, term)) : shipments;
  }, [shipments, q]);

  // The header "Track Shipment" search routes here with a query: mirror it into
  // the table filter and, if it pins down a single shipment, highlight that row.
  useEffect(() => {
    if (query == null) return;
    setQ(query);
    const term = query.trim().toLowerCase();
    if (!term) return;
    const matches = shipments.filter((s) => matchesQuery(s, term));
    if (matches.length === 1) focusShipment(matches[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <>
      {selected ? (
        <AdminDetail
          key={selected.id}
          record={selected}
          onBack={() => setSelectedId(null)}
        />
      ) : (
        <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Admin · Shipment History</h1>
      <p className="mt-1 text-sm text-muted">
        Every shipment placed by customers.{" "}
        {flagged > 0
          ? `${flagged} flagged for unaddressed AI warnings.`
          : "No open AI warnings."}
      </p>

      <div className="mt-5 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm"
            aria-hidden
          >
            🔍
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search number, consignee, destination, status…"
            className="w-full rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-navy/20"
          />
        </div>
        {q && (
          <button
            onClick={() => setQ("")}
            className="text-xs font-medium text-navy hover:underline"
          >
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted">
          {filtered.length} of {shipments.length}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-navy text-left text-xs uppercase tracking-wide text-white">
            <tr>
              <th className="px-4 py-3">Shipment No</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Consignee</th>
              <th className="px-4 py-3">Destination</th>
              <th className="px-4 py-3">Carrier</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">AI</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {shipments.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  No shipments yet. Place one from the customer side.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-muted">
                  No shipments match “{q}”.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr
                  key={s.id}
                  id={"ship-row-" + s.id}
                  className="border-t border-[#E5E7EB] hover:bg-fieldBg"
                >
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
                    <StatusBadge status={s.status ?? "Placed"} />
                  </td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
        </div>
      )}

      <AssistantPanel
        shipments={shipments.map(toAssistantShipment)}
        onFocusShipment={focusShipment}
      />
    </>
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
