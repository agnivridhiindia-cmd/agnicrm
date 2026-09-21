const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function wipeDatabase() {
  console.log("Wiping clients...");
  
  try {
    await prisma.activityLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.clientDocument.deleteMany({});
    await prisma.request.deleteMany({});
    await prisma.agreement.deleteMany({});
    await prisma.clientScheme.deleteMany({});
    const res = await prisma.client.deleteMany({});
    console.log(`- ${res.count} Clients deleted successfully!`);
    
  } catch (error) {
    console.error("Error wiping database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

wipeDatabase();
