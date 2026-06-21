// Top bar: decorative "Track Shipment" search, bell, user chip.
export default function Header() {
  return (
    <header className="h-16 shrink-0 bg-white border-b border-[#E5E7EB] flex items-center gap-4 px-6">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm"
            aria-hidden
          >
            🔍
          </span>
          <input
            type="text"
            placeholder="Track Shipment"
            className="w-full bg-fieldBg rounded-lg pl-9 pr-3 py-2 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-navy/20"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button
          className="relative w-9 h-9 rounded-lg hover:bg-fieldBg flex items-center justify-center text-muted"
          aria-label="Notifications"
        >
          <span className="text-lg">🔔</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-orange rounded-full" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-navy text-white text-xs font-semibold flex items-center justify-center">
            PH
          </div>
          <span className="text-sm font-medium text-ink hidden sm:block">
            Pedro Hang
          </span>
        </div>
      </div>
    </header>
  );
}
