import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import type {
  ShipmentForm,
  FieldMeta,
  ValidationIssue,
  ServiceChoice,
} from "../lib/schema";
import { emptyShipmentForm } from "../lib/schema";
import {
  extractInvoice,
  validateForm,
  checkCoherence,
  fileToPayload,
  loadSampleAsBase64,
} from "../lib/api";
import { recordUsage } from "../lib/usage";
import { addShipment, newShipmentId, computeUnaddressed } from "../lib/store";
import Stepper from "../components/Stepper";
import UploadDropzone from "../components/UploadDropzone";
import ReviewForm from "../components/ReviewForm";
import AiIndicator from "../components/AiIndicator";
import { SAMPLES } from "../lib/samples";

interface CreateShipmentProps {
  onPlaced: (form: ShipmentForm) => void;
  initialService?: ServiceChoice;
}

type Phase = "choice" | "upload" | "extracting" | "review" | "placing";

interface CapturedImage {
  base64?: string;
  mimeType?: string;
  text?: string;
  sampleId?: string;
}

const STEPS = ["Method", "Fill & Review", "Confirm"];

function stepFor(phase: Phase): number {
  if (phase === "choice") return 0;
  if (phase === "placing") return 2;
  return 1;
}

function Loader() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-40 h-52 bg-white rounded-md border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="px-3 pt-3">
          <div className="h-2.5 w-20 bg-navy/80 rounded-sm" />
          <div className="mt-1 h-1.5 w-12 bg-[#E5E7EB] rounded-sm" />
        </div>
        <div className="px-3 mt-4 space-y-1.5">
          {[0, 1, 2, 3, 4, 5].map((r) => (
            <div key={r} className="h-1.5 w-full bg-fieldBg rounded-sm" />
          ))}
        </div>
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-orange"
          initial={{ y: -2 }}
          animate={{ y: 208 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-0 right-0 h-12 bg-gradient-to-b from-transparent via-orange/30 to-transparent"
          initial={{ y: -48 }}
          animate={{ y: 208 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <div className="mt-6 flex items-center gap-2 text-lg font-semibold text-ink">
        <AiIndicator size={20} />
        Reading the invoice...
      </div>
      <p className="mt-1 text-sm text-muted max-w-sm text-center">
        Extracting shipment fields and checking each one for problems.
      </p>
    </div>
  );
}

export default function CreateShipment({
  onPlaced,
  initialService,
}: CreateShipmentProps) {
  const [phase, setPhase] = useState<Phase>("choice");
  const [manual, setManual] = useState(false);
  const [form, setForm] = useState<ShipmentForm | null>(null);
  const [fieldMeta, setFieldMeta] = useState<Record<string, FieldMeta>>({});
  const [issues, setIssues] = useState<ValidationIssue[]>([]);
  const [image, setImage] = useState<CapturedImage | null>(null);
  const [revalidating, setRevalidating] = useState(false);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [manualChecked, setManualChecked] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const resetState = () => {
    setForm(null);
    setFieldMeta({});
    setIssues([]);
    setImage(null);
    setAcknowledged([]);
    setManualChecked(false);
    setAiError(null);
  };

  const startManual = useCallback(() => {
    setManual(true);
    setForm(emptyShipmentForm(initialService));
    setFieldMeta({});
    setIssues([]);
    setImage(null);
    setAcknowledged([]);
    setManualChecked(false);
    setAiError(null);
    setPhase("review");
  }, [initialService]);

  const startAI = useCallback(() => {
    setManual(false);
    resetState();
    setPhase("upload");
  }, []);

  const backToChoice = useCallback(() => {
    resetState();
    setManual(false);
    setPhase("choice");
  }, []);

  const runExtraction = useCallback(
    async (img: CapturedImage) => {
      setImage(img);
      setPhase("extracting");
      const result = await extractInvoice(img);
      recordUsage("Invoice extraction", result.usage);
      const withService = initialService
        ? { ...result.form, service: initialService }
        : result.form;
      setForm(withService);
      setFieldMeta(result.fieldMeta);
      const validation = await validateForm(withService, img);
      recordUsage("AI validation", validation.usage);
      setIssues(validation.issues);
      setAiError(result.aiError ?? validation.aiError ?? null);
      setPhase("review");
    },
    [initialService]
  );

  const handleFile = useCallback(
    async (f: File) => {
      const payload = await fileToPayload(f);
      await runExtraction(payload);
    },
    [runExtraction]
  );

  const handleSample = useCallback(
    async (s: (typeof SAMPLES)[number]) => {
      const { base64, mimeType } = await loadSampleAsBase64(s.imgPath);
      await runExtraction({ base64, mimeType, sampleId: s.id });
    },
    [runExtraction]
  );

  const handleChange = useCallback(
    (path: string, value: string | number | boolean) => {
      setForm((prev) => {
        if (!prev) return prev;
        const next: ShipmentForm = JSON.parse(JSON.stringify(prev));
        const parts = path.split(".");
        let obj: any = next;
        for (let i = 0; i < parts.length - 1; i++) {
          obj = obj[parts[i]];
          if (obj == null) return prev;
        }
        obj[parts[parts.length - 1]] = value;
        return next;
      });
    },
    []
  );

  const handleRevalidate = useCallback(async () => {
    if (!form) return;
    setRevalidating(true);
    try {
      if (manual) {
        const result = await checkCoherence(form);
        recordUsage("AI coherence check", result.usage);
        setIssues(result.issues);
        setAiError(result.aiError ?? null);
        setManualChecked(true);
      } else {
        const validation = await validateForm(form, image ?? undefined);
        recordUsage("Re-validation", validation.usage);
        setIssues(validation.issues);
        setAiError(validation.aiError ?? null);
      }
    } finally {
      setRevalidating(false);
    }
  }, [form, image, manual]);

  const handleAcknowledge = useCallback((path: string) => {
    setAcknowledged((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path]
    );
  }, []);

  const handleConfirm = useCallback(() => {
    if (!form) return;
    setPhase("placing");
    const placed = form;
    addShipment({
      id: newShipmentId(),
      createdAt: Date.now(),
      method: manual ? "manual" : "ai",
      form: placed,
      issues,
      acknowledged,
      hasUnaddressed: computeUnaddressed(issues, acknowledged),
    });
    setTimeout(() => onPlaced(placed), 900);
  }, [form, manual, issues, acknowledged, onPlaced]);

  const subtitle =
    phase === "choice"
      ? "Choose how to fill the booking. Compare doing it by hand with letting AI read the invoice."
      : manual
      ? "Manual entry. Fill in every field yourself, the way it works today."
      : "Upload a commercial invoice and we will fill and check the booking for you.";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold text-ink">Create Shipment</h1>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>

      {initialService && (
        <p className="mt-2 text-xs font-medium text-navy">
          Booking with {initialService.carrier} · {initialService.serviceName} (₹
          {initialService.costINR.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
          )
        </p>
      )}

      <div className="mt-6 mb-6">
        <Stepper steps={STEPS} active={stepFor(phase)} />
      </div>

      {phase !== "choice" && phase !== "placing" && (
        <button
          onClick={backToChoice}
          className="mb-4 text-sm font-medium text-navy hover:underline"
        >
          ← Choose a different method
        </button>
      )}

      {phase === "choice" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <button
            onClick={startManual}
            className="rounded-xl border border-[#E5E7EB] bg-white p-6 text-left shadow-sm transition hover:shadow-md"
          >
            <div className="text-3xl">⌨️</div>
            <div className="mt-3 text-lg font-semibold text-ink">Fill in manually</div>
            <p className="mt-1 text-sm text-muted">
              Type the shipper, consignee, box and goods yourself, copying from the
              commercial invoice. This is how it works today.
            </p>
          </button>

          <button
            onClick={startAI}
            className="relative overflow-hidden rounded-xl bg-navy p-6 text-left text-white shadow-md ring-2 ring-orange transition hover:brightness-110"
          >
            <span className="absolute right-3 top-3 rounded-full bg-orange px-2 py-0.5 text-[10px] font-semibold">
              Faster
            </span>
            <AiIndicator size={34} tone="white" label="AI assisted" />
            <div className="mt-3 text-lg font-semibold">Upload invoice</div>
            <p className="mt-1 text-sm text-white/80">
              Drop the commercial invoice. It reads any format, fills every field,
              and flags anything that needs a human look.
            </p>
          </button>
        </div>
      )}

      {phase === "upload" && (
        <UploadDropzone
          samples={SAMPLES}
          busy={false}
          onFile={handleFile}
          onSample={handleSample}
        />
      )}

      {(phase === "extracting" || phase === "placing") && <Loader />}

      {phase === "review" && aiError && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/5 p-4">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-danger text-sm font-bold text-white">
            !
          </span>
          <div>
            <p className="text-sm font-semibold text-danger">
              AI did not return a real result
            </p>
            <p className="mt-0.5 text-xs text-muted">
              The fields below are{" "}
              <strong>sample data, not your uploaded invoice</strong>. Re-validate
              to retry. Details below show the exact reason.
            </p>
            <p className="mt-1 break-all rounded bg-white/60 px-2 py-1 font-mono text-[11px] text-muted/90">
              {aiError}
            </p>
          </div>
        </div>
      )}

      {phase === "review" && form && (
        <ReviewForm
          form={form}
          fieldMeta={fieldMeta}
          issues={issues}
          revalidating={revalidating}
          mode={manual ? "manual" : "ai"}
          checked={manual ? manualChecked : true}
          acknowledged={acknowledged}
          onChange={handleChange}
          onRevalidate={handleRevalidate}
          onAcknowledge={handleAcknowledge}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
