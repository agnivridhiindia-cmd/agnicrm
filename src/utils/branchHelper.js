/**
 * Branch & Client Helper Utilities for Agni CRM
 */

export function normalizeSalesPersonName(rawName) {
  if (!rawName || typeof rawName !== "string") return "Mia Rose";
  const trimmed = rawName.trim();
  if (!trimmed || trimmed.toLowerCase() === "unassigned" || trimmed.toLowerCase() === "unknown") {
    return "Mia Rose";
  }
  return trimmed;
}

export function getManagerBranchDetails(emailOrName = "") {
  const str = String(emailOrName || "").toLowerCase().trim();

  let managerName = "Eli Brooks";
  let branchManagerName = "Ariana Lee";
  let branchName = "West Zone (Mumbai)";
  let region = "West Zone";
  let code = "BR-01";

  if (str.includes("north") || str.includes("delhi") || str.includes("br-02") || str.includes("nz")) {
    managerName = "Devanshi Varma";
    branchManagerName = "Rajesh Sharma";
    branchName = "North Zone (Delhi)";
    region = "North Zone";
    code = "BR-02";
  } else if (str.includes("south") || str.includes("bangalore") || str.includes("br-03") || str.includes("sz")) {
    managerName = "Siddharth Rao";
    branchManagerName = "Priya Nair";
    branchName = "South Zone (Bangalore)";
    region = "South Zone";
    code = "BR-03";
  } else if (str.includes("east") || str.includes("kolkata") || str.includes("br-04") || str.includes("ez")) {
    managerName = "Ananya Sen";
    branchManagerName = "Subhash Chandra";
    branchName = "East Zone (Kolkata)";
    region = "East Zone";
    code = "BR-04";
  }

  return {
    managerName,
    branchManagerName,
    branchName,
    branch: branchName,
    region,
    code,
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
  const salesRep = normalizeSalesPersonName(c.salesPerson?.fullName || c.salesRep || c.owner || c.assignedSalesPerson);

  const rawTot = Number(c.totalPayment || c.amount || c.invoices?.[0]?.rawTotal || c.fundingRequirement || 0);
  const totalPayment = rawTot === 0 && !c.isPrimary ? 118000 : rawTot;
  const rawRec = Math.max(Number(c.paymentReceived || 0), Number(c.invoices?.[0]?.paymentReceived || 0));
  const paymentReceived = (rawRec === 0 && (c.paymentStatus === "Paid" || c.approvalStatus === "ACTIVE")) ? totalPayment : rawRec;
  const paymentPending = Math.max(0, totalPayment - paymentReceived);

  return {
    ...c,
    id: c.id || c.appId || `client-${Date.now()}`,
    appId: c.appId || `APP-WZ-${new Date().getFullYear()}-001`,
    name,
    company,
    contactPerson,
    email,
    phone,
    branch: c.branch?.name || c.branch || "West Zone (Mumbai)",
    region: c.branch?.region || c.region || "West Zone",
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
