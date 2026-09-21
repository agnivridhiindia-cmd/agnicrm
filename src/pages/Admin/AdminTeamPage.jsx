import React, { useState, useMemo } from "react";
import { ACTIVITY_STAGES, stageBadgeColors, formatCurrency, getTrackerState, getCanonicalSchemeName } from "./mockAdminData";
import "./AdminDashboard.css";

export default function AdminTeamPage({
  selectedBranch,
  teamMembers = [],
  branchClients = [],
  onOpenDossier,
  onOpenStatusUpdate,
}) {
  const [selectedSalesPerson, setSelectedSalesPerson] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [statusTab, setStatusTab] = useState("All");

  // Filter ONLY sales persons belonging to the selected branch (excluding Sales Managers)
  const branchSalesPersons = useMemo(() => {
    return teamMembers.filter((m) => {
      const isBranch = !m.branch || m.branch === selectedBranch;
      const roleLower = (m.role || "").toLowerCase();
      const isSalesPerson = roleLower.includes("sales") && !roleLower.includes("manager");
      return isBranch && isSalesPerson;
    });
  }, [teamMembers, selectedBranch]);

  // Helper to retrieve clients assigned to a specific sales person in this branch
  const getClientsForSalesPerson = (salesPersonName) => {
    if (!salesPersonName) return [];
    const targetName = salesPersonName.toLowerCase().trim();

    return branchClients.filter((c) => {
      const rawSales =
        c.assignedSalesPerson ||
        c.salesPerson ||
        c.owner ||
        c.salesperson ||
        c.salesRep ||
        "";
      const spName = (
        typeof rawSales === "object"
          ? rawSales.fullName || rawSales.name || ""
          : String(rawSales)
      )
        .toLowerCase()
        .trim();

      if (!spName) return false;
      return spName === targetName || spName.includes(targetName) || targetName.includes(spName);
    });
  };

  // DRILL DOWN VIEW: Clients under the selected sales person
  if (selectedSalesPerson) {
    const spClients = getClientsForSalesPerson(selectedSalesPerson.name);

    const filteredSpClients = spClients.filter((c) => {
      const q = clientSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.appId && c.appId.toLowerCase().includes(q)) ||
        (c.scheme && c.scheme.toLowerCase().includes(q));

      const tracker = getTrackerState(c);
      const matchesStage = statusTab === "All" || tracker.currentStage === statusTab;
      return matchesSearch && matchesStage;
    });

    return (
      <div className="admin-page-container">
        {/* Header with Back button */}
        <div className="admin-header-banner">
          <div>
            <span className="admin-kicker">{selectedBranch} • SALES REPRESENTATIVE</span>
            <h2 className="admin-title">Clients under {selectedSalesPerson.name}</h2>
            <p className="admin-desc">
              Managing {spClients.length} assigned branch client portfolios and scheme progress.
            </p>
          </div>
          <button
            type="button"
            className="admin-btn-secondary"
            onClick={() => {
              setSelectedSalesPerson(null);
              setClientSearch("");
              setStatusTab("All");
            }}
          >
            ← Back to Team Roster
          </button>
        </div>

        {/* Filter Tabs & Search matching AdminClientsPage */}
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

          <div style={{ minWidth: 280 }}>
            <input
              type="text"
              className="admin-form-input"
              placeholder="Search officer clients..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table Wrap */}
        <div className="admin-table-wrap" style={{ overflowX: "auto" }}>
          <table className="admin-table" style={{ minWidth: 980 }}>
            <thead>
              <tr>
                <th>Application ID</th>
                <th>Client &amp; Company</th>
                <th>Scheme / Value</th>
                <th>Activity Status</th>
                <th>Progress (%)</th>
                <th>Last Verified</th>
                <th style={{ textAlign: "right" }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpClients.map((client) => {
                const tracker = getTrackerState(client);

                return (
                  <tr key={client.id}>
                    <td><code style={{ color: "#4e7cff", fontWeight: 700 }}>{client.appId}</code></td>
                    <td>
                      <strong>{client.name}</strong>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{client.company}</div>
                    </td>
                    <td>
                      <div>{getCanonicalSchemeName(client.scheme || client.serviceName)}</div>
                      <strong style={{ color: "#4e7cff", fontSize: 12.5 }}>{formatCurrency(client.totalPayment || client.amount || 0)}</strong>
                    </td>
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
                        {onOpenStatusUpdate && (
                          <button
                            className="admin-btn-primary"
                            type="button"
                            style={{ padding: "6px 12px", fontSize: 12 }}
                            onClick={() => onOpenStatusUpdate(client)}
                          >
                            Update Status
                          </button>
                        )}
                        {onOpenDossier && (
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
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSpClients.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "36px 16px", color: "#64748b" }}>
                    No clients found for {selectedSalesPerson.name} under {statusTab}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // MAIN TEAM VIEW: List of Sales Persons of the selected branch
  return (
    <div className="admin-page-container">
      {/* Glass Header Banner */}
      <div className="admin-header-banner">
        <div>
          <span className="admin-kicker">TEAM ROSTER &amp; ASSIGNMENTS</span>
          <h2 className="admin-title">{selectedBranch} Sales Team</h2>
          <p className="admin-desc">
            Directly inspect sales officer portfolios, client accounts, and milestone progression quotas.
          </p>
        </div>
      </div>

      <div className="admin-table-wrap" style={{ overflowX: "auto" }}>
        <table className="admin-table" style={{ minWidth: 860 }}>
          <thead>
            <tr>
              <th>Team Member</th>
              <th>Branch Role</th>
              <th>Official Email</th>
              <th>Phone</th>
              <th>Assigned Client Accounts</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {branchSalesPersons.map((m) => {
              const assignedCount = getClientsForSalesPerson(m.name).length;

              return (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "rgba(78, 124, 255, 0.15)",
                          color: "#4e7cff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <strong>{m.name}</strong>
                    </div>
                  </td>
                  <td><strong>{m.role}</strong></td>
                  <td>{m.email}</td>
                  <td>{m.phone}</td>
                  <td>
                    <strong style={{ color: "#4e7cff" }}>
                      {assignedCount} Client{assignedCount === 1 ? "" : "s"}
                    </strong>
                  </td>
                  <td>
                    <span
                      className="admin-badge"
                      style={{
                        background: "rgba(16, 185, 129, 0.12)",
                        color: "#10b981",
                      }}
                    >
                      {m.status || "Active"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="admin-btn-primary"
                      type="button"
                      style={{ padding: "6px 14px", fontSize: 12 }}
                      onClick={() => setSelectedSalesPerson(m)}
                    >
                      View Clients →
                    </button>
                  </td>
                </tr>
              );
            })}
            {branchSalesPersons.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "36px 16px", color: "#64748b" }}>
                  No sales personnel found assigned to {selectedBranch}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
