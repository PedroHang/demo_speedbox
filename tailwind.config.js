/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#2B3A67",
        navyDeep: "#2E3C66",
        orange: "#E8772E",
        orangeSoft: "#F59E4B",
        peachFrom: "#FFF4EC",
        peachTo: "#FCE3CE",
        cream: "#FFF9F3",
        fieldBg: "#F4F5F7",
        ink: "#1F2A4D",
        muted: "#6B7280",
        ok: "#16A34A",
        danger: "#DC2626",
        warn: "#F59E0B",
      },
      fontFamily: {
        sans: ['Inter', '"Segoe UI"', "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
