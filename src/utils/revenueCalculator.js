/**
 * Revenue Calculation Engine for Agni CRM (Owner Dashboard)
 * Formula: Revenue = Math.round(Gross Amount Came / 1.18)
 * Strictly calculates metrics from database client data, payments, and invoices.
 * Aggregates collections across ALL salespeople from ALL branches (West, North, South, East).
 */

function parseDateTimestamp(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return dateInput.getTime();
  if (typeof dateInput === "number") return dateInput;

  if (typeof dateInput === "string") {
    const trimmed = dateInput.trim();
    if (!trimmed) return null;

    // Direct YYYY-MM-DD format handling to prevent timezone shifts
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split("-").map(Number);
      return new Date(y, m - 1, d).getTime();
    }

    const parsed = new Date(trimmed).getTime();
    if (!isNaN(parsed)) return parsed;
  }
  return null;
}

const safeString = (val, fallback = "") => {
  if (!val) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "object") {
    return val.fullName || val.name || val.companyName || val.company || val.branchName || val.email || fallback;
  }
  return String(val);
};

const MOCK_CLIENT_PATTERNS = [
  "bright retail",
  "urban foods",
  "nova textiles",
  "peak logistics",
  "crest pharma",
  "riverstone builders",
  "acme corp",
  "techsolutions",
  "nexus enterprises",
  "starlight industries",
  "zenith corp",
  "summit technologies",
  "horizon ventures",
  "vanguard tech",
  "eastern silk",
  "kalyan jewels",
  "kalyan crafts",
  "alpha logistics",
  "metro logistics",
  "green tech",
  "sharmaji@gmail.com",
];

export function isMockClient(c) {
  if (!c) return false;
  const str = (typeof c === "string" ? c : `${c.company || ""} ${c.name || ""} ${c.companyName || ""} ${c.clientName || ""} ${c.email || ""} ${c.clientEmail || ""}`).toLowerCase();
  return MOCK_CLIENT_PATTERNS.some((pattern) => str.includes(pattern));
}

export function calculateRevenueMetrics(clients = [], invoices = []) {
  const now = new Date();

  // Date boundaries based on current system local time
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  // Last 7 days (including today)
  const startOf7Days = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0).getTime();

  // Current Month (1st day of current month)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();

  // Previous Month
  const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0).getTime();
  const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();

  // Current Financial Year / Calendar Year (Jan 1 of current year)
  const startOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();

  // Salesperson & Branch breakdown maps
  const salesMap = new Map();
  const branchMap = new Map();

  const getSalesObj = (spName, branchName) => {
    const normName = safeString(spName, "Sales Representative").trim();
    const normBranch = safeString(branchName, "Pan-India").trim();

    if (!salesMap.has(normName)) {
      salesMap.set(normName, {
        name: normName,
        branch: normBranch || "Pan-India",
        dailyGross: 0,
        dailyNet: 0,
        weeklyGross: 0,
        weeklyNet: 0,
        monthlyGross: 0,
        monthlyNet: 0,
        prevMonthNet: 0,
        yearlyGross: 0,
        yearlyNet: 0,
        yearlySeries: new Array(12).fill(0),
        totalGross: 0,
        totalNet: 0,
        collectionsCount: 0,
      });
    }
    const obj = salesMap.get(normName);
    if (normBranch && (obj.branch === "Pan-India" || !obj.branch)) {
      obj.branch = normBranch;
    }
    return obj;
  };

  const getBranchObj = (bName) => {
    const normBranch = safeString(bName, "Pan-India").trim();
    if (!branchMap.has(normBranch)) {
      branchMap.set(normBranch, {
        name: normBranch,
        dailyNet: 0,
        weeklyNet: 0,
        monthlyNet: 0,
        yearlyNet: 0,
        totalNet: 0,
      });
    }
    return branchMap.get(normBranch);
  };

  let dailyGrossTotal = 0;
  let dailyNetTotal = 0;

  let weeklyGrossTotal = 0;
  let weeklyNetTotal = 0;

  let monthlyGrossTotal = 0;
  let monthlyNetTotal = 0;

  let yearlyGrossTotal = 0;
  let yearlyNetTotal = 0;

  let overallReceivedNetTotal = 0;
  let overallPendingNetTotal = 0;
  
  let dailyPendingNet = 0;
  let weeklyPendingNet = 0;
  let monthlyPendingNet = 0;
  let yearlyPendingNet = 0;

  const receivedClientsList = [];
  const pendingClientsList = [];

  const processCollection = (amountGross, dateInput, spName, branchName, clientOrInvName) => {
    if (isMockClient(clientOrInvName)) return;
    const gross = parseFloat(String(amountGross || 0).replace(/[^0-9.]/g, "")) || 0;
    if (gross <= 0) return;

    const timestamp = parseDateTimestamp(dateInput);

    // Formula: Net Revenue = Math.round(Gross Payment / 1.18)
    let net = Math.round(gross / 1.18);

    const sName = safeString(spName, "Sales Representative");
    const bName = safeString(branchName, "Pan-India");
    const cName = safeString(clientOrInvName, "Client Entity");

    const sp = getSalesObj(sName, bName);
    const br = getBranchObj(sp.branch || bName);

    sp.totalGross += gross;
    sp.totalNet += net;
    sp.collectionsCount += 1;

    br.totalNet += net;
    overallReceivedNetTotal += net;

    if (cName) {
      receivedClientsList.push({
        clientName: cName,
        salesPerson: sp.name,
        branch: sp.branch || bName,
        grossPaid: gross,
        netPaid: net,
        date: typeof dateInput === "string" ? dateInput : "Recorded",
      });
    }

    // Daily (Today)
    if (timestamp !== null && timestamp >= startOfToday && timestamp <= endOfToday) {
      dailyGrossTotal += gross;
      dailyNetTotal += net;
      sp.dailyGross += gross;
      sp.dailyNet += net;
      br.dailyNet += net;
    }

    // Weekly (Last 7 Days)
    if (timestamp !== null && timestamp >= startOf7Days && timestamp <= endOfToday) {
      weeklyGrossTotal += gross;
      weeklyNetTotal += net;
      sp.weeklyGross += gross;
      sp.weeklyNet += net;
      br.weeklyNet += net;
    }

    // Monthly (Current Month)
    if (timestamp !== null && timestamp >= startOfMonth && timestamp <= endOfToday) {
      monthlyGrossTotal += gross;
      monthlyNetTotal += net;
      sp.monthlyGross += gross;
      sp.monthlyNet += net;
      br.monthlyNet += net;
    }

    // Previous Month
    if (timestamp !== null && timestamp >= startOfPrevMonth && timestamp <= endOfPrevMonth) {
      sp.prevMonthNet += net;
      br.prevMonthNet += net;
    }

    // Yearly (Current Year)
    if (timestamp !== null && timestamp >= startOfYear && timestamp <= endOfToday) {
      yearlyGrossTotal += gross;
      yearlyNetTotal += net;
      sp.yearlyGross += gross;
      sp.yearlyNet += net;
      br.yearlyNet += net;

      const m = new Date(timestamp).getMonth();
      sp.yearlySeries[m] += net;
    }
  };

  const processPending = (netPending, dateInput) => {
    if (netPending <= 0) return;
    const timestamp = parseDateTimestamp(dateInput);
    if (timestamp !== null && timestamp >= startOfToday && timestamp <= endOfToday) {
      dailyPendingNet += netPending;
    }
    if (timestamp !== null && timestamp >= startOf7Days && timestamp <= endOfToday) {
      weeklyPendingNet += netPending;
    }
    if (timestamp !== null && timestamp >= startOfMonth && timestamp <= endOfToday) {
      monthlyPendingNet += netPending;
    }
    if (timestamp !== null && timestamp >= startOfYear && timestamp <= endOfToday) {
      yearlyPendingNet += netPending;
    }
  };



  // 2. Read clients list (from database props)
  const seenDedupe = new Set();
  const allClientsList = [...(clients || [])];

  allClientsList.forEach((c) => {
    if (!c || isMockClient(c)) return;
    const compName = safeString(c.company || c.name || c.companyName || c.email, "Client Entity");
    const schemeName = safeString(c.scheme || c.serviceName || c.serviceType, "PMEGP");
    const dedupeKey = `${compName.toLowerCase().trim()}::${schemeName.toLowerCase().trim()}`;
    if (seenDedupe.has(dedupeKey)) return;
    seenDedupe.add(dedupeKey);

    const totalPay = parseFloat(String(c.totalPayment || c.amount || 0).replace(/[^0-9.]/g, "")) || 0;
    const rec = parseFloat(String(c.paymentReceived || (c.paymentStatus === "Paid" ? totalPay : 0) || 0).replace(/[^0-9.]/g, "")) || 0;
    const pendingGross = Math.max(0, totalPay - rec);

    const sp = safeString(c.assignedSalesPerson || c.salesPerson || c.owner, "Rohan Gupta");
    const br = safeString(c.branch, "North Zone (Delhi)");
    const dt = c.startDate || c.onboarding || c.onboardingDate || c.createdAt || c.date || c.registrationDate || c.submissionDate || c.lastUpdated || c.updatedAt || c.serviceStart;

    if (rec > 0) {
      processCollection(rec, dt, sp, br, compName);
    }

    if (pendingGross > 0 && c.paymentStatus !== "Paid") {
      const netPending = Math.round(pendingGross / 1.18);
      overallPendingNetTotal += netPending;
      processPending(netPending, dt);

      pendingClientsList.push({
        clientName: safeString(c.name || c.company || c.companyName, "Client Account"),
        company: compName,
        salesPerson: sp,
        branch: br,
        totalDeal: totalPay,
        paidGross: rec,
        pendingGross: pendingGross,
        pendingNet: netPending,
        isTokenPaid: rec > 0, // Client paid token/partial amount but has remaining dues
      });
    }
  });

  // 3. Process invoices from database props & localStorage
  (invoices || []).forEach((inv) => {
    if (!inv) return;
    const status = (inv.status || inv.paymentStatus || "").toLowerCase();
    const gross = parseFloat(String(inv.rawTotal || inv.totalAmount || inv.rawAmount || inv.amount || 0).replace(/[^0-9.]/g, "")) || 0;
    const sp = safeString(inv.accountManager || inv.salesPerson, "Account Manager");
    const br = safeString(inv.branch || inv.region, "West Zone (Mumbai)");
    const dt = inv.issueDate || inv.paidAt || inv.createdAt;

    if (status === "paid") {
      processCollection(gross, dt, sp, br, safeString(inv.company || inv.clientName, "Invoice"));
    } else if (gross > 0) {
      const netPending = Math.round(gross / 1.18);
      overallPendingNetTotal += netPending;
      processPending(netPending, dt);

      pendingClientsList.push({
        clientName: safeString(inv.clientName || inv.company, "Invoice Dues"),
        company: safeString(inv.company || inv.clientName, "Billed Entity"),
        salesPerson: sp,
        branch: br,
        totalDeal: gross,
        paidGross: 0,
        pendingGross: gross,
        pendingNet: netPending,
        isTokenPaid: false,
      });
    }
  });

  // Yearly Revenue should reflect total annual operational total (matching overallReceivedNetTotal)
  const resolvedYearlyNet = Math.max(yearlyNetTotal, overallReceivedNetTotal);

  return {
    dailyNet: dailyNetTotal,
    weeklyNet: weeklyNetTotal,
    monthlyNet: monthlyNetTotal,
    yearlyNet: resolvedYearlyNet,
    totalReceivedNet: overallReceivedNetTotal,
    
    dailyPendingNet,
    weeklyPendingNet,
    monthlyPendingNet,
    yearlyPendingNet,
    totalPendingNet: overallPendingNetTotal,

    salespeopleBreakdown: Array.from(salesMap.values()),
    branchesBreakdown: Array.from(branchMap.values()),
    pendingClientsList: pendingClientsList,
    receivedClientsList: receivedClientsList,
  };
}
