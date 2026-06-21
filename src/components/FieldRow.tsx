import { useState } from "react";
import type { FieldMeta, ValidationIssue } from "../lib/schema";
import ConfidenceBadge from "./ConfidenceBadge";

// A single labeled, editable field. Visual emphasis escalates:
//   medium/low confidence  -> amber left border + ConfidenceBadge
//   active issue (warn)    -> warn ring + Needs-review badge + expander
//   active issue (error)   -> danger ring + Needs-review badge + expander
//   acknowledged issue     -> green left border + "Confirmed" badge
export default function FieldRow({
  label,
  path,
  value,
  meta,
  issue,
  acknowledged = false,
  type = "text",
  onChange,
  onAcknowledge,
}: {
  label: string;
  path: string;
  value: string | number;
  meta?: FieldMeta;
  issue?: ValidationIssue;
  acknowledged?: boolean;
  type?: "text" | "number";
  onChange: (path: string, value: string | number) => void;
  onAcknowledge?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const lowConf = meta?.confidence === "medium" || meta?.confidence === "low";
  const active = !!issue && !acknowledged;
  const isError = active && issue?.severity === "error";
  const isWarn = active && issue?.severity === "warn";

  let wrap = "border border-[#E5E7EB]";
  if (lowConf && !issue) wrap = "border border-[#E5E7EB] border-l-4 border-l-warn";
  if (issue && acknowledged) wrap = "border border-[#E5E7EB] border-l-4 border-l-ok";
  if (isWarn) wrap = "border-2 border-warn ring-1 ring-warn/30";
  if (isError) wrap = "border-2 border-danger ring-1 ring-danger/30";

  const handle = (raw: string) => {
    if (type === "number") {
      const n = raw === "" ? 0 : Number(raw);
      onChange(path, Number.isNaN(n) ? 0 : n);
    } else {
      onChange(path, raw);
    }
  };

  const snippet = meta?.sourceSnippet;
  const hasSuggestion =
    issue?.suggestedValue !== undefined &&
    issue?.suggestedValue !== null &&
    issue?.suggestedValue !== "";

  return (
    <div className={"rounded-lg bg-white p-3 " + wrap}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label
          htmlFor={path}
          className="text-xs font-semibold uppercase tracking-wide text-muted"
        >
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {issue && acknowledged ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-ok/10 px-2 py-0.5 text-[11px] font-semibold text-ok">
              ✓ Confirmed
            </span>
          ) : (
            <ConfidenceBadge confidence={meta?.confidence} issue={active ? issue : undefined} />
          )}
          {issue && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="text-[11px] font-medium text-orange hover:underline"
            >
              {open ? "Hide" : "Why?"}
            </button>
          )}
        </div>
      </div>

      <input
        id={path}
        type={type}
        value={value}
        title={snippet ? `read from: ${snippet}` : undefined}
        onChange={(e) => handle(e.target.value)}
        className={
          "w-full rounded-md bg-fieldBg px-3 py-2 text-sm text-ink outline-none focus:ring-2 focus:ring-navy/40 " +
          (isError
            ? "border border-danger/40"
            : isWarn
            ? "border border-warn/50"
            : "border border-transparent")
        }
      />

      {snippet && (
        <p className="mt-1 truncate text-[11px] italic text-muted" title={snippet}>
          read from: {snippet}
        </p>
      )}

      {issue && open && (
        <div
          className={
            "mt-2 rounded-md p-2 text-xs " +
            (isError ? "bg-danger/5 text-danger" : "bg-warn/10 text-[#9A6A00]")
          }
        >
          <p>{issue.message}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {hasSuggestion && (
              <button
                type="button"
                onClick={() => onChange(path, issue!.suggestedValue as string | number)}
                className="rounded-md bg-navy px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-navyDeep"
              >
                Use suggestion: {String(issue!.suggestedValue)}
              </button>
            )}
            {onAcknowledge &&
              (acknowledged ? (
                <button
                  type="button"
                  onClick={onAcknowledge}
                  className="rounded-md border border-[#E5E7EB] px-2.5 py-1 text-[11px] font-medium text-muted hover:bg-fieldBg"
                >
                  Undo confirm
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onAcknowledge}
                  className="rounded-md border border-ok/40 px-2.5 py-1 text-[11px] font-semibold text-ok hover:bg-ok/5"
                >
                  This is correct
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
