import React from "react";
import SimpleModal from "../../components/SimpleModal";
import ActivityTracker from "../../components/ActivityTracker";
import { getTrackerState, getProcessTypeLabel } from "../../utils/schemeTracker";

export default function OwnerClientInfoModal({
  selectedClient,
  onClose,
  onEditClient,
  onUpdateTracker,
}) {
  if (!selectedClient) return null;

  const remaining = Math.max(0, (selectedClient.totalPayment || 0) - (selectedClient.paymentReceived || 0));
  const clientScheme = selectedClient.scheme || selectedClient.serviceName || selectedClient.serviceType || "PMEGP";
  const tracker = getTrackerState({ scheme: clientScheme, completedSteps: selectedClient.completedSteps });
  const processLabel = tracker.processTypeLabel || getProcessTypeLabel(tracker.processType);

  const initials = selectedClient.name
    ? selectedClient.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CL";

  const handleStepToggle = (stepName, nextCompletedSteps, newPercent) => {
    if (onUpdateTracker) {
      onUpdateTracker(selectedClient.id, nextCompletedSteps, newPercent);
    }
  };

  return (
    <SimpleModal onClose={onClose}>
      <div className="owner-modal-profile">
        <div className="owner-modal-avatar">{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 className="owner-header-title">{selectedClient.name}</h2>
              <span className="owner-header-subtitle">
                {selectedClient.company} {selectedClient.appId ? `• ID: ${selectedClient.appId}` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="owner-status-pill completed">
                ● {tracker.currentStage}
              </span>
              <span className="owner-rep-pill">
                {tracker.progressPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Info Grid */}
      <div className="owner-modal-info-grid">
        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Selected Scheme</span>
          <span className="owner-modal-card-val" style={{ color: "#6366f1" }}>{clientScheme}</span>
        </div>
        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Process Type</span>
          <span className="owner-modal-card-val" style={{ color: "#3b82f6" }}>
            {processLabel} ({tracker.totalStages} Stages)
          </span>
        </div>

        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Contact Phone</span>
          <span className="owner-modal-card-val owner-phone-text">{selectedClient.phone}</span>
        </div>
        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Email Address</span>
          <span className="owner-modal-card-val">{selectedClient.email}</span>
        </div>

        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Service Start Date</span>
          <span className="owner-modal-card-val">{selectedClient.startDate || selectedClient.createdAt || selectedClient.serviceStart || '—'}</span>
        </div>
        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Total Commercial Payment</span>
          <span className="owner-modal-card-val">₹{Math.round((selectedClient.paymentReceived || 0) / 1.18).toLocaleString()}</span>
        </div>

        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Payment Received</span>
          <span className="owner-modal-card-val owner-revenue-text">
            ₹{(selectedClient.paymentReceived || 0).toLocaleString()}
          </span>
        </div>

        <div className="owner-modal-card">
          <span className="owner-modal-card-label">Payment Remaining</span>
          <span className="owner-modal-card-val" style={{ color: remaining > 0 ? '#f43f5e' : '#10b981' }}>
            {remaining > 0 ? `₹${remaining.toLocaleString()}` : 'Fully Paid ✓'}
          </span>
        </div>
      </div>

      {/* Dynamic Activity Status Stepper with interactive milestone updating */}
      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(99, 102, 241, 0.14)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <p className="owner-header-eyebrow" style={{ margin: 0 }}>Work Completion Pipeline</p>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
              {tracker.totalStages}-Point Sequential Activity Tracker ({clientScheme})
            </h4>
          </div>
          <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
            {onUpdateTracker ? '💡 Click point to update status' : ''}
          </span>
        </div>
        <ActivityTracker
          scheme={clientScheme}
          completedSteps={tracker.completedStages}
          progress={tracker.progressPercent}
          onStepToggle={handleStepToggle}
          interactive={Boolean(onUpdateTracker)}
        />
      </div>

      <div className="owner-modal-actions">
        {onEditClient && (
          <button
            className="owner-btn-secondary"
            onClick={() => {
              onEditClient(selectedClient);
              if (onClose) onClose();
            }}
          >
            Edit Client &amp; Tracker
          </button>
        )}
        <button className="owner-btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    </SimpleModal>
  );
}

