import React, { useState } from "react";
import SimpleModal from "../../components/SimpleModal";

export default function OwnerRequestDecisionModal({
  selectedRequest,
  onClose,
  onApprove,
  onReject,
}) {
  const [remarksInput, setRemarksInput] = useState("");

  if (!selectedRequest) return null;

  const statusClass = (selectedRequest.status || "pending").toLowerCase();
  const isDeletion = selectedRequest.requestType?.toLowerCase().includes("delete");
  const isTransfer = selectedRequest.requestType?.toLowerCase().includes("transfer");

  return (
    <SimpleModal onClose={onClose}>
      <div className="owner-modal-profile">
        <div className="owner-modal-avatar">REQ</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <span className="owner-rep-pill" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                {selectedRequest.id}
              </span>
              <h2 className="owner-header-title" style={{ marginTop: 4 }}>{selectedRequest.clientName}</h2>
            </div>
            <span className={`owner-status-pill ${statusClass}`}>
              ● {selectedRequest.status}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
        {/* Hierarchy Approval Pipeline */}
        {selectedRequest.approvalChain && selectedRequest.approvalChain.length > 0 && (
          <div
            className="owner-modal-card"
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(99, 102, 241, 0.08)",
              border: "1px dashed rgba(99, 102, 241, 0.4)",
            }}
          >
            <span className="owner-modal-card-label" style={{ color: "#818cf8", fontWeight: 700 }}>
              Hierarchy Approval Pipeline (Final Authorization Authority)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap", fontSize: 12 }}>
              <span style={{ padding: "3px 8px", borderRadius: 6, background: "rgba(99, 102, 241, 0.2)", color: "#a5b4fc", fontWeight: 600 }}>
                1. Initiator (Submitted)
              </span>
              <span style={{ color: "#64748b" }}>→</span>
              {selectedRequest.approvalChain.map((role, idx) => {
                const isPassed = (selectedRequest.currentChainIndex || 0) > idx || selectedRequest.status === "Approved";
                const isCurrent = (selectedRequest.currentChainIndex || 0) === idx && selectedRequest.status !== "Approved";
                const roleLabel = role === "MANAGER" ? "Sales Manager" : role === "BRANCH_MANAGER" ? "Branch Manager" : "Owner (Final)";
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
                      {idx + 2}. {roleLabel} {isPassed ? "✓" : isCurrent ? "(Reviewing)" : ""}
                    </span>
                    {idx < selectedRequest.approvalChain.length - 1 && <span style={{ color: "#64748b" }}>→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Meta info grid */}
        <div className="owner-modal-info-grid">
          <div className="owner-modal-card">
            <span className="owner-modal-card-label">Assigned Branch Manager</span>
            <span className="owner-modal-card-val">{selectedRequest.managerName}</span>
          </div>
          <div className="owner-modal-card">
            <span className="owner-modal-card-label">Request Type</span>
            <span className="owner-modal-card-val" style={{ color: "#6366f1" }}>{selectedRequest.requestType}</span>
          </div>
          <div className="owner-modal-card">
            <span className="owner-modal-card-label">Request Date</span>
            <span className="owner-modal-card-val">{selectedRequest.createdAt}</span>
          </div>
        </div>

        {/* Reason box */}
        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Reason for Request</span>
          <span className="owner-modal-card-val" style={{ fontWeight: 500, lineHeight: 1.5, marginTop: 4 }}>
            {selectedRequest.reason}
          </span>
        </div>

        {/* Diff Visualization for Edit Client */}
        {selectedRequest.requestType === "Edit Client" && selectedRequest.requestedChanges && selectedRequest.requestedChanges.length > 0 && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Requested Field Changes:</div>
            {selectedRequest.requestedChanges.map((change) => (
              <div key={change.field} className="owner-modal-card" style={{ padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#6366f1", marginBottom: 8, textTransform: "uppercase" }}>
                  {change.field}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
                  <div style={{ background: "rgba(244, 63, 94, 0.1)", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(244, 63, 94, 0.2)" }}>
                    <div style={{ color: "#f43f5e", fontSize: 11, fontWeight: 700 }}>Old Value</div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2 }}>{change.oldValue || "-"}</div>
                  </div>
                  <div style={{ color: "#6366f1", fontWeight: 900, fontSize: 18 }}>↓</div>
                  <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <div style={{ color: "#10b981", fontSize: 11, fontWeight: 700 }}>New Value</div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2, color: "#10b981" }}>{change.newValue || "-"}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Owner Decision & Remarks */}
        {selectedRequest.status !== "Pending" ? (
          <div className="owner-modal-info-grid">
            <div className="owner-modal-card">
              <span className="owner-modal-card-label">Decision Date</span>
              <span className="owner-modal-card-val">{selectedRequest.decisionDate || "-"}</span>
            </div>
            <div className="owner-modal-card">
              <span className="owner-modal-card-label">Owner Remarks</span>
              <span className="owner-modal-card-val">{selectedRequest.managerRemarks || "-"}</span>
            </div>
          </div>
        ) : (
          <div className="owner-modal-card">
            <span className="owner-modal-card-label">Owner Remarks / Note for Decision</span>
            <input
              type="text"
              placeholder="e.g. Approved after reviewing business case documents"
              value={remarksInput}
              onChange={(e) => setRemarksInput(e.target.value)}
              className="owner-search-box input"
              style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(99, 102, 241, 0.2)", marginTop: 6, fontSize: 13, background: "transparent", color: "inherit" }}
            />
          </div>
        )}

        <div className="owner-modal-actions">
          {selectedRequest.status === "Pending" && (
            <>
              <button
                type="button"
                className="owner-btn-primary"
                style={{
                  background: isDeletion
                    ? "linear-gradient(135deg, #e11d48 0%, #be123c 100%)"
                    : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                }}
                onClick={() => {
                  onApprove(selectedRequest.id, remarksInput);
                  onClose();
                }}
              >
                {isDeletion
                  ? "Authorize & Execute Deletion"
                  : isTransfer
                  ? "Authorize & Execute Transfer"
                  : "✓ Authorize & Apply Changes"}
              </button>
              <button
                type="button"
                className="owner-btn-danger"
                onClick={() => {
                  onReject(selectedRequest.id, remarksInput);
                  onClose();
                }}
              >
                ✕ Reject Request
              </button>
            </>
          )}
          <button className="owner-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </SimpleModal>
  );
}
