const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const payments = await p.payment.findMany();
  console.log('=== PAYMENTS ===');
  console.log('Count:', payments.length);
  payments.forEach(pm => console.log(JSON.stringify({
    id: pm.paymentId, amount: pm.amount, date: pm.paymentDate, status: pm.status, clientId: pm.clientId
  })));

  const invoices = await p.invoice.findMany({ include: { payments: true } });
  console.log('\n=== INVOICES ===');
  console.log('Count:', invoices.length);
  invoices.forEach(inv => console.log(JSON.stringify({
    no: inv.invoiceNo, total: inv.rawTotal, received: inv.paymentReceived,
    pending: inv.paymentPending, paymentsCount: inv.payments.length, clientId: inv.clientId
  })));

  const clients = await p.client.findMany({
    select: { id: true, name: true, paymentReceived: true, totalPayment: true, salesPersonId: true, createdAt: true },
  });
  console.log('\n=== CLIENTS ===');
  console.log('Count:', clients.length);
  clients.forEach(c => console.log(JSON.stringify({
    name: c.name, totalPayment: c.totalPayment, paymentReceived: c.paymentReceived,
    spId: c.salesPersonId, createdAt: c.createdAt
  })));

  const users = await p.user.findMany({
    where: { role: { in: ['SALES_PERSON', 'MANAGER'] } },
    select: { id: true, fullName: true, email: true, role: true, branchId: true }
  });
  console.log('\n=== SALES/MANAGER USERS ===');
  users.forEach(u => console.log(JSON.stringify(u)));

  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
