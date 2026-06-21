import type { TokenUsage } from "./schema";

// Official Gemini 2.5 Flash paid-tier pricing (USD per 1,000,000 tokens).
// Source: https://ai.google.dev/gemini-api/docs/pricing
// Output price already includes thinking tokens.
export const PRICING = {
  model: "Gemini 2.5 Flash",
  inputPerM: 0.3,
  outputPerM: 2.5,
};

// Approximate, for a secondary reference line only. USD is the exact figure.
const USD_TO_INR = 83.3;

export interface UsageEntry extends TokenUsage {
  label: string;
}

export interface UsageTotals {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUSD: number;
  costINR: number;
}

export interface UsageSnapshot {
  entries: UsageEntry[];
  totals: UsageTotals;
}

function costOf(inputTokens: number, outputTokens: number): number {
  return (
    (inputTokens / 1_000_000) * PRICING.inputPerM +
    (outputTokens / 1_000_000) * PRICING.outputPerM
  );
}

export function perCallCost(e: TokenUsage): number {
  return costOf(e.inputTokens, e.outputTokens);
}

function computeTotals(list: UsageEntry[]): UsageTotals {
  const sum = list.reduce(
    (a, e) => {
      a.inputTokens += e.inputTokens;
      a.outputTokens += e.outputTokens;
      a.totalTokens += e.totalTokens;
      return a;
    },
    { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
  );
  const costUSD = costOf(sum.inputTokens, sum.outputTokens);
  return {
    calls: list.length,
    inputTokens: sum.inputTokens,
    outputTokens: sum.outputTokens,
    totalTokens: sum.totalTokens,
    costUSD,
    costINR: costUSD * USD_TO_INR,
  };
}

let entries: UsageEntry[] = [];
let snapshot: UsageSnapshot = { entries, totals: computeTotals(entries) };
const listeners = new Set<() => void>();

function emit() {
  snapshot = { entries, totals: computeTotals(entries) };
  listeners.forEach((l) => l());
}

// Append one model call. No-op when usage is absent (e.g. the offline mock path),
// so the meter only reflects real Gemini calls.
export function recordUsage(label: string, usage?: TokenUsage) {
  if (!usage) return;
  entries = [...entries, { label, ...usage }];
  emit();
}

export function clearUsage() {
  entries = [];
  emit();
}

export function subscribeUsage(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getUsageSnapshot(): UsageSnapshot {
  return snapshot;
}
