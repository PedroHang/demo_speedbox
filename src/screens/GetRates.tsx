import { useState } from "react";
import type { ServiceChoice } from "../lib/schema";
import LocationAutocomplete from "../components/LocationAutocomplete";

interface GetRatesProps {
  onBook: (service: ServiceChoice) => void;
  onBack: () => void;
}

interface Carrier {
  key: string;
  name: string;
  service: string;
  etaDays: number;
  base: number;
  perKg: number;
  color: string;
}

// Mock rate card. Cost = base + perKg * chargeableWeight, so quotes respond to
// the weight the user enters (no real carrier API — those need accounts + OAuth
// and contract-specific rates). Tuned so ~2 kg lands near real-world numbers.
const CARRIERS: Carrier[] = [
  { key: "dhl", name: "DHL", service: "DHL Export - Priority", etaDays: 4, base: 3200, perKg: 412, color: "#D40511" },
  { key: "aramex", name: "Aramex", service: "Aramex - Ecom", etaDays: 5, base: 2700, perKg: 336, color: "#E4002B" },
  { key: "fedex", name: "FedEx", service: "FedEx Export - Small Parcels", etaDays: 3, base: 3250, perKg: 400, color: "#4D148C" },
  { key: "ups", name: "UPS", service: "UPS - Express Saver", etaDays: 7, base: 2300, perKg: 282, color: "#5A3B1B" },
];

const inr = (n: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Field({
  label,
  value,
  onChange,
  placeholder,
  req,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  req?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label} {req && <span className="text-danger">*</span>}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-md border border-transparent bg-fieldBg px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-navy/30"
      />
    </div>
  );
}

export default function GetRates({ onBook, onBack }: GetRatesProps) {
  const [pickup, setPickup] = useState("");
  const [pickupPin, setPickupPin] = useState("");
  const [dest, setDest] = useState("");
  const [destPin, setDestPin] = useState("");
  const [type, setType] = useState<"Parcel" | "Document">("Parcel");
  const [weight, setWeight] = useState("");
  const [results, setResults] = useState<{ carrier: Carrier; cost: number }[] | null>(
    null
  );

  const w = Math.max(parseFloat(weight) || 0, 0);
  const canQuote = pickup.trim() !== "" && dest.trim() !== "" && w > 0;
  const chargeable = Math.max(w, 0.5);

  const quote = () => {
    setResults(
      CARRIERS.map((c) => ({
        carrier: c,
        cost: Math.round((c.base + c.perKg * chargeable) * 100) / 100,
      }))
    );
  };

  const cheapest = results ? Math.min(...results.map((r) => r.cost)) : 0;
  const fastest = results ? Math.min(...results.map((r) => r.carrier.etaDays)) : 0;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Get Rates</h1>
      <p className="mt-1 text-sm text-muted">
        Compare carriers before you book. Enter where it goes and how heavy it is.
      </p>

      <div className="mt-6 rounded-xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <LocationAutocomplete
            label="Pickup"
            req
            value={pickup}
            onChange={setPickup}
            onSelect={(p) => p.postcode && setPickupPin(p.postcode)}
            placeholder="Pickup location"
          />
          <Field label="Pickup Pincode" value={pickupPin} onChange={setPickupPin} placeholder="Pickup pincode" />
          <LocationAutocomplete
            label="Destination"
            req
            value={dest}
            onChange={setDest}
            onSelect={(p) => p.postcode && setDestPin(p.postcode)}
            placeholder="Destination location"
          />
          <Field label="Destination Pincode" value={destPin} onChange={setDestPin} placeholder="Destination pincode" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Shipment Type
            </label>
            <div className="mt-2 flex gap-5">
              {(["Parcel", "Document"] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm text-ink">
                  <input type="radio" checked={type === t} onChange={() => setType(t)} />
                  {t}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted">
              Weight <span className="text-danger">*</span>
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Weight"
                className="w-full rounded-md border border-transparent bg-fieldBg px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-navy/30"
              />
              <span className="rounded-md bg-fieldBg px-3 py-2 text-sm text-muted">kg</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onBack}
            className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-sm font-semibold text-ink hover:bg-fieldBg"
          >
            Back
          </button>
          <button
            onClick={quote}
            disabled={!canQuote}
            className="rounded-lg bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navyDeep disabled:opacity-50"
          >
            Get Rates
          </button>
        </div>
      </div>

      {results && (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Services Available</h2>
            <span className="rounded-full bg-fieldBg px-3 py-1 text-xs text-muted">
              Chargeable Weight: {chargeable.toFixed(2)} kg
            </span>
          </div>
          <div className="space-y-3">
            {results.map(({ carrier, cost }) => {
              const isCheapest = cost === cheapest;
              const isFastest = carrier.etaDays === fastest;
              return (
                <div
                  key={carrier.key}
                  className="flex flex-col gap-3 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="inline-flex h-9 min-w-[68px] items-center justify-center rounded-md px-2 text-sm font-bold text-white"
                      style={{ background: carrier.color }}
                    >
                      {carrier.name}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {carrier.service}
                        {isCheapest && (
                          <span className="ml-2 rounded-full bg-ok/10 px-2 py-0.5 text-[11px] font-semibold text-ok">
                            Cheapest
                          </span>
                        )}
                        {isFastest && (
                          <span className="ml-2 rounded-full bg-orange/10 px-2 py-0.5 text-[11px] font-semibold text-orange">
                            Fastest
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted">{carrier.etaDays} days transit</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-6 sm:justify-end">
                    <p className="text-base font-bold text-navy">₹{inr(cost)}</p>
                    <button
                      onClick={() =>
                        onBook({
                          carrier: carrier.name,
                          serviceName: carrier.service,
                          etaDays: carrier.etaDays,
                          costINR: cost,
                        })
                      }
                      className="rounded-lg bg-orange px-4 py-2 text-sm font-semibold text-white hover:brightness-105"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted">
            Rates are simulated for this demo (computed from weight). Booking a carrier
            carries it into the shipment.
          </p>
        </div>
      )}
    </div>
  );
}
