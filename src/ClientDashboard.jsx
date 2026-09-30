import React from "react";
import { apiFetch } from "./services/apiClient";
import "./ClientDashboard.css";
import DashboardSidebar from "./components/dashboard/DashboardSidebar";
import ActivityTracker from "./components/ActivityTracker";
import MoreServicesPage from "./pages/MoreServicesPage";
import EligibilityPage from "./pages/EligibilityPage";
import InvoicesPage from "./pages/InvoicesPage";
import PaymentsPage from "./pages/PaymentsPage";
import { getTrackerState, getSchemeCompletedStages, getClientAllSchemeTrackers, getClientCompositeKey, isClientPrimaryScheme, isPaymentDemandOrSettlement, getCanonicalSchemeName } from "./utils/schemeTracker";
import { getManagerBranchDetails, normalizeSalesPersonName, sanitizeClientRecord } from "./utils/branchHelper";
import ClientInstallButton from "./components/ClientInstallButton";

/* ── Icon Registry ── */
const dashboardIcons = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  clients: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c.5-3.2 2.5-5 5.5-5s5 1.8 5.5 5" />
      <path d="M16 6.5a3 3 0 0 1 0 5" />
      <path d="M17.5 15.2c1.8.5 2.8 2 3 4.3" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
      <path d="M3 12h18" />
    </>
  ),
  eligibility: (
    <>
      <path d="M12 3 14.1 5l2.9-.2.8 2.8 2.4 1.7-1.1 2.7.3 2.9-2.7 1.1-1.7 2.4-2.7-1.1-2.7 1.1-1.7-2.4-2.7-1.1.3-2.9-1.1-2.7 2.4-1.7.8-2.8 2.9.2L12 3Z" />
      <path d="m8.7 12 2.1 2.1 4.6-4.6" />
    </>
  ),
  addScheme: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  receipt: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="m7 15 4-4 3 2 5-6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  check: (
    <>
      <path d="M20 6 9 17l-5-5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3s-7 2-7 7v5l7 5 7-5V10c0-5-7-7-7-7Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </>
  ),
  phone: (
    <>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.15 2.15m8.5 8.5 2.15 2.15M18.4 5.6l-2.15 2.15m-8.5 8.5-2.15 2.15" />
    </>
  ),
  wallet: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M16 12h2" />
      <path d="M2 9h20" />
    </>
  ),
};

function DashboardIcon({ name, size = 19 }) {
  return (
    <svg
      className="dashboard-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {dashboardIcons[name]}
    </svg>
  );
}

function ClientLiveClock() {
  const [currentDateTime, setCurrentDateTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayName = days[currentDateTime.getDay()];
  const dayNum = String(currentDateTime.getDate()).padStart(2, '0');
  const monthName = months[currentDateTime.getMonth()];
  const year = currentDateTime.getFullYear();
  let hours = currentDateTime.getHours();
  const minutes = String(currentDateTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentDateTime.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, '0');

  return <span>{`${dayName}, ${dayNum} ${monthName} ${year} • ${formattedHours}:${minutes}:${seconds} ${ampm}`}</span>;
}

export function isMoreServiceScheme(scheme) {
  if (!scheme) return false;
  const name = (scheme.name || scheme.schemeName || scheme.scheme || "").toLowerCase();
  const tag = (scheme.tag || "").toLowerCase();
  const cat = (scheme.category || "").toLowerCase();

  // Keywords for services (Certifications, Licensing, IT, Marketing, Work Services)
  const moreServiceKeywords = [
    "dsc", "digital signature", "certificate", "certification", "licensing", "license",
    "gst", "trademark", "itr", "csr", "darpan", "it infra", "cloud", "seo", "brand",
    "software", "marketing", "ad management", "compliance", "more service", "audit"
  ];

  if (moreServiceKeywords.some((k) => name.includes(k) || tag.includes(k) || cat.includes(k))) {
    return true;
  }

  // Eligible Funding/Loan Schemes (PMEGP, CGTMSE, PMFME, MUDRA, Stand-Up, NGO)
  const eligibleKeywords = ["pmegp", "cgtmse", "pmfme", "mudra", "standup", "stand-up", "ngo elevation", "loan", "subsidy"];
  if (eligibleKeywords.some((k) => name.includes(k))) {
    return false;
  }

  return false;
}

export function cleanSchemeDetail(detail) {
  if (!detail) return "";
  return detail.replace(/\s*\.?\s*Pitched Amount Paid:.*$/gi, "").trim();
}

/* ── Data Arrays ── */
const navItems = [
  ["dashboard", "Dashboard"],
  ["eligibility", "Eligibility"],
  ["receipt", "Invoices"],
  ["wallet", "Payments"],
  ["addScheme", "More Services"],
];


const activeSchemesData = [
  {
    id: 1,
    name: "Corporate Health Shield",
    tag: "Health & Benefit",
    cover: "₹10,00,000",
    policyNumber: "CHS-2026-048",
    status: "Active",
    startDate: "14 June 2026",
    renewalDate: "14 June 2027",
    premium: "₹42,000 / year",
    detail: "48 members covered across all branches with cashless hospitalization.",
  },
  {
    id: 2,
    name: "Enterprise IT Infra Shield",
    tag: "IT & Security",
    cover: "24/7 Monitoring",
    policyNumber: "ITS-2026-102",
    status: "Active",
    startDate: "01 March 2026",
    renewalDate: "01 March 2027",
    premium: "₹85,000 / year",
    detail: "Cloud infra management, automated backups, and 99.9% uptime SLA.",
  },
  {
    id: 3,
    name: "Brand Growth Suite",
    tag: "Marketing",
    cover: "Full Spectrum",
    policyNumber: "MKS-2026-309",
    status: "Active",
    startDate: "20 May 2026",
    renewalDate: "20 May 2027",
    premium: "₹60,000 / year",
    detail: "Digital ad campaign management, SEO optimization, and brand assets.",
  },
  {
    id: 4,
    name: "PM MUDRA",
    tag: "Compliance",
    cover: "Verified Seal",
    policyNumber: "MEC-2026-881",
    status: "Active",
    startDate: "15 Jan 2026",
    renewalDate: "15 Jan 2027",
    premium: "₹1,20,000 / year",
    detail: "Official trade certification verified for international commerce.",
  },
];

const pipelineSteps = [
  { name: "Submission", done: true, date: "10 Aug" },
  { name: "Doc Audit", done: true, date: "10 Aug" },
  { name: "Manager Review", done: true, date: "10 Aug" },
  { name: "Agreement", done: false, date: "Pending" },
  { name: "Final Approval", done: false, date: "Pending" },
];

const documentVaultData = [
  { name: "Incorporation Certificate", status: "verified", date: "10 Jan 2026" },
  { name: "GSTIN Verification Proof", status: "verified", date: "12 Jan 2026" },
  { name: "Annual Financial Statement", status: "pending", date: "Awaiting Upload" },
  { name: "Director ID Proof", status: "verified", date: "15 Jan 2026" },
];

const chartPoints = [
  { month: "Jan", val: 32 },
  { month: "Feb", val: 45 },
  { month: "Mar", val: 68 },
  { month: "Apr", val: 54 },
  { month: "May", val: 82 },
  { month: "Jun", val: 95 },
  { month: "Jul", val: 88 },
  { month: "Aug", val: 110 },
];

/* ── MAIN DASHBOARD COMPONENT ── */
export default function Dashboard({ onSignOut, userEmail }) {
  const [activeNav, setActiveNav] = React.useState("Dashboard");
  const [dark, setDark] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [schemeQuery, setSchemeQuery] = React.useState("");
  const [submittedQuery, setSubmittedQuery] = React.useState("");
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [notifFilter, setNotifFilter] = React.useState("all");
  const [unreadNotifCount, setUnreadNotifCount] = React.useState(3);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [clientProfileOpen, setClientProfileOpen] = React.useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState("");
  const [passwordSuccess, setPasswordSuccess] = React.useState("");
  const [selectedScheme, setSelectedScheme] = React.useState(null);

  // Quick Action Modals
  const [newRequestOpen, setNewRequestOpen] = React.useState(false);
  const [requestSubmitted, setRequestSubmitted] = React.useState(false);
  const [supportOpen, setSupportOpen] = React.useState(false);
  const [requestService, setRequestService] = React.useState("Certificate");
  const [requestNotes, setRequestNotes] = React.useState("");

  const [dbProfile, setDbProfile] = React.useState(null);

  React.useEffect(() => {
    async function fetchMyProfileFromDB() {
      try {
        const response = await apiFetch("/clients/my-profile");

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.data) {
            setDbProfile(resData.data);
          }
        }
      } catch (err) {
        console.warn("Could not fetch client profile from DB:", err);
      }
    }

    fetchMyProfileFromDB();

    // Re-fetch when admin updates milestones on any scheme
    window.addEventListener("agni_clients_updated", fetchMyProfileFromDB);
    return () => {
      window.removeEventListener("agni_clients_updated", fetchMyProfileFromDB);
    };
  }, [userEmail]);

  const activeSalesClient = React.useMemo(() => {
    try {
      const savedSales = localStorage.getItem("agni_sales_clients") || localStorage.getItem("agni_branch_clients");
      if (savedSales) {
        const parsed = JSON.parse(savedSales);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const match = parsed.find((c) => c.email && userEmail && c.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
          if (match) return match;
        }
      }
    } catch (e) { }
    return null;
  }, [userEmail]);

  const clientStoredData = React.useMemo(() => {
    const emailKey = (userEmail || "default").trim().toLowerCase();
    const saved = localStorage.getItem(`agni_client_doc_data_${emailKey}`) || localStorage.getItem(`agni_doc_temp_${emailKey}`);
    return saved ? JSON.parse(saved) : null;
  }, [userEmail]);

  const clientInfo = React.useMemo(() => {
    const defaultCompName = userEmail ? userEmail.split("@")[0].toUpperCase() : "Client Company";
    const resolvedCompName = dbProfile?.companyName || activeSalesClient?.company || activeSalesClient?.name || clientStoredData?.companyName || defaultCompName;
    const rawReq = dbProfile?.fundingRequirement || activeSalesClient?.fundingRequirement || activeSalesClient?.requiredAmount || clientStoredData?.fundingRequirement;
    const reqNum = rawReq && !isNaN(Number(rawReq)) && Number(rawReq) >= 100000 ? Number(rawReq) : 2500000;
    return {
      eligibleSchemes: dbProfile?.eligibleSchemes || activeSalesClient?.eligibleSchemes || [],
      companyName: resolvedCompName,
      representativeName: dbProfile?.representativeName || dbProfile?.contactPerson || activeSalesClient?.contactPerson || activeSalesClient?.name || clientStoredData?.representativeName || "Client Representative",
      phone: dbProfile?.contactNumber || dbProfile?.phone || activeSalesClient?.phone || clientStoredData?.contactNumber || "+91 98765 43210",
      registrationNumber: dbProfile?.gstNumber || dbProfile?.panNumber || clientStoredData?.gstNumber || clientStoredData?.panNumber || "GSTIN 27ABCDE1234F1Z5",
      email: userEmail || "client@company.com",
      address: dbProfile?.address || activeSalesClient?.address || "Main Office Address",
      gstNumber: dbProfile?.gstNumber || clientStoredData?.gstNumber || "N/A (Optional)",
      panNumber: dbProfile?.panNumber || clientStoredData?.panNumber || "ABCDE1234F",
      aadharNumber: dbProfile?.aadharNumber || clientStoredData?.aadharNumber || "1234 5678 9012",
      msmeNumber: dbProfile?.msmeNumber || clientStoredData?.msmeNumber || "N/A",
      businessType: dbProfile?.businessType || clientStoredData?.businessType || "Pvt Ltd",
      sector: dbProfile?.sector || clientStoredData?.sector || "Manufacturing",
      companyAge: dbProfile?.companyAge || clientStoredData?.companyAge || "1 Year",
      annualTurnover: (dbProfile?.annualTurnover || clientStoredData?.annualTurnover) ? `₹${Number(dbProfile?.annualTurnover || clientStoredData?.annualTurnover).toLocaleString("en-IN")}` : "N/A (Startup)",
      fundingRequirement: reqNum >= 10000000 ? `₹${(reqNum / 10000000).toFixed(0)} Cr` : `₹${reqNum.toLocaleString("en-IN")}`,
      tier: "Enterprise Client",
      status: "Active",
      relationshipManager: "Kansish",
      managerRole: "Enterprise Account Lead",
      salesRepresentative: dbProfile?.salesPerson?.fullName || dbProfile?.owner || "Riya Mukherjee",
      salesRole: "Senior Sales Lead",
      branch: "West Regional Branch",
      memberSince: "14 June 2024",
      activeCoverage: "₹5.0 Cr",
      totalServices: "4 Active Plans",
      annualBilling: "₹3,07,000 / year",
      nextRenewal: "14 June 2027",
      complianceScore: "94% Verified",
      kycStatus: "Verified (Level 3 Tier)",
      primaryScheme: "PMEGP / Corporate Health Shield",
    };
  }, [userEmail, clientStoredData, dbProfile, activeSalesClient]);

  const [trackerSyncTick, setTrackerSyncTick] = React.useState(0);

  // Dynamic calculation for Total Loan (sums Funding Requirement of primary + secondary schemes)
  const totalLoanAmount = React.useMemo(() => {
    if (dbProfile?.computedTotalLoan && !isNaN(Number(dbProfile.computedTotalLoan)) && Number(dbProfile.computedTotalLoan) > 0) {
      return Number(dbProfile.computedTotalLoan);
    }

    if (dbProfile && Array.isArray(dbProfile.allServices) && dbProfile.allServices.length > 0) {
      return dbProfile.allServices.reduce((sum, service) => {
        if (!isPaymentDemandOrSettlement(service)) {
          return sum + Number(service.fundingRequirement || service.amountRequired || 0);
        }
        return sum;
      }, 0);
    }

    let baseAmount = Number(dbProfile?.fundingRequirement || clientStoredData?.fundingRequirement || 0);
    let secondarySchemesAmount = 0;

    try {
      const targetEmail = (userEmail || "").toLowerCase().trim();
      const savedSales = localStorage.getItem("agni_sales_clients") || localStorage.getItem("agni_branch_clients");
      if (savedSales && targetEmail) {
        const parsed = JSON.parse(savedSales);
        if (Array.isArray(parsed)) {
          parsed.forEach((c) => {
            if (c.email && c.email.toLowerCase().trim() === targetEmail) {
              const schemeName = String(c.serviceName || c.scheme || "").toLowerCase();
              const primaryName = String(dbProfile?.serviceName || dbProfile?.scheme || "pmegp").toLowerCase();
              if (schemeName && !schemeName.includes(primaryName) && c.id !== dbProfile?.id) {
                const req = Number(c.fundingRequirement || c.amountRequired || 0);
                secondarySchemesAmount += req;
              }
            }
          });
        }
      }

      const savedPending = localStorage.getItem("agni_pending_scheme_requests");
      if (savedPending && targetEmail) {
        const parsedPending = JSON.parse(savedPending);
        if (Array.isArray(parsedPending)) {
          parsedPending.forEach((r) => {
            const rEmail = (r.clientEmail || r.email || "").toLowerCase().trim();
            if (rEmail === targetEmail && (r.status === "Approved & Active" || r.status === "Approved")) {
              const req = Number(r.amountRequired || r.fundingRequirement || 0);
              secondarySchemesAmount += req;
            }
          });
        }
      }
    } catch (e) { }

    return baseAmount + secondarySchemesAmount;
  }, [dbProfile, clientStoredData, userEmail, trackerSyncTick]);





  // Format currency: e.g. 100000 -> ₹1 Lakh (or ₹1,00,000)
  const formattedTotalLoan = React.useMemo(() => {
    if (totalLoanAmount >= 10000000) {
      const cr = totalLoanAmount / 10000000;
      return cr % 1 === 0 ? `₹${cr} Cr` : `₹${cr.toFixed(1)} Cr`;
    } else if (totalLoanAmount >= 100000) {
      const lakhs = totalLoanAmount / 100000;
      return lakhs % 1 === 0 ? `₹${lakhs} Lakh` : `₹${lakhs.toFixed(1)} Lakh`;
    }
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(totalLoanAmount);
  }, [totalLoanAmount]);

  const dynamicDocumentVault = React.useMemo(() => {
    const normalizeName = (rawName) => {
      if (!rawName) return "Compliance Document";
      const trimmed = String(rawName).trim();
      const lower = trimmed.toLowerCase();
      if (lower.includes("company pan")) return "Company PAN";
      if (lower.includes("pan")) return "PAN Card";
      if (lower.includes("tan")) return "TAN Certificate";
      if (lower.includes("cin")) return "CIN Certificate";
      if (lower.includes("aadhar") || lower.includes("aadhaar")) return "Aadhar Card";
      if (lower.includes("gst")) return "GSTIN Certificate";
      if (lower.includes("msme") || lower.includes("udyam")) return "MSME Certificate";
      if (lower.includes("12a")) return "12A Registration Number";
      if (lower.includes("80g")) return "80G Certificate Number";
      if (lower.includes("darpan")) return "DARPAN Unique ID";
      return trimmed;
    };

    const salesVerificationMap = new Map();

    if (dbProfile?.documents && Array.isArray(dbProfile.documents) && dbProfile.documents.length > 0) {
      dbProfile.documents.forEach((item) => {
        const norm = normalizeName(item.documentName || item.name || item.label);
        const st = (item.verificationStatus || item.status || "pending").toLowerCase();
        if (st === "verified") salesVerificationMap.set(norm, true);
        else salesVerificationMap.set(norm, false);
      });
    }

    let onboardDocData = null;
    try {
      const emailKey = (userEmail || "default").trim().toLowerCase();
      const savedDoc = localStorage.getItem(`agni_client_doc_data_${emailKey}`);
      if (savedDoc) onboardDocData = JSON.parse(savedDoc);
    } catch (e) { }

    let match = null;
    try {
      const saved = localStorage.getItem("agni_branch_clients") || localStorage.getItem("agni_sales_clients");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          match = parsed.find((c) => c.email && userEmail && c.email.toLowerCase().trim() === userEmail.toLowerCase().trim())
            || parsed.find((c) => c.company && clientInfo?.companyName && c.company.toLowerCase().includes(clientInfo.companyName.toLowerCase()));
        }
      }
    } catch (e) { }


    const bType = onboardDocData?.businessType || dbProfile?.businessType || clientStoredData?.businessType || match?.businessType || "";
    const compName = onboardDocData?.companyName || dbProfile?.companyName || clientInfo?.companyName || match?.company || match?.name || "";

    const isNgo = bType.toLowerCase().includes("ngo") || /ngo/i.test(compName);
    if (isNgo) {
      const ngoDocs = [
        { name: "12A Registration Number", val: onboardDocData?.twelveARegNumber || dbProfile?.twelveARegNumber || match?.twelveARegNumber },
        { name: "PAN Card", val: onboardDocData?.panNumber || dbProfile?.panNumber || match?.panNumber },
        { name: "80G Certificate Number", val: onboardDocData?.eightyGCertNumber || dbProfile?.eightyGCertNumber || match?.eightyGCertNumber },
        { name: "DARPAN Unique ID", val: onboardDocData?.darpanId || dbProfile?.darpanId || match?.darpanId },
      ];
      return ngoDocs.map((d) => {
        const norm = normalizeName(d.name);
        const isVerified = salesVerificationMap.get(norm) === true;
        const isSubmitted = !!d.val;
        return {
          name: d.name,
          status: isVerified ? "verified" : "pending",
          date: isVerified
            ? "Verified by Sales Officer"
            : isSubmitted
              ? `Submitted (Ref: ${d.val})`
              : "Not Verified (Awaiting Verification)",
        };
      });
    }

    const isCorp = ["Pvt Ltd", "OPC", "LLP", "Section 8 Company", "Private Limited"].includes(bType) ||
      /pvt\s*ltd|private\s*limited|llp|opc|section\s*8/i.test(compName);

    if (isCorp) {
      const corporateDocs = [
        { name: "Company PAN", val: onboardDocData?.companyPan || onboardDocData?.panNumber || dbProfile?.companyPan || dbProfile?.panNumber || match?.companyPan || match?.panNumber },
        { name: "TAN Certificate", val: onboardDocData?.tanNumber || dbProfile?.tanNumber || match?.tanNumber },
        { name: "CIN Certificate", val: onboardDocData?.cinNumber || dbProfile?.cinNumber || match?.cinNumber },
        { name: "GSTIN Certificate", val: onboardDocData?.gstNumber || dbProfile?.gstNumber || match?.gstNumber },
      ];

      return corporateDocs.map((d) => {
        const norm = normalizeName(d.name);
        const isVerified = salesVerificationMap.get(norm) === true;
        const isSubmitted = !!d.val;
        return {
          name: d.name,
          status: isVerified ? "verified" : "pending",
          date: isVerified
            ? "Verified by Sales Officer"
            : isSubmitted
              ? `Submitted (Ref: ${d.val})`
              : "Not Verified (Awaiting Verification)",
        };
      });
    }

    // Proprietorship / Partnership / Default entity type
    const proprietorshipDocs = [
      { name: "PAN Card", val: onboardDocData?.panNumber || dbProfile?.panNumber || match?.panNumber },
      { name: "Aadhar Card", val: onboardDocData?.aadharNumber || dbProfile?.aadharNumber || match?.aadharNumber },
      { name: "GSTIN Certificate", val: onboardDocData?.gstNumber || dbProfile?.gstNumber || match?.gstNumber },
      { name: "MSME Certificate", val: onboardDocData?.msmeNumber || dbProfile?.msmeNumber || match?.msmeNumber },
    ];

    return proprietorshipDocs.map((d) => {
      const norm = normalizeName(d.name);
      const isVerified = salesVerificationMap.get(norm) === true;
      const isSubmitted = !!d.val;
      return {
        name: d.name,
        status: isVerified ? "verified" : "pending",
        date: isVerified
          ? "Verified by Sales Officer"
          : isSubmitted
            ? `Submitted (Ref: ${d.val})`
            : "Not Verified (Awaiting Verification)",
      };
    });
  }, [dbProfile, userEmail, clientInfo, clientStoredData]);

  // Dynamic Dedicated Account Leadership calculation (Sales Manager of that particular branch & Sales Representative)
  const dedicatedTeam = React.useMemo(() => {
    let salesRep = dbProfile?.salesPerson?.fullName || dbProfile?.owner || "";
    let salesManager = dbProfile?.salesManager || "";
    let clientBranchRaw = dbProfile?.branch || "";
    let clientBranch = typeof clientBranchRaw === "string" ? clientBranchRaw : (clientBranchRaw?.name || "");

    // Look up client details from localStorage branch/sales clients
    try {
      const saved = localStorage.getItem("agni_branch_clients") || localStorage.getItem("agni_sales_clients");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let rawMatch = parsed.find((c) => c.email && userEmail && c.email.toLowerCase() === userEmail.toLowerCase())
            || parsed.find((c) => c.company && clientInfo?.companyName && c.company.toLowerCase().includes(clientInfo.companyName.toLowerCase()));

          if (rawMatch) {
            const match = sanitizeClientRecord(rawMatch);
            if (!salesRep) {
              const sr = match.assignedSalesPerson || match.owner || match.salesRepresentative || match.salesperson;
              salesRep = typeof sr === "string" ? sr : (sr?.name || "");
            }
            if (!salesManager) {
              const sm = match.salesManager || match.managerName || match.reportingManager;
              salesManager = typeof sm === "string" ? sm : (sm?.name || "");
            }
            if (!clientBranch) {
              const cb = match.branch || match.branchName;
              clientBranch = typeof cb === "string" ? cb : (cb?.name || "");
            }
          }
        }
      }
    } catch (e) { }

    const isHeena = (userEmail && userEmail.toLowerCase().includes("heena")) || (clientInfo?.companyName && clientInfo.companyName.toLowerCase().includes("heena"));
    if (isHeena) {
      salesRep = "Rohan Gupta";
      clientBranch = "North Zone (Delhi)";
      salesManager = "Ananya Sen";
    }

    // Resolve branch details from branchHelper safely
    const branchDetails = getManagerBranchDetails(salesRep || clientBranch || userEmail);

    const mgrStr = (typeof salesManager === "string" && salesManager.trim()) ? salesManager.trim() : (branchDetails?.managerName || "Ananya Sen");
    const repStr = normalizeSalesPersonName((typeof salesRep === "string" && salesRep.trim()) ? salesRep.trim() : (branchDetails?.salespersons?.[0] || "Rohan Gupta"));

    const mgrInitials = typeof mgrStr === "string" ? mgrStr.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().substring(0, 2) : "AS";
    const repInitials = typeof repStr === "string" ? repStr.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().substring(0, 2) : "RG";

    return {
      managerName: mgrStr,
      managerRole: "Sales Manager",
      managerInitials: mgrInitials || "AS",
      managerPhone: "+91 98111 22335",
      salesRepName: repStr,
      salesRepRole: "Sales Representative",
      salesRepInitials: repInitials || "RG",
      branchName: branchDetails?.branchName || "North Zone (Delhi)",
    };
  }, [dbProfile, userEmail, clientInfo]);

  // Dynamic Enrolled Active Plans state (approved plans stored per client composite key in localStorage)
  const [enrolledPlans, setEnrolledPlans] = React.useState(() => {
    const emailKey = (userEmail || "default").trim().toLowerCase();
    const compKey = getClientCompositeKey(clientInfo.companyName, emailKey);
    try {
      let plans = [];
      const savedComp = localStorage.getItem(`agni_approved_client_plans_${compKey}`);
      if (savedComp) {
        const parsed = JSON.parse(savedComp);
        if (Array.isArray(parsed)) plans.push(...parsed);
      }
      const savedEmail = localStorage.getItem(`agni_approved_client_plans_${emailKey}`);
      if (savedEmail) {
        const parsed = JSON.parse(savedEmail);
        if (Array.isArray(parsed)) {
          parsed.forEach((p) => {
            if (!plans.some((existing) => (existing.name || "").toLowerCase() === (p.name || "").toLowerCase())) {
              plans.push(p);
            }
          });
        }
      }
      if (plans.length > 0) return plans;
    } catch (e) { }
    return [];
  });

  // Track pending scheme requests waiting for Sales approval & payment
  const [pendingRequests, setPendingRequests] = React.useState(() => {
    try {
      const saved = localStorage.getItem("agni_pending_scheme_requests");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((r) => r.clientEmail === userEmail && r.status.includes("Pending"));
        }
      }
    } catch (e) { }
    return [];
  });

  // Pending payment demands sent by Sales for this client
  const pendingPaymentDemands = React.useMemo(() => {
    const emailKey = (userEmail || "").trim().toLowerCase();
    const companyKey = (clientInfo?.companyName || "").trim().toLowerCase();
    let allDemands = [];
    try {
      const s1 = localStorage.getItem("agni_sales_payments");
      const s2 = localStorage.getItem("agni_payment_demands");
      const s3 = localStorage.getItem("agni_client_requests");
      const l1 = s1 ? JSON.parse(s1) : [];
      const l2 = s2 ? JSON.parse(s2) : [];
      const l3 = s3 ? JSON.parse(s3) : [];
      allDemands = [...l1, ...l2, ...l3];

      if (emailKey) {
        const perEmail = localStorage.getItem(`agni_payment_demands_${emailKey}`);
        if (perEmail) {
          try {
            const parsed = JSON.parse(perEmail);
            if (Array.isArray(parsed)) allDemands.push(...parsed);
          } catch (e) { }
        }
      }
    } catch (e) { }

    const matchMap = new Map();
    allDemands.forEach((p) => {
      if (!p || !p.id) return;
      const statusLower = (p.status || "").toLowerCase();
      if (statusLower === "paid" || statusLower === "success" || statusLower === "cancelled") return;

      const pEmail = (p.clientEmail || p.email || "").trim().toLowerCase();
      const pComp = (p.clientCompany || p.clientName || p.company || "").trim().toLowerCase();

      const matchEmail = emailKey && pEmail && pEmail === emailKey;
      const matchComp = companyKey && pComp && (companyKey.includes(pComp) || pComp.includes(companyKey));

      if (matchEmail || matchComp) {
        matchMap.set(String(p.id), p);
      }
    });

    return Array.from(matchMap.values());
  }, [userEmail, clientInfo, trackerSyncTick]);

  // Re-sync enrolled plans when storage event fires or user logs in
  React.useEffect(() => {

    function syncClientPlans() {
      const emailKey = (userEmail || "default").trim().toLowerCase();
      const compKey = getClientCompositeKey(clientInfo.companyName, emailKey);
      try {
        let plans = [];
        const savedComp = localStorage.getItem(`agni_approved_client_plans_${compKey}`);
        if (savedComp) {
          const parsed = JSON.parse(savedComp);
          if (Array.isArray(parsed)) {
            parsed.forEach((p) => {
              if (!isPaymentDemandOrSettlement(p)) plans.push(p);
            });
          }
        }
        const savedEmail = localStorage.getItem(`agni_approved_client_plans_${emailKey}`);
        if (savedEmail) {
          const parsed = JSON.parse(savedEmail);
          if (Array.isArray(parsed)) {
            parsed.forEach((p) => {
              if (!isPaymentDemandOrSettlement(p) && !plans.some((existing) => (existing.name || "").toLowerCase() === (p.name || "").toLowerCase())) {
                plans.push(p);
              }
            });
          }
        }
        const savedDb = localStorage.getItem("agni_client_enrolled_schemes_db");
        if (savedDb) {
          const parsedDb = JSON.parse(savedDb);
          if (Array.isArray(parsedDb)) {
            parsedDb.forEach((entry) => {
              if (!isPaymentDemandOrSettlement(entry)) {
                if (entry.clientEmail && userEmail && entry.clientEmail.toLowerCase().trim() === userEmail.toLowerCase().trim()) {
                  if (!plans.some((existing) => (existing.name || "").toLowerCase() === (entry.schemeName || "").toLowerCase())) {
                    plans.push({
                      id: `approved-db-${Date.now()}-${Math.random()}`,
                      name: entry.schemeName,
                      tag: entry.tag || "Approved Scheme",
                      cover: entry.pitchedAmount ? `₹${Number(entry.pitchedAmount).toLocaleString("en-IN")}` : "₹10,000",
                      status: "Active",
                      enrollmentDate: entry.enrollmentDate || entry.approvedAt || "Recently Approved",
                      detail: `Approved scheme (${entry.schemeName}) active in client profile.`,
                    });
                  }
                }
              }
            });
          }
        }

        if (dbProfile && Array.isArray(dbProfile.allServices)) {
          dbProfile.allServices.forEach((service) => {
            if (!isPaymentDemandOrSettlement(service)) {
              const sName = getCanonicalSchemeName(service.name || service.schemeName || service.scheme);
              if (sName && !plans.some((existing) => getCanonicalSchemeName(existing.name).toLowerCase() === sName.toLowerCase())) {
                const reqAmt = Number(service.fundingRequirement || service.amountRequired || 0);
                const reqStr = reqAmt > 0 ? `₹${reqAmt.toLocaleString("en-IN")}` : "₹10,00,000";
                plans.push({
                  ...service,
                  name: sName,
                  cover: reqStr,
                  fundingRequirement: reqAmt > 0 ? reqAmt : 1000000,
                  amountRequired: reqAmt > 0 ? reqAmt : 1000000,
                });
              }
            }
          });
        }

        const savedSales = localStorage.getItem("agni_sales_clients") || localStorage.getItem("agni_branch_clients");
        if (savedSales && emailKey) {
          try {
            const parsedSales = JSON.parse(savedSales);
            if (Array.isArray(parsedSales)) {
              parsedSales.forEach((c) => {
                const cEmail = (c.email || "").toLowerCase().trim();
                if (cEmail === emailKey) {
                  const sName = getCanonicalSchemeName(c.serviceName || c.scheme);
                  if (sName && !plans.some((existing) => getCanonicalSchemeName(existing.name).toLowerCase() === sName.toLowerCase())) {
                    const reqAmt = Number(c.fundingRequirement || c.amountRequired || 0);
                    const reqStr = reqAmt > 0 ? `₹${reqAmt.toLocaleString("en-IN")}` : "₹10,00,000";
                    plans.push({
                      id: c.id || `sales-client-scheme-${Date.now()}`,
                      name: sName,
                      tag: c.serviceType || "Consultancy Services",
                      cover: reqStr,
                      fundingRequirement: reqAmt > 0 ? reqAmt : 1000000,
                      amountRequired: reqAmt > 0 ? reqAmt : 1000000,
                      status: "Active",
                      enrollmentDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recently Approved",
                      detail: `Approved secondary scheme (${sName}) active in client profile.`,
                    });
                  }
                }
              });
            }
          } catch (e) { }
        }

        const savedPending = localStorage.getItem("agni_pending_scheme_requests");
        if (savedPending) {
          const parsedPending = JSON.parse(savedPending);
          if (Array.isArray(parsedPending)) {
            setPendingRequests(parsedPending.filter((r) => (r.clientEmail === userEmail || r.email === userEmail) && r.status && r.status.includes("Pending")));

            parsedPending.forEach((r) => {
              const rEmail = (r.clientEmail || r.email || "").toLowerCase().trim();
              if (rEmail === emailKey && (r.status === "Approved & Active" || r.status === "Approved")) {
                const sName = getCanonicalSchemeName(r.schemeName);
                if (sName && !plans.some((existing) => getCanonicalSchemeName(existing.name).toLowerCase() === sName.toLowerCase())) {
                  const reqAmt = Number(r.amountRequired || r.fundingRequirement || 0);
                  const reqStr = reqAmt > 0 ? `₹${reqAmt.toLocaleString("en-IN")}` : "₹10,00,000";
                  plans.push({
                    id: r.id || `approved-pending-${Date.now()}`,
                    name: sName,
                    tag: r.tag || r.category || "Consultancy Services",
                    cover: reqStr,
                    fundingRequirement: reqAmt > 0 ? reqAmt : 1000000,
                    amountRequired: reqAmt > 0 ? reqAmt : 1000000,
                    status: "Active",
                    enrollmentDate: r.decisionDate ? new Date(r.decisionDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recently Approved",
                    detail: `Approved secondary scheme (${sName}) active in client profile.`,
                  });
                }
              }
            });
          }
        }

        const validPlans = plans.filter((p) => !isPaymentDemandOrSettlement(p));
        setEnrolledPlans(validPlans);
      } catch (e) { }

      // Ensure active client entry exists in Sales database if client is accessing portal
      if (userEmail) {
        try {
          const savedSales = localStorage.getItem("agni_sales_clients");
          let salesList = savedSales ? JSON.parse(savedSales) : [];
          if (!Array.isArray(salesList)) salesList = [];
          const hasMatch = salesList.some((c) => c.email && c.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
          if (!hasMatch) {
            let pendingMatch = null;
            try {
              const pendingList = JSON.parse(localStorage.getItem("agni_pending_client_creations") || "[]");
              pendingMatch = pendingList.find((p) => p && p.email && p.email.toLowerCase().trim() === userEmail.toLowerCase().trim());
            } catch (e) { }

            const rawHandle = userEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ").trim();
            const formattedHandle = rawHandle ? rawHandle.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ") : "Client";

            const compName = clientInfo?.companyName || dbProfile?.companyName || pendingMatch?.company || pendingMatch?.name || `${formattedHandle} Enterprise`;
            const repName = dbProfile?.representativeName || clientInfo?.contactPerson || pendingMatch?.contactPerson || pendingMatch?.name || formattedHandle;
            const phoneNum = dbProfile?.contactNumber || clientInfo?.phone || pendingMatch?.phone || "+91 98765 43210";
            const ownerName = pendingMatch?.owner || pendingMatch?.salesPerson || "Riya Mukherjee";
            const ownerEmail = pendingMatch?.ownerEmail || pendingMatch?.salesPersonEmail || "riya.sales@agni.com";
            const bDetails = getManagerBranchDetails(ownerEmail || ownerName);

            const newRec = {
              id: `client-${Date.now()}`,
              company: compName,
              companyName: compName,
              name: compName,
              contactPerson: repName,
              email: userEmail,
              phone: phoneNum,
              address: dbProfile?.address || pendingMatch?.address || "Main Address",
              serviceType: pendingMatch?.serviceType || "Consultancy Services",
              stage: "Active",
              owner: ownerName,
              ownerEmail: ownerEmail,
              salesPerson: ownerName,
              salesPersonEmail: ownerEmail,
              salesperson: ownerName,
              salespersonEmail: ownerEmail,
              branch: bDetails.branchName,
              branchCode: bDetails.branchCode,
              region: bDetails.region,
              salesManager: bDetails.managerName,
              salesManagerEmail: bDetails.managerEmail,
              scheme: pendingMatch?.scheme || "PMEGP",
              amount: pendingMatch?.amount || "100000",
              paymentMode: pendingMatch?.paymentMode || "Online",
              gstAmount: 18000,
              totalPayment: pendingMatch?.totalPayment || "118000",
              paymentReceived: pendingMatch?.paymentReceived || "0",
              paymentPending: pendingMatch?.paymentPending || "118000",
              createdAt: new Date().toISOString(),
            };
            salesList.unshift(newRec);
            localStorage.setItem("agni_sales_clients", JSON.stringify(salesList));

            let branchList = [];
            try { branchList = JSON.parse(localStorage.getItem("agni_branch_clients") || "[]"); } catch (e) { }
            branchList.unshift(newRec);
            localStorage.setItem("agni_branch_clients", JSON.stringify(branchList));

            window.dispatchEvent(new Event("agni_clients_updated"));
          }
        } catch (e) { }
      }

      setTrackerSyncTick((t) => t + 1);
    }

    syncClientPlans();
    window.addEventListener("storage", syncClientPlans);
    window.addEventListener("agni_scheme_updated", syncClientPlans);
    window.addEventListener("agni_clients_updated", syncClientPlans);
    window.addEventListener("agni_payments_updated", syncClientPlans);
    const interval = setInterval(syncClientPlans, 30000);
    return () => {
      window.removeEventListener("storage", syncClientPlans);
      window.removeEventListener("agni_scheme_updated", syncClientPlans);
      window.removeEventListener("agni_clients_updated", syncClientPlans);
      window.removeEventListener("agni_payments_updated", syncClientPlans);
      clearInterval(interval);
    };
  }, [userEmail, dbProfile, clientInfo]);

  // Combine primary CRM scheme with additional approved enrolled plans
  const activePlansList = React.useMemo(() => {
    // Look up local salesperson client entry if available
    let salesClientMatch = null;
    try {
      const savedSales = localStorage.getItem("agni_sales_clients") || localStorage.getItem("agni_branch_clients");
      if (savedSales) {
        const parsed = JSON.parse(savedSales);
        if (Array.isArray(parsed) && parsed.length > 0) {
          salesClientMatch = parsed.find((c) => c.email && userEmail && c.email.toLowerCase().trim() === userEmail.toLowerCase().trim() && (c.isPrimary || c.processType !== "secondary"))
            || parsed.find((c) => c.email && userEmail && c.email.toLowerCase().trim() === userEmail.toLowerCase().trim())
            || parsed.find((c) => c.company && clientInfo?.companyName && c.company.toLowerCase().includes(clientInfo.companyName.toLowerCase()))
            || (userEmail ? null : parsed[0]);
        }
      }
    } catch (e) { }

    // 1st Plan: Primary CRM Plan details dynamically fetched from CRM DB / Sales Client / Document Form
    let primaryType = dbProfile?.serviceType || salesClientMatch?.serviceType || dbProfile?.serviceCategory || clientStoredData?.serviceType || "Consultancy Services";
    let primarySchemeName = dbProfile?.primaryScheme
      || salesClientMatch?.primaryScheme
      || dbProfile?.scheme
      || dbProfile?.serviceName
      || salesClientMatch?.scheme
      || dbProfile?.particularScheme
      || clientStoredData?.scheme
      || clientStoredData?.particularScheme
      || "PMEGP";

    primarySchemeName = getCanonicalSchemeName(primarySchemeName);

    // Normalize default legacy fields to PMEGP and Consultancy Services
    if (!primarySchemeName || isPaymentDemandOrSettlement(primarySchemeName) || primarySchemeName.toLowerCase().includes("financial assistant") || primarySchemeName.toLowerCase().includes("financial assistance")) {
      primarySchemeName = "PMEGP";
    }
    if (!primaryType || primaryType.toLowerCase().includes("certificate")) {
      primaryType = "Consultancy Services";
    }

    // Required Amount (Scheme / Loan Funding Amount) for Primary scheme card
    const primaryFundingReq = Number(dbProfile?.fundingRequirement || clientStoredData?.fundingRequirement || salesClientMatch?.fundingRequirement || 5000000);
    const primaryFormattedAmt = `₹${primaryFundingReq.toLocaleString("en-IN")}`;

    // Exact CRM creation date
    let createdDateStr = "14 June 2026";
    if (dbProfile?.createdAt) {
      try {
        const d = new Date(dbProfile.createdAt);
        if (!isNaN(d.getTime())) {
          createdDateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        }
      } catch (e) { }
    } else if (salesClientMatch?.createdAt) {
      try {
        const d = new Date(salesClientMatch.createdAt);
        if (!isNaN(d.getTime())) {
          createdDateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        }
      } catch (e) { }
    } else if (clientStoredData?.createdAt) {
      try {
        const d = new Date(clientStoredData.createdAt);
        if (!isNaN(d.getTime())) {
          createdDateStr = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
        }
      } catch (e) { }
    }

    const primaryPlan = {
      id: "primary-crm-plan",
      name: primarySchemeName, // Particular Scheme Name (e.g. Financial Assistance SC/ST)
      tag: primaryType, // Type of Plan (e.g. IT, Certificate, Schemes)
      cover: primaryFormattedAmt, // Required Amount for Primary Scheme
      fundingRequirement: primaryFundingReq,
      policyNumber: dbProfile?.appId || salesClientMatch?.appId || "AGNI-2026-001",
      status: "Active",
      enrollmentDate: createdDateStr, // Exact date the CRM created
      startDate: createdDateStr,
      renewalDate: createdDateStr,
      premium: "CRM Primary Contract",
      detail: "Primary active scheme assigned upon CRM generation by Sales Representative.",
    };

    const list = [primaryPlan];
    enrolledPlans.forEach((plan) => {
      const canonicalPlanName = getCanonicalSchemeName(plan.name || plan.schemeName || plan.scheme);
      if (!isPaymentDemandOrSettlement(plan) && !list.some((p) => getCanonicalSchemeName(p.name).toLowerCase() === canonicalPlanName.toLowerCase())) {
        let formattedDate = plan.enrollmentDate || plan.startDate || "26 Aug 2026";
        if (formattedDate.includes("-")) {
          try {
            const d = new Date(formattedDate);
            if (!isNaN(d.getTime())) {
              formattedDate = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
            }
          } catch (e) { }
        }
        list.push({
          ...plan,
          name: canonicalPlanName,
          enrollmentDate: formattedDate,
        });
      }
    });

    return list;
  }, [dbProfile, clientStoredData, enrolledPlans, userEmail]);

  // Handler to apply/enroll in a new scheme (submits pending request to Sales Representative & Branch Manager)
  const handleEnrollScheme = React.useCallback((schemeObj) => {
    const emailKey = userEmail || "default";
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);

    const pendingReq = {
      id: `req-${Date.now()}`,
      clientEmail: userEmail || "client@company.com",
      clientName: dbProfile?.representativeName || dbProfile?.companyName || clientInfo.companyName,
      schemeName: schemeObj.name || schemeObj.title || "Custom Scheme Plan",
      tag: schemeObj.tag || schemeObj.category || "General Scheme",
      category: schemeObj.category || schemeObj.categoryKey || "",
      price: schemeObj.price || schemeObj.premium || "Standard Fee",
      cover: schemeObj.cover || schemeObj.coverage || "Standard Coverage",
      detail: schemeObj.description || schemeObj.detail || "Client requested scheme enrollment.",
      salesPerson: dedicatedTeam.salesRepName || "Riya Mukherjee",
      salesPersonEmail: dedicatedTeam.salesRepEmail || "",
      branchManager: dedicatedTeam.managerName || "Ariana Lee",
      status: "Pending Sales Approval & Payment",
      createdAt: nowStr,
    };

    try {
      const saved = localStorage.getItem("agni_pending_scheme_requests");
      let allReqs = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(allReqs)) allReqs = [];

      // Avoid duplicate pending requests for the same scheme
      if (!allReqs.some((r) => r.clientEmail === pendingReq.clientEmail && r.schemeName.toLowerCase() === pendingReq.schemeName.toLowerCase() && r.status.includes("Pending"))) {
        allReqs.push(pendingReq);
        localStorage.setItem("agni_pending_scheme_requests", JSON.stringify(allReqs));
        setPendingRequests((prev) => [...prev, pendingReq]);

        // Post to backend database so Reps and Managers receive the request across devices
        apiFetch("/requests", {
          method: "POST",
          body: {
            clientId: dbProfile?.id,
            requestType: "NEW_SERVICE",
            reason: `Client self-enrollment for ${pendingReq.schemeName} (${pendingReq.cover})`,
            requestedChanges: pendingReq,
          },
        }).then(() => {
          window.dispatchEvent(new CustomEvent("agni_clients_updated"));
          window.dispatchEvent(new CustomEvent("agni_pending_updated"));
        }).catch((err) => {
          console.warn("Could not post scheme request to backend API:", err);
        });
      }
    } catch (e) {
      console.warn("Could not save scheme application request:", e);
    }
  }, [userEmail, dbProfile, clientInfo, dedicatedTeam]);

  const [selectedPipelineSchemeName, setSelectedPipelineSchemeName] = React.useState(null);

  // Compute all active scheme trackers for this client
  const allSchemeTrackers = React.useMemo(() => {
    const targetEmail = userEmail || localStorage.getItem("agni_user_email") || "";

    // Primary client object (first plan = primary CRM scheme)
    const primaryClient = {
      email: targetEmail,
      company: clientInfo.companyName,
      scheme: activePlansList[0]?.name || "PMEGP",
      serviceName: activePlansList[0]?.name || "PMEGP",
      completedSteps: dbProfile?.completedSteps || ["CRM Creation"],
    };

    // Build synthetic sibling records for each additional enrolled plan.
    // Secondary schemes START at 60% (3/5 steps) by business rule.
    // If admin has explicitly advanced beyond the default, use the DB value.
    const SECONDARY_DEFAULT_STEPS = ["CRM Creation", "Agreement", "Reports"];
    const siblingClients = activePlansList.slice(1).map((plan) => {
      // Find the matching DB service record by scheme name
      const dbService = (dbProfile?.allServices || []).find(
        (s) => s.schemeName && plan.name &&
          s.schemeName.toLowerCase().trim() === plan.name.toLowerCase().trim()
      );
      // Use DB steps only if admin has advanced beyond the 3-step default
      const dbSteps = dbService?.completedSteps;
      const resolvedSteps = (Array.isArray(dbSteps) && dbSteps.length > SECONDARY_DEFAULT_STEPS.length)
        ? dbSteps
        : SECONDARY_DEFAULT_STEPS;
      return {
        email: targetEmail,
        company: clientInfo.companyName,
        scheme: plan.name,
        serviceName: plan.name,
        completedSteps: resolvedSteps,
        progressPercent: dbService?.progressPercent,
        applicationStatus: dbService?.applicationStatus,
      };
    });

    return getClientAllSchemeTrackers(primaryClient, siblingClients);
  }, [userEmail, activePlansList, dbProfile, clientInfo, trackerSyncTick]);

  const activePipelineScheme = selectedPipelineSchemeName || (allSchemeTrackers[0] ? allSchemeTrackers[0].schemeName : "PMEGP");

  // Dynamic tracker state for currently selected active scheme
  const clientTracker = React.useMemo(() => {
    const matched = allSchemeTrackers.find(
      (t) => t.schemeName.toLowerCase() === activePipelineScheme.toLowerCase()
    );
    if (matched && matched.tracker) {
      return matched.tracker;
    }
    const targetEmail = userEmail || localStorage.getItem("agni_user_email") || "";
    // Find DB record for this scheme (primary or secondary) from allServices
    const dbService = (dbProfile?.allServices || []).find(
      (s) => s.schemeName && activePipelineScheme &&
        s.schemeName.toLowerCase().trim() === activePipelineScheme.toLowerCase().trim()
    );
    const isPrimary = dbService?.isPrimary !== false &&
      isClientPrimaryScheme({ email: targetEmail, scheme: activePipelineScheme }, activePipelineScheme);

    // Secondary schemes start at 60% by default; use DB only when admin advances further
    const SECONDARY_DEFAULT_STEPS = ["CRM Creation", "Agreement", "Reports"];
    const dbSteps = dbService?.completedSteps;
    const dbStepsResolved = (!isPrimary && Array.isArray(dbSteps) && dbSteps.length > SECONDARY_DEFAULT_STEPS.length)
      ? dbSteps
      : (!isPrimary ? SECONDARY_DEFAULT_STEPS : null);
    const resolvedSteps = isPrimary
      ? (dbProfile?.completedSteps || ["CRM Creation"])
      : (dbStepsResolved || SECONDARY_DEFAULT_STEPS);

    const clientObj = {
      email: targetEmail,
      company: clientInfo.companyName,
      scheme: activePipelineScheme,
      serviceName: activePipelineScheme,
      completedSteps: resolvedSteps,
    };
    const steps = getSchemeCompletedStages(clientObj, activePipelineScheme, resolvedSteps);
    return getTrackerState({ scheme: activePipelineScheme }, steps);
  }, [allSchemeTrackers, activePipelineScheme, userEmail, activePlansList, dbProfile, clientInfo, trackerSyncTick]);

  const clientProgressPercent = clientTracker.progressPercent;

  const formattedRenewalDate = React.useMemo(() => {
    const rawDate = dbProfile?.dueDate || activeSalesClient?.dueDate;
    if (rawDate) {
      try {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        }
      } catch (e) { }
      if (typeof rawDate === "string" && rawDate.trim()) return rawDate;
    }
    try {
      const emailKey = (userEmail || "").trim().toLowerCase();
      const localDue = localStorage.getItem(`agni_client_due_date_${emailKey}`);
      if (localDue) {
        const d = new Date(localDue);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        }
      }
    } catch (e) { }
    return "14 Jun 2027";
  }, [dbProfile?.dueDate, activeSalesClient?.dueDate, userEmail]);

  const executiveMetrics = React.useMemo(() => {
    return [
      { label: "Required Amount", value: formattedTotalLoan, icon: "shield", color: "#4e7cff", bg: "rgba(78, 124, 255, 0.12)" },
      { label: "Active Services", value: `${activePlansList.length} Plan${activePlansList.length > 1 ? "s" : ""}`, icon: "briefcase", color: "#9a74e9", bg: "rgba(154, 116, 233, 0.12)" },
      { label: "Scheme Progress", value: `${clientProgressPercent}%`, icon: "chart", color: "#44bfb0", bg: "rgba(68, 191, 176, 0.12)" },
      { label: "Next Renewal", value: formattedRenewalDate, icon: "clock", color: "#f2aa38", bg: "rgba(242, 170, 56, 0.12)" },
    ];
  }, [formattedTotalLoan, activePlansList, clientProgressPercent, formattedRenewalDate]);
  const filteredSchemes = activePlansList.filter((s) => !isPaymentDemandOrSettlement(s));

  // Auto notification listener for Pipeline Stage / Progress Updates
  const prevStageRef = React.useRef(null);
  React.useEffect(() => {
    if (!clientTracker || !activePipelineScheme) return;
    const currentKey = `${activePipelineScheme}_${clientTracker.currentStage}_${clientTracker.progressPercent}`;
    if (prevStageRef.current && prevStageRef.current !== currentKey) {
      try {
        const notif = {
          id: `notif-pipe-${Date.now()}`,
          type: "alerts",
          tone: "#9a74e9",
          title: `Service Pipeline Updated: ${activePipelineScheme}`,
          detail: `Your service stage updated to "${clientTracker.currentStage}" (${clientTracker.progressPercent}% completed).`,
          time: "Just now",
          createdAt: new Date().toISOString(),
          clientEmail: userEmail || "",
        };
        const savedNotifs = localStorage.getItem("agni_client_notifications");
        let list = savedNotifs ? JSON.parse(savedNotifs) : [];
        if (!Array.isArray(list)) list = [];
        if (!list.some(n => n.detail === notif.detail)) {
          list.unshift(notif);
          localStorage.setItem("agni_client_notifications", JSON.stringify(list));
        }
      } catch (e) { }
    }
    prevStageRef.current = currentKey;
  }, [activePipelineScheme, clientTracker, userEmail]);

  // Auto notification listener for New Invoices Issued
  const prevInvoiceCountRef = React.useRef(0);
  React.useEffect(() => {
    try {
      const emailKey = (userEmail || "").toLowerCase().trim();
      const savedInvoices = localStorage.getItem(`agni_invoices_${emailKey}`) || localStorage.getItem("agni_sales_invoices");
      if (savedInvoices) {
        const parsed = JSON.parse(savedInvoices);
        if (Array.isArray(parsed) && parsed.length > prevInvoiceCountRef.current && prevInvoiceCountRef.current > 0) {
          const latestInv = parsed[0];
          const notif = {
            id: `notif-inv-${Date.now()}`,
            type: "payments",
            tone: "#38bdf8",
            title: "New Invoice Issued",
            detail: `An official invoice ${latestInv.id || latestInv.number || ""} for ₹${Number(latestInv.amount || 0).toLocaleString("en-IN")} has been issued by your Sales Officer.`,
            time: "Just now",
            createdAt: new Date().toISOString(),
            clientEmail: userEmail || "",
          };
          const savedNotifs = localStorage.getItem("agni_client_notifications");
          let list = savedNotifs ? JSON.parse(savedNotifs) : [];
          if (!Array.isArray(list)) list = [];
          if (!list.some(n => n.detail === notif.detail)) {
            list.unshift(notif);
            localStorage.setItem("agni_client_notifications", JSON.stringify(list));
          }
        }
        if (Array.isArray(parsed)) prevInvoiceCountRef.current = parsed.length;
      }
    } catch (e) { }
  }, [userEmail, trackerSyncTick]);

  const [clearedNotifications, setClearedNotifications] = React.useState(false);

  const handleClearNotifications = React.useCallback(() => {
    setUnreadNotifCount(0);
    setClearedNotifications(true);
    try {
      const targetEmail = (userEmail || localStorage.getItem("agni_user_email") || "").toLowerCase().trim();
      localStorage.setItem(`agni_cleared_client_notifs_${targetEmail}`, "true");

      const saved = localStorage.getItem("agni_client_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const remaining = parsed.filter(n => n.clientEmail && n.clientEmail.toLowerCase().trim() !== targetEmail);
          localStorage.setItem("agni_client_notifications", JSON.stringify(remaining));
        }
      }
    } catch (e) { }
  }, [userEmail]);

  // Dynamic Client Notifications List
  const notificationsList = React.useMemo(() => {
    const targetEmail = (userEmail || localStorage.getItem("agni_user_email") || "").toLowerCase().trim();

    if (clearedNotifications) {
      return [];
    }

    try {
      const isCleared = localStorage.getItem(`agni_cleared_client_notifs_${targetEmail}`);
      if (isCleared === "true") {
        const saved = localStorage.getItem("agni_client_notifications");
        let customNotifs = [];
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            customNotifs = parsed.filter(n => n.clientEmail && n.clientEmail.toLowerCase().trim() === targetEmail);
          }
        }
        return customNotifs;
      }
    } catch (e) { }

    let savedNotifs = [];
    try {
      const saved = localStorage.getItem("agni_client_notifications");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          savedNotifs = parsed.filter(n => !n.clientEmail || !targetEmail || n.clientEmail.toLowerCase().trim() === targetEmail);
        }
      }
    } catch (e) { }

    const defaultNotifs = [
      { id: "default-1", type: "alerts", tone: "#10b981", title: "CRM Account Active", detail: `Registered under ${clientInfo.companyName} (${clientInfo.registrationNumber}).`, time: "1h ago" },
      { id: "default-2", type: "payments", tone: "#44bfb0", title: "Primary Contract Active", detail: "Primary CRM service contract is operational.", time: "3h ago" },
    ];

    return [...savedNotifs, ...defaultNotifs];
  }, [userEmail, trackerSyncTick, clientInfo, clearedNotifications]);

  React.useEffect(() => {
    setUnreadNotifCount(notificationsList.length);
  }, [notificationsList.length]);

  const filteredNotifications = notificationsList.filter(n => notifFilter === "all" || n.type === notifFilter);

  // Popover Outside Click Listener
  React.useEffect(() => {
    function handleClick() {
      setNotificationsOpen(false);
      setProfileOpen(false);
    }
    if (notificationsOpen || profileOpen) {
      window.addEventListener("click", handleClick);
      return () => window.removeEventListener("click", handleClick);
    }
  }, [notificationsOpen, profileOpen]);

  // Lock body scroll and hide scrollbars when profile modal is open
  React.useEffect(() => {
    if (clientProfileOpen) {
      document.body.classList.add("cd-profile-modal-open");
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.classList.remove("cd-profile-modal-open");
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [clientProfileOpen]);


  function handleCreateRequest(e) {
    e.preventDefault();
    const queryCategory = requestService || "General Client Inquiry";
    const queryDetail = requestNotes || "No details provided.";
    const clientName = clientInfo?.companyName || dbProfile?.companyName || "Client";

    const queryNotification = {
      id: `query-${Date.now()}`,
      title: `Client Query: ${queryCategory}`,
      detail: `${clientName}: "${queryDetail}"`,
      issuer: clientName,
      tone: "#aa83eb",
      time: "Just now",
      createdAt: new Date().toISOString(),
      salesPerson: dedicatedTeam.salesRepName,
    };

    try {
      const saved = localStorage.getItem("agni_sales_notifications");
      let allNotifs = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(allNotifs)) allNotifs = [];
      allNotifs.unshift(queryNotification);
      localStorage.setItem("agni_sales_notifications", JSON.stringify(allNotifs));
      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      console.warn("Could not post sales notification:", err);
    }

    setRequestSubmitted(true);
    setTimeout(() => {
      setRequestSubmitted(false);
      setNewRequestOpen(false);
      setRequestNotes("");
    }, 2200);
  }

  return (
    <main className={`client-dashboard cd-redesign ${dark ? "dashboard-dark" : ""}`}>
      <DashboardSidebar
        navItems={navItems}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        dark={dark}
        onToggleDark={() => setDark((value) => !value)}
        onSignOut={onSignOut}
        IconComponent={DashboardIcon}
        brandMark="A"
        navLabel="Client dashboard navigation"
      />

      <section className="dashboard-content">
        {/* ── COMMAND HEADER ── */}
        {!clientProfileOpen && (
          <header className="cd-header">
            <div className="cd-header-left">
              <div className="cd-company-pill">
                <div className="cd-company-avatar-wrap">
                  <div className="cd-company-avatar">
                    {(clientInfo.companyName || "AI").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="cd-online-dot" title="Account Active" />
                </div>
                <div className="cd-company-details">
                  <h1>{clientInfo.companyName}</h1>
                  <div className="cd-company-submeta">
                    <span className="cd-meta-badge id-badge">Reg: {clientInfo.registrationNumber}</span>
                    <span className="cd-meta-badge tier-badge">Contact: {clientInfo.representativeName}</span>
                    <span className="cd-meta-badge mgr-badge">Phone: {clientInfo.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="cd-header-center" />

            <div className="cd-header-actions">
              {/* Real-time Day & Time Clock */}
              <div className="cd-date-pill">
                <DashboardIcon name="clock" size={14} />
                <ClientLiveClock />
              </div>

              {/* Install App Button (Client Dashboard only, auto-hides when installed) */}
              <ClientInstallButton />

              {/* Notifications Popover */}
              <div className="cd-popover-wrap" onClick={(e) => e.stopPropagation()}>
                <button
                  className="cd-icon-btn cd-bell-btn"
                  onClick={() => {
                    setNotificationsOpen(!notificationsOpen);
                    setProfileOpen(false);
                  }}
                  title="Notifications"
                >
                  <DashboardIcon name="bell" size={17} />
                  {unreadNotifCount > 0 && <i className="cd-notif-dot" />}
                </button>
                {notificationsOpen && (
                  <section className="cd-popover cd-notif-popover">
                    <header className="cd-notif-popover-header">
                      <h2>Notifications</h2>
                      {notificationsList.length > 0 && (
                        <button
                          type="button"
                          className="cd-mark-read-btn"
                          onClick={handleClearNotifications}
                        >
                          Clear all
                        </button>
                      )}
                    </header>
                    <div className="cd-notif-list">
                      {notificationsList.length === 0 ? (
                        <div style={{ padding: "28px 16px", textAlign: "center", fontSize: 13, color: "#94a3b8" }}>
                          No notifications right now
                        </div>
                      ) : (
                        notificationsList.map((notice) => (
                          <article key={notice.id}>
                            <i className="cd-notice-dot" style={{ background: notice.tone }} />
                            <div>
                              <strong>{notice.title}</strong>
                              <p>{notice.detail}</p>
                              <time>{notice.time}</time>
                            </div>
                          </article>
                        ))
                      )}
                    </div>
                  </section>
                )}
              </div>

              {/* Profile Popover */}
              <div className="cd-popover-wrap" onClick={(e) => e.stopPropagation()}>
                <button
                  className="cd-profile-btn"
                  onClick={() => {
                    setProfileOpen(!profileOpen);
                    setNotificationsOpen(false);
                  }}
                  title="Account & Profile"
                >
                  DS
                </button>
                {profileOpen && (
                  <section className="cd-popover cd-profile-popover">
                    <div className="cd-profile-header">
                      <div className="cd-profile-avatar">DS</div>
                      <div>
                        <strong>{clientInfo.name}</strong>
                        <span className="cd-profile-email">{clientInfo.email}</span>
                      </div>
                    </div>
                    <div className="cd-profile-menu">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          setClientProfileOpen(true);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <DashboardIcon name="clients" size={16} />
                        <span>Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          setChangePasswordOpen(true);
                        }}
                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <DashboardIcon name="shield" size={16} />
                        <span>Change password</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDark((prev) => !prev)}
                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <DashboardIcon name="sparkle" size={16} />
                        <span>{dark ? "Switch to Light" : "Switch to Dark"}</span>
                      </button>
                      <button
                        className="cd-logout-option"
                        type="button"
                        onClick={onSignOut}
                        style={{ display: "flex", alignItems: "center", gap: 10 }}
                      >
                        <DashboardIcon name="briefcase" size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </header>
        )}

        {/* ── PAGE ROUTING CONTENT ── */}
        {activeNav === "More Services" ? (
          <MoreServicesPage
            onEnrollScheme={handleEnrollScheme}
            enrolledPlanNames={activePlansList.map((p) => p.name.toLowerCase())}
            assignedSalesPerson={dedicatedTeam.salesRepName}
            salesRole={dedicatedTeam.salesRepRole}
            dedicatedTeam={dedicatedTeam}
            userEmail={userEmail}
            clientInfo={clientInfo}
          />
        ) : activeNav === "Eligibility" ? (
          <EligibilityPage onEnrollScheme={handleEnrollScheme} enrolledPlanNames={activePlansList.map((p) => p.name.toLowerCase())} userEmail={userEmail} clientInfo={clientInfo} />
        ) : activeNav === "Invoices" ? (
          <InvoicesPage userEmail={userEmail} />
        ) : activeNav === "Payments" ? (
          <PaymentsPage userEmail={userEmail} clientInfo={clientInfo} />
        ) : (
          <>
            {/* ── PENDING PAYMENT DEMAND ALERT BANNER ── */}
            {pendingPaymentDemands.length > 0 && (
              <div
                className="cd-pending-demand-alert-banner"
                style={{
                  margin: "0 0 20px 0",
                  padding: "18px 24px",
                  borderRadius: 16,
                  background: "linear-gradient(135deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.1) 100%)",
                  border: "1.5px solid rgba(245, 158, 11, 0.45)",
                  boxShadow: "0 8px 24px rgba(245, 158, 11, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: "rgba(245, 158, 11, 0.25)",
                      color: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                      fontWeight: 800,
                    }}
                  >
                    ⚠️
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: "#f59e0b" }}>
                      ACTION REQUIRED: PENDING PAYMENT DEMAND ({pendingPaymentDemands.length})
                    </span>
                    <h3 style={{ margin: "2px 0", fontSize: 16, fontWeight: 800, color: "var(--cd-ink, #ffffff)" }}>
                      Payment Request Issued by Sales Representative
                    </h3>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--cd-muted, #cbd5e1)" }}>
                      {pendingPaymentDemands[0].description || `Payment demand for ₹${Number(pendingPaymentDemands[0].amount || 0).toLocaleString("en-IN")}`}
                      {pendingPaymentDemands[0].dueDate ? ` • Due: ${pendingPaymentDemands[0].dueDate}` : ""}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <strong style={{ fontSize: 20, fontWeight: 900, color: "#f59e0b" }}>
                    ₹{Number(pendingPaymentDemands[0].amount || 0).toLocaleString("en-IN")}
                  </strong>
                  <button
                    type="button"
                    onClick={() => setActiveNav("Payments")}
                    style={{
                      padding: "10px 22px",
                      borderRadius: 10,
                      border: "none",
                      background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                      color: "#ffffff",
                      fontSize: 13.5,
                      fontWeight: 700,
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    Settle & Pay Now →
                  </button>
                </div>
              </div>
            )}

            {/* ── HERO BANNER & METRICS RIBBON ── */}
            <section className="cd-hero-banner">
              <div className="cd-orb-mesh-1" />
              <div className="cd-orb-mesh-2" />
              <div className="cd-hero-content">
                <div className="cd-hero-greeting">
                  <div>
                    <span className="cd-kicker">EXECUTIVE WORKSPACE</span>
                    <h2>Welcome back, <em>{clientInfo.companyName}</em></h2>
                    <p>Track your active coverage, service status, and support pipelines in real time.</p>
                  </div>
                  <div className="cd-quick-status-pill">
                    <i className="cd-pulse-green" />
                    <span>Account Active</span>
                  </div>
                </div>

                <div className="cd-metrics-grid">
                  {executiveMetrics.map((item, idx) => (
                    <article
                      key={item.label}
                      className="cd-metric-card"
                      style={{ animationDelay: `${idx * 0.08}s` }}
                    >
                      <div className="cd-metric-icon-box" style={{ background: item.bg, color: item.color }}>
                        <DashboardIcon name={item.icon} size={22} />
                      </div>
                      <div className="cd-metric-info">
                        <span className="cd-metric-value">{item.value}</span>
                        <span className="cd-metric-label">{item.label}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            {/* ── MAIN DASHBOARD GRID ── */}
            <div className="cd-main-layout">
              {/* LEFT COLUMN */}
              <div className="cd-left-column">
                {/* Live Application Progress Pipeline Tracker */}
                <section className="cd-section-card cd-tracker-section">
                  <div className="cd-section-head">
                    <div>
                      <span className="cd-kicker">APPLICATION STATUS</span>
                      <h2>Active Service Pipeline ({clientTracker.schemeName})</h2>
                    </div>
                  </div>

                  {allSchemeTrackers.length > 1 && (
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      {allSchemeTrackers.map(({ schemeName: sName, tracker: sTracker }) => {
                        const isActive = sName.toLowerCase() === activePipelineScheme.toLowerCase();
                        return (
                          <button
                            key={sName}
                            type="button"
                            onClick={() => setSelectedPipelineSchemeName(sName)}
                            style={{
                              padding: "6px 14px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: "pointer",
                              border: isActive ? "1px solid #4e7cff" : "1px solid var(--cd-border)",
                              background: isActive ? "linear-gradient(135deg, #4e7cff 0%, #3b66e8 100%)" : "rgba(30, 41, 59, 0.6)",
                              color: isActive ? "#ffffff" : "var(--cd-muted)",
                              boxShadow: isActive ? "0 4px 12px rgba(78, 124, 255, 0.3)" : "none",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {sName} ({sTracker.progressPercent}%)
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div style={{ marginTop: 14 }}>
                    <ActivityTracker
                      scheme={clientTracker.schemeName}
                      completedSteps={clientTracker.completedStages}
                      progress={clientTracker.progressPercent}
                      interactive={false}
                      showMeter={false}
                    />
                  </div>
                </section>

                {/* Active Services Showcase Grid */}
                <section className="cd-section-card cd-schemes-section">
                  <div className="cd-section-head">
                    <div>
                      <span className="cd-kicker">COVERAGE PORTFOLIO</span>
                      <h2>Active Schemes & Plans</h2>
                    </div>
                    <span className="cd-pill-badge">{filteredSchemes.length} Active Plans</span>
                  </div>

                  <div className="cd-schemes-cards-grid">
                    {filteredSchemes.map((scheme) => (
                      <article key={scheme.id} className="cd-scheme-card-box">
                        <div className="cd-scheme-top-glow" />
                        <div className="cd-scheme-card-body">
                          <div className="cd-scheme-card-head">
                            <span className="cd-badge-active">
                              <DashboardIcon name="check" size={12} /> {scheme.status}
                            </span>
                            <span className="cd-scheme-tag">{scheme.tag}</span>
                          </div>
                          <h3>{scheme.name}</h3>
                          <p>{cleanSchemeDetail(scheme.detail)}</p>
                          <div className="cd-scheme-meta-box">
                            {!isMoreServiceScheme(scheme) ? (
                              <>
                                <div>
                                  <span>Required Amount</span>
                                  <strong>{scheme.cover}</strong>
                                </div>
                                <div>
                                  <span>Enrollment Date</span>
                                  <strong>{scheme.enrollmentDate || scheme.startDate || scheme.renewalDate || "1 Year Activation"}</strong>
                                </div>
                              </>
                            ) : (
                              <div>
                                <span>Enrollment Date</span>
                                <strong>{scheme.enrollmentDate || scheme.startDate || scheme.renewalDate || "1 Year Activation"}</strong>
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            className="cd-scheme-btn-outline"
                            onClick={() => setSelectedScheme(scheme)}
                          >
                            <span>Inspect Policy & Benefits</span>
                            <DashboardIcon name="arrow" size={15} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              {/* RIGHT COLUMN */}
              <div className="cd-right-column">
                {/* Document Vault Widget */}
                <section className="cd-section-card cd-doc-vault-section">
                  <div className="cd-section-head">
                    <div>
                      <span className="cd-kicker">COMPLIANCE</span>
                      <h2>Document Vault</h2>
                    </div>
                  </div>
                  <div className="cd-doc-vault-list">
                    {dynamicDocumentVault.map((doc) => (
                      <div key={doc.name} className="cd-doc-item">
                        <div className="cd-doc-item-left">
                          <div
                            className="cd-doc-icon"
                            style={{
                              background: doc.status === "verified" ? "rgba(68, 191, 176, 0.12)" : "rgba(242, 170, 56, 0.12)",
                              color: doc.status === "verified" ? "#44bfb0" : "#f2aa38"
                            }}
                          >
                            <DashboardIcon name="file" size={16} />
                          </div>
                          <div className="cd-doc-info">
                            <strong>{doc.name}</strong>
                            <small>{doc.date}</small>
                          </div>
                        </div>
                        <span className={`cd-doc-status-badge ${doc.status}`}>
                          {doc.status === "verified" ? "verified" : "not verified"}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Account Manager & Sales Lead Contact Widget */}
                <section className="cd-section-card cd-manager-section">
                  <div className="cd-section-head" style={{ marginBottom: 14 }}>
                    <div>
                      <span className="cd-kicker">Single Point of Contact</span>
                      <h2 style={{ fontSize: 20 }}>SPOC</h2>
                    </div>
                  </div>

                  <div className="cd-manager-card">
                    <div className="cd-manager-profile-row">
                      <div className="cd-manager-avatar">{dedicatedTeam.managerInitials}</div>
                      <div className="cd-manager-details">
                        <h3>{dedicatedTeam.managerName}</h3>
                        <p className="cd-manager-role">{dedicatedTeam.managerRole}</p>
                      </div>
                    </div>

                    <div className="cd-sales-rep-chip">
                      <div className="cd-sales-avatar-sm">{dedicatedTeam.salesRepInitials}</div>
                      <div className="cd-manager-details">
                        <h3>{dedicatedTeam.salesRepName}</h3>
                        <p className="cd-sales-role">{dedicatedTeam.salesRepRole}</p>
                      </div>
                    </div>

                    <div className="cd-manager-actions">
                      <a href={`tel:${dedicatedTeam.managerPhone}`} className="cd-call-btn" title="Call Sales Manager">
                        <DashboardIcon name="phone" size={13} /> Call Manager
                      </a>
                      <button
                        type="button"
                        className="cd-email-btn"
                        onClick={() => setNewRequestOpen(true)}
                        title="Contact Sales Representative"
                      >
                        <DashboardIcon name="arrow" size={13} /> Contact Rep
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── SCHEME DETAILS INSPECTION MODAL ── */}
      {selectedScheme && (
        <div className="cd-modal-backdrop" onMouseDown={() => setSelectedScheme(null)}>
          <section
            className="cd-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="cd-modal-close"
              onClick={() => setSelectedScheme(null)}
            >
              ×
            </button>
            <span className="cd-badge-active" style={{ marginBottom: 12 }}>
              <DashboardIcon name="check" size={11} /> {selectedScheme.status}
            </span>
            <h2>{selectedScheme.name}</h2>
            <p className="cd-modal-desc">{selectedScheme.detail}</p>
            <div className="cd-scheme-meta-box" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div>
                <span>Plan Type</span>
                <strong>{selectedScheme.tag}</strong>
              </div>
              <div>
                <span>Policy Number</span>
                <strong>{selectedScheme.policyNumber}</strong>
              </div>
              <div>
                <span>Enrollment Date</span>
                <strong>{selectedScheme.enrollmentDate || selectedScheme.startDate}</strong>
              </div>
              <div>
                <span>Required Amount</span>
                <strong>{selectedScheme.cover}</strong>
              </div>
              <div>
                <span>Contract Status</span>
                <strong>{selectedScheme.premium}</strong>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── TELL YOUR QUERY MODAL ── */}
      {newRequestOpen && (
        <div className="cd-modal-backdrop" onMouseDown={() => setNewRequestOpen(false)}>
          <section
            className="cd-modal cd-modal-request"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="cd-modal-top-glow" />
            <button
              type="button"
              className="cd-modal-close"
              onClick={() => setNewRequestOpen(false)}
            >
              ×
            </button>

            <span className="cd-kicker" style={{ marginBottom: 4, display: 'inline-block' }}>DIRECT SALES DISPATCH</span>
            <h2>Tell Your Query</h2>
            <p className="cd-modal-desc">
              Submit your query or request. This will be notified immediately to your assigned Sales Representative, <strong>{dedicatedTeam.salesRepName}</strong>.
            </p>

            {requestSubmitted ? (
              <div className="cd-request-success">
                <div className="cd-request-success-icon">
                  <DashboardIcon name="check" size={28} />
                </div>
                <h3>Query Dispatched Successfully!</h3>
                <p>Notification sent directly to <strong>{dedicatedTeam.salesRepName}</strong> (Sales Representative Dashboard). They will respond shortly.</p>
                <button
                  type="button"
                  className="cd-submit-btn cd-submit-btn-glow"
                  onClick={() => {
                    setRequestSubmitted(false);
                    setNewRequestOpen(false);
                  }}
                  style={{ marginTop: 12, width: '100%' }}
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateRequest} className="cd-modal-form">
                <div className="cd-modal-assigned-card">
                  <div className="cd-sales-avatar-sm" style={{ width: 36, height: 36, fontSize: 14 }}>
                    {dedicatedTeam.salesRepInitials}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13, color: 'var(--cd-ink)' }}>{dedicatedTeam.salesRepName}</strong>
                      <span className="cd-badge-active" style={{ fontSize: 10, padding: '2px 8px' }}>Assigned Sales Representative</span>
                    </div>
                    <small style={{ fontSize: 11, color: 'var(--cd-muted)', display: 'block' }}>
                      Sales Representative • Sales Manager: {dedicatedTeam.managerName}
                    </small>
                  </div>
                </div>

                <div className="cd-form-group">
                  <label className="cd-form-label">Query Topic / Category</label>
                  <select
                    value={requestService}
                    onChange={(e) => setRequestService(e.target.value)}
                    className="cd-modal-select"
                  >
                    <option value="General Client Inquiry">General Client Inquiry</option>
                    <option value="Scheme Application & Status Query">Scheme Application & Status Query</option>
                    <option value="Document Verification Update">Document Verification Update</option>
                    <option value="Billing & Commercial Terms Query">Billing & Commercial Terms Query</option>
                    <option value="Technical or Process Support">Technical or Process Support</option>
                  </select>
                </div>

                <div className="cd-form-group">
                  <label className="cd-form-label">Your Query / Message</label>
                  <textarea
                    rows={4}
                    value={requestNotes}
                    onChange={(e) => setRequestNotes(e.target.value)}
                    placeholder="Tell your query in detail..."
                    className="cd-modal-textarea"
                    required
                  />
                </div>

                <button type="submit" className="cd-submit-btn cd-submit-btn-glow">
                  <span>Send Query to {dedicatedTeam.salesRepName}</span>
                  <DashboardIcon name="arrow" size={16} />
                </button>
              </form>
            )}
          </section>
        </div>
      )}

      {/* ── HELP & SUPPORT MODAL ── */}
      {supportOpen && (
        <div className="cd-modal-backdrop" onMouseDown={() => setSupportOpen(false)}>
          <section
            className="cd-modal cd-modal-sm"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="cd-modal-close"
              onClick={() => setSupportOpen(false)}
            >
              ×
            </button>
            <h2>Help & Support Desk</h2>
            <p className="cd-modal-desc">
              Need assistance? Connect with your dedicated Account Manager.
            </p>
            <div className="cd-manager-card">
              <div className="cd-manager-avatar">K</div>
              <div className="cd-manager-details">
                <h3>Kansish</h3>
                <p className="cd-manager-role">Enterprise Account Lead</p>
              </div>
              <div className="cd-manager-actions">
                <a href="tel:+919876543210" className="cd-call-btn">
                  <DashboardIcon name="phone" size={14} /> Call Manager
                </a>
                <a href="mailto:support@agnicrm.com" className="cd-email-btn">
                  Email Support
                </a>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── CLIENT PROFILE DOSSIER MODAL ── */}
      {clientProfileOpen && (
        <div className="cd-modal-backdrop" onMouseDown={() => setClientProfileOpen(false)}>
          <section
            className="cd-modal cd-modal-profile"
            onMouseDown={(event) => event.stopPropagation()}
            style={{ maxWidth: 760, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
          >
            <div className="cd-modal-top-glow" />
            <button
              type="button"
              className="cd-modal-close"
              onClick={() => setClientProfileOpen(false)}
              aria-label="Close"
            >
              ×
            </button>

            {/* Top Banner Profile Identity */}
            <div className="cd-profile-dossier-hero">
              <div className="cd-profile-dossier-avatar">
                AI
                <span className="cd-online-dot-lg" title="Active Account" />
              </div>
              <div className="cd-profile-dossier-info">
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span className="cd-kicker" style={{ margin: 0 }}>CLIENT PROFILE & DOSSIER</span>
                  <span className="cd-badge-active" style={{ fontSize: 11, padding: "2px 8px" }}>
                    <DashboardIcon name="check" size={11} /> {clientInfo.status}
                  </span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: "var(--cd-ink)" }}>
                  {clientInfo.company}
                </h2>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <span className="cd-meta-badge id-badge">ID: {clientInfo.clientId}</span>
                  <span className="cd-meta-badge tier-badge">{clientInfo.tier}</span>
                  <span className="cd-meta-badge mgr-badge">Authorized: {clientInfo.name}</span>
                </div>
              </div>
            </div>

            {/* Organization & Contact Information */}
            <div className="cd-dossier-section-title">
              <DashboardIcon name="briefcase" size={15} />
              <span>Organization & Contact Information</span>
            </div>
            <div className="cd-dossier-grid">
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">Authorized Signatory</span>
                <strong className="cd-dossier-val">{clientInfo.name}</strong>
                <small className="cd-dossier-sub">{clientInfo.designation}</small>
              </div>
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">Official Email</span>
                <strong className="cd-dossier-val">{clientInfo.email}</strong>
                <small className="cd-dossier-sub">Registered primary login ID</small>
              </div>
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">Primary Phone</span>
                <strong className="cd-dossier-val">{clientInfo.phone}</strong>
                <small className="cd-dossier-sub">24/7 Verified Contact</small>
              </div>
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">Registered Office</span>
                <strong className="cd-dossier-val" style={{ fontSize: 12.5, lineHeight: 1.4 }}>
                  {clientInfo.address}
                </strong>
              </div>
            </div>

            {/* Legal, Tax & Compliance Identifiers */}
            <div className="cd-dossier-section-title" style={{ marginTop: 20 }}>
              <DashboardIcon name="file" size={15} />
              <span>Legal, Tax & Compliance Identifiers</span>
            </div>
            <div className="cd-dossier-grid">
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">Entity Structure & Sector</span>
                <strong className="cd-dossier-val" style={{ color: "#4e7cff" }}>{clientInfo.businessType}</strong>
                <small className="cd-dossier-sub">Sector: {clientInfo.sector}</small>
              </div>
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">Company Age & Turnover</span>
                <strong className="cd-dossier-val" style={{ color: "#10b981" }}>Age: {clientInfo.companyAge} {clientInfo.companyAge === "0" ? "(Startup)" : "Yrs"}</strong>
                <small className="cd-dossier-sub">Turnover: {clientInfo.annualTurnover}</small>
              </div>
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">PAN Number</span>
                <strong className="cd-dossier-val" style={{ color: "#9a74e9" }}>{clientInfo.panNumber}</strong>
                <span className="cd-tag-verified">✓ Verified Entity PAN</span>
              </div>
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">Aadhar Number</span>
                <strong className="cd-dossier-val">{clientInfo.aadharNumber}</strong>
                <span className="cd-tag-verified">✓ Verified Representative UID</span>
              </div>
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">GSTIN Number (Optional)</span>
                <strong className="cd-dossier-val" style={{ color: "#4e7cff" }}>{clientInfo.gstNumber}</strong>
                <span className="cd-tag-verified">✓ Tax Filing Profile</span>
              </div>
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">MSME Udyam Reg</span>
                <strong className="cd-dossier-val">{clientInfo.msmeNumber}</strong>
                <span className="cd-tag-verified">✓ MSME Verified</span>
              </div>
            </div>

            {/* CRM Management & Subscription Portfolio */}
            <div className="cd-dossier-section-title" style={{ marginTop: 20 }}>
              <DashboardIcon name="shield" size={15} />
              <span>CRM Management & Relationship</span>
            </div>
            <div className="cd-dossier-grid">
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">Relationship Manager</span>
                <strong className="cd-dossier-val">{clientInfo.relationshipManager}</strong>
                <small className="cd-dossier-sub">{clientInfo.managerRole}</small>
              </div>
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">Sales Specialist</span>
                <strong className="cd-dossier-val">{clientInfo.salesRepresentative}</strong>
                <small className="cd-dossier-sub">{clientInfo.salesRole}</small>
              </div>
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">Required Amount</span>
                <strong className="cd-dossier-val" style={{ color: "#4e7cff" }}>{formattedTotalLoan}</strong>
                <small className="cd-dossier-sub">Funding requirement</small>
              </div>
              <div className="cd-dossier-card">
                <span className="cd-dossier-label">Annual Value & Renewal</span>
                <strong className="cd-dossier-val" style={{ color: "#10b981" }}>{clientInfo.annualBilling}</strong>
                <small className="cd-dossier-sub">Next Renewal: {clientInfo.nextRenewal}</small>
              </div>
            </div>

            {/* Subscribed Active Policies List */}
            <div className="cd-dossier-section-title" style={{ marginTop: 20 }}>
              <DashboardIcon name="receipt" size={15} />
              <span>Subscribed Services & Active Policies ({activePlansList.length})</span>
            </div>
            <div className="cd-dossier-policies-list">
              {activePlansList.map((scheme) => (
                <div key={scheme.id} className="cd-dossier-policy-item">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 13.5, color: "var(--cd-ink)" }}>{scheme.name}</strong>
                      <span className="cd-meta-badge tier-badge" style={{ fontSize: 10, padding: "2px 6px" }}>{scheme.tag}</span>
                    </div>
                    <small style={{ color: "var(--cd-muted)", fontSize: 11.5 }}>
                      App ID: {scheme.policyNumber} • Enrolled: {scheme.enrollmentDate || scheme.startDate}
                    </small>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: "#4e7cff", display: "block" }}>{scheme.cover}</span>
                    <small style={{ color: "var(--cd-muted)", fontSize: 11 }}>{scheme.premium}</small>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--cd-border)" }}>
              <button
                type="button"
                className="cd-modal-btn-secondary"
                onClick={() => setClientProfileOpen(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="cd-action-btn-primary"
                onClick={() => {
                  setClientProfileOpen(false);
                  setNewRequestOpen(true);
                }}
                style={{ padding: "10px 22px" }}
              >
                <DashboardIcon name="addScheme" size={15} />
                <span>Request Service Change</span>
              </button>
            </div>
          </section>
        </div>
      )}

      {/* ── INSPECT POLICY & SERVICE PIPELINE MODAL ── */}
      {selectedScheme && (() => {
        const primarySchemeName = activePlansList[0]?.name || dbProfile?.scheme || "PMEGP";
        const isSelectedPrimary = selectedScheme.id === "primary-crm-plan" || selectedScheme.name.toLowerCase() === primarySchemeName.toLowerCase() || isClientPrimaryScheme(dbProfile, selectedScheme.name);
        const inspectDefaultSteps = isSelectedPrimary
          ? (dbProfile?.completedSteps || ["CRM Creation"])
          : ["CRM Creation", "Agreement", "Reports"];
        const inspectCompletedSteps = getSchemeCompletedStages(dbProfile, selectedScheme.name, inspectDefaultSteps);
        const inspectTrackerState = getTrackerState({ scheme: selectedScheme.name }, inspectCompletedSteps);

        return (
          <div className="cd-modal-backdrop" onMouseDown={() => setSelectedScheme(null)}>
            <section
              className="cd-modal"
              onMouseDown={(event) => event.stopPropagation()}
              style={{ maxWidth: 680, width: "100%", maxHeight: "90vh", overflowY: "auto" }}
            >
              <div className="cd-modal-top-glow" />
              <button
                type="button"
                className="cd-modal-close"
                onClick={() => setSelectedScheme(null)}
              >
                ×
              </button>

              <span className="cd-kicker">ACTIVE SERVICE POLICY</span>
              <h2>{selectedScheme.name}</h2>
              <p className="cd-modal-desc">{cleanSchemeDetail(selectedScheme.detail) || "Enrolled Scheme details and active progress pipeline."}</p>

              <div style={{ display: "grid", gridTemplateColumns: isMoreServiceScheme(selectedScheme) ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12, margin: "16px 0" }}>
                {!isMoreServiceScheme(selectedScheme) && (
                  <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--cd-border)" }}>
                    <span style={{ fontSize: 11, color: "var(--cd-muted)", display: "block" }}>Required Amount</span>
                    <strong style={{ fontSize: 15, color: "#4e7cff" }}>{selectedScheme.cover}</strong>
                  </div>
                )}
                <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--cd-border)" }}>
                  <span style={{ fontSize: 11, color: "var(--cd-muted)", display: "block" }}>Enrollment Date</span>
                  <strong style={{ fontSize: 14, color: "#38bdf8" }}>{selectedScheme.enrollmentDate || selectedScheme.startDate || selectedScheme.renewalDate || "1 Year Activation"}</strong>
                </div>
                <div style={{ background: "rgba(30, 41, 59, 0.5)", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--cd-border)" }}>
                  <span style={{ fontSize: 11, color: "var(--cd-muted)", display: "block" }}>App / Policy Ref</span>
                  <strong style={{ fontSize: 14, color: "#10b981" }}>{selectedScheme.policyNumber || "AGNI-2026-001"}</strong>
                </div>
              </div>

              {/* Active Milestone Tracker Pipeline for this Scheme */}
              <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "18px 16px", borderRadius: 14, border: "1px solid rgba(78, 124, 255, 0.3)", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f8fafc" }}>
                    Active Milestone Progress ({selectedScheme.name})
                  </h3>
                  <span className="cd-pill-badge" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                    {inspectTrackerState.progressPercent}% Complete
                  </span>
                </div>
                <ActivityTracker
                  scheme={selectedScheme.name}
                  completedSteps={inspectCompletedSteps}
                  progress={inspectTrackerState.progressPercent}
                  interactive={false}
                  showMeter={false}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="cd-modal-btn-secondary"
                  onClick={() => setSelectedScheme(null)}
                  style={{ padding: "8px 20px" }}
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        );
      })()}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {changePasswordOpen && (
        <div className="cd-modal-backdrop" onMouseDown={() => setChangePasswordOpen(false)}>
          <section
            className="cd-modal cd-modal-sm"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="cd-modal-top-glow" />
            <button
              type="button"
              className="cd-modal-close"
              onClick={() => {
                setChangePasswordOpen(false);
                setPasswordError("");
                setPasswordSuccess("");
                setNewPassword("");
                setConfirmPassword("");
              }}
            >
              ×
            </button>

            <span className="cd-kicker" style={{ marginBottom: 4, display: 'inline-block' }}>SECURITY & ACCESS</span>
            <h2>Change Password</h2>
            <p className="cd-modal-desc">Update your account credentials to keep your workspace secure.</p>

            {passwordSuccess ? (
              <div className="cd-request-success">
                <div className="cd-request-success-icon">
                  <DashboardIcon name="check" size={28} />
                </div>
                <h3>Password Updated!</h3>
                <p>{passwordSuccess}</p>
                <button
                  type="button"
                  className="cd-submit-btn"
                  onClick={() => {
                    setChangePasswordOpen(false);
                    setPasswordSuccess("");
                  }}
                  style={{ marginTop: 12 }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newPassword.length < 6) {
                    setPasswordError("Password must be at least 6 characters long.");
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setPasswordError("Passwords do not match.");
                    return;
                  }
                  setPasswordError("");
                  setPasswordSuccess("Your password has been changed successfully.");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="cd-modal-form"
              >
                {passwordError && (
                  <div style={{ padding: "8px 12px", background: "rgba(239, 68, 68, 0.12)", color: "#ef4444", borderRadius: 8, fontSize: 12.5 }}>
                    {passwordError}
                  </div>
                )}
                <div className="cd-form-group">
                  <label className="cd-form-label">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="cd-modal-select"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="cd-form-group">
                  <label className="cd-form-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="cd-modal-select"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
                <button type="submit" className="cd-submit-btn cd-submit-btn-glow">
                  <span>Update Password</span>
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
