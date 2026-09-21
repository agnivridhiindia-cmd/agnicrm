import React from "react";
import Icon from "../../../components/Icon";
import { getCanonicalSchemeName } from "../../../utils/schemeTracker";

export default function PendingAgreementsTable({
  pendingClients = [],
  onViewDetails,
  onCreateAgreement,
}) {
  return (
    <div style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e7e7f5", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #eef2f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#1e293b" }}>Agreement Pending</h3>
          <p style={{ margin: "3px 0 0", color: "#7a748e", fontSize: 12.5 }}>
            Clients and CRM applications awaiting statutory or private funding legal agreement generation.
          </p>
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 800,
            padding: "4px 12px",
            borderRadius: 999,
            background: "rgba(245, 158, 11, 0.12)",
            color: "#b45309",
            border: "1px solid #fde68a",
          }}
        >
          {pendingClients.length} Pending
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="clients-table" style={{ minWidth: 800, margin: 0 }}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Company</th>
              <th>Service / Scheme</th>
              <th>Agreement Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingClients.map((client) => {
              const isPrivate =
                (client.scheme && client.scheme.toLowerCase().includes("private funding")) ||
                (client.serviceName && client.serviceName.toLowerCase().includes("private funding"));

              return (
                <tr key={client.id || client.appId}>
                  <td>
                    <strong>{client.name}</strong>
                    <div style={{ fontSize: 11.5, color: "#7a748e" }}>ID: <code>{client.appId}</code></div>
                  </td>
                  <td>
                    <strong>{client.company || "—"}</strong>
                    <div style={{ fontSize: 11.5, color: "#7a748e" }}>{client.email}</div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 9px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 750,
                        background: isPrivate ? "rgba(236, 72, 153, 0.12)" : "rgba(79, 70, 229, 0.12)",
                        color: isPrivate ? "#be185d" : "#4338ca",
                        border: `1px solid ${isPrivate ? "#fbcfe8" : "#c7d2fe"}`,
                      }}
                    >
                      {getCanonicalSchemeName(client.scheme || client.serviceName || "PMEGP")}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 750,
                        background: "rgba(245, 158, 11, 0.12)",
                        color: "#b45309",
                        border: "1px solid #fde68a",
                      }}
                    >
                      ● Pending
                    </span>
                  </td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
                      {/* Action 1: View Details */}
                      <button
                        type="button"
                        className="admin-dossier-btn"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          height: 32,
                          padding: "0 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: 8,
                          background: "#f0f4ff",
                          color: "#3730a3",
                          border: "1px solid #c7d2fe",
                          cursor: "pointer",
                          margin: 0,
                          boxSizing: "border-box",
                        }}
                        onClick={() => onViewDetails(client)}
                        title={`View CRM and service details for ${client.name}`}
                      >
                        <Icon name="eye" size={13} />
                        <span>View Details</span>
                      </button>

                      {/* Action 2: Create Agreement */}
                      <button
                        type="button"
                        className="primary-button"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5,
                          height: 32,
                          padding: "0 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: 8,
                          margin: 0,
                          boxSizing: "border-box",
                          background: "#4f46e5",
                        }}
                        onClick={() => onCreateAgreement(client)}
                        title={`Create agreement for ${client.company || client.name} (${client.scheme || "Scheme"})`}
                      >
                        <Icon name="plus" size={13} />
                        <span>Create Agreement</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {pendingClients.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "48px 16px" }}>
                  <div style={{ maxWidth: 360, margin: "0 auto" }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: "#f0fdf4",
                        color: "#16a34a",
                        display: "grid",
                        placeItems: "center",
                        margin: "0 auto 12px",
                      }}
                    >
                      <Icon name="check" size={24} />
                    </div>
                    <strong style={{ fontSize: 16, color: "#1e293b", display: "block", marginBottom: 4 }}>
                      All Agreements Created!
                    </strong>
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                      There are no pending clients. Check the History tab to review or send generated agreements.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
