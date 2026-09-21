import React, { useMemo } from "react";
import {
  TRACKER_STAGES_DEFINITIONS,
  TRACKER_STAGE_IDS,
  getTrackerState,
  getCanonicalSchemeName,
  isPaymentDemandOrSettlement,
} from "../../utils/schemeTracker";
import { stageBadgeColors } from "./mockAdminData";
import "./AdminDashboard.css";

const PIPELINE_STAGES = [
  TRACKER_STAGES_DEFINITIONS[TRACKER_STAGE_IDS.CRM_CREATION],
  TRACKER_STAGES_DEFINITIONS[TRACKER_STAGE_IDS.AGREEMENT],
  TRACKER_STAGES_DEFINITIONS[TRACKER_STAGE_IDS.REPORTS],
  TRACKER_STAGES_DEFINITIONS[TRACKER_STAGE_IDS.APPLICATION],
  TRACKER_STAGES_DEFINITIONS[TRACKER_STAGE_IDS.INTERVIEW],
  TRACKER_STAGES_DEFINITIONS[TRACKER_STAGE_IDS.FINAL],
];

export default function AdminPipelinePage({
  selectedBranch,
  branchClients = [],
  onOpenStatusUpdate,
}) {
  const validSchemeClients = useMemo(() => {
    return branchClients.filter((c) => {
      if (!c) return false;
      if (isPaymentDemandOrSettlement(c)) return false;
      const sName = c.scheme || c.serviceName || c.particularScheme;
      if (isPaymentDemandOrSettlement(sName)) return false;
      return true;
    });
  }, [branchClients]);

  return (
    <div className="admin-page-container">
      {/* Glass Header Banner */}
      <div className="admin-header-banner">
        <div>
          <span className="admin-kicker">WORKFLOW LIFECYCLE</span>
          <h2 className="admin-title">{selectedBranch} Milestone Pipeline</h2>
          <p className="admin-desc">
            Visual stage progression across all active scheme milestones and client verification pipelines.
          </p>
        </div>
      </div>

      {/* Pipeline Grid (Strictly 3 cards per row) */}
      <div className="admin-pipeline-grid-3">
        {PIPELINE_STAGES.map((stage, sIdx) => {
          const stageClients = validSchemeClients.filter((c) => {
            const tracker = getTrackerState(c);
            return tracker.currentStage === stage.name;
          });

          return (
            <div
              key={stage.id}
              className="admin-pipeline-column"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 10, borderBottom: "1px solid rgba(154, 116, 233, 0.15)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: stage.badgeColor || "#4e7cff",
                      color: "#fff",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 11.5,
                      fontWeight: 800,
                    }}
                  >
                    {sIdx + 1}
                  </span>
                  <div>
                    <strong style={{ fontSize: 14 }}>{stage.name}</strong>
                  </div>
                </div>
                <span
                  className="admin-badge"
                  style={{
                    background: "rgba(78, 124, 255, 0.12)",
                    color: "#4e7cff",
                    fontWeight: 700,
                  }}
                >
                  {stageClients.length}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {stageClients.map((client) => {
                  const tracker = getTrackerState(client);

                  return (
                    <div
                      key={client.id}
                      className="admin-subcard"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        padding: "12px 14px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <strong style={{ fontSize: 13.5 }}>{client.name}</strong>
                          <div style={{ fontSize: 11.5, color: "#64748b" }}>{client.company}</div>
                        </div>
                        <span style={{ fontSize: 11.5, color: "#10b981", fontWeight: 700 }}>
                          {tracker.progressPercent}%
                        </span>
                      </div>

                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        Scheme: <strong style={{ color: "inherit" }}>{getCanonicalSchemeName(client.particularScheme || client.schemeName || client.scheme || client.serviceName)}</strong>
                      </div>

                      <div style={{ height: 6, background: "rgba(154, 116, 233, 0.15)", borderRadius: 999, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${tracker.progressPercent}%`,
                            height: "100%",
                            background: tracker.progressPercent === 100 ? "#10b981" : "linear-gradient(90deg, #4e7cff 0%, #10b981 100%)",
                            borderRadius: 999,
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: "#64748b" }}>{client.assignedSalesPerson}</span>
                        {onOpenStatusUpdate && (
                          <button
                            type="button"
                            className="admin-btn-secondary"
                            style={{ padding: "4px 8px", fontSize: 11 }}
                            onClick={() => onOpenStatusUpdate(client)}
                          >
                            Update Status
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {stageClients.length === 0 && (
                  <div style={{ textAlign: "center", padding: "28px 8px", color: "#94a3b8", fontSize: 12.5 }}>
                    No clients in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
