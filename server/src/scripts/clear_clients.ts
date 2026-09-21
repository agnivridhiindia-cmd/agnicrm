import { prisma } from "../config/prisma";

async function removeAllClients() {
  console.log("Removing all client data from database...");

  // Delete all dependent records first
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.agreement.deleteMany({});
  await prisma.request.deleteMany({});
  await prisma.clientDocument.deleteMany({});
  await prisma.clientScheme.deleteMany({});

  // Delete all client records
  const deletedClients = await prisma.client.deleteMany({});
  console.log(`Deleted ${deletedClients.count} client records.`);

  // Delete all client user login accounts
  const deletedUsers = await prisma.user.deleteMany({
    where: { role: "CLIENT" },
  });
  console.log(`Deleted ${deletedUsers.count} client user accounts.`);

  console.log("All clients have been cleanly removed from database.");
}

removeAllClients()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error removing clients:", e);
    process.exit(1);
  });
