import React, { useMemo } from "react";
import Icon from "./Icon";
import {
  getTrackerStages,
  getTrackerState,
  canCompleteStage,
  normalizeCompletedStages,
  getProcessTypeForScheme,
  getProcessTypeLabel,
} from "../utils/schemeTracker";
import { ACTIVITY_STAGES } from "../pages/Admin/mockAdminData";
import "./dashboard/ActivityStatusBar.css";

/**
 * Reusable ActivityTracker Component
 *
 * Supports two flexible modes:
 * 1. "stepper" (default): Scheme-driven sequential milestone stepper for single client/scheme.
 * 2. "breakdown" / "summary": Aggregate milestone pipeline breakdown for an array of clients.
 */
export default function ActivityTracker({
  mode = "stepper",
  // Stepper mode props:
  scheme = "PMEGP",
  completedSteps,
  progress,
  onStepToggle,
  onRequestRollback,
  interactive = false,
  showTrack = true,
  showMeter = true,
  size = "normal",
  stepDates = {},
  // Breakdown mode props:
  clients = [],
  stagesList = ACTIVITY_STAGES,
  title = "Activity Status Breakdown",
  eyebrow = "Milestone pipeline",
  tag = "Scheme-Driven",
  className = "",
}) {
  // If clients array is supplied or mode is 'breakdown', render the Pipeline Breakdown Widget
  if (mode === "breakdown" || (clients && clients.length > 0 && !completedSteps && !progress)) {
    return (
      <section className={`activity-panel ${className}`} style={{ marginBottom: 18 }}>
        <div className="panel-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2>{title}</h2>
          </div>
          {tag && <span className="owner-status-pill completed">{tag}</span>}
        </div>
        <div className="owner-milestone-panel">
          {stagesList.map((st) => {
            const clientsInStage = clients.filter((c) => {
              const clientScheme = c.serviceName || c.scheme || c.serviceType || "PMEGP";
              const tracker = getTrackerState({ scheme: clientScheme, completedSteps: c.completedSteps });
              return tracker.completedStages.includes(st.name);
            }).length;
            const percentOfClients = Math.round((clientsInStage / Math.max(1, clients.length)) * 100);

            return (
              <div key={st.name} className="owner-milestone-stage-row">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="owner-milestone-stage-dot" style={{ background: st.badgeColor || "#10b981" }} />
                  <span className="owner-milestone-stage-name">{st.name}</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>({st.percent}%)</span>
                </div>
                <span className="owner-milestone-stage-count">
                  {clientsInStage} Clients ({percentOfClients}%)
                </span>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  // Otherwise, render the sequential milestone stepper
  const stages = useMemo(() => getTrackerStages(scheme), [scheme]);
  const totalStages = stages.length;

  const currentCompleted = useMemo(() => {
    let rawSteps = [];
    if (Array.isArray(completedSteps)) {
      rawSteps = completedSteps;
    } else if (typeof progress === "number" && totalStages > 0) {
      const count = Math.round((progress / 100) * totalStages);
      rawSteps = stages.slice(0, count).map((s) => s.name);
    }
    return normalizeCompletedStages(rawSteps, stages);
  }, [completedSteps, progress, stages, totalStages]);

  const trackerState = useMemo(() => {
    return getTrackerState({ scheme, completedSteps: currentCompleted });
  }, [scheme, currentCompleted]);

  const calculatedPercent = trackerState.progressPercent;
  const processType = getProcessTypeForScheme(scheme);
  const processLabel = getProcessTypeLabel(processType);

  const handlePointClick = (stage, idx) => {
    if (!interactive) return;

    // Stage 1 (CRM Creation) is always mandatory and locked completed
    if (stage.name === "CRM Creation" || idx === 0) {
      return;
    }

    // Attempting to deselect/uncheck an already completed stage -> requires Branch Manager approval
    if (currentCompleted.includes(stage.name)) {
      if (onRequestRollback) {
        onRequestRollback(stage.name);
      }
      return;
    }

    // Moving FORWARD: Checking an uncompleted stage
    if (!onStepToggle) return;
    if (!canCompleteStage(stage.name, stages, currentCompleted)) {
      return;
    }

    const nextCompleted = stages.slice(0, idx + 1).map((s) => s.name);
    const normalized = normalizeCompletedStages(nextCompleted, stages);
    const updatedTracker = getTrackerState({ scheme, completedSteps: normalized });
    onStepToggle(stage.name, updatedTracker.completedStages, updatedTracker.progressPercent);
  };


  return (
    <div className={`activity-status-wrapper size-${size} ${className}`}>
      {showTrack && (
        <div className="activity-status-header-bar">
          <div className="activity-status-header-left">
            <span className="activity-status-kicker">
              ACTIVITY MILESTONE TRACKER ({processLabel})
            </span>
            <span className="activity-status-count-badge">
              <strong>{currentCompleted.length}</strong> of {totalStages} Points Completed
            </span>
          </div>
          {showMeter && (
            <div className="activity-status-header-right">
              <div className="activity-status-meter-wrap">
                <div
                  className="activity-status-meter-bar"
                >
                  <div
                    className="activity-status-meter-fill"
                    style={{ width: `${calculatedPercent}%` }}
                  />
                </div>
                <strong className="activity-status-percent-pill">
                  {calculatedPercent}%
                </strong>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stepper Container */}
      <div
        className={`activity-status-points-container ${interactive ? "is-interactive" : ""}`}
        style={{
          gridTemplateColumns: `repeat(${totalStages}, minmax(0, 1fr))`,
          "--stage-count": totalStages,
        }}
      >
        {stages.map((stage, idx) => {
          const isDone = currentCompleted.includes(stage.name);
          const isCurrentActive = stage.name === trackerState.currentStage;
          const isClickable = interactive && (isDone || canCompleteStage(stage.name, stages, currentCompleted));
          const dateStr = stepDates[stage.name] || (isDone ? "Completed" : isCurrentActive ? "In Progress" : "Locked");

          return (
            <div
              key={stage.name}
              className={`activity-point-item ${
                isDone
                  ? "is-done"
                  : isCurrentActive
                  ? "is-active"
                  : "is-pending is-locked"
              } ${isClickable ? "is-clickable" : "not-clickable"}`}
              onClick={() => handlePointClick(stage, idx)}
              title={
                interactive
                  ? idx === 0
                    ? "CRM Creation is mandatory and completed by default"
                    : isDone
                    ? `Click to request rollback approval from Branch Manager for ${stage.name}`
                    : isClickable
                    ? `Click to mark completed: ${stage.name}`
                    : `Locked: Complete prior steps first`
                  : undefined
              }
              role={interactive && isClickable ? "button" : undefined}
              tabIndex={interactive && isClickable ? 0 : undefined}
            >
              {/* Circle Node */}
              <div className="activity-point-node">
                {isDone ? (
                  <div className="activity-node-check">
                    <Icon name="check" size={size === "compact" ? 14 : 20} />
                  </div>
                ) : isCurrentActive ? (
                  <div className="activity-node-number">{idx + 1}</div>
                ) : (
                  <div className="activity-node-locked">🔒</div>
                )}
                {interactive && isClickable && (
                  <span className="activity-node-toggle-indicator" title="Toggle point">
                    {isDone ? "✕" : "✓"}
                  </span>
                )}
              </div>

              {/* Step Labels */}
              <div className="activity-point-info">
                <span className="activity-point-name">{stage.name}</span>
                <span
                  className={`activity-point-status ${
                    isDone
                      ? "status-done"
                      : isCurrentActive
                      ? "status-active"
                      : "status-pending status-locked"
                  }`}
                >
                  {dateStr}
                </span>
                <span className="activity-point-pct-tag">
                  {Math.round(((idx + 1) / totalStages) * 100)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
