import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../services/apiClient';
import { useApiPayments } from "../hooks/useApiPayments";
import { printHtmlContent } from "../utils/exportHelpers";
import { useAuth } from "../context/AuthContext";

export function isPaymentSettled(status) {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  if (s.includes("awaiting") || s.includes("verification") || s.includes("pending approval") || s.includes("pending sales")) {
    return false;
  }
  return (
    s === "paid" ||
    s === "success" ||
    s === "verified" ||
    s === "settled" ||
    s === "completed" ||
    s.includes("paid") ||
    s.includes("verified") ||
    s.includes("success") ||
    (s.includes("settled") && !s.includes("awaiting") && !s.includes("pending"))
  );
}

export function generatePaymentReceiptHTML(payment) {
  const amount = Number(payment.amount || 0);
  const formattedAmount = `₹${amount.toLocaleString("en-IN")}`;
  const isPaid = isPaymentSettled(payment.status);
  const statusLabel = isPaid ? "PAYMENT SETTLED & VERIFIED" : "PAYMENT DEMAND PENDING";
  const statusColor = isPaid ? "#10b981" : "#f59e0b";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Payment Receipt - ${payment.id}</title>
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 24px;
      background: #fff;
    }
    .receipt-box {
      max-width: 720px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 28px;
      position: relative;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #f1f5f9;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #1877f2;
      margin: 0 0 4px 0;
      letter-spacing: 0.5px;
    }
    .brand-sub {
      font-size: 12px;
      color: #64748b;
      margin: 0;
    }
    .doc-type {
      text-align: right;
    }
    .doc-title {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .doc-num {
      font-size: 13px;
      color: #64748b;
      font-family: monospace;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: ${statusColor};
      background: ${isPaid ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)"};
      border: 1px solid ${statusColor};
      margin-bottom: 20px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .info-block {
      background: #f8fafc;
      padding: 14px 16px;
      border-radius: 8px;
      border: 1px solid #f1f5f9;
    }
    .info-label {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .info-value {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .details-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .details-table th {
      background: #f1f5f9;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 10px 12px;
      text-align: left;
    }
    .details-table td {
      padding: 12px;
      font-size: 13px;
      border-bottom: 1px solid #f1f5f9;
    }
    .total-card {
      background: #1877f2;
      color: #fff;
      padding: 16px 20px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 10px;
    }
    .total-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      opacity: 0.9;
    }
    .total-amount {
      font-size: 22px;
      font-weight: 800;
    }
    .footer {
      margin-top: 30px;
      padding-top: 16px;
      border-top: 1px solid #f1f5f9;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="receipt-box">
    <div class="header">
      <div>
        <h1 class="brand-title">AGNIVRIDHI INDIA</h1>
        <p class="brand-sub">A-116, Urbtech Trade Centre, Sector-132, Noida, UP - 201304</p>
        <p class="brand-sub">GSTIN: 09ABCCA3869R1ZU • Support: account@agnivridhiindia.com</p>
      </div>
      <div class="doc-type">
        <h2 class="doc-title">PAYMENT RECEIPT</h2>
        <div class="doc-num">${payment.id}</div>
      </div>
    </div>

    <div class="status-badge">${statusLabel}</div>

    <div class="info-grid">
      <div class="info-block">
        <div class="info-label">RECEIVED FROM</div>
        <div class="info-value">${payment.clientCompany || payment.clientName || "Client Account"}</div>
        <div style="font-size: 12px; color: #64748b; margin-top: 2px;">${payment.clientEmail || ""}</div>
      </div>

      <div class="info-block">
        <div class="info-label">PAYMENT METADATA</div>
        <div style="font-size: 13px; margin-bottom: 2px;"><strong>Mode:</strong> ${payment.paymentMode || "Online Gateway"}</div>
        <div style="font-size: 13px; margin-bottom: 2px;"><strong>Transaction Ref:</strong> <span style="font-family: monospace;">${payment.transactionRef || "TXN-AGNI-SETTLED"}</span></div>
        <div style="font-size: 13px;"><strong>Date:</strong> ${payment.date || payment.dueDate || new Date().toISOString().split("T")[0]}</div>
      </div>
    </div>

    <table class="details-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Description / Particulars</th>
          <th>Payment Type</th>
          <th style="text-align: right;">Amount (Rs.)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td>${payment.description || payment.relatedInvoice ? `Payment settlement against ${payment.relatedInvoice}` : "Business & Scheme Consultancy Fee Settlement"}</td>
          <td>${payment.type || "Payment Settlement"}</td>
          <td style="text-align: right; font-weight: 700;">${formattedAmount}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-card">
      <div class="total-title">Total Amount ${isPaid ? "Received" : "Demanded"}</div>
      <div class="total-amount">${formattedAmount}</div>
    </div>

    <div class="footer">
      This is an official computer-generated payment settlement receipt issued by Agnivridhi India.<br>
      No signature required. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}

export default function PaymentsPage({ userEmail, clientInfo, initialPayment, onClearInitialPayment }) {
  const { userEmail: authEmail } = useAuth();
  const effectiveEmail = (userEmail || authEmail || "").trim().toLowerCase();
  const [activeTab, setActiveTab] = useState("All Transactions");
  const [selectedPayment, setSelectedPayment] = useState(() => {
    if (initialPayment) {
      const amt = Number(initialPayment.amount || 0);
      return {
        ...initialPayment,
        isPaid: isPaymentSettled(initialPayment.status),
        isAwaitingApproval: String(initialPayment.status || "").toLowerCase().includes("awaiting"),
        formattedAmt: `₹${amt.toLocaleString("en-IN")}`,
      };
    }
    return null;
  });
  const [notice, setNotice] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (initialPayment) {
      const amt = Number(initialPayment.amount || 0);
      setSelectedPayment({
        ...initialPayment,
        isPaid: isPaymentSettled(initialPayment.status),
        isAwaitingApproval: String(initialPayment.status || "").toLowerCase().includes("awaiting"),
        formattedAmt: `₹${amt.toLocaleString("en-IN")}`,
      });
      if (typeof onClearInitialPayment === "function") {
        onClearInitialPayment();
      }
    }
  }, [initialPayment, onClearInitialPayment]);

  const { payments: apiPayments, refreshPayments } = useApiPayments();
  
  const payments = useMemo(() => {
    const rawList = apiPayments.filter((p) => {
      const r = String(p.remarks || "").toLowerCase();
      const pId = String(p.id || p.paymentId || "");
      return !r.includes("payment collected upon client registration") && pId !== "PAY-2026-C4EF3" && pId !== "PAY-2026-F981C";
    });

    const cleanUserEmail = effectiveEmail;
    if (!cleanUserEmail && !clientInfo) return rawList;
    const clientComp = (clientInfo?.companyName || clientInfo?.company || "").trim().toLowerCase();
    const clientName = (clientInfo?.name || clientInfo?.representativeName || "").trim().toLowerCase();
    const clientId = String(clientInfo?.clientId || clientInfo?.id || "").trim().toLowerCase();
    
    return rawList.filter((p) => {
      const pEmail = (p.clientEmail || p.email || "").trim().toLowerCase();
      const pComp = (p.clientCompany || p.companyName || p.company || "").trim().toLowerCase();
      const pName = (p.clientName || p.name || "").trim().toLowerCase();
      const pClientId = String(p.clientId || p.raw?.clientId || "").trim().toLowerCase();

      if (cleanUserEmail && pEmail && pEmail === cleanUserEmail) return true;
      if (clientId && pClientId && (clientId === pClientId || clientId.includes(pClientId) || pClientId.includes(clientId))) return true;
      if (clientComp && pComp && (clientComp.includes(pComp) || pComp.includes(clientComp))) return true;
      if (clientName && pName && (clientName.includes(pName) || pName.includes(clientName))) return true;
      if (clientComp && pName && (clientComp.includes(pName) || pName.includes(clientComp))) return true;
      if (clientName && pComp && (clientName.includes(pComp) || clientComp.includes(pName))) return true;
      return false;
    });
  }, [apiPayments, userEmail, clientInfo]);

  useEffect(() => {
    const handleSync = () => {
      refreshPayments();
    };
    window.addEventListener("agni_payments_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("agni_payments_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [refreshPayments]);

  const filteredPayments = useMemo(() => {
    if (activeTab === "Completed Settlements") {
      return payments.filter((p) => isPaymentSettled(p.status));
    }
    if (activeTab === "Payment Demands") {
      return payments.filter((p) => !isPaymentSettled(p.status));
    }
    return payments;
  }, [payments, activeTab]);

  const stats = useMemo(() => {
    let totalSettled = 0;
    let totalPending = 0;
    let settledCount = 0;
    let pendingCount = 0;
    payments.forEach((p) => {
      const amt = Number(p.amount || 0);
      if (isPaymentSettled(p.status)) {
        totalSettled += amt;
        settledCount += 1;
      } else {
        totalPending += amt;
        pendingCount += 1;
      }
    });
    return {
      totalSettled,
      totalPending,
      settledCount,
      pendingCount,
      count: payments.length,
    };
  }, [payments]);

  function triggerDownloadReceipt(pay) {
    const htmlContent = generatePaymentReceiptHTML(pay);

    printHtmlContent(htmlContent);

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt_${pay.id}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotice(`Downloaded official payment receipt for ${pay.id}!`);
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        return resolve(true);
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  async function handlePayDemand(pay) {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);

    try {
      const targetPayId = pay.id || pay.paymentId;
      const cleanEmail = (pay.clientEmail || userEmail || "").toLowerCase().trim();

      // 1. Request Razorpay order from backend API
      let orderData = null;
      try {
        const orderRes = await apiFetch(`/invoices/payments/${targetPayId}/create-razorpay-order`, {
          method: "POST",
        });

        if (orderRes.ok) {
          orderData = await orderRes.json();
        } else {
          const errRes = await orderRes.json().catch(() => ({}));
          console.warn("Razorpay order creation response:", errRes);
          if (errRes.message && errRes.message.includes("keys not configured")) {
            setNotice("Razorpay API Key & Secret not yet added. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env");
          }
        }
      } catch (orderErr) {
        console.warn("Could not reach backend for Razorpay order:", orderErr);
      }

      // 2. If order created, launch Razorpay Checkout modal
      if (orderData && orderData.orderId && orderData.keyId) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setNotice("Unable to load Razorpay payment gateway. Please check your internet connection.");
          setIsProcessingPayment(false);
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount, // in paise
          currency: orderData.currency || "INR",
          name: "Agnivridhi India",
          description: pay.description || `Payment demand for ${pay.clientCompany || pay.clientName || "Client"}`,
          order_id: orderData.orderId,
          prefill: {
            name: orderData.clientName || pay.clientName || "",
            email: orderData.clientEmail || cleanEmail || "",
            contact: orderData.clientPhone || pay.clientPhone || "",
          },
          theme: {
            color: "#10b981",
          },
          handler: async function (response) {
            try {
              // Verify cryptographic HMAC signature on backend
              const verifyRes = await apiFetch(`/invoices/payments/${targetPayId}/verify-razorpay`, {
                method: "POST",
                body: {
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                },
              });

              if (verifyRes.ok) {
                setNotice(`✓ Payment of ${pay.formattedAmt} successfully submitted via Razorpay (Txn ID: ${response.razorpay_payment_id}). Status is now Awaiting Salesperson Approval.`);
                setSelectedPayment(null);
                window.dispatchEvent(new Event("agni_payments_updated"));
                window.dispatchEvent(new Event("agni_pending_updated"));
                refreshPayments();
              } else {
                setNotice("Payment captured by Razorpay. Official confirmation is being processed by server.");
              }
            } catch (vErr) {
              console.error("Verification error:", vErr);
            } finally {
              setIsProcessingPayment(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (failResp) {
          console.warn("Payment failed:", failResp.error);
          setNotice(`Payment attempt unsuccessful: ${failResp.error.description || "Transaction cancelled."}`);
          setIsProcessingPayment(false);
        });
        rzp.open();
        return;
      }

      // 3. Fallback: If Razorpay keys are not yet configured in server/.env,
      // fallback to manual submission so client workflow is never blocked
      const txnRef = pay.transactionRef || `TXN-AGNI-${Date.now().toString().slice(-6)}`;

      try {
        await apiFetch(`/invoices/payments/${targetPayId}/settle`, {
          method: "PATCH",
          body: {
            referenceNumber: txnRef,
            remarks: "Settlement submitted by client",
          },
        });
      } catch (apiErr) {
        console.warn("Could not submit settlement to backend API:", apiErr);
      }

      setNotice(`Payment demand submitted for verification. Official confirmation is being processed by server.`);

      window.dispatchEvent(new Event("agni_payments_updated"));
      window.dispatchEvent(new Event("agni_pending_updated"));

      refreshPayments();
      setSelectedPayment(null);
    } catch (e) {
      console.warn("Could not update payment status:", e);
    } finally {
      setIsProcessingPayment(false);
    }
  }

  return (
    <div className="cd-subpage-container">
      {/* Header Intro */}
      <div className="cd-subpage-intro">
        <div>
          <span className="cd-kicker">PAYMENTS & SETTLEMENTS</span>
          <h2>Payment Records & Settlement Receipts</h2>
          <p>Track settlement notices, payment demands, transaction references, and settle outstanding balances online.</p>
        </div>
        <span className="cd-count-pill">{payments.length} Transaction{payments.length !== 1 ? "s" : ""} On Record</span>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div className="cd-alert-success-banner">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)}>×</button>
        </div>
      )}

      {/* Payments Table Card */}
      <div className="cd-section-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="cd-section-head" style={{ padding: '24px 28px 16px', margin: 0, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="cd-kicker">TRANSACTION HISTORY</span>
            <h2 style={{ fontSize: 20 }}>Payment Records & Demands</h2>
          </div>

          {/* Tab Filter Buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { id: "All Transactions", label: `All Transactions (${payments.length})` },
              { id: "Completed Settlements", label: `Completed Settlements (${stats.settledCount})` },
              { id: "Payment Demands", label: `Payment Demands (${stats.pendingCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: activeTab === tab.id ? "1px solid #1877f2" : "1px solid #cbd5e1",
                  background: activeTab === tab.id ? "#1877f2" : "#fff",
                  color: activeTab === tab.id ? "#fff" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cd-table-wrap">
          {filteredPayments.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#666" }}>
              <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 6px 0", color: "#0f172a" }}>
                {activeTab === "Payment Demands" ? "No Outstanding Payment Demands ✓" : "No Payment Records Found"}
              </p>
              <p style={{ fontSize: 13, margin: 0, color: "#64748b" }}>
                {activeTab === "Payment Demands"
                  ? "All invoices and service fees are fully settled. There are no pending demands on your account."
                  : "Payment demands and receipts issued for your account will appear here automatically."}
              </p>
            </div>
          ) : (
            <table className="cd-invoices-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Record Type</th>
                  <th>Description / Scheme</th>
                  <th>Payment Mode</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((pay) => {
                  const rawStatus = (pay.status || "").toLowerCase();
                  const isPaid = isPaymentSettled(pay.status);
                  const isAwaitingApproval = !isPaid && (rawStatus.includes("awaiting") || rawStatus.includes("pending sales"));
                  const amt = Number(pay.amount || 0);
                  const formattedAmt = `₹${amt.toLocaleString("en-IN")}`;

                  return (
                    <tr key={pay.id}>
                      <td>
                        <strong className="cd-inv-id">{pay.id}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, color: isPaid ? "#10b981" : isAwaitingApproval ? "#8c5ff8" : "#f59e0b" }}>
                          {pay.type || "Payment Settlement"}
                        </span>
                      </td>
                      <td>{pay.description || pay.relatedInvoice ? `Payment for ${pay.relatedInvoice}` : "Consultancy Services Fee"}</td>
                      <td>
                        <span style={{ fontSize: 12.5, color: "#475569", fontWeight: 500 }}>
                          {pay.paymentMode || "Online Gateway"}
                        </span>
                      </td>
                      <td>{pay.date || pay.dueDate || "Today"}</td>
                      <td>
                        <strong style={{ fontSize: 14, color: isPaid ? "#10b981" : isAwaitingApproval ? "#8c5ff8" : "#f59e0b" }}>
                          {formattedAmt}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`cd-doc-status-badge ${isPaid ? "verified" : isAwaitingApproval ? "review" : "pending"}`}
                          style={{
                            background: isPaid ? "rgba(16, 185, 129, 0.12)" : isAwaitingApproval ? "rgba(140, 95, 248, 0.12)" : "rgba(245, 158, 11, 0.12)",
                            color: isPaid ? "#10b981" : isAwaitingApproval ? "#6d28d9" : "#d97706",
                            borderColor: isPaid ? "rgba(16, 185, 129, 0.3)" : isAwaitingApproval ? "rgba(140, 95, 248, 0.3)" : "rgba(245, 158, 11, 0.3)",
                          }}
                        >
                          {isPaid ? "Settled & Paid" : isAwaitingApproval ? "Awaiting Sales Approval" : "Pending Demand"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          {isPaid ? (
                            <button
                              type="button"
                              className="cd-table-action-btn"
                              style={{ background: "#10b981", color: "#fff", borderColor: "#10b981", fontWeight: 700, padding: "6px 14px" }}
                              onClick={() => triggerDownloadReceipt(pay)}
                              title="Download Official Receipt"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                              Download Receipt
                            </button>
                          ) : isAwaitingApproval ? (
                            <button
                              type="button"
                              className="cd-table-action-btn"
                              disabled
                              style={{ background: "rgba(140, 95, 248, 0.1)", color: "#6d28d9", borderColor: "rgba(140, 95, 248, 0.3)", cursor: "default", fontWeight: 600 }}
                            >
                              Awaiting Approval ⏳
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="cd-table-action-btn"
                              style={{ background: "#1877f2", color: "#fff", borderColor: "#1877f2", fontWeight: 700, padding: "6px 16px" }}
                              onClick={() => setSelectedPayment({ ...pay, isPaid, isAwaitingApproval, formattedAmt })}
                            >
                              Settle Now
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment Record Details Modal */}
      {selectedPayment && (
        <div className="cd-modal-backdrop" onMouseDown={() => setSelectedPayment(null)}>
          <section className="cd-modal cd-modal-sm" onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" className="cd-modal-close" onClick={() => setSelectedPayment(null)}>×</button>
            <span
              className={`cd-doc-status-badge ${selectedPayment.isPaid ? "verified" : selectedPayment.isAwaitingApproval ? "review" : "pending"}`}
              style={{
                marginBottom: 12,
                background: selectedPayment.isPaid ? "rgba(16, 185, 129, 0.12)" : selectedPayment.isAwaitingApproval ? "rgba(140, 95, 248, 0.12)" : "rgba(245, 158, 11, 0.12)",
                color: selectedPayment.isPaid ? "#10b981" : selectedPayment.isAwaitingApproval ? "#6d28d9" : "#d97706",
              }}
            >
              {selectedPayment.isPaid ? "Settled & Verified" : selectedPayment.isAwaitingApproval ? "Awaiting Salesperson Approval" : "Pending Payment Demand"}
            </span>
            <h2>{selectedPayment.id} ({selectedPayment.type || "Payment Record"})</h2>
            <p className="cd-modal-desc">{selectedPayment.description || "Business consultancy fee payment record."}</p>

            <div className="cd-scheme-meta-box" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 20 }}>
              <div>
                <span>Billed Client</span>
                <strong>{selectedPayment.clientCompany || selectedPayment.clientName || "Client"}</strong>
              </div>
              <div>
                <span>Payment Mode</span>
                <strong>{selectedPayment.paymentMode || "Online Gateway"}</strong>
              </div>
              <div>
                <span>Transaction Ref</span>
                <strong style={{ fontFamily: "monospace" }}>{selectedPayment.transactionRef || "TXN-AGNI-SETTLED"}</strong>
              </div>
              <div>
                <span>Transaction Date</span>
                <strong>{selectedPayment.date || selectedPayment.dueDate || "Today"}</strong>
              </div>
              <div>
                <span>Total Amount</span>
                <strong style={{ color: "#10b981" }}>{selectedPayment.formattedAmt}</strong>
              </div>
              <div>
                <span>Related Invoice</span>
                <strong>{selectedPayment.relatedInvoice || "N/A"}</strong>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedPayment.isPaid && (
                <button
                  type="button"
                  className="cd-submit-btn"
                  style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                  onClick={() => {
                    triggerDownloadReceipt(selectedPayment);
                    setSelectedPayment(null);
                  }}
                >
                  Download Official Receipt ({selectedPayment.id})
                </button>
              )}

              {selectedPayment.isAwaitingApproval && (
                <div style={{ padding: "12px 16px", borderRadius: 8, background: "rgba(140, 95, 248, 0.1)", color: "#6d28d9", fontSize: 13, textAlign: "center", fontWeight: 600 }}>
                  Payment settlement submitted! Verification approval request is pending with your Sales Representative. Receipt will be downloadable once approved.
                </div>
              )}

              {!selectedPayment.isPaid && !selectedPayment.isAwaitingApproval && (
                <button
                  type="button"
                  className="cd-submit-btn"
                  style={{
                    background: isProcessingPayment ? "#059669" : "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    cursor: isProcessingPayment ? "not-allowed" : "pointer",
                    opacity: isProcessingPayment ? 0.85 : 1,
                  }}
                  disabled={isProcessingPayment}
                  onClick={() => handlePayDemand(selectedPayment)}
                >
                  {isProcessingPayment ? "Connecting to Payment Gateway..." : `Pay ${selectedPayment.formattedAmt} & Settle Demand`}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
