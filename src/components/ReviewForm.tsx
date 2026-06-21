import { useEffect, type ReactNode } from "react";
import type {
  ShipmentForm,
  FieldMeta,
  ValidationIssue,
} from "../lib/schema";
import { issueFor } from "../lib/schema";
import FieldRow from "./FieldRow";
import AiIndicator from "./AiIndicator";

// Module scope on purpose: a component defined inside render gets a new identity
// each render, which would remount the form on every keystroke (focus loss /
// scroll jump). Hoisting keeps inputs mounted.
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-bold text-ink">{title}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

type Mode = "ai" | "manual" | "admin";

export default function ReviewForm({
  form,
  fieldMeta,
  issues,
  revalidating,
  mode = "ai",
  checked = false,
  acknowledged,
  onChange,
  onRevalidate,
  onAcknowledge,
  onConfirm,
  confirmLabel,
}: {
  form: ShipmentForm;
  fieldMeta: Record<string, FieldMeta>;
  issues: ValidationIssue[];
  revalidating: boolean;
  mode?: Mode;
  checked?: boolean;
  acknowledged: string[];
  onChange: (path: string, value: string | number | boolean) => void;
  onRevalidate: () => void;
  onAcknowledge: (path: string) => void;
  onConfirm: () => void;
  confirmLabel?: string;
}) {
  const isAck = (p: string) => acknowledged.includes(p);
  const unacked = issues.filter((i) => !isAck(i.path));
  const errorCount = unacked.filter((i) => i.severity === "error").length;
  const hasOpen = unacked.length > 0;

  const firstIssuePath =
    unacked.find((i) => i.severity === "error")?.path ?? unacked[0]?.path;

  const scrollToFirstIssue = (focus: boolean) => {
    if (!firstIssuePath) return;
    const el = document.getElementById(firstIssuePath);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    if (focus) (el as HTMLInputElement).focus({ preventScroll: true });
  };

  // Auto-jump on a validation RUN (issues/acknowledged change), never on a keystroke.
  useEffect(() => {
    if (!firstIssuePath) return;
    const raf = requestAnimationFrame(() => scrollToFirstIssue(false));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, acknowledged]);

  const row = (
    label: string,
    path: string,
    value: string | number,
    type: "text" | "number" = "text"
  ) => (
    <FieldRow
      key={path}
      label={label}
      path={path}
      value={value}
      type={type}
      meta={fieldMeta[path]}
      issue={issueFor(issues, path)}
      acknowledged={isAck(path)}
      onChange={onChange}
      onAcknowledge={() => onAcknowledge(path)}
    />
  );

  const partyRows = (p: typeof form.shipper, base: string) => (
    <>
      {row("Company", `${base}.company`, p.company)}
      {row("Contact name", `${base}.name`, p.name)}
      {row("Address line 1", `${base}.addressLine1`, p.addressLine1)}
      {row("Address line 2", `${base}.addressLine2`, p.addressLine2)}
      {row("City", `${base}.city`, p.city)}
      {row("State", `${base}.state`, p.state)}
      {row("Country", `${base}.country`, p.country)}
      {row("Pincode", `${base}.pincode`, p.pincode)}
      {row("Mobile code", `${base}.mobileCountryCode`, p.mobileCountryCode)}
      {row("Mobile", `${base}.mobile`, p.mobile)}
      {row("Email", `${base}.email`, p.email)}
    </>
  );

  const checkLabel = revalidating
    ? "Checking…"
    : mode === "ai"
    ? "Re-validate"
    : checked
    ? "Re-check with AI"
    : "Check with AI";

  // ----- top banner per mode -----
  let banner: ReactNode;
  if (mode === "manual" && !checked) {
    banner = (
      <div className="flex items-center justify-between gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4">
        <div>
          <p className="text-sm font-semibold text-ink">Manual entry</p>
          <p className="text-xs text-muted">
            Fill in every field yourself. Run an AI coherence check when ready, it
            warns about anything that does not add up (warnings only, never
            blocked).
          </p>
        </div>
        <button
          type="button"
          onClick={onRevalidate}
          disabled={revalidating}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navyDeep disabled:opacity-60"
        >
          {revalidating ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <AiIndicator size={14} tone="white" />
          )}
          {checkLabel}
        </button>
      </div>
    );
  } else {
    const good = !hasOpen;
    const title =
      mode === "admin"
        ? "Admin review"
        : mode === "manual"
        ? good
          ? "AI coherence check passed"
          : "AI flagged some fields"
        : hasOpen
        ? "AI review found issues"
        : "AI review passed";
    const sub =
      issues.length === 0
        ? mode === "manual"
          ? "Nothing looks off."
          : "All fields look good. Ready to book."
        : `${unacked.length} open · ${acknowledged.length} confirmed${
            mode !== "ai" ? " · warnings only, you can place anyway" : ""
          }`;
    banner = (
      <div
        onClick={hasOpen ? () => scrollToFirstIssue(true) : undefined}
        className={
          "flex items-center justify-between gap-4 rounded-xl border p-4 " +
          (good
            ? "border-ok/30 bg-ok/5"
            : errorCount > 0
            ? "border-danger/30 bg-danger/5"
            : "border-warn/40 bg-warn/10") +
          (hasOpen ? " cursor-pointer hover:brightness-[0.99]" : "")
        }
      >
        <div className="flex items-center gap-3">
          <span
            className={
              "flex h-8 w-8 items-center justify-center rounded-full text-white " +
              (good ? "bg-ok" : errorCount > 0 ? "bg-danger" : "bg-warn")
            }
            aria-hidden
          >
            {good ? "✓" : "!"}
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <AiIndicator size={14} />
              {title}
            </p>
            <p className="text-xs text-muted">
              {sub}
              {hasOpen && (
                <span className="ml-1 font-medium text-navy underline">
                  Jump to it
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRevalidate();
          }}
          disabled={revalidating}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-navy px-3 py-2 text-sm font-semibold text-navy hover:bg-navy/5 disabled:opacity-60"
        >
          {revalidating ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy/30 border-t-navy" />
          ) : (
            <AiIndicator size={14} />
          )}
          {checkLabel}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {banner}

      <Section title="Shipper">{partyRows(form.shipper, "shipper")}</Section>

      <Section title="Shipper ID">
        {row("ID type", "shipperExtras.idType", form.shipperExtras.idType)}
        {row("ID number", "shipperExtras.idNumber", form.shipperExtras.idNumber)}
      </Section>

      <Section title="Consignee">{partyRows(form.consignee, "consignee")}</Section>

      <Section title="Pickup or Drop-off">
        {row("Type", "pickup.type", form.pickup.type)}
        {row("Date", "pickup.date", form.pickup.date)}
      </Section>

      <Section title="Box & Goods">
        {row("Length (cm)", "box.lengthCm", form.box.lengthCm, "number")}
        {row("Width (cm)", "box.widthCm", form.box.widthCm, "number")}
        {row("Height (cm)", "box.heightCm", form.box.heightCm, "number")}
        {row("Weight (kg)", "box.weightKg", form.box.weightKg, "number")}
        {row("Pieces", "meta.pieces", form.meta.pieces, "number")}
        {row("Declared value (INR)", "declaredValueINR", form.declaredValueINR, "number")}
      </Section>

      {form.goods.map((g, i) => (
        <Section key={i} title={`Goods line ${i + 1}`}>
          {row("Description", `goods.${i}.description`, g.description)}
          {row("Quantity", `goods.${i}.quantity`, g.quantity, "number")}
          {row("Unit value (INR)", `goods.${i}.unitValueINR`, g.unitValueINR, "number")}
          {row("Commodity", `goods.${i}.commodityCode`, g.commodityCode)}
          {row("HSN code", `goods.${i}.hsnCode`, g.hsnCode)}
        </Section>
      ))}

      <section className="rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-ink">Service</h3>
        <div className="flex items-center justify-between rounded-lg bg-fieldBg p-3">
          <div>
            <p className="text-sm font-semibold text-ink">
              {form.service.carrier} · {form.service.serviceName}
            </p>
            <p className="text-xs text-muted">ETA {form.service.etaDays} days</p>
          </div>
          <p className="text-sm font-bold text-navy">
            ₹{form.service.costINR.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </section>

      <div className="space-y-2 pt-1">
        {hasOpen && (
          <p className="rounded-lg bg-warn/10 px-3 py-2 text-xs text-[#9A6A00]">
            {unacked.length} field{unacked.length > 1 ? "s" : ""} still flagged.
            These are warnings, you can {mode === "admin" ? "save" : "place"}{" "}
            anyway, or mark each as correct.
          </p>
        )}
        <button
          type="button"
          onClick={onConfirm}
          className="w-full rounded-lg bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-navyDeep"
        >
          {confirmLabel ?? "Confirm & Place Shipment"}
        </button>
      </div>
    </div>
  );
}
