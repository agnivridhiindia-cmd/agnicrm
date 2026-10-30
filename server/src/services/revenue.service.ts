import { Prisma, PaymentMode } from "@prisma/client";
import { prisma } from "../config/prisma";

export interface RecordDailySalesPaymentInput {
  amount: number | Prisma.Decimal;
  paymentDate?: Date | string;
  paymentMode?: PaymentMode | string;
  referenceNumber?: string | null;
  status?: string;
  notes?: string | null;
  salesPersonId?: string | null;
  salesPersonName?: string | null;
  salesPersonEmail?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  clientId: string;
  clientName?: string | null;
  companyName?: string | null;
  schemeName?: string | null;
  serviceType?: string | null;
  invoiceId?: string | null;
  paymentId?: string | null;
}

/**
 * Format a Date object into YYYY-MM-DD string according to IST (Indian Standard Time, UTC+5:30)
 */
export function formatDateToDateString(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  // Convert to IST offset (+5.5 hours)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffsetMs);
  return istDate.toISOString().slice(0, 10);
}

/**
 * Record a payment into the daily_sales_payments table.
 * Supports running within an existing Prisma transaction or standalone.
 */
export async function recordDailySalesPayment(
  data: RecordDailySalesPaymentInput,
  txClient: any = prisma
) {
  const grossAmount = Number(data.amount) || 0;
  if (grossAmount <= 0) {
    return null;
  }

  const isOffline =
    data.paymentMode === PaymentMode.OFFLINE ||
    String(data.paymentMode || "").toUpperCase() === "OFFLINE";

  // Calculate Net and GST (18% GST standard on online collections; offline/exempt payments have 0% GST and 100% net)
  const netAmount = isOffline ? grossAmount : Math.round((grossAmount / 1.18) * 100) / 100;
  const gstAmount = isOffline ? 0 : Math.round((grossAmount - netAmount) * 100) / 100;

  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
  const dateString = formatDateToDateString(paymentDate);

  // Retrieve client info if missing
  let clientId = data.clientId;
  let clientName = data.clientName;
  let companyName = data.companyName;
  let schemeName = data.schemeName;
  let serviceType = data.serviceType;
  let branchId = data.branchId;
  let salesPersonId = data.salesPersonId;

  const client = await txClient.client.findUnique({
    where: { id: clientId },
    include: {
      salesPerson: { select: { id: true, fullName: true, email: true, branchId: true } },
      branch: { select: { id: true, name: true } },
    },
  });

  if (client) {
    clientName = clientName || client.name || client.contactPerson || "Client";
    companyName = companyName || client.companyName || client.name || "Client Company";
    schemeName = schemeName || client.serviceName || "Service Retainer";
    serviceType = serviceType || client.serviceType || "CONSULTANCY";
    branchId = branchId || client.branchId || client.salesPerson?.branchId;
    salesPersonId = salesPersonId || client.salesPersonId;
  }

  // Retrieve salesperson info
  let salesPersonName = data.salesPersonName;
  let salesPersonEmail = data.salesPersonEmail;

  if (salesPersonId) {
    const sp = await txClient.user.findUnique({
      where: { id: salesPersonId },
      select: { id: true, fullName: true, email: true, branchId: true },
    });
    if (sp) {
      salesPersonName = sp.fullName;
      salesPersonEmail = sp.email;
      if (!branchId) branchId = sp.branchId;
    }
  }

  // Fallback if no salesperson assigned (e.g., owner or direct)
  if (!salesPersonId) {
    const fallbackUser = await txClient.user.findFirst({
      where: { isDeleted: false, role: { in: ["OWNER", "ADMIN"] } },
      select: { id: true, fullName: true, email: true, branchId: true },
    });
    if (fallbackUser) {
      salesPersonId = fallbackUser.id;
      salesPersonName = salesPersonName || fallbackUser.fullName;
      salesPersonEmail = salesPersonEmail || fallbackUser.email;
      if (!branchId) branchId = fallbackUser.branchId;
    }
  }

  // Fallback branch if still missing
  let branchName = data.branchName;
  if (!branchId) {
    const defaultBranch = await txClient.branch.findFirst({ select: { id: true, name: true } });
    if (defaultBranch) {
      branchId = defaultBranch.id;
      branchName = branchName || defaultBranch.name;
    }
  } else if (!branchName) {
    const b = await txClient.branch.findUnique({ where: { id: branchId }, select: { name: true } });
    if (b) branchName = b.name;
  }

  const validPaymentMode = isOffline ? PaymentMode.OFFLINE : PaymentMode.ONLINE;

  const created = await txClient.dailySalesPayment.create({
    data: {
      dateString,
      paymentDate,
      amount: new Prisma.Decimal(grossAmount),
      netAmount: new Prisma.Decimal(netAmount),
      gstAmount: new Prisma.Decimal(gstAmount),
      paymentMode: validPaymentMode,
      referenceNumber: data.referenceNumber || null,
      status: data.status || "COMPLETED",
      notes: data.notes || null,
      salesPersonId: salesPersonId!,
      salesPersonName: salesPersonName || "Direct Sales",
      salesPersonEmail: salesPersonEmail || null,
      branchId: branchId!,
      branchName: branchName || "Main Branch",
      clientId,
      clientName: clientName || "Valued Client",
      companyName: companyName || "Valued Client",
      schemeName: schemeName || "Primary Service",
      serviceType: serviceType || "CONSULTANCY",
      invoiceId: data.invoiceId || null,
      paymentId: data.paymentId || null,
    },
  });

  return created;
}

/**
 * Get monthly calendar summary of revenues grouped by date
 */
export async function getMonthCalendarSummaryService(
  year: number,
  month: number, // 1 to 12
  branchId?: string
) {
  const paddedMonth = String(month).padStart(2, "0");
  const monthPrefix = `${year}-${paddedMonth}`;

  const whereClause: Prisma.DailySalesPaymentWhereInput = {
    dateString: { startsWith: monthPrefix },
  };

  if (branchId && branchId !== "ALL") {
    whereClause.branchId = branchId;
  }

  const payments = await prisma.dailySalesPayment.findMany({
    where: whereClause,
    orderBy: { paymentDate: "asc" },
  });

  const daysMap: Record<
    string,
    {
      date: string;
      totalGross: number;
      totalNet: number;
      totalGst: number;
      transactionCount: number;
      salespersons: { name: string; amount: number }[];
    }
  > = {};

  let monthTotalGross = 0;
  let monthTotalNet = 0;

  for (const p of payments) {
    const date = p.dateString;
    const amount = Number(p.amount);
    const net = Number(p.netAmount);
    const gst = Number(p.gstAmount);

    monthTotalGross += amount;
    monthTotalNet += net;

    if (!daysMap[date]) {
      daysMap[date] = {
        date,
        totalGross: 0,
        totalNet: 0,
        totalGst: 0,
        transactionCount: 0,
        salespersons: [],
      };
    }

    daysMap[date].totalGross += amount;
    daysMap[date].totalNet += net;
    daysMap[date].totalGst += gst;
    daysMap[date].transactionCount += 1;

    const existingSp = daysMap[date].salespersons.find(
      (s) => s.name === p.salesPersonName
    );
    if (existingSp) {
      existingSp.amount += amount;
    } else {
      daysMap[date].salespersons.push({
        name: p.salesPersonName,
        amount,
      });
    }
  }

  // Sort salespersons inside each day by contribution descending
  Object.values(daysMap).forEach((day) => {
    day.salespersons.sort((a, b) => b.amount - a.amount);
  });

  return {
    year,
    month,
    monthTotalGross: Math.round(monthTotalGross * 100) / 100,
    monthTotalNet: Math.round(monthTotalNet * 100) / 100,
    activeDaysCount: Object.keys(daysMap).length,
    totalTransactions: payments.length,
    days: daysMap,
  };
}

/**
 * Get daily revenue breakdown for a specific date:
 * Returns total revenue, salesperson contributions leaderboard (% and amounts),
 * and individual client deal transactions.
 */
export async function getDailyBreakdownService(dateString: string, branchId?: string) {
  const whereClause: Prisma.DailySalesPaymentWhereInput = {
    dateString,
  };

  if (branchId && branchId !== "ALL") {
    whereClause.branchId = branchId;
  }

  const payments = await prisma.dailySalesPayment.findMany({
    where: whereClause,
    orderBy: { paymentDate: "desc" },
    include: {
      salesPerson: {
        select: {
          id: true,
          fullName: true,
          email: true,
          designation: true,
          targetQuota: true,
        },
      },
      client: {
        select: {
          id: true,
          appId: true,
          name: true,
          companyName: true,
          phone: true,
          email: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  let totalGross = 0;
  let totalNet = 0;
  let totalGst = 0;

  const salespersonMap: Record<
    string,
    {
      salesPersonId: string;
      name: string;
      email: string | null;
      designation: string | null;
      branchName: string;
      totalGross: number;
      totalNet: number;
      dealCount: number;
      deals: any[];
    }
  > = {};

  const transactions = payments.map((p) => {
    const gross = Number(p.amount);
    const net = Number(p.netAmount);
    const gst = Number(p.gstAmount);

    totalGross += gross;
    totalNet += net;
    totalGst += gst;

    const spKey = p.salesPersonId || "unassigned";
    if (!salespersonMap[spKey]) {
      salespersonMap[spKey] = {
        salesPersonId: p.salesPersonId,
        name: p.salesPerson?.fullName || p.salesPersonName || "Direct Sales",
        email: p.salesPerson?.email || p.salesPersonEmail || null,
        designation: p.salesPerson?.designation || "Sales Officer",
        branchName: p.branch?.name || p.branchName || "Main Branch",
        totalGross: 0,
        totalNet: 0,
        dealCount: 0,
        deals: [],
      };
    }

    salespersonMap[spKey].totalGross += gross;
    salespersonMap[spKey].totalNet += net;
    salespersonMap[spKey].dealCount += 1;

    const dealInfo = {
      id: p.id,
      dateString: p.dateString,
      paymentDate: p.paymentDate,
      grossAmount: gross,
      netAmount: net,
      gstAmount: gst,
      paymentMode: p.paymentMode,
      referenceNumber: p.referenceNumber,
      status: p.status,
      notes: p.notes,
      clientId: p.clientId,
      appId: p.client?.appId,
      clientName: p.clientName,
      companyName: p.companyName,
      schemeName: p.schemeName,
      serviceType: p.serviceType,
      invoiceId: p.invoiceId,
      paymentId: p.paymentId,
    };

    salespersonMap[spKey].deals.push(dealInfo);

    return {
      ...dealInfo,
      salesPersonId: p.salesPersonId,
      salesPersonName: salespersonMap[spKey].name,
      salesPersonDesignation: salespersonMap[spKey].designation,
      branchName: salespersonMap[spKey].branchName,
    };
  });

  // Calculate percentage of day's total for each salesperson
  const salespeople = Object.values(salespersonMap)
    .map((sp) => ({
      ...sp,
      totalGross: Math.round(sp.totalGross * 100) / 100,
      totalNet: Math.round(sp.totalNet * 100) / 100,
      percentageOfTotal:
        totalGross > 0 ? Math.round((sp.totalGross / totalGross) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.totalGross - a.totalGross);

  return {
    date: dateString,
    totalGross: Math.round(totalGross * 100) / 100,
    totalNet: Math.round(totalNet * 100) / 100,
    totalGst: Math.round(totalGst * 100) / 100,
    transactionCount: payments.length,
    salespeople,
    transactions,
  };
}
