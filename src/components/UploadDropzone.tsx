import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SampleInvoice } from "../lib/schema";
import AiIndicator from "./AiIndicator";

interface UploadDropzoneProps {
  samples: SampleInvoice[];
  busy: boolean;
  onFile: (f: File) => void;
  onSample: (s: SampleInvoice) => void;
}

// A small faux-invoice graphic that gets a moving scan highlight on hover.
function ScanPreview() {
  return (
    <div className="relative w-44 h-56 bg-white rounded-md border border-[#E5E7EB] shadow-sm overflow-hidden shrink-0">
      {/* invoice header */}
      <div className="px-3 pt-3">
        <div className="h-2.5 w-20 bg-navy/80 rounded-sm" />
        <div className="mt-1 h-1.5 w-12 bg-[#E5E7EB] rounded-sm" />
      </div>
      {/* from/to blocks */}
      <div className="px-3 mt-3 flex gap-2">
        <div className="flex-1 space-y-1">
          <div className="h-1.5 w-full bg-fieldBg rounded-sm" />
          <div className="h-1.5 w-3/4 bg-fieldBg rounded-sm" />
          <div className="h-1.5 w-2/3 bg-fieldBg rounded-sm" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="h-1.5 w-full bg-fieldBg rounded-sm" />
          <div className="h-1.5 w-3/4 bg-fieldBg rounded-sm" />
          <div className="h-1.5 w-2/3 bg-fieldBg rounded-sm" />
        </div>
      </div>
      {/* goods table rows */}
      <div className="px-3 mt-3 space-y-1.5">
        <div className="h-2 w-full bg-orange/20 rounded-sm" />
        {[0, 1, 2, 3].map((r) => (
          <div key={r} className="flex gap-1">
            <div className="h-1.5 flex-1 bg-fieldBg rounded-sm" />
            <div className="h-1.5 w-6 bg-fieldBg rounded-sm" />
            <div className="h-1.5 w-8 bg-fieldBg rounded-sm" />
          </div>
        ))}
      </div>
      {/* moving scan highlight */}
      <motion.div
        className="absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-orange/30 to-transparent"
        initial={{ y: -40 }}
        animate={{ y: 224 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute left-0 right-0 h-0.5 bg-orange"
        initial={{ y: -2 }}
        animate={{ y: 224 }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export default function UploadDropzone({
  samples,
  busy,
  onFile,
  onSample,
}: UploadDropzoneProps) {
  const [hover, setHover] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const accept =
    "image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.webp,.docx,.html,.htm,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (busy || !files || files.length === 0) return;
      const f = files[0];
      const name = f.name.toLowerCase();
      const ok =
        f.type.startsWith("image/") ||
        f.type === "application/pdf" ||
        f.type === "text/html" ||
        f.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        /\.(png|jpe?g|webp|pdf|docx|html?|txt|csv|md)$/.test(name);
      if (ok) onFile(f);
    },
    [busy, onFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !busy)
            inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={[
          "relative cursor-pointer rounded-xl border-2 border-dashed bg-cream",
          "px-6 py-8 transition-colors",
          dragOver ? "border-orange bg-peachFrom" : "border-[#E5E7EB]",
          busy ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex items-center gap-6">
          <AnimatePresence mode="wait">
            {hover ? (
              <motion.div
                key="scan"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
              >
                <ScanPreview />
              </motion.div>
            ) : (
              <motion.div
                key="cloud"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-44 h-56 flex items-center justify-center shrink-0"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-16 h-16 text-orange"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 16V8m0 0-3 3m3-3 3 3" />
                  <path d="M20 16.5A4.5 4.5 0 0 0 17.5 8h-1.05A7 7 0 1 0 4 14.9" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1">
            <div className="flex items-center gap-2 text-lg font-semibold text-ink">
              <AiIndicator size={20} label="AI assisted" />
              Drop your invoice here, or click to browse
            </div>
            <p className="mt-2 text-sm text-muted max-w-md">
              Upload any invoice, PDF or a photo. We read any format. We will
              check every field and flag anything that needs a look.
            </p>
            <div className="mt-3 text-xs text-muted">
              Supported: PDF, DOCX, HTML, JPG, PNG
            </div>
          </div>
        </div>
      </div>

      {/* sample cards */}
      <div className="mt-6">
        <div className="text-sm font-medium text-ink mb-3">
          Or try a sample invoice
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {samples.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={busy}
              onClick={() => !busy && onSample(s)}
              className={[
                "text-left rounded-xl border border-[#E5E7EB] bg-white p-4",
                "shadow-sm transition-colors hover:border-orange",
                busy ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-md bg-peachFrom text-orange">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" />
                  </svg>
                </span>
                <span className="font-semibold text-ink text-sm">
                  {s.label}
                </span>
              </div>
              <div className="mt-2 text-xs text-muted">{s.hint}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
