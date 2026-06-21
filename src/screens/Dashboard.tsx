import { brand } from "../lib/brand";

interface DashboardProps {
  onSingleShipment: () => void;
  onGetRates?: () => void;
  onBulk?: () => void;
}

const inr = (n: number) =>
  "INR " + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const creditStats: { label: string; value: number; tone?: "ok" | "danger" }[] = [
  { label: "Total Outstanding", value: 80515.16, tone: "danger" },
  { label: "Credit Limit", value: 2500000.0 },
  { label: "Available Credit", value: 2419484.84, tone: "ok" },
  { label: "On Hold", value: 0.0 },
];

const tracking: { key: keyof typeof brand.status; label: string; count: number }[] = [
  { key: "placed", label: "Placed", count: 4 },
  { key: "inTransit", label: "In Transit", count: 1 },
  { key: "cancelled", label: "Cancelled", count: 19 },
  { key: "delivered", label: "Delivered", count: 1 },
  { key: "atWarehouse", label: "At Warehouse", count: 2 },
  { key: "forwarded", label: "Forwarded", count: 1 },
  { key: "rto", label: "RTO", count: 1 },
  { key: "exception", label: "Exception", count: 1 },
];

const TOTAL = tracking.reduce((s, t) => s + t.count, 0);

function Donut() {
  const radius = 70;
  const stroke = 26;
  const circ = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg viewBox="0 0 180 180" className="w-44 h-44">
      <g transform="rotate(-90 90 90)">
        {tracking.map((t) => {
          const frac = t.count / TOTAL;
          const len = frac * circ;
          const seg = (
            <circle
              key={t.key}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={brand.status[t.key]}
              strokeWidth={stroke}
              strokeDasharray={`${len} ${circ - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return seg;
        })}
      </g>
      <text x="90" y="84" textAnchor="middle" className="fill-ink font-bold text-2xl">
        {TOTAL}
      </text>
      <text x="90" y="104" textAnchor="middle" className="fill-muted text-[10px]">
        Total Shipments
      </text>
    </svg>
  );
}

function OverviewBars() {
  const data = [
    { label: "Jan", exp: 40, imp: 22 },
    { label: "Feb", exp: 55, imp: 30 },
    { label: "Mar", exp: 48, imp: 38 },
    { label: "Apr", exp: 70, imp: 45 },
    { label: "May", exp: 62, imp: 28 },
    { label: "Jun", exp: 80, imp: 52 },
  ];
  const max = 90;
  const bw = 14;
  const gap = 10;
  const groupW = bw * 2 + 6;
  return (
    <svg viewBox="0 0 360 160" className="w-full h-40">
      <line x1="30" y1="130" x2="350" y2="130" stroke="#E5E7EB" />
      {data.map((d, i) => {
        const x = 40 + i * (groupW + gap);
        const eh = (d.exp / max) * 100;
        const ih = (d.imp / max) * 100;
        return (
          <g key={d.label}>
            <rect x={x} y={130 - eh} width={bw} height={eh} rx="2" fill={brand.colors.navy} />
            <rect x={x + bw + 4} y={130 - ih} width={bw} height={ih} rx="2" fill={brand.colors.orange} />
            <text x={x + bw} y="145" textAnchor="middle" className="fill-muted text-[9px]">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard({ onSingleShipment, onGetRates, onBulk }: DashboardProps) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">
          Welcome to ALLIED EXPRESS PVT. LTD.!
        </h1>
        <p className="text-muted text-sm mt-1">Here is what is happening with your shipments today.</p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={onGetRates}
          className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 text-left hover:shadow-md transition"
        >
          <div className="text-2xl">💱</div>
          <div className="mt-3 font-semibold text-ink">Get Rates</div>
          <div className="text-sm text-muted mt-1">Compare carrier prices before you book.</div>
        </button>

        <button
          onClick={onSingleShipment}
          className="rounded-xl shadow-md p-5 text-left text-white bg-navy hover:brightness-110 transition ring-2 ring-orange relative overflow-hidden"
        >
          <div className="absolute top-3 right-3 text-[10px] font-semibold bg-orange px-2 py-0.5 rounded-full">
            Start here
          </div>
          <div className="text-2xl">📦</div>
          <div className="mt-3 font-semibold text-lg">Place a Single Shipment</div>
          <div className="text-sm text-white/80 mt-1">
            Upload an invoice and we auto-fill the form.
          </div>
        </button>

        <button
          onClick={onBulk}
          className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 text-left hover:shadow-md transition"
        >
          <div className="text-2xl">🗂️</div>
          <div className="mt-3 font-semibold text-ink">Place a Bulk Shipment</div>
          <div className="text-sm text-muted mt-1">Upload many orders at once via sheet.</div>
        </button>
      </div>

      {/* Credit details */}
      <div>
        <h2 className="text-lg font-semibold text-ink mb-3">Credit Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {creditStats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4">
              <div className="text-xs text-muted">{s.label}</div>
              <div
                className={
                  "mt-2 text-lg font-bold " +
                  (s.tone === "ok" ? "text-ok" : s.tone === "danger" ? "text-danger" : "text-ink")
                }
              >
                {inr(s.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 lg:col-span-2">
          <h2 className="text-lg font-semibold text-ink mb-3">Tracking Status</h2>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Donut />
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 flex-1">
              {tracking.map((t) => (
                <div key={t.key} className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{ background: brand.status[t.key] }}
                  />
                  <span className="text-ink">{t.label}</span>
                  <span className="ml-auto font-semibold text-ink">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
          <h2 className="text-lg font-semibold text-ink mb-3">General Overview</h2>
          <OverviewBars />
          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: brand.colors.navy }} />
              <span className="text-muted">Export</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: brand.colors.orange }} />
              <span className="text-muted">Import</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
