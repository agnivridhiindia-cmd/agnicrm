import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { logger } from "./logger";

export async function ensureProductionSeed() {
  try {
    const ownerEmail = "agnivridhiindia@gmail.com";
    const existingOwner = await prisma.user.findFirst({
      where: { email: { equals: ownerEmail, mode: "insensitive" } },
    });

    const defaultPasswordHash = await bcrypt.hash("password123", 10);

    // 1. Ensure Branches exist
    const branchCount = await prisma.branch.count();
    if (branchCount === 0) {
      await prisma.branch.createMany({
        data: [
          { code: "NOIDA-01", name: "Noida Branch", city: "Noida, Uttar Pradesh", region: "Noida", targetRevenue: 5000000, status: "Active" },
        ],
        skipDuplicates: true,
      });
      logger.info("[AUTO-SEED] Created Noida Branch.");
    }

    // 2. Ensure Owner exists and password is set to password123
    if (!existingOwner) {
      await prisma.user.create({
        data: {
          email: ownerEmail,
          passwordHash: defaultPasswordHash,
          fullName: "Rahul Singh",
          phone: "8800247563",
          role: Role.OWNER,
          region: "Pan-India",
          status: "Active",
        },
      });
      logger.info(`[AUTO-SEED] Owner account created for ${ownerEmail}.`);
    } else {
      // Re-verify hash to ensure password123 works on production
      const isMatch = await bcrypt.compare("password123", existingOwner.passwordHash);
      if (!isMatch) {
        await prisma.user.update({
          where: { id: existingOwner.id },
          data: { passwordHash: defaultPasswordHash },
        });
        logger.info(`[AUTO-SEED] Owner password verified and updated to password123.`);
      }
    }

    // 3. Ensure Service Catalog exists
    const catalogCount = await prisma.serviceCatalog.count();
    if (catalogCount === 0) {
      await prisma.serviceCatalog.createMany({
        data: [
          {
            serviceCode: "it-srv-1",
            categoryType: "IT",
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
            categoryType: "MARKETING",
            name: "Omnichannel Digital Growth & Performance Ads",
            category: "Growth & Branding",
            description: "Targeted digital marketing campaigns across Google Search, Meta Ads, and LinkedIn.",
            tag: "High ROI Guaranteed",
            turnaround: "Campaign launch within 48h",
            baseAmount: 25000,
            estimate: "₹25,000 / campaign",
            features: ["Multi-Channel Ad Spend Management", "Custom Landing Page Optimization", "Weekly Analytics & Attribution Reports", "A/B Creative Testing"],
          },
        ],
        skipDuplicates: true,
      });
      logger.info("[AUTO-SEED] Created default service catalogs.");
    }
  } catch (err: any) {
    logger.warn(`[AUTO-SEED] Auto-seed check skipped or encountered non-fatal error: ${err?.message || err}`);
  }
}
