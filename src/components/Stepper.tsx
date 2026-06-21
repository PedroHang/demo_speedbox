// Stepper: horizontal progress indicator for the create-shipment flow.
interface StepperProps {
  steps: string[];
  active: number; // 0-based index of the current step
}

export default function Stepper({ steps, active }: StepperProps) {
  return (
    <ol className="flex items-center w-full">
      {steps.map((label, i) => {
        const done = i < active;
        const current = i === active;
        const isLast = i === steps.length - 1;
        return (
          <li
            key={label}
            className={`flex items-center ${isLast ? "" : "flex-1"}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={[
                  "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold border transition-colors",
                  done
                    ? "bg-navy text-white border-navy"
                    : current
                    ? "bg-orange text-white border-orange"
                    : "bg-white text-muted border-[#E5E7EB]",
                ].join(" ")}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={[
                  "text-sm whitespace-nowrap",
                  current
                    ? "text-ink font-semibold"
                    : done
                    ? "text-ink"
                    : "text-muted",
                ].join(" ")}
              >
                {label}
              </span>
            </div>
            {!isLast && (
              <span
                className={[
                  "flex-1 h-px mx-3",
                  done ? "bg-navy" : "bg-[#E5E7EB]",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
