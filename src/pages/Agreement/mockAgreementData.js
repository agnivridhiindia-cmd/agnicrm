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
} from "../../services/agreementService";

export {
  AGREEMENT_STATUSES,
  TEMPLATE_TYPES,
  TEMPLATE_NAMES,
  TEMPLATE_FILES,
  agreementStatusBadgeColors,
  getTemplateTypeForService,
  normalizeAgreementData,
};

export const initialAgreements = [];

export async function loadAgreementsFromStorage() {
  return agreementService.getAgreements();
}

export function saveAgreementsToStorage(agreements) {
  // Managed by backend PostgreSQL agreement service
}
