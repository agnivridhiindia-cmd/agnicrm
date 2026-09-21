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

export default function ApproveSchemeModal({ request, onClose, onSubmit }) {
  const [pitchedAmount, setPitchedAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("Online");
  const [amountRequired, setAmountRequired] = useState("");

  const isLoanScheme = isLoanOrGrantScheme(request);

  const basePitched = Number(pitchedAmount) || 0;
  const isOnline = paymentMode === "Online";
  const gstAmount = isOnline ? Math.round(basePitched * 0.18) : 0;
  const totalPayment = isOnline ? basePitched + gstAmount : basePitched;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pitchedAmount) return;
    if (isLoanScheme && !amountRequired) return;

    onSubmit({
      pitchedAmount: basePitched,
      paymentMode,
      gstAmount,
      totalPayment,
      amountRequired: isLoanScheme ? Number(amountRequired) : 0
    });
  };

  return (
    <Modal title={`Approve ${isLoanScheme ? "Scheme Enrollment" : "Service Request"}`} onClose={onClose}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
          Please provide the commercials for the {isLoanScheme ? "scheme enrollment" : "service request"} requested by <strong>{request?.clientName}</strong> for <strong>{request?.schemeName}</strong>.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Pitched Commercial Amount (₹)</label>
          <input
            type="number"
            value={pitchedAmount}
            onChange={(e) => setPitchedAmount(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#fff",
              fontSize: 14
            }}
            placeholder="e.g. 10000"
            required
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Payment Mode</label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#fff",
              fontSize: 14
            }}
          >
            <option value="Online" style={{ background: "#0f172a" }}>Online (18% GST Applicable)</option>
            <option value="Offline" style={{ background: "#0f172a" }}>Offline (No GST)</option>
          </select>
        </div>

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
            alignItems: "center"
          }}>
            <span>Base: ₹{basePitched.toLocaleString("en-IN")} {isOnline ? `+ GST (18%): ₹${gstAmount.toLocaleString("en-IN")}` : "(No GST)"}</span>
            <strong>Total Payable: ₹{totalPayment.toLocaleString("en-IN")}</strong>
          </div>
        )}

        {isLoanScheme && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Required Amount for Loan (Funding Requirement)</label>
            <input
              type="number"
              value={amountRequired}
              onChange={(e) => setAmountRequired(e.target.value)}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#fff",
                fontSize: 14
              }}
              placeholder="e.g. 2500000"
              required
            />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              color: "#e2e8f0",
              cursor: "pointer",
              fontWeight: 600
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#10b981",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
            }}
          >
            Approve & Assign ✓
          </button>
        </div>
      </form>
    </Modal>
  );
}
