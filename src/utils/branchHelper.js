/**
 * Branch & Team Hierarchy Utilities for Agni CRM
 * Dynamically resolves Sales Representatives, Sales Managers, and Branches directly from the PostgreSQL Database.
 */

import { apiFetch } from "../services/apiClient";

let dynamicHierarchyCache = null;
let hierarchySyncPromise = null;

// Seed initial memory cache from localStorage if available
if (typeof window !== "undefined" && window.localStorage) {
  try {
    const saved = localStorage.getItem("agni_db_team_hierarchy");
    if (saved) {
      dynamicHierarchyCache = JSON.parse(saved);
    }
  } catch (e) {}
}

/**
 * Fetch and sync complete branch team hierarchy directly from PostgreSQL database:
 * GET /api/v1/employees/hierarchy
 */
export async function syncTeamHierarchyFromDB() {
  if (hierarchySyncPromise) return hierarchySyncPromise;

  hierarchySyncPromise = (async () => {
    try {
      const response = await apiFetch("/employees/hierarchy");
      if (response && response.ok) {
        const json = await response.json();
        const data = json.hierarchy || json.data;
        if (Array.isArray(data) && data.length > 0) {
          dynamicHierarchyCache = data;
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.setItem("agni_db_team_hierarchy", JSON.stringify(data));
          }
          return data;
        }
      }
    } catch (err) {
      console.warn("Could not sync team hierarchy from DB:", err);
    } finally {
      hierarchySyncPromise = null;
    }
    return dynamicHierarchyCache;
  })();

  return hierarchySyncPromise;
}

// Trigger initial background sync
if (typeof window !== "undefined") {
  syncTeamHierarchyFromDB();
}

export function getCachedHierarchy() {
  if (dynamicHierarchyCache && Array.isArray(dynamicHierarchyCache) && dynamicHierarchyCache.length > 0) {
    return dynamicHierarchyCache;
  }
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const saved = localStorage.getItem("agni_db_team_hierarchy");
      if (saved) {
        dynamicHierarchyCache = JSON.parse(saved);
        return dynamicHierarchyCache;
      }
    } catch (e) {}
  }
  return null;
}

export function normalizeSalesPersonName(rawName) {
  if (!rawName || typeof rawName !== "string") return "Sales Representative";
  const trimmed = rawName.trim();
  if (!trimmed || trimmed.toLowerCase() === "unassigned" || trimmed.toLowerCase() === "unknown") {
    return "Sales Representative";
  }
  return trimmed;
}

/**
 * Dynamically resolves branch and manager details for a salesperson, manager, or branch identifier.
 * Checks the live database hierarchy first, falling back to database seed defaults if offline.
 */
export function getManagerBranchDetails(emailOrName = "") {
  const str = String(emailOrName || "").toLowerCase().trim();
  const hierarchyList = getCachedHierarchy();

  if (Array.isArray(hierarchyList) && hierarchyList.length > 0) {
    // 0. Check if emailOrName matches any user, employee, or admin in any branch directly
    for (const b of hierarchyList) {
      const allMembers = [
        ...(b.users || []),
        ...(b.admins || []),
        ...(b.salesPersons || []),
        b.salesManager,
        b.branchManager,
        b.adminLead,
      ].filter(Boolean);

      const matchedMember = allMembers.find((m) => {
        const mEmail = (m.email || "").toLowerCase().trim();
        const mName = (m.name || m.fullName || "").toLowerCase().trim();
        return (
          str &&
          ((mEmail && (mEmail === str || (str.length > 4 && mEmail.includes(str)))) ||
           (mName && (mName === str || (mName.length > 3 && str.includes(mName)))))
        );
      });

      if (matchedMember) {
        return {
          managerName: b.salesManager?.name || b.salesManager?.fullName || "Eli Brooks",
          managerEmail: b.salesManager?.email || "eli@agni.com",
          managerPhone: b.salesManager?.phone || "+91 91234 00222",
          branchManagerName: b.branchManager?.name || b.branchManager?.fullName || "",
          branchManagerEmail: b.branchManager?.email || "",
          branchName: b.name,
          branch: b.name,
          region: b.region,
          code: b.code,
          branchCode: b.code,
          salespersons: (b.salesPersons || []).map((s) => s.name || s.fullName),
          salesEmails: (b.salesPersons || []).map((s) => s.email),
        };
      }
    }

    // 1. Check if emailOrName matches a salesperson in any branch
    for (const b of hierarchyList) {
      const matchedSalesPerson = (b.salesPersons || []).find((s) => {
        const sName = (s.name || s.fullName || "").toLowerCase().trim();
        const sEmail = (s.email || "").toLowerCase().trim();
        return (
          str &&
          ((sName && (sName === str || sName.includes(str) || (str.length > 3 && str.includes(sName)))) ||
           (sEmail && (sEmail === str || (str.length > 4 && sEmail.includes(str)))))
        );
      });

      if (matchedSalesPerson) {
        const mgr = matchedSalesPerson.reportingManager || b.salesManager;
        return {
          managerName: mgr?.name || mgr?.fullName || "Eli Brooks",
          managerEmail: mgr?.email || "eli@agni.com",
          managerPhone: mgr?.phone || "+91 91234 00222",
          branchManagerName: b.branchManager?.name || "",
          branchManagerEmail: b.branchManager?.email || "",
          branchName: b.name,
          branch: b.name,
          region: b.region,
          code: b.code,
          branchCode: b.code,
          salespersons: (b.salesPersons || []).map((s) => s.name || s.fullName),
          salesEmails: (b.salesPersons || []).map((s) => s.email),
        };
      }
    }

    // 2. Check if emailOrName matches a sales manager
    for (const b of hierarchyList) {
      const smName = (b.salesManager?.name || b.salesManager?.fullName || "").toLowerCase().trim();
      const smEmail = (b.salesManager?.email || "").toLowerCase().trim();
      if (
        str &&
        ((smName && (smName === str || smName.includes(str) || (str.length > 3 && str.includes(smName)))) ||
         (smEmail && (smEmail === str || (str.length > 4 && smEmail.includes(str)))))
      ) {
        return {
          managerName: b.salesManager?.name || b.salesManager?.fullName || "Eli Brooks",
          managerEmail: b.salesManager?.email || "eli@agni.com",
          managerPhone: b.salesManager?.phone || "+91 91234 00222",
          branchManagerName: b.branchManager?.name || "",
          branchManagerEmail: b.branchManager?.email || "",
          branchName: b.name,
          branch: b.name,
          region: b.region,
          code: b.code,
          branchCode: b.code,
          salespersons: (b.salesPersons || []).map((s) => s.name || s.fullName),
          salesEmails: (b.salesPersons || []).map((s) => s.email),
        };
      }
    }

    // 3. Check if emailOrName matches branch manager
    for (const b of hierarchyList) {
      const bmName = (b.branchManager?.name || b.branchManager?.fullName || "").toLowerCase().trim();
      const bmEmail = (b.branchManager?.email || "").toLowerCase().trim();
      if (
        str &&
        ((bmName && (bmName === str || bmName.includes(str) || (str.length > 3 && str.includes(bmName)))) ||
         (bmEmail && (bmEmail === str || (str.length > 4 && bmEmail.includes(str)))))
      ) {
        return {
          managerName: b.salesManager?.name || b.salesManager?.fullName || "Eli Brooks",
          managerEmail: b.salesManager?.email || "eli@agni.com",
          managerPhone: b.salesManager?.phone || "+91 91234 00222",
          branchManagerName: b.branchManager?.name || "",
          branchManagerEmail: b.branchManager?.email || "",
          branchName: b.name,
          branch: b.name,
          region: b.region,
          code: b.code,
          branchCode: b.code,
          salespersons: (b.salesPersons || []).map((s) => s.name || s.fullName),
          salesEmails: (b.salesPersons || []).map((s) => s.email),
        };
      }
    }

    // 4. Check if emailOrName matches branch name, code, region, or city
    for (const b of hierarchyList) {
      const bName = (b.name || "").toLowerCase().trim();
      const bCode = (b.code || "").toLowerCase().trim();
      const bRegion = (b.region || "").toLowerCase().trim();
      const bCity = (b.city || "").toLowerCase().trim();
      if (
        str &&
        ((bName && (bName.includes(str) || (str.length > 3 && str.includes(bName)))) ||
         (bCode && (bCode === str || (str.length > 2 && str.includes(bCode)))) ||
         (bRegion && (bRegion.includes(str) || (str.length > 3 && str.includes(bRegion)))) ||
         (bCity && (bCity.includes(str) || (str.length > 3 && str.includes(bCity)))))
      ) {
        return {
          managerName: b.salesManager?.name || b.salesManager?.fullName || "Eli Brooks",
          managerEmail: b.salesManager?.email || "eli@agni.com",
          managerPhone: b.salesManager?.phone || "+91 91234 00222",
          branchManagerName: b.branchManager?.name || "",
          branchManagerEmail: b.branchManager?.email || "",
          branchName: b.name,
          branch: b.name,
          region: b.region,
          code: b.code,
          branchCode: b.code,
          salespersons: (b.salesPersons || []).map((s) => s.name || s.fullName),
          salesEmails: (b.salesPersons || []).map((s) => s.email),
        };
      }
    }

    // If query string didn't match, return West Zone (default branch) from DB hierarchy
    const defaultBranch = hierarchyList.find((b) => (b.code === "BR-01" || b.name?.includes("West"))) || hierarchyList[0];
    if (defaultBranch) {
      return {
        managerName: defaultBranch.salesManager?.name || defaultBranch.salesManager?.fullName || "Eli Brooks",
        managerEmail: defaultBranch.salesManager?.email || "eli@agni.com",
        managerPhone: defaultBranch.salesManager?.phone || "+91 91234 00222",
        branchManagerName: defaultBranch.branchManager?.name || "",
        branchManagerEmail: defaultBranch.branchManager?.email || "",
        branchName: defaultBranch.name,
        branch: defaultBranch.name,
        region: defaultBranch.region,
        code: defaultBranch.code,
        branchCode: defaultBranch.code,
        salespersons: (defaultBranch.salesPersons || []).map((s) => s.name || s.fullName),
        salesEmails: (defaultBranch.salesPersons || []).map((s) => s.email),
      };
    }
  }

  // Fallback defaults matching PostgreSQL seed schema when offline or initial load
  // 1. West Zone (Mumbai) - Eli Brooks
  if (
    str.includes("eli") ||
    str.includes("ellie") ||
    str.includes("brooks") ||
    str.includes("brook") ||
    str.includes("lucas") ||
    str.includes("mia") ||
    str.includes("ariana") ||
    str.includes("mumbai") ||
    str.includes("west") ||
    str.includes("br-01") ||
    str.includes("wz")
  ) {
    return {
      managerName: "Eli Brooks",
      managerEmail: "eli@agni.com",
      managerPhone: "+91 91234 00222",
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

  // 2. North Zone (Delhi) - Ananya Sen
  if (
    str.includes("ananya") ||
    str.includes("rajesh") ||
    str.includes("rohan") ||
    str.includes("kavya") ||
    str.includes("delhi") ||
    str.includes("north") ||
    str.includes("br-02") ||
    str.includes("nz") ||
    str.includes("anmol")
  ) {
    return {
      managerName: "Ananya Sen",
      managerEmail: "ananya.sm@agni.com",
      managerPhone: "+91 98111 22335",
      branchManagerName: "Rajesh Khanna",
      branchManagerEmail: "rajesh.bm@agni.com",
      branchName: "North Zone (Delhi)",
      branch: "North Zone (Delhi)",
      region: "North Zone",
      code: "BR-02",
      branchCode: "BR-02",
      salespersons: ["Rohan Gupta", "Kavya Sharma"],
      salesEmails: ["rohan.sales@agni.com", "kavya.sales@agni.com"],
    };
  }

  // 3. South Zone (Bengaluru) - Karthik Iyer
  if (
    str.includes("karthik") ||
    str.includes("suresh") ||
    str.includes("deepa") ||
    str.includes("arjun") ||
    str.includes("south") ||
    str.includes("bengaluru") ||
    str.includes("bangalore") ||
    str.includes("br-03") ||
    str.includes("sz")
  ) {
    return {
      managerName: "Karthik Iyer",
      managerEmail: "karthik.sm@agni.com",
      managerPhone: "+91 98450 22233",
      branchManagerName: "Suresh Reddy",
      branchManagerEmail: "suresh.bm@agni.com",
      branchName: "South Zone (Bengaluru)",
      branch: "South Zone (Bengaluru)",
      region: "South Zone",
      code: "BR-03",
      branchCode: "BR-03",
      salespersons: ["Arjun Hegde", "Deepa Rao"],
      salesEmails: ["arjun.sales@agni.com", "deepa.sales@agni.com"],
    };
  }

  // 4. East Zone (Kolkata) - Debolina Roy
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
      managerPhone: "+91 98300 44557",
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

  // Universal Default: West Zone (Mumbai)
  return {
    managerName: "Eli Brooks",
    managerEmail: "eli@agni.com",
    managerPhone: "+91 91234 00222",
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

  // Sales rep or branch lookup from database hierarchy
  const branchLookup = (salesRep && salesRep !== "Sales Representative")
    ? salesRep
    : (c.branch?.name || c.branch || c.salesPerson?.email || email || "");
  const branchDetails = getManagerBranchDetails(branchLookup);

  // Prioritize values if they were directly populated from PostgreSQL
  const resolvedBranch = c.branch?.name || (typeof c.branch === "string" ? c.branch : "") || branchDetails.branchName;
  const resolvedRegion = c.branch?.region || c.region || branchDetails.region;
  const resolvedSalesManager = c.salesManager || branchDetails.managerName;
  const resolvedSalesManagerEmail = c.salesManagerEmail || branchDetails.managerEmail;

  return {
    ...c,
    id: c.id || c.appId || `client-${Date.now()}`,
    appId: c.appId || `CRM-${new Date().getFullYear()}-001`,
    name,
    company,
    contactPerson,
    email,
    phone,
    branch: resolvedBranch,
    region: resolvedRegion,
    salesManager: resolvedSalesManager,
    salesManagerEmail: resolvedSalesManagerEmail,
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

export function repairClientStorageData() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const keys = ["agni_sales_clients", "agni_branch_clients"];
    keys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const list = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      let changed = false;
      const fixed = list.map((c) => {
        const rep = (c.assignedSalesPerson || c.salesRep || c.salesPerson || c.owner || "").trim();
        if (rep && rep !== "Sales Representative") {
          const details = getManagerBranchDetails(rep);
          if (details && details.managerName && c.salesManager !== details.managerName) {
            changed = true;
            return {
              ...c,
              salesManager: details.managerName,
              salesManagerEmail: details.managerEmail,
              branch: details.branchName,
              branchCode: details.code,
              region: details.region,
            };
          }
        }
        return c;
      });
      if (changed) {
        localStorage.setItem(key, JSON.stringify(fixed));
      }
    });
  } catch (e) {}
}

export function repairPendingClientCreations() {
  repairClientStorageData();
  return [];
}
