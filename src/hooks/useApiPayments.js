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
          apiMapped = result.map((pay) => {
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
        const cComp = p.clientCompany || p.companyName || p.company || p.clientName || "Client";
        const cName = p.clientName || p.representativeName || cComp;
        const cEmail = (p.clientEmail || p.email || "").toLowerCase().trim();
        const cPhone = p.clientPhone || p.phone || "";

        dedupeMap.set(String(p.id), {
          ...p,
          id: p.id,
          paymentId: p.paymentId || p.id,
          clientId: p.clientId || "",
          clientName: cName,
          clientCompany: cComp,
          company: cComp,
          companyName: cComp,
          clientEmail: cEmail,
          email: cEmail,
          clientPhone: cPhone,
          phone: cPhone,
          amount: Number(p.amount || 0),
          paymentMode: p.paymentMode || p.mode || "Online Gateway",
          status: p.status || "Requested",
          type: p.type || "Payment Request",
        });
      }
    });

    apiMapped.forEach((p) => {
      if (p && p.id) {
        const key = String(p.id);
        if (!dedupeMap.has(key)) {
          dedupeMap.set(key, p);
        } else {
          // If local demand was marked as Paid or settled, preserve paid status and enrich with DB metadata
          const existing = dedupeMap.get(key);
          const isPaid = existing.status === "Paid" || p.status === "Paid";
          const isAwaiting = !isPaid && (existing.status === "Awaiting Approval" || p.status === "Awaiting Approval");
          dedupeMap.set(key, {
            ...existing,
            ...p,
            status: isPaid ? "Paid" : isAwaiting ? "Awaiting Approval" : (p.status || existing.status),
          });
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
    window.addEventListener("agni_requests_updated", handleUpdate);
    window.addEventListener("agni_pending_updated", handleUpdate);
    window.addEventListener("agni_invoices_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("agni_payments_updated", handleUpdate);
      window.removeEventListener("agni_requests_updated", handleUpdate);
      window.removeEventListener("agni_pending_updated", handleUpdate);
      window.removeEventListener("agni_invoices_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [fetchPayments]);

  return { payments, loading, error, refreshPayments: fetchPayments, setPayments };
}
