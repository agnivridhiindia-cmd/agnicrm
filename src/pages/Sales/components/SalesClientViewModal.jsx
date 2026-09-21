import React, { useState } from "react";
import Icon from "../../../components/Icon";
import ActivityTracker from "../../../components/ActivityTracker";
import { getTrackerState, getProcessTypeLabel } from "../../../utils/schemeTracker";

export default function SalesClientViewModal({
  client,
  onClose,
  onOpenFullDossier,
  salesPersonName,
  dark,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [copied, setCopied] = useState(false);

  if (!client) return null;

  const tracker = getTrackerState(client);
  const schemeName = client.scheme || tracker.schemeName || "Enterprise Growth Scheme";
  const processLabel = tracker.processTypeLabel || getProcessTypeLabel(tracker.processType);

  const total = parseFloat(client.totalPayment) || 0;
  const received = parseFloat(client.paymentReceived) || 0;
  const pending = parseFloat(client.paymentPending) || 0;
  const pct = total > 0 ? Math.min(Math.round((received / total) * 100), 100) : 0;
  const isPaid = pending === 0 && received > 0;
  const isPartial = pending > 0 && received > 0;

  const initials = client.name
    ? client.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CL";

  function handleCopySummary() {
    const text = `Client: ${client.name}\nCompany: ${client.company || "Individual"}\nEmail: ${client.email}\nPhone: ${client.phone}\nScheme: ${schemeName}\nTotal Value: ₹${total.toLocaleString("en-IN")}\nStatus: ${client.stage || "Active"}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="sales-view-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="sales-view-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="sales-vm-header">
          <div className="sales-vm-header-left">
            <div className="sales-vm-avatar">
              <span>{initials}</span>
              <span className={`sales-vm-avatar-dot ${client.stage === "Active" ? "online" : "idle"}`} />
            </div>
            <div className="sales-vm-header-details">
              <div className="sales-vm-title-row">
                <h2 className="sales-vm-client-name">{client.name}</h2>
                <span className="sales-vm-id-badge">#{client.id}</span>
                <span
                  className={`sales-vm-stage-pill ${
                    client.stage === "Active"
                      ? "active"
                      : client.stage === "Onboarding"
                      ? "onboarding"
                      : client.stage === "Renewal"
                      ? "renewal"
                      : "prospect"
                  }`}
                >
                  <span className="sales-vm-stage-dot" />
                  {client.stage || "Active"}
                </span>
              </div>
              <p className="sales-vm-company-sub">
                <Icon name="clients" size={14} />
                <span>{client.company || "Individual Account"}</span>
                <span className="sales-vm-dot-sep">•</span>
                <span className="sales-vm-owner-tag">
                  Rep: <strong>{client.owner || salesPersonName}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="sales-vm-header-right">
            <div className="sales-vm-value-box">
              <span className="sales-vm-value-label">Commercial Value</span>
              <strong className="sales-vm-value-amount">
                ₹{total.toLocaleString("en-IN")}
              </strong>
              <span className={`sales-vm-payment-status ${isPaid ? "paid" : isPartial ? "partial" : "pending"}`}>
                {isPaid ? "✓ Fully Paid" : isPartial ? `₹${pending.toLocaleString("en-IN")} Pending` : "Payment Unpaid"}
              </span>
            </div>
            <button
              type="button"
              className="sales-vm-close-btn"
              onClick={onClose}
              aria-label="Close client view"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="sales-vm-tabs-bar">
          <button
            type="button"
            className={`sales-vm-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <Icon name="user" size={14} />
            <span>Profile & Contact</span>
          </button>
          <button
            type="button"
            className={`sales-vm-tab ${activeTab === "financials" ? "active" : ""}`}
            onClick={() => setActiveTab("financials")}
          >
            <Icon name="wallet" size={14} />
            <span>Financials & GST</span>
            <span className="sales-vm-tab-pill">{isPaid ? "Paid" : `${pct}%`}</span>
          </button>
          <button
            type="button"
            className={`sales-vm-tab ${activeTab === "milestones" ? "active" : ""}`}
            onClick={() => setActiveTab("milestones")}
          >
            <Icon name="overview" size={14} />
            <span>Scheme Tracker</span>
            <span className="sales-vm-tab-pill">{tracker.currentStage}</span>
          </button>
          <button
            type="button"
            className={`sales-vm-tab ${activeTab === "docs" ? "active" : ""}`}
            onClick={() => setActiveTab("docs")}
          >
            <Icon name="document" size={14} />
            <span>KYC & Compliance</span>
            <span className="sales-vm-tab-pill">{(client.documentDetails || []).length}</span>
          </button>
          <button
            type="button"
            className={`sales-vm-tab ${activeTab === "notes" ? "active" : ""}`}
            onClick={() => setActiveTab("notes")}
          >
            <Icon name="reports" size={14} />
            <span>Remarks</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="sales-vm-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="sales-vm-section-fade">
              <div className="sales-vm-grid-cards">
                <div className="sales-vm-info-tile">
                  <div className="sales-vm-info-icon purple">
                    <Icon name="user" size={16} />
                  </div>
                  <div className="sales-vm-info-content">
                    <label>Client Name</label>
                    <strong>{client.name}</strong>
                    <span>Authorized Account Representative</span>
                  </div>
                </div>

                <div className="sales-vm-info-tile">
                  <div className="sales-vm-info-icon blue">
                    <Icon name="clients" size={16} />
                  </div>
                  <div className="sales-vm-info-content">
                    <label>Company / Organization</label>
                    <strong>{client.company || "Individual Account"}</strong>
                    <span>Registered Business Entity</span>
                  </div>
                </div>

                <div className="sales-vm-info-tile">
                  <div className="sales-vm-info-icon green">
                    <Icon name="dashboard" size={16} />
                  </div>
                  <div className="sales-vm-info-content">
                    <label>Primary Email</label>
                    <strong>
                      <a href={`mailto:${client.email}`} className="sales-vm-link">
                        {client.email}
                      </a>
                    </strong>
                    <span>Click to send message</span>
                  </div>
                </div>

                <div className="sales-vm-info-tile">
                  <div className="sales-vm-info-icon amber">
                    <Icon name="search" size={16} />
                  </div>
                  <div className="sales-vm-info-content">
                    <label>Contact Phone</label>
                    <strong>
                      <a href={`tel:${client.phone}`} className="sales-vm-link mono">
                        {client.phone}
                      </a>
                    </strong>
                    <span>Verified Mobile Line</span>
                  </div>
                </div>

                <div className="sales-vm-info-tile span-2">
                  <div className="sales-vm-info-icon teal">
                    <Icon name="invoice" size={16} />
                  </div>
                  <div className="sales-vm-info-content">
                    <label>Registered Billing & Operations Address</label>
                    <strong>{client.address || "Not Provided"}</strong>
                    <span>Official Verified Premises</span>
                  </div>
                </div>
              </div>

              {/* Quick Scheme Strip */}
              <div className="sales-vm-highlight-strip">
                <div className="sales-vm-strip-left">
                  <span className="sales-vm-strip-eyebrow">Active Program</span>
                  <strong className="sales-vm-strip-title">{schemeName}</strong>
                  <span className="sales-vm-strip-sub">Process Type: {processLabel}</span>
                </div>
                <div className="sales-vm-strip-badge">
                  <span>Current Milestone</span>
                  <strong>{tracker.currentStage}</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCIALS */}
          {activeTab === "financials" && (
            <div className="sales-vm-section-fade">
              <div className="sales-vm-metrics-row">
                <div className="sales-vm-metric-card">
                  <span className="sales-vm-mc-label">Base Contract Rate</span>
                  <strong className="sales-vm-mc-val">
                    ₹{(parseFloat(client.amount) || 0).toLocaleString("en-IN")}
                  </strong>
                  <span className="sales-vm-mc-sub">Excluding applicable taxes</span>
                </div>

                <div className="sales-vm-metric-card">
                  <span className="sales-vm-mc-label">Payment Mode</span>
                  <strong className="sales-vm-mc-val" style={{ color: "#8c5ff8" }}>
                    {client.paymentMode || "Online"}
                  </strong>
                  <span className="sales-vm-mc-sub">
                    {client.paymentMode === "Online" ? "18% GST Applied" : "Tax Exempt / Direct"}
                  </span>
                </div>

                <div className="sales-vm-metric-card">
                  <span className="sales-vm-mc-label">GST Component (18%)</span>
                  <strong className="sales-vm-mc-val">
                    ₹{(parseFloat(client.gstAmount) || 0).toLocaleString("en-IN")}
                  </strong>
                  <span className="sales-vm-mc-sub">Statutory tax amount</span>
                </div>

                <div className="sales-vm-metric-card highlight">
                  <span className="sales-vm-mc-label">Gross Value</span>
                  <strong className="sales-vm-mc-val gradient">
                    ₹{total.toLocaleString("en-IN")}
                  </strong>
                  <span className="sales-vm-mc-sub">Total Contract Payable</span>
                </div>
              </div>

              {/* Settlement Progress Bar Card */}
              <div className="sales-vm-settlement-card">
                <div className="sales-vm-settlement-head">
                  <div>
                    <span className="sales-vm-settlement-title">Settlement Status</span>
                    <p className="sales-vm-settlement-desc">
                      Real-time payment clearance and remaining ledger balance
                    </p>
                  </div>
                  <div className="sales-vm-settlement-stats">
                    <span className="sales-vm-collected-tag">
                      ✓ Received: <strong>₹{received.toLocaleString("en-IN")}</strong>
                    </span>
                    <span className="sales-vm-pending-tag">
                      Pending: <strong>₹{pending.toLocaleString("en-IN")}</strong>
                    </span>
                  </div>
                </div>

                <div className="sales-vm-bar-track">
                  <div
                    className={`sales-vm-bar-fill ${isPaid ? "paid" : isPartial ? "partial" : "pending"}`}
                    style={{ width: `${isPaid ? 100 : pct}%` }}
                  />
                </div>

                <div className="sales-vm-settlement-foot">
                  <span>Progress: <strong>{isPaid ? 100 : pct}% Cleared</strong></span>
                  <span>Balance Due: <strong>₹{pending.toLocaleString("en-IN")}</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MILESTONES */}
          {activeTab === "milestones" && (
            <div className="sales-vm-section-fade">
              <div className="sales-vm-scheme-header-card">
                <div className="sales-vm-scheme-icon-box">
                  <Icon name="overview" size={24} />
                </div>
                <div className="sales-vm-scheme-info">
                  <span className="sales-vm-scheme-eyebrow">Scheme Pipeline</span>
                  <h3 className="sales-vm-scheme-title">{schemeName}</h3>
                  <div className="sales-vm-scheme-badges">
                    <span className="sales-vm-badge-flow">Flow: {processLabel}</span>
                    <span className="sales-vm-badge-stages">{tracker.totalStages} Standard Stages</span>
                    <span className="sales-vm-badge-cur">Active: {tracker.currentStage}</span>
                  </div>
                </div>
              </div>

              <div className="sales-vm-tracker-wrapper">
                <ActivityTracker
                  scheme={schemeName}
                  completedSteps={tracker.completedStages}
                  progress={tracker.progressPercent}
                  interactive={false}
                />
              </div>
            </div>
          )}

          {/* TAB 4: KYC & COMPLIANCE */}
          {activeTab === "docs" && (
            <div className="sales-vm-section-fade">
              <div className="sales-vm-docs-grid">
                {(client.documentDetails || []).map((doc) => {
                  const isVerified = doc.available === "Yes";
                  return (
                    <div key={doc.label} className={`sales-vm-doc-card ${isVerified ? "verified" : "pending"}`}>
                      <div className="sales-vm-doc-top">
                        <div className="sales-vm-doc-label-group">
                          <span className="sales-vm-doc-icon">
                            <Icon name={isVerified ? "document" : "search"} size={14} />
                          </span>
                          <strong className="sales-vm-doc-label">{doc.label}</strong>
                        </div>
                        <span className={`sales-vm-doc-status ${isVerified ? "verified" : "pending"}`}>
                          {isVerified ? "✓ Verified" : "⏳ Pending"}
                        </span>
                      </div>
                      <div className="sales-vm-doc-value-box">
                        <span className="sales-vm-doc-val mono">{doc.value}</span>
                        <button
                          type="button"
                          className="sales-vm-doc-copy"
                          onClick={() => {
                            navigator.clipboard?.writeText(doc.value);
                          }}
                          title="Copy Document ID"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: REMARKS & NOTES */}
          {activeTab === "notes" && (
            <div className="sales-vm-section-fade">
              <div className="sales-vm-notes-card">
                <div className="sales-vm-notes-header">
                  <div className="sales-vm-notes-avatar">
                    <Icon name="roles" size={16} />
                  </div>
                  <div>
                    <strong>Executive Client Dossier Notes</strong>
                    <span className="sales-vm-notes-date">Logged by {client.owner || salesPersonName}</span>
                  </div>
                </div>
                <div className="sales-vm-notes-content">
                  <p>
                    {client.notes ||
                      "Client documents are verified and under active management. The recommended schemes are aligned with their operational objectives."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sales-vm-footer">
          <div className="sales-vm-footer-left">
            <button
              type="button"
              className="sales-vm-btn-ghost"
              onClick={handleCopySummary}
            >
              <Icon name="document" size={14} />
              <span>{copied ? "✓ Copied Summary!" : "Copy Summary"}</span>
            </button>
          </div>

          <div className="sales-vm-footer-right">
            <button
              type="button"
              className="sales-vm-btn-secondary"
              onClick={onClose}
            >
              Close View
            </button>
            {onOpenFullDossier && (
              <button
                type="button"
                className="sales-vm-btn-primary"
                onClick={() => {
                  onClose();
                  onOpenFullDossier(client);
                }}
              >
                <span>Open Full Dossier</span>
                <span style={{ fontSize: 14 }}>→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
