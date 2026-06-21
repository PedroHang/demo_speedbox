// Allied Express white-label brand tokens, approximated from the real Speedbox demo
// screenshots (Demo 22.06). Clean approximation, not a pixel copy.

export const brand = {
  name: "Allied Express",
  legalName: "Allied Express Pvt. Ltd.",
  poweredBy: "Powered by Speedbox",
  domain: "ae.speedboxapp.com",
  site: "https://alliedxpress.com",
  email: "info@alliedxpress.com",
  phone: "+91 8289006163",
  colors: {
    orange: "#E8772E", // primary accent / CTAs
    orangeSoft: "#F59E4B",
    navy: "#2B3A67", // primary buttons, headings
    navyDeep: "#2E3C66", // footer bar
    navyText: "#1F2A4D",
    peachFrom: "#FFF4EC", // login hero gradient start
    peachTo: "#FCE3CE", // login hero gradient end
    cream: "#FFF9F3",
    fieldBg: "#F4F5F7",
    border: "#E5E7EB",
    muted: "#6B7280",
    white: "#FFFFFF",
    success: "#16A34A",
    danger: "#DC2626",
    warn: "#F59E0B",
  },
  // donut/status palette (customer Tracking Status widget)
  status: {
    placed: "#3B82F6",
    atWarehouse: "#8B5CF6",
    inTransit: "#0EA5E9",
    forwarded: "#14B8A6",
    rto: "#F97316",
    cancelled: "#DC2626",
    delivered: "#16A34A",
    exception: "#EAB308",
    unsuccessful: "#6B7280",
  },
  // font stack: Inter-like; load Inter via index.html <link> for fidelity.
  font: `Inter, "Segoe UI", system-ui, -apple-system, sans-serif`,
} as const;

export type Brand = typeof brand;
