import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { Role } from "@prisma/client";

export interface CreateEmployeeParams {
  fullName: string;
  email: string;
  phone?: string;
  role: Role;
  branchId?: string;
  region?: string;
  reportingManagerId?: string;
}

const DEFAULT_EMPLOYEE_PASSWORD = "password123";

export async function createEmployeeService(data: CreateEmployeeParams) {
  // 1. Validate role — cannot create OWNER or CLIENT via this route
  if (data.role === "OWNER" || data.role === "CLIENT") {
    return {
      success: false,
      statusCode: 400,
      message: "Cannot create an employee with role OWNER or CLIENT.",
    };
  }

  // 2. Check for duplicate email
  const existing = await prisma.user.findFirst({
    where: { email: data.email.toLowerCase().trim(), isDeleted: false },
  });
  if (existing) {
    return {
      success: false,
      statusCode: 409,
      message: `An active user with email "${data.email}" already exists.`,
    };
  }

  // 3. Validate branchId exists (if provided)
  if (data.branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: data.branchId } });
    if (!branch) {
      return {
        success: false,
        statusCode: 404,
        message: "The specified branch does not exist.",
      };
    }
  }

  // 4. Hash the default password
  const passwordHash = await bcrypt.hash(DEFAULT_EMPLOYEE_PASSWORD, 10);

  // 4b. Dynamically look up Owner and Primary Branch for Branch Manager
  const dbOwner = await prisma.user.findFirst({
    where: { role: "OWNER", isDeleted: false },
    select: { id: true, fullName: true },
  });

  let effectiveReportingManagerId = data.reportingManagerId || null;
  let effectiveBranchId = data.branchId || null;
  let effectiveRegion = data.region?.trim() || null;

  if (data.role === "BRANCH_MANAGER") {
    if (!effectiveReportingManagerId && dbOwner) {
      effectiveReportingManagerId = dbOwner.id;
    }
    if (!effectiveBranchId) {
      const primaryBranch = await prisma.branch.findFirst({ where: { status: "Active" } });
      if (primaryBranch) {
        effectiveBranchId = primaryBranch.id;
        if (!effectiveRegion) effectiveRegion = primaryBranch.region;
      }
    }
  }

  // 5. Create the employee/user record
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim() || null,
      role: data.role,
      passwordHash,
      branchId: effectiveBranchId,
      region: effectiveRegion,
      reportingManagerId: effectiveReportingManagerId,
      status: "Active",
      isDeleted: false,
    },
    include: {
      branch: true,
      reportingManager: true,
    },
  });

  const ownerLabel = dbOwner ? `${dbOwner.fullName} (Owner)` : "Owner";

  return {
    success: true,
    statusCode: 201,
    message: `Employee "${user.fullName}" created successfully. Default login password is "${DEFAULT_EMPLOYEE_PASSWORD}".`,
    employee: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      branch: user.branch ? { id: user.branch.id, name: user.branch.name, code: user.branch.code } : null,
      region: user.region,
      reportingManager: user.reportingManager
        ? user.reportingManager.fullName
        : user.role === "BRANCH_MANAGER"
        ? ownerLabel
        : null,
      status: user.status,
      createdAt: user.createdAt,
      defaultPassword: DEFAULT_EMPLOYEE_PASSWORD,
    },
  };
}

export interface CreateBranchParams {
  name: string;
  city?: string;
  region?: string;
  code?: string;
}

export async function createBranchService(data: CreateBranchParams) {
  const name = data.name.trim();
  if (!name) {
    return {
      success: false,
      statusCode: 400,
      message: "Branch name is required.",
    };
  }

  const existing = await prisma.branch.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    return {
      success: true,
      statusCode: 200,
      message: `Branch "${existing.name}" already exists.`,
      branch: existing,
    };
  }

  const cleanPrefix = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase() || "BR";
  const count = await prisma.branch.count();
  let code = data.code?.trim().toUpperCase() || `${cleanPrefix}-${String(count + 1).padStart(2, "0")}`;
  const codeExists = await prisma.branch.findUnique({ where: { code } });
  if (codeExists) {
    code = `${cleanPrefix}-${Date.now().toString().slice(-4)}`;
  }

  const branch = await prisma.branch.create({
    data: {
      name,
      city: data.city?.trim() || name,
      region: data.region?.trim() || name,
      code,
    },
  });

  return {
    success: true,
    statusCode: 201,
    message: `Branch "${branch.name}" created successfully.`,
    branch,
  };
}

export async function getBranchesService() {
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, code: true, city: true, region: true },
  });
  return {
    success: true,
    statusCode: 200,
    branches,
  };
}

export async function deleteEmployeeService(
  employeeId: string,
  deletedBy = "Owner",
  reason?: string
) {
  // 1. Locate user
  const user = await prisma.user.findUnique({
    where: { id: employeeId },
    include: {
      branch: true,
      reportingManager: true,
    },
  });

  if (!user) {
    return {
      success: false,
      statusCode: 404,
      message: "Employee not found.",
    };
  }

  if (user.role === "OWNER") {
    return {
      success: false,
      statusCode: 400,
      message: "Cannot delete the company Owner account.",
    };
  }

  if (user.isDeleted) {
    return {
      success: false,
      statusCode: 400,
      message: "Employee has already been soft deleted.",
    };
  }

  // 2. Fetch all clients, schemes, and services registered under this employee
  const clients = await prisma.client.findMany({
    where: {
      salesPersonId: user.id,
    },
    include: {
      schemes: true,
      invoices: true,
      payments: true,
    },
  });

  const allSchemes = clients.flatMap((c) => c.schemes || []);
  const servicesList = Array.from(
    new Set(
      allSchemes
        .map((s) => s.serviceName || s.serviceType)
        .concat(clients.map((c) => c.serviceName || c.serviceType).filter(Boolean))
    )
  ).filter(Boolean);

  const totalClients = clients.length;
  const totalSchemes = allSchemes.length;
  const totalPitched = allSchemes.reduce((acc, s) => acc + Number(s.pitchedAmount || 0), 0);
  const totalReceived = allSchemes.reduce((acc, s) => acc + Number(s.receivedAmount || 0), 0);

  // 3. Save full snapshot in the DeletedEmployee database section / table
  const archived = await (prisma as any).deletedEmployee.create({
    data: {
      originalUserId: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || null,
      role: user.role,
      branchId: user.branchId || null,
      branchName: user.branch ? user.branch.name : null,
      region: user.region || user.branch?.region || null,
      reportingManager: user.reportingManager ? user.reportingManager.fullName : null,
      deletedAt: new Date(),
      deletedBy: deletedBy || "Owner",
      reason: reason || "Soft-deleted by Owner",
      totalClients,
      totalSchemes,
      totalPitchedAmount: totalPitched,
      totalReceivedAmount: totalReceived,
      clientsData: clients.map((c) => ({
        id: c.id,
        appId: c.appId,
        name: c.name,
        companyName: c.companyName,
        email: c.email,
        phone: c.phone,
        stage: c.stage,
        serviceType: c.serviceType,
        serviceName: c.serviceName,
        applicationStatus: c.applicationStatus,
        totalPayment: c.totalPayment,
        paymentReceived: c.paymentReceived,
        businessType: c.businessType,
        sector: c.sector,
        schemesCount: c.schemes?.length || 0,
      })),
      schemesData: allSchemes.map((s) => ({
        id: s.id,
        clientId: s.clientId,
        schemeCode: s.schemeCode,
        serviceName: s.serviceName,
        serviceType: s.serviceType,
        stage: s.stage,
        applicationStatus: s.applicationStatus,
        progressPercent: s.progressPercent,
        pitchedAmount: s.pitchedAmount,
        receivedAmount: s.receivedAmount,
      })),
      servicesData: servicesList,
      fullArchiveSnapshot: {
        archivedAt: new Date().toISOString(),
        deletedBy,
        employeeDetails: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          branch: user.branch,
          region: user.region,
          createdAt: user.createdAt,
        },
        metrics: {
          totalClients,
          totalSchemes,
          totalPitchedAmount: totalPitched,
          totalReceivedAmount: totalReceived,
          distinctServices: servicesList,
        },
      },
    },
  });

  // 4. Mark the user as soft-deleted in User table
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      status: "Deleted",
    },
  });

  return {
    success: true,
    statusCode: 200,
    message: `Employee "${user.fullName}" soft-deleted successfully. All ${totalClients} client(s) and ${totalSchemes} scheme(s) have been preserved in the Deleted Employees database section.`,
    archived,
  };
}

export async function getDeletedEmployeesService() {
  const deletedEmployees = await (prisma as any).deletedEmployee.findMany({
    orderBy: { deletedAt: "desc" },
  });

  return {
    success: true,
    statusCode: 200,
    deletedEmployees,
  };
}

export async function restoreEmployeeService(employeeId: string) {
  const user = await prisma.user.findUnique({ where: { id: employeeId } });
  if (!user) {
    return { success: false, statusCode: 404, message: "Employee not found." };
  }

  await prisma.user.update({
    where: { id: employeeId },
    data: {
      isDeleted: false,
      deletedAt: null,
      status: "Active",
    },
  });

  return {
    success: true,
    statusCode: 200,
    message: `Employee "${user.fullName}" restored to active status.`,
  };
}

export async function getTeamHierarchyService() {
  const branches = await prisma.branch.findMany({
    orderBy: { name: "asc" },
    include: {
      users: {
        where: { isDeleted: false },
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          branchId: true,
          reportingManagerId: true,
          reportingManager: {
            select: { id: true, fullName: true, email: true, phone: true, role: true },
          },
        },
      },
    },
  });

  const hierarchy = branches.map((b) => {
    const branchManager = b.users.find((u) => u.role === Role.BRANCH_MANAGER) || null;
    const salesManager = b.users.find((u) => u.role === Role.MANAGER) || null;
    const salesPersons = b.users.filter((u) => u.role === Role.SALES_PERSON);
    const admins = b.users.filter((u) => u.role === Role.ADMIN);
    const adminLead = admins[0] || null;

    return {
      id: b.id,
      name: b.name,
      code: b.code,
      region: b.region,
      city: b.city,
      users: b.users.map((u) => ({
        id: u.id,
        name: u.fullName,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
      })),
      admins: admins.map((a) => ({
        id: a.id,
        name: a.fullName,
        fullName: a.fullName,
        email: a.email,
        phone: a.phone,
      })),
      adminLead: adminLead
        ? { id: adminLead.id, name: adminLead.fullName, email: adminLead.email, phone: adminLead.phone }
        : null,
      branchManager: branchManager
        ? { id: branchManager.id, name: branchManager.fullName, email: branchManager.email, phone: branchManager.phone }
        : null,
      salesManager: salesManager
        ? { id: salesManager.id, name: salesManager.fullName, email: salesManager.email, phone: salesManager.phone }
        : null,
      salesPersons: salesPersons.map((s) => ({
        id: s.id,
        name: s.fullName,
        email: s.email,
        phone: s.phone,
        reportingManager: s.reportingManager
          ? { id: s.reportingManager.id, name: s.reportingManager.fullName, email: s.reportingManager.email, phone: s.reportingManager.phone }
          : salesManager
          ? { id: salesManager.id, name: salesManager.fullName, email: salesManager.email, phone: salesManager.phone }
          : null,
      })),
    };
  });

  return {
    success: true,
    statusCode: 200,
    hierarchy,
    data: hierarchy,
  };
}
