import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '../services/apiClient';
import { useApiPayments } from "../hooks/useApiPayments";
import { printHtmlContent } from "../utils/exportHelpers";

export function isPaymentSettled(status) {
  if (!status) return false;
  const s = String(status).trim().toLowerCase();
  return (
    s === "paid" ||
    s === "success" ||
    s === "verified" ||
    s === "settled" ||
    s === "completed" ||
    s.includes("paid") ||
    s.includes("settled") ||
    s.includes("verified") ||
    s.includes("success")
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

export default function PaymentsPage({ userEmail, clientInfo }) {
  const [activeTab, setActiveTab] = useState("All Transactions");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [notice, setNotice] = useState(null);

  const { payments: apiPayments, refreshPayments } = useApiPayments();
  
  const payments = useMemo(() => {
    if (!userEmail) return apiPayments;
    const cleanUserEmail = userEmail.trim().toLowerCase();
    const clientComp = (clientInfo?.companyName || "").trim().toLowerCase();
    
    return apiPayments.filter((p) => {
      const pEmail = (p.clientEmail || p.email || "").trim().toLowerCase();
      const pComp = (p.clientCompany || p.clientName || p.company || "").trim().toLowerCase();
      if (cleanUserEmail && pEmail && pEmail === cleanUserEmail) return true;
      if (clientComp && pComp && (pComp.includes(clientComp) || clientComp.includes(pComp))) return true;
      return false;
    });
  }, [apiPayments, userEmail, clientInfo]);

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

  async function handlePayDemand(pay) {
    try {
      // 1. Update status to "Paid" in localStorage across all payment demand arrays
      const updatePaymentStatusLocal = (key) => {
        try {
          const saved = localStorage.getItem(key);
          if (!saved) return;
          const list = JSON.parse(saved);
          if (!Array.isArray(list)) return;
          const updated = list.map((p) => {
            if (String(p.id) === String(pay.id)) {
              return {
                ...p,
                status: "Paid",
                transactionRef: `TXN-AGNI-${Date.now().toString().slice(-6)}`,
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
      const cleanEmail = (pay.clientEmail || userEmail || "").toLowerCase().trim();
      if (cleanEmail) updatePaymentStatusLocal(`agni_payment_demands_${cleanEmail}`);

      // 2. Update client payment metrics in agni_sales_clients and agni_branch_clients
      const updateClientMetrics = (listKey) => {
        try {
          const saved = localStorage.getItem(listKey);
          if (!saved) return;
          const list = JSON.parse(saved);
          if (!Array.isArray(list)) return;
          const updated = list.map((c) => {
            const cEmail = (c.email || "").toLowerCase().trim();
            const cCompany = (c.company || c.name || "").toLowerCase().trim();
            const payComp = (pay.clientCompany || pay.clientName || "").toLowerCase().trim();
            const matchEmail = cleanEmail && cEmail && cEmail === cleanEmail;
            const matchComp = payComp && cCompany && (cCompany.includes(payComp) || payComp.includes(cCompany));
            if (matchEmail || matchComp) {
              const currentRec = parseFloat(String(c.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0;
              const currentPend = parseFloat(String(c.paymentPending || 0).replace(/[^0-9.]/g, "")) || 0;
              const amtPaid = Number(pay.amount || 0);
              const newRec = currentRec + amtPaid;
              const newPend = Math.max(0, currentPend - amtPaid);
              return {
                ...c,
                paymentReceived: String(newRec),
                paymentPending: String(newPend),
              };
            }
            return c;
          });
          localStorage.setItem(listKey, JSON.stringify(updated));
        } catch (e) {}
      };

      updateClientMetrics("agni_sales_clients");
      updateClientMetrics("agni_branch_clients");

      // 3. API sync if invoice is linked
      const invId = pay.relatedInvoiceId || pay.invoiceId || pay.relatedInvoice;
      if (invId && invId !== "dummy") {
        apiFetch(`/invoices/${invId}/payments`, {
          method: "POST",
          body: {
            amount: Number(pay.amount || 0),
            paymentMode: "ONLINE",
            remarks: "Client portal payment demand settlement",
          }
        }).catch((e) => console.warn("API payment error:", e));
      }

      window.dispatchEvent(new Event("agni_invoices_updated"));
      window.dispatchEvent(new Event("agni_payments_updated"));
      window.dispatchEvent(new Event("agni_clients_updated"));
      window.dispatchEvent(new Event("storage"));

      refreshPayments();
    } catch (e) {
      console.warn("Could not update payment status:", e);
    }

    setSelectedPayment(null);
    setNotice(`✓ Payment of ₹${Number(pay.amount || 0).toLocaleString("en-IN")} settled successfully! Payment receipt is now ready for download.`);
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
                  style={{ background: "#10b981" }}
                  onClick={() => handlePayDemand(selectedPayment)}
                >
                  Pay {selectedPayment.formattedAmt} & Settle Demand
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
