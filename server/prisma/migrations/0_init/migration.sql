-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'BRANCH_MANAGER', 'MANAGER', 'SALES_PERSON', 'IT', 'MARKETING', 'CLIENT');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('CERTIFICATE', 'CONSULTANCY', 'IT', 'MARKETING');

-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('ACTIVE', 'ONBOARDING', 'RENEWAL', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('EDIT_CLIENT', 'DELETE_CLIENT', 'TRANSFER_CLIENT', 'EDIT_EMPLOYEE', 'TRANSFER_EMPLOYEE', 'DELETE_EMPLOYEE', 'NEW_SERVICE', 'BUDGET_INCREASE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PAID', 'PARTIAL', 'PENDING', 'OVERDUE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('SUCCESS', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'GENERATED', 'SENT', 'SIGNED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING_APPROVAL', 'ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('PROFORMA', 'TAX');

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "targetRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "achievedRevenue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" TEXT,
    "reportingManagerId" TEXT,
    "originBranchId" TEXT,
    "initialManagerId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalog" (
    "id" TEXT NOT NULL,
    "serviceCode" TEXT NOT NULL,
    "categoryType" "ServiceType" NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tag" TEXT,
    "turnaround" TEXT,
    "baseAmount" DECIMAL(14,2) NOT NULL,
    "estimate" TEXT,
    "features" JSONB,
    "scopeDetails" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "appId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "serviceType" "ServiceType" NOT NULL,
    "serviceName" TEXT NOT NULL,
    "stage" "Stage" NOT NULL DEFAULT 'ACTIVE',
    "applicationStatus" TEXT NOT NULL DEFAULT 'CRM Creation',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "completedSteps" JSONB,
    "eligibleSchemes" JSONB,
    "dueDate" TIMESTAMP(3),
    "slaTier" TEXT NOT NULL DEFAULT 'Standard Retainer',
    "isDirectCreated" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "documentStatus" "DocumentStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "totalPayment" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentReceived" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "businessType" TEXT,
    "sector" TEXT,
    "companyAge" TEXT,
    "annualTurnover" DECIMAL(14,2),
    "fundingRequirement" DECIMAL(14,2),
    "companyDescription" TEXT,
    "fundingPurpose" TEXT,
    "gstNumber" TEXT,
    "aadharNumber" TEXT,
    "panNumber" TEXT,
    "msmeNumber" TEXT,
    "representativeName" TEXT,
    "contactNumber" TEXT,
    "companyPan" TEXT,
    "tanNumber" TEXT,
    "cinNumber" TEXT,
    "twelveARegNumber" TEXT,
    "eightyGCertNumber" TEXT,
    "darpanId" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deleteReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "branchId" TEXT,
    "salesPersonId" TEXT,
    "originalSalesPersonId" TEXT,
    "lastSalesPersonId" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_transfer_logs" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fromSalesPersonId" TEXT,
    "toSalesPersonId" TEXT,
    "fromBranchId" TEXT,
    "toBranchId" TEXT,
    "collectedBeforeTransfer" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "pendingAtTransfer" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_transfer_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_transfer_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromBranchId" TEXT,
    "toBranchId" TEXT,
    "fromManagerId" TEXT,
    "toManagerId" TEXT,
    "reason" TEXT,
    "transferredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_transfer_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_schemes" (
    "id" TEXT NOT NULL,
    "schemeCode" TEXT NOT NULL,
    "serviceType" "ServiceType" NOT NULL,
    "serviceName" TEXT NOT NULL,
    "stage" "Stage" NOT NULL DEFAULT 'ACTIVE',
    "applicationStatus" TEXT NOT NULL DEFAULT 'CRM Creation',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "completedSteps" JSONB,
    "pitchedAmount" DECIMAL(14,2) DEFAULT 0,
    "receivedAmount" DECIMAL(14,2) DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "client_schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "invoiceType" "InvoiceType" NOT NULL DEFAULT 'PROFORMA',
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paymentMode" "PaymentMode" NOT NULL,
    "rawAmount" DECIMAL(14,2) NOT NULL,
    "gstRate" DECIMAL(5,4) NOT NULL DEFAULT 0.18,
    "gstAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "rawTotal" DECIMAL(14,2) NOT NULL,
    "paymentReceived" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paymentPending" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gstNo" TEXT,
    "description" TEXT,
    "hsnSac" TEXT,
    "placeOfSupply" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "branchId" TEXT,
    "accountManagerId" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_documents" (
    "id" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentNumber" TEXT,
    "fileUrl" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'Pending Review',
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "client_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "requestCode" TEXT NOT NULL,
    "requestType" "RequestType" NOT NULL,
    "requestedChanges" JSONB,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "managerRemarks" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decisionDate" TIMESTAMP(3),
    "clientId" TEXT,
    "requesterId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "targetEntityType" TEXT DEFAULT 'CLIENT',
    "targetEntityId" TEXT,
    "currentStage" TEXT DEFAULT 'PENDING_SALES_MANAGER',
    "approvalChain" JSONB,
    "currentChainIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request_audits" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "request_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agreements" (
    "id" TEXT NOT NULL,
    "agreementCode" TEXT NOT NULL,
    "templateType" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "pitchedAmount" DECIMAL(14,2),
    "receivedAmount" DECIMAL(14,2),
    "leftAmount" DECIMAL(14,2),
    "successRate" TEXT,
    "docxFileUrl" TEXT,
    "pdfFileUrl" TEXT,
    "sentToEmail" TEXT,
    "sentAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "tone" TEXT,
    "issuer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "issuer" TEXT,
    "tone" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMode" "PaymentMode" NOT NULL,
    "referenceNumber" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "remarks" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deleted_employees" (
    "id" TEXT NOT NULL,
    "originalUserId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "branchId" TEXT,
    "branchName" TEXT,
    "region" TEXT,
    "reportingManager" TEXT,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedBy" TEXT DEFAULT 'Owner',
    "reason" TEXT,
    "totalClients" INTEGER NOT NULL DEFAULT 0,
    "totalSchemes" INTEGER NOT NULL DEFAULT 0,
    "totalPitchedAmount" DECIMAL(14,2) DEFAULT 0,
    "totalReceivedAmount" DECIMAL(14,2) DEFAULT 0,
    "clientsData" JSONB,
    "schemesData" JSONB,
    "servicesData" JSONB,
    "fullArchiveSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deleted_employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_branchId_idx" ON "users"("branchId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_isDeleted_idx" ON "users"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "service_catalog_serviceCode_key" ON "service_catalog"("serviceCode");

-- CreateIndex
CREATE UNIQUE INDEX "clients_appId_key" ON "clients"("appId");

-- CreateIndex
CREATE INDEX "clients_branchId_stage_idx" ON "clients"("branchId", "stage");

-- CreateIndex
CREATE INDEX "clients_salesPersonId_idx" ON "clients"("salesPersonId");

-- CreateIndex
CREATE INDEX "clients_originalSalesPersonId_idx" ON "clients"("originalSalesPersonId");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_approvalStatus_idx" ON "clients"("approvalStatus");

-- CreateIndex
CREATE INDEX "clients_documentStatus_idx" ON "clients"("documentStatus");

-- CreateIndex
CREATE INDEX "clients_isDeleted_idx" ON "clients"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "client_schemes_schemeCode_key" ON "client_schemes"("schemeCode");

-- CreateIndex
CREATE INDEX "client_schemes_clientId_idx" ON "client_schemes"("clientId");

-- CreateIndex
CREATE INDEX "client_schemes_isDeleted_idx" ON "client_schemes"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNo_key" ON "invoices"("invoiceNo");

-- CreateIndex
CREATE INDEX "invoices_clientId_idx" ON "invoices"("clientId");

-- CreateIndex
CREATE INDEX "invoices_branchId_idx" ON "invoices"("branchId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_isDeleted_idx" ON "invoices"("isDeleted");

-- CreateIndex
CREATE INDEX "client_documents_clientId_idx" ON "client_documents"("clientId");

-- CreateIndex
CREATE INDEX "client_documents_isDeleted_idx" ON "client_documents"("isDeleted");

-- CreateIndex
CREATE UNIQUE INDEX "requests_requestCode_key" ON "requests"("requestCode");

-- CreateIndex
CREATE INDEX "requests_clientId_idx" ON "requests"("clientId");

-- CreateIndex
CREATE INDEX "requests_requesterId_idx" ON "requests"("requesterId");

-- CreateIndex
CREATE INDEX "requests_reviewerId_idx" ON "requests"("reviewerId");

-- CreateIndex
CREATE INDEX "requests_status_idx" ON "requests"("status");

-- CreateIndex
CREATE INDEX "requests_currentStage_idx" ON "requests"("currentStage");

-- CreateIndex
CREATE INDEX "requests_targetEntityType_targetEntityId_idx" ON "requests"("targetEntityType", "targetEntityId");

-- CreateIndex
CREATE INDEX "request_audits_requestId_idx" ON "request_audits"("requestId");

-- CreateIndex
CREATE INDEX "request_audits_actorId_idx" ON "request_audits"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "agreements_agreementCode_key" ON "agreements"("agreementCode");

-- CreateIndex
CREATE INDEX "agreements_clientId_idx" ON "agreements"("clientId");

-- CreateIndex
CREATE INDEX "agreements_isDeleted_idx" ON "agreements"("isDeleted");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentId_key" ON "payments"("paymentId");

-- CreateIndex
CREATE INDEX "payments_clientId_idx" ON "payments"("clientId");

-- CreateIndex
CREATE INDEX "payments_invoiceId_idx" ON "payments"("invoiceId");

-- CreateIndex
CREATE INDEX "payments_isDeleted_idx" ON "payments"("isDeleted");

-- CreateIndex
CREATE INDEX "deleted_employees_originalUserId_idx" ON "deleted_employees"("originalUserId");

-- CreateIndex
CREATE INDEX "deleted_employees_email_idx" ON "deleted_employees"("email");

-- CreateIndex
CREATE INDEX "deleted_employees_deletedAt_idx" ON "deleted_employees"("deletedAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_salesPersonId_fkey" FOREIGN KEY ("salesPersonId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_originalSalesPersonId_fkey" FOREIGN KEY ("originalSalesPersonId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_lastSalesPersonId_fkey" FOREIGN KEY ("lastSalesPersonId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_transfer_logs" ADD CONSTRAINT "client_transfer_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_transfer_logs" ADD CONSTRAINT "employee_transfer_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_schemes" ADD CONSTRAINT "client_schemes_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "client_documents_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request_audits" ADD CONSTRAINT "request_audits_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agreements" ADD CONSTRAINT "agreements_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

