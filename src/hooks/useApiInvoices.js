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

          // Map backend invoiceType enum to frontend type string
          // Business rule: PROFORMA = pending amount, TAX = fully paid
          const paymentStatus = inv.status === "PAID" ? "Paid" : inv.status === "PARTIAL" ? "Partially Paid" : "Pending";
          let invoiceTypeLabel;
          if (inv.invoiceType === "TAX") {
            invoiceTypeLabel = "Tax Invoice";
          } else if (inv.invoiceType === "PROFORMA") {
            invoiceTypeLabel = "Proforma Invoice";
          } else {
            // Legacy fallback: derive from payment status
            invoiceTypeLabel = paymentStatus === "Paid" ? "Tax Invoice" : "Proforma Invoice";
          }

          return {
            ...inv,
            // Map key frontend fields expected by legacy components
            id: inv.invoiceNo,
            invoiceId: inv.invoiceNo,
            type: invoiceTypeLabel,
            clientName: clientName,
            client: clientName,
            clientEmail: clientEmail,
            date: inv.issueDate,
            dueDate: inv.dueDate,
            amount: Number(inv.rawAmount) || 0,
            // Reconstruct rate from rawAmount / quantity for invoice HTML generation
            rate: Number(inv.rawAmount) / Math.max(Number(inv.quantity) || 1, 1),
            quantity: Number(inv.quantity) || 1,
            gstPercent: Number(inv.gstRate) * 100, // backend stores as decimal e.g. 0.18 → 18
            taxableAmount: Number(inv.rawAmount) || 0,
            totalGst: Number(inv.gstAmount) || 0,
            totalAmount: Number(inv.rawTotal) || 0,
            paymentReceived: Number(inv.paymentReceived) || 0,
            paymentPending: Number(inv.paymentPending) || 0,
            status: paymentStatus,
            // New fields
            description: inv.description || "",
            hsnSac: inv.hsnSac || "998372",
            placeOfSupply: inv.placeOfSupply || "Uttar Pradesh",
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
