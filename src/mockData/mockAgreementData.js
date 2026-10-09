/**
 * Agni CRM — Agreement Module Data & Template Utilities
 * 
 * Central re-exports and status utilities delegating to agreementService.
 */

import {
  agreementService,
  AGREEMENT_STATUSES,
  TEMPLATE_TYPES,
  TEMPLATE_NAMES,
  TEMPLATE_FILES,
  agreementStatusBadgeColors,
  getTemplateTypeForService,
  normalizeAgreementData,
} from "../services/agreementService";

export {
  AGREEMENT_STATUSES,
  TEMPLATE_TYPES,
  TEMPLATE_NAMES,
  TEMPLATE_FILES,
  agreementStatusBadgeColors,
  getTemplateTypeForService,
  normalizeAgreementData,
};

export const initialAgreements = [
  normalizeAgreementData({
    id: "AGR-WZ-2026-001",
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
  }),
];

export async function loadAgreementsFromStorage() {
  return agreementService.getAgreements();
}

export function saveAgreementsToStorage(agreements) {
  // Managed by backend PostgreSQL agreement service
}
