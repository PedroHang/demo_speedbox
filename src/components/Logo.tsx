import { brand } from "../lib/brand";

// Orange chevron "A" + "ALLIED EXPRESS" wordmark. Inline SVG only.
export default function Logo({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        viewBox="0 0 40 40"
        width="34"
        height="34"
        aria-label={brand.name}
        role="img"
        className="shrink-0"
      >
        {/* stacked chevrons forming a triangular "A" */}
        <path d="M20 4 L31 24 L24.5 24 L20 15 L15.5 24 L9 24 Z" fill="#E8772E" />
        <path d="M20 18 L26.5 31 L20 31 L13.5 31 Z" fill="#F59E4B" />
      </svg>
      <span className="leading-none">
        <span className="font-bold tracking-tight text-navy text-lg">ALLIED</span>
        <span className="font-semibold tracking-tight text-muted text-lg ml-1">
          EXPRESS
        </span>
      </span>
    </div>
  );
}
