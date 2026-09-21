import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

const SERVER_URL = 'http://localhost:5000/api/v1';

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRegistrationFlow() {
  console.log("Starting test flow...");
  try {
    // 1. Get a salesperson and manager
    const sp = await prisma.user.findFirst({ where: { role: Role.SALES_PERSON, isDeleted: false } });
    if (!sp) {
      console.log("No salesperson found!");
      return;
    }
    
    // Login to get token
    const loginRes = await fetch(`${SERVER_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: sp.email, password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    console.log(`Logged in as Sales Person: ${sp.email}`);

    const uniqueEmail = `test.client.${Date.now()}@example.com`;
    const companyName = `Test Company ${Date.now()}`;

    console.log(`Registering client: ${uniqueEmail}`);

    const regRes = await fetch(`${SERVER_URL}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        companyName,
        name: companyName,
        contactPerson: 'Mr Test',
        email: uniqueEmail,
        phone: '1234567890',
        serviceType: 'CERTIFICATE',
        serviceName: 'Udyam Registration',
        amount: 2500,
        paymentReceived: 1000,
        paymentMode: 'ONLINE'
      })
    });
    
    const regData = await regRes.json();
    console.log("Registration Response:", JSON.stringify(regData));

    // Verify in DB directly
    const clientInDb = await prisma.client.findFirst({ where: { email: uniqueEmail } });
    if (clientInDb) {
      console.log("FAIL: Client was created in DB directly!");
    } else {
      console.log("SUCCESS: Client is NOT in DB.");
    }

    // Check request queue
    const pendingReq = await prisma.request.findFirst({
      where: { requesterId: sp.id, requestType: 'NEW_SERVICE', status: 'PENDING' },
      orderBy: { createdAt: 'desc' }
    });
    
    if (pendingReq) {
      console.log(`Found pending request ID: ${pendingReq.id}, clientId: ${pendingReq.clientId}`);
    } else {
      console.log("FAIL: No pending request found.");
      return;
    }

    // 2. Manager approves
    const manager = await prisma.user.findFirst({ where: { role: Role.MANAGER, isDeleted: false } });
    if (!manager) {
      console.log("No manager found!");
      return;
    }

    const mgrLoginRes = await fetch(`${SERVER_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: manager.email, password: 'password123' })
    });
    const mgrLoginData = await mgrLoginRes.json();
    const mgrToken = mgrLoginData.token;

    console.log(`Logged in as Manager: ${manager.email}`);

    console.log("Approving request...");
    const approveRes = await fetch(`${SERVER_URL}/requests/${pendingReq.id}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mgrToken}` },
      body: JSON.stringify({ decision: 'APPROVED' })
    });
    const approveData = await approveRes.json();
    console.log("Approval response:", JSON.stringify(approveData));

    // Verify DB
    const finalClient = await prisma.client.findFirst({ where: { email: uniqueEmail } });
    if (finalClient && finalClient.approvalStatus === 'ACTIVE') {
      console.log("SUCCESS: Client is now active in DB!");
    } else {
      console.log("FAIL: Client not found or not active.", finalClient);
    }
  } catch (err) {
    console.error("Test failed with error", err);
  } finally {
    await prisma.$disconnect();
  }
}

testRegistrationFlow();
