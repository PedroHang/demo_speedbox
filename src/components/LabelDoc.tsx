import { ShipmentForm } from "../lib/schema";
import { brand } from "../lib/brand";

const MASTER = "933110010000";

function labelHtml(form: ShipmentForm): string {
  const s = form.shipper;
  const c = form.consignee;
  const g = form.goods[0];
  const dims = `${form.box.lengthCm} x ${form.box.widthCm} x ${form.box.heightCm} cm`;
  const stripes = Array.from({ length: 60 })
    .map(() => {
      const w = 1 + Math.floor(Math.random() * 4);
      return `<span style="display:inline-block;width:${w}px;height:60px;background:#111;margin-right:${1 + Math.floor(Math.random() * 3)}px"></span>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Shipping Label ${MASTER}</title>
<style>
  *{box-sizing:border-box;font-family:Inter,"Segoe UI",system-ui,sans-serif}
  body{margin:0;background:#e5e7eb;padding:24px}
  .label{width:680px;margin:0 auto;background:#fff;border:2px solid #111;padding:0}
  .row{display:flex}
  .top{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #111;padding:12px 16px}
  .brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:18px;color:${brand.colors.navy}}
  .chev{width:22px;height:22px;background:${brand.colors.orange};clip-path:polygon(0 0,60% 0,100% 50%,60% 100%,0 100%,40% 50%)}
  .ofN{font-size:16px;font-weight:700}
  .blocks{display:flex;border-bottom:2px solid #111}
  .blk{flex:1;padding:12px 16px}
  .blk+.blk{border-left:2px solid #111}
  .cap{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#444;font-weight:700;margin-bottom:4px}
  .name{font-weight:700;font-size:14px}
  .addr{font-size:12px;line-height:1.5;color:#222}
  .band{display:flex;justify-content:space-between;align-items:center;background:#111;color:#fff;padding:8px 16px;font-weight:700;font-size:14px}
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:2px solid #111}
  .cell{padding:8px 16px;border-top:1px solid #ccc}
  .cell:nth-child(-n+3){border-top:none}
  .k{font-size:9px;text-transform:uppercase;letter-spacing:.06em;color:#666;font-weight:700}
  .v{font-size:13px;font-weight:600;margin-top:2px}
  .master{text-align:center;font-size:28px;font-weight:900;letter-spacing:.1em;padding:10px}
  .barcode{display:flex;justify-content:center;align-items:flex-end;padding:0 16px 6px;overflow:hidden}
  .bcnum{text-align:center;font-size:20px;font-weight:800;letter-spacing:.35em;padding:0 0 12px}
  .foot{border-top:2px solid #111;padding:8px 16px;font-size:10px;color:#555;text-align:center}
  @media print{body{background:#fff;padding:0}.label{border:none}}
</style></head><body>
<div class="label">
  <div class="top">
    <div class="brand"><span class="chev"></span>ALLIED EXPRESS</div>
    <div class="ofN">1 of 1</div>
  </div>
  <div class="blocks">
    <div class="blk">
      <div class="cap">From</div>
      <div class="name">${s.company}</div>
      <div class="addr">${s.name}<br>${s.addressLine1}<br>${s.addressLine2 ? s.addressLine2 + "<br>" : ""}${s.city}, ${s.state} ${s.pincode}<br>${s.country}<br>${s.mobileCountryCode} ${s.mobile}</div>
    </div>
    <div class="blk">
      <div class="cap">Ship To</div>
      <div class="name">${c.company}</div>
      <div class="addr">${c.name}<br>${c.addressLine1}<br>${c.addressLine2 ? c.addressLine2 + "<br>" : ""}${c.city}, ${c.state} ${c.pincode}<br>${c.country}<br>${c.mobileCountryCode} ${c.mobile}</div>
    </div>
  </div>
  <div class="band"><span>${s.city} | ${c.city}</span><span>FedEx Export - Small Parcels</span></div>
  <div class="grid">
    <div class="cell"><div class="k">Ship Date</div><div class="v">${form.pickup.date}</div></div>
    <div class="cell"><div class="k">Gross Wt</div><div class="v">${form.box.weightKg} kg</div></div>
    <div class="cell"><div class="k">Chargeable Wt</div><div class="v">${form.box.weightKg} kg</div></div>
    <div class="cell"><div class="k">Dimensions</div><div class="v">${dims}</div></div>
    <div class="cell"><div class="k">Pieces</div><div class="v">${form.meta.pieces}</div></div>
    <div class="cell"><div class="k">Type</div><div class="v">NON-DOC</div></div>
    <div class="cell"><div class="k">Mode</div><div class="v">${form.meta.mode}</div></div>
    <div class="cell"><div class="k">Invoice Value</div><div class="v">${form.declaredValueINR} INR</div></div>
    <div class="cell"><div class="k">Description</div><div class="v">${g ? g.description : ""}</div></div>
  </div>
  <div class="master">## MASTER ##</div>
  <div class="barcode">${stripes}</div>
  <div class="bcnum">${MASTER}</div>
  <div class="foot">Subject to standard terms and conditions of carriage. ${brand.site.replace("https://", "")}</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`;
}

export function printLabel(form: ShipmentForm) {
  const w = window.open("", "_blank", "width=760,height=900");
  if (!w) return;
  w.document.open();
  w.document.write(labelHtml(form));
  w.document.close();
}

export default function LabelDoc({ form }: { form: ShipmentForm }) {
  const s = form.shipper;
  const c = form.consignee;
  const g = form.goods[0];
  const dims = `${form.box.lengthCm} x ${form.box.widthCm} x ${form.box.heightCm} cm`;
  return (
    <div className="bg-white border-2 border-black rounded-md overflow-hidden text-ink">
      <div className="flex justify-between items-center border-b-2 border-black px-4 py-3">
        <div className="flex items-center gap-2 font-extrabold text-lg text-navy">
          <span
            className="inline-block w-5 h-5 bg-orange"
            style={{ clipPath: "polygon(0 0,60% 0,100% 50%,60% 100%,0 100%,40% 50%)" }}
          />
          ALLIED EXPRESS
        </div>
        <div className="text-base font-bold">1 of 1</div>
      </div>
      <div className="flex border-b-2 border-black">
        <div className="flex-1 p-4">
          <div className="text-[10px] uppercase tracking-wide font-bold text-muted mb-1">From</div>
          <div className="font-bold text-sm">{s.company}</div>
          <div className="text-xs leading-relaxed text-ink">
            {s.name}
            <br />
            {s.addressLine1}
            <br />
            {s.addressLine2 && (
              <>
                {s.addressLine2}
                <br />
              </>
            )}
            {s.city}, {s.state} {s.pincode}
            <br />
            {s.country}
            <br />
            {s.mobileCountryCode} {s.mobile}
          </div>
        </div>
        <div className="flex-1 p-4 border-l-2 border-black">
          <div className="text-[10px] uppercase tracking-wide font-bold text-muted mb-1">Ship To</div>
          <div className="font-bold text-sm">{c.company}</div>
          <div className="text-xs leading-relaxed text-ink">
            {c.name}
            <br />
            {c.addressLine1}
            <br />
            {c.addressLine2 && (
              <>
                {c.addressLine2}
                <br />
              </>
            )}
            {c.city}, {c.state} {c.pincode}
            <br />
            {c.country}
            <br />
            {c.mobileCountryCode} {c.mobile}
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center bg-black text-white px-4 py-2 font-bold text-sm">
        <span>
          {s.city} | {c.city}
        </span>
        <span>FedEx Export - Small Parcels</span>
      </div>
      <div className="grid grid-cols-3 border-b-2 border-black">
        {[
          ["Ship Date", form.pickup.date],
          ["Gross Wt", `${form.box.weightKg} kg`],
          ["Chargeable Wt", `${form.box.weightKg} kg`],
          ["Dimensions", dims],
          ["Pieces", String(form.meta.pieces)],
          ["Type", "NON-DOC"],
          ["Mode", form.meta.mode],
          ["Invoice Value", `${form.declaredValueINR} INR`],
          ["Description", g ? g.description : ""],
        ].map(([k, v], i) => (
          <div key={i} className="px-4 py-2 border-t border-[#ccc] first:border-t-0 [&:nth-child(2)]:border-t-0 [&:nth-child(3)]:border-t-0">
            <div className="text-[9px] uppercase tracking-wide text-muted font-bold">{k}</div>
            <div className="text-[13px] font-semibold mt-0.5">{v}</div>
          </div>
        ))}
      </div>
      <div className="text-center text-3xl font-black tracking-widest py-2.5">## MASTER ##</div>
      <div className="flex justify-center items-end px-4 pb-1.5 gap-px overflow-hidden h-[60px]">
        {Array.from({ length: 60 }).map((_, i) => (
          <span
            key={i}
            className="inline-block bg-black"
            style={{ width: `${1 + (i % 4)}px`, height: "60px", marginRight: `${1 + (i % 3)}px` }}
          />
        ))}
      </div>
      <div className="text-center text-xl font-extrabold tracking-[0.35em] pb-3">{MASTER}</div>
      <div className="border-t-2 border-black px-4 py-2 text-[10px] text-muted text-center">
        Subject to standard terms and conditions of carriage. {brand.site.replace("https://", "")}
      </div>
    </div>
  );
}
