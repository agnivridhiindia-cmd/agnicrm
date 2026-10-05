import React from "react";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";
import { getCategoryBadgeStyle } from "./RequestTable";

const formatDate = (value) => value || "—";

export default function RequestDetailsModal({ request, onClose, onApprovePayment, onDeclinePayment }) {
  if (!request) return null;

  const badge = getCategoryBadgeStyle(request.category || request.requestType || request.schemeName);
  const isPaymentSettlement = request.requestType === "Payment Settlement" || request.category === "Payment Settlement" || !!request.paymentId;
  const isSchemeReq = !isPaymentSettlement && (request.requestType === "Eligible Scheme" || request.requestType === "More Services" || !!request.schemeName);
  const isDelete = request.requestType === "Delete Client" || request.category === "Manager Approval: Client Delete";

  const totalWithGst = Number(request.totalInvoice || request.totalPayment || request.pitchedAmount || request.price || request.amount || 0);
  const pitchedNum = Math.round(totalWithGst / 1.18);
  const gstNum = totalWithGst - pitchedNum;
  const paidNum = Number(request.paidAmount || request.paymentReceived || totalWithGst);
  const remainingNum = Math.max(0, totalWithGst - paidNum);

  return (
    <Modal
      title={`Request Audit Dossier — ${request.id}`}
      onClose={onClose}
      closeLabel="Close"
      className="sales-request-modal"
    >
      <div className="sales-request-dossier" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Header Summary Banner */}
        <div
          className="sales-request-audit-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            padding: 16,
            borderRadius: 14,
            background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.8) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          <div>
            <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, display: "block" }}>Client Entity</span>
            <strong style={{ fontSize: 15, color: "#f8fafc", marginTop: 2, display: "block" }}>{request.clientName || request.companyName}</strong>
            <span style={{ fontSize: 12, color: "#7dd3fc", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
              <Icon name="mail" size={13} />
              {request.clientEmail || request.email || "No email specified"}
            </span>
          </div>

          <div>
            <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, display: "block" }}>Category &amp; Type</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 12,
                fontSize: 11.5,
                fontWeight: 700,
                background: badge.bg,
                color: "#e0f2fe",
                border: `1px solid ${badge.border}`,
                marginTop: 4,
              }}
            >
              <Icon name={badge.icon} size={12} />
              {badge.label}
            </span>
          </div>

          <div>
            <span style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700, display: "block" }}>Decision Status</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 12px",
                borderRadius: 999,
                background: request.status.includes("Approved") ? "rgba(16, 185, 129, 0.16)" : request.status.includes("Pending") ? "rgba(245, 158, 11, 0.16)" : "rgba(239, 68, 68, 0.16)",
                color: request.status.includes("Approved") ? "#6ee7b7" : request.status.includes("Pending") ? "#fcd34d" : "#fca5a5",
                border: `1px solid ${request.status.includes("Approved") ? "rgba(16, 185, 129, 0.4)" : request.status.includes("Pending") ? "rgba(245, 158, 11, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
                fontWeight: 700,
                fontSize: 12,
                marginTop: 4,
              }}
            >
              {request.status}
            </span>
          </div>
        </div>

        {/* Hierarchy Approval Pipeline */}
        {request.approvalChain && request.approvalChain.length > 0 && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "#eef2ff",
              border: "1px dashed #a5b4fc",
            }}
          >
            <span style={{ fontSize: 11, color: "#4338ca", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
              Hierarchy Approval Pipeline
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap", fontSize: 12 }}>
              <span style={{ padding: "3px 8px", borderRadius: 6, background: "#e0e7ff", color: "#3730a3", fontWeight: 600 }}>
                1. Salesperson (Submitted)
              </span>
              <span style={{ color: "#64748b" }}>→</span>
              {request.approvalChain.map((role, idx) => {
                const isPassed = (request.currentChainIndex || 0) > idx || request.status === "Approved";
                const isCurrent = (request.currentChainIndex || 0) === idx && request.status !== "Approved";
                const roleLabel = role === "MANAGER" ? "Sales Manager" : role === "BRANCH_MANAGER" ? "Branch Manager" : "Owner";
                return (
                  <React.Fragment key={role}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: isPassed ? "#dcfce7" : isCurrent ? "#fef3c7" : "#f1f5f9",
                        color: isPassed ? "#166534" : isCurrent ? "#92400e" : "#475569",
                        fontWeight: 600,
                        border: isCurrent ? "1px solid #f59e0b" : "none",
                      }}
                    >
                      {idx + 2}. {roleLabel} {isPassed ? "✓" : isCurrent ? "(Reviewing)" : ""}
                    </span>
                    {idx < request.approvalChain.length - 1 && <span style={{ color: "#64748b" }}>→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Requested Service / Scheme Card (if applicable) */}
        {(request.schemeName || request.serviceName) && (
          <div style={{ padding: "14px 18px", borderRadius: 12, background: "rgba(147, 51, 234, 0.08)", border: "1.5px solid rgba(147, 51, 234, 0.35)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 11, color: "#6b21a8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.6, display: "block" }}>
                Enrolling Service / Scheme Name
              </span>
              <strong style={{ fontSize: 16, color: "#0f172a", fontWeight: 800, marginTop: 2, display: "block" }}>
                {request.schemeName || request.serviceName}
              </strong>
            </div>
            <span style={{ padding: "5px 12px", borderRadius: 8, background: "#7e22ce", color: "#ffffff", fontSize: 12, fontWeight: 700, boxShadow: "0 2px 6px rgba(126, 34, 206, 0.25)" }}>
              {request.category || request.requestType || "Service Request"}
            </span>
          </div>
        )}

        {/* Audit Meta Grid */}
        <div className="sales-request-meta-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
          <div style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f1f5f9" }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block" }}>Submitted On</span>
            <strong style={{ fontSize: 12.5, color: "#1e293b", marginTop: 3, display: "block" }}>{formatDate(request.submittedDate || request.createdAt)}</strong>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f1f5f9" }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block" }}>Actioned By</span>
            <strong style={{ fontSize: 12.5, color: "#0369a1", marginTop: 3, display: "block" }}>{request.actionedBy || request.managerName || "Sales Executive"}</strong>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f1f5f9" }}>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, display: "block" }}>Decision Timestamp</span>
            <strong style={{ fontSize: 12.5, color: "#047857", marginTop: 3, display: "block" }}>{formatDate(request.decisionDate || request.actionedAt || request.createdAt)}</strong>
          </div>
        </div>

        {/* Department Specialist Assignment (if applicable) */}
        {request.targetDepartment && (
          <div style={{ padding: "14px 16px", borderRadius: 12, background: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", color: "#0369a1", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
              🏛️ Department Specialist Assignment
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ fontSize: 14, color: "#0f172a", display: "block" }}>{request.assignedStaffName || "Department Specialist"}</strong>
                <span style={{ fontSize: 12, color: "#475569" }}>{request.assignedStaffRole || `${request.targetDepartment} Lead`} ({request.assignedStaffEmail || `${request.targetDepartment.toLowerCase()}@agni.com`})</span>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: 12, background: "#e0f2fe", color: "#0369a1", fontSize: 12, fontWeight: 700, border: "1px solid #7dd3fc" }}>
                {request.targetDepartment} Department
              </span>
            </div>
          </div>
        )}

        {/* Commercials & Financial Breakdown (for Schemes/Services/Payment Settlement) */}
        {(isSchemeReq || isPaymentSettlement) && (totalWithGst > 0 || request.amount > 0) && (
          <div style={{ padding: "16px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", color: "#15803d", letterSpacing: 0.5, display: "block", marginBottom: 10 }}>
              💰 {isPaymentSettlement ? "Payment Settlement Record" : "Commercial & Payment Audit Record"}
            </span>
            <div className="sales-request-financial-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 10 }}>
              <div style={{ background: "#ffffff", padding: "10px", borderRadius: 8, border: "1px solid #dcfce7" }}>
                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>
                  {isPaymentSettlement ? "Settlement Amount" : "Requested Payment Amount"}
                </span>
                <strong style={{ fontSize: 14, color: "#15803d" }}>₹{(request.amount || totalWithGst).toLocaleString("en-IN")}</strong>
              </div>
              <div style={{ background: "#ffffff", padding: "10px", borderRadius: 8, border: "1px solid #dcfce7" }}>
                <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>
                  {isPaymentSettlement ? "Payment Mode" : "Quota Base Contribution (Amt / 1.18)"}
                </span>
                <strong style={{ fontSize: 14, color: "#0369a1" }}>
                  {isPaymentSettlement ? (request.paymentMode || "Online Gateway") : `₹${pitchedNum.toLocaleString("en-IN")}`}
                </strong>
              </div>
            </div>
            {request.transactionRef && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#dcfce7", padding: "10px 14px", borderRadius: 8, marginBottom: !isPaymentSettlement ? 8 : 0 }}>
                <span style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>Transaction Reference</span>
                <strong style={{ fontSize: 13, color: "#15803d", fontFamily: "monospace" }}>{request.transactionRef}</strong>
              </div>
            )}
            {!isPaymentSettlement && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#dcfce7", padding: "10px 14px", borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: "#334155", fontWeight: 600 }}>Amount Paid by Client</span>
                <strong style={{ fontSize: 14, color: "#15803d" }}>₹{paidNum.toLocaleString("en-IN")}</strong>
              </div>
            )}
          </div>
        )}

        {/* Manager Remarks / Approval Notes Audit Trail */}
        {(request.managerRemarks || request.assignmentNotes || request.reason) && (
          <div style={{ padding: "14px 16px", borderRadius: 12, border: "1px solid #ddd6fe", background: "#f5f3ff" }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6d28d9", display: "block", marginBottom: 6 }}>
              📝 Approval Notes &amp; Decision Remarks
            </span>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#334155" }}>
              {request.managerRemarks || request.assignmentNotes || request.reason}
            </p>
          </div>
        )}

        {/* Requested Mod Diffs (For Client Edit) */}
        {!isDelete && request.requestedChanges && request.requestedChanges.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "#6d28d9" }}>
              Requested Modifications ({request.requestedChanges.length})
            </span>
            <div style={{ display: "grid", gap: 10 }}>
              {request.requestedChanges.map((change) => (
                <div
                  key={change.field}
                  style={{
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    padding: "12px 14px",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#38bdf8" }}>
                    {change.field}
                  </div>
                  <div className="sales-request-change-grid" style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 10, alignItems: "center" }}>
                    <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.3)" }}>
                      <span style={{ fontSize: 10.5, color: "#f43f5e", fontWeight: 700, display: "block" }}>Original</span>
                      <strong style={{ fontSize: 12.5, color: "#334155" }}>{change.oldValue || "—"}</strong>
                    </div>
                    <span style={{ color: "#38bdf8", fontWeight: 800, fontSize: 14 }}>→</span>
                    <div style={{ padding: "8px 10px", borderRadius: 6, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                      <span style={{ fontSize: 10.5, color: "#15803d", fontWeight: 700, display: "block" }}>Requested</span>
                      <strong style={{ fontSize: 12.5, color: "#15803d" }}>{change.newValue || "—"}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
          {isPaymentSettlement && request.status === "Pending" && onApprovePayment && (
            <>
              <button
                type="button"
                className="sales-add-btn"
                style={{ background: "#10b981", borderColor: "#10b981", padding: "8px 18px", fontSize: 13 }}
                onClick={() => {
                  onApprovePayment(request);
                  onClose();
                }}
              >
                <span>✓ Approve Settlement</span>
              </button>
              {onDeclinePayment && (
                <button
                  type="button"
                  className="sales-btn-secondary"
                  style={{ color: "#ef4444", borderColor: "rgba(239, 68, 68, 0.4)", padding: "8px 16px", fontSize: 13 }}
                  onClick={() => {
                    onDeclinePayment(request);
                    onClose();
                  }}
                >
                  <span>✕ Deny</span>
                </button>
              )}
            </>
          )}
          <button type="button" className="sales-btn-secondary" onClick={onClose} style={{ padding: "8px 22px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            Close Audit Dossier
          </button>
        </div>
      </div>
    </Modal>
  );
}
