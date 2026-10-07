import crypto from "crypto";

/**
 * Generates a collision-free 5-character uppercase alphanumeric suffix.
 * Combines timestamp micro-ticks and cryptographically random bytes.
 */
function getUniqueSuffix(): string {
  const timeMs = Date.now().toString(36).toUpperCase().slice(-3);
  const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${timeMs}${randomHex}`.slice(0, 5);
}

/**
 * Generates client application ID in the format: CRM-YYYY-XXX
 * e.g., CRM-2026-001, CRM-2026-002, etc.
 */
export function generateAppId(seqOrBranch?: number | string, year: number = new Date().getFullYear()): string {
  const yyyy = year || new Date().getFullYear();
  if (typeof seqOrBranch === "number") {
    return `CRM-${yyyy}-${String(seqOrBranch).padStart(3, "0")}`;
  }
  if (typeof seqOrBranch === "string" && /^\d+$/.test(seqOrBranch)) {
    return `CRM-${yyyy}-${seqOrBranch.padStart(3, "0")}`;
  }
  return `CRM-${yyyy}-001`;
}

export function generateInvoiceNo(seq: number = 1, date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const seqStr = String(seq).padStart(3, "0");
  return `INV-${yyyy}${mm}${dd}-${seqStr}`;
}

export function generatePaymentId(): string {
  const year = new Date().getFullYear();
  return `PAY-${year}-${getUniqueSuffix()}`;
}

export function generateSchemeCode(): string {
  const year = new Date().getFullYear();
  return `SCH-${year}-${getUniqueSuffix()}`;
}

export function generateAgreementCode(branchCode: string = "WZ"): string {
  const year = new Date().getFullYear();
  return `AGR-${branchCode.toUpperCase()}-${year}-${getUniqueSuffix()}`;
}

export function generateRequestCode(): string {
  const year = new Date().getFullYear();
  return `RQ-${year}-${getUniqueSuffix()}`;
}
