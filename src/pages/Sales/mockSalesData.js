import { mockEligibleSchemes } from "./mockEligibleSchemes";

export const GST_RATE = 0.18; // 18% GST applied only when payment mode is Online

export const caServiceCharges = {
  "Annual Compliance": 15000,
  "Private Limited Company Registration": 10000,
  "Section 8 Company Registration": 10000,
  "GeM Registration": 10000,
  "LLP Registration": 9000,
  "One Person Company (OPC) Registration": 9000,
  "12A & 80G Registration": 6500,
  "Trademark Registration": 6000,
  "ISO Certification": 6000,
  "ITR Filing": 2500,
  "CSR Registration (CSR-1)": 2500,
  "DARPAN Registration": 2000,
  "GST Registration": 1000,
  "DSC (Digital Signature Certificate)": 2000,
};

export const serviceTypeSchemes = {
  Certificate: [
    "Annual Compliance",
    "Private Limited Company Registration",
    "Section 8 Company Registration",
    "GeM Registration",
    "LLP Registration",
    "One Person Company (OPC) Registration",
    "12A & 80G Registration",
    "Trademark Registration",
    "ISO Certification",
    "ITR Filing",
    "CSR Registration (CSR-1)",
    "DARPAN Registration",
    "GST Registration",
    "DSC (Digital Signature Certificate)",
  ],
  "Consultancy Services": [
    "Startup India Seed Scheme",
    "Equity Based Funding",
    "Growth Grant",
    "NAIFF",
    "PM MUDRA",
    "PMEGP",
    "CGTMSE",
    "Seed Funding",
    "CGSS",
    "Div Funding",
    "NLM",
    "Animal Husbandry",
    "AHIDF",
    "Private Funding",
    "NGO Elevation",
    "NGO Development",
    "CSR",
    "Spark Grant",
  ],
  IT: [
    "Enterprise Web Portal & CRM Maintenance",
    "Cybersecurity Vulnerability & Pen-Test Audit",
    "Cloud Infrastructure Setup & AWS/Azure Migration",
    "Enterprise VoIP, VPN & Remote Network Architecture",
    "Custom API Integration & Microservices Gateway",
    "IT Hardware Fleet & Device Management (MDM)",
    "Enterprise CRM Setup",
    "Supply Chain Analytics Platform",
  ],
  Marketing: [
    "Performance Marketing & Multi-Channel Paid Ads",
    "Search Engine Optimization (SEO) & Organic Growth",
    "B2B Lead Generation & Automated Email Funnels",
    "Social Media Management & Brand Community",
    "Brand Identity, UI/UX & Creative Graphic Design",
    "Content Marketing & Enterprise PR Outreach",
    "Website & Brand Growth Suite",
  ],
};

// Aliases for flexible matching
serviceTypeSchemes["Certification"] = serviceTypeSchemes["Certificate"];
serviceTypeSchemes["Consultancy"] = serviceTypeSchemes["Consultancy Services"];
serviceTypeSchemes["culsontancy services"] = serviceTypeSchemes["Consultancy Services"];

export const schemeOptions = mockEligibleSchemes.map((scheme) => scheme.schemeName);

export const navItems = [
  { icon: "dashboard", label: "Dashboard" },
  { icon: "reports", label: "Clients" },
  { icon: "clients", label: "Register" },
  { icon: "overview", label: "Requests" },
  { icon: "invoice", label: "Invoices" },
  { icon: "wallet", label: "Payment" },
];

export const salesLeads = [];

export const initialSalesClients = [];

export const notifications = [];

export const requestActivities = [];

export const initialNewClientState = {
  company: "",
  contactPerson: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  serviceType: "Consultancy Services",
  stage: "Active",
  scheme: "PMEGP",
  amount: "",
  paymentMode: "Online",
  gstAmount: 0,
  totalPayment: 0,
  paymentReceived: "",
  paymentPending: 0,
  panNumber: "",
  aadharNumber: "",
  gstNumber: "",
  kycStatus: "Submitted",
  notes: "",
};
