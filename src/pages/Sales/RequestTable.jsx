import React from "react";
import Icon from "../../components/Icon";
import { isPaymentDemandOrSettlement } from "../../utils/schemeTracker";

const statusConfig = {
  "Pending Sales Approval & Payment": { bg: "rgba(245, 158, 11, 0.14)", color: "#b45309", border: "rgba(245, 158, 11, 0.4)", label: "Pending Sales Approval & Payment" },
  "Pending Sales Approval": { bg: "rgba(245, 158, 11, 0.14)", color: "#b45309", border: "rgba(245, 158, 11, 0.4)", label: "Pending Sales Approval" },
  "Pending Manager Review": { bg: "rgba(140, 95, 248, 0.14)", color: "#6d28d9", border: "rgba(140, 95, 248, 0.4)", label: "Pending Manager Review" },
  "Pending": { bg: "rgba(245, 158, 11, 0.14)", color: "#b45309", border: "rgba(245, 158, 11, 0.4)", label: "Pending Approval" },
  "Approved & Active": { bg: "rgba(16, 185, 129, 0.14)", color: "#047857", border: "rgba(16, 185, 129, 0.4)", label: "Approved & Active" },
  "Approved by Manager": { bg: "rgba(16, 185, 129, 0.14)", color: "#047857", border: "rgba(16, 185, 129, 0.4)", label: "Approved by Manager" },
  "Approved": { bg: "rgba(16, 185, 129, 0.14)", color: "#047857", border: "rgba(16, 185, 129, 0.4)", label: "Approved" },
  "Rejected by Manager": { bg: "rgba(239, 68, 68, 0.14)", color: "#be123c", border: "rgba(239, 68, 68, 0.4)", label: "Rejected by Manager" },
  "Declined": { bg: "rgba(239, 68, 68, 0.14)", color: "#be123c", border: "rgba(239, 68, 68, 0.4)", label: "Declined" },
  "Rejected": { bg: "rgba(239, 68, 68, 0.14)", color: "#be123c", border: "rgba(239, 68, 68, 0.4)", label: "Rejected" },
  "Cancelled": { bg: "rgba(100, 116, 139, 0.14)", color: "#475569", border: "rgba(100, 116, 139, 0.4)", label: "Cancelled" },
};

export function getCategoryBadgeStyle(catStr = "", req = null) {
  if (req && isPaymentDemandOrSettlement(req)) {
    return { bg: "rgba(16, 185, 129, 0.12)", color: "#047857", border: "rgba(16, 185, 129, 0.35)", icon: "check", label: "Payment Settlement" };
  }
  const cat = String(catStr).toLowerCase();
  if (cat.includes("payment settlement") || cat.includes("payment demand")) {
    return { bg: "rgba(16, 185, 129, 0.12)", color: "#047857", border: "rgba(16, 185, 129, 0.35)", icon: "check", label: "Payment Settlement" };
  }
  if (cat.includes("eligible") || cat.includes("subsidy") || cat.includes("government")) {
    return { bg: "rgba(2, 132, 199, 0.12)", color: "#0284c7", border: "rgba(2, 132, 199, 0.35)", icon: "shield", label: "Eligible Scheme" };
  }
  if (cat.includes("more services") || cat.includes("service")) {
    return { bg: "rgba(147, 51, 234, 0.12)", color: "#7e22ce", border: "rgba(147, 51, 234, 0.35)", icon: "zap", label: "More Services" };
  }
  if (cat.includes("create") || cat.includes("registration")) {
    return { bg: "rgba(16, 185, 129, 0.12)", color: "#047857", border: "rgba(16, 185, 129, 0.35)", icon: "user-plus", label: "Manager Approval: Client Create" };
  }
  if (cat.includes("delete")) {
    return { bg: "rgba(225, 29, 72, 0.12)", color: "#be123c", border: "rgba(225, 29, 72, 0.35)", icon: "trash", label: "Manager Approval: Client Delete" };
  }
  return { bg: "rgba(217, 119, 6, 0.12)", color: "#b45309", border: "rgba(217, 119, 6, 0.35)", icon: "edit", label: "Manager Approval: Client Edit" };
}

export default function RequestTable({
  requests = [],
  onView,
  onCancel,
  onApproveScheme,
  onDeclineScheme,
  onApprovePayment,
  onDeclinePayment,
  onApproveClientCreation,
  onDeclineClientCreation
}) {
  if (requests.length === 0) {
    return (
      <div style={{ padding: "48px 24px", textAlign: "center" }}>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: "rgba(140, 95, 248, 0.12)",
            color: "#8c5ff8",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
          }}
        >
          <Icon name="clock" size={24} />
        </div>
        <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700 }}>No Pending Requests</h3>
        <p style={{ margin: 0, fontSize: 13, maxWidth: 420, marginInline: "auto", opacity: 0.8 }}>
          All client scheme enrollments, profile edits, and account deletion requests have been processed. Use "+ Create Request" to submit a new request.
        </p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="sales-clients-table" style={{ width: "100%", minWidth: 1080, margin: 0, tableLayout: "auto" }}>
        <thead>
          <tr>
            <th style={{ width: "11%" }}>Request ID</th>
            <th style={{ width: "19%" }}>Client Name</th>
            <th style={{ width: "16%" }}>Category</th>
            <th style={{ width: "18%" }}>Target Dept / Manager</th>
            <th style={{ width: "12%" }}>Status</th>
            <th style={{ width: "24%", textAlign: "right", paddingRight: 20 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            const conf = statusConfig[request.status] || statusConfig.Pending;
            const badge = getCategoryBadgeStyle(request.category || request.requestType || request.schemeName, request);
            const isPaymentSettlement = request.requestType === "Payment Settlement" || request.category === "Payment Settlement" || isPaymentDemandOrSettlement(request) || !!request.paymentId;
            const isSchemeReq = !isPaymentSettlement && (request.requestType === "Eligible Scheme" || request.requestType === "More Services" || !!request.schemeName);
            const isClientCreation = !isPaymentSettlement && (request.requestType === "Client Create" || request.category === "Manager Approval: Client Create");

            return (
              <tr key={request.id}>
                <td>
                  <span className="req-table-id">
                    {request.id}
                  </span>
                </td>
                <td>
                  <strong className="req-table-client-name">{request.clientName || request.companyName}</strong>
                </td>
                <td>
                  <div>
                    <span
                      className="req-category-badge"
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}
                    >
                      <Icon name={badge.icon} size={12} />
                      {badge.label}
                    </span>
                  </div>
                </td>
                <td>
                  <span className="req-table-target-dept">
                    {request.targetDepartment
                      ? `${request.targetDepartment} Dept (${request.assignedStaffName || "Specialist"})`
                      : request.managerName || "Sales Manager"}
                  </span>
                </td>
                <td>
                  <span
                    className="req-status-badge"
                    style={{
                      background: conf.bg,
                      color: conf.color,
                      border: `1px solid ${conf.border}`,
                    }}
                  >
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: conf.color, flexShrink: 0 }} />
                    {conf.label || request.status}
                  </span>
                </td>
                <td style={{ textAlign: "right", paddingRight: 16 }}>
                  <div className="req-actions-cell" style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, flexWrap: "nowrap" }}>
                    {/* View Details Modal */}
                    <button
                      className="sales-view-btn"
                      type="button"
                      onClick={() => onView(request)}
                      style={{ padding: "6px 12px", fontSize: 12, whiteSpace: "nowrap", flexShrink: 0 }}
                    >
                      <span>View Details</span>
                    </button>

                    {/* Inline Actions for Payment Settlement Requests */}
                    {isPaymentSettlement && (request.status.includes("Pending") || request.status === "Pending") && onApprovePayment && (
                      <>
                        <button
                          type="button"
                          onClick={() => onApprovePayment(request)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            background: "#10b981",
                            color: "#ffffff",
                            border: "none",
                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          Approve Settlement ✓
                        </button>
                        {onDeclinePayment && (
                          <button
                            type="button"
                            onClick={() => onDeclinePayment(request)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              background: "rgba(225, 29, 72, 0.1)",
                              color: "#e11d48",
                              border: "1px solid rgba(225, 29, 72, 0.3)",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            Deny ✕
                          </button>
                        )}
                      </>
                    )}

                    {/* Inline Actions for Scheme Requests */}
                    {isSchemeReq && (request.status.includes("Pending") || request.status === "Pending") && onApproveScheme && (
                      <>
                        <button
                          type="button"
                          onClick={() => onApproveScheme(request)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            background: "#10b981",
                            color: "#ffffff",
                            border: "none",
                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          Approve &amp; Assign ✓
                        </button>
                        {onDeclineScheme && (
                          <button
                            type="button"
                            onClick={() => onDeclineScheme(request.id)}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: "pointer",
                              background: "rgba(225, 29, 72, 0.1)",
                              color: "#e11d48",
                              border: "1px solid rgba(225, 29, 72, 0.3)",
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}
                          >
                            Decline ✕
                          </button>
                        )}
                      </>
                    )}

                    {/* Inline Actions for Client Creation Requests */}
                    {isClientCreation && onApproveClientCreation && (
                      <button
                        type="button"
                        onClick={() => onApproveClientCreation(request.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer",
                          background: "#10b981",
                          color: "#ffffff",
                          border: "none",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        Approve Client ✓
                      </button>
                    )}

                    {/* Cancel button for standard Edit/Delete client requests */}
                    {!isSchemeReq && !isClientCreation && !isPaymentSettlement && request.status === "Pending" && onCancel && (
                      <button
                        type="button"
                        onClick={() => onCancel(request.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(244, 63, 94, 0.35)",
                          background: "rgba(244, 63, 94, 0.08)",
                          color: "#f43f5e",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          flexShrink: 0,
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
