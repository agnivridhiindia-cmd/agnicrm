import React from "react";
import SimpleModal from "../../components/SimpleModal";
import Icon from "../../components/Icon";
import { useAuth } from "../../context/AuthContext";

export default function OwnerEmployeeInfoModal({
  selectedEmployeeInfo,
  onClose,
  onOpenTeamUnder,
  onOpenClientsUnder,
  onEditEmployee,
}) {
  const { userName: authOwnerName } = useAuth() || {};
  const fallbackOwner = (authOwnerName && !authOwnerName.toLowerCase().includes("devika")) ? `${authOwnerName} (Owner)` : "Rahul Singh (Owner)";

  if (!selectedEmployeeInfo) return null;

  const initials = selectedEmployeeInfo.name
    ? selectedEmployeeInfo.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "EM";

  const isTransferred =
    selectedEmployeeInfo.isTransferred ||
    (selectedEmployeeInfo.originBranch &&
      selectedEmployeeInfo.branch &&
      selectedEmployeeInfo.originBranch !== selectedEmployeeInfo.branch) ||
    (Array.isArray(selectedEmployeeInfo.transferLogs) &&
      selectedEmployeeInfo.transferLogs.length > 0);

  const transferLogs = Array.isArray(selectedEmployeeInfo.transferLogs)
    ? selectedEmployeeInfo.transferLogs
    : [];

  return (
    <SimpleModal onClose={onClose}>
      <div className="owner-modal-profile">
        <div className="owner-modal-avatar">{initials}</div>
        <div>
          <h2 className="owner-header-title">{selectedEmployeeInfo.name}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
            <span className="owner-role-tag">{selectedEmployeeInfo.role}</span>
            {isTransferred && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#d97706",
                  background: "rgba(217, 119, 6, 0.12)",
                  padding: "3px 8px",
                  borderRadius: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                🔄 Transferred Staff
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="owner-modal-info-grid">
        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Employee Name</span>
          <span className="owner-modal-card-val">{selectedEmployeeInfo.name}</span>
        </div>
        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Email Address</span>
          <span className="owner-modal-card-val">{selectedEmployeeInfo.email}</span>
        </div>
        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Mobile Contact</span>
          <span className="owner-modal-card-val owner-phone-text">{selectedEmployeeInfo.phone}</span>
        </div>
        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Designation / Role</span>
          <span className="owner-modal-card-val">{selectedEmployeeInfo.role}</span>
        </div>

        {/* Current Branch vs Origin Branch */}
        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Current Branch Territory</span>
          <span className="owner-modal-card-val" style={{ color: "#4f46e5", fontWeight: 700 }}>
            {selectedEmployeeInfo.branch
              ? selectedEmployeeInfo.branch.endsWith("Branch")
                ? selectedEmployeeInfo.branch
                : `${selectedEmployeeInfo.branch} Branch`
              : "Noida Branch"}
          </span>
        </div>

        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Origin Branch (Started At)</span>
          <span className="owner-modal-card-val" style={{ color: "#0f766e", fontWeight: 700 }}>
            {(() => {
              const orig = selectedEmployeeInfo.originBranch || selectedEmployeeInfo.branch || "Noida Branch";
              return orig.endsWith("Branch") ? orig : `${orig} Branch`;
            })()}
          </span>
        </div>

        {/* Current Manager vs Initial Manager */}
        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Current Reporting Manager</span>
          <span className="owner-modal-card-val">
            {selectedEmployeeInfo.reportingManager ||
              selectedEmployeeInfo.branchManager ||
              ((selectedEmployeeInfo.role === "Sales Manager" ||
                selectedEmployeeInfo.rawRole === "MANAGER" ||
                selectedEmployeeInfo.role === "MANAGER")
                ? "Branch Manager"
                : fallbackOwner)}
          </span>
        </div>

        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Initial Manager (Started Under)</span>
          <span className="owner-modal-card-val">
            {selectedEmployeeInfo.initialManager ||
              selectedEmployeeInfo.reportingManager ||
              ((selectedEmployeeInfo.role === "Sales Manager" ||
                selectedEmployeeInfo.rawRole === "MANAGER" ||
                selectedEmployeeInfo.role === "MANAGER")
                ? "Branch Manager"
                : "Foundational Manager")}
          </span>
        </div>

        {/* Mobility History Audit Card if transferred */}
        {isTransferred && (
          <div
            className="owner-modal-card"
            style={{
              gridColumn: "1 / -1",
              background: "rgba(217, 119, 6, 0.05)",
              border: "1px solid rgba(217, 119, 6, 0.2)",
              padding: "16px",
              borderRadius: "10px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>🔄</span>
              <strong style={{ fontSize: 14, color: "#b45309" }}>
                Staff Mobility &amp; Inter-Branch Transfer History
              </strong>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "rgba(255,255,255,0.7)",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ color: "#64748b", display: "block", fontSize: 11 }}>Career Journey</span>
                  <strong>{selectedEmployeeInfo.originBranch || "Origin Branch"}</strong>
                  <span style={{ margin: "0 8px", color: "#d97706", fontWeight: 800 }}>➔</span>
                  <strong style={{ color: "#4f46e5" }}>{selectedEmployeeInfo.branch} (Current)</strong>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ color: "#64748b", display: "block", fontSize: 11 }}>Status</span>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>Active in Territory</span>
                </div>
              </div>

              {transferLogs.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 }}>
                    Transfer Audit Logs:
                  </span>
                  {transferLogs.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      style={{
                        padding: "8px 12px",
                        background: "rgba(0,0,0,0.02)",
                        borderRadius: 6,
                        marginBottom: 6,
                        fontSize: 12,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <span>{log.fromBranch || "Branch"} ➔ <strong>{log.toBranch || "Branch"}</strong></span>
                        {log.reason && (
                          <div style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
                            Reason: {log.reason}
                          </div>
                        )}
                      </div>
                      <span style={{ color: "#94a3b8", fontSize: 11 }}>
                        {log.transferredAt ? new Date(log.transferredAt).toLocaleDateString("en-IN") : "Recorded"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="owner-modal-actions">
        {['branch manager', 'manager'].includes((selectedEmployeeInfo.role || '').toLowerCase()) && onOpenTeamUnder && (
          <button
            className="owner-btn-primary"
            type="button"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            onClick={() => {
              onOpenTeamUnder(selectedEmployeeInfo);
              onClose();
            }}
          >
            Team Under
          </button>
        )}
        {['sales', 'it', 'admin', 'market'].includes((selectedEmployeeInfo.role || '').toLowerCase()) && onOpenClientsUnder && (
          <button
            className="owner-btn-primary"
            type="button"
            onClick={() => {
              onOpenClientsUnder(selectedEmployeeInfo);
              onClose();
            }}
          >
            Clients Under
          </button>
        )}
        {onEditEmployee && (
          <button
            className="owner-btn-secondary"
            type="button"
            onClick={() => {
              onEditEmployee(selectedEmployeeInfo);
              onClose();
            }}
          >
            Edit Profile
          </button>
        )}
        <button className="owner-btn-secondary" type="button" onClick={onClose}>
          Close
        </button>
      </div>
    </SimpleModal>
  );
}
