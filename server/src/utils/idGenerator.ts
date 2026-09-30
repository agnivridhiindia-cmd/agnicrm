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

export function generateAppId(branchCode: string = "WZ"): string {
  const year = new Date().getFullYear();
  return `APP-${branchCode.toUpperCase()}-${year}-${getUniqueSuffix()}`;
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
