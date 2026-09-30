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
          const clientObj = typeof inv.client === "object" ? inv.client : {};
          const clientName = clientObj?.companyName || clientObj?.name || inv.clientName || "Unknown Client";
          const clientEmail = clientObj?.email || inv.clientEmail || "";
          const clientPhone = clientObj?.contactNumber || clientObj?.phone || inv.mobile || "";
          const clientAddress = clientObj?.address || inv.address || "";
          const clientGstin = inv.gstNo || clientObj?.gstNumber || "";
          let clientPan = clientObj?.companyPan || clientObj?.panNumber || "";
          if (!clientPan && clientGstin && clientGstin.length >= 12) {
            clientPan = clientGstin.substring(2, 12).toUpperCase();
          }

          // Map backend invoiceType enum to frontend type string
          // Business rule: PROFORMA = pending amount, TAX = fully paid (Tax Invoice for online with GST, GST Invoice for cash without GST)
          const paymentStatus = inv.status === "PAID" ? "Paid" : inv.status === "PARTIAL" ? "Partially Paid" : "Pending";
          const isCashNoGst = inv.paymentMode === "OFFLINE" || Number(inv.gstRate) === 0;
          let invoiceTypeLabel;
          if (inv.invoiceType === "TAX") {
            invoiceTypeLabel = isCashNoGst ? "GST Invoice" : "Tax Invoice";
          } else if (inv.invoiceType === "PROFORMA") {
            invoiceTypeLabel = "Proforma Invoice";
          } else {
            // Legacy fallback: derive from payment status
            invoiceTypeLabel = paymentStatus === "Paid" ? (isCashNoGst ? "GST Invoice" : "Tax Invoice") : "Proforma Invoice";
          }

          const gstPct = (isCashNoGst && invoiceTypeLabel === "GST Invoice") ? 0 : (Number(inv.gstRate) * 100);
          const totalGstVal = (isCashNoGst && invoiceTypeLabel === "GST Invoice") ? 0 : (Number(inv.gstAmount) || 0);

          return {
            ...inv,
            dbId: inv.id,
            // Map key frontend fields expected by legacy components
            id: inv.invoiceNo,
            invoiceId: inv.invoiceNo,
            type: invoiceTypeLabel,
            clientName: clientName,
            client: clientName,
            clientEmail: clientEmail,
            email: clientEmail,
            phone: clientPhone,
            mobile: clientPhone,
            address: clientAddress,
            gstin: clientGstin,
            gstNo: clientGstin,
            pan: clientPan,
            panNumber: clientPan,
            contactPerson: clientObj?.contactPerson || clientObj?.representativeName || "",
            date: inv.issueDate,
            dueDate: inv.dueDate,
            amount: Number(inv.rawAmount) || 0,
            // Reconstruct rate from rawAmount / quantity for invoice HTML generation
            rate: Number(inv.rawAmount) / Math.max(Number(inv.quantity) || 1, 1),
            quantity: Number(inv.quantity) || 1,
            gstPercent: gstPct,
            taxableAmount: Number(inv.rawAmount) || 0,
            totalGst: totalGstVal,
            totalAmount: Number(inv.rawTotal) || 0,
            paymentReceived: Number(inv.paymentReceived) || 0,
            paymentPending: Number(inv.paymentPending) || 0,
            status: paymentStatus,
            // New fields
            description: inv.description || "",
            hsnSac: inv.hsnSac || "998311",
            placeOfSupply: inv.placeOfSupply || "Telangana",
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
