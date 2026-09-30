import React, { useState } from "react";
import Icon from "../../../components/Icon";
import {
  agreementService,
  agreementStatusBadgeColors,
  AGREEMENT_STATUSES,
  TEMPLATE_TYPES,
  TEMPLATE_NAMES,
  normalizeAgreementData,
} from "../../../services/agreementService";
import {
  getAgreementDynamicFields,
  downloadDocxFile,
  downloadPdfFile,
  generateAgreementDocumentHtml,
} from "../docxService";
import { getCanonicalSchemeName } from "../../../utils/schemeTracker";
import "../../Admin/AdminDashboard.css";

export default function AgreementDocumentViewer({
  agreement,
  onClose,
  onSendAgreement,
  isHistoryView = false,
  showToast,
}) {
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [sending, setSending] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  if (!agreement) return null;

  const agr = normalizeAgreementData(agreement);
  const fields = getAgreementDynamicFields(agr);
  const isPrivate = fields.isPrivate;
  const isSent = agr.agreement?.status === AGREEMENT_STATUSES.SENT;
  const statusStyle =
    agreementStatusBadgeColors[agr.agreement?.status] || agreementStatusBadgeColors.Ready;
  const templateTitle =
    agr.agreement?.templateName ||
    (isPrivate ? TEMPLATE_NAMES.PRIVATE_FUNDING : TEMPLATE_NAMES.SCHEME);

  const handleDownloadDocx = async () => {
    setDownloadingDocx(true);
    setFeedbackMsg(null);
    try {
      downloadDocxFile(agr);
      if (showToast) {
        showToast(`✓ Downloaded ${templateTitle} (.docx) for ${fields.company}`);
      }
    } catch (err) {
      console.error("Error downloading DOCX:", err);
      setFeedbackMsg({ type: "error", text: "Failed to download DOCX document." });
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    setFeedbackMsg(null);
    try {
      const result = downloadPdfFile(agr, `${fields.company} Agreement.pdf`);
      if (result && result.success) {
        if (showToast) {
          showToast(`✓ Opened PDF document for ${fields.company}`);
        }
      }
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setFeedbackMsg({ type: "error", text: "Failed to download PDF document." });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    downloadPdfFile(agr, `${fields.company} Agreement.pdf`);
  };

  const handleSend = async () => {
    if (isSent) return;
    setSending(true);
    setFeedbackMsg(null);
    try {
      if (onSendAgreement) {
        await onSendAgreement(agr);
      } else {
        await agreementService.sendAgreement(agr.id, agr.client?.email);
      }
      if (showToast) {
        showToast(`✓ Agreement ${agr.id} dispatched to ${agr.client?.email || "client"}`);
      }
      onClose();
    } catch (err) {
      console.error("Error sending agreement:", err);
      setFeedbackMsg({ type: "error", text: `Failed to send agreement: ${err.message}` });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.78)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px 16px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="admin-panel-card hide-scrollbar"
        style={{
          width: "100%",
          maxWidth: 820,
          maxHeight: "92vh",
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: 0,
          borderRadius: 22,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45), 0 0 32px rgba(78, 124, 255, 0.15)",
          border: "1px solid rgba(154, 116, 233, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: "22px 26px 18px",
            borderBottom: "1px solid rgba(154, 116, 233, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span
                className="admin-badge"
                style={{
                  background: isPrivate
                    ? "linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
                    : "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                  color: "#ffffff",
                  fontSize: 11,
                  padding: "3px 10px",
                }}
              >
                {isPrivate ? "PRIVATE FUNDING CONTRACT" : "SCHEME AGREEMENT"}
              </span>
              <span
                className="admin-badge"
                style={{
                  background: "rgba(78, 124, 255, 0.12)",
                  color: "#4e7cff",
                  fontWeight: 750,
                  fontSize: 11,
                }}
              >
                ID: {agr.id}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.border}`,
                  fontSize: 11,
                  fontWeight: 750,
                }}
              >
                <span style={{ fontSize: 8 }}>●</span>
                <span>{agr.agreement?.status}</span>
              </span>
            </div>
            <h3 style={{ margin: "2px 0 4px", fontSize: 20, fontWeight: 800, color: "inherit", letterSpacing: -0.3 }}>
              {agr.client?.companyName || agr.client?.clientName}
            </h3>
            <p className="admin-desc" style={{ fontSize: 13 }}>
              Contact: <strong>{agr.client?.clientName}</strong> • Created: {agr.createdAt}
              {agr.sentAt && (
                <span style={{ marginLeft: 10, color: "#10b981", fontWeight: 700 }}>
                  • Dispatched: {agr.sentAt} ({agr.sentTo})
                </span>
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(241, 245, 249, 0.6)",
              border: "1px solid rgba(154, 116, 233, 0.15)",
              borderRadius: "50%",
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "#64748b",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(241, 245, 249, 0.6)";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "22px 26px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Feedback Alert if applicable */}
          {feedbackMsg && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: feedbackMsg.type === "error" ? "rgba(239, 68, 68, 0.12)" : "rgba(59, 130, 246, 0.12)",
                color: feedbackMsg.type === "error" ? "#ef4444" : "#3b82f6",
                border: `1px solid ${feedbackMsg.type === "error" ? "rgba(239, 68, 68, 0.3)" : "rgba(59, 130, 246, 0.3)"}`,
              }}
            >
              <span>{feedbackMsg.text}</span>
              <button
                type="button"
                onClick={() => setFeedbackMsg(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ── 1. Commercial Summary Strip ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#6366f1" }}>Pitched Commercial</span>
              <strong style={{ display: "block", fontSize: 14, color: "#6366f1" }}>
                {typeof agr.agreement?.pricing?.pitched === "number"
                  ? `₹${agr.agreement.pricing.pitched.toLocaleString("en-IN")}`
                  : agr.agreement?.pricing?.pitched || "—"}
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>Total Agreement Fee</small>
            </div>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#10b981" }}>Token Received</span>
              <strong style={{ display: "block", fontSize: 14, color: "#10b981" }}>
                {typeof agr.agreement?.pricing?.received === "number"
                  ? `₹${agr.agreement.pricing.received.toLocaleString("en-IN")}`
                  : agr.agreement?.pricing?.received || "—"}
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>Upfront Paid</small>
            </div>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#f59e0b" }}>Balance Pending</span>
              <strong style={{ display: "block", fontSize: 14, color: "#f59e0b" }}>
                {typeof agr.agreement?.pricing?.left === "number"
                  ? `₹${agr.agreement.pricing.left.toLocaleString("en-IN")}`
                  : agr.agreement?.pricing?.left || "—"}
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>Payable on Milestone</small>
            </div>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#ec4899" }}>Success Fee</span>
              <strong style={{ display: "block", fontSize: 14, color: "#ec4899" }}>
                {typeof agr.agreement?.pricing?.successRate === "number"
                  ? `${agr.agreement.pricing.successRate}%`
                  : agr.agreement?.pricing?.successRate || "5%"}
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>On Disbursement</small>
            </div>
          </div>

          {/* ── 2. Official Simulated Legal Paper Presentation ── */}
          <div
            className="admin-subcard"
            style={{
              padding: 0,
              overflow: "hidden",
              border: "1px solid rgba(154, 116, 233, 0.2)",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid rgba(154, 116, 233, 0.15)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
                background: "rgba(154, 116, 233, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>📄</span>
                <strong style={{ fontSize: 13 }}>Official Legal Contract Document Preview</strong>
              </div>
              <span style={{ fontSize: 11.5, color: "#64748b" }}>
                Template: <code>{isPrivate ? "private_funding_template.docx" : "common_scheme_agreement.docx"}</code>
              </span>
            </div>

            {/* Document Paper Container rendering exact multi-page agreement matching user template */}
            <div style={{ padding: 0, background: "#f8fafc", minHeight: 600 }}>
              <iframe
                title="Agreement Preview"
                srcDoc={generateAgreementDocumentHtml(agr)}
                style={{
                  width: "100%",
                  height: "650px",
                  border: "none",
                  display: "block",
                  background: "#e2e8f0",
                }}
              />
            </div>
          </div>

          {/* ── 3. Bottom Action Toolbar ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              paddingTop: 12,
              borderTop: "1px solid rgba(154, 116, 233, 0.15)",
            }}
          >
            {/* Export Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10b981",
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  fontWeight: 700,
                }}
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                title="Generate & Download official PDF document"
              >
                <Icon name="document" size={15} />
                <span>{downloadingPdf ? "Generating PDF..." : "Download PDF"}</span>
              </button>

              <button
                type="button"
                className="admin-btn-secondary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={handlePrint}
                title="Print agreement details"
              >
                <span>🖨️ Print</span>
              </button>
            </div>

            {/* Send / Close Actions */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button type="button" className="admin-btn-secondary" onClick={onClose} style={{ padding: "10px 20px" }}>
                Close
              </button>

              {!isHistoryView && !isSent && (
                <button
                  type="button"
                  className="admin-btn-primary"
                  style={{
                    padding: "10px 24px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  }}
                  onClick={handleSend}
                  disabled={sending}
                  title={`Send agreement to ${agr.client?.email || "client"}`}
                >
                  <Icon name="mail" size={15} />
                  <span>{sending ? "Dispatching..." : "Send to Client Email"}</span>
                </button>
              )}

              {isSent && (
                <span
                  className="admin-badge"
                  style={{
                    fontSize: 12,
                    padding: "8px 14px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    fontWeight: 800,
                  }}
                >
                  ✓ Dispatched to Client
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
