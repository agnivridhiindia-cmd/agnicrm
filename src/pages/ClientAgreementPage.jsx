import React, { useState, useEffect, useMemo, useCallback } from "react";
import { agreementService, AGREEMENT_STATUSES, TEMPLATE_TYPES, normalizeAgreementData } from "../services/agreementService";
import { getCanonicalSchemeName } from "../utils/schemeTracker";
import { useAuth } from "../context/AuthContext";
import "./Admin/AdminDashboard.css";

export default function ClientAgreementPage({ userEmail, clientInfo = {}, dbProfile = null }) {
  const { userEmail: authEmail } = useAuth();
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [actionMsg, setActionMsg] = useState("");

  const targetEmail = (userEmail || authEmail || "").toLowerCase().trim();
  const companyName = (clientInfo?.companyName || dbProfile?.companyName || "Your Enterprise").trim();

  const loadClientAgreements = useCallback(async () => {
    try {
      const all = await agreementService.getAgreements();
      const normalizedList = (all || []).map(normalizeAgreementData).filter(Boolean);
      setAgreements(normalizedList);
    } catch (err) {
      console.warn("Could not load client agreements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClientAgreements();

    const handleUpdate = () => loadClientAgreements();
    window.addEventListener("storage", handleUpdate);
    window.addEventListener("agni_agreements_updated", handleUpdate);

    return () => {
      window.removeEventListener("storage", handleUpdate);
      window.removeEventListener("agni_agreements_updated", handleUpdate);
    };
  }, [loadClientAgreements]);

  // Filter agreements strictly sent/dispatched to this specific client
  const clientAgreements = useMemo(() => {
    if (!agreements || agreements.length === 0) return [];

    return agreements.filter((agr) => {
      if (!agr) return false;

      // Ensure agreement status is Sent or Ready for Review (dispatched by Admin)
      const isSentOrReady =
        agr.status === AGREEMENT_STATUSES.SENT ||
        agr.status === AGREEMENT_STATUSES.READY ||
        (agr.status || "").toLowerCase().includes("sent") ||
        (agr.status || "").toLowerCase().includes("ready") ||
        (agr.status || "").toLowerCase().includes("dispatched") ||
        Boolean(agr.sentAt);

      if (!isSentOrReady) return false;

      // 1. Email Match
      const cEmail = (agr.email || agr.client?.email || agr.sentTo || "").toLowerCase().trim();
      if (targetEmail && cEmail && (targetEmail === cEmail || targetEmail.includes(cEmail) || cEmail.includes(targetEmail))) {
        return true;
      }

      // 2. Company / Client Name Match
      const cComp = (agr.companyName || agr.client?.companyName || agr.client?.clientName || agr.clientName || "").toLowerCase().trim();
      const myComp = companyName.toLowerCase().trim();
      if (myComp && cComp && myComp !== "your enterprise" && (myComp.includes(cComp) || cComp.includes(myComp))) {
        return true;
      }

      // 3. Application / Registration ID Match
      const myAppId = (clientInfo?.registrationNumber || dbProfile?.appId || "").toLowerCase().trim();
      const agrAppId = (agr.applicationId || agr.appId || "").toLowerCase().trim();
      if (myAppId && agrAppId && (myAppId === agrAppId || myAppId.includes(agrAppId))) {
        return true;
      }

      return false;
    });
  }, [agreements, targetEmail, companyName, clientInfo, dbProfile]);

  // Show notification feedback
  const triggerFeedback = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(""), 4000);
  };

  // Handle PDF download
  const handleDownloadPdf = async (agr) => {
    try {
      setDownloadingId(agr.id);
      const clientComp = agr.client?.companyName || agr.companyName || companyName;
      const res = await agreementService.downloadAgreementPdf(
        agr.id,
        `${clientComp} Agreement.pdf`
      );
      if (res.success) {
        triggerFeedback(`✓ Opening official PDF contract document (${res.filename})`);
      } else {
        triggerFeedback(`⚠️ Could not generate PDF: ${res.message}`);
      }
    } catch (err) {
      triggerFeedback(`⚠️ PDF Download failed: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const sentCount = clientAgreements.filter((a) => a.status === AGREEMENT_STATUSES.SENT || a.sentAt).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 40 }}>
      {/* ── Action Feedback Toast ── */}
      {actionMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "#ffffff",
            padding: "12px 20px",
            borderRadius: 10,
            fontSize: 13.5,
            fontWeight: 700,
            boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <span>{actionMsg}</span>
        </div>
      )}

      {/* ── Frosted Glass Header Banner ── */}
      <div className="admin-header-banner">
        <div>
          <span className="admin-kicker">LEGAL &amp; COMMERCIAL CONTRACTS</span>
          <h2 className="admin-title">Representation Agreements</h2>
          <p className="admin-desc">
            Official statutory scheme representation contracts dispatched by Agni CRM Admin. Download your official contracts directly.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            className="admin-badge"
            style={{
              background: "rgba(16, 185, 129, 0.15)",
              color: "#10b981",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              fontSize: 12,
              padding: "6px 14px",
              fontWeight: 800,
            }}
          >
            ● {sentCount} Active Contract{sentCount !== 1 ? "s" : ""} Available
          </span>
        </div>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
        <div className="admin-subcard" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="admin-kicker" style={{ fontSize: 11, color: "#4e7cff" }}>Dispatched Contracts</span>
            <strong style={{ display: "block", fontSize: 22, color: "#4e7cff", margin: "2px 0 0" }}>
              {clientAgreements.length}
            </strong>
            <small style={{ color: "#64748b", fontSize: 11.5 }}>Issued for {companyName}</small>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(78, 124, 255, 0.12)",
              color: "#4e7cff",
              display: "grid",
              placeItems: "center",
              fontSize: 20,
            }}
          >
            📜
          </div>
        </div>

        <div className="admin-subcard" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="admin-kicker" style={{ fontSize: 11, color: "#10b981" }}>Contract Status</span>
            <strong style={{ display: "block", fontSize: 22, color: "#10b981", margin: "2px 0 0" }}>
              {sentCount > 0 ? "Sent & Active" : "Pending Dispatch"}
            </strong>
            <small style={{ color: "#64748b", fontSize: 11.5 }}>Verified by Agni Admin</small>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(16, 185, 129, 0.12)",
              color: "#10b981",
              display: "grid",
              placeItems: "center",
              fontSize: 20,
            }}
          >
            ✅
          </div>
        </div>

        <div className="admin-subcard" style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="admin-kicker" style={{ fontSize: 11, color: "#9a74e9" }}>Instant Download</span>
            <strong style={{ display: "block", fontSize: 22, color: "#9a74e9", margin: "2px 0 0" }}>
              DOCX / PDF
            </strong>
            <small style={{ color: "#64748b", fontSize: 11.5 }}>Original Contract Files</small>
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(154, 116, 233, 0.12)",
              color: "#9a74e9",
              display: "grid",
              placeItems: "center",
              fontSize: 20,
            }}
          >
            📥
          </div>
        </div>
      </div>

      {/* ── Agreements Roster / Grid ── */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b", fontSize: 14 }}>
          Loading legal agreements...
        </div>
      ) : clientAgreements.length === 0 ? (
        <div className="admin-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>📁</div>
          <h3 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700 }}>No Dispatched Agreements Yet</h3>
          <p style={{ color: "#64748b", fontSize: 13.5, maxWidth: 460, margin: "0 auto 16px" }}>
            Once the Agni CRM Admin team generates and dispatches your representation agreement, it will appear here for instant download.
          </p>
          <span
            className="admin-badge"
            style={{ background: "rgba(78, 124, 255, 0.12)", color: "#4e7cff", fontSize: 12, padding: "6px 16px" }}
          >
            Awaiting Admin Dispatch
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {clientAgreements.map((agr) => {
            const canonicalScheme = getCanonicalSchemeName(agr.scheme?.name || agr.serviceType || agr.scheme || "PM MUDRA");
            const isSent = agr.status === AGREEMENT_STATUSES.SENT || agr.sentAt;
            const isDownloading = downloadingId === agr.id;

            return (
              <div
                key={agr.id}
                className="admin-card"
                style={{
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  borderLeft: "4px solid #10b981",
                  background: "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)",
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span
                        className="admin-badge"
                        style={{
                          background: "rgba(16, 185, 129, 0.15)",
                          color: "#10b981",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                          fontWeight: 800,
                          fontSize: 11.5,
                        }}
                      >
                        ● {isSent ? "Sent to Client" : "Ready for Review"}
                      </span>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        ID: <code style={{ color: "#4e7cff", fontWeight: 700 }}>{agr.id}</code>
                      </span>
                      {agr.applicationId && (
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                          • App ID: <code style={{ color: "#9a74e9", fontWeight: 700 }}>{agr.applicationId}</code>
                        </span>
                      )}
                    </div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#0f172a" }}>
                      {canonicalScheme} Representation Agreement
                    </h3>
                    <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748b" }}>
                      Official representation &amp; statutory compliance agreement for {agr.client?.companyName || companyName}.
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="admin-action-btn"
                      disabled={isDownloading}
                      onClick={() => handleDownloadPdf(agr)}
                      style={{
                        padding: "10px 20px",
                        fontSize: 13,
                        borderRadius: 8,
                        fontWeight: 700,
                        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "#ffffff",
                        border: "none",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      {isDownloading ? "Generating PDF..." : "Download PDF"}
                    </button>
                  </div>
                </div>

                {/* Detailed Info Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 12,
                    background: "rgba(241, 245, 249, 0.6)",
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: "1px solid rgba(226, 232, 240, 0.8)",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Contract Date
                    </span>
                    <strong style={{ display: "block", fontSize: 13, color: "#1e293b", marginTop: 2 }}>
                      {agr.agreement?.date || agr.createdAt || "09/09/2026"}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                      Dispatched To Email
                    </span>
                    <strong style={{ display: "block", fontSize: 13, color: "#4e7cff", marginTop: 2 }}>
                      {agr.sentTo || agr.client?.email || targetEmail || "Client Email"}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
