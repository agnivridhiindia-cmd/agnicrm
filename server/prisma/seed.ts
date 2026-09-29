import { PrismaClient, Role, ServiceType, Stage, PaymentMode, PaymentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting clean database seeding for 4 branches & full teams...");

  // 1. Clear existing records in correct relation order
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.agreement.deleteMany();
  await prisma.request.deleteMany();
  await prisma.clientDocument.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.serviceCatalog.deleteMany();

  console.log("🧹 Cleared old database tables.");

  // 2. Create 4 Standard Branches
  const westBranch = await prisma.branch.create({
    data: {
      code: "BR-01",
      name: "West Zone (Mumbai)",
      city: "Mumbai, Maharashtra",
      region: "West Zone",
      targetRevenue: 4500000,
      achievedRevenue: 4120000,
      status: "Active",
    },
  });

  const northBranch = await prisma.branch.create({
    data: {
      code: "BR-02",
      name: "North Zone (Delhi)",
      city: "New Delhi, NCR",
      region: "North Zone",
      targetRevenue: 3800000,
      achievedRevenue: 3450000,
      status: "Active",
    },
  });

  const southBranch = await prisma.branch.create({
    data: {
      code: "BR-03",
      name: "South Zone (Bengaluru)",
      city: "Bengaluru, Karnataka",
      region: "South Zone",
      targetRevenue: 4200000,
      achievedRevenue: 3980000,
      status: "Active",
    },
  });

  const eastBranch = await prisma.branch.create({
    data: {
      code: "BR-04",
      name: "East Zone (Kolkata)",
      city: "Kolkata, West Bengal",
      region: "East Zone",
      targetRevenue: 2500000,
      achievedRevenue: 2180000,
      status: "Active",
    },
  });

  console.log("🏢 Created 4 Regional Branches.");

  const defaultPasswordHash = await bcrypt.hash("password123", 10);

  // 3. Top-Level Owner
  const ownerUser = await prisma.user.create({
    data: {
      email: "owner@agni.com",
      passwordHash: defaultPasswordHash,
      fullName: "Devika Shah (Owner)",
      phone: "+91 98000 00001",
      role: Role.OWNER,
      region: "Pan-India",
    },
  });

  // Helper to seed full team for a branch (1 Branch Manager, 1 Sales Manager, 2 Salespersons, 2 IT, 2 Marketing, 2 Admin)
  async function seedBranchTeam(config: {
    branch: typeof westBranch;
    bm: { email: string; name: string; phone: string };
    sm: { email: string; name: string; phone: string };
    sales: { email: string; name: string; phone: string }[];
    it: { email: string; name: string; phone: string }[];
    mkt: { email: string; name: string; phone: string }[];
    admin: { email: string; name: string; phone: string }[];
  }) {
    const { branch, bm, sm, sales, it, mkt, admin } = config;

    // 1. Branch Manager
    const bmUser = await prisma.user.create({
      data: {
        email: bm.email,
        passwordHash: defaultPasswordHash,
        fullName: bm.name,
        phone: bm.phone,
        role: Role.BRANCH_MANAGER,
        branchId: branch.id,
        region: branch.region,
      },
    });

    // 2. Sales Manager (reports to Branch Manager)
    const smUser = await prisma.user.create({
      data: {
        email: sm.email,
        passwordHash: defaultPasswordHash,
        fullName: sm.name,
        phone: sm.phone,
        role: Role.MANAGER,
        branchId: branch.id,
        region: branch.region,
        reportingManagerId: bmUser.id,
      },
    });

    // 3. Sales Persons (2, report to Sales Manager)
    const salesUsers = [];
    for (const s of sales) {
      const u = await prisma.user.create({
        data: {
          email: s.email,
          passwordHash: defaultPasswordHash,
          fullName: s.name,
          phone: s.phone,
          role: Role.SALES_PERSON,
          branchId: branch.id,
          region: branch.region,
          reportingManagerId: smUser.id,
        },
      });
      salesUsers.push(u);
    }

    // 4. IT Team (2, report to Branch Manager)
    const itUsers = [];
    for (const item of it) {
      const u = await prisma.user.create({
        data: {
          email: item.email,
          passwordHash: defaultPasswordHash,
          fullName: item.name,
          phone: item.phone,
          role: Role.IT,
          branchId: branch.id,
          region: branch.region,
          reportingManagerId: bmUser.id,
        },
      });
      itUsers.push(u);
    }

    // 5. Marketing Team (2, report to Branch Manager)
    const mktUsers = [];
    for (const item of mkt) {
      const u = await prisma.user.create({
        data: {
          email: item.email,
          passwordHash: defaultPasswordHash,
          fullName: item.name,
          phone: item.phone,
          role: Role.MARKETING,
          branchId: branch.id,
          region: branch.region,
          reportingManagerId: bmUser.id,
        },
      });
      mktUsers.push(u);
    }

    // 6. Admin Team (2, report to Branch Manager)
    const adminUsers = [];
    for (const item of admin) {
      const u = await prisma.user.create({
        data: {
          email: item.email,
          passwordHash: defaultPasswordHash,
          fullName: item.name,
          phone: item.phone,
          role: Role.ADMIN,
          branchId: branch.id,
          region: branch.region,
          reportingManagerId: bmUser.id,
        },
      });
      adminUsers.push(u);
    }

    return { bmUser, smUser, salesUsers, itUsers, mktUsers, adminUsers };
  }

  // --- BRANCH 1: MUMBAI (WEST ZONE) ---
  const westTeam = await seedBranchTeam({
    branch: westBranch,
    bm: { email: "ariana@agni.com", name: "Ariana Lee", phone: "+91 98202 22334" },
    sm: { email: "eli@agni.com", name: "Eli Brooks", phone: "+91 91234 00222" },
    sales: [
      { email: "mia@agni.com", name: "Mia Rose", phone: "+91 98205 55667" },
      { email: "lucas@agni.com", name: "Lucas Scott", phone: "+91 98205 55670" },
    ],
    it: [
      { email: "noah@agni.com", name: "Noah Kim (IT Lead)", phone: "+91 98205 55668" },
      { email: "sophia.it@agni.com", name: "Sophia Patel (IT Specialist)", phone: "+91 98205 55671" },
    ],
    mkt: [
      { email: "daniel@agni.com", name: "Daniel Cruz (Marketing Lead)", phone: "+91 98205 55669" },
      { email: "chloe@agni.com", name: "Chloe Bennett (Marketing Assoc)", phone: "+91 98205 55672" },
    ],
    admin: [
      { email: "admin@agni.com", name: "Vikramaditya Roy (Admin Lead)", phone: "+91 98201 11223" },
      { email: "priya.admin@agni.com", name: "Priya Nair (Admin Officer)", phone: "+91 98201 11224" },
    ],
  });

  // --- BRANCH 2: DELHI (NORTH ZONE) ---
  const northTeam = await seedBranchTeam({
    branch: northBranch,
    bm: { email: "rajesh.bm@agni.com", name: "Rajesh Khanna", phone: "+91 98111 22334" },
    sm: { email: "ananya.sm@agni.com", name: "Ananya Sen", phone: "+91 98111 22335" },
    sales: [
      { email: "rohan.sales@agni.com", name: "Rohan Gupta", phone: "+91 98111 22336" },
      { email: "kavya.sales@agni.com", name: "Kavya Sharma", phone: "+91 98111 22337" },
      { email: "arjun.sales@agni.com", name: "Arjun Hegde", phone: "+91 98440 33447" },
    ],
    it: [
      { email: "aarav.it@agni.com", name: "Aarav Mehta (IT Lead)", phone: "+91 98111 22338" },
      { email: "ishaan.it@agni.com", name: "Ishaan Verma (Sys Admin)", phone: "+91 98111 22339" },
    ],
    mkt: [
      { email: "neha.mkt@agni.com", name: "Neha Kapoor (Marketing Lead)", phone: "+91 98111 22340" },
      { email: "sanya.mkt@agni.com", name: "Sanya Malhotra (Digital Specialist)", phone: "+91 98111 22341" },
    ],
    admin: [
      { email: "amit.admin@agni.com", name: "Amit Joshi (Admin Lead)", phone: "+91 98111 22342" },
      { email: "simran.admin@agni.com", name: "Simran Kaur (Admin Officer)", phone: "+91 98111 22343" },
    ],
  });

  // --- BRANCH 3: BENGALURU (SOUTH ZONE) ---
  const southTeam = await seedBranchTeam({
    branch: southBranch,
    bm: { email: "suresh.bm@agni.com", name: "Suresh Reddy", phone: "+91 98440 33445" },
    sm: { email: "karthik.sm@agni.com", name: "Karthik Iyer", phone: "+91 98440 33446" },
    sales: [
      { email: "deepa.sales@agni.com", name: "Deepa Rao", phone: "+91 98440 33448" },
    ],
    it: [
      { email: "vikram.it@agni.com", name: "Vikram Rao (Cloud Architect)", phone: "+91 98440 33449" },
      { email: "niharika.it@agni.com", name: "Niharika Bhat (IT Lead)", phone: "+91 98440 33450" },
    ],
    mkt: [
      { email: "pooja.mkt@agni.com", name: "Pooja Menon (Marketing Lead)", phone: "+91 98440 33451" },
      { email: "tarun.mkt@agni.com", name: "Tarun Kumar (Campaign Lead)", phone: "+91 98440 33452" },
    ],
    admin: [
      { email: "lakshmi.admin@agni.com", name: "Lakshmi Narayanan (Admin Lead)", phone: "+91 98440 33453" },
      { email: "rahul.admin@agni.com", name: "Rahul Gowda (Admin Officer)", phone: "+91 98440 33454" },
    ],
  });

  // --- BRANCH 4: KOLKATA (EAST ZONE) ---
  const eastTeam = await seedBranchTeam({
    branch: eastBranch,
    bm: { email: "subhash.bm@agni.com", name: "Subhash Banerjee", phone: "+91 98330 44556" },
    sm: { email: "debolina.sm@agni.com", name: "Debolina Roy", phone: "+91 98330 44557" },
    sales: [
      { email: "sourav.sales@agni.com", name: "Sourav Das", phone: "+91 98330 44558" },
      { email: "riya.sales@agni.com", name: "Riya Mukherjee", phone: "+91 98330 44559" },
    ],
    it: [
      { email: "arindam.it@agni.com", name: "Arindam Bose (IT Lead)", phone: "+91 98330 44560" },
      { email: "swati.it@agni.com", name: "Swati Ganguly (Network Eng)", phone: "+91 98330 44561" },
    ],
    mkt: [
      { email: "tanmoy.mkt@agni.com", name: "Tanmoy Dutta (Marketing Lead)", phone: "+91 98330 44562" },
      { email: "sneha.mkt@agni.com", name: "Sneha Ghosh (Brand Assoc)", phone: "+91 98330 44563" },
    ],
    admin: [
      { email: "pronab.admin@agni.com", name: "Pronab Paul (Admin Lead)", phone: "+91 98330 44564" },
      { email: "moumita.admin@agni.com", name: "Moumita Kar (Admin Officer)", phone: "+91 98330 44565" },
    ],
  });

  console.log("👥 Created 40 personnel across 4 branches (1 BM, 1 SM, 2 Sales, 2 IT, 2 Mkt, 2 Admin per branch).");

  // 4. (No Seed Clients - Start Clean from Scratch for Testing)

  // 6. Seed Service Catalog Offerings
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

  console.log("✅ Clean database seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
