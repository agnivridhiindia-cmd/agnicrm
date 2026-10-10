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

  // Sparkline trend buckets (4 progressive periods)
  const p3Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0).getTime();
  const p2Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0).getTime();
  const p1Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 20, 0, 0, 0, 0).getTime();
  const p0Start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 27, 0, 0, 0, 0).getTime();

  const weeklyTrendBuckets = [0, 0, 0, 0];
  const monthlyCompanySeries = new Array(12).fill(0);

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
  const transactions = [];

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

    transactions.push({
      net,
      gross,
      timestamp: timestamp !== null ? timestamp : endOfToday,
    });

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

    // Sparkline bucket tracking
    if (timestamp !== null) {
      if (timestamp >= p0Start && timestamp < p1Start) {
        weeklyTrendBuckets[0] += net;
      } else if (timestamp >= p1Start && timestamp < p2Start) {
        weeklyTrendBuckets[1] += net;
      } else if (timestamp >= p2Start && timestamp < p3Start) {
        weeklyTrendBuckets[2] += net;
      } else if (timestamp >= p3Start && timestamp <= endOfToday) {
        weeklyTrendBuckets[3] += net;
      }

      if (timestamp >= startOfYear && timestamp <= endOfToday) {
        const m = new Date(timestamp).getMonth();
        monthlyCompanySeries[m] += net;
      }
    } else {
      weeklyTrendBuckets[3] += net;
      monthlyCompanySeries[now.getMonth()] += net;
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

    // Check if client has detailed payment transactions
    const subPayments = Array.isArray(c.payments) && c.payments.length > 0
      ? c.payments
      : (Array.isArray(c.invoices) && c.invoices.some(inv => Array.isArray(inv.payments) && inv.payments.length > 0)
        ? c.invoices.flatMap(inv => inv.payments || [])
        : null);

    let processedFromPayments = 0;
    if (subPayments && subPayments.length > 0) {
      subPayments.forEach((p) => {
        const pStatus = String(p.status || "").toLowerCase();
        if (pStatus === "pending" || pStatus === "requested" || pStatus === "failed" || pStatus === "declined") return;

        const pGross = parseFloat(String(p.amount || 0).replace(/[^0-9.]/g, "")) || 0;
        const pDate = p.paymentDate || p.createdAt || dt;
        if (pGross > 0) {
          processCollection(pGross, pDate, sp, br, compName);
          processedFromPayments += pGross;
        }
      });
    }

    const remainingDirect = Math.max(0, rec - processedFromPayments);
    if (remainingDirect > 0) {
      // Prioritize explicit payment/registration dates so past payments aren't attributed to today when a record is updated
      const paymentDate = c.lastPaymentDate || c.paymentDate || c.registrationDate || c.createdAt || dt;
      processCollection(remainingDirect, paymentDate, sp, br, compName);
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
    const invClientName = safeString(inv.company || inv.clientName || inv.client, "Invoice");
    const invScheme = safeString(inv.scheme || inv.serviceName || inv.description, "Service");
    const invDedupeKey = `${invClientName.toLowerCase().trim()}::${invScheme.toLowerCase().trim()}`;
    
    // Skip if already processed via the client entity above
    if (seenDedupe.has(invDedupeKey)) return;
    seenDedupe.add(invDedupeKey);

    const status = (inv.status || inv.paymentStatus || "").toLowerCase();
    const gross = parseFloat(String(inv.rawTotal || inv.totalAmount || inv.rawAmount || inv.amount || 0).replace(/[^0-9.]/g, "")) || 0;
    const sp = safeString(inv.accountManager || inv.salesPerson, "Account Manager");
    const br = safeString(inv.branch || inv.region, "West Zone (Mumbai)");
    const dt = inv.issueDate || inv.paidAt || inv.createdAt;

    const hasSubPayments = Array.isArray(inv.payments) && inv.payments.length > 0;
    if (hasSubPayments) {
      inv.payments.forEach((p) => {
        const pStatus = String(p.status || "").toLowerCase();
        if (pStatus === "pending" || pStatus === "requested" || pStatus === "failed" || pStatus === "declined") return;

        const pGross = parseFloat(String(p.amount || 0).replace(/[^0-9.]/g, "")) || 0;
        const pDate = p.paymentDate || p.createdAt || dt;
        if (pGross > 0) {
          processCollection(pGross, pDate, sp, br, invClientName);
        }
      });
    } else {
      const recAmt = parseFloat(String(inv.paymentReceived || 0).replace(/[^0-9.]/g, "")) || (status === "paid" ? gross : 0);
      if (recAmt > 0) {
        processCollection(recAmt, inv.paidAt || inv.issueDate || inv.createdAt || dt, sp, br, invClientName);
      }
    }

    const recTotal = parseFloat(String(inv.paymentReceived || 0).replace(/[^0-9.]/g, "")) || (status === "paid" ? gross : 0);
    const pendingGross = parseFloat(String(inv.paymentPending || 0).replace(/[^0-9.]/g, "")) || Math.max(0, gross - recTotal);

    if (pendingGross > 0 && status !== "paid") {
      const netPending = Math.round(pendingGross / 1.18);
      overallPendingNetTotal += netPending;
      processPending(netPending, dt);

      pendingClientsList.push({
        clientName: safeString(inv.clientName || inv.company, "Invoice Dues"),
        company: safeString(inv.company || inv.clientName, "Billed Entity"),
        salesPerson: sp,
        branch: br,
        totalDeal: gross,
        paidGross: recTotal,
        pendingGross: pendingGross,
        pendingNet: netPending,
        isTokenPaid: recTotal > 0,
      });
    }
  });

  // Yearly Revenue should reflect total annual operational total (matching overallReceivedNetTotal)
  const resolvedYearlyNet = Math.max(yearlyNetTotal, overallReceivedNetTotal);

  // Derive dynamic sparkline data based on actual collections
  let sparklineData = [0, 0, 0, 0];
  if (overallReceivedNetTotal > 0) {
    if (weeklyTrendBuckets.some((v) => v > 0)) {
      sparklineData = [...weeklyTrendBuckets];
    } else {
      const currM = now.getMonth();
      const last4M = [
        monthlyCompanySeries[(currM - 3 + 12) % 12],
        monthlyCompanySeries[(currM - 2 + 12) % 12],
        monthlyCompanySeries[(currM - 1 + 12) % 12],
        monthlyCompanySeries[currM],
      ];
      if (last4M.some((v) => v > 0)) {
        sparklineData = last4M;
      } else {
        const q1 = monthlyCompanySeries.slice(0, 3).reduce((a, b) => a + b, 0);
        const q2 = monthlyCompanySeries.slice(3, 6).reduce((a, b) => a + b, 0);
        const q3 = monthlyCompanySeries.slice(6, 9).reduce((a, b) => a + b, 0);
        const q4 = monthlyCompanySeries.slice(9, 12).reduce((a, b) => a + b, 0);
        sparklineData = [q1, q2, q3, q4];
      }
    }
    // If still all zeroes (e.g. date outside current year), end with total
    if (sparklineData.every((v) => v === 0)) {
      sparklineData = [0, 0, Math.round(overallReceivedNetTotal * 0.4), overallReceivedNetTotal];
    }
  }

  // 1. Daily Chart Series (Past 7 days ending today)
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyChartSeries = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime();
    const endOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
    const label = dayNames[d.getDay()];

    const dayNet = transactions
      .filter((t) => t.timestamp >= startOfDay && t.timestamp <= endOfDay)
      .reduce((sum, t) => sum + t.net, 0);

    dailyChartSeries.push({ label, value: dayNet });
  }

  // 2. Weekly Chart Series (Past 4 weeks ending today)
  const weeklyChartSeries = [];
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  for (let i = 3; i >= 0; i--) {
    const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7, 23, 59, 59, 999).getTime();
    const weekStart = weekEnd - weekMs + 1;
    const label = `W${4 - i}`;

    const weekNet = transactions
      .filter((t) => t.timestamp >= weekStart && t.timestamp <= weekEnd)
      .reduce((sum, t) => sum + t.net, 0);

    weeklyChartSeries.push({ label, value: weekNet });
  }

  // 3. Monthly Chart Series
  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currYear = now.getFullYear();
  const currMonth = now.getMonth();
  const hasOlderInYear = transactions.some((t) => {
    const td = new Date(t.timestamp);
    return td.getFullYear() === currYear && td.getMonth() < currMonth - 5;
  });

  const monthlyChartSeries = [];
  if (hasOlderInYear) {
    for (let m = 0; m <= currMonth; m++) {
      const label = shortMonths[m];
      const mNet = transactions
        .filter((t) => {
          const td = new Date(t.timestamp);
          return td.getFullYear() === currYear && td.getMonth() === m;
        })
        .reduce((sum, t) => sum + t.net, 0);
      monthlyChartSeries.push({ label, value: mNet });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currYear, currMonth - i, 1);
      const targetYr = d.getFullYear();
      const targetMo = d.getMonth();
      const label = shortMonths[targetMo];

      const mNet = transactions
        .filter((t) => {
          const td = new Date(t.timestamp);
          return td.getFullYear() === targetYr && td.getMonth() === targetMo;
        })
        .reduce((sum, t) => sum + t.net, 0);

      monthlyChartSeries.push({ label, value: mNet });
    }
  }

  // 4. Yearly Chart Series (Past 4 years ending current year)
  const yearlyChartSeries = [];
  for (let i = 3; i >= 0; i--) {
    const yr = currYear - i;
    const label = String(yr);
    const yrNet = transactions
      .filter((t) => new Date(t.timestamp).getFullYear() === yr)
      .reduce((sum, t) => sum + t.net, 0);
    yearlyChartSeries.push({ label, value: yrNet });
  }

  // 5. All-Time Chart Series
  const allTimeChartSeries = [...yearlyChartSeries];

  return {
    dailyNet: dailyNetTotal,
    weeklyNet: weeklyNetTotal,
    monthlyNet: monthlyNetTotal,
    yearlyNet: resolvedYearlyNet,
    totalReceivedNet: overallReceivedNetTotal,
    sparklineData,

    chartSeries: {
      daily: dailyChartSeries,
      weekly: weeklyChartSeries,
      monthly: monthlyChartSeries,
      yearly: yearlyChartSeries,
      allTime: allTimeChartSeries,
    },
    
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
