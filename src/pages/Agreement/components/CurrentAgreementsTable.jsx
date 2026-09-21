import React from "react";
import Icon from "../../../components/Icon";
import {
  agreementStatusBadgeColors,
  AGREEMENT_STATUSES,
  TEMPLATE_TYPES,
  getTemplateTypeForService,
  normalizeAgreementData,
} from "../../../services/agreementService";
import { isPaymentDemandOrSettlement, getCanonicalSchemeName } from "../../../utils/schemeTracker";
import "../../Admin/AdminDashboard.css";

export default function CurrentAgreementsTable({
  clients = [],
  agreements = [],
  onViewDetails,
  onCreateAgreement,
  onReviewAgreement,
  onSendAgreement,
  onRetryAgreement,
}) {
  // Filter out any Payment Demand items - payment demands are NOT schemes!
  const validClients = clients.filter((c) => {
    if (!c) return false;
    if (isPaymentDemandOrSettlement(c)) return false;
    const sName = c.scheme || c.serviceName || c.particularScheme;
    if (isPaymentDemandOrSettlement(sName)) return false;
    return true;
  });

  // Map of clientId / appId to normalized agreement record
  const agreementMap = new Map();
  agreements.forEach((agr) => {
    const normalized = normalizeAgreementData(agr);
    if (normalized.clientId) agreementMap.set(normalized.clientId, normalized);
    if (normalized.crmId) agreementMap.set(normalized.crmId, normalized);
    if (normalized.applicationId) agreementMap.set(normalized.applicationId, normalized);
    if (normalized.appId) agreementMap.set(normalized.appId, normalized);
  });

  // Filter clients whose agreements are YET TO BE SENT (Pending dispatch)
  const pendingClients = validClients.filter((client) => {
    const agreement =
      agreementMap.get(client.id) ||
      agreementMap.get(client.appId) ||
      agreementMap.get(String(client.id)) ||
      null;
    const status = agreement ? (agreement.agreement?.status || agreement.status) : AGREEMENT_STATUSES.PENDING;
    return status !== AGREEMENT_STATUSES.SENT;
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
            Active Agreement Generation Queue (Yet to Send)
          </h3>
          <p className="admin-desc" style={{ fontSize: 12.5, margin: "2px 0 0" }}>
            Branch clients across all salespersons awaiting contract creation &amp; dispatch.
          </p>
        </div>
        <span
          className="admin-badge"
          style={{
            background: "rgba(78, 124, 255, 0.15)",
            color: "#4e7cff",
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          {pendingClients.length} Pending Dispatch
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="admin-table" style={{ minWidth: 860, margin: 0 }}>
          <thead>
            <tr>
              <th>Client Information</th>
              <th>Enterprise / Company</th>
              <th>Service / Scheme</th>
              <th>Contract Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingClients.map((client) => {
              const agreement =
                agreementMap.get(client.id) ||
                agreementMap.get(client.appId) ||
                agreementMap.get(String(client.id)) ||
                null;
              const hasAgreement = Boolean(agreement);
              const status = agreement ? agreement.agreement?.status || agreement.status : AGREEMENT_STATUSES.PENDING;
              const isSent = status === AGREEMENT_STATUSES.SENT;
              const isGenerating = status === AGREEMENT_STATUSES.GENERATING;
              const isFailed = status === AGREEMENT_STATUSES.FAILED;
              const statusStyle = agreementStatusBadgeColors[status] || agreementStatusBadgeColors.Pending;

              const serviceName = getCanonicalSchemeName(client.scheme || client.serviceName || "PMEGP");
              const isPrivate = getTemplateTypeForService(serviceName) === TEMPLATE_TYPES.PRIVATE_FUNDING;

              return (
                <tr key={client.id || client.appId}>
                  <td>
                    <strong style={{ fontSize: 13.5, color: "inherit" }}>{client.name}</strong>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>
                      App ID: <code style={{ color: "#4e7cff" }}>{client.appId}</code>
                    </div>
                  </td>
                  <td>
                    <strong style={{ fontSize: 13, color: "inherit" }}>{client.company || "—"}</strong>
                    <div style={{ fontSize: 11.5, color: "#64748b" }}>{client.email}</div>
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
                      {serviceName}
                    </span>
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
                      <span>{status}</span>
                    </span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {!hasAgreement ? (
                      /* ── BEFORE CREATION: [ View Details ] [ Create Agreement ] ── */
                      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                          }}
                          onClick={() => onViewDetails(client)}
                          title={`View CRM and service details for ${client.name}`}
                        >
                          <Icon name="eye" size={13} />
                          <span>Dossier</span>
                        </button>

                        <button
                          type="button"
                          className="admin-btn-primary"
                          style={{
                            padding: "6px 14px",
                            fontSize: 12,
                          }}
                          onClick={() => onCreateAgreement(client)}
                          title={`Generate agreement for ${client.company || client.name}`}
                        >
                          <Icon name="plus" size={13} />
                          <span>Create Agreement</span>
                        </button>
                      </div>
                    ) : isGenerating ? (
                      /* ── GENERATING STATE ── */
                      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            color: "#4e7cff",
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              display: "inline-block",
                              width: 12,
                              height: 12,
                              border: "2px solid rgba(78, 124, 255, 0.3)",
                              borderTopColor: "#4e7cff",
                              borderRadius: "50%",
                              animation: "spin 0.8s linear infinite",
                            }}
                          />
                          Generating Contract...
                        </span>
                      </div>
                    ) : isFailed ? (
                      /* ── FAILED STATE: [ Retry ] ── */
                      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <button
                          type="button"
                          className="admin-btn-primary"
                          style={{
                            padding: "6px 14px",
                            fontSize: 12,
                            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                          }}
                          onClick={() => onRetryAgreement && onRetryAgreement(agreement)}
                        >
                          <span>Retry Draft</span>
                        </button>
                      </div>
                    ) : (
                      /* ── READY OR SENT: [ Review ] [ Send ] ── */
                      <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                        <button
                          type="button"
                          className="admin-btn-secondary"
                          style={{
                            padding: "6px 12px",
                            fontSize: 12,
                          }}
                          onClick={() => onReviewAgreement(agreement)}
                          title={`Review agreement document for ${agreement.client?.companyName || agreement.companyName}`}
                        >
                          <Icon name="eye" size={13} />
                          <span>Review</span>
                        </button>

                        <button
                          type="button"
                          className={isSent ? "admin-btn-secondary" : "admin-btn-primary"}
                          style={{
                            padding: "6px 14px",
                            fontSize: 12,
                            background: isSent ? "rgba(16, 185, 129, 0.12)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: isSent ? "#10b981" : "#ffffff",
                            borderColor: isSent ? "rgba(16, 185, 129, 0.3)" : undefined,
                            cursor: isSent ? "default" : "pointer",
                          }}
                          disabled={isSent}
                          onClick={() => {
                            if (!isSent) onSendAgreement(agreement);
                          }}
                          title={
                            isSent
                              ? `Agreement already sent to ${agreement.sentTo || client.email}`
                              : `Send agreement to ${client.email}`
                          }
                        >
                          {isSent ? (
                            <>
                              <Icon name="check" size={13} />
                              <span>Dispatched ✓</span>
                            </>
                          ) : (
                            <>
                              <Icon name="mail" size={13} />
                              <span>Send</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {pendingClients.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "40px 16px", color: "#64748b" }}>
                  All branch client agreements have been dispatched! View sent contracts in the History Archive.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
