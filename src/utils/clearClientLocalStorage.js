/**
 * Clears all client-related, invoice-related, payment-related, and request cached data keys from localStorage
 */
export function clearClientLocalStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;

  const authKeepKeys = new Set([
    "agni_token",
    "agni_user",
    "agni_user_role",
    "agni_role",
    "agni_user_email",
    "agni_email",
    "agni_user_name",
    "agni_branch",
    "agni_theme",
    "agni_remember_me",
  ]);

  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (authKeepKeys.has(key)) continue;

    const lower = key.toLowerCase();
    if (
      lower.includes("client") ||
      lower.includes("invoice") ||
      lower.includes("payment") ||
      lower.includes("agreement") ||
      lower.includes("scheme") ||
      lower.includes("doc_data") ||
      lower.includes("verified_docs") ||
      lower.includes("demand") ||
      lower.includes("pending") ||
      lower.includes("request") ||
      lower.includes("dossier") ||
      lower.includes("melody") ||
      lower.startsWith("agni_sales_clients") ||
      lower.startsWith("agni_branch_clients") ||
      lower.startsWith("agni_clients")
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  try {
    window.dispatchEvent(new CustomEvent("agni_clients_updated"));
    window.dispatchEvent(new Event("agni_invoices_updated"));
    window.dispatchEvent(new Event("agni_payments_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {}
}
