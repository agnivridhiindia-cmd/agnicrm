/**
 * Agni CRM — Agreement Service
 * 
 * Clean frontend API abstraction for agreement lifecycle operations.
 * When the backend API is implemented, the internal mock methods can be replaced
 * with HTTP fetch/axios requests to endpoints like:
 *   - GET  /api/agreements
 *   - GET  /api/agreements/:id
 *   - POST /api/agreements/:id/generate
 *   - GET  /api/agreements/:id/preview
 *   - GET  /api/agreements/:id/download/docx
 *   - GET  /api/agreements/:id/download/pdf
 *   - POST /api/agreements/:id/send
 */

import { getCanonicalSchemeName, isPaymentDemandOrSettlement } from "../utils/schemeTracker";
import { apiFetch } from "./apiClient";

export const AGREEMENT_STATUSES = {
  PENDING: "Pending",
  GENERATING: "Generating",
  READY: "Ready",
  SENT: "Sent",
  FAILED: "Failed",
};

export const TEMPLATE_TYPES = {
  SCHEME: "SCHEME",
  PRIVATE_FUNDING: "PRIVATE_FUNDING",
};

export const TEMPLATE_NAMES = {
  SCHEME: "Common Scheme Agreement",
  PRIVATE_FUNDING: "Private Funding Agreement",
};

export const TEMPLATE_FILES = {
  SCHEME: "/templates/common_agreement.docx",
  PRIVATE_FUNDING: "/templates/private_funding.docx",
};

export const agreementStatusBadgeColors = {
  Pending: { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.3)" },
  Generating: { bg: "rgba(59, 130, 246, 0.12)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" },
  Ready: { bg: "rgba(168, 85, 247, 0.12)", color: "#c084fc", border: "rgba(168, 85, 247, 0.3)" },
  Sent: { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", border: "rgba(16, 185, 129, 0.3)" },
  Failed: { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)" },
};

/**
 * Determine template type from service name
 */
export function getTemplateTypeForService(serviceName) {
  if (!serviceName) return TEMPLATE_TYPES.SCHEME;
  const canonical = getCanonicalSchemeName(serviceName);
  return canonical.toLowerCase().includes("private funding")
    ? TEMPLATE_TYPES.PRIVATE_FUNDING
    : TEMPLATE_TYPES.SCHEME;
}

/**
 * Helper to generate and format unified Agreement Reference IDs
 * Format: AGR-YYYYMMDD-(continuing number from 500+, e.g. 501, 502...)
 */
export function formatAgreementRef(dateVal, seqNum = 501) {
  let yyyymmdd = "20260315";
  if (!dateVal) {
    const now = new Date();
    yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  } else {
    const str = String(dateVal);
    const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const slashMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (isoMatch) {
      yyyymmdd = `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`;
    } else if (slashMatch) {
      yyyymmdd = `${slashMatch[3]}${slashMatch[2]}${slashMatch[1]}`;
    } else {
      const parsed = new Date(dateVal);
      if (!isNaN(parsed.getTime())) {
        yyyymmdd = `${parsed.getFullYear()}${String(parsed.getMonth() + 1).padStart(2, "0")}${String(parsed.getDate()).padStart(2, "0")}`;
      }
    }
  }

  const num = typeof seqNum === "number" ? seqNum : parseInt(seqNum, 10) || 501;
  const finalNum = num < 500 ? 500 + num : num;

  return `AGR-${yyyymmdd}-${finalNum}`;
}

/**
 * Helper to normalize and ensure full backward/forward compatibility
 * between nested backend-ready schema and flat convenience getters.
 */
export function normalizeAgreementData(agr) {
  if (!agr) return null;

  const rawScheme = agr.scheme?.name || agr.scheme || agr.serviceType || "PMEGP";
  const schemeName = getCanonicalSchemeName(rawScheme);

  const isPrivate =
    agr.scheme?.type === TEMPLATE_TYPES.PRIVATE_FUNDING ||
    agr.templateType === TEMPLATE_TYPES.PRIVATE_FUNDING ||
    schemeName.toLowerCase().includes("private funding");

  const templateType = isPrivate ? TEMPLATE_TYPES.PRIVATE_FUNDING : TEMPLATE_TYPES.SCHEME;
  const templateName =
    agr.agreement?.templateName ||
    agr.templateName ||
    (isPrivate ? TEMPLATE_NAMES.PRIVATE_FUNDING : TEMPLATE_NAMES.SCHEME);

  const status = agr.agreement?.status || agr.status || AGREEMENT_STATUSES.READY;
  const agreementDate = agr.agreement?.date || agr.agreementDate || "";
  const appId = agr.applicationId || agr.appId || "";
  const clientId = agr.client?.id || agr.clientId || agr.crmId || "";
  const companyName = agr.client?.companyName || agr.companyName || "";
  const clientName = agr.client?.clientName || agr.clientName || companyName;
  const email = agr.client?.email || agr.email || "";
  const phone = agr.client?.phone || agr.phone || "";
  const address = agr.client?.address || agr.companyAddress || agr.address || "";

  const pricingPitched = agr.agreement?.pricing?.pitched ?? agr.pitchedMoney ?? "";
  const pricingReceived = agr.agreement?.pricing?.received ?? agr.paymentReceived ?? "";
  const pricingLeft = agr.agreement?.pricing?.left ?? agr.paymentLeft ?? "";
  const pricingRate = agr.agreement?.pricing?.successRate ?? agr.disbursementRate ?? "";

  const docxUrl =
    agr.documents?.docxUrl ||
    agr.docxUrl ||
    (isPrivate ? TEMPLATE_FILES.PRIVATE_FUNDING : TEMPLATE_FILES.SCHEME);
  const pdfUrl = agr.documents?.pdfUrl || agr.pdfUrl || null;

  // Enforce global agreement ref format: AGR-YYYYMMDD-###
  let agreementId = agr.id;
  if (!agreementId || !/^AGR-\d{8}-\d+$/.test(agreementId)) {
    let extractedNum = 501;
    const matchSuffix = String(agreementId || "").match(/(\d+)$/);
    if (matchSuffix) {
      extractedNum = parseInt(matchSuffix[1], 10) || 501;
    }
    agreementId = formatAgreementRef(agreementDate || agr.createdAt || agr.date, extractedNum);
  }

  return {
    id: agreementId,
    applicationId: appId,
    appId: appId,
    clientId: clientId,
    crmId: clientId,

    client: {
      id: clientId,
      companyName: companyName,
      clientName: clientName,
      email: email,
      phone: phone,
      address: address,
      // Payment amounts from client record (used as fallback in docxService when agreement pricing is empty)
      totalPayment: agr.client?.totalPayment ?? agr.totalPayment ?? agr.amount ?? null,
      paymentReceived: agr.client?.paymentReceived ?? agr.paymentReceived ?? null,
      amount: agr.client?.amount ?? agr.amount ?? null,
    },

    // Convenience flat properties for legacy components
    companyName: companyName,
    clientName: clientName,
    email: email,
    phone: phone,
    companyAddress: address,
    address: address,

    scheme: {
      name: schemeName,
      type: templateType,
    },
    serviceType: schemeName,

    agreement: {
      templateName: templateName,
      templateType: templateType,
      status: status,
      date: agreementDate,
      pricing: {
        pitched: pricingPitched,
        received: pricingReceived,
        left: pricingLeft,
        successRate: pricingRate,
      },
    },

    // Flat compatibility fields
    templateName: templateName,
    templateType: templateType,
    status: status,
    agreementDate: agreementDate,
    pitchedMoney: pricingPitched,
    paymentReceived: pricingReceived,
    paymentLeft: pricingLeft,
    disbursementRate: pricingRate,

    documents: {
      docxUrl: docxUrl,
      pdfUrl: pdfUrl,
    },
    docxUrl: docxUrl,
    pdfUrl: pdfUrl,

    createdAt: agr.createdAt || new Date().toISOString().replace("T", " ").substring(0, 16),
    sentAt: agr.sentAt || null,
    sentTo: agr.sentTo || null,
  };
}

// Initial backend-ready mock data
const initialMockAgreements = [
  {
    id: "AGR-20260805-501",
    applicationId: "CRM-2026-001",
    client: {
      id: "1",
      companyName: "Reliance Retail Ltd",
      clientName: "Reliance Mart",
      email: "contact@reliancemart.in",
      phone: "+91 98765 43210",
      address: "101 MG Road, Fort, Mumbai, Maharashtra 400001",
    },
    scheme: {
      name: "PMEGP",
      type: TEMPLATE_TYPES.SCHEME,
    },
    agreement: {
      templateName: TEMPLATE_NAMES.SCHEME,
      status: AGREEMENT_STATUSES.SENT,
      date: "05/08/2026",
      pricing: {
        pitched: "₹50,000",
        received: "₹20,000",
        left: "₹30,000",
        successRate: "5%",
      },
    },
    documents: {
      docxUrl: TEMPLATE_FILES.SCHEME,
      pdfUrl: null,
    },
    createdAt: "2026-08-05 11:30",
    sentAt: "2026-08-05 14:15",
    sentTo: "contact@reliancemart.in",
  },
].map(normalizeAgreementData);

let inMemoryAgreementsCache = initialMockAgreements;

function loadFromStorage() {
  return inMemoryAgreementsCache;
}

function saveToStorage(list) {
  inMemoryAgreementsCache = list;
}

export function getAuthHeaders() {
  const token = localStorage.getItem("agni_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Main Agreement Service API Abstraction
 */
export const agreementService = {
  /**
   * Fetch all agreements from PostgreSQL backend API
   * GET /api/v1/agreements
   */
  async getAgreements() {
    try {
      const res = await apiFetch("/agreements", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data.map(normalizeAgreementData);
        }
      }
    } catch (e) {
      console.warn("Backend agreement API query failed", e);
    }
    return [];
  },

  /**
   * Fetch a single agreement by ID
   * GET /api/v1/agreements/:id
   */
  async getAgreement(id) {
    try {
      const res = await apiFetch(`/agreements/${encodeURIComponent(id)}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return normalizeAgreementData(json.data);
        }
      }
    } catch (e) {
      console.warn(`Backend API getAgreement("${id}") unavailable:`, e);
    }

    const all = loadFromStorage();
    const found = all.find((a) => a.id === id || a.applicationId === id || a.clientId === id);
    if (!found) {
      throw new Error(`Agreement with ID "${id}" not found.`);
    }
    return normalizeAgreementData(found);
  },

  /**
   * Request agreement generation from the backend
   * POST /api/v1/agreements/generate
   */
  async generateAgreement({
    client,
    agreementDate,
    companyName,
    companyAddress,
    pitchedMoney,
    paymentReceived,
    paymentLeft,
    disbursementRate,
    templateType,
    existingCount = 0,
  }) {
    const payload = {
      clientId: client?.id || client?.appId,
      clientEmail: client?.email,
      companyName: companyName || client?.company || client?.name,
      companyAddress: companyAddress || client?.address,
      agreementDate,
      pitchedMoney,
      paymentReceived,
      paymentLeft,
      disbursementRate,
      scheme: client?.scheme || client?.serviceName,
      templateType,
    };

    try {
      const res = await apiFetch("/agreements/generate", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const newAgr = normalizeAgreementData(json.data);
          const all = loadFromStorage();
          const filtered = all.filter((a) => a.id !== newAgr.id && a.clientId !== newAgr.clientId);
          saveToStorage([newAgr, ...filtered]);
          return newAgr;
        }
      }
    } catch (e) {
      console.warn("Backend generate agreement API unavailable, processing locally:", e);
    }

    // Local fallback generation
    await new Promise((r) => setTimeout(r, 400));
    const isPrivate = templateType === TEMPLATE_TYPES.PRIVATE_FUNDING;
    const templateName = isPrivate ? TEMPLATE_NAMES.PRIVATE_FUNDING : TEMPLATE_NAMES.SCHEME;
    const templateFile = isPrivate ? TEMPLATE_FILES.PRIVATE_FUNDING : TEMPLATE_FILES.SCHEME;

    const nextNum = 500 + existingCount + 1;
    const now = new Date();
    const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const agreementId = `AGR-${yyyymmdd}-${nextNum}`;
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);

    const newAgreement = normalizeAgreementData({
      id: agreementId,
      applicationId: client?.appId || `CRM-${new Date().getFullYear()}-${String(client?.id || nextNum).padStart(3, "0")}`,
      client: {
        id: client?.id || String(nextNum),
        companyName: companyName || client?.company || client?.name || "",
        clientName: client?.name || companyName || "",
        email: client?.email || "client@company.com",
        phone: client?.phone || "",
        address: companyAddress || client?.address || "Corporate Office",
      },
      scheme: {
        name: client?.scheme || client?.serviceName || "PMEGP",
        type: isPrivate ? TEMPLATE_TYPES.PRIVATE_FUNDING : TEMPLATE_TYPES.SCHEME,
      },
      agreement: {
        templateName: templateName,
        status: AGREEMENT_STATUSES.READY,
        date: agreementDate || nowStr.split(" ")[0],
        pricing: {
          pitched: pitchedMoney,
          received: paymentReceived,
          left: paymentLeft,
          successRate: disbursementRate,
        },
      },
      documents: {
        docxUrl: templateFile,
        pdfUrl: null,
      },
      createdAt: nowStr,
      sentAt: null,
      sentTo: null,
    });

    const all = loadFromStorage();
    const filtered = all.filter((a) => a.id !== newAgreement.id && a.clientId !== newAgreement.clientId);
    const updated = [newAgreement, ...filtered];
    saveToStorage(updated);

    return newAgreement;
  },

  /**
   * Fetch agreement preview metadata
   */
  async getAgreementPreview(agreementId) {
    const agr = await this.getAgreement(agreementId);
    return {
      id: agr.id,
      pdfUrl: agr.documents?.pdfUrl || null,
      docxUrl: agr.documents?.docxUrl || null,
      isGenerated: agr.agreement?.status === AGREEMENT_STATUSES.READY || agr.agreement?.status === AGREEMENT_STATUSES.SENT,
      templateName: agr.agreement?.templateName,
      status: agr.agreement?.status,
    };
  },

  /**
   * Download DOCX file
   */
  async downloadAgreementDocx(agreementId, customFilename) {
    const agr = await this.getAgreement(agreementId);
    try {
      const { downloadDocxFile } = await import("../pages/Agreement/docxService");
      return downloadDocxFile(agr, customFilename);
    } catch (e) {
      console.warn("Falling back to static download", e);
      const filename =
        customFilename ||
        `${(agr.client?.companyName || "Agreement").replace(/[^a-zA-Z0-9_-]/g, "_")}_${agr.id}.docx`;

      const docxUrl = agr.documents?.docxUrl || TEMPLATE_FILES.SCHEME;

      const link = document.createElement("a");
      link.href = docxUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, filename };
    }
  },

  /**
   * Download PDF file
   */
  async downloadAgreementPdf(agreementId, customFilename) {
    const agr = await this.getAgreement(agreementId);
    try {
      const { downloadPdfFile } = await import("../pages/Agreement/docxService");
      return downloadPdfFile(agr, customFilename);
    } catch (e) {
      console.warn("Error triggering PDF download:", e);
      return {
        success: false,
        message: e.message,
      };
    }
  },

  /**
   * Dispatch agreement to client
   * POST /api/v1/agreements/:id/send
   */
  async sendAgreement(agreementId, recipientEmail) {
    try {
      const res = await apiFetch(`/agreements/${encodeURIComponent(agreementId)}/send`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipientEmail }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const updatedAgr = normalizeAgreementData(json.data);
          const all = loadFromStorage();
          const updatedList = all.map((item) => (item.id === updatedAgr.id ? updatedAgr : item));
          saveToStorage(updatedList);
          return updatedAgr;
        }
      }
    } catch (e) {
      console.warn("Backend send agreement API unavailable, processing locally:", e);
    }

    // Local fallback send
    await new Promise((r) => setTimeout(r, 200));
    const all = loadFromStorage();
    const target = all.find((a) => a.id === agreementId);

    if (!target) {
      throw new Error(`Agreement "${agreementId}" not found to send.`);
    }

    const emailToSend = recipientEmail || target.client?.email || "client@company.com";
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);

    const updatedAgr = normalizeAgreementData({
      ...target,
      agreement: {
        ...target.agreement,
        status: AGREEMENT_STATUSES.SENT,
      },
      status: AGREEMENT_STATUSES.SENT,
      sentAt: nowStr,
      sentTo: emailToSend,
    });

    const updatedList = all.map((item) => (item.id === agreementId ? updatedAgr : item));
    saveToStorage(updatedList);

    return updatedAgr;
  },

  /**
   * Auto-create and dispatch agreement directly to client email during CRM creation
   */
  async createAndSendAgreementForClient(clientRecord) {
    if (!clientRecord) return null;
    const recipientEmail = clientRecord.email || clientRecord.clientEmail || "client@company.com";
    try {
      const generated = await this.generateAgreement({
        client: {
          id: clientRecord.id || clientRecord.appId || `CL-${Date.now()}`,
          appId: clientRecord.appId || `AGNI-${Date.now()}`,
          name: clientRecord.name || clientRecord.contactPerson || clientRecord.company || "Client",
          company: clientRecord.company || clientRecord.name || "Client Enterprise",
          email: recipientEmail,
          phone: clientRecord.phone || "",
          address: clientRecord.address || "Main Office",
        },
        companyName: clientRecord.company || clientRecord.name || "Client Enterprise",
        companyAddress: clientRecord.address || "Main Office",
        pitchedMoney: clientRecord.totalPayment || clientRecord.amount || "0",
        paymentReceived: clientRecord.paymentReceived || "0",
        paymentLeft: clientRecord.paymentPending || "0",
        disbursementRate: "10%",
        scheme: clientRecord.scheme || clientRecord.serviceType || "PMEGP",
      });

      return await this.sendAgreement(generated.id, recipientEmail);
    } catch (err) {
      console.warn("Could not auto-dispatch agreement on CRM creation:", err);
      return null;
    }
  },

  /**
   * Retry failed agreement generation
   */
  async retryGeneration(agreementId) {
    const agr = await this.getAgreement(agreementId);
    return this.generateAgreement({
      client: {
        id: agr.clientId,
        appId: agr.applicationId,
        name: agr.client?.clientName,
        company: agr.client?.companyName,
        email: agr.client?.email,
        phone: agr.client?.phone,
        address: agr.client?.address,
      },
      agreementDate: agr.agreement?.date,
      companyName: agr.client?.companyName,
      companyAddress: agr.client?.address,
      pitchedMoney: agr.agreement?.pricing?.pitched,
      paymentReceived: agr.agreement?.pricing?.received,
      paymentLeft: agr.agreement?.pricing?.left,
      disbursementRate: agr.agreement?.pricing?.successRate,
      templateType: agr.scheme?.type,
    });
  },
};

export default agreementService;
