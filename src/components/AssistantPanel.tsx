// The "Ops Copilot": a premium, self-contained chat drawer that answers questions
// grounded in the operator's live shipment data. Closed it is a floating launch
// pill bottom-right; open it slides in from the right as a navy-headed drawer.
// Every answer comes straight from askAssistant() — nothing is fabricated here.

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { AssistantShipment, AssistantResponse } from "../lib/schema";
import { askAssistant } from "../lib/api";
import { recordUsage } from "../lib/usage";
import AiIndicator from "./AiIndicator";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  refs?: AssistantResponse["refs"];
  metrics?: AssistantResponse["metrics"];
}

const SUGGESTIONS = [
  "Which shipment needs attention right now?",
  "Anything stuck in customs?",
  "How many have open AI warnings?",
  "Total declared value in transit?",
];

export default function AssistantPanel({
  shipments,
  onFocusShipment,
}: {
  shipments: AssistantShipment[];
  onFocusShipment: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the conversation pinned to the latest message / typing indicator.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading, open]);

  // Build a short label for a referenced shipment from the live `shipments` prop:
  // "id · status · destination". Falls back to the bare id if it isn't found.
  function labelFor(id: string): string {
    const s = shipments.find((x) => x.id === id);
    if (!s) return id;
    return `${s.id} · ${s.status} · ${s.destination}`;
  }

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;

    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    const next: ChatMessage[] = [...messages, { role: "user", text: q }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const res = await askAssistant({ question: q, shipments, history });
    recordUsage("Ops Copilot", res.usage);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: res.answer,
        refs: res.refs,
        metrics: res.metrics,
      },
    ]);
    setLoading(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <>
      {/* Launch pill — bottom-right, gentle pulse, the one AI signifier in white. */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="launch"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={
              reduceMotion
                ? { opacity: 1, scale: 1, y: 0 }
                : {
                    opacity: 1,
                    y: 0,
                    scale: [1, 1.045, 1],
                    boxShadow: [
                      "0 12px 28px -8px rgba(43,58,103,0.45)",
                      "0 16px 36px -6px rgba(232,119,46,0.45)",
                      "0 12px 28px -8px rgba(43,58,103,0.45)",
                    ],
                  }
            }
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={
              reduceMotion
                ? { duration: 0.18 }
                : {
                    opacity: { duration: 0.18 },
                    y: { duration: 0.18 },
                    scale: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
                    boxShadow: {
                      duration: 2.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    },
                  }
            }
            className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-br from-navy to-navyDeep px-4 py-3 text-sm font-semibold text-white shadow-xl ring-1 ring-white/10 transition hover:shadow-2xl"
          >
            <AiIndicator size={18} tone="white" />
            <span>Ask AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[400px] flex-col border-l border-[#E5E7EB] bg-cream shadow-2xl"
            role="dialog"
            aria-label="Ops Copilot"
          >
            {/* Header — navy gradient */}
            <div className="flex items-center gap-3 bg-gradient-to-br from-navy to-navyDeep px-5 py-4 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <AiIndicator size={20} tone="white" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold leading-tight">Ops Copilot</h3>
                <p className="text-[12px] leading-tight text-white/70">
                  Ask about your shipments
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl leading-none text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>

            {/* Message list */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
            >
              {messages.length === 0 && (
                <div className="msg-in space-y-3">
                  <div className="max-w-[88%] rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-ink shadow-sm">
                    Hi, I'm your Ops Copilot. Ask me anything about your shipments
                    and I'll answer from your live data.
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="rounded-full border border-orange/30 bg-white px-3 py-1.5 text-left text-[12px] font-medium text-navy shadow-sm transition hover:border-orange hover:bg-orange/5"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="msg-in flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-navy px-4 py-2.5 text-sm text-white shadow-sm">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div key={i} className="msg-in flex flex-col items-start gap-2">
                    <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 text-sm leading-relaxed text-ink shadow-sm">
                      {m.text}
                    </div>

                    {/* Metric pills */}
                    {m.metrics && m.metrics.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {m.metrics.map((metric, j) => (
                          <div
                            key={j}
                            className="flex items-center gap-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-[12px] shadow-sm"
                          >
                            <span className="text-muted">{metric.label}</span>
                            <span className="font-semibold text-ink">
                              {metric.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Referenced-shipment chips — clickable, focus the table row */}
                    {m.refs && m.refs.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {m.refs.map((ref) => (
                          <button
                            key={ref.id}
                            onClick={() => onFocusShipment(ref.id)}
                            title={ref.reason}
                            className="flex items-center gap-1.5 rounded-full border border-orange/40 bg-orange/5 px-3 py-1 text-[12px] font-medium text-orange transition hover:bg-orange/10"
                          >
                            <AiIndicator size={11} tone="orange" />
                            <span className="max-w-[230px] truncate">
                              {labelFor(ref.id)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Typing indicator */}
              {loading && (
                <div className="msg-in flex justify-start">
                  <div className="flex items-center gap-1 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
            </div>

            {/* Composer */}
            <div className="border-t border-[#E5E7EB] bg-white px-4 pb-3 pt-3">
              <div className="flex items-end gap-2 rounded-2xl border border-[#E5E7EB] bg-fieldBg px-3 py-2 focus-within:border-orange/50 focus-within:ring-2 focus-within:ring-orange/10">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder="Ask about your shipments…"
                  disabled={loading}
                  className="max-h-28 flex-1 resize-none bg-transparent text-sm text-ink outline-none placeholder:text-muted disabled:opacity-60"
                />
                <button
                  onClick={() => send(input)}
                  disabled={loading || !input.trim()}
                  aria-label="Send"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange text-white shadow-sm transition hover:bg-orangeSoft disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <path
                      d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12 2-12 2z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted">
                <AiIndicator size={12} tone="muted" />
                <span>AI assisted · answers are grounded in your shipment data</span>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
