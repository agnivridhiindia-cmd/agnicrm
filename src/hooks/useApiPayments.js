import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../services/apiClient";

export function useApiPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayments = useCallback(async () => {
    let apiMapped = [];
    try {
      setLoading(true);
      const response = await apiFetch("/invoices/payments/all");

      if (response.ok) {
        const result = await response.json();
        if (Array.isArray(result)) {
          apiMapped = result.map(pay => {
            const clientName = typeof pay.client === "object" ? pay.client?.companyName || pay.client?.name : "Unknown Client";
            const invoiceNo = typeof pay.invoice === "object" ? pay.invoice?.invoiceNo : "Unknown Invoice";
            return {
              ...pay,
              id: pay.paymentId || pay.id,
              paymentId: pay.paymentId || pay.id,
              client: clientName,
              clientName: clientName,
              invoiceId: invoiceNo,
              amount: pay.amount,
              date: pay.paymentDate || pay.date,
              mode: pay.paymentMode || pay.mode,
              status: (pay.status === "SUCCESS" || pay.status === "PAID" || pay.status === "Verified") ? "Paid" : (pay.status || "Pending"),
            };
          });
        }
      }
    } catch (err) {
      console.warn("Failed to fetch payments from API:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }

    // Merge LocalStorage payment demands & requests
    let localDemands = [];
    try {
      const s1 = localStorage.getItem("agni_sales_payments");
      const s2 = localStorage.getItem("agni_payment_demands");
      const s3 = localStorage.getItem("agni_client_requests");
      const l1 = s1 ? JSON.parse(s1) : [];
      const l2 = s2 ? JSON.parse(s2) : [];
      const l3 = s3 ? JSON.parse(s3) : [];
      localDemands = [...l1, ...l2, ...l3];

      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || "";
        if (k.startsWith("agni_payment_demands_")) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k));
            if (Array.isArray(parsed)) {
              localDemands.push(...parsed);
            }
          } catch (e) {}
        }
      }
    } catch (e) {}

    const dedupeMap = new Map();
    localDemands.forEach((p) => {
      if (p && p.id) {
        dedupeMap.set(String(p.id), {
          ...p,
          clientName: p.clientCompany || p.clientName || p.client || "Client",
          company: p.clientCompany || p.clientName || p.company || "Client",
          paymentMode: p.paymentMode || p.mode || "Online Gateway",
        });
      }
    });

    apiMapped.forEach((p) => {
      if (p && p.id) {
        if (!dedupeMap.has(String(p.id))) {
          dedupeMap.set(String(p.id), p);
        }
      }
    });

    setPayments(Array.from(dedupeMap.values()));
  }, []);

  useEffect(() => {
    fetchPayments();

    const handleUpdate = () => {
      fetchPayments();
    };

    window.addEventListener("agni_payments_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("agni_payments_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [fetchPayments]);

  return { payments, loading, error, refreshPayments: fetchPayments, setPayments };
}
