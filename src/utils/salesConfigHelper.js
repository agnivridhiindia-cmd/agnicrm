/**
 * Salesperson Profile & Quota Governance Helper
 * Manages salesperson designations (e.g. Sales Officer, Team Leader) and target quotas.
 * Updates are governed via Manager Requests -> Branch Manager Approval.
 */

export const PROFILE_TITLES = [
  "Sales Officer",
  "Senior Sales Officer",
  "Team Leader",
  "Junior Sales Officer",
  "Key Account Manager",
  "Business Development Associate",
];

function normalizeKey(val) {
  if (!val) return "";
  return String(val).toLowerCase().trim().replace(/[\s_]+/g, "_");
}

export function getSalesPersonProfile(nameOrId, fallback = "Senior Sales Officer") {
  if (!nameOrId) return fallback;
  const key = normalizeKey(nameOrId);
  try {
    const raw = localStorage.getItem(`agni_sales_profile_${key}`);
    if (raw && raw.trim()) return raw.trim();
  } catch (e) {}
  return fallback;
}

export function getSalesPersonQuota(nameOrId, fallback = null) {
  if (!nameOrId) return fallback;
  const key = normalizeKey(nameOrId);
  try {
    const raw = localStorage.getItem(`agni_sales_quota_${key}`);
    if (raw) {
      const num = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (e) {}
  return fallback;
}

export function saveSalesPersonConfig(nameOrId, { designation, quota }) {
  if (!nameOrId) return;
  const key = normalizeKey(nameOrId);
  try {
    if (designation !== undefined && designation !== null) {
      localStorage.setItem(`agni_sales_profile_${key}`, String(designation).trim());
    }
    if (quota !== undefined && quota !== null) {
      const num = parseFloat(String(quota).replace(/[^0-9.]/g, ""));
      if (!isNaN(num)) {
        localStorage.setItem(`agni_sales_quota_${key}`, String(num));
      }
    }
    window.dispatchEvent(new CustomEvent("agni_sales_config_updated", { detail: { nameOrId, designation, quota } }));
  } catch (e) {
    console.warn("Could not save salesperson config:", e);
  }
}
