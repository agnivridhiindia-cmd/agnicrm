import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function removeTestCompanies() {
  console.log("Removing test companies...");
  
  // Find clients with 'Test Company' in their name
  const testClients = await prisma.client.findMany({
    where: {
      name: {
        startsWith: 'Test Company'
      }
    }
  });
  
  console.log(`Found ${testClients.length} test clients.`);
  
  for (const client of testClients) {
    // Delete schemes associated with this client
    await prisma.clientScheme.deleteMany({
      where: { clientId: client.id }
    });
    
    // Delete documents associated with this client
    await prisma.clientDocument.deleteMany({
      where: { clientId: client.id }
    });
    
    // Find and delete users associated with this client (by email)
    const users = await prisma.user.findMany({
      where: { email: client.email }
    });
    
    for (const user of users) {
      await prisma.user.delete({ where: { id: user.id } });
      console.log(`Deleted user: ${user.email}`);
    }
    
    // Delete client
    await prisma.client.delete({ where: { id: client.id } });
    console.log(`Deleted client: ${client.name}`);
  }
  
  // Also delete test requests where requestedChanges contains 'Test Company'
  // Or requests that have requesterId but no clientId... wait we can just delete requests where reason starts with 'New client registration for Test Company'
  const testRequests = await prisma.request.findMany({
    where: {
      reason: {
        startsWith: 'New client registration for Test Company'
      }
    }
  });
  
  console.log(`Found ${testRequests.length} test requests.`);
  for (const req of testRequests) {
    await prisma.request.delete({ where: { id: req.id } });
    console.log(`Deleted request: ${req.reason}`);
  }

  // Find users with 'test.client' in email that might not have a client record
  const testUsers = await prisma.user.findMany({
    where: {
      email: {
        startsWith: 'test.client.'
      }
    }
  });

  for (const user of testUsers) {
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`Deleted stray user: ${user.email}`);
  }
}

removeTestCompanies().catch(console.error).finally(() => prisma.$disconnect());
