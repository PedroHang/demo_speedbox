import { useState } from "react";
import { brand } from "../lib/brand";
import Logo from "../components/Logo";

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [showPw, setShowPw] = useState(false);

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    onLogin();
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* LEFT hero */}
        <div className="lg:w-3/5 bg-gradient-to-br from-peachFrom to-peachTo px-8 py-12 lg:px-16 lg:py-16 flex flex-col">
          <Logo className="h-9 w-auto mb-10" />
          <h1 className="text-3xl lg:text-4xl font-bold text-navy leading-tight max-w-xl">
            Welcome to {brand.legalName}
          </h1>
          <p className="text-ink/70 mt-3 max-w-md">
            Ship smarter. Track in real time, get instant rates, and book global
            parcels in minutes.
          </p>

          {/* plane / parcel illustration */}
          <div className="my-8 lg:my-10">
            <svg
              viewBox="0 0 420 200"
              className="w-full max-w-lg h-auto"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="ldash" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#E8772E" stopOpacity="0.2" />
                  <stop offset="1" stopColor="#E8772E" stopOpacity="0.9" />
                </linearGradient>
              </defs>
              {/* dashed flight path */}
              <path
                d="M20 160 C 120 120, 200 60, 380 40"
                fill="none"
                stroke="url(#ldash)"
                strokeWidth="3"
                strokeDasharray="8 8"
                strokeLinecap="round"
              />
              {/* parcel */}
              <g transform="translate(20 140)">
                <rect width="48" height="40" rx="4" fill="#FFFFFF" stroke="#2B3A67" strokeWidth="2" />
                <path d="M0 14 H48" stroke="#2B3A67" strokeWidth="2" />
                <path d="M24 0 V14" stroke="#2B3A67" strokeWidth="2" />
                <rect x="18" y="20" width="12" height="6" rx="1" fill="#E8772E" />
              </g>
              {/* plane */}
              <g transform="translate(350 22) rotate(-12)">
                <path
                  d="M2 18 L40 8 L46 14 L20 22 L14 36 L8 34 L12 22 L4 24 Z"
                  fill="#2B3A67"
                />
                <path d="M40 8 L52 6 L46 14 Z" fill="#E8772E" />
              </g>
            </svg>
          </div>

          {/* decorative cards */}
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5">
              <p className="text-sm font-semibold text-ink mb-3">Tracking Status</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter AWB number"
                  className="flex-1 min-w-0 rounded-lg bg-fieldBg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-orange"
                />
                <button
                  type="button"
                  className="bg-orange text-white rounded-lg px-4 py-2 text-sm font-medium shrink-0"
                >
                  Track
                </button>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5 flex flex-col">
              <p className="text-sm font-semibold text-ink mb-1">Instant Quotes</p>
              <p className="text-xs text-muted mb-4 flex-1">
                Compare carrier rates in seconds.
              </p>
              <button
                type="button"
                className="bg-orange text-white rounded-lg px-4 py-2 text-sm font-medium self-start"
              >
                Get Rates
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT login card */}
        <div className="lg:w-2/5 bg-white flex items-center justify-center px-8 py-12 lg:px-12">
          <div className="w-full max-w-sm">
            <Logo className="h-8 w-auto mb-8" />
            <h2 className="text-2xl font-bold text-navy">Welcome</h2>
            <p className="text-sm text-muted mt-1 mb-6">
              Log in to your Allied Express account.
            </p>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Email ID
                </label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="w-full rounded-lg bg-fieldBg border border-[#E5E7EB] px-3 py-2.5 text-sm outline-none focus:border-orange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-fieldBg border border-[#E5E7EB] px-3 py-2.5 pr-16 text-sm outline-none focus:border-orange"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-orange"
                  >
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <a href="#" className="text-xs font-medium text-orange">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="w-full bg-navy text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-navyDeep transition-colors"
              >
                Login
              </button>

              <button
                type="button"
                onClick={onLogin}
                className="w-full border border-navy text-navy rounded-lg py-2.5 text-sm font-semibold hover:bg-fieldBg transition-colors"
              >
                Login With OTP
              </button>
            </form>

            <p className="text-sm text-muted text-center mt-6">
              Don't have an account?{" "}
              <a href="#" className="font-medium text-orange">
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* footer bar */}
      <footer className="bg-navyDeep text-white/80 text-xs py-4 px-8 text-center">
        © {new Date().getFullYear()} {brand.legalName}. {brand.poweredBy}.
      </footer>
    </div>
  );
}
