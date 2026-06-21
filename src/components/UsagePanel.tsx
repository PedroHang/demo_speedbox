import { useEffect, useState, useSyncExternalStore } from "react";
import {
  subscribeUsage,
  getUsageSnapshot,
  clearUsage,
  perCallCost,
  PRICING,
} from "../lib/usage";
import AiIndicator from "./AiIndicator";

const usd = (n: number) => "$" + n.toFixed(6);

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

// Discreet, toggleable meter for the real Gemini token spend this session and
// what it costs in USD. Toggle with the corner pill or Alt+T.
export default function UsagePanel() {
  const [open, setOpen] = useState(false);
  const { entries, totals } = useSyncExternalStore(
    subscribeUsage,
    getUsageSnapshot
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Token usage & cost (Alt+T)"
        className="fixed bottom-3 right-3 z-40 flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white/80 px-2.5 py-1 text-[11px] font-medium text-muted opacity-40 shadow-sm backdrop-blur transition hover:opacity-100"
      >
        <AiIndicator size={13} />
        <span>{usd(totals.costUSD)}</span>
      </button>

      {open && (
        <div className="fixed bottom-12 right-3 z-50 w-80 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ink">Token usage</h4>
            <button
              onClick={() => setOpen(false)}
              className="text-lg leading-none text-muted hover:text-ink"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <p className="mt-0.5 text-[11px] text-muted">
            {PRICING.model} · ${PRICING.inputPerM.toFixed(2)}/1M in · $
            {PRICING.outputPerM.toFixed(2)}/1M out
          </p>

          <div className="mt-3 max-h-40 space-y-1 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="text-xs text-muted">
                No model calls yet. Run an invoice through the AI flow.
              </p>
            ) : (
              entries.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="truncate text-ink">{e.label}</span>
                  <span className="shrink-0 text-muted">
                    {e.inputTokens.toLocaleString("en-US")} in /{" "}
                    {e.outputTokens.toLocaleString("en-US")} out · {usd(perCallCost(e))}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 border-t border-[#E5E7EB] pt-3 text-xs">
            <Row label="Model calls" value={String(totals.calls)} />
            <Row label="Input tokens" value={totals.inputTokens.toLocaleString("en-US")} />
            <Row label="Output tokens" value={totals.outputTokens.toLocaleString("en-US")} />
            <Row label="Total tokens" value={totals.totalTokens.toLocaleString("en-US")} />
          </div>

          <div className="mt-3 rounded-lg bg-fieldBg p-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted">Session cost</span>
              <span className="text-lg font-bold text-navy">
                {usd(totals.costUSD)}
              </span>
            </div>
            <p className="text-right text-[11px] text-muted">
              ≈ ₹{totals.costINR.toFixed(4)}
            </p>
          </div>

          <button
            onClick={clearUsage}
            className="mt-3 w-full rounded-lg border border-[#E5E7EB] py-1.5 text-xs font-medium text-muted hover:bg-fieldBg"
          >
            Reset
          </button>
        </div>
      )}
    </>
  );
}
