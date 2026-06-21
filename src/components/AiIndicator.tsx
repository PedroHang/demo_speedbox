// The single, consistent "this is AI" signifier used everywhere AI is involved.
// A custom 4-point sparkle cluster (no emoji) that gently breathes and twinkles,
// with an optional "AI assisted" tooltip on hover.

type Tone = "orange" | "white" | "muted";

function colorFor(tone: Tone): string {
  if (tone === "white") return "#FFFFFF";
  if (tone === "muted") return "#9AA1AC";
  return "#E8772E";
}

// A 4-point sparkle: each edge bows toward the centre (concave star).
function sparkle(cx: number, cy: number, r: number): string {
  return (
    `M ${cx} ${cy - r} ` +
    `Q ${cx} ${cy} ${cx + r} ${cy} ` +
    `Q ${cx} ${cy} ${cx} ${cy + r} ` +
    `Q ${cx} ${cy} ${cx - r} ${cy} ` +
    `Q ${cx} ${cy} ${cx} ${cy - r} Z`
  );
}

export default function AiIndicator({
  size = 16,
  label,
  tone = "orange",
  className = "",
}: {
  size?: number;
  label?: string;
  tone?: Tone;
  className?: string;
}) {
  const color = colorFor(tone);
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={"ai-breathe shrink-0 " + className}
      aria-hidden
    >
      <path d={sparkle(9, 13, 7)} fill={color} />
      <path className="ai-twinkle-1" d={sparkle(18.5, 6, 3.2)} fill={color} />
      <path className="ai-twinkle-2" d={sparkle(18, 17.5, 2.1)} fill={color} />
    </svg>
  );

  if (!label) return icon;

  return (
    <span className="group relative inline-flex" aria-label={label} role="img">
      {icon}
      <span className="pointer-events-none absolute -top-1 left-1/2 z-50 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-navy px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </span>
  );
}
