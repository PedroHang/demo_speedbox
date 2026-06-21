import { useEffect, useRef, useState } from "react";

export interface PlacePick {
  label: string;
  postcode?: string;
}

interface Suggestion {
  label: string;
  postcode?: string;
  key: string;
}

// Compose a readable label from OSM/Photon properties, de-duping repeats.
function buildLabel(p: any): string {
  const parts: string[] = [];
  const push = (s?: string) => {
    if (s && !parts.includes(s)) parts.push(s);
  };
  push(p?.name);
  push(p?.city);
  push(p?.state);
  push(p?.country);
  return parts.join(", ");
}

// Free, key-less place autocomplete via Photon (OpenStreetMap). Returns real
// locations as the user types and surfaces a postcode when one is available so
// the caller can auto-fill the pincode, the way the real Speedbox form does.
export default function LocationAutocomplete({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  req,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect?: (p: PlacePick) => void;
  placeholder?: string;
  req?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const skip = useRef(false); // suppress the fetch that a selection would trigger
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const q = value.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`,
          { signal: ctrl.signal }
        );
        const data = await res.json();
        const items: Suggestion[] = (data.features || [])
          .map((f: any, i: number) => ({
            label: buildLabel(f.properties),
            postcode: f.properties?.postcode,
            key: `${f.properties?.osm_id ?? "x"}-${i}`,
          }))
          .filter((s: Suggestion) => s.label);
        setSuggestions(items);
        setOpen(true);
      } catch {
        // network error / abort — leave the field fully usable, just no list
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const pick = (s: Suggestion) => {
    skip.current = true;
    onChange(s.label);
    onSelect?.({ label: s.label, postcode: s.postcode });
    setOpen(false);
    setSuggestions([]);
  };

  return (
    <div className="relative" ref={boxRef}>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label} {req && <span className="text-danger">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (suggestions.length) setOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="mt-2 w-full rounded-md border border-transparent bg-fieldBg px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-navy/30"
      />
      {open && (suggestions.length > 0 || loading) && (
        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-[#E5E7EB] bg-white shadow-lg">
          {loading && suggestions.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted">Searching…</div>
          )}
          {suggestions.map((s) => (
            <button
              key={s.key}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-fieldBg"
            >
              <span className="mt-0.5 text-orange">📍</span>
              <span>{s.label}</span>
            </button>
          ))}
          <div className="border-t border-[#E5E7EB] px-3 py-1 text-right text-[10px] text-muted">
            Powered by OpenStreetMap
          </div>
        </div>
      )}
    </div>
  );
}
