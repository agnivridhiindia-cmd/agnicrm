import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "../services/apiClient";

export function useApiInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/invoices");

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      if (Array.isArray(result)) {
        // Map backend Prisma model to frontend UI format
        const mappedInvoices = result.map(inv => {
          const clientName = typeof inv.client === "object" ? inv.client?.companyName || inv.client?.name : "Unknown Client";
          const clientEmail = typeof inv.client === "object" ? inv.client?.email : "";
          
          return {
            ...inv,
            // Map key frontend fields expected by legacy components
            id: inv.invoiceNo,
            invoiceId: inv.invoiceNo,
            client: clientName,
            clientEmail: clientEmail,
            date: inv.issueDate,
            dueDate: inv.dueDate,
            amount: inv.rawAmount,
            totalAmount: inv.rawTotal,
            paymentReceived: inv.paymentReceived,
            paymentPending: inv.paymentPending,
            status: inv.status === "PAID" ? "Paid" : inv.status === "PARTIAL" ? "Partially Paid" : "Pending",
          };
        });
        setInvoices(mappedInvoices);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error("Failed to fetch invoices from API:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();

    // Listen to global events for refresh
    const handleUpdate = () => {
      fetchInvoices();
    };

    window.addEventListener("agni_invoices_updated", handleUpdate);
    return () => {
      window.removeEventListener("agni_invoices_updated", handleUpdate);
    };
  }, [fetchInvoices]);

  return { invoices, loading, error, refreshInvoices: fetchInvoices, setInvoices };
}
