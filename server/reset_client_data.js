const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetClientData() {
  console.log("🧹 Starting complete client & transactional data cleanup...");

  try {
    const deletedPayments = await prisma.payment.deleteMany();
    console.log(`✅ Deleted ${deletedPayments.count} payments.`);

    const deletedInvoices = await prisma.invoice.deleteMany();
    console.log(`✅ Deleted ${deletedInvoices.count} invoices.`);

    const deletedDocuments = await prisma.clientDocument.deleteMany();
    console.log(`✅ Deleted ${deletedDocuments.count} client documents.`);

    const deletedAgreements = await prisma.agreement.deleteMany();
    console.log(`✅ Deleted ${deletedAgreements.count} agreements.`);

    const deletedRequests = await prisma.request.deleteMany();
    console.log(`✅ Deleted ${deletedRequests.count} requests.`);

    const deletedSchemes = await prisma.clientScheme.deleteMany();
    console.log(`✅ Deleted ${deletedSchemes.count} client schemes.`);

    const deletedNotifications = await prisma.notification.deleteMany();
    console.log(`✅ Deleted ${deletedNotifications.count} notifications.`);

    const deletedActivityLogs = await prisma.activityLog.deleteMany();
    console.log(`✅ Deleted ${deletedActivityLogs.count} activity logs.`);

    const deletedClients = await prisma.client.deleteMany();
    console.log(`✅ Deleted ${deletedClients.count} clients.`);

    const deletedClientUsers = await prisma.user.deleteMany({
      where: { role: 'CLIENT' }
    });
    console.log(`✅ Deleted ${deletedClientUsers.count} client login accounts.`);

    // Integrity Check
    const remainingStaffUsers = await prisma.user.count();
    const remainingBranches = await prisma.branch.count();
    const remainingServices = await prisma.serviceCatalog.count();

    console.log("\n--- System Integrity Check ---");
    console.log(`👥 Remaining Staff & Admin Accounts: ${remainingStaffUsers}`);
    console.log(`🏢 Remaining Branches: ${remainingBranches}`);
    console.log(`🛠️ Remaining Service Catalog Items: ${remainingServices}`);

    console.log("\n🎉 Database client cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during database cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetClientData();
