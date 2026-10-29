import React, { useState, useMemo, useEffect } from "react";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";
import { apiFetch } from "../../services/apiClient";
import { useAuth } from "../../context/AuthContext";
import { isClientCreatedByUser } from "./hooks/useSalesClients";

function getClientPendingAmount(client) {
  if (!client) return 0;
  if (client.paymentPending !== undefined && client.paymentPending !== null && client.paymentPending !== "") {
    const parsed = parseFloat(String(client.paymentPending).replace(/[^0-9.]/g, ""));
    if (!isNaN(parsed)) return Math.max(0, parsed);
  }
  const isSec =
    client.isPrimary === false ||
    client.processType === "secondary" ||
    client.serviceType === "More Services" ||
    (typeof client.appId === "string" && (client.appId.endsWith("-S") || client.appId.endsWith("-E")));
  const rawTotal = parseFloat(String(client.totalPayment || client.amount || 0).replace(/[^0-9.]/g, "")) || 0;
  const total = !isSec && rawTotal === 0 ? 118000 : rawTotal;
  const rawRec = parseFloat(String(client.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0;
  const received = client.paymentStatus === "Paid" ? total : rawRec;
  return Math.max(0, total - received);
}

const PAYMENT_CHANNELS = [
  { id: "Bank Transfer", label: "Bank Transfer (NEFT / RTGS / IMPS)" },
  { id: "UPI", label: "UPI / QR Code (PhonePe, GPay, Paytm)" },
  { id: "Cheque", label: "Cheque / Demand Draft" },
  { id: "Cash", label: "Cash Collection" },
];

export default function RecordExternalPaymentModal({
  isOpen = true,
  clients = [],
  preselectedClient = null,
  onClose,
  onSuccess,
  salesPersonName,
  userEmail,
}) {
  const { user, userName: authName, userEmail: authEmail, userRole: authRole } = useAuth();
  const currentSalesName = salesPersonName || authName || user?.fullName || user?.name || "";
  const currentUserEmail = userEmail || authEmail || user?.email || "";
  const currentUserId = user?.id || "";
  const userRole = authRole || user?.role || "";

  // Fallback internal clients if clients prop is empty
  const [internalClients, setInternalClients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!clients || clients.length === 0) {
      apiFetch("/clients")
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.data)) {
            setInternalClients(d.data);
          }
        })
        .catch(() => {});
    }
  }, [clients]);

  const rawList = useMemo(() => {
    if (Array.isArray(clients) && clients.length > 0) return clients;
    if (internalClients.length > 0) return internalClients;
    return [];
  }, [clients, internalClients]);

  // Filter clients to those with pending balance > 0 (or preselected client)
  const eligibleClients = useMemo(() => {
    const list = [];
    const seen = new Set();

    rawList.forEach((c) => {
      if (!c) return;
      if (userRole !== "Admin" && userRole !== "Owner" && userRole !== "Branch Manager" && userRole !== "Manager") {
        if (!isClientCreatedByUser(c, currentSalesName, currentUserEmail)) return;
      }
      const key = String(c.id || c.appId || c.email || c.companyName || c.name).trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        // Include if pending > 0 or if it's the preselected client
        const pending = getClientPendingAmount(c);
        if (pending > 0 || (preselectedClient && String(c.id) === String(preselectedClient.id))) {
          list.push(c);
        }
      }
    });

    return list;
  }, [rawList, currentSalesName, currentUserEmail, userRole, preselectedClient]);

  const [selectedClientId, setSelectedClientId] = useState(() => {
    if (preselectedClient?.id) return String(preselectedClient.id);
    return eligibleClients[0]?.id ? String(eligibleClients[0].id) : "";
  });

  const selectedClient = useMemo(() => {
    if (preselectedClient && (!selectedClientId || String(selectedClientId) === String(preselectedClient.id))) {
      return preselectedClient;
    }
    return eligibleClients.find((c) => String(c.id) === String(selectedClientId)) || eligibleClients[0] || null;
  }, [eligibleClients, selectedClientId, preselectedClient]);

  const pendingAmount = useMemo(() => {
    return getClientPendingAmount(selectedClient);
  }, [selectedClient]);

  const [amount, setAmount] = useState("");
  const [paymentChannel, setPaymentChannel] = useState("Bank Transfer");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // When selected client changes, pre-fill amount with remaining balance if empty
  useEffect(() => {
    if (selectedClient && (!amount || Number(amount) === 0)) {
      const p = getClientPendingAmount(selectedClient);
      if (p > 0) setAmount(String(p));
    }
  }, [selectedClient]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setFormError("");

    if (!selectedClient) {
      setFormError("Please select a client account.");
      return;
    }

    const numericAmount = parseFloat(String(amount).replace(/[^0-9.]/g, ""));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setFormError("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    if (pendingAmount > 0 && numericAmount > pendingAmount) {
      setFormError(
        `Payment amount (₹${numericAmount.toLocaleString("en-IN")}) cannot exceed the pending balance (₹${pendingAmount.toLocaleString("en-IN")}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const clientName = selectedClient.name || selectedClient.contactPerson || "Client";
      const companyName = selectedClient.companyName || selectedClient.company || clientName;
      const clientEmail = (selectedClient.email || "").trim().toLowerCase();

      // Clean reference number or auto-generated fallback if omitted
      const trimmedRef = referenceNumber.trim();
      const channelSlug = paymentChannel.toUpperCase().replace(/[^A-Z0-9]/g, "") || "OFFLINE";
      const effectiveRef = trimmedRef || `EXT-${channelSlug}-${Date.now().toString().slice(-6)}`;

      const reason = `External payment of ₹${numericAmount.toLocaleString("en-IN")} received via ${paymentChannel}${trimmedRef ? ` (Ref: ${trimmedRef})` : ""}. Awaiting Manager sign-off.`;

      const requestPayload = {
        clientId: selectedClient.id,
        targetEntityId: selectedClient.id,
        targetEntityType: "CLIENT",
        requestType: "EXTERNAL_PAYMENT",
        reason: reason,
        requestedChanges: {
          category: "External Payment",
          clientId: selectedClient.id,
          clientName: clientName,
          companyName: companyName,
          clientEmail: clientEmail,
          amount: numericAmount,
          paymentMode: "OFFLINE",
          paymentChannel: paymentChannel,
          referenceNumber: effectiveRef,
          paymentDate: paymentDate || new Date().toISOString().split("T")[0],
          salesPersonId: currentUserId || user?.id,
          salesPersonName: currentSalesName,
          salesPersonEmail: currentUserEmail,
          branchId: selectedClient.branchId || user?.branchId || null,
          notes: notes.trim() || `Collected externally via ${paymentChannel}`,
        },
      };

      const res = await apiFetch("/requests", {
        method: "POST",
        body: requestPayload,
      });

      const resData = await res.json().catch(() => ({}));
      if (res.ok && resData.success) {
        window.dispatchEvent(new CustomEvent("agni_requests_updated"));
        window.dispatchEvent(new CustomEvent("agni_pending_updated"));
        window.dispatchEvent(new CustomEvent("agni_clients_updated"));
        window.dispatchEvent(new CustomEvent("agni_payments_updated"));
        window.dispatchEvent(new Event("storage"));

        if (onSuccess) {
          onSuccess(
            `✓ External payment of ₹${numericAmount.toLocaleString("en-IN")} for "${companyName}" submitted to Manager for approval!`,
            resData.data
          );
        }
        if (onClose) onClose();
      } else {
        setFormError(resData.message || "Failed to submit external payment request. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting external payment:", err);
      setFormError("Network or server error while submitting. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalFooter = (
    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 12, width: "100%", paddingTop: 8 }}>
      <button
        type="button"
        className="sales-btn-secondary"
        onClick={onClose}
        disabled={isSubmitting}
        style={{ padding: "9px 18px", borderRadius: 8 }}
      >
        Cancel
      </button>
      <button
        type="button"
        className="sales-add-btn"
        onClick={handleSubmit}
        disabled={isSubmitting || !amount || Number(amount) <= 0}
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "#fff",
          border: "none",
          padding: "9px 22px",
          borderRadius: 8,
          fontWeight: 700,
          cursor: isSubmitting || !amount || Number(amount) <= 0 ? "not-allowed" : "pointer",
          opacity: isSubmitting || !amount || Number(amount) <= 0 ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          gap: 6,
          boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
        }}
      >
        <span>{isSubmitting ? "Submitting..." : "✓ Submit for Manager Approval"}</span>
      </button>
    </div>
  );

  return (
    <Modal title="Record External Payment" onClose={onClose} closeLabel="Close" footer={modalFooter}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Information Callout */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.04) 100%)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            borderRadius: 10,
            padding: "10px 14px",
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>💰</span>
          <div style={{ fontSize: 12.5, color: "#065f46", lineHeight: 1.45 }}>
            <strong>Record Offline / External Collection</strong>
            <p style={{ margin: "2px 0 0", color: "#047857" }}>
              Report payments collected outside the CRM. Once approved by your <strong>Sales Manager</strong>, your quota will be credited, the client's balance will clear, and revenue will appear in Owner & Manager reports.
            </p>
          </div>
        </div>

        {formError && (
          <div
            style={{
              padding: "9px 12px",
              borderRadius: 8,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontSize: 12.5,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>⚠️</span>
            <span>{formError}</span>
          </div>
        )}

        {/* Client Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>
            Select Client Account <span style={{ color: "#f43f5e" }}>*</span>
          </label>
          <select
            value={selectedClientId}
            onChange={(e) => {
              setSelectedClientId(e.target.value);
              const found = eligibleClients.find((c) => String(c.id) === String(e.target.value));
              if (found) {
                const p = getClientPendingAmount(found);
                if (p > 0) setAmount(String(p));
              }
            }}
            disabled={Boolean(preselectedClient)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13.5,
              fontFamily: "inherit",
              boxSizing: "border-box",
              background: preselectedClient ? "#f8fafc" : "#fff",
            }}
            required
          >
            {eligibleClients.map((c) => {
              const comp = c.companyName || c.company || c.name || "Client";
              const p = getClientPendingAmount(c);
              return (
                <option key={c.id} value={c.id}>
                  {comp} — Remaining Pending: ₹{p.toLocaleString("en-IN")}
                </option>
              );
            })}
          </select>
        </div>

        {/* Selected Client Summary Card */}
        {selectedClient && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 8,
              padding: "10px 14px",
              background: "rgba(140, 95, 248, 0.05)",
              border: "1px solid rgba(140, 95, 248, 0.15)",
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            <div>
              <span style={{ color: "#64748b", display: "block" }}>Service Scheme</span>
              <strong style={{ color: "#1e293b" }}>
                {selectedClient.scheme || selectedClient.serviceName || "Standard Retainer"}
              </strong>
            </div>
            <div>
              <span style={{ color: "#64748b", display: "block" }}>Agreed Fee</span>
              <strong style={{ color: "#1e293b" }}>
                ₹{(parseFloat(selectedClient.totalPayment || selectedClient.amount || 0) || 118000).toLocaleString("en-IN")}
              </strong>
            </div>
            <div>
              <span style={{ color: "#64748b", display: "block" }}>Already Received</span>
              <strong style={{ color: "#10b981" }}>
                ₹{parseFloat(selectedClient.paymentReceived || 0).toLocaleString("en-IN")}
              </strong>
            </div>
            <div>
              <span style={{ color: "#64748b", display: "block" }}>Remaining Pending</span>
              <strong style={{ color: "#d97706", fontSize: 13 }}>
                ₹{pendingAmount.toLocaleString("en-IN")}
              </strong>
            </div>
          </div>
        )}

        {/* Amount Input & Quick Fill */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>
              Amount Collected (₹) <span style={{ color: "#f43f5e" }}>*</span>
            </label>
            {pendingAmount > 0 && (
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setAmount(String(pendingAmount))}
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#059669",
                    padding: "2px 7px",
                    borderRadius: 4,
                    fontSize: 11,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Full (₹{pendingAmount.toLocaleString("en-IN")})
                </button>
                {pendingAmount >= 10000 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.round(pendingAmount / 2)))}
                    style={{
                      background: "rgba(140, 95, 248, 0.1)",
                      border: "1px solid rgba(140, 95, 248, 0.3)",
                      color: "#7c3aed",
                      padding: "2px 7px",
                      borderRadius: 4,
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    50% (₹{Math.round(pendingAmount / 2).toLocaleString("en-IN")})
                  </button>
                )}
              </div>
            )}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 25000"
            min="1"
            max={pendingAmount > 0 ? pendingAmount : undefined}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 14.5,
              fontWeight: 700,
              color: "#1e293b",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            required
          />
        </div>

        {/* Payment Channel & Date Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>
              Payment Channel <span style={{ color: "#f43f5e" }}>*</span>
            </label>
            <select
              value={paymentChannel}
              onChange={(e) => setPaymentChannel(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              required
            >
              {PAYMENT_CHANNELS.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b" }}>
              Date Payment Received <span style={{ color: "#f43f5e" }}>*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid #cbd5e1",
                fontSize: 13,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              required
            />
          </div>
        </div>

        {/* Reference / UTR Number (OPTIONAL) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
            <span>Transaction Ref / UTR / Cheque No.</span>
            <span style={{ color: "#64748b", fontWeight: 400, fontSize: 11.5 }}>(Optional)</span>
          </label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder={
              paymentChannel === "UPI"
                ? "e.g. 428901283912 (UPI Transaction ID or leave blank)"
                : paymentChannel === "Cheque"
                ? "e.g. CHQ-981204 (Bank & Cheque No. or leave blank)"
                : paymentChannel === "Cash"
                ? "Receipt slip number or leave blank"
                : "e.g. AXISN0123910291 (NEFT/RTGS UTR or leave blank)"
            }
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Collector Notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: "#1e293b", display: "flex", alignItems: "center", gap: 6 }}>
            <span>Collector Remarks / Notes</span>
            <span style={{ color: "#64748b", fontWeight: 400, fontSize: 11.5 }}>(Optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Payment collected during client site visit; verified in director's bank confirmation."
            rows={2}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              border: "1px solid #cbd5e1",
              fontSize: 13,
              fontFamily: "inherit",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </div>
      </form>
    </Modal>
  );
}
