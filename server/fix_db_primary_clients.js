const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPrimaryClients() {
  try {
    const clients = await prisma.client.findMany();
    console.log(`Found ${clients.length} clients in DB:`);

    for (const c of clients) {
      console.log(`- ID: ${c.id}, AppId: ${c.appId}, Name: ${c.name}, Service: ${c.serviceName}, ProcessType: ${c.processType}, Total: ${c.totalPayment}, Rec: ${c.paymentReceived}`);
      
      const isSec = c.isPrimary === false || c.processType === "secondary" || c.serviceType === "More Services" || (typeof c.appId === "string" && (c.appId.endsWith("-S") || c.appId.endsWith("-E")));
      
      if (!isSec) {
        await prisma.client.update({
          where: { id: c.id },
          data: {
            totalPayment: 118000,
            paymentReceived: 118000,
            approvalStatus: "ACTIVE"
          }
        });
        console.log(`  -> UPDATED Primary Client ${c.name} (${c.appId}) to 118000 Total & Received in DB!`);
      }
    }
  } catch (err) {
    console.error("Error fixing DB clients:", err);
  } finally {
    await prisma.$disconnect();
  }
}

fixPrimaryClients();
