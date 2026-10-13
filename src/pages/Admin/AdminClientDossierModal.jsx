import React, { useState, useEffect } from "react";
import Icon from "../../components/Icon";
import ActivityTracker from "../../components/ActivityTracker";
import { stageBadgeColors, formatCurrency } from "./mockAdminData";
import { getTrackerState, getProcessTypeForScheme, getProcessTypeLabel, getClientAllSchemeTrackers, isClientPrimaryScheme, getSchemeCompletedStages } from "../../utils/schemeTracker";
import { downloadClientDossierPDF, downloadClientStatementPDF } from "../../utils/exportHelpers";
import { apiFetch } from "../../services/apiClient";
import "./AdminDashboard.css";

export default function AdminClientDossierModal({
  selectedClientForDossier,
  onClose,
  onOpenStatusUpdate,
}) {
  const [liveClient, setLiveClient] = useState(selectedClientForDossier);

  useEffect(() => {
    setLiveClient(selectedClientForDossier);
    if (!selectedClientForDossier) return;
    const lookupKey = selectedClientForDossier.id || selectedClientForDossier.appId || selectedClientForDossier.email;
    if (!lookupKey) return;
    let isMounted = true;
    apiFetch(`/clients/${encodeURIComponent(lookupKey)}`)
      .then((r) => r.json())
      .then((res) => {
        if (isMounted && res.success && res.data) {
          setLiveClient((prev) => ({
            ...prev,
            ...res.data,
            company: res.data.companyName || prev?.company,
            documents: (Array.isArray(res.data.documents) && res.data.documents.length > 0)
              ? res.data.documents
              : (prev?.documents || []),
          }));
        }
      })
      .catch((err) => console.warn("Failed to fetch fresh dossier data:", err));
    return () => {
      isMounted = false;
    };
  }, [selectedClientForDossier]);

  if (!selectedClientForDossier) return null;
  const clientData = liveClient || selectedClientForDossier;

  const targetScheme = clientData.particularScheme || clientData.schemeName || clientData.scheme || clientData.serviceName || "PMEGP";
  const isPrimary = clientData.isPrimary === false || clientData.processType === "secondary" ? false : isClientPrimaryScheme(clientData, targetScheme);
  const defaultSteps = isPrimary
    ? (clientData.completedSteps || clientData.completedStages || ["CRM Creation"])
    : ["CRM Creation", "Agreement", "Reports"];
  const completedSteps = getSchemeCompletedStages(clientData, targetScheme, defaultSteps);
  const tracker = getTrackerState({ scheme: targetScheme }, completedSteps, !isPrimary);
  const schemeName = tracker.schemeName || targetScheme;
  const processType = tracker.processType || (isPrimary ? getProcessTypeForScheme(schemeName) : "secondary");
  const processLabel = tracker.processTypeLabel || (isPrimary ? getProcessTypeLabel(processType) : "Secondary Scheme");

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px 16px",
        animation: "fadeIn 0.2s ease-out",
      }}
      onClick={onClose}
    >
      <div
        className="admin-panel-card hide-scrollbar"
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "92vh",
          overflowY: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          padding: 0,
          borderRadius: 22,
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4), 0 0 32px rgba(154, 116, 233, 0.12)",
          border: "1px solid rgba(154, 116, 233, 0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "22px 26px 18px",
            borderBottom: "1px solid rgba(154, 116, 233, 0.15)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span
                className="admin-badge"
                style={{
                  background: "linear-gradient(135deg, #9a74e9 0%, #7c3aed 100%)",
                  color: "#ffffff",
                  fontSize: 11,
                  padding: "3px 10px",
                }}
              >
                CLIENT DOSSIER
              </span>
              <span
                className="admin-badge"
                style={{
                  background: "rgba(78, 124, 255, 0.12)",
                  color: "#4e7cff",
                  fontWeight: 750,
                  fontSize: 11,
                }}
              >
                ID: {clientData.appId}
              </span>
              <span
                className="admin-badge"
                style={{
                  background: `${stageBadgeColors[tracker.currentStage] || "#10b981"}18`,
                  color: stageBadgeColors[tracker.currentStage] || "#10b981",
                  border: `1px solid ${stageBadgeColors[tracker.currentStage] || "#10b981"}33`,
                  fontSize: 11,
                }}
              >
                ● {tracker.currentStage}
              </span>
            </div>
            <h3 style={{ margin: "2px 0 4px", fontSize: 20, fontWeight: 800, color: "inherit", letterSpacing: -0.3 }}>
              {clientData.name}
            </h3>
            <p className="admin-desc" style={{ fontSize: 13 }}>
              {clientData.company || clientData.companyName} • Registered: {clientData.submissionDate || "2026-08-18"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(241, 245, 249, 0.6)",
              border: "1px solid rgba(154, 116, 233, 0.15)",
              borderRadius: "50%",
              width: 34,
              height: 34,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "#64748b",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(241, 245, 249, 0.6)";
              e.currentTarget.style.color = "#64748b";
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "22px 26px 26px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Key Details Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#9a74e9" }}>Assigned Scheme</span>
              <strong style={{ display: "block", fontSize: 13.5, color: "inherit" }}>{schemeName}</strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>{processLabel}</small>
            </div>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#10b981" }}>Total Commercial</span>
              <strong style={{ display: "block", fontSize: 14, color: "#10b981" }}>
                {formatCurrency(clientData.totalPayment)}
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>Agreed Deal Value</small>
            </div>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#4e7cff" }}>Progress Level</span>
              <strong style={{ display: "block", fontSize: 14, color: "#4e7cff" }}>
                {tracker.progressPercent}% ({tracker.completedStages.length}/{tracker.totalStages})
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>Points Completed</small>
            </div>
            <div className="admin-subcard" style={{ padding: "10px 14px" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5 }}>Assigned Officer</span>
              <strong style={{ display: "block", fontSize: 13.5, color: "inherit" }}>
                {clientData.assignedSalesPerson || clientData.salesPerson?.fullName || clientData.salesRepresentative || "Branch Sales"}
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>Branch Representative</small>
            </div>
            <div className="admin-subcard" style={{ padding: "10px 14px", gridColumn: "span 2" }}>
              <span className="admin-kicker" style={{ fontSize: 10.5, color: "#8c5ff8" }}>Registered Office Address</span>
              <strong style={{ display: "block", fontSize: 13, color: "inherit", fontWeight: 600 }}>
                {clientData.address || `${clientData.branchName || clientData.branch || "Regional Branch"} Commercial Office`}
              </strong>
              <small style={{ color: "#64748b", fontSize: 11 }}>Corporate Identity &amp; Physical Premises</small>
            </div>
          </div>

          {/* Multi-Scheme Stepper Bar */}
          <div className="admin-subcard" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <span className="admin-kicker" style={{ fontSize: 11, margin: 0 }}>
                Active Service Pipeline ({schemeName})
              </span>
              <button
                type="button"
                className="admin-action-btn"
                onClick={() => {
                  onClose();
                  if (onOpenStatusUpdate) {
                    onOpenStatusUpdate(clientData, schemeName);
                  }
                }}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #4e7cff 0%, #3b66e8 100%)",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Edit {schemeName} Pipeline ✏️
              </button>
            </div>

            <ActivityTracker
              scheme={schemeName}
              completedSteps={tracker.completedStages}
              progress={tracker.progressPercent}
              interactive={false}
              size="normal"
              showTrack={false}
            />
          </div>

          {/* Verified Documents */}
          <div>
            <span className="admin-kicker" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
              Compliance &amp; Verified Documents
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {((Array.isArray(clientData.documents) && clientData.documents.length > 0)
                ? clientData.documents
                : [
                    { name: "PAN Card", number: clientData.panNumber || "On File", status: "Verified" },
                    { name: "GSTIN Certificate", number: clientData.gstNumber || "Optional / Exempt", status: clientData.gstNumber ? "Verified" : "Exempt" },
                    { name: "MSME Certificate", number: clientData.msmeNumber || "On File", status: "Verified" },
                    { name: "Aadhar Card", number: clientData.aadharNumber || "On File", status: "Verified" },
                  ]
              ).map((doc, idx) => {
                const docName = doc.documentName || doc.name || `Document #${idx + 1}`;
                const docNumber = doc.documentNumber || doc.number || "On File";
                const rawStatus = String(doc.verificationStatus || doc.status || "Verified").toUpperCase();
                const isVerified = rawStatus.includes("VERIF");
                const isSubmitted = rawStatus.includes("SUBMIT");
                const displayStatus = isVerified ? "Verified" : (isSubmitted ? "Submitted" : (doc.verificationStatus || doc.status || "Pending"));
                return (
                  <div
                    key={doc.id || docName || idx}
                    className="admin-subcard"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 12px",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 12.5 }}>{docName}</strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>Ref: {docNumber}</div>
                    </div>
                    <span
                      className="admin-badge"
                      style={{
                        fontSize: 10.5,
                        padding: "2px 7px",
                        background: isVerified
                          ? "rgba(16, 185, 129, 0.12)"
                          : isSubmitted
                          ? "rgba(78, 124, 255, 0.12)"
                          : "rgba(245, 158, 11, 0.12)",
                        color: isVerified ? "#10b981" : isSubmitted ? "#4e7cff" : "#f59e0b",
                      }}
                    >
                      {displayStatus}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status History Timeline */}
          <div>
            <span className="admin-kicker" style={{ fontSize: 11, display: "block", marginBottom: 8 }}>
              Application Milestone Timeline &amp; History
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(clientData.history || []).map((h, i) => (
                <div
                  key={i}
                  className="admin-subcard"
                  style={{
                    padding: "10px 12px",
                    fontSize: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
                    <span style={{ color: stageBadgeColors[h.status] || "#10b981" }}>{h.status}</span>
                    <span style={{ color: "#94a3b8", fontSize: 11 }}>{h.date}</span>
                  </div>
                  <p style={{ margin: "2px 0 2px", color: "#64748b", fontSize: 11.5 }}>{h.notes}</p>
                  <small style={{ color: "#94a3b8", fontSize: 10.5 }}>By {h.updatedBy}</small>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              paddingTop: 10,
              borderTop: "1px solid rgba(154, 116, 233, 0.15)",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button
                className="admin-btn-secondary"
                type="button"
                style={{ padding: "8px 14px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                title="Download printable executive A4 dossier PDF"
                onClick={() => downloadClientDossierPDF(clientData)}
              >
                <span>📄</span>
                <span>Download Dossier (PDF)</span>
              </button>
              <button
                className="admin-btn-secondary"
                type="button"
                style={{ padding: "8px 14px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}
                title="Download financial account statement and ledger PDF"
                onClick={() => downloadClientStatementPDF(clientData)}
              >
                <span>📊</span>
                <span>Statement (PDF)</span>
              </button>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button className="admin-btn-secondary" type="button" onClick={onClose} style={{ padding: "10px 20px" }}>
                Close Dossier
              </button>
              {onOpenStatusUpdate && (
                <button
                  className="admin-btn-primary"
                  type="button"
                  style={{ padding: "10px 24px" }}
                  onClick={() => {
                    onOpenStatusUpdate(clientData);
                  }}
                >
                  <Icon name="check" size={16} />
                  <span>Update Status</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
