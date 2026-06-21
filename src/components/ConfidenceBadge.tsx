import type { Confidence, ValidationIssue } from "../lib/schema";
import AiIndicator from "./AiIndicator";

// Small inline badge. If an issue exists it wins (Needs review). Otherwise show
// a confidence pill for medium/low only (high = no badge). The AI sparkle marks
// it as AI-derived.
export default function ConfidenceBadge({
  confidence,
  issue,
}: {
  confidence?: Confidence;
  issue?: ValidationIssue;
}) {
  if (issue) {
    const isError = issue.severity === "error";
    return (
      <span
        title={issue.message}
        className={
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold " +
          (isError
            ? "bg-danger/10 text-danger ring-1 ring-danger/30"
            : "bg-warn/10 text-[#9A6A00] ring-1 ring-warn/40")
        }
      >
        <AiIndicator size={12} label="Flagged by AI" />
        Needs review
      </span>
    );
  }

  if (!confidence || confidence === "high") return null;

  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
        (confidence === "low"
          ? "bg-warn/10 text-[#9A6A00] ring-1 ring-warn/40"
          : "bg-orange/10 text-orange ring-1 ring-orange/30")
      }
    >
      <AiIndicator size={12} label="AI confidence" />
      {confidence === "low" ? "Low confidence" : "Check this"}
    </span>
  );
}
