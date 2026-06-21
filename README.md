# Allied Express — Speedbox demo

A Vite + React + TypeScript single-page app that demos an AI-assisted shipment booking flow: upload a commercial invoice → Gemini extracts and auto-fills the Create Shipment form → an AI critic re-checks the filled fields and flags problems for human review → place shipment → download a shipping label. Branded as the white-label courier **Allied Express**.

## Local development

```
npm install
npm run dev
```

The app falls back to realistic mock data when no Gemini key is set, so it is fully demoable out of the box.

## Deploy (Vercel)

1. Connect the GitHub repo to Vercel.
2. In the Vercel project settings, set the env var `GOOGLE_AI_API_KEY` (a Google AI / Gemini API key). The key lives only in the serverless functions under `/api` and is never exposed to the browser.
3. Vercel auto-builds the Vite frontend and the `/api` serverless functions.

If no key is configured, the `/api` functions return realistic mock extractions/validations so the demo still works end to end.
