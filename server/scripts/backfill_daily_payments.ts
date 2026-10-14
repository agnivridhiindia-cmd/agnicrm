import { prisma } from "../src/config/prisma";
import { recordDailySalesPayment, formatDateToDateString } from "../src/services/revenue.service";

async function backfill() {
  console.log("=== Starting Daily Sales Payments Backfill ===");

  // 1. Scan Clients with paymentReceived > 0
  const clients = await prisma.client.findMany({
    where: {
      paymentReceived: { gt: 0 },
      isDeleted: false,
    },
    include: {
      salesPerson: { select: { id: true, fullName: true, email: true, branchId: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${clients.length} active clients with paymentReceived > 0.`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (const client of clients) {
    const grossAmount = Number(client.paymentReceived);
    const paymentDate = client.createdAt;
    const dateString = formatDateToDateString(paymentDate);

    // Check if already backfilled for this client and amount
    const existing = await prisma.dailySalesPayment.findFirst({
      where: {
        clientId: client.id,
        amount: grossAmount,
      },
    });

    if (existing) {
      console.log(`- Skipping ${client.appId} (${client.companyName}): Already recorded as ${existing.id}`);
      skippedCount++;
      continue;
    }

    const created = await recordDailySalesPayment({
      amount: grossAmount,
      paymentDate,
      paymentMode: "ONLINE",
      referenceNumber: `INIT-${client.appId}`,
      status: "COMPLETED",
      notes: `Backfilled initial client onboarding payment (${client.serviceName})`,
      salesPersonId: client.salesPersonId || client.salesPerson?.id,
      salesPersonName: client.salesPerson?.fullName,
      salesPersonEmail: client.salesPerson?.email,
      branchId: client.branchId || client.salesPerson?.branchId,
      branchName: client.branch?.name,
      clientId: client.id,
      clientName: client.name || client.contactPerson,
      companyName: client.companyName || client.name,
      schemeName: client.serviceName,
      serviceType: client.serviceType,
    });

    if (created) {
      console.log(
        `+ Created DailySalesPayment: [${dateString}] ₹${grossAmount} | Client: ${client.companyName} | Sales: ${created.salesPersonName}`
      );
      insertedCount++;
    }
  }

  // 2. Scan completed Payment records (if any)
  const payments = await prisma.payment.findMany({
    where: {
      status: "SUCCESS",
      isDeleted: false,
    },
    include: {
      invoice: true,
      client: {
        include: {
          salesPerson: true,
          branch: true,
        },
      },
      recordedBy: true,
    },
  });

  console.log(`Found ${payments.length} SUCCESS payment records.`);
  for (const pay of payments) {
    const grossAmount = Number(pay.amount);
    const existing = await prisma.dailySalesPayment.findFirst({
      where: {
        OR: [
          { paymentId: pay.id },
          { referenceNumber: pay.paymentId },
          { clientId: pay.clientId, amount: grossAmount },
        ],
      },
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    const created = await recordDailySalesPayment({
      amount: grossAmount,
      paymentDate: pay.paymentDate,
      paymentMode: pay.paymentMode,
      referenceNumber: pay.paymentId,
      status: "COMPLETED",
      notes: pay.remarks || "Backfilled payment record",
      salesPersonId: pay.client?.salesPersonId || pay.recordedById,
      salesPersonName: pay.client?.salesPerson?.fullName || pay.recordedBy?.fullName,
      salesPersonEmail: pay.client?.salesPerson?.email || pay.recordedBy?.email,
      branchId: pay.client?.branchId,
      branchName: pay.client?.branch?.name,
      clientId: pay.clientId,
      clientName: pay.client?.name || pay.client?.contactPerson,
      companyName: pay.client?.companyName || pay.client?.name,
      schemeName: pay.client?.serviceName,
      serviceType: pay.client?.serviceType,
      invoiceId: pay.invoiceId,
      paymentId: pay.id,
    });

    if (created) {
      console.log(`+ Created DailySalesPayment from Payment: [${created.dateString}] ₹${grossAmount}`);
      insertedCount++;
    }
  }

  // Summary check
  const totalInDb = await prisma.dailySalesPayment.count();
  const sumResult = await prisma.dailySalesPayment.aggregate({
    _sum: {
      amount: true,
      netAmount: true,
      gstAmount: true,
    },
  });

  console.log("\n=== Backfill Summary ===");
  console.log(`Inserted: ${insertedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Total records in daily_sales_payments: ${totalInDb}`);
  console.log(`Total Gross Revenue: ₹${sumResult._sum.amount}`);
  console.log(`Total Net Revenue: ₹${sumResult._sum.netAmount}`);
  console.log(`Total GST: ₹${sumResult._sum.gstAmount}`);
}

backfill()
  .catch((e) => {
    console.error("Backfill failed:", e);
  })
  .finally(() => prisma.$disconnect());
