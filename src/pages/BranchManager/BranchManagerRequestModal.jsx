import React, { useState } from "react";
import Modal from "../../components/Modal";
import Icon from "../../components/Icon";

export default function BranchManagerRequestModal({
  request,
  onClose,
  onApprove,
  onReject,
  isManagerRequest = false,
}) {
  const [remarks, setRemarks] = useState("");

  if (!request) return null;

  const isPending = request.status === "Pending";
  const canDecide = isManagerRequest && isPending;

  const statusColor =
    request.status === "Approved"
      ? "#10b981"
      : request.status === "Rejected"
      ? "#f43f5e"
      : "#f59e0b";

  return (
    <Modal title={`Request Details — ${request.id}`} onClose={onClose} closeLabel="Close">
      <div className="bm-modal-wrapper">
        {/* Top Summary Banner */}
        <div className="bm-inspect-head">
          <div>
            <span className="bm-req-subtext" style={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
              {isManagerRequest ? "Submitted By Manager" : "Target Employee / Entity"}
            </span>
            <strong className="bm-modal-type-title" style={{ marginTop: 2 }}>
              {isManagerRequest ? request.requesterName : request.targetName}
            </strong>
            <small className="bm-req-subtext">
              {isManagerRequest ? `${request.requesterRole} (${request.requesterBranch || "South"} Branch)` : `${request.targetRole || request.department} (${request.targetBranch || "East"} Branch)`}
            </small>
          </div>

          <div>
            <span className="bm-req-subtext" style={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
              Request Type
            </span>
            <strong className="bm-req-meta-tag bm-req-meta-purple" style={{ marginTop: 2, display: "block" }}>
              {request.requestType}
            </strong>
            <small className="bm-req-subtext">
              {request.department ? `Department: ${request.department}` : `Target: ${request.targetName}`}
            </small>
          </div>

          <div>
            <span className="bm-req-subtext" style={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 700 }}>
              Governance Status
            </span>
            <div style={{ marginTop: 4 }}>
              <span
                className="bm-req-status-badge"
                style={{
                  background: `${statusColor}22`,
                  color: statusColor,
                }}
              >
                ● {request.status} {request.recipient === "Owner" ? "(Owner Review)" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Hierarchy Approval Pipeline */}
        {request.approvalChain && request.approvalChain.length > 0 && (
          <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(99, 102, 241, 0.08)", border: "1px dashed rgba(99, 102, 241, 0.4)", margin: "12px 0" }}>
            <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
              Hierarchy Approval Pipeline
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap", fontSize: 12 }}>
              <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", fontWeight: 600 }}>
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
                        background: isPassed ? "rgba(16, 185, 129, 0.16)" : isCurrent ? "rgba(245, 158, 11, 0.2)" : "rgba(148, 163, 184, 0.1)",
                        color: isPassed ? "#10b981" : isCurrent ? "#f59e0b" : "#94a3b8",
                        fontWeight: 600,
                        border: isCurrent ? "1px solid #f59e0b" : "none",
                      }}
                    >
                      {idx + 2}. {roleLabel} {isPassed ? "✓" : isCurrent ? "(Your Turn)" : ""}
                    </span>
                    {idx < request.approvalChain.length - 1 && <span style={{ color: "#64748b" }}>→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* 3-Column Metrics */}
        <div className="bm-inspect-meta-grid">
          <div className="bm-inspect-meta-cell">
            <span className="bm-req-subtext" style={{ fontWeight: 600 }}>Creation Date</span>
            <strong style={{ fontSize: 13.5, marginTop: 3, display: "block" }}>{request.createdAt}</strong>
          </div>
          <div className="bm-inspect-meta-cell">
            <span className="bm-req-subtext" style={{ fontWeight: 600 }}>Priority Level</span>
            <strong style={{ fontSize: 13.5, marginTop: 3, display: "block", color: request.priority === "High" || request.priority === "Urgent" ? "#f43f5e" : "inherit" }}>
              {request.priority || "Normal"}
            </strong>
          </div>
          <div className="bm-inspect-meta-cell">
            <span className="bm-req-subtext" style={{ fontWeight: 600 }}>Recipient Authority</span>
            <strong className="bm-req-meta-tag bm-req-meta-purple" style={{ marginTop: 3, display: "block" }}>
              {request.recipient || (isManagerRequest ? "Branch Manager" : "Owner")}
            </strong>
          </div>
        </div>

        {/* Reason / Statement */}
        <div className="bm-inspect-reason-box">
          <span className="bm-req-meta-tag bm-req-meta-purple" style={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 4 }}>
            Statement &amp; Justification
          </span>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5 }}>
            {request.reason}
          </p>
        </div>

        {/* Transfer Destination if Transfer request */}
        {request.destinationBranch && (
          <div className="bm-modal-transfer-card">
            <span className="bm-req-meta-tag" style={{ color: "#9a74e9", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 3 }}>
              Transfer Destination &amp; Receiving Lead
            </span>
            <strong style={{ fontSize: 14 }}>
              {request.destinationBranch} Branch {request.receivingManager ? `• Assigned Lead: ${request.receivingManager}` : ""}
            </strong>
          </div>
        )}

        {/* Requested Changes Table / Diff */}
        {request.requestedChanges && request.requestedChanges.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span className="bm-req-meta-tag bm-req-meta-purple" style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              Requested Change Differential ({request.requestedChanges.length})
            </span>
            <div style={{ border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: 12, overflow: "hidden" }}>
              <table className="bm-inspect-diff-table">
                <thead>
                  <tr style={{ background: "rgba(140, 95, 248, 0.08)" }}>
                    <th className="bm-inspect-diff-th">Field</th>
                    <th className="bm-inspect-diff-th">Current Value</th>
                    <th className="bm-inspect-diff-th">Proposed Value</th>
                  </tr>
                </thead>
                <tbody>
                  {request.requestedChanges.map((change, index) => (
                    <tr key={index}>
                      <td className="bm-inspect-diff-td" style={{ fontWeight: 700 }}>{change.field}</td>
                      <td className="bm-inspect-diff-td bm-inspect-old-val" style={{ textDecoration: "line-through" }}>{change.oldValue || "—"}</td>
                      <td className="bm-inspect-diff-td bm-inspect-new-val">{change.newValue || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Existing Decision Remarks or Owner Remarks */}
        {(request.decisionRemarks || request.ownerRemarks) && (
          <div className="bm-modal-transfer-card" style={{ borderColor: "rgba(16, 185, 129, 0.2)", background: "rgba(16, 185, 129, 0.05)" }}>
            <span className="bm-req-meta-tag" style={{ color: "#10b981", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 3 }}>
              {request.ownerRemarks ? "Owner Governance Remarks" : "Branch Decision Remarks"}
            </span>
            <p style={{ margin: 0, fontSize: 13 }}>{request.ownerRemarks || request.decisionRemarks}</p>
            {request.decisionDate && (
              <small className="bm-req-subtext" style={{ fontSize: 11, marginTop: 4 }}>
                Decided on: {request.decisionDate}
              </small>
            )}
          </div>
        )}

        {/* Decision Actions for Pending Manager Requests */}
        {canDecide && (
          <div className="bm-inspect-decision-form">
            <label className="field-label">
              <span>Decision Remarks / Feedback (optional)</span>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add approval notes or justification for rejection..."
                className="sales-textarea"
              />
            </label>

            <div className="bm-modal-footer">
              <button
                type="button"
                className="sales-btn-secondary bm-req-btn-reject"
                onClick={() => {
                  onReject(request.id, remarks);
                  onClose();
                }}
              >
                ✕ Reject Request
              </button>
              <button
                type="button"
                className="manager-btn-primary"
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                onClick={() => {
                  onApprove(request.id, remarks);
                  onClose();
                }}
              >
                <Icon name="checkCircle" size={15} />
                <span>
                  {request.approvalChain && request.approvalChain.includes("OWNER")
                    ? "Approve & Forward to Owner"
                    : "Authorize & Approve Request"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Default Close button if not deciding */}
        {!canDecide && (
          <div className="bm-modal-footer">
            <button className="manager-btn-primary bm-modal-submit-btn" type="button" onClick={onClose}>
              <span>Close</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
