const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateInvoices() {
  try {
    const clients = await prisma.client.findMany({
      include: { invoices: true }
    });

    for (const c of clients) {
      const isSec = c.isPrimary === false || c.processType === "secondary" || c.serviceType === "More Services" || (typeof c.appId === "string" && (c.appId.endsWith("-S") || c.appId.endsWith("-E")));
      if (!isSec) {
        // Update client totalPayment & paymentReceived to 118000
        await prisma.client.update({
          where: { id: c.id },
          data: {
            totalPayment: 118000,
            paymentReceived: 118000
          }
        });

        // Update invoices associated with primary client to 118000
        for (const inv of c.invoices) {
          await prisma.invoice.update({
            where: { id: inv.id },
            data: {
              rawTotal: 118000,
              paymentReceived: 118000,
              paymentPending: 0,
              status: "PAID"
            }
          });
          console.log(`Updated Invoice ${inv.invoiceNo} for Primary Client ${c.name} (${c.appId}) to 118000!`);
        }
      }
    }
  } catch (err) {
    console.error("Error updating invoices:", err);
  } finally {
    await prisma.$disconnect();
  }
}

updateInvoices();
