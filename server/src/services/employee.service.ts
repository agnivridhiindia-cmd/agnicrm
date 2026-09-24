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

  // 5. Create the employee/user record
  const user = await prisma.user.create({
    data: {
      fullName: data.fullName.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone?.trim() || null,
      role: data.role,
      passwordHash,
      branchId: data.branchId || null,
      region: data.region?.trim() || null,
      reportingManagerId: data.reportingManagerId || null,
      status: "Active",
      isDeleted: false,
    },
    include: {
      branch: true,
      reportingManager: true,
    },
  });

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
        ? "Devika Shah (Owner)"
        : null,
      status: user.status,
      createdAt: user.createdAt,
      defaultPassword: DEFAULT_EMPLOYEE_PASSWORD,
    },
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
