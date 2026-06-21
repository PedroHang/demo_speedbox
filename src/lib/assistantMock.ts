import type {
  AssistantRequest,
  AssistantResponse,
  AssistantShipment,
} from "./schema";

// Pure, rules-based fallback for the Ops Copilot. Used by BOTH the server core
// (when there is no Gemini key or the call fails) and the client (when the
// network request fails). Mirrors the role src/lib/mock.ts plays for the booking
// flow: it never throws and always returns a usable, grounded answer.

function fmt(n: number): string {
  return "Rs " + (n || 0).toLocaleString("en-IN");
}

// Customs Hold first, then Exception, then any shipment with open AI warnings.
function pickTopUrgent(ships: AssistantShipment[]): AssistantShipment | undefined {
  return (
    ships.find((s) => s.status === "Customs Hold") ||
    ships.find((s) => s.status === "Exception") ||
    ships.find((s) => s.hasUnaddressed)
  );
}

function label(s: AssistantShipment): string {
  return [s.consigneeCompany, s.destination].filter(Boolean).join(" · ");
}

export function mockAssistant(req: AssistantRequest): AssistantResponse {
  const q = (req?.question || "").toLowerCase();
  const ships = req?.shipments || [];

  const flagged = ships.filter((s) => s.hasUnaddressed);
  const urgent = ships.filter(
    (s) =>
      s.status === "Customs Hold" ||
      s.status === "Exception" ||
      s.hasUnaddressed
  );
  const inTransit = ships.filter((s) => s.status === "In Transit");
  const topUrgent = pickTopUrgent(ships);

  // ---- Attention / problems / urgency ----
  if (
    /attention|urgent|problem|stuck|customs|hold|exception|wrong|issue|priority|fix|review|need/.test(
      q
    )
  ) {
    if (topUrgent) {
      const firstWarning = topUrgent.openWarnings[0]?.message;
      const answer =
        `${topUrgent.consigneeCompany} (${topUrgent.destination}) is ${topUrgent.status} and needs attention` +
        (firstWarning ? `: ${firstWarning}` : ".");
      return {
        answer,
        refs: urgent.slice(0, 3).map((s) => ({
          id: s.id,
          reason:
            s.status === "Customs Hold" || s.status === "Exception"
              ? s.status
              : "Open AI warning",
        })),
        metrics: [{ label: "Needs attention", value: String(urgent.length) }],
      };
    }
    return {
      answer: "Nothing needs urgent attention right now.",
      refs: [],
      metrics: [{ label: "Needs attention", value: "0" }],
    };
  }

  // ---- Counts / warnings ----
  if (/how many|count|number|flag|warning/.test(q)) {
    return {
      answer: `${flagged.length} of ${ships.length} shipments have open AI warnings.`,
      refs: flagged.slice(0, 4).map((s) => ({
        id: s.id,
        reason: s.openWarnings[0]?.message || "Open AI warning",
      })),
      metrics: [{ label: "Open warnings", value: String(flagged.length) }],
    };
  }

  // ---- Declared value / totals ----
  if (/value|worth|total|sum/.test(q)) {
    const scope = q.includes("transit") ? inTransit : ships;
    const inTransitScope = scope === inTransit;
    const total = scope.reduce((acc, s) => acc + (s.declaredValueINR || 0), 0);
    return {
      answer: inTransitScope
        ? `The total declared value of shipments in transit is ${fmt(total)}.`
        : `The total declared value across all ${ships.length} shipments is ${fmt(total)}.`,
      refs: [],
      metrics: [
        {
          label: inTransitScope ? "Value in transit" : "Total declared value",
          value: fmt(total),
        },
      ],
    };
  }

  // ---- Status breakdown ----
  if (/transit|delivered|status|breakdown|where|how is/.test(q)) {
    const counts = new Map<string, number>();
    for (const s of ships) {
      counts.set(s.status, (counts.get(s.status) || 0) + 1);
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const summary =
      sorted.length === 0
        ? "There are no shipments yet."
        : sorted.map(([st, c]) => `${c} ${st}`).join(", ") + ".";
    return {
      answer: summary,
      refs: [],
      metrics: sorted
        .slice(0, 3)
        .map(([st, c]) => ({ label: st, value: String(c) })),
    };
  }

  // ---- Default overview ----
  const overview =
    `${ships.length} shipments, ${flagged.length} flagged.` +
    (topUrgent ? ` Most urgent: ${label(topUrgent)}` : "");
  return {
    answer: overview,
    refs: urgent.slice(0, 3).map((s) => ({
      id: s.id,
      reason:
        s.status === "Customs Hold" || s.status === "Exception"
          ? s.status
          : "Open AI warning",
    })),
    metrics: [
      { label: "Flagged", value: `${flagged.length}/${ships.length}` },
    ],
  };
}
