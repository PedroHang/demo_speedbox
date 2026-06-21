import type { ServiceChoice, ShipmentForm } from "./schema";
import { seedShipments, type ShipmentRecord } from "./store";

// Pre-populated shipments so the Admin table (and the Ops Copilot) has realistic
// fleet to reason over the moment the demo opens. Seeded once per browser via a
// localStorage flag inside seedShipments(); calling this repeatedly is a no-op.

const DEFAULT_SERVICE: ServiceChoice = {
  carrier: "FedEx",
  serviceName: "FedEx Export - Small Parcels",
  etaDays: 3,
  costINR: 4050.16,
};

const DAY = 24 * 60 * 60 * 1000;

// 1) Apparel: Mumbai Threads -> Liberty Apparel, New York. Clean, delivered.
const apparelForm: ShipmentForm = {
  shipper: {
    name: "Rohan Mehta",
    company: "Mumbai Threads Pvt. Ltd.",
    mobileCountryCode: "+91",
    mobile: "9820012345",
    email: "exports@mumbaithreads.in",
    addressLine1: "Unit 14, Andheri Industrial Estate",
    addressLine2: "Andheri East",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    pincode: "400069",
  },
  shipperExtras: { idType: "GSTIN", idNumber: "27AABCM1234K1Z5" },
  consignee: {
    name: "James Carter",
    company: "Liberty Apparel LLC",
    mobileCountryCode: "+1",
    mobile: "212 555 0143",
    email: "ops@libertyapparel.com",
    addressLine1: "245 W 39th St",
    addressLine2: "Suite 800",
    city: "New York",
    state: "NY",
    country: "United States",
    pincode: "10018",
  },
  pickup: { type: "Pickup", date: "" },
  box: { lengthCm: 60, widthCm: 40, heightCm: 35, weightKg: 18 },
  meta: { shipmentType: "Parcel", mode: "B2B", pieces: 3, insurance: false, packaging: false },
  goods: [
    {
      description: "Men's Cotton Trousers",
      quantity: 120,
      unitValueINR: 450,
      commodityCode: "Apparel",
      hsnCode: "620342",
    },
  ],
  declaredValueINR: 54000,
  service: { ...DEFAULT_SERVICE },
};

// 2) Electronics: Bengaluru Microsystems -> NorthStar Electronics, Austin.
// Wrong HSN on the earbuds; stuck in customs. The urgent problem shipment.
const electronicsForm: ShipmentForm = {
  shipper: {
    name: "Vikram Rao",
    company: "Bengaluru Microsystems Pvt Ltd",
    mobileCountryCode: "+91",
    mobile: "80 4123 6789",
    email: "exports@blrmicro.in",
    addressLine1: "Plot 22, Electronic City Phase 1",
    addressLine2: "",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    pincode: "560100",
  },
  shipperExtras: { idType: "GSTIN", idNumber: "29AAGCB9876P1Z2" },
  consignee: {
    name: "Emily Nguyen",
    company: "NorthStar Electronics Inc.",
    mobileCountryCode: "+1",
    mobile: "512 555 0199",
    email: "ops@northstar-elec.com",
    addressLine1: "1100 Congress Ave",
    addressLine2: "",
    city: "Austin",
    state: "TX",
    country: "United States",
    pincode: "78701",
  },
  pickup: { type: "Pickup", date: "" },
  box: { lengthCm: 50, widthCm: 40, heightCm: 30, weightKg: 12 },
  meta: { shipmentType: "Parcel", mode: "B2B", pieces: 4, insurance: false, packaging: false },
  goods: [
    {
      description: "Wireless Bluetooth Earbuds (Model NS-200)",
      quantity: 200,
      unitValueINR: 600,
      commodityCode: "Electronics",
      hsnCode: "620520",
    },
    {
      description: "USB-C Wireless Charger",
      quantity: 100,
      unitValueINR: 350,
      commodityCode: "Electronics",
      hsnCode: "850440",
    },
  ],
  declaredValueINR: 155000,
  service: { ...DEFAULT_SERVICE },
};

// 3) Manufacturer: Surat Polymers -> Apex Industrial Supply, Doral. Missing HSN.
const manufacturerForm: ShipmentForm = {
  shipper: {
    name: "Anil Desai",
    company: "Surat Polymers & Components",
    mobileCountryCode: "+91",
    mobile: "261 2398776",
    email: "sales@suratpoly.co.in",
    addressLine1: "Survey 88, GIDC Sachin",
    addressLine2: "",
    city: "Surat",
    state: "Gujarat",
    country: "India",
    pincode: "394230",
  },
  shipperExtras: { idType: "IEC", idNumber: "0388123456" },
  consignee: {
    name: "Maria Gomez",
    company: "Apex Industrial Supply",
    mobileCountryCode: "+1",
    mobile: "305 555 0177",
    email: "purchasing@apexindustrial.com",
    addressLine1: "8800 NW 33rd St",
    addressLine2: "",
    city: "Doral",
    state: "FL",
    country: "United States",
    pincode: "33172",
  },
  pickup: { type: "Pickup", date: "" },
  box: { lengthCm: 80, widthCm: 60, heightCm: 55, weightKg: 64 },
  meta: { shipmentType: "Parcel", mode: "B2B", pieces: 10, insurance: false, packaging: false },
  goods: [
    {
      description: "Industrial Rubber Gaskets (assorted)",
      quantity: 5000,
      unitValueINR: 12,
      commodityCode: "",
      hsnCode: "",
    },
  ],
  declaredValueINR: 60000,
  service: { ...DEFAULT_SERVICE },
};

// 4) Pharma/Nutraceuticals: Hyderabad -> London. Clean, in transit.
const pharmaForm: ShipmentForm = {
  shipper: {
    name: "Sunita Reddy",
    company: "Hyderabad Wellbiotics Pvt Ltd",
    mobileCountryCode: "+91",
    mobile: "40 2789 4561",
    email: "exports@hydwellbiotics.in",
    addressLine1: "Plot 7, Genome Valley, Shamirpet",
    addressLine2: "",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    pincode: "500078",
  },
  shipperExtras: { idType: "GSTIN", idNumber: "36AADCH4567Q1Z8" },
  consignee: {
    name: "Oliver Bennett",
    company: "Albion Health Distribution Ltd",
    mobileCountryCode: "+44",
    mobile: "20 7946 0321",
    email: "imports@albionhealth.co.uk",
    addressLine1: "42 Curtain Road",
    addressLine2: "Shoreditch",
    city: "London",
    state: "England",
    country: "United Kingdom",
    pincode: "EC2A 3AE",
  },
  pickup: { type: "Pickup", date: "" },
  box: { lengthCm: 45, widthCm: 35, heightCm: 30, weightKg: 9 },
  meta: { shipmentType: "Parcel", mode: "B2B", pieces: 2, insurance: true, packaging: false },
  goods: [
    {
      description: "Plant-Based Multivitamin Capsules (60ct)",
      quantity: 1500,
      unitValueINR: 180,
      commodityCode: "Nutraceuticals",
      hsnCode: "210690",
    },
  ],
  declaredValueINR: 270000,
  service: { ...DEFAULT_SERVICE },
};

// 5) Handicrafts/Handloom: Jaipur -> Berlin. Clean, in transit.
const handicraftsForm: ShipmentForm = {
  shipper: {
    name: "Meera Sharma",
    company: "Jaipur Handloom & Crafts",
    mobileCountryCode: "+91",
    mobile: "141 2376 889",
    email: "exports@jaipurhandloom.in",
    addressLine1: "C-23, Sanganer Industrial Area",
    addressLine2: "",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    pincode: "302029",
  },
  shipperExtras: { idType: "IEC", idNumber: "0511224488" },
  consignee: {
    name: "Lukas Fischer",
    company: "Nordlicht Wohnen GmbH",
    mobileCountryCode: "+49",
    mobile: "30 1234 5678",
    email: "einkauf@nordlicht-wohnen.de",
    addressLine1: "Kastanienallee 18",
    addressLine2: "",
    city: "Berlin",
    state: "Berlin",
    country: "Germany",
    pincode: "10435",
  },
  pickup: { type: "Pickup", date: "" },
  box: { lengthCm: 70, widthCm: 50, heightCm: 45, weightKg: 22 },
  meta: { shipmentType: "Parcel", mode: "B2B", pieces: 5, insurance: false, packaging: false },
  goods: [
    {
      description: "Hand-Block Printed Cotton Cushion Covers",
      quantity: 400,
      unitValueINR: 220,
      commodityCode: "Handicrafts",
      hsnCode: "630492",
    },
  ],
  declaredValueINR: 88000,
  service: { ...DEFAULT_SERVICE },
};

// 6) Auto-components: Pune -> Detroit. Delivery exception (incomplete address).
const autoForm: ShipmentForm = {
  shipper: {
    name: "Karan Joshi",
    company: "Pune Precision Auto Components",
    mobileCountryCode: "+91",
    mobile: "20 2712 3344",
    email: "exports@puneprecision.in",
    addressLine1: "Gate 4, Chakan MIDC Phase 2",
    addressLine2: "",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    pincode: "410501",
  },
  shipperExtras: { idType: "GSTIN", idNumber: "27AACCP3344R1Z9" },
  consignee: {
    name: "David Miller",
    company: "Great Lakes Motor Parts Inc.",
    mobileCountryCode: "+1",
    mobile: "313 555 0188",
    email: "receiving@greatlakesmotor.com",
    addressLine1: "1500",
    addressLine2: "",
    city: "Detroit",
    state: "MI",
    country: "United States",
    pincode: "48226",
  },
  pickup: { type: "Pickup", date: "" },
  box: { lengthCm: 75, widthCm: 55, heightCm: 50, weightKg: 48 },
  meta: { shipmentType: "Parcel", mode: "B2B", pieces: 8, insurance: true, packaging: false },
  goods: [
    {
      description: "Precision Machined Brake Caliper Brackets",
      quantity: 600,
      unitValueINR: 240,
      commodityCode: "Auto Components",
      hsnCode: "870830",
    },
  ],
  declaredValueINR: 144000,
  service: { ...DEFAULT_SERVICE },
};

export function seedShipmentsIfEmpty(): void {
  const now = Date.now();
  const recs: ShipmentRecord[] = [
    {
      id: "933110009001",
      createdAt: now - 1 * DAY,
      method: "ai",
      form: apparelForm,
      issues: [],
      acknowledged: [],
      hasUnaddressed: false,
      status: "Delivered",
    },
    {
      id: "933110009002",
      createdAt: now - 2 * DAY,
      method: "ai",
      form: electronicsForm,
      issues: [
        {
          path: "goods.0.hsnCode",
          severity: "error",
          message:
            "HSN 620520 is apparel, but the item is electronic earbuds. Expected ~851830.",
          suggestedValue: "851830",
        },
      ],
      acknowledged: [],
      hasUnaddressed: true,
      status: "Customs Hold",
    },
    {
      id: "933110009003",
      createdAt: now - 3 * DAY,
      method: "manual",
      form: manufacturerForm,
      issues: [
        {
          path: "goods.0.hsnCode",
          severity: "error",
          message:
            "HSN code is missing for the rubber gaskets. Required for export customs.",
          suggestedValue: "401693",
        },
      ],
      acknowledged: [],
      hasUnaddressed: true,
      status: "At Warehouse",
    },
    {
      id: "933110009004",
      createdAt: now - 4 * DAY,
      method: "ai",
      form: pharmaForm,
      issues: [],
      acknowledged: [],
      hasUnaddressed: false,
      status: "In Transit",
    },
    {
      id: "933110009005",
      createdAt: now - 5 * DAY,
      method: "ai",
      form: handicraftsForm,
      issues: [],
      acknowledged: [],
      hasUnaddressed: false,
      status: "In Transit",
    },
    {
      id: "933110009006",
      createdAt: now - 6 * DAY,
      method: "manual",
      form: autoForm,
      issues: [
        {
          path: "consignee.addressLine1",
          severity: "warn",
          message:
            "Delivery failed: consignee address line looks incomplete. Confirm the street and suite.",
        },
      ],
      acknowledged: [],
      hasUnaddressed: true,
      status: "Exception",
    },
  ];
  seedShipments(recs);
}
