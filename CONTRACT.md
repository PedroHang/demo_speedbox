# BUILD CONTRACT — Allied Express (Speedbox) demo

Single source of truth for every build agent. Follow it exactly. Types live in `src/lib/schema.ts`; brand tokens in `src/lib/brand.ts`. Import from those, never redefine.

## Goal
A Vite + React + TS + Tailwind single-page app (one route, screen state machine) that demos: **upload a commercial invoice → Gemini extracts and auto-fills the Create Shipment form → an AI critic re-checks the filled fields and flags problems for human review → place shipment → download a shipping label.** Branded as the white-label courier **Allied Express**. Deploys to Vercel; the Gemini key lives ONLY in serverless functions under `/api`.

## Stack (pin these exact majors)
- react@18.3.1, react-dom@18.3.1
- vite@^5.4, @vitejs/plugin-react@^4.3
- typescript@^5.5
- tailwindcss@^3.4, postcss@^8.4, autoprefixer@^10.4
- framer-motion@^11 (hover guided animation only)
- @google/genai@^1 (serverless functions only)
- @vercel/node@^3 (devDep, function types)
No react-router. No other UI libs. Icons: inline SVG or unicode, do not add a dependency.

## File tree (who owns what)
```
demo_speedbox/
  package.json, vite.config.ts, tsconfig.json, tsconfig.node.json,
  postcss.config.js, tailwind.config.js, index.html, vercel.json,
  .gitignore, .env.example                      [SCAFFOLD agent]
  README.md                                     [SCAFFOLD agent: deploy steps]
  api/
    extract.ts                                  [SCAFFOLD agent]
    critic.ts                                   [SCAFFOLD agent]
    _mock.ts                                     [SCAFFOLD agent]
  src/
    main.tsx, index.css                         [SCAFFOLD agent]
    App.tsx                                      [DO NOT CREATE — owner integrates last]
    lib/schema.ts                               [EXISTS — do not edit]
    lib/brand.ts                                [EXISTS — do not edit]
    lib/api.ts                                   [SCAFFOLD agent]
    lib/samples.ts                               [SCAFFOLD agent: SampleInvoice[] list]
    components/Logo.tsx, Sidebar.tsx, Header.tsx [CHROME agent]
    components/Stepper.tsx                       [CREATE agent]
    components/UploadDropzone.tsx                [CREATE agent]
    components/ReviewForm.tsx, FieldRow.tsx, ConfidenceBadge.tsx [REVIEW agent]
    components/LabelDoc.tsx                       [PLACED agent]
    screens/Login.tsx                            [LOGIN agent]
    screens/Dashboard.tsx                        [DASHBOARD agent]
    screens/CreateShipment.tsx                   [CREATE agent]
    screens/ShipmentPlaced.tsx                   [PLACED agent]
  invoices/apparel.html                          [INVOICE-APPAREL agent]
  invoices/electronics.html                      [INVOICE-ELECTRONICS agent]
  invoices/manufacturer.html                     [INVOICE-MANUFACTURER agent]
  public/sample-invoices/                        [owner renders PNGs here after build]
```

## Tailwind theme (add to tailwind.config.js `theme.extend.colors`, mirror brand.ts)
```
navy:'#2B3A67', navyDeep:'#2E3C66', orange:'#E8772E', orangeSoft:'#F59E4B',
peachFrom:'#FFF4EC', peachTo:'#FCE3CE', cream:'#FFF9F3', fieldBg:'#F4F5F7',
ink:'#1F2A4D', muted:'#6B7280', ok:'#16A34A', danger:'#DC2626', warn:'#F59E0B'
```
fontFamily.sans = Inter first (loaded via index.html Google Fonts link). Cards: white, rounded-xl, border border-[#E5E7EB], subtle shadow. Primary button = bg-navy text-white rounded-lg; secondary = border. Accent/links = orange.

## Component prop signatures (match EXACTLY)
```ts
// chrome
Logo: { className?: string }                         // orange chevron "A" + "ALLIED EXPRESS" wordmark, inline SVG
Sidebar: { active: Screen; onNavigate: (s: Screen) => void }
Header: {}                                            // top bar: "Track Shipment" input (non-functional), bell, user "Siddharth Sodha"

// screens
Login: { onLogin: () => void }
Dashboard: { onSingleShipment: () => void; onGetRates?: () => void; onBulk?: () => void }
CreateShipment: { onPlaced: (form: ShipmentForm) => void }   // owns upload→extract→review→place internally
ShipmentPlaced: { form: ShipmentForm; onNewOrder: () => void }

// create-flow components
Stepper: { steps: string[]; active: number }
UploadDropzone: { samples: SampleInvoice[]; busy: boolean; onFile: (f: File) => void; onSample: (s: SampleInvoice) => void }
ReviewForm: { form: ShipmentForm; fieldMeta: Record<string,FieldMeta>; issues: ValidationIssue[]; revalidating: boolean; onChange: (path: string, value: string|number|boolean) => void; onRevalidate: () => void; onConfirm: () => void }
FieldRow: { label: string; path: string; value: string|number; meta?: FieldMeta; issue?: ValidationIssue; type?: 'text'|'number'; onChange: (path:string, value:string|number)=>void }
ConfidenceBadge: { confidence?: Confidence; issue?: ValidationIssue }
LabelDoc: { form: ShipmentForm }                     // printable label; expose a Download/Print button that window.print()s a label-only view OR renders to a new window
```

## CreateShipment internal flow (CREATE agent implements)
State: `phase: 'upload'|'extracting'|'review'|'placing'`.
- show Stepper (["Upload Invoice","Review & Validate","Confirm"]).
- phase upload: render UploadDropzone with samples (from lib/samples).
- on file/sample: phase='extracting' (show a "Reading the invoice..." loader with the hover-animation vibe), call `extractInvoice(...)` from lib/api → set form+fieldMeta, then immediately call `validateForm(form, image)` → set issues, phase='review'.
- phase review: render ReviewForm. onChange edits form in place. onRevalidate calls validateForm again (revalidating=true while pending) and refreshes issues. onConfirm → phase='placing' briefly → `onPlaced(form)`.
Keep the captured image (base64+mime+sampleId) in state so revalidate/critic can re-send it.

## API contract (lib/api.ts ↔ /api functions)
```ts
extractInvoice(input: { base64: string; mimeType: string; sampleId?: string }): Promise<ExtractionResult>  // POST /api/extract
validateForm(form: ShipmentForm, image?: { base64:string; mimeType:string; sampleId?:string }): Promise<ValidationResult> // POST /api/critic
fileToBase64(file: File): Promise<{ base64: string; mimeType: string }>          // strip data: prefix
loadSampleAsBase64(imgPath: string): Promise<{ base64: string; mimeType: string }> // fetch the bundled png
```
POST bodies are JSON. base64 is raw (no `data:` prefix). Functions respond `200 application/json` with the typed result, or `200` with the MOCK when no key.

## Serverless functions (SCAFFOLD agent)
Both: `export default async function handler(req: VercelRequest, res: VercelResponse)`. Parse JSON body. Key = `process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY`. If no key → return `_mock.ts` fixture (by `sampleId`, fallback generic). Use model **`gemini-2.5-flash`**, `temperature: 0`, `responseMimeType: "application/json"`. Wrap Gemini in try/catch; on any error fall back to the mock so the demo never hard-fails. CORS not needed (same origin).

**extract.ts** — send the image (`inlineData {mimeType, data:base64}`) + a prompt that says: "You read commercial/proforma invoices of ANY layout and wording. Extract shipment booking fields. For each field output path, value (string), confidence (high|medium|low), and sourceSnippet (the literal invoice text you read it from). If a required field is absent leave value empty and confidence low. Do not guess shipper vs consignee — for an EXPORT the India-based GST/IEC party is the shipper; if ambiguous mark medium." Emit JSON `GeminiExtractOutput` (fields[] of {path,value,confidence,sourceSnippet}). Then the function assembles `ExtractionResult` (build ShipmentForm by path, coerce numbers/bools, collect fieldMeta). Use these paths: `shipper.*`, `shipperExtras.idType|idNumber`, `consignee.*`, `box.lengthCm|widthCm|heightCm|weightKg`, `meta.shipmentType|mode|pieces`, `goods.<i>.description|quantity|unitValueINR|commodityCode|hsnCode`, `declaredValueINR`. Default service = FedEx (see below); pickup.type='Pickup', date = today+1.

**critic.ts** — send the invoice image + the filled `form` JSON + a prompt: "You are a customs/ops reviewer. Compare the FORM against the INVOICE and logistics rules. Return issues[] {path, severity(error|warn), message, suggestedValue?}. Check: shipper/consignee direction (India GST/IEC party must be the exporter/shipper), HSN code matches the goods description, HSN present for every goods line, pincode/postal matches the city/country, declared value plausible (not obviously under-declared), weight/dimensions sane, required contact fields present. Be conservative: flag, do not block. summary = one line." Emit `ValidationResult`.

## Default service (always)
`{ carrier:"FedEx", serviceName:"FedEx Export - Small Parcels", etaDays:3, costINR:4050.16 }`.

## THE THREE INVOICES — canonical data (invoice HTML agents AND _mock.ts MUST match this)
Each invoice is a self-contained printable HTML (inline CSS only, ~820px wide, white, looks like a real commercial invoice: header with seller logo/name, invoice no + date, From/To blocks, a goods table, totals, weights/dims footer). Vary the LAYOUT and the FIELD LABELS between the three to prove format-agnostic reading. No external images/fonts (system fonts ok).

### 1) apparel.html — CLEAN (the "Pants" homage). sampleId "apparel"
- Labels style: standard "Exporter" / "Consignee".
- Shipper: **Mumbai Threads Pvt. Ltd.**, contact **Rohan Mehta**, GSTIN **27AABCM1234K1Z5** (idType GSTIN), Unit 14, Andheri Industrial Estate, **Andheri East**, **Mumbai**, **Maharashtra**, **400069**, **India**, +91 9820012345, exports@mumbaithreads.in
- Consignee: **Liberty Apparel LLC**, contact **James Carter**, 245 W 39th St, Suite 800, **New York**, **NY**, **10018**, **United States**, +1 212 555 0143, ops@libertyapparel.com
- Goods: 1 line — "**Men's Cotton Trousers**", qty **120**, unit **INR 450.00**, HSN **620342**, commodity "Apparel". Total INR 54,000.
- Box: **60 x 40 x 35 cm**, **18 kg**, pieces **3**. Mode B2B, type Parcel. Invoice no **MT-2026-0418**, date **2026-06-18**.
- Critic result: **0 errors**, summary "All fields look good. Ready to book." (extraction all high confidence; you may set consignee.email medium for realism, no issue.)

### 2) electronics.html — CATCH #1: WRONG HSN (hsn/description mismatch). sampleId "electronics"
- Labels style: "Sold By" / "Ship To" (different wording).
- Shipper: **Bengaluru Microsystems Pvt Ltd**, **Vikram Rao**, GSTIN **29AAGCB9876P1Z2**, Plot 22, Electronic City Phase 1, **Bengaluru**, **Karnataka**, **560100**, **India**, +91 80 4123 6789, exports@blrmicro.in
- Consignee: **NorthStar Electronics Inc.**, **Emily Nguyen**, 1100 Congress Ave, **Austin**, **TX**, **78701**, **United States**, +1 512 555 0199, ops@northstar-elec.com
- Goods: line1 "**Wireless Bluetooth Earbuds (Model NS-200)**", qty **200**, unit **INR 600.00**, HSN **620520** (THIS IS WRONG — 6205 is men's shirts/apparel), commodity "Electronics"; line2 "**USB-C Wireless Charger**", qty **100**, unit **INR 350.00**, HSN **850440**.
- Box: **50 x 40 x 30 cm**, **12 kg**, pieces **4**. Invoice no **BMS-2026-0091**, date **2026-06-17**.
- Critic result: **1 error** on `goods.0.hsnCode`: "HSN 620520 is apparel (men's shirts), but the item is electronic earbuds. Expected ~8518.30." suggestedValue "851830". summary "1 field needs review: HSN does not match the goods."

### 3) manufacturer.html — CATCH #2: MISSING HSN + odd wording. sampleId "manufacturer"
- Labels style: non-standard — "Consignor" / "Buyer", plus a "Despatch From" line. Proves wording variance.
- Shipper: **Surat Polymers & Components**, **Anil Desai**, IEC **0388123456** (idType IEC), Survey 88, GIDC Sachin, **Surat**, **Gujarat**, **394230**, **India**, +91 261 2398776, sales@suratpoly.co.in
- Consignee: **Apex Industrial Supply**, **Maria Gomez**, 8800 NW 33rd St, **Doral**, **FL**, **33172**, **United States**, +1 305 555 0177, purchasing@apexindustrial.com
- Goods: 1 line — "**Industrial Rubber Gaskets (assorted)**", qty **5000**, unit **INR 12.00**, HSN **(blank — leave the HSN cell empty)**, commodity blank. Total INR 60,000.
- Box: **80 x 60 x 55 cm**, **64 kg**, pieces **10**. Invoice no **SPC/EXP/2026/231**, date **2026-06-16**.
- Critic result: **1 error** on `goods.0.hsnCode`: "HSN code is missing for 'Industrial Rubber Gaskets'. It is required for export customs." suggestedValue "401693". summary "1 field needs review: missing HSN."

## _mock.ts (SCAFFOLD agent)
Export `mockExtract(sampleId?: string): ExtractionResult` and `mockCritic(sampleId?: string): ValidationResult`, returning the fully-populated form + fieldMeta + issues that match each invoice above (apparel→clean, electronics→wrong-HSN error, manufacturer→missing-HSN error). Generic fallback (unknown sampleId / real dropped file): a plausible apparel-like fill with all-high confidence and 0 issues. These mocks make the app fully demoable and the build verifiable WITHOUT a key.

## samples.ts (SCAFFOLD agent)
```ts
export const SAMPLES: SampleInvoice[] = [
  { id:'apparel', label:'Apparel export', hint:"Men's trousers · clean invoice", imgPath:'/sample-invoices/apparel.png' },
  { id:'electronics', label:'Electronics export', hint:'Earbuds · watch the HSN', imgPath:'/sample-invoices/electronics.png' },
  { id:'manufacturer', label:'Manufacturer export', hint:'Rubber gaskets · odd wording', imgPath:'/sample-invoices/manufacturer.png' },
];
```

## UX specifics
- **UploadDropzone hover animation (framer-motion):** when the user hovers the dropzone, a small panel animates: a sample invoice graphic gently zooms/scans (a moving highlight line), with reassuring copy: "Upload any invoice — PDF or a photo. We read any format. We will check every field and flag anything that needs a look." Below the dropzone show the 3 sample cards (click = run the flow on that sample). Real drag-drop / file-pick also works (images + pdf).
- **ReviewForm:** sections Shipper / Consignee / Pickup / Box & Goods / Service. Each field shows its value (editable input). If `fieldMeta[path].confidence` is medium/low → subtle amber left-border + small ConfidenceBadge; if an `issue` exists for the path → stronger amber/red highlight + a "Needs review" badge whose tooltip shows `issue.message` and, if present, a "Use suggestion: X" button that sets the value to `issue.suggestedValue`. Hovering a field shows `sourceSnippet` ("read from: …"). A top banner shows `validation.summary` and a **Re-validate** button (calls onRevalidate). **Confirm & Place Shipment** button (navy) at the bottom, enabled always (demo), but if there are open `error` issues show a gentle inline note.
- **ShipmentPlaced:** success banner "Your shipment has been placed!", master Shipment No "933110010000", Shipper/Consignee/Charges/Shipment Details/Service cards (reuse form), a warning strip "Please download the shipping label and stick it on the box" with **Shipping Label** (LabelDoc print/download) + **Proforma Invoice** (can be a no-op/secondary) buttons, and **Place New order** (onNewOrder).

## Caveman / token rule for agents
Keep all prose/reasoning extremely terse. Output the files, then a one-line summary. Code and UI copy stay normal English. Do not ask questions — follow this contract; where it is silent, pick the obvious option and proceed.
