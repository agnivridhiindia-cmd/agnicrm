import React, { useState, useMemo, useEffect } from "react";
import { apiFetch } from "../../services/apiClient";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";

import { useApiPayments } from "../../hooks/useApiPayments";
import { useApiClients } from "../../hooks/useApiClients";
import { isClientCreatedByUser } from "./hooks/useSalesClients";
import { isMockClient } from "../../utils/revenueCalculator";

const PAYMENT_TABS = ["All Records", "Payment Requests", "Completed Payments"];
const PAYMENT_MODES = ["Bank Transfer", "UPI", "Cheque", "Online Gateway"];

const initialPayments = [];

const statusBadge = {
  Paid: "#10b981",
  Requested: "#f59e0b",
  Pending: "#f59e0b",
  Overdue: "#f43f5e",
  Cancelled: "#7c8490",
};

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);

const generatePaymentId = (existing) => {
  const nextNum = existing.length + 1;
  return `REQ-2026-${String(nextNum).padStart(3, "0")}`;
};

function getPendingPayment(client) {
  if (!client) return 0;
  if (client.paymentPending !== undefined && client.paymentPending !== null && client.paymentPending !== "") {
    const parsed = parseFloat(String(client.paymentPending).replace(/[^0-9.]/g, ""));
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  const total = parseFloat(String(client.totalPayment || client.amount || 0).replace(/[^0-9.]/g, ""));
  const rec = parseFloat(String(client.paymentReceived || 0).replace(/[^0-9.]/g, ""));
  return Math.max(0, total - rec);
}

function CreatePaymentRequestModal({ clients = [], onClose, onSubmit }) {
  const pendingClients = useMemo(() => {
    const filtered = (clients || []).filter((c) => getPendingPayment(c) > 0);
    return filtered.length > 0 ? filtered : (clients || []);
  }, [clients]);

  const [formData, setFormData] = useState(() => {
    const firstClient = pendingClients[0];
    const initialAmt = firstClient ? getPendingPayment(firstClient) : "";
    return {
      clientId: firstClient ? String(firstClient.id || firstClient.email) : "",
      amount: initialAmt ? String(initialAmt) : "",
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };
  });

  useEffect(() => {
    if (pendingClients.length > 0 && !formData.clientId) {
      const first = pendingClients[0];
      const amt = first ? getPendingPayment(first) : "";
      setFormData((prev) => ({
        ...prev,
        clientId: String(first.id || first.email || ""),
        amount: amt ? String(amt) : prev.amount,
      }));
    }
  }, [pendingClients]);

  const selectedClient = useMemo(
    () => pendingClients.find((client) => String(client.id || client.email) === String(formData.clientId)) || pendingClients[0],
    [pendingClients, formData.clientId]
  );

  const handleClientChange = (e) => {
    const newClientId = e.target.value;
    const found = pendingClients.find((c) => String(c.id || c.email) === String(newClientId));
    const pendingAmt = found ? getPendingPayment(found) : 0;
    setFormData((prev) => ({
      ...prev,
      clientId: newClientId,
      amount: pendingAmt > 0 ? String(pendingAmt) : prev.amount,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      return;
    }

    const request = {
      id: generatePaymentId([]),
      clientId: selectedClient ? (selectedClient.id || selectedClient.email) : 1,
      clientName: selectedClient?.company || selectedClient?.name || "Client",
      clientEmail: selectedClient?.email ?? "",
      clientPhone: selectedClient?.phone ?? "",
      clientCompany: selectedClient?.company || selectedClient?.name || "",
      type: "Payment Request",
      amount: Number(formData.amount),
      paymentMode: "Online Gateway",
      transactionRef: "",
      date: new Date().toISOString().split("T")[0],
      dueDate: formData.dueDate,
      status: "Requested",
      relatedInvoice: "",
      description: `Payment demand for ${selectedClient?.company || selectedClient?.name || "Client"} (${selectedClient?.scheme || "Service"}).`,
      receivedBy: "Sales Person",
    };

    onSubmit(request);
    onClose();
  };

  return (
    <Modal title="Issue Payment Request" onClose={onClose} closeLabel="Close">
      <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 320, maxWidth: 680 }}>
        <div>
          <p className="eyebrow" style={{ margin: 0, textTransform: "uppercase", letterSpacing: 1, fontSize: 11, color: "#8c5ff8", fontWeight: 700 }}>
            Payment Demand
          </p>
          <h2 style={{ margin: "4px 0 4px", fontSize: 18, fontWeight: 800 }}>Create New Payment Demand</h2>
          <p style={{ margin: 0, color: "#7a748e", fontSize: 13 }}>
            Generate a formal payment request notification for clients with outstanding payment balances.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="field-label" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
              Target Client Account <span style={{ color: "#f43f5e" }}>*</span>
            </span>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleClientChange}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 13.5,
                fontWeight: 500,
                fontFamily: "inherit",
                background: "#fff",
                color: "#0f172a",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
              required
            >
              {pendingClients.length === 0 && <option value="">No clients with remaining payment balance</option>}
              {pendingClients.map((client, idx) => {
                const val = String(client.id || client.email || idx);
                const company = client.company || client.name || "Client Account";
                const contact = client.contactPerson && client.contactPerson !== company ? ` (${client.contactPerson})` : "";
                const scheme = client.scheme || client.serviceName || client.serviceType || "Service";
                const remaining = getPendingPayment(client);
                const remainingFormatted = remaining > 0 ? `₹${remaining.toLocaleString("en-IN")}` : "₹0";

                const label = `${company}${contact} — ${scheme} | Remaining: ${remainingFormatted}`;

                return (
                  <option key={val} value={val}>
                    {label}
                  </option>
                );
              })}
            </select>
          </label>

          {selectedClient && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justify: "space-between",
                padding: "8px 12px",
                borderRadius: 6,
                background: "rgba(140, 95, 248, 0.06)",
                border: "1px solid rgba(140, 95, 248, 0.15)",
                fontSize: 12.5,
                marginTop: 2,
              }}
            >
              <span style={{ color: "#475569" }}>
                <strong>Scheme:</strong> {selectedClient.scheme || selectedClient.serviceName || "N/A"}
              </span>
              <span style={{ color: "#8c5ff8", fontWeight: 700 }}>
                Remaining Balance: ₹{getPendingPayment(selectedClient).toLocaleString("en-IN")}
              </span>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <label className="field-label" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
              Requested Amount (₹) <span style={{ color: "#f43f5e" }}>*</span>
            </span>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 25000"
              min="1"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              required
            />
          </label>

          <label className="field-label" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
              Due Date <span style={{ color: "#f43f5e" }}>*</span>
            </span>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              required
            />
          </label>
        </div>

        {/* Live Summary Box */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(140, 95, 248, 0.08) 0%, rgba(109, 59, 245, 0.03) 100%)",
            padding: "16px 20px",
            borderRadius: 12,
            border: "1px solid rgba(140, 95, 248, 0.2)",
            display: "flex",
            justify: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, display: "block", marginBottom: 2 }}>
              Total Demand
            </span>
            <strong style={{ color: "#10b981", fontSize: 20, fontWeight: 800 }}>
              {formatCurrency(formData.amount || 0)}
            </strong>
          </div>
          <span style={{ fontSize: 12, color: "#8c5ff8", fontWeight: 600, background: "rgba(140, 95, 248, 0.12)", padding: "6px 12px", borderRadius: 20 }}>
            Status: Pending Demand
          </span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 12, marginTop: 4 }}>
          <button className="sales-btn-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="sales-add-btn"
            type="button"
            onClick={handleSubmit}
            disabled={!formData.amount || Number(formData.amount) <= 0}
            style={{
              opacity: (!formData.amount || Number(formData.amount) <= 0) ? 0.5 : 1,
              cursor: (!formData.amount || Number(formData.amount) <= 0) ? "not-allowed" : "pointer",
              padding: "10px 24px",
              fontSize: 13.5,
            }}
          >
            <span>+ Issue Payment Request</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PaymentDetailsModal({ payment, onClose, onDownload }) {
  if (!payment) return null;

  return (
    <Modal title={`Payment Record Details — ${payment.id}`} onClose={onClose} closeLabel="Close">
      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 680 }}>
        {/* Top Summary Banner */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            padding: 16,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(140, 95, 248, 0.08) 0%, rgba(109, 59, 245, 0.03) 100%)",
            border: "1px solid rgba(140, 95, 248, 0.16)",
          }}
        >
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block" }}>
              Client
            </span>
            <strong style={{ fontSize: 15, marginTop: 2, display: "block" }}>{payment.clientName}</strong>
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block" }}>
              Record Type
            </span>
            <strong style={{ fontSize: 14, marginTop: 2, display: "block", color: "#8c5ff8" }}>{payment.type}</strong>
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600, display: "block" }}>
              Status
            </span>
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "4px 12px",
                  borderRadius: 999,
                  background: `${statusBadge[payment.status] || "#f59e0b"}22`,
                  color: statusBadge[payment.status] || "#f59e0b",
                  fontWeight: 700,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {payment.status}
              </span>
            </div>
          </div>
        </div>

        {/* 3-Column Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(16, 185, 129, 0.25)", background: "rgba(16, 185, 129, 0.06)" }}>
            <span style={{ fontSize: 11.5, color: "#10b981", fontWeight: 600, display: "block" }}>Amount</span>
            <strong style={{ fontSize: 16, color: "#10b981", marginTop: 2, display: "block", fontWeight: 700 }}>
              {formatCurrency(payment.amount)}
            </strong>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(140, 95, 248, 0.14)", background: "rgba(255, 255, 255, 0.02)" }}>
            <span style={{ fontSize: 11.5, color: "#7a748e", fontWeight: 600, display: "block" }}>Payment Mode</span>
            <strong style={{ fontSize: 13.5, marginTop: 3, display: "block" }}>{payment.paymentMode}</strong>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(140, 95, 248, 0.14)", background: "rgba(255, 255, 255, 0.02)" }}>
            <span style={{ fontSize: 11.5, color: "#7a748e", fontWeight: 600, display: "block" }}>Date</span>
            <strong style={{ fontSize: 13.5, marginTop: 3, display: "block" }}>{payment.date || payment.dueDate}</strong>
          </div>
        </div>

        {/* Description */}
        <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid rgba(140, 95, 248, 0.14)", background: "rgba(140, 95, 248, 0.04)" }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#8c5ff8", display: "block", marginBottom: 4 }}>
            Payment Description / Purpose
          </span>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "inherit" }}>
            {payment.description}
          </p>
        </div>

        {/* Related Invoice & Transaction Ref */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 12 }}>
          <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(140, 95, 248, 0.14)", background: "rgba(255, 255, 255, 0.02)" }}>
            <span style={{ fontSize: 11.5, color: "#7a748e", fontWeight: 600, display: "block" }}>Related Invoice</span>
            <strong style={{ fontSize: 14, marginTop: 3, display: "block", color: "#8c5ff8" }}>{payment.relatedInvoice || "N/A"}</strong>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(140, 95, 248, 0.14)", background: "rgba(255, 255, 255, 0.02)" }}>
            <span style={{ fontSize: 11.5, color: "#7a748e", fontWeight: 600, display: "block" }}>Transaction Reference</span>
            <strong style={{ fontSize: 13.5, marginTop: 3, display: "block", fontFamily: "monospace" }}>
              {payment.transactionRef || "Pending Settlement"}
            </strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 6 }}>
          <button className="sales-btn-secondary" type="button" onClick={() => onDownload(payment)} style={{ padding: "9px 18px" }}>
            📥 Download Receipt
          </button>
          <button className="sales-add-btn" type="button" onClick={onClose} style={{ padding: "9px 24px" }}>
            <span>Close</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function SalesPayments({ clients: propClients, userEmail, salesPersonName }) {
  const [activeTab, setActiveTab] = useState("All Records");
  
  const { payments: apiPayments, refreshPayments } = useApiPayments();
  const payments = useMemo(() => apiPayments, [apiPayments]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [notification, setNotification] = useState("");

  const [clientUpdatesVersion, setClientUpdatesVersion] = useState(0);

  const currentSalesName = salesPersonName || localStorage.getItem("agni_user_name") || "";
  const currentUserEmail = userEmail || localStorage.getItem("agni_user_email") || "";
  const userRole = localStorage.getItem("agni_user_role") || "";

  const { clients: apiClients } = useApiClients();

  // Consolidate current salesperson's active clients
  const userSalesClients = useMemo(() => {
    const list = [];
    const addedKeys = new Set();
    const addC = (c) => {
      if (!c) return;
      if (userRole !== "Admin" && userRole !== "Owner" && userRole !== "Branch Manager" && userRole !== "Manager") {
        if (!isClientCreatedByUser(c, currentSalesName, currentUserEmail)) return;
      }
      const key = String((c.company || c.name || c.email || c.id) + "_" + (c.scheme || "")).trim().toLowerCase();
      if (key && !addedKeys.has(key)) {
        addedKeys.add(key);
        list.push(c);
      }
    };

    if (Array.isArray(propClients)) propClients.forEach(addC);
    if (Array.isArray(apiClients)) apiClients.forEach(addC);

    return list;
  }, [propClients, apiClients, currentSalesName, currentUserEmail, userRole]);

  // Filter payment records belonging specifically to current salesperson
  const userPayments = useMemo(() => {
    return payments.filter((p) => {
      if (userRole !== "Admin" && userRole !== "Owner" && userRole !== "Branch Manager" && userRole !== "Manager") {
        const pSalesperson = (p.salesPerson || p.salesPersonEmail || p.receivedBy || "").toLowerCase();
        const pClientEmail = (p.clientEmail || "").toLowerCase();
        const pClientCompany = (p.clientCompany || p.clientName || "").toLowerCase();
        const matchesClient = userSalesClients.some((c) => {
          const cEmail = (c.email || "").toLowerCase();
          const cCompany = (c.company || c.name || "").toLowerCase();
          return (cEmail && pClientEmail && (cEmail === pClientEmail || pClientEmail.includes(cEmail))) ||
                 (cCompany && pClientCompany && (cCompany === pClientCompany || pClientCompany.includes(cCompany)));
        });
        const matchesSalesperson = pSalesperson && currentSalesName && (pSalesperson.includes(currentSalesName.toLowerCase()) || (currentUserEmail && pSalesperson.includes(currentUserEmail.toLowerCase())));

        if (!matchesClient && !matchesSalesperson) {
          return false;
        }
      }
      return true;
    });
  }, [payments, userRole, currentSalesName, currentUserEmail, userSalesClients]);

  // Dynamic KPI Calculations derived directly from salesperson's payment transactions & client demands
  const stats = useMemo(() => {
    let totalCollected = 0;
    let totalPendingFromRequests = 0;

    userPayments.forEach((p) => {
      const amt = Number(p.amount || 0);
      if (p.status === "Paid") {
        totalCollected += amt;
      } else {
        totalPendingFromRequests += amt;
      }
    });

    // Sum pending demand directly from active client contracts/services belonging to salesperson
    let clientPendingDemand = 0;
    userSalesClients.forEach((c) => {
      const pend = parseFloat(c.paymentPending) || 0;
      if (pend > 0) {
        clientPendingDemand += pend;
      }
    });

    const totalPending = clientPendingDemand > 0 ? clientPendingDemand : totalPendingFromRequests;
    const totalDemand = totalCollected + totalPending;
    const collectionRate = totalDemand > 0 ? Math.round((totalCollected / totalDemand) * 100) : 0;

    return {
      totalCollected,
      totalPending,
      collectionRate,
      count: userPayments.length,
    };
  }, [userPayments, userSalesClients]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (userRole !== "Admin" && userRole !== "Owner" && userRole !== "Branch Manager" && userRole !== "Manager") {
        const pSalesperson = (p.salesPerson || p.salesPersonEmail || p.receivedBy || "").toLowerCase();
        const pClientEmail = (p.clientEmail || "").toLowerCase();
        const pClientCompany = (p.clientCompany || p.clientName || "").toLowerCase();
        const matchesClient = userSalesClients.some((c) => {
          const cEmail = (c.email || "").toLowerCase();
          const cCompany = (c.company || c.name || "").toLowerCase();
          return (cEmail && pClientEmail && (cEmail === pClientEmail || pClientEmail.includes(cEmail))) ||
                 (cCompany && pClientCompany && (cCompany === pClientCompany || pClientCompany.includes(cCompany)));
        });
        const matchesSalesperson = pSalesperson && currentSalesName && (pSalesperson.includes(currentSalesName.toLowerCase()) || (currentUserEmail && pSalesperson.includes(currentUserEmail.toLowerCase())));

        if (!matchesClient && !matchesSalesperson) {
          return false;
        }
      }

      // Tab filter
      if (activeTab === "Payment Requests" && !(p.type === "Payment Request" || p.status === "Requested")) {
        return false;
      }
      if (activeTab === "Completed Payments" && p.status !== "Paid") {
        return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchId = (p.id || "").toLowerCase().includes(query);
        const matchClient = (p.clientName || "").toLowerCase().includes(query);
        const matchCompany = (p.clientCompany || "").toLowerCase().includes(query);
        const matchInvoice = (p.relatedInvoice || "").toLowerCase().includes(query);
        if (!matchId && !matchClient && !matchCompany && !matchInvoice) return false;
      }

      return true;
    });
  }, [payments, activeTab, searchTerm, userRole, currentSalesName, currentUserEmail, userSalesClients]);

  const updateClientPaymentMetrics = (clientIdentifier, amountDiff, actionType) => {
    if (!amountDiff || amountDiff <= 0) return;
    try {
      const targetStr = String(clientIdentifier || "").toLowerCase().trim();
      const updateListInKey = (key) => {
        const saved = localStorage.getItem(key);
        if (!saved) return;
        const list = JSON.parse(saved);
        if (!Array.isArray(list)) return;

        let modified = false;
        const nextList = list.map((c) => {
          const cId = String(c.id || "").toLowerCase().trim();
          const cEmail = String(c.email || "").toLowerCase().trim();
          const cCompany = String(c.company || c.name || "").toLowerCase().trim();

          if ((targetStr && (cId === targetStr || cEmail === targetStr || cCompany === targetStr)) || list.length === 1) {
            modified = true;
            const currentRec = parseFloat(String(c.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0;
            const currentPend = parseFloat(String(c.paymentPending || 0).replace(/[^0-9.]/g, "")) || 0;

            if (actionType === "MARK_PAID") {
              const totalPaymentVal = parseFloat(String(c.totalPayment || c.amount || 0).replace(/[^0-9.]/g, "")) || (currentRec + currentPend);
              const newRec = currentRec + amountDiff;
              const newPend = Math.max(0, totalPaymentVal - newRec);
              return {
                ...c,
                paymentReceived: String(newRec),
                paymentPending: String(newPend),
              };
            }
          }
          return c;
        });

        if (modified) {
          localStorage.setItem(key, JSON.stringify(nextList));
        }
      };

      updateListInKey("agni_sales_clients");
      updateListInKey("agni_branch_clients");
      setClientUpdatesVersion((v) => v + 1);
    } catch (e) {}
  };

  const addPaymentRequest = async (newReq) => {
    try {
      // 1. Save locally to agni_sales_payments and agni_payment_demands
      const cEmail = (newReq.clientEmail || "").toLowerCase().trim();
      const saveToKey = (key) => {
        try {
          const saved = localStorage.getItem(key);
          const list = saved ? JSON.parse(saved) : [];
          const updated = [newReq, ...list.filter((p) => p.id !== newReq.id)];
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {}
      };

      saveToKey("agni_sales_payments");
      saveToKey("agni_payment_demands");
      saveToKey("agni_client_requests");
      if (cEmail) saveToKey(`agni_payment_demands_${cEmail}`);

      // 2. Dispatch global events
      window.dispatchEvent(new Event("agni_payments_updated"));
      window.dispatchEvent(new Event("agni_clients_updated"));

      window.dispatchEvent(new Event("agni_invoices_updated"));

      if (newReq.relatedInvoiceId || newReq.invoiceId) {
        try {
          await apiFetch(`/invoices/${newReq.relatedInvoiceId || newReq.invoiceId}/payments`, {
            method: "POST",
            body: {
              amount: Number(newReq.amount || 0),
              paymentMode: "ONLINE",
              remarks: "Payment request added",
            }
          });
        } catch (e) {}
      }

      refreshPayments();
      setNotification(`✓ Payment request for ${newReq.clientName} created successfully.`);
    } catch(err) {
      console.error("Could not send payment request:", err);
      setNotification(`✓ Payment request for ${newReq.clientName} recorded.`);
    } finally {
      setTimeout(() => setNotification(""), 4200);
      setShowCreateModal(false);
    }
  };

  const markAsPaid = async (paymentTarget) => {
    try {
      const pId = typeof paymentTarget === "object" ? paymentTarget.id : paymentTarget;
      const targetPay = payments.find((p) => String(p.id) === String(pId)) || paymentTarget;

      const updatePaymentStatusLocal = (key) => {
        try {
          const saved = localStorage.getItem(key);
          if (!saved) return;
          const list = JSON.parse(saved);
          if (!Array.isArray(list)) return;
          const updated = list.map((p) => {
            if (String(p.id) === String(pId)) {
              return {
                ...p,
                status: "Paid",
                transactionRef: p.transactionRef || `TXN-AGNI-${Date.now().toString().slice(-6)}`,
                paidAt: new Date().toISOString(),
              };
            }
            return p;
          });
          localStorage.setItem(key, JSON.stringify(updated));
        } catch (e) {}
      };

      updatePaymentStatusLocal("agni_sales_payments");
      updatePaymentStatusLocal("agni_payment_demands");
      updatePaymentStatusLocal("agni_client_requests");
      if (targetPay && targetPay.clientEmail) {
        updatePaymentStatusLocal(`agni_payment_demands_${targetPay.clientEmail.toLowerCase().trim()}`);
      }

      if (targetPay && targetPay.amount) {
        updateClientPaymentMetrics(targetPay.clientId || targetPay.clientEmail || targetPay.clientCompany, Number(targetPay.amount), "MARK_PAID");
      }

      // Sync with backend invoice payment API if an invoice is linked
      const invId = targetPay?.relatedInvoiceId || targetPay?.invoiceId || targetPay?.relatedInvoice;
      if (invId && invId !== "dummy") {
        try {
          await apiFetch(`/invoices/${invId}/payments`, {
            method: "POST",
            body: {
              amount: Number(targetPay.amount || 0),
              paymentMode: targetPay.paymentMode || "ONLINE",
              referenceNumber: targetPay.transactionRef || `TXN-AGNI-${Date.now().toString().slice(-6)}`,
              remarks: "Settled by sales representative",
            },
          });
        } catch (apiErr) {
          console.warn("Could not sync invoice payment with API:", apiErr);
        }
      }

      window.dispatchEvent(new Event("agni_invoices_updated"));
      window.dispatchEvent(new Event("agni_payments_updated"));
      window.dispatchEvent(new Event("agni_clients_updated"));
      window.dispatchEvent(new Event("storage"));

      refreshPayments();
      setNotification(`✓ Payment ${pId} marked as Settled & Paid successfully.`);
    } catch (e) {
      console.warn("Could not mark payment as paid:", e);
    } finally {
      setTimeout(() => setNotification(""), 4200);
    }
  };

  const downloadReceipt = (payment) => {
    const fileContent = `
====================================================================
                      AGNI CRM - PAYMENT RECEIPT
====================================================================
Receipt ID      : ${payment.id}
Record Type     : ${payment.type}
Client Name     : ${payment.clientName}
Company         : ${payment.clientCompany}
Email           : ${payment.clientEmail}
Phone           : ${payment.clientPhone}
Date            : ${payment.date}
Due Date        : ${payment.dueDate || payment.date}
Payment Mode    : ${payment.paymentMode}
Transaction Ref : ${payment.transactionRef || "N/A"}
Status          : ${payment.status}
--------------------------------------------------------------------
PURPOSE:
${payment.description}
--------------------------------------------------------------------
AMOUNT          : ${formatCurrency(payment.amount)}
--------------------------------------------------------------------
Thank you for choosing AgniCRM.
====================================================================
`.trim();

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${payment.id}_AgniCRM_Receipt.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification(`Receipt ${payment.id} downloaded successfully.`);
    setTimeout(() => setNotification(""), 4200);
  };

  return (
    <section className="sales-page-view">
      {/* Header Banner */}
      <div className="sales-header-banner">
        <div className="sales-header-info">
          <p className="sales-header-eyebrow">Payments & Collections</p>
          <h1 className="sales-header-title">Payment Tracker</h1>
          <p className="sales-header-subtitle">
            Monitor client payment demands, collection milestones, and verified transaction receipts.
          </p>
        </div>

        <button
          type="button"
          className="sales-add-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          <span>Issue Payment Request</span>
        </button>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="sales-kpi-ribbon">
        <div className="analytics-card sales-kpi-tile">
          <span className="sales-kpi-tile-label">Total Collected</span>
          <strong className="sales-kpi-tile-value" style={{ color: "#10b981" }}>
            {formatCurrency(stats.totalCollected)}
          </strong>
          <span className="sales-kpi-tile-sub" style={{ color: "#10b981" }}>
            ✓ Verified settlements
          </span>
        </div>

        <div className="analytics-card sales-kpi-tile">
          <span className="sales-kpi-tile-label">Pending Demand</span>
          <strong className="sales-kpi-tile-value" style={{ color: "#f59e0b" }}>
            {formatCurrency(stats.totalPending)}
          </strong>
          <span className="sales-kpi-tile-sub" style={{ color: "#f59e0b" }}>
            ⏳ Awaiting payment
          </span>
        </div>

        <div className="analytics-card sales-kpi-tile">
          <span className="sales-kpi-tile-label">Collection Rate</span>
          <strong className="sales-kpi-tile-value" style={{ color: "#8c5ff8" }}>
            {stats.collectionRate}%
          </strong>
          <div className="sales-kpi-progress-bar">
            <div
              className="sales-kpi-progress-fill"
              style={{ width: `${stats.collectionRate}%` }}
            />
          </div>
        </div>

        <div className="analytics-card sales-kpi-tile">
          <span className="sales-kpi-tile-label">Total Transactions</span>
          <strong className="sales-kpi-tile-value">
            {stats.count}
          </strong>
          <span className="sales-kpi-tile-sub" style={{ color: "#7a748e" }}>
            Logged in pipeline
          </span>
        </div>
      </div>

      {/* Tabs & Filters Toolbar */}
      <div className="analytics-card sales-toolbar-card">
        {/* Segmented Tab Switcher */}
        <div className="sales-tabs-switcher">
          {PAYMENT_TABS.map((tab) => {
            const isActive = activeTab === tab;
            const count =
              tab === "All Records"
                ? userPayments.length
                : tab === "Payment Requests"
                ? userPayments.filter((p) => p.type === "Payment Request" || p.status === "Requested").length
                : userPayments.filter((p) => p.status === "Paid").length;

            return (
              <button
                key={tab}
                type="button"
                className={`sales-tab-btn ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                <span>{tab}</span>
                <span className="sales-tab-count">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Filter */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          <div className="sales-search-box">
            <span className="sales-search-icon">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search payment or client..."
            />
          </div>
        </div>
      </div>

      {notification ? (
        <div className="sales-notification-banner">
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification("")}
          >
            ✕
          </button>
        </div>
      ) : null}

      {/* Payments Table Card */}
      <div className="analytics-card sales-table-card">
        <div className="sales-table-scroll">
          <table className="sales-clients-table">
            <thead>
              <tr>
                <th>Reference ID</th>
                <th>Client & Company</th>
                <th>Type</th>
                <th>Payment Mode</th>
                <th>Amount</th>
                <th>Date / Due Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: "#8c5ff8", fontFamily: "monospace", fontSize: 13 }}>
                      {payment.id}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong className="client-name-title" style={{ display: "block" }}>{payment.clientName}</strong>
                      <span className="client-company-sub" style={{ display: "block" }}>{payment.clientCompany}</span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: payment.type === "Payment" ? "rgba(16, 185, 129, 0.12)" : "rgba(140, 95, 248, 0.12)",
                        color: payment.type === "Payment" ? "#10b981" : "#8c5ff8",
                        fontWeight: 700,
                        fontSize: 11.5,
                      }}
                    >
                      {payment.type}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 13, color: "inherit" }}>{payment.paymentMode}</span>
                  </td>
                  <td>
                    <strong style={{ fontSize: 14, fontWeight: 700, color: payment.status === "Paid" ? "#10b981" : "#f59e0b" }}>
                      {formatCurrency(payment.amount)}
                    </strong>
                  </td>
                  <td>
                    <span style={{ fontSize: 12.5, color: "#7a748e" }}>{payment.date || payment.dueDate}</span>
                  </td>
                  <td>
                    <span
                      className={`stage-tag ${payment.status === "Paid" ? "active" : "prospect"}`}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor" }} />
                      {payment.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 8 }}>
                      <button
                        type="button"
                        className="sales-view-btn"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Icon name="eye" size={13} />
                        <span>View</span>
                      </button>
                      {payment.status === "Requested" && (
                        <button
                          type="button"
                          className="sales-settle-btn"
                          onClick={() => markAsPaid(payment.id)}
                        >
                          <span>✓ Mark Paid</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="sales-empty-cell">
                    No payment records found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreatePaymentRequestModal
          clients={userSalesClients.length > 0 ? userSalesClients : (propClients && propClients.length > 0 ? propClients : [])}
          onClose={() => setShowCreateModal(false)}
          onSubmit={addPaymentRequest}
        />
      )}

      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onDownload={downloadReceipt}
        />
      )}
    </section>
  );
}