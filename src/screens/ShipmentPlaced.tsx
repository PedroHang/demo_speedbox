import { ShipmentForm, Party } from "../lib/schema";
import LabelDoc, { printLabel } from "../components/LabelDoc";

const MASTER = "933110010000";

const CHARGES: { label: string; amount: string }[] = [
  { label: "Courier", amount: "2088.24" },
  { label: "Clearance Processing Fee", amount: "227.00" },
  { label: "Demand Surcharge", amount: "85.00" },
  { label: "Fuel Surcharge", amount: "1032.10" },
  { label: "GST", amount: "617.82" },
];
const TOTAL = "4050.16";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
      <h3 className="text-sm font-bold text-navy uppercase tracking-wide mb-3">{title}</h3>
      {children}
    </div>
  );
}

function PartyBlock({ p }: { p: Party }) {
  return (
    <div className="text-sm text-ink leading-relaxed">
      <div className="font-semibold">{p.company}</div>
      <div className="text-muted">{p.name}</div>
      <div>{p.addressLine1}</div>
      {p.addressLine2 && <div>{p.addressLine2}</div>}
      <div>
        {p.city}, {p.state} {p.pincode}
      </div>
      <div>{p.country}</div>
      <div className="text-muted mt-1">
        {p.mobileCountryCode} {p.mobile}
      </div>
      <div className="text-muted">{p.email}</div>
    </div>
  );
}

function Line({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between py-1 text-sm">
      <span className="text-muted">{k}</span>
      <span className="text-ink font-medium text-right">{v}</span>
    </div>
  );
}

export default function ShipmentPlaced({
  form,
  onNewOrder,
}: {
  form: ShipmentForm;
  onNewOrder: () => void;
}) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
      {/* Success banner */}
      <div className="flex items-center gap-3 rounded-xl bg-ok/10 border border-ok/30 px-5 py-4">
        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-ok text-white text-lg">
          &#10003;
        </span>
        <div>
          <div className="text-ok font-bold text-lg">Your shipment has been placed!</div>
          <div className="text-sm text-muted">
            Master Shipment No <span className="font-semibold text-ink">{MASTER}</span>
          </div>
        </div>
      </div>

      {/* Warning strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-warn/10 border border-warn/40 px-5 py-4">
        <div className="flex items-center gap-2 text-sm text-ink">
          <span className="text-warn text-lg">&#9888;</span>
          Please download the shipping label and stick it on the box.
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => printLabel(form)}
            className="bg-navy text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-navyDeep"
          >
            Shipping Label
          </button>
          <button
            onClick={() => window.print()}
            className="border border-[#E5E7EB] text-ink rounded-lg px-4 py-2 text-sm font-semibold hover:bg-fieldBg"
          >
            Proforma Invoice
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card title="Shipper">
          <PartyBlock p={form.shipper} />
        </Card>
        <Card title="Consignee">
          <PartyBlock p={form.consignee} />
        </Card>

        <Card title="Charges (INR)">
          <div className="divide-y divide-[#F1F2F4]">
            {CHARGES.map((c) => (
              <Line key={c.label} k={c.label} v={c.amount} />
            ))}
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-[#E5E7EB]">
            <span className="font-bold text-ink">Total</span>
            <span className="font-bold text-navy">INR {TOTAL}</span>
          </div>
        </Card>

        <Card title="Shipment Details">
          <Line k="Pickup Date" v={form.pickup.date} />
          <Line k="Pickup Type" v={form.pickup.type} />
          <Line k="Shipment Type" v={form.meta.shipmentType} />
          <Line k="Chargeable Weight" v={`${form.box.weightKg} kg`} />
          <Line k="Mode" v={form.meta.mode} />
          <Line k="Pieces" v={form.meta.pieces} />
          <Line k="Insurance" v={form.meta.insurance ? "Yes" : "No"} />
          <Line k="Packaging" v={form.meta.packaging ? "Yes" : "No"} />
        </Card>

        <Card title="Service">
          <Line k="Carrier" v={form.service.carrier} />
          <Line k="Service" v={form.service.serviceName} />
          <Line k="ETA" v={`${form.service.etaDays} days`} />
          <Line k="Cost" v={`INR ${form.service.costINR}`} />
        </Card>

        <Card title="Shipping Label Preview">
          <div className="scale-[0.92] origin-top -mt-1">
            <LabelDoc form={form} />
          </div>
        </Card>
      </div>

      <div className="flex justify-end pt-2">
        <button
          onClick={onNewOrder}
          className="bg-navy text-white rounded-lg px-6 py-2.5 font-semibold hover:bg-navyDeep"
        >
          Place New order
        </button>
      </div>
    </div>
  );
}
