import React from "react";
import { ACTIVITY_STAGES, stageBadgeColors, formatCurrency, getTrackerState, getCanonicalSchemeName } from "./mockAdminData";
import { exportClientsToCSV, downloadClientDossierPDF } from "../../utils/exportHelpers";
import "./AdminDashboard.css";

export default function AdminClientsPage({
  selectedBranch,
  statusTab,
  setStatusTab,
  clientSearch,
  setClientSearch,
  filteredClients = [],
  onOpenStatusUpdate,
  onOpenDossier,
}) {
  return (
    <div className="admin-page-container">
      {/* Glass Header Banner */}
      <div className="admin-header-banner">
        <div>
          <span className="admin-kicker">BRANCH DIRECTORY &amp; AUDIT</span>
          <h2 className="admin-title">{selectedBranch} Client Register</h2>
          <p className="admin-desc">
            Unified directory for reviewing, verifying, and updating 5-point client milestones (20% each) across the branch.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-branch-tabs">
          {["All", ...ACTIVITY_STAGES.map((s) => s.name)].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`admin-branch-tab ${statusTab === tab ? "active" : ""}`}
              onClick={() => setStatusTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 380 }}>
          <input
            type="text"
            className="admin-form-input"
            placeholder="Search client, company, app ID..."
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />
          <button
            type="button"
            className="admin-btn-secondary"
            style={{ padding: "8px 14px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
            title="Export filtered clients to CSV spreadsheet"
            onClick={() => exportClientsToCSV(filteredClients, `${selectedBranch}_Clients`)}
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Clients Table Wrap */}
      <div className="admin-table-wrap" style={{ overflowX: "auto" }}>
        <table className="admin-table" style={{ minWidth: 980 }}>
          <thead>
            <tr>
              <th>Application ID</th>
              <th>Client &amp; Company</th>
              <th>Scheme / Value</th>
              <th>Sales Officer</th>
              <th>Activity Status</th>
              <th>Progress (%)</th>
              <th>Last Verified</th>
              <th style={{ textAlign: "right" }}>Admin Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => {
              const tracker = getTrackerState(client);

              return (
                <tr key={client.id}>
                  <td><code style={{ color: "#4e7cff", fontWeight: 700 }}>{client.appId}</code></td>
                  <td>
                    <strong>{client.name}</strong>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{client.company}</div>
                  </td>
                  <td>
                    <div>{getCanonicalSchemeName(client.particularScheme || client.schemeName || client.scheme || client.serviceName)}</div>
                    <strong style={{ color: "#4e7cff", fontSize: 12.5 }}>{formatCurrency(client.totalPayment)}</strong>
                  </td>
                  <td>{client.assignedSalesPerson}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span
                        className="admin-badge"
                        style={{
                          background: `${stageBadgeColors[tracker.currentStage] || "#10b981"}18`,
                          color: stageBadgeColors[tracker.currentStage] || "#10b981",
                          border: `1px solid ${stageBadgeColors[tracker.currentStage] || "#10b981"}33`,
                          width: "fit-content",
                        }}
                      >
                        ● {tracker.currentStage}
                      </span>
                      {/* Dynamic scheme mini dots indicator */}
                      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        {tracker.stages.map((st) => {
                          const isDone = tracker.completedStages.includes(st.name);
                          return (
                            <span
                              key={st.name}
                              title={`${st.name} (${st.percent}%) - ${isDone ? "Completed" : "Pending"}`}
                              style={{
                                width: 8,
                                height: 8,
                                borderRadius: "50%",
                                background: isDone ? "#10b981" : "rgba(148, 163, 184, 0.4)",
                              }}
                            />
                          );
                        })}
                        <span style={{ fontSize: 10.5, color: "#64748b", marginLeft: 4 }}>
                          {tracker.completedStages.length}/{tracker.totalStages} Points
                        </span>
                      </div>
                    </div>
                  </td>
                  <td style={{ minWidth: 130 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 8, background: "rgba(154, 116, 233, 0.15)", borderRadius: 999, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${tracker.progressPercent}%`,
                            height: "100%",
                            background: tracker.progressPercent === 100 ? "#10b981" : "linear-gradient(90deg, #4e7cff, #10b981)",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <strong style={{ fontSize: 12, color: tracker.progressPercent === 100 ? "#10b981" : "inherit" }}>
                        {tracker.progressPercent}%
                      </strong>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{client.lastUpdated}</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                      <button
                        className="admin-btn-primary"
                        type="button"
                        style={{ padding: "6px 12px", fontSize: 12 }}
                        onClick={() => onOpenStatusUpdate(client)}
                      >
                        Update Status
                      </button>
                      <button
                        className="admin-btn-secondary"
                        type="button"
                        style={{ padding: "6px 10px", fontSize: 12 }}
                        title="Download Dossier PDF"
                        onClick={() => downloadClientDossierPDF(client)}
                      >
                        📄 PDF
                      </button>
                      <button
                        className="admin-btn-secondary"
                        type="button"
                        style={{ padding: "6px 12px", fontSize: 12 }}
                        onClick={() => onOpenDossier(client)}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <span>Dossier</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "36px 16px", color: "#64748b" }}>
                  No clients found for {selectedBranch} under {statusTab}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
