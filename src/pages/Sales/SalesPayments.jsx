import React, { useState, useMemo, useEffect } from "react";
import { apiFetch } from "../../services/apiClient";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";

import { useApiPayments } from "../../hooks/useApiPayments";
import { useApiClients } from "../../hooks/useApiClients";
import { isClientCreatedByUser } from "./hooks/useSalesClients";
import { isMockClient } from "../../utils/revenueCalculator";

const PAYMENT_TABS = ["All Records", "Payment Requests", "Settlement Approvals", "Completed Payments"];
const PAYMENT_MODES = ["Bank Transfer", "UPI", "Cheque", "Online Gateway"];

const initialPayments = [];

const statusBadge = {
  Paid: "#10b981",
  Requested: "#f59e0b",
  Pending: "#f59e0b",
  "Awaiting Sales Approval": "#8c5ff8",
  "Awaiting Approval": "#8c5ff8",
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
  const isSec = client.isPrimary === false || client.processType === "secondary" || client.serviceType === "More Services" || (typeof client.appId === "string" && (client.appId.endsWith("-S") || client.appId.endsWith("-E")));
  const rawTotal = parseFloat(String(client.totalPayment || client.amount || 0).replace(/[^0-9.]/g, "")) || 0;
  const total = (!isSec && rawTotal === 0) ? 118000 : rawTotal;
  const rawRec = parseFloat(String(client.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0;
  const received = (!isSec && rawRec === 0 && (client.paymentStatus === "Paid" || client.approvalStatus === "ACTIVE")) ? total : rawRec;
  if (total > 0) return Math.max(0, total - received);
  if (client.paymentPending !== undefined && client.paymentPending !== null && client.paymentPending !== "") {
    const parsed = parseFloat(String(client.paymentPending).replace(/[^0-9.]/g, ""));
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function CreatePaymentRequestModal({ clients = [], onClose, onSubmit, salesPersonName, userEmail }) {
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

    const year = new Date().getFullYear();
    const uniqueSuffix = Date.now().toString(36).slice(-4).toUpperCase() + Math.floor(Math.random() * 90 + 10);
    const reqId = `REQ-${year}-${uniqueSuffix}`;

    const resolvedCompany = selectedClient?.companyName || selectedClient?.company || selectedClient?.name || "Client";
    const resolvedClientName = selectedClient?.name || selectedClient?.representativeName || selectedClient?.contactPerson || resolvedCompany;
    const resolvedEmail = (selectedClient?.email || "").toLowerCase().trim();
    const resolvedPhone = selectedClient?.phone || selectedClient?.contactNumber || "";
    const resolvedScheme = selectedClient?.scheme || selectedClient?.serviceName || selectedClient?.serviceType || "Consultancy Service";
    const resolvedClientId = selectedClient?.dbId || selectedClient?.id || selectedClient?.clientId || "";

    const spName = salesPersonName || localStorage.getItem("agni_user_name") || "Sales Representative";
    const spEmail = userEmail || localStorage.getItem("agni_user_email") || "";
    const spId = localStorage.getItem("agni_user_id") || "";

    const request = {
      id: reqId,
      paymentId: reqId,
      clientId: resolvedClientId,
      clientName: resolvedClientName,
      clientCompany: resolvedCompany,
      company: resolvedCompany,
      companyName: resolvedCompany,
      clientEmail: resolvedEmail,
      email: resolvedEmail,
      clientPhone: resolvedPhone,
      phone: resolvedPhone,
      type: "Payment Request",
      amount: Number(formData.amount),
      paymentMode: "Online Gateway",
      transactionRef: "",
      date: new Date().toISOString().split("T")[0],
      dueDate: formData.dueDate,
      status: "Requested",
      relatedInvoice: selectedClient?.invoices?.[0]?.invoiceNo || "",
      relatedInvoiceId: selectedClient?.invoices?.[0]?.id || "",
      description: `Payment demand for ${resolvedCompany} (${resolvedScheme}).`,
      salesPerson: spName,
      salesPersonEmail: spEmail,
      salesPersonId: spId,
      receivedBy: spName,
      createdAt: new Date().toISOString(),
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

function PaymentDetailsModal({ payment, onClose, onDownload, onApprove, onReject }) {
  if (!payment) return null;
  const isAwaiting = String(payment.status || "").toLowerCase().includes("awaiting");

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
                  background: isAwaiting ? "rgba(140, 95, 248, 0.15)" : `${statusBadge[payment.status] || "#f59e0b"}22`,
                  color: isAwaiting ? "#8c5ff8" : (statusBadge[payment.status] || "#f59e0b"),
                  fontWeight: 700,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                {isAwaiting ? "Awaiting Sales Approval" : payment.status}
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
        <div style={{ display: "flex", justifyContent: "flex-end", flexWrap: "wrap", gap: 12, marginTop: 6 }}>
          {payment.status !== "Paid" && onApprove && (
            <button
              type="button"
              className="sales-add-btn"
              style={{ background: "#10b981", borderColor: "#10b981", padding: "9px 20px" }}
              onClick={() => {
                onApprove(payment);
                onClose();
              }}
            >
              <span>✓ Mark as Paid</span>
            </button>
          )}
          {payment.status === "Paid" && (
            <button className="sales-btn-secondary" type="button" onClick={() => onDownload(payment)} style={{ padding: "9px 18px" }}>
              📥 Download Receipt
            </button>
          )}
          <button className="sales-btn-secondary" type="button" onClick={onClose} style={{ padding: "9px 24px" }}>
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

  // Consolidate current salesperson's active clients, prioritizing PostgreSQL database records
  const userSalesClients = useMemo(() => {
    const list = [];
    const addedKeys = new Set();

    const apiById = new Map();
    const apiByAppId = new Map();
    const apiByEmailScheme = new Map();

    (apiClients || []).forEach((c) => {
      if (!c) return;
      if (c.id) apiById.set(String(c.id), c);
      if (c.appId) apiByAppId.set(String(c.appId), c);
      const scheme = c.scheme || c.serviceName || "";
      const email = c.email || "";
      if (email && scheme) {
        apiByEmailScheme.set(`${email.trim().toLowerCase()}_${scheme.trim().toLowerCase()}`, c);
      }
    });

    const addC = (c) => {
      if (!c) return;
      if (userRole !== "Admin" && userRole !== "Owner" && userRole !== "Branch Manager" && userRole !== "Manager") {
        if (!isClientCreatedByUser(c, currentSalesName, currentUserEmail)) return;
      }

      const cId = c.id ? String(c.id) : "";
      const cAppId = c.appId ? String(c.appId) : "";
      const scheme = c.scheme || c.serviceName || "";
      const email = (c.email || "").trim().toLowerCase();
      const emailSchemeKey = email && scheme ? `${email}_${scheme.trim().toLowerCase()}` : "";

      const matchedDb = (cId && apiById.get(cId)) ||
                        (cAppId && apiByAppId.get(cAppId)) ||
                        (emailSchemeKey && apiByEmailScheme.get(emailSchemeKey));

      const merged = matchedDb
        ? {
            ...c,
            ...matchedDb,
            id: matchedDb.id,
            dbId: matchedDb.id,
            clientId: matchedDb.id,
            email: matchedDb.email || c.email,
            company: matchedDb.companyName || matchedDb.name || c.company,
            companyName: matchedDb.companyName || matchedDb.name || c.companyName,
            name: matchedDb.name || matchedDb.contactPerson || c.name,
            scheme: matchedDb.scheme || matchedDb.serviceName || c.scheme || c.serviceName,
            serviceName: matchedDb.serviceName || matchedDb.scheme || c.serviceName || c.scheme,
            totalPayment: matchedDb.totalPayment ?? c.totalPayment,
            paymentReceived: matchedDb.paymentReceived ?? c.paymentReceived,
            paymentPending: matchedDb.paymentPending ?? c.paymentPending,
          }
        : {
            ...c,
            scheme: c.scheme || c.serviceName,
            serviceName: c.serviceName || c.scheme,
          };

      const uniqueKey = merged.id || merged.appId || (emailSchemeKey || `${merged.email || merged.company || merged.name}_${merged.scheme || ""}`);
      const normalizedKey = String(uniqueKey).trim().toLowerCase();

      if (normalizedKey && !addedKeys.has(normalizedKey)) {
        addedKeys.add(normalizedKey);
        list.push(merged);
      }
    };

    if (Array.isArray(apiClients)) apiClients.forEach(addC);
    if (Array.isArray(propClients)) propClients.forEach(addC);

    return list;
  }, [propClients, apiClients, currentSalesName, currentUserEmail, userRole]);

  // Filter payment records belonging specifically to current salesperson
  const userPayments = useMemo(() => {
    return payments.filter((p) => {
      if (userRole !== "Admin" && userRole !== "Owner" && userRole !== "Branch Manager" && userRole !== "Manager") {
        const pSalesperson = (p.salesPerson || p.salesPersonEmail || p.receivedBy || "").toLowerCase();
        const pClientEmail = (p.clientEmail || p.email || "").toLowerCase().trim();
        const pClientCompany = (p.clientCompany || p.clientName || p.company || p.companyName || "").toLowerCase().trim();
        const pClientId = String(p.clientId || "").toLowerCase().trim();

        const matchesClient = userSalesClients.some((c) => {
          const cEmail = (c.email || "").toLowerCase().trim();
          const cCompany = (c.company || c.name || c.companyName || "").toLowerCase().trim();
          const cId = String(c.id || "").toLowerCase().trim();
          return (cId && pClientId && cId === pClientId) ||
                 (cEmail && pClientEmail && (cEmail === pClientEmail || pClientEmail.includes(cEmail))) ||
                 (cCompany && pClientCompany && (cCompany === pClientCompany || pClientCompany.includes(cCompany)));
        });
        const matchesSalesperson =
          (currentSalesName && pSalesperson.includes(currentSalesName.toLowerCase())) ||
          (currentUserEmail && (pSalesperson.includes(currentUserEmail.toLowerCase()) || (p.salesPersonEmail && p.salesPersonEmail.toLowerCase() === currentUserEmail.toLowerCase())));

        if (!matchesClient) {
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
      const pend = getPendingPayment(c);
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
    return userPayments.filter((p) => {
      // Tab filter
      const isSettlement = String(p.status || "").toLowerCase().includes("awaiting");
      if (activeTab === "Payment Requests") {
        if (isSettlement) return false;
        if (!(p.type === "Payment Request" || p.status === "Requested" || p.status === "Pending")) {
          return false;
        }
      }
      if (activeTab === "Settlement Approvals" && !isSettlement) {
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
  }, [userPayments, activeTab, searchTerm]);

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

      // 3. Post to backend PostgreSQL database so request survives and syncs across all PCs
      try {
        const cEmail = (newReq.clientEmail || newReq.email || "").toLowerCase().trim();
        const cComp = newReq.clientCompany || newReq.companyName || newReq.company || "";
        const cName = newReq.clientName || newReq.name || "";

        // Attempt to resolve real DB UUID from apiClients
        const matchedDbClient = (apiClients || []).find((c) => {
          if (!c) return false;
          if (newReq.clientId && (c.id === newReq.clientId || c.dbId === newReq.clientId || c.appId === newReq.clientId)) return true;
          return false;
        }) || (apiClients || []).find((c) => {
          if (!c) return false;
          const dbComp = (c.companyName || c.company || "").toLowerCase().trim();
          const dbName = (c.name || "").toLowerCase().trim();
          if (cComp && (dbComp === cComp.toLowerCase().trim() || dbName === cComp.toLowerCase().trim())) return true;
          if (cName && (dbName === cName.toLowerCase().trim() || dbComp === cName.toLowerCase().trim())) return true;
          return false;
        }) || (apiClients || []).find((c) => {
          if (!c) return false;
          const dbEmail = (c.email || "").toLowerCase().trim();
          return cEmail && dbEmail === cEmail;
        });

        const effectiveClientId = matchedDbClient?.id || (newReq.clientId && !newReq.clientId.startsWith("client-") ? newReq.clientId : undefined);

        const requestPayload = {
          clientId: effectiveClientId || newReq.clientId,
          clientEmail: cEmail,
          clientName: cName,
          companyName: cComp,
          amount: Number(newReq.amount || 0),
          paymentId: newReq.id || newReq.paymentId,
          dueDate: newReq.dueDate,
          description: newReq.description || `Payment demand for ${cComp || cName}`,
          paymentMode: "ONLINE",
        };

        const res = await apiFetch("/invoices/payment-requests", {
          method: "POST",
          body: requestPayload,
        });

        if (res.ok) {
          const resJson = await res.json().catch(() => null);
          console.log("✓ Payment request successfully recorded in PostgreSQL database:", resJson);
          if (resJson && (resJson.id || resJson.paymentId)) {
            const dbReq = { ...newReq, ...resJson, id: resJson.paymentId || resJson.id || newReq.id };
            saveToKey("agni_sales_payments");
            saveToKey("agni_payment_demands");
            if (cEmail) saveToKey(`agni_payment_demands_${cEmail}`);
          }
        } else {
          console.warn("Backend API returned non-OK status for payment-request:", res.status);
        }
      } catch (backendErr) {
        console.warn("Could not post payment request to backend API:", backendErr);
      }

      await refreshPayments();
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
      const cleanPayId = String(pId || "").replace(/^SETTLE-/, "");
      const targetAmount = Number(targetPay?.amount || 0);
      const targetEmail = String(targetPay?.clientEmail || "").toLowerCase().trim();
      const targetComp = String(targetPay?.clientCompany || targetPay?.clientName || "").toLowerCase().trim();
      const targetId = String(targetPay?.clientId || "").toLowerCase().trim();
      const txnRef = targetPay?.transactionRef || `TXN-AGNI-${Date.now().toString().slice(-6)}`;

      const updatePaymentStatusLocal = (key) => {
        try {
          const saved = localStorage.getItem(key);
          if (!saved) return;
          const list = JSON.parse(saved);
          if (!Array.isArray(list)) return;
          const updated = list.map((p) => {
            const curPId = String(p.id || p.paymentId || "");
            const matches =
              curPId === String(pId) ||
              curPId === cleanPayId ||
              curPId.replace(/^SETTLE-/, "") === cleanPayId ||
              (targetEmail && String(p.clientEmail || "").toLowerCase().trim() === targetEmail && Number(p.amount) === targetAmount);

            if (matches) {
              return {
                ...p,
                status: "Paid",
                transactionRef: txnRef,
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
      if (targetEmail) {
        updatePaymentStatusLocal(`agni_payment_demands_${targetEmail}`);
      }

      // Also mark as approved in agni_pending_payment_settlement_requests
      try {
        const savedSettles = localStorage.getItem("agni_pending_payment_settlement_requests");
        if (savedSettles) {
          const sList = JSON.parse(savedSettles);
          if (Array.isArray(sList)) {
            const updatedSettles = sList.map((s) => {
              const sPId = String(s.paymentId || s.rawId || s.id || "");
              if (sPId === String(pId) || sPId === cleanPayId || (targetEmail && String(s.clientEmail || "").toLowerCase().trim() === targetEmail && Number(s.amount) === targetAmount)) {
                return { ...s, status: "Approved", decisionDate: new Date().toISOString() };
              }
              return s;
            });
            localStorage.setItem("agni_pending_payment_settlement_requests", JSON.stringify(updatedSettles));
          }
        }
      } catch (e) {}

      // Update backend database client record via PATCH /clients/:id
      let dbClients = [];
      try {
        const res = await apiFetch("/clients");
        if (res.ok) {
          const resJson = await res.json();
          if (Array.isArray(resJson.data)) dbClients = resJson.data;
        }
      } catch (e) {}

      const foundDbClient =
        (targetId && targetId !== "1" ? dbClients.find((c) => String(c.id || "").toLowerCase().trim() === targetId) : null) ||
        dbClients.find((c) => {
          const cEmail = String(c.email || "").toLowerCase().trim();
          const curPend = Math.max(0, Number(c.totalPayment || c.amount || 0) - Number(c.paymentReceived || 0));
          return targetEmail && cEmail === targetEmail && Math.abs(curPend - targetAmount) < 5;
        }) ||
        dbClients.find((c) => {
          const cCompany = String(c.companyName || c.name || "").toLowerCase().trim();
          const curPend = Math.max(0, Number(c.totalPayment || c.amount || 0) - Number(c.paymentReceived || 0));
          return targetComp && (cCompany.includes(targetComp) || targetComp.includes(cCompany)) && Math.abs(curPend - targetAmount) < 5;
        }) ||
        dbClients.find((c) => {
          const cEmail = String(c.email || "").toLowerCase().trim();
          return targetEmail && cEmail === targetEmail;
        }) ||
        dbClients.find((c) => {
          const cCompany = String(c.companyName || c.name || "").toLowerCase().trim();
          return targetComp && (cCompany.includes(targetComp) || targetComp.includes(cCompany));
        });

      let newRec = targetAmount;
      let newPend = 0;

      if (foundDbClient) {
        const curRec = parseFloat(String(foundDbClient.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0;
        const curTot = parseFloat(String(foundDbClient.totalPayment || foundDbClient.amount || 0).replace(/[^0-9.]/g, "")) || (curRec + targetAmount);
        newRec = Math.min(curTot, curRec + targetAmount);
        newPend = Math.max(0, curTot - newRec);

        try {
          await apiFetch(`/clients/${foundDbClient.id}`, {
            method: "PATCH",
            body: { paymentReceived: newRec },
          });
        } catch (err) {
          console.warn("Could not patch client paymentReceived from SalesPayments:", err);
        }

      }

      // Mark payment as paid in database so all PCs update
      try {
        await apiFetch(`/invoices/payments/${cleanPayId}/mark-paid`, {
          method: "PATCH",
        });
      } catch (markErr) {
        try {
          await apiFetch(`/invoices/payments/${pId}/mark-paid`, {
            method: "PATCH",
          });
        } catch (e) {}
      }

      // Update client caches in localStorage
      const resolvedClientId = foundDbClient ? String(foundDbClient.id || "").toLowerCase().trim() : (targetId !== "1" ? targetId : "");
      ["agni_sales_clients", "agni_branch_clients", "agni_clients"].forEach((key) => {
        try {
          const saved = localStorage.getItem(key);
          let list = saved ? JSON.parse(saved) : (dbClients.length > 0 ? dbClients : []);
          if (Array.isArray(list)) {
            let matched = false;
            list = list.map((c) => {
              const cId = String(c.id || "").toLowerCase().trim();
              const cEmail = String(c.email || "").toLowerCase().trim();
              const cCompany = String(c.company || c.name || c.companyName || "").toLowerCase().trim();
              const curPend = Math.max(0, Number(c.totalPayment || c.amount || 0) - Number(c.paymentReceived || 0));

              const isMatch =
                (resolvedClientId && cId === resolvedClientId) ||
                (!resolvedClientId && (
                  (targetEmail && cEmail === targetEmail && Math.abs(curPend - targetAmount) < 5) ||
                  (targetComp && (cCompany.includes(targetComp) || targetComp.includes(cCompany)) && Math.abs(curPend - targetAmount) < 5) ||
                  (list.length === 1)
                ));

              if (isMatch) {
                matched = true;
                const cRec = parseFloat(String(c.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0;
                const cTot = parseFloat(String(c.totalPayment || c.amount || 0).replace(/[^0-9.]/g, "")) || (cRec + targetAmount);
                const updatedRec = Math.min(cTot, Math.max(newRec, cRec + targetAmount));
                const updatedPend = Math.max(0, cTot - updatedRec);
                return {
                  ...c,
                  paymentReceived: String(updatedRec),
                  paymentPending: String(updatedPend),
                };
              }
              return c;
            });

            if (!matched && (targetEmail || targetComp)) {
              list.push({
                id: resolvedClientId || `client-${Date.now()}`,
                name: targetPay?.clientName || targetComp,
                company: targetComp,
                companyName: targetComp,
                email: targetEmail,
                paymentReceived: String(newRec),
                paymentPending: String(newPend),
                totalPayment: String(newRec + newPend),
              });
            }
            localStorage.setItem(key, JSON.stringify(list));
          }
        } catch (e) {}
      });

      // Sync with backend invoice payment API if an invoice is linked
      const invId = targetPay?.relatedInvoiceId || targetPay?.invoiceId || targetPay?.relatedInvoice;
      if (invId && invId !== "dummy") {
        try {
          await apiFetch(`/invoices/${invId}/payments`, {
            method: "POST",
            body: {
              amount: targetAmount,
              paymentMode: targetPay?.paymentMode || "ONLINE",
              referenceNumber: txnRef,
              remarks: "Settled by sales representative",
            },
          });
        } catch (apiErr) {
          console.warn("Could not sync invoice payment with API:", apiErr);
        }
      }

      window.dispatchEvent(new Event("agni_invoices_updated"));
      window.dispatchEvent(new Event("agni_payments_updated"));
      window.dispatchEvent(new Event("agni_requests_updated"));
      window.dispatchEvent(new Event("agni_pending_updated"));
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

  const approvePaymentSettlement = async (paymentTarget) => {
    const pId = typeof paymentTarget === "object" ? paymentTarget.id : paymentTarget;
    const targetPay = payments.find((p) => String(p.id) === String(pId)) || paymentTarget;
    await markAsPaid(targetPay);

    // Also update any matching pending payment settlement requests in localStorage
    try {
      const saved = localStorage.getItem("agni_pending_payment_settlement_requests");
      if (saved) {
        let list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const cleanPayId = String(pId || "").replace(/^SETTLE-/, "");
          list = list.map((s) => {
            const sPId = String(s.paymentId || s.rawId || s.id || "");
            return sPId === String(pId) || sPId === cleanPayId || s.id === pId
              ? { ...s, status: "Approved", decisionDate: new Date().toISOString() }
              : s;
          });
          localStorage.setItem("agni_pending_payment_settlement_requests", JSON.stringify(list));
        }
      }
    } catch (e) {}

    window.dispatchEvent(new Event("agni_requests_updated"));
    setNotification(`✓ Settlement of ${formatCurrency(targetPay?.amount || 0)} for ${targetPay?.clientName || 'Client'} approved! Official receipt released.`);
  };

  const rejectPaymentSettlement = (paymentTarget) => {
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
                status: "Requested",
                transactionRef: undefined,
                rejectionReason: "Settlement verification rejected by sales representative.",
                rejectedAt: new Date().toISOString(),
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

      // Also update any matching pending payment settlement requests in localStorage
      try {
        const saved = localStorage.getItem("agni_pending_payment_settlement_requests");
        if (saved) {
          let list = JSON.parse(saved);
          if (Array.isArray(list)) {
            list = list.map((s) =>
              String(s.paymentId) === String(pId) || s.id === pId
                ? { ...s, status: "Declined", decisionDate: new Date().toISOString() }
                : s
            );
            localStorage.setItem("agni_pending_payment_settlement_requests", JSON.stringify(list));
          }
        }
      } catch (e) {}

      window.dispatchEvent(new Event("agni_payments_updated"));
      window.dispatchEvent(new Event("agni_requests_updated"));
      window.dispatchEvent(new Event("storage"));

      refreshPayments();
      setNotification(`Payment settlement for ${targetPay?.clientName || pId} rejected. Demand returned to pending for client.`);
    } catch (e) {
      console.warn("Could not reject settlement:", e);
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
            const isSettlement = (p) => String(p.status || "").toLowerCase().includes("awaiting");
            const count =
              tab === "All Records"
                ? userPayments.length
                : tab === "Payment Requests"
                ? userPayments.filter((p) => (p.type === "Payment Request" || p.status === "Requested" || p.status === "Pending") && !isSettlement(p)).length
                : tab === "Settlement Approvals"
                ? userPayments.filter(isSettlement).length
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
                    {String(payment.status || "").toLowerCase().includes("awaiting") ? (
                      <span
                        className="stage-tag"
                        style={{
                          background: "rgba(140, 95, 248, 0.12)",
                          color: "#8c5ff8",
                          borderColor: "rgba(140, 95, 248, 0.3)",
                          fontWeight: 700,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: "#8c5ff8" }} />
                        Awaiting Approval
                      </span>
                    ) : (
                      <span
                        className={`stage-tag ${payment.status === "Paid" ? "active" : "prospect"}`}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor" }} />
                        {payment.status}
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                      <button
                        type="button"
                        className="sales-view-btn"
                        onClick={() => setSelectedPayment(payment)}
                      >
                        <Icon name="eye" size={13} />
                        <span>View</span>
                      </button>
                      {payment.status !== "Paid" && (
                        <button
                          type="button"
                          className="sales-settle-btn"
                          style={{ background: "#10b981", borderColor: "#10b981", color: "#ffffff", fontWeight: 700 }}
                          onClick={() => markAsPaid(payment)}
                          title="Verify and mark payment as paid"
                        >
                          <span>✓ Mark as Paid</span>
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
          salesPersonName={currentSalesName}
          userEmail={currentUserEmail}
          onClose={() => setShowCreateModal(false)}
          onSubmit={addPaymentRequest}
        />
      )}

      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onDownload={downloadReceipt}
          onApprove={approvePaymentSettlement}
          onReject={rejectPaymentSettlement}
        />
      )}
    </section>
  );
}