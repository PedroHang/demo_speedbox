import type { Screen } from "../lib/schema";
import { brand } from "../lib/brand";
import Logo from "./Logo";

interface NavItem {
  label: string;
  icon: string;
  screen: Screen;
}

const NAV: NavItem[] = [
  { label: "Home", icon: "⌂", screen: "dashboard" },
  { label: "Place a Single Shipment", icon: "📦", screen: "create" },
  { label: "Invoice", icon: "🧾", screen: "placed" },
];

export default function Sidebar({
  active,
  onNavigate,
}: {
  active: Screen;
  onNavigate: (s: Screen) => void;
}) {
  return (
    <aside className="w-64 shrink-0 bg-white border-r border-[#E5E7EB] flex flex-col h-full">
      <div className="px-5 py-5 border-b border-[#E5E7EB]">
        <Logo />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const isActive = item.screen === active;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.screen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                isActive
                  ? "bg-navy text-white"
                  : "text-ink hover:bg-fieldBg"
              }`}
            >
              <span
                className={`text-base ${isActive ? "text-orange" : "text-muted"}`}
                aria-hidden
              >
                {item.icon}
              </span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <div className="my-2 border-t border-[#E5E7EB]" />
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted/70">
          Courier side
        </p>
        <button
          onClick={() => onNavigate("admin")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
            active === "admin" ? "bg-navy text-white" : "text-ink hover:bg-fieldBg"
          }`}
        >
          <span
            className={`text-base ${active === "admin" ? "text-orange" : "text-muted"}`}
            aria-hidden
          >
            🛠️
          </span>
          <span className="truncate">Admin Panel</span>
        </button>
      </nav>

      <div className="px-5 py-4 border-t border-[#E5E7EB] text-xs text-muted space-y-1">
        <div className="font-semibold text-ink">{brand.legalName}</div>
        <a href={brand.site} className="block text-orange hover:underline">
          {brand.site.replace(/^https?:\/\//, "")}
        </a>
        <a href={`mailto:${brand.email}`} className="block hover:underline">
          {brand.email}
        </a>
        <div>{brand.phone}</div>
        <div className="pt-2 text-[11px] text-muted/80">{brand.poweredBy}</div>
      </div>
    </aside>
  );
}
