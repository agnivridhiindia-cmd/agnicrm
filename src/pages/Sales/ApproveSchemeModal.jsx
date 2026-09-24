import React, { useState } from "react";
import Modal from "../../components/Modal";

export function isLoanOrGrantScheme(request) {
  if (!request) return false;
  const name = String(request.schemeName || request.name || "").toLowerCase();
  const tag = String(request.tag || "").toLowerCase();
  const category = String(request.category || "").toLowerCase();

  // Explicit non-loan service indicators (Certificates, IT, Marketing, Licences)
  if (
    tag.includes("certificate") ||
    tag.includes("cert") ||
    tag.includes("token") ||
    tag.includes("audit") ||
    tag.includes("tax") ||
    tag.includes("it") ||
    tag.includes("marketing") ||
    tag.includes("service") ||
    category.includes("certification") ||
    category.includes("it") ||
    category.includes("marketing")
  ) {
    return false;
  }

  // Common Certificate / IT / Marketing service names
  const nonLoanKeywords = [
    "dsc", "digital signature", "iso", "gst", "registration", "itr", "trademark",
    "darpan", "12a", "80g", "csr-1", "gem", "llp", "opc", "private limited",
    "section 8", "licensing", "website", "crm", "cybersecurity", "campaign"
  ];
  if (nonLoanKeywords.some((kw) => name.includes(kw))) {
    return false;
  }

  return true;
}

const INR = (val) =>
  `₹${Number(val || 0).toLocaleString("en-IN")}`;

export default function ApproveSchemeModal({ request, onClose, onSubmit }) {
  const [pitchedAmount, setPitchedAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Online");
  const [amountReceived, setAmountReceived] = useState("");
  const [amountRequired, setAmountRequired] = useState("");

  const isLoanScheme = isLoanOrGrantScheme(request);

  // --- Revenue formula: same as revenueCalculator.js ---
  const basePitched   = Number(pitchedAmount) || 0;
  const isOnline      = paymentMode === "Online";
  const gstAmount     = isOnline ? Math.round(basePitched * 0.18) : 0;
  const totalPayable  = isOnline ? basePitched + gstAmount : basePitched;

  // Amount Received & Pending
  const received      = Math.max(0, Number(amountReceived) || 0);
  const pending       = Math.max(0, totalPayable - received);

  // Net Revenue (strips GST from gross received — matches revenueCalculator formula)
  const netRevenue    = received > 0 ? Math.round(received / 1.18) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pitchedAmount) return;
    if (isLoanScheme && !amountRequired) return;

    onSubmit({
      pitchedAmount: basePitched,
      paymentMode,
      gstAmount,
      totalPayment: totalPayable,
      paymentReceived: received,
      paymentPending: pending,
      netRevenue,
      amountRequired: isLoanScheme ? Number(amountRequired) : 0,
    });
  };

  // ─── Shared input style ─────────────────────────────────────────────────────
  const inputStyle = {
    padding: "10px 14px",
    borderRadius: 8,
    background: "rgba(15, 23, 42, 0.6)",
    border: "1px solid rgba(255, 255, 255, 0.15)",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const labelStyle = { fontSize: 13, fontWeight: 600, color: "#e2e8f0" };

  return (
    <Modal title={`Approve ${isLoanScheme ? "Scheme Enrollment" : "Service Request"}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
          Please provide the commercials for the {isLoanScheme ? "scheme enrollment" : "service request"} requested
          by <strong>{request?.clientName}</strong> for <strong>{request?.schemeName}</strong>.
        </p>

        {/* ── Pitched Commercial Amount ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelStyle}>Pitched Commercial Amount (₹)</label>
          <input
            type="number"
            value={pitchedAmount}
            onChange={(e) => setPitchedAmount(e.target.value)}
            style={inputStyle}
            placeholder="e.g. 10000"
            min="0"
            required
          />
        </div>

        {/* ── Payment Mode ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelStyle}>Payment Mode</label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="Online"  style={{ background: "#0f172a" }}>Online (18% GST Applicable)</option>
            <option value="Offline" style={{ background: "#0f172a" }}>Offline (No GST)</option>
          </select>
        </div>

        {/* ── GST Breakdown Banner ── */}
        {basePitched > 0 && (
          <div style={{
            padding: "10px 14px",
            borderRadius: 8,
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#a7f3d0",
            fontSize: 13,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span>
              Base: {INR(basePitched)}{isOnline ? ` + GST (18%): ${INR(gstAmount)}` : " (No GST)"}
            </span>
            <strong>Total Payable: {INR(totalPayable)}</strong>
          </div>
        )}

        {/* ── Amount Received ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={labelStyle}>Amount Received (₹)</label>
          <input
            type="number"
            value={amountReceived}
            onChange={(e) => setAmountReceived(e.target.value)}
            style={{
              ...inputStyle,
              border: received > totalPayable && totalPayable > 0
                ? "1px solid rgba(239,68,68,0.6)"
                : "1px solid rgba(255,255,255,0.15)",
            }}
            placeholder="Enter amount collected so far"
            min="0"
          />
          {received > totalPayable && totalPayable > 0 && (
            <span style={{ fontSize: 12, color: "#f87171" }}>
              ⚠ Amount received exceeds total payable
            </span>
          )}
        </div>

        {/* ── Pending / Net Revenue Summary ── */}
        {basePitched > 0 && (
          <div style={{
            borderRadius: 10,
            border: "1px solid rgba(99,102,241,0.3)",
            background: "rgba(99,102,241,0.07)",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              padding: "8px 14px",
              background: "rgba(99,102,241,0.15)",
              borderBottom: "1px solid rgba(99,102,241,0.2)",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#a5b4fc",
              textTransform: "uppercase",
            }}>
              Payment Summary
            </div>

            {/* Rows */}
            {[
              {
                label: "Total Payable",
                value: INR(totalPayable),
                color: "#e2e8f0",
                bold: false,
              },
              {
                label: "Amount Received",
                value: INR(received),
                color: received >= totalPayable && totalPayable > 0 ? "#34d399" : "#fbbf24",
                bold: false,
              },
              {
                label: "Amount Pending",
                value: INR(pending),
                color: pending === 0 ? "#34d399" : "#f87171",
                bold: true,
              },
              ...(received > 0 ? [{
                label: "Net Revenue (ex-GST)",
                value: INR(netRevenue),
                color: "#818cf8",
                bold: false,
                hint: "= Received ÷ 1.18",
              }] : []),
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "9px 14px",
                borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>
                  {row.label}
                  {row.hint && (
                    <span style={{ marginLeft: 6, fontSize: 11, color: "#6366f1", opacity: 0.8 }}>
                      {row.hint}
                    </span>
                  )}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: row.bold ? 700 : 600,
                  color: row.color,
                }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── Funding Requirement (Loan schemes only) ── */}
        {isLoanScheme && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={labelStyle}>Required Amount for Loan (Funding Requirement)</label>
            <input
              type="number"
              value={amountRequired}
              onChange={(e) => setAmountRequired(e.target.value)}
              style={inputStyle}
              placeholder="e.g. 2500000"
              min="0"
              required
            />
          </div>
        )}

        {/* ── Actions ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "#e2e8f0",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              background: "#10b981",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
            }}
          >
            Approve &amp; Assign ✓
          </button>
        </div>
      </form>
    </Modal>
  );
}
