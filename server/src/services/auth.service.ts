import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { ENV } from "../config/env";

export interface LoginParams {
  email: string;
  password: string;
}

export async function loginUser({ email, password }: LoginParams) {
  const user = await prisma.user.findFirst({
    where: { email, isDeleted: false },
    include: { branch: true },
  });

  if (!user) {
    return { success: false, statusCode: 401, message: "Invalid email or password." };
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return { success: false, statusCode: 401, message: "Invalid email or password." };
  }

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
  };

  // 15-minute access token
  const token = jwt.sign(payload, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  // 7-day refresh token
  const refreshToken = jwt.sign(payload, ENV.JWT_REFRESH_SECRET, {
    expiresIn: ENV.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

  return {
    success: true,
    statusCode: 200,
    message: "Login successful.",
    token,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      region: user.region,
      branch: user.branch ? { id: user.branch.id, code: user.branch.code, name: user.branch.name } : null,
    },
  };
}

export async function refreshAccessTokenService(refreshTokenInput: string) {
  if (!refreshTokenInput) {
    return { success: false, statusCode: 400, message: "Refresh token is required." };
  }

  try {
    const decoded = jwt.verify(refreshTokenInput, ENV.JWT_REFRESH_SECRET) as any;
    const user = await prisma.user.findFirst({
      where: { id: decoded.userId, isDeleted: false },
    });

    if (!user) {
      return { success: false, statusCode: 401, message: "Invalid session or user deactivated." };
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    };

    const newAccessToken = jwt.sign(payload, ENV.JWT_SECRET, {
      expiresIn: ENV.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    return {
      success: true,
      statusCode: 200,
      token: newAccessToken,
    };
  } catch (error) {
    return { success: false, statusCode: 401, message: "Invalid or expired refresh token." };
  }
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, isDeleted: false },
    include: { branch: true },
  });

  if (!user) {
    return { success: false, statusCode: 404, message: "User not found." };
  }

  return {
    success: true,
    statusCode: 200,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      region: user.region,
      branch: user.branch ? { id: user.branch.id, code: user.branch.code, name: user.branch.name } : null,
    },
  };
}

export interface GetUsersQuery {
  role?: string;
  branchId?: string;
}

export async function getUsersService({ role, branchId }: GetUsersQuery) {
  const whereClause: any = { isDeleted: false };
  if (role) {
    whereClause.role = String(role);
  } else {
    whereClause.role = { notIn: ["CLIENT", "OWNER"] };
  }
  if (branchId) {
    whereClause.branchId = String(branchId);
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    include: {
      branch: true,
      salesClients: { where: { isDeleted: false } },
    },
    orderBy: { fullName: "asc" },
  });

  const formattedUsers = users.map((u) => {
    let roleLabel: string = u.role;
    if (u.role === "SALES_PERSON") roleLabel = "Sales Person";
    else if (u.role === "BRANCH_MANAGER") roleLabel = "Branch Manager";
    else if (u.role === "MANAGER") roleLabel = "Sales Manager";
    else if (u.role === "ADMIN") roleLabel = "Admin Lead";

    return {
      id: u.id,
      name: u.fullName,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone || "N/A",
      role: roleLabel,
      rawRole: u.role,
      branch: u.branch ? u.branch.name : (u.region || "West Zone (Mumbai)"),
      branchId: u.branchId,
      status: u.status || "Active",
      assignedClients: u.salesClients ? u.salesClients.length : 0,
    };
  });

  function getRoleRank(roleInput: string): number {
    if (!roleInput) return 99;
    const r = String(roleInput).toUpperCase().trim().replace(/[\s_]+/g, "_");
    if (r === "BRANCH_MANAGER" || r.includes("BRANCH")) return 1;
    if (r === "MANAGER" || r === "SALES_MANAGER" || (r.includes("MANAGER") && !r.includes("BRANCH"))) return 2;
    if (r === "IT" || r.startsWith("IT_") || r.endsWith("_IT")) return 3;
    if (r === "ADMIN" || r.includes("ADMIN")) return 4;
    if (r === "MARKETING" || r === "MARKET" || r.includes("MARKET")) return 5;
    if (r === "SALES_PERSON" || r === "SALES" || r.includes("SALES")) return 6;
    return 99;
  }

  formattedUsers.sort((a, b) => {
    const rankA = getRoleRank(a.rawRole || a.role);
    const rankB = getRoleRank(b.rawRole || b.role);
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    return (a.fullName || a.name || "").localeCompare(b.fullName || b.name || "");
  });

  return {
    success: true,
    statusCode: 200,
    users: formattedUsers,
  };
}
