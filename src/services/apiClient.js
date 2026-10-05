// Centralized API Client for Agni CRM
// Supports environment variable VITE_API_BASE_URL with automatic fallback to localhost/127.0.0.1,
// automatic Bearer token injection, and global API failure toast event dispatching.

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/+$/, "");

/**
 * Normalizes an endpoint path or full URL relative to API_BASE_URL
 */
export function getApiUrl(endpoint = "") {
  if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

/**
 * Universal API fetch helper
 */
export async function apiFetch(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const token = localStorage.getItem("agni_token");

  const headers = {
    ...(options.headers || {}),
  };

  if (token && !headers.Authorization && !headers.authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Handle JSON body automatically if body is a non-FormData object or JSON string
  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData) && !(body instanceof Blob)) {
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
    body = JSON.stringify(body);
  } else if (typeof body === "string" && (body.trim().startsWith("{") || body.trim().startsWith("["))) {
    if (!headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }
  }

  const timeoutMs = options.timeout !== undefined ? options.timeout : 45000;
  let customSignal = options.signal;
  let timeoutController = null;
  let timeoutId = null;

  if (!customSignal && timeoutMs > 0) {
    timeoutController = new AbortController();
    timeoutId = setTimeout(() => {
      timeoutController.abort(new DOMException("Request timed out", "TimeoutError"));
    }, timeoutMs);
  }

  const fetchOptions = {
    ...options,
    headers,
    body,
    signal: customSignal || (timeoutController ? timeoutController.signal : undefined),
  };

  let response;
  let fetchError = null;

  try {
    try {
      response = await fetch(url, fetchOptions);
    } catch (err) {
      fetchError = err;
      const isTimeout = err.name === "TimeoutError" || err.name === "AbortError";
      // Attempt localhost -> 127.0.0.1 or vice-versa fallback only if not timed out
      if (!isTimeout) {
        if (url.includes("localhost:5000")) {
          const fallbackUrl = url.replace("localhost:5000", "127.0.0.1:5000");
          try {
            response = await fetch(fallbackUrl, fetchOptions);
            fetchError = null;
          } catch (fallbackErr) {
            fetchError = fallbackErr;
          }
        } else if (url.includes("127.0.0.1:5000")) {
          const fallbackUrl = url.replace("127.0.0.1:5000", "localhost:5000");
          try {
            response = await fetch(fallbackUrl, fetchOptions);
            fetchError = null;
          } catch (fallbackErr) {
            fetchError = fallbackErr;
          }
        }
      }
    }
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }

  if (fetchError) {
    const isTimeout = fetchError.name === "TimeoutError" || fetchError.name === "AbortError";
    const errorMsg = isTimeout
      ? "Request timeout: Agni CRM API server took too long to respond."
      : (fetchError.message || "Network error: Unable to reach Agni CRM API server.");
    window.dispatchEvent(
      new CustomEvent("agni_api_error", {
        detail: { message: errorMsg, status: 0, endpoint },
      })
    );
    throw fetchError;
  }

  if (!response.ok) {
    if (response.status === 401 && !endpoint.includes("/auth/")) {
      // Session token expired or secret updated — clear stale session and trigger auth refresh
      localStorage.removeItem("agni_token");
      localStorage.removeItem("agni_user");
      localStorage.removeItem("agni_user_role");
      localStorage.removeItem("agni_role");
      localStorage.removeItem("agni_user_email");
      localStorage.removeItem("agni_email");
      window.dispatchEvent(new CustomEvent("agni_auth_changed"));
      return response;
    }

    try {
      const clone = response.clone();
      const errData = await clone.json();
      const msg = errData?.message || `API request failed with status ${response.status}`;
      window.dispatchEvent(
        new CustomEvent("agni_api_error", {
          detail: { message: msg, status: response.status, endpoint },
        })
      );
    } catch (e) {
      window.dispatchEvent(
        new CustomEvent("agni_api_error", {
          detail: { message: `API request failed (${response.status})`, status: response.status, endpoint },
        })
      );
    }
  }

  return response;
}

export const apiClient = {
  get: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: "GET" }),
  post: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: "POST", body }),
  put: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: "PUT", body }),
  patch: (endpoint, body, options = {}) => apiFetch(endpoint, { ...options, method: "PATCH", body }),
  delete: (endpoint, options = {}) => apiFetch(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;
