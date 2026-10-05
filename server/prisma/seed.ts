import { PrismaClient, Role, ServiceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting clean database seeding for alpha testing...");

  // 1. Clear existing records in correct relation order
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.request.deleteMany();
  await prisma.clientDocument.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.clientScheme.deleteMany();
  await prisma.clientTransferLog.deleteMany();
  await prisma.client.deleteMany();
  await prisma.employeeTransferLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.serviceCatalog.deleteMany();

  console.log("🧹 Cleared all old database records.");

  // 2. Create 4 Standard Branches
  await prisma.branch.createMany({
    data: [
      {
        code: "BR-01",
        name: "West Zone (Mumbai)",
        city: "Mumbai, Maharashtra",
        region: "West Zone",
        targetRevenue: 4500000,
        achievedRevenue: 0,
        status: "Active",
      },
      {
        code: "BR-02",
        name: "North Zone (Delhi)",
        city: "New Delhi, NCR",
        region: "North Zone",
        targetRevenue: 3800000,
        achievedRevenue: 0,
        status: "Active",
      },
      {
        code: "BR-03",
        name: "South Zone (Bengaluru)",
        city: "Bengaluru, Karnataka",
        region: "South Zone",
        targetRevenue: 4200000,
        achievedRevenue: 0,
        status: "Active",
      },
      {
        code: "BR-04",
        name: "East Zone (Kolkata)",
        city: "Kolkata, West Bengal",
        region: "East Zone",
        targetRevenue: 2500000,
        achievedRevenue: 0,
        status: "Active",
      },
    ],
  });

  console.log("🏢 Created 4 Regional Branches.");

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 3. Top-Level Owner (The ONLY user in the system)
  const ownerUser = await prisma.user.create({
    data: {
      email: "agnivridhiindia@gmail.com",
      passwordHash: defaultPasswordHash,
      fullName: "Rahul Singh",
      phone: "8800247563",
      role: Role.OWNER,
      region: "Pan-India",
      status: "Active",
    },
  });

  console.log(`👤 Created Owner Account: ${ownerUser.fullName} (${ownerUser.email})`);

  // 4. Seed Service Catalog Offerings
  await prisma.serviceCatalog.createMany({
    data: [
      {
        serviceCode: "it-srv-1",
        categoryType: ServiceType.IT,
        name: "Enterprise Web Portal & CRM Maintenance",
        category: "Infrastructure & Web",
        description: "24/7 technical monitoring, database backup management, vulnerability patching, and SLA incident response.",
        tag: "24/7 SLA Guarantee",
        turnaround: "Instant Onboarding",
        baseAmount: 18000,
        estimate: "₹18,000 / month",
        features: ["99.99% Guaranteed SLA Uptime", "Automated Hourly Database Backups", "Dedicated DevOps Lead", "Zero-Downtime Hotfixes"],
      },
      {
        serviceCode: "mkt-srv-1",
        categoryType: ServiceType.MARKETING,
        name: "Omnichannel Digital Growth & Performance Ads",
        category: "Growth & Branding",
        description: "Targeted digital marketing campaigns across Google Search, Meta Ads, and LinkedIn.",
        tag: "High ROI Guaranteed",
        turnaround: "Campaign launch within 48h",
        baseAmount: 25000,
        estimate: "₹25,000 / campaign",
        features: ["Multi-Channel Ad Spend Management", "Custom Landing Page Optimization", "Weekly Analytics & Attribution Reports", "A/B Creative Testing"],
      },
      {
        serviceCode: "cert-srv-1",
        categoryType: ServiceType.CERTIFICATE,
        name: "ISO 9001:2015 & ZED Quality Certification",
        category: "Compliance & Standards",
        description: "Full end-to-end documentation audit, gap analysis, employee training, and third-party registrar accreditation.",
        tag: "Govt Recognized Audit",
        turnaround: "15 Days Execution",
        baseAmount: 32000,
        estimate: "₹32,000 / audit",
        features: ["On-Site Quality Audit", "Gap Analysis & SOP Framework", "Registrar Liaison & Final Certificate", "1-Year Recertification Support"],
      },
    ],
  });

  console.log("🛠️ Seeded Service Catalog Offerings.");
  console.log("👥 Employees Seeded: 0 (None - clean for Alpha Testing)");
  console.log("🏢 Clients Seeded: 0 (None - clean for Alpha Testing)");
  console.log("✅ Alpha testing database seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
