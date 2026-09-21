import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../services/apiClient";

export function useApiRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/requests");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setRequests(result.data);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Failed to fetch requests from API:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequest = async (requestPayload) => {
    const response = await apiFetch("/requests", {
      method: "POST",
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      const errRes = await response.json().catch(() => ({}));
      throw new Error(errRes.message || "Failed to create request");
    }

    const result = await response.json();
    fetchRequests();
    window.dispatchEvent(new Event("agni_requests_updated"));
    return result;
  };

  const decideRequest = async (requestId, decision, managerRemarks) => {
    const response = await apiFetch(`/requests/${requestId}/decision`, {
      method: "PATCH",
      body: JSON.stringify({ decision, managerRemarks }),
    });

    if (!response.ok) {
      const errRes = await response.json().catch(() => ({}));
      throw new Error(errRes.message || "Failed to submit decision");
    }

    const result = await response.json();
    fetchRequests();
    window.dispatchEvent(new Event("agni_requests_updated"));
    window.dispatchEvent(new Event("agni_clients_updated"));
    return result;
  };

  useEffect(() => {
    fetchRequests();

    const handleUpdate = () => {
      fetchRequests();
    };

    window.addEventListener("agni_requests_updated", handleUpdate);
    return () => {
      window.removeEventListener("agni_requests_updated", handleUpdate);
    };
  }, [fetchRequests]);

  return { requests, loading, error, refreshRequests: fetchRequests, createRequest, decideRequest };
}
