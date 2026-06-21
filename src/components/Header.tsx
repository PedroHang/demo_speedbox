import { useState } from "react";

// Top bar: a working "Track Shipment" search (routes to the admin shipment list
// and highlights the match), bell, user chip.
export default function Header({ onSearch }: { onSearch?: (q: string) => void }) {
  const [q, setQ] = useState("");
  const submit = () => {
    const v = q.trim();
    if (v) onSearch?.(v);
  };

  return (
    <header className="h-16 shrink-0 bg-white border-b border-[#E5E7EB] flex items-center gap-4 px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <button
            type="button"
            onClick={submit}
            aria-label="Search shipments"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted text-sm hover:text-navy"
          >
            🔍
          </button>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Track Shipment (number, consignee, destination…)"
            className="w-full bg-fieldBg rounded-lg pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-navy/20"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button
          className="relative w-9 h-9 rounded-lg hover:bg-fieldBg flex items-center justify-center text-muted"
          aria-label="Notifications"
        >
          <span className="text-lg">🔔</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-orange rounded-full" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-semibold flex items-center justify-center">
            PH
          </div>
          <span className="text-sm font-medium text-ink hidden sm:block">
            Pedro Hang
          </span>
        </div>
      </div>
    </header>
  );
}
