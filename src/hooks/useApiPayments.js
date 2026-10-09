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
          apiMapped = result
            .filter((pay) => {
              const r = String(pay.remarks || "").toLowerCase();
              const pId = String(pay.paymentId || pay.id || "");
              return !r.includes("payment collected upon client registration") && pId !== "PAY-2026-C4EF3" && pId !== "PAY-2026-F981C";
            })
            .map((pay) => {
            const clientCompany = typeof pay.client === "object" ? pay.client?.companyName || pay.client?.name : "Unknown Client";
            const clientName = typeof pay.client === "object" ? pay.client?.name || pay.client?.companyName : "Unknown Client";
            const clientEmail = typeof pay.client === "object" ? (pay.client?.email || "").toLowerCase().trim() : "";
            const clientPhone = typeof pay.client === "object" ? pay.client?.phone || "" : "";
            const invoiceNo = typeof pay.invoice === "object" ? pay.invoice?.invoiceNo : "Unknown Invoice";
            const spName = typeof pay.recordedBy === "object" ? pay.recordedBy?.fullName : "";
            const isSettled = pay.status === "SUCCESS" || pay.status === "PAID" || pay.status === "Verified";
            const isAwaitingApproval = !isSettled && (
              String(pay.remarks || "").toLowerCase().includes("awaiting_approval") ||
              String(pay.status || "").toLowerCase().includes("awaiting")
            );
            const resolvedStatus = isSettled ? "Paid" : isAwaitingApproval ? "Awaiting Approval" : (pay.status === "PENDING" ? "Requested" : (pay.status || "Requested"));

            const cleanDesc = (pay.remarks || "")
              .replace(/^(PAYMENT_REQUEST:\s*|AWAITING_APPROVAL:\s*|PAID:\s*)/i, "")
              .trim() || `Payment demand for ${clientCompany}.`;

            const rawDate = pay.paymentDate || pay.date || pay.createdAt || new Date().toISOString().split("T")[0];
            const formattedDate = typeof rawDate === "string" ? rawDate.split("T")[0] : new Date(rawDate).toISOString().split("T")[0];
            const invDueDate = pay.invoice?.dueDate ? (typeof pay.invoice.dueDate === "string" ? pay.invoice.dueDate.split("T")[0] : new Date(pay.invoice.dueDate).toISOString().split("T")[0]) : "";

            return {
              ...pay,
              id: pay.paymentId || pay.id,
              paymentId: pay.paymentId || pay.id,
              clientId: pay.clientId || (typeof pay.client === "object" ? pay.client?.id : ""),
              client: clientCompany,
              clientName: clientName,
              clientCompany: clientCompany,
              company: clientCompany,
              companyName: clientCompany,
              clientEmail: clientEmail,
              email: clientEmail,
              clientPhone: clientPhone,
              phone: clientPhone,
              invoiceId: invoiceNo,
              relatedInvoice: invoiceNo,
              amount: Number(pay.amount || 0),
              date: formattedDate,
              dueDate: pay.dueDate || invDueDate || formattedDate,
              mode: pay.paymentMode || pay.mode,
              paymentMode: pay.paymentMode || pay.mode || "ONLINE",
              type: pay.type || (isSettled ? "Payment Settlement" : "Payment Request"),
              salesPerson: spName,
              salesPersonEmail: typeof pay.recordedBy === "object" ? pay.recordedBy?.email : "",
              receivedBy: spName,
              transactionRef: pay.referenceNumber || "",
              description: cleanDesc,
              status: resolvedStatus,
            };
          });

          setPayments(apiMapped);
        } else {
          setPayments([]);
        }
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.warn("Failed to fetch payments from API:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();

    const handleUpdate = () => {
      fetchPayments();
    };

    window.addEventListener("agni_payments_updated", handleUpdate);
    window.addEventListener("agni_requests_updated", handleUpdate);
    window.addEventListener("agni_pending_updated", handleUpdate);
    window.addEventListener("agni_invoices_updated", handleUpdate);
    return () => {
      window.removeEventListener("agni_payments_updated", handleUpdate);
      window.removeEventListener("agni_requests_updated", handleUpdate);
      window.removeEventListener("agni_pending_updated", handleUpdate);
      window.removeEventListener("agni_invoices_updated", handleUpdate);
    };
  }, [fetchPayments]);

  return { payments, loading, error, refreshPayments: fetchPayments, setPayments };
}

