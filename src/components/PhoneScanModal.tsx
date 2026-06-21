import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// A decorative QR code: real finder patterns in three corners + a deterministic
// data field so it reads unmistakably as a QR, without encoding anything. It is
// presentation only (the phone-capture handoff is not wired yet).
function DecorativeQR({ size = 200 }: { size?: number }) {
  const N = 25; // modules per side
  const q = 2; // quiet zone (modules)
  const total = N + q * 2;
  const cell = size / total;

  const finder = (x: number, y: number): "dark" | "light" | null => {
    const blocks: [number, number][] = [
      [0, 0],
      [N - 7, 0],
      [0, N - 7],
    ];
    for (const [bx, by] of blocks) {
      if (x >= bx && x < bx + 7 && y >= by && y < by + 7) {
        const lx = x - bx;
        const ly = y - by;
        const ring = lx === 0 || lx === 6 || ly === 0 || ly === 6;
        const core = lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4;
        return ring || core ? "dark" : "light";
      }
    }
    return null;
  };

  const inFinderZone = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);

  const rects: JSX.Element[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const f = finder(x, y);
      let dark: boolean;
      if (f) dark = f === "dark";
      else if (inFinderZone(x, y)) dark = false; // 1-module separator
      else {
        const h = (((x * 73856093) ^ (y * 19349663) ^ (x * y * 83492791)) >>> 0) % 100;
        dark = h < 48;
      }
      if (dark) {
        rects.push(
          <rect
            key={x + "-" + y}
            x={(x + q) * cell}
            y={(y + q) * cell}
            width={cell + 0.4}
            height={cell + 0.4}
            rx={cell * 0.2}
            fill="#1F2A4D"
          />
        );
      }
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Sample QR code"
    >
      <rect x={0} y={0} width={size} height={size} rx={12} fill="#FFFFFF" />
      {rects}
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="7" y="2" width="10" height="20" rx="2.5" />
      <path d="M11 18h2" />
    </svg>
  );
}

export default function PhoneScanModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const steps = [
    "Scan the QR code with your phone camera",
    "Take a photo of the invoice on your desk",
    "It uploads here automatically and fills the booking",
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-navy to-navyDeep px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <PhoneIcon />
                </span>
                <div>
                  <div className="text-base font-semibold">Scan with your phone</div>
                  <div className="text-xs text-white/70">
                    Capture the paper invoice with your camera
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg px-2 py-1 text-white/80 transition hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="flex flex-col items-center">
                <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
                  <DecorativeQR size={196} />
                </div>
                <p className="mt-4 max-w-xs text-center text-sm text-muted">
                  Point your phone camera at this code. Snap the invoice in front
                  of you and it lands right back here, ready to scan.
                </p>
              </div>

              <ol className="mt-5 space-y-2.5">
                {steps.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-peachFrom text-[11px] font-bold text-orange">
                      {i + 1}
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-5 flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2">
                <span className="mt-px text-xs text-[#8A6500]" aria-hidden>
                  ⓘ
                </span>
                <p className="text-[11px] leading-relaxed text-[#8A6500]">
                  Preview only. This phone-capture flow is a concept shown for the
                  demo and is not functional yet.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
