import React from "react";
import KpiCard from "../../components/KpiCard";
import Icon from "../../components/Icon";
import ActivityTracker from "../../components/ActivityTracker";
import { ACTIVITY_STAGES, stageBadgeColors, getCanonicalSchemeName } from "./mockAdminData";
import { getTrackerState } from "../../utils/schemeTracker";
import "./AdminDashboard.css";

export default function AdminOverviewPage({
  selectedBranch,
  branchClients = [],
  metrics,
  dark,
  onOpenClients,
  onOpenPipeline,
  onOpenAgreement,
  onOpenHistory,
  onOpenStatusUpdate,
  onQuickStepToggle,
  onRequestRollback,
  onOpenDossier,
}) {
  const verifiedDocsCount = branchClients.reduce((acc, c) => {
    return acc + (c.documents || []).filter((d) => d.status === "Verified").length;
  }, 0);
  const totalDocsCount = branchClients.reduce((acc, c) => {
    return acc + (c.documents || []).length;
  }, 0);

  const kpiCards = [
    {
      label: "Branch Clients",
      value: `${metrics.total}`,
      trend: "100% Tracked",
      description: `Under ${selectedBranch}`,
      accent: "#4e7cff",
      onClick: onOpenClients,
    },
    {
      label: "In Active Pipeline",
      value: `${metrics.inProgress}`,
      trend: "20% - 80%",
      description: "Milestone checkpoints active",
      accent: "#f2aa38",
      onClick: onOpenPipeline || onOpenClients,
    },
    {
      label: "Manager Review Stage",
      value: `${metrics.managerReview}`,
      trend: "60% Milestone",
      description: "Commercial clearance pending",
      accent: "#26a69a",
      onClick: onOpenClients,
    },
    {
      label: "Fully Approved",
      value: `${metrics.completed}`,
      trend: "5/5 Points Done",
      description: "Disbursed & live agreements",
      accent: "#10b981",
      onClick: onOpenClients,
    },
    {
      label: "Pipeline Updates",
      value: `${metrics.inProgress}/${metrics.total}`,
      trend: "Active Stages",
      description: "Pipeline milestone stages tracked",
      accent: "#9a74e9",
      onClick: onOpenPipeline || onOpenClients,
    },
    {
      label: "Branch S.L.A Health",
      value: "99.8%",
      trend: "Optimal",
      description: "Milestone dispatch uptime",
      accent: "#f2938f",
      onClick: onOpenHistory,
    },
  ];

  return (
    <section className="dashboard-layout" style={{ animation: "fadeIn 0.25s ease-out" }}>
      {/* Main Column */}
      <div className="dashboard-main">
        {/* KPI Cards Grid */}
        <section className="kpi-grid">
          {kpiCards.map((card) => (
            <KpiCard
              key={card.label}
              card={card}
              onClick={card.onClick}
              dark={dark}
            />
          ))}
        </section>

        {/* Quick Launchpad Action Cards */}
        <section className="admin-launchpad-grid">
          <div
            className="admin-launchpad-card blue"
            onClick={onOpenClients}
          >
            <div className="admin-launchpad-top">
              <div className="admin-launchpad-icon">
                <Icon name="clients" size={18} />
              </div>
              <span className="admin-launchpad-action-link">Manage Clients →</span>
            </div>
            <h3 className="admin-launchpad-title">Branch Client Directory</h3>
            <p className="admin-launchpad-desc">
              Review and audit all {branchClients.length} registered clients under {selectedBranch}.
            </p>
          </div>

          <div
            className="admin-launchpad-card green"
            onClick={onOpenPipeline || onOpenClients}
          >
            <div className="admin-launchpad-top">
              <div className="admin-launchpad-icon">
                <Icon name="overview" size={18} />
              </div>
              <span className="admin-launchpad-action-link">View Pipeline →</span>
            </div>
            <h3 className="admin-launchpad-title">Milestone Pipeline Board</h3>
            <p className="admin-launchpad-desc">
              Track 5-point progression stages across CRM Creation, Agreement, Reports, and Approvals.
            </p>
          </div>

          <div
            className="admin-launchpad-card purple"
            onClick={onOpenAgreement || onOpenClients}
          >
            <div className="admin-launchpad-top">
              <div className="admin-launchpad-icon">
                <Icon name="agreement" size={18} />
              </div>
              <span className="admin-launchpad-action-link">Agreements →</span>
            </div>
            <h3 className="admin-launchpad-title">Legal Agreements</h3>
            <p className="admin-launchpad-desc">
              Generate, dispatch, and review legal agreements with automated milestone progression.
            </p>
          </div>
        </section>

        {/* Client Application Progress Queue */}
        <section className="admin-panel-card" style={{ marginTop: 4 }}>
          <div className="admin-panel-header">
            <div>
              <span className="admin-kicker">MILESTONE CHECKPOINT QUEUE</span>
              <h3 className="admin-panel-header-title">Client Application Progress</h3>
            </div>
            <button
              type="button"
              className="admin-btn-secondary"
              onClick={onOpenClients}
            >
              <span>Manage All ({branchClients.length}) →</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(() => {
              const recentClients = [...branchClients]
                .sort((a, b) => {
                  const timeA = new Date(a.lastUpdated || a.submissionDate || 0).getTime();
                  const timeB = new Date(b.lastUpdated || b.submissionDate || 0).getTime();
                  return timeB - timeA;
                })
                .slice(0, 3);

              if (recentClients.length === 0) {
                return (
                  <div style={{ padding: "32px 16px", textAlign: "center", color: "#7a748e", fontSize: 13 }}>
                    No client applications found in {selectedBranch}.
                  </div>
                );
              }

              return recentClients.map((client) => {
                const tracker = getTrackerState(client);

                return (
                  <div
                    key={client.id}
                    className="admin-subcard"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <strong style={{ fontSize: 15 }}>{client.name}</strong>{" "}
                        <span style={{ color: "#64748b", fontSize: 12 }}>({client.company})</span>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          ID: <code style={{ color: "#4e7cff", fontWeight: 700 }}>{client.appId}</code> • Scheme: <strong>{client.scheme}</strong> • Officer: <span>{client.assignedSalesPerson}</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          className="admin-badge"
                          style={{
                            background: `${stageBadgeColors[tracker.currentStage] || "#4e7cff"}18`,
                            color: stageBadgeColors[tracker.currentStage] || "#4e7cff",
                            border: `1px solid ${stageBadgeColors[tracker.currentStage] || "#4e7cff"}33`,
                          }}
                        >
                          ● {tracker.currentStage}
                        </span>

                        <button
                          type="button"
                          className="admin-btn-primary"
                          style={{ padding: "6px 12px", fontSize: 12 }}
                          onClick={() => onOpenStatusUpdate(client)}
                        >
                          Update Status
                        </button>

                        <button
                          type="button"
                          className="admin-btn-secondary"
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
                    </div>

                    {/* Dynamic Scheme-Based Activity Stepper Bar */}
                    <ActivityTracker
                      scheme={client.scheme}
                      completedSteps={tracker.completedStages}
                      progress={tracker.progressPercent}
                      interactive={true}
                      size="normal"
                      onStepToggle={(stepName, nextSteps, newPercent) =>
                        onQuickStepToggle(client, stepName, nextSteps, newPercent)
                      }
                      onRequestRollback={(targetStage) =>
                        onRequestRollback ? onRequestRollback(client, targetStage) : null
                      }
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#64748b", paddingTop: 4, borderTop: "1px dashed rgba(154, 116, 233, 0.18)" }}>
                      <span>Last Milestone Audit: <strong>{client.lastUpdated}</strong></span>
                      <span>{tracker.completedStages.length} of {tracker.totalStages} points completed ({tracker.progressPercent}%)</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </section>
      </div>

      {/* Right Column: REAL-TIME TELEMETRY & Verification Widgets */}
      <aside className="owner-sidebar-widgets">
        {/* Pipeline Updates Checklist */}
        <section className="admin-panel-card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="admin-panel-header" style={{ marginBottom: 14 }}>
            <div>
              <span className="admin-kicker">PIPELINE PROGRESS</span>
              <h3 className="admin-panel-header-title" style={{ fontSize: 16 }}>
                Pipeline Updates
              </h3>
            </div>
            <span
              className="admin-badge"
              style={{
                background: "rgba(78, 124, 255, 0.12)",
                color: "#4e7cff",
              }}
            >
              Stage Tracker
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {branchClients.slice(0, 4).map((client) => {
              const tracker = getTrackerState(client);
              const currentStage = tracker.currentStage;
              const isCompleted = currentStage === "Final" || tracker.progressPercent === 100;

              return (
                <div
                  key={client.id}
                  className="admin-subcard"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 12px",
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 13, display: "block" }}>{client.name}</strong>
                    <span style={{ fontSize: 11.5, color: "#64748b" }}>
                      Stage: <strong>{currentStage}</strong>
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span
                      className="admin-badge"
                      style={{
                        fontSize: 10.5,
                        padding: "2px 7px",
                        background: isCompleted ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.14)",
                        color: isCompleted ? "#059669" : "#b45309",
                      }}
                    >
                      {isCompleted ? "Completed ✓" : "In Progress"}
                    </span>
                    <button
                      type="button"
                      className="admin-btn-secondary"
                      style={{ padding: "3px 8px", fontSize: 11 }}
                      onClick={() => onOpenStatusUpdate(client)}
                    >
                      Update
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Activity Stages Breakdown */}
        <section className="admin-panel-card" style={{ display: "flex", flexDirection: "column" }}>
          <div className="admin-panel-header" style={{ marginBottom: 14 }}>
            <div>
              <span className="admin-kicker">STAGE DISTRIBUTION</span>
              <h3 className="admin-panel-header-title" style={{ fontSize: 16 }}>
                Milestone Stage Distribution
              </h3>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ACTIVITY_STAGES.map((stage) => {
              const count = branchClients.filter((c) => getTrackerState(c).currentStage === stage.name).length;
              return (
                <div
                  key={stage.name}
                  className="admin-subcard"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: stage.badgeColor || "#10b981",
                        color: "#fff",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 10.5,
                        fontWeight: 800,
                      }}
                    >
                      {stage.step}
                    </span>
                    <strong>{stage.name}</strong> ({stage.percent}%)
                  </span>
                  <span
                    className="admin-badge"
                    style={{
                      fontWeight: 800,
                      background: "rgba(78, 124, 255, 0.1)",
                      color: "#4e7cff",
                    }}
                  >
                    {count} Clients
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Real-Time Milestone History / Stream Pulse */}
        <section className="admin-panel-card" style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
          <div className="admin-panel-header" style={{ marginBottom: 14 }}>
            <div>
              <span className="admin-kicker">REAL-TIME AUDIT</span>
              <h3 className="admin-panel-header-title" style={{ fontSize: 16 }}>
                Milestone Stream Pulse
              </h3>
            </div>
            <span
              className="admin-badge"
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              ● Live
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {branchClients
              .flatMap((c) => (c.history || []).map((h) => ({ ...h, clientName: c.name, appId: c.appId })))
              .slice(0, 4)
              .map((entry, idx) => (
                <div
                  key={idx}
                  className="admin-subcard"
                  style={{
                    padding: "10px 12px",
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, marginBottom: 2 }}>
                    <span>{entry.clientName}</span>
                    <span style={{ color: stageBadgeColors[entry.status] || "#10b981", fontSize: 11 }}>
                      {entry.status}
                    </span>
                  </div>
                  <p style={{ margin: "2px 0 4px", color: "#64748b", fontSize: 11.5, lineHeight: 1.4 }}>
                    {entry.notes}
                  </p>
                  <div style={{ fontSize: 10.5, color: "#94a3b8", display: "flex", justifyContent: "space-between" }}>
                    <span>{entry.date}</span>
                    <span>{entry.updatedBy}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      </aside>
    </section>
  );
}
