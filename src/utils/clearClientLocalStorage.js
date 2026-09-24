/**
 * Clears all client-related cached data keys from localStorage
 */
export function clearClientLocalStorage() {
  if (typeof window === "undefined" || !window.localStorage) return;

  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key &&
      (key.startsWith("agni_pending_client_creations") ||
        key.startsWith("agni_pending_scheme_requests") ||
        key.startsWith("agni_client_doc_data_") ||
        key.startsWith("agni_verified_docs_") ||
        key.startsWith("agni_approved_client_plans_") ||
        key.startsWith("agni_client_doc_submitted_") ||
        key.startsWith("agni_client_eligible_schemes_") ||
        key.startsWith("agni_client_") ||
        key.startsWith("agni_invoices") ||
        key.startsWith("agni_sales_invoices") ||
        key.startsWith("agni_sales_payments") ||
        key.startsWith("agni_payment_demands") ||
        key.startsWith("agni_payment_") ||
        key.startsWith("agni_client_requests") ||
        key === "agni_sales_clients" ||
        key === "agni_branch_clients" ||
        key === "agni_clients" ||
        key === "agni_client_enrolled_schemes_db" ||
        key === "agni_all_agreements")
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
  window.dispatchEvent(new CustomEvent("agni_clients_updated"));
  window.dispatchEvent(new Event("agni_invoices_updated"));
  window.dispatchEvent(new Event("agni_payments_updated"));
  window.dispatchEvent(new Event("storage"));
}
