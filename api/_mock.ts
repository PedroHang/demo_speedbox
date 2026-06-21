// Canonical mock lives in src/lib/mock.ts so both the client (graceful fallback
// when the /api functions are unavailable, e.g. plain `vite dev`) and these
// serverless functions (fallback when no GOOGLE_AI_API_KEY is set) share one
// source of truth.
export { mockExtract, mockCritic, mockCoherence } from "../src/lib/mock";
