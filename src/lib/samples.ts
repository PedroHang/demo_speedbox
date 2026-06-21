import type { SampleInvoice } from "./schema";

export const SAMPLES: SampleInvoice[] = [
  {
    id: "apparel",
    label: "Apparel export",
    hint: "Men's trousers · clean invoice",
    imgPath: "/sample-invoices/apparel.png",
  },
  {
    id: "electronics",
    label: "Electronics export",
    hint: "Earbuds · watch the HSN",
    imgPath: "/sample-invoices/electronics.png",
  },
  {
    id: "manufacturer",
    label: "Manufacturer export",
    hint: "Rubber gaskets · odd wording",
    imgPath: "/sample-invoices/manufacturer.png",
  },
];
