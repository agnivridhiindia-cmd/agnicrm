/**
 * Branch & Client Helper Utilities for Agni CRM
 */

export function normalizeSalesPersonName(rawName) {
  if (!rawName || typeof rawName !== "string") return "Sales Representative";
  const trimmed = rawName.trim();
  if (!trimmed || trimmed.toLowerCase() === "unassigned" || trimmed.toLowerCase() === "unknown") {
    return "Sales Representative";
  }
  return trimmed;
}

export function getManagerBranchDetails(emailOrName = "") {
  const str = String(emailOrName || "").toLowerCase().trim();

  // 1. North Zone (Delhi)
  if (
    str.includes("ananya") ||
    str.includes("rajesh") ||
    str.includes("rohan") ||
    str.includes("kavya") ||
    str.includes("arjun") ||
    str.includes("delhi") ||
    str.includes("north") ||
    str.includes("br-02") ||
    str.includes("nz")
  ) {
    return {
      managerName: "Ananya Sen",
      managerEmail: "ananya.sm@agni.com",
      branchManagerName: "Rajesh Khanna",
      branchManagerEmail: "rajesh.bm@agni.com",
      branchName: "North Zone (Delhi)",
      branch: "North Zone (Delhi)",
      region: "North Zone",
      code: "BR-02",
      branchCode: "BR-02",
      salespersons: ["Rohan Gupta", "Kavya Sharma", "Arjun Hegde"],
      salesEmails: ["rohan.sales@agni.com", "kavya.sales@agni.com", "arjun.sales@agni.com"],
    };
  }

  // 2. South Zone (Bengaluru)
  if (
    str.includes("karthik") ||
    str.includes("suresh") ||
    str.includes("deepa") ||
    str.includes("south") ||
    str.includes("bengaluru") ||
    str.includes("bangalore") ||
    str.includes("br-03") ||
    str.includes("sz")
  ) {
    return {
      managerName: "Karthik Iyer",
      managerEmail: "karthik.sm@agni.com",
      branchManagerName: "Suresh Reddy",
      branchManagerEmail: "suresh.bm@agni.com",
      branchName: "South Zone (Bengaluru)",
      branch: "South Zone (Bengaluru)",
      region: "South Zone",
      code: "BR-03",
      branchCode: "BR-03",
      salespersons: ["Deepa Rao"],
      salesEmails: ["deepa.sales@agni.com"],
    };
  }

  // 3. East Zone (Kolkata)
  if (
    str.includes("debolina") ||
    str.includes("subhash") ||
    str.includes("sourav") ||
    str.includes("riya") ||
    str.includes("east") ||
    str.includes("kolkata") ||
    str.includes("calcutta") ||
    str.includes("br-04") ||
    str.includes("ez")
  ) {
    return {
      managerName: "Debolina Roy",
      managerEmail: "debolina.sm@agni.com",
      branchManagerName: "Subhash Banerjee",
      branchManagerEmail: "subhash.bm@agni.com",
      branchName: "East Zone (Kolkata)",
      branch: "East Zone (Kolkata)",
      region: "East Zone",
      code: "BR-04",
      branchCode: "BR-04",
      salespersons: ["Sourav Das", "Riya Mukherjee"],
      salesEmails: ["sourav.sales@agni.com", "riya.sales@agni.com"],
    };
  }

  // 4. West Zone (Mumbai) - Default fallback
  return {
    managerName: "Eli Brooks",
    managerEmail: "eli@agni.com",
    branchManagerName: "Ariana Lee",
    branchManagerEmail: "ariana@agni.com",
    branchName: "West Zone (Mumbai)",
    branch: "West Zone (Mumbai)",
    region: "West Zone",
    code: "BR-01",
    branchCode: "BR-01",
    salespersons: ["Mia Rose", "Lucas Scott"],
    salesEmails: ["mia@agni.com", "lucas@agni.com"],
  };
}

export function sanitizeClientRecord(c = {}) {
  if (!c) return {};

  const name = c.name || c.clientName || c.companyName || c.company || "Client Account";
  const company = c.companyName || c.company || c.name || name;
  const contactPerson = c.contactPerson || c.representativeName || name;
  const email = c.email || c.clientEmail || "";
  const phone = c.phone || c.contactNumber || "+91 98765 43210";
  const scheme = c.serviceName || c.scheme || c.serviceType || "PMEGP";
  const serviceType = c.serviceType || "CONSULTANCY";
  const rawRep = c.salesPerson?.fullName || c.salesRep || c.owner || c.assignedSalesPerson || "";
  const salesRep = rawRep ? normalizeSalesPersonName(rawRep) : "Sales Representative";

  const rawTot = Number(c.totalPayment || c.amount || c.invoices?.[0]?.rawTotal || c.fundingRequirement || 0);
  const totalPayment = rawTot === 0 && !c.isPrimary ? 118000 : rawTot;
  const rawRec = Math.max(Number(c.paymentReceived || 0), Number(c.invoices?.[0]?.paymentReceived || 0));
  const paymentReceived = (rawRec === 0 && (c.paymentStatus === "Paid" || c.approvalStatus === "ACTIVE")) ? totalPayment : rawRec;
  const paymentPending = Math.max(0, totalPayment - paymentReceived);

  const branchLookup = c.branch?.name || c.branch || salesRep || c.salesPerson?.email || email || "";
  const branchDetails = getManagerBranchDetails(branchLookup);

  return {
    ...c,
    id: c.id || c.appId || `client-${Date.now()}`,
    appId: c.appId || `APP-${branchDetails.code ? branchDetails.code.replace('BR-', '') : '01'}-${new Date().getFullYear()}-001`,
    name,
    company,
    contactPerson,
    email,
    phone,
    branch: c.branch?.name || c.branch || branchDetails.branchName,
    region: c.branch?.region || c.region || branchDetails.region,
    scheme,
    serviceType,
    salesRep,
    assignedSalesPerson: salesRep,
    applicationStatus: c.applicationStatus || "CRM Creation",
    completedSteps: Array.isArray(c.completedSteps) ? c.completedSteps : ["CRM Creation"],
    documentStatus: c.documentStatus || "NOT_SUBMITTED",
    approvalStatus: c.approvalStatus || "ACTIVE",
    totalPayment,
    paymentReceived,
    paymentPending,
  };
}

const ROLE_RANKING = {
  OWNER: 1,
  ADMIN: 2,
  BRANCH_MANAGER: 3,
  MANAGER: 4,
  SALES_PERSON: 5,
  IT: 6,
  MARKETING: 7,
  CLIENT: 8,
};

export function sortByRoleRanking(users = []) {
  if (!Array.isArray(users)) return [];
  return [...users].sort((a, b) => {
    const rankA = ROLE_RANKING[a.role?.toUpperCase()] || 99;
    const rankB = ROLE_RANKING[b.role?.toUpperCase()] || 99;
    return rankA - rankB;
  });
}

export function mergeSecondaryClients(primaryList = [], secondaryList = []) {
  if (!Array.isArray(primaryList)) return [];
  if (!Array.isArray(secondaryList) || secondaryList.length === 0) return primaryList;

  const map = new Map();
  primaryList.forEach((item) => {
    const key = (item.email || item.id || "").toLowerCase();
    if (key) map.set(key, { ...item, secondarySchemes: [] });
  });

  secondaryList.forEach((sec) => {
    const key = (sec.email || "").toLowerCase();
    if (map.has(key)) {
      const primary = map.get(key);
      primary.secondarySchemes.push(sec);
    }
  });

  return Array.from(map.values());
}

export function isBranchMatch(branchA = "", branchB = "") {
  if (!branchA || !branchB) return true;
  const a = String(branchA).toLowerCase().trim();
  const b = String(branchB).toLowerCase().trim();
  return a === b || a.includes(b) || b.includes(a);
}

export function repairPendingClientCreations() {
  return [];
}
