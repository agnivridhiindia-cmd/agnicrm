import React from "react";
import Icon from "../../../components/Icon";
import {
  agreementStatusBadgeColors,
  TEMPLATE_TYPES,
  TEMPLATE_NAMES,
  normalizeAgreementData,
} from "../../../services/agreementService";
import { getCanonicalSchemeName, isPaymentDemandOrSettlement } from "../../../utils/schemeTracker";
import "../../Admin/AdminDashboard.css";

export default function AgreementHistoryTable({
  agreements = [],
  onReview,
}) {
  const dispatchedList = (agreements || [])
    .map((a) => (a ? normalizeAgreementData(a) : null))
    .filter(Boolean)
    .filter((agr) => {
      if (isPaymentDemandOrSettlement(agr)) return false;
      const status = String(agr.agreement?.status || agr.status || "").toLowerCase();
      return status === "sent" || status === "completed" || Boolean(agr.sentAt);
    });

  return (
    <div className="admin-table-wrap">
      <div
        style={{
          padding: "18px 22px",
          borderBottom: "1px solid rgba(154, 116, 233, 0.15)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "inherit" }}>
            Dispatched Agreements &amp; History Archive
          </h3>
          <p className="admin-desc" style={{ fontSize: 12.5, margin: "2px 0 0" }}>
            Official legal contracts dispatched to clients with execution timestamps &amp; delivery audit trail.
          </p>
        </div>
        <span
          className="admin-badge"
          style={{
            background: "rgba(154, 116, 233, 0.15)",
            color: "#9a74e9",
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          {dispatchedList.length} Dispatched Records
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="admin-table" style={{ minWidth: 860, margin: 0 }}>
          <thead>
            <tr>
              <th>Agreement ID</th>
              <th>Client Information</th>
              <th>Service / Scheme</th>
              <th>Template Format</th>
              <th>Execution Date</th>
              <th>Delivery Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dispatchedList.map((agr) => {
              const canonicalScheme = getCanonicalSchemeName(agr.scheme?.name || agr.serviceType || agr.scheme);
              const isPrivate = agr.scheme?.type === TEMPLATE_TYPES.PRIVATE_FUNDING || (canonicalScheme && canonicalScheme.toLowerCase().includes("private funding"));
              const rawStatus = agr.agreement?.status || agr.status || "Sent";
              const statusStyle =
                agreementStatusBadgeColors[rawStatus] ||
                agreementStatusBadgeColors.Sent ||
                agreementStatusBadgeColors.Ready;
              const templateTitle =
                agr.agreement?.templateName ||
                (isPrivate ? TEMPLATE_NAMES.PRIVATE_FUNDING : TEMPLATE_NAMES.SCHEME);

              return (
                <tr key={agr.id}>
                  <td>
                    <strong style={{ fontSize: 13, color: "inherit" }}>{agr.id}</strong>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Ref: {agr.applicationId || agr.crmId}</div>
                  </td>
                  <td>
                    <strong style={{ fontSize: 13.5, color: "inherit" }}>{agr.client?.companyName || agr.client?.clientName}</strong>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>Contact: {agr.client?.clientName}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 11px",
                        borderRadius: 999,
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: isPrivate ? "rgba(236, 72, 153, 0.12)" : "rgba(78, 124, 255, 0.12)",
                        color: isPrivate ? "#ec4899" : "#60a5fa",
                        border: `1px solid ${isPrivate ? "rgba(236, 72, 153, 0.28)" : "rgba(78, 124, 255, 0.28)"}`,
                      }}
                    >
                      {canonicalScheme}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      📄 {templateTitle}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: 12.5, color: "inherit" }}>{agr.agreement?.date || agr.createdAt}</strong>
                    {agr.sentAt && (
                      <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>
                        Sent: {agr.sentAt}
                      </div>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "4px 11px",
                        borderRadius: 999,
                        fontSize: 11.5,
                        fontWeight: 700,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                      }}
                    >
                      <span style={{ fontSize: 8 }}>●</span>
                      <span>{agr.agreement?.status}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{
                        padding: "6px 14px",
                        fontSize: 12,
                      }}
                      onClick={() => onReview(agr)}
                      title={`Review agreement document for ${agr.client?.companyName}`}
                    >
                      <Icon name="eye" size={13} />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              );
            })}

            {dispatchedList.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px 16px", color: "#64748b" }}>
                  No dispatched agreement records in history archive yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
