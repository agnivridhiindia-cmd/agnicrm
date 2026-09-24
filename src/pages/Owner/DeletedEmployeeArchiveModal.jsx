import React, { useState } from "react";
import Icon from "../../components/Icon";

export default function DeletedEmployeeArchiveModal({
  archiveRecord,
  onClose,
  onRestore,
  dark,
}) {
  const [activeTab, setActiveTab] = useState("clients"); // 'clients' | 'schemes' | 'overview'

  if (!archiveRecord) return null;

  const clients = Array.isArray(archiveRecord.clientsData) ? archiveRecord.clientsData : [];
  const schemes = Array.isArray(archiveRecord.schemesData) ? archiveRecord.schemesData : [];
  const services = Array.isArray(archiveRecord.servicesData) ? archiveRecord.servicesData : [];

  const formattedDate = archiveRecord.deletedAt
    ? new Date(archiveRecord.deletedAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

  return (
    <div className="cem-backdrop" style={{ zIndex: 1200 }}>
      <div
        className={`cem-modal ${dark ? "cem-dark" : ""}`}
        style={{ maxWidth: 860, maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Modal Header */}
        <div className="cem-header" style={{ paddingBottom: 16 }}>
          <div
            className="cem-header-icon"
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.25))",
              color: "#ef4444",
            }}
          >
            <Icon name="trash" size={20} />
          </div>
          <div className="cem-header-text">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 className="cem-title" style={{ fontSize: 18 }}>
                Archived: {archiveRecord.fullName}
              </h2>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 6,
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                }}
              >
                Soft-Deleted
              </span>
            </div>
            <p className="cem-subtitle">
              {archiveRecord.role} • {archiveRecord.branchName || archiveRecord.region || "All Branches"} • Deleted on {formattedDate} by {archiveRecord.deletedBy || "Owner"}
            </p>
          </div>
          <button
            type="button"
            className="cem-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" size={15} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ overflowY: "auto", padding: "0 26px 20px", flex: 1 }}>
          {/* KPI Ribbon */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              margin: "14px 0 18px",
            }}
          >
            <div
              style={{
                background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Registered Clients
              </span>
              <div style={{ fontSize: 22, fontWeight: 800, color: dark ? "#f8fafc" : "#0f172a", marginTop: 4 }}>
                {archiveRecord.totalClients || clients.length}
              </div>
            </div>

            <div
              style={{
                background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Preserved Schemes
              </span>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#6366f1", marginTop: 4 }}>
                {archiveRecord.totalSchemes || schemes.length}
              </div>
            </div>

            <div
              style={{
                background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Pitched Amount
              </span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#059669", marginTop: 6 }}>
                ₹{Number(archiveRecord.totalPitchedAmount || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div
              style={{
                background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                border: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Payment Received
              </span>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#10b981", marginTop: 6 }}>
                ₹{Number(archiveRecord.totalReceivedAmount || 0).toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Contact & Meta Bar */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 16,
              padding: "10px 14px",
              background: dark ? "rgba(99, 102, 241, 0.08)" : "rgba(99, 102, 241, 0.05)",
              border: dark ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid rgba(99, 102, 241, 0.15)",
              borderRadius: 10,
              fontSize: 12.5,
              color: dark ? "#cbd5e1" : "#475569",
              marginBottom: 16,
            }}
          >
            <div>
              <strong>Email:</strong> {archiveRecord.email}
            </div>
            <div>
              <strong>Phone:</strong> {archiveRecord.phone || "N/A"}
            </div>
            {archiveRecord.reportingManager && (
              <div>
                <strong>Reported to:</strong> {archiveRecord.reportingManager}
              </div>
            )}
            {archiveRecord.reason && (
              <div>
                <strong>Reason:</strong> {archiveRecord.reason}
              </div>
            )}
          </div>

          {/* Sub-tabs Navigation */}
          <div
            style={{
              display: "flex",
              gap: 8,
              borderBottom: dark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
              paddingBottom: 10,
              marginBottom: 14,
            }}
          >
            <button
              type="button"
              className="cem-tab-btn"
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: activeTab === "clients" ? "#6366f1" : "transparent",
                color: activeTab === "clients" ? "#fff" : dark ? "#94a3b8" : "#64748b",
              }}
              onClick={() => setActiveTab("clients")}
            >
              Registered Clients ({clients.length})
            </button>
            <button
              type="button"
              className="cem-tab-btn"
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: activeTab === "schemes" ? "#6366f1" : "transparent",
                color: activeTab === "schemes" ? "#fff" : dark ? "#94a3b8" : "#64748b",
              }}
              onClick={() => setActiveTab("schemes")}
            >
              Registered Schemes ({schemes.length})
            </button>
            <button
              type="button"
              className="cem-tab-btn"
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12.5,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                background: activeTab === "services" ? "#6366f1" : "transparent",
                color: activeTab === "services" ? "#fff" : dark ? "#94a3b8" : "#64748b",
              }}
              onClick={() => setActiveTab("services")}
            >
              Registered Services ({services.length})
            </button>
          </div>

          {/* TAB 1: Clients */}
          {activeTab === "clients" && (
            <div>
              {clients.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8", fontSize: 13 }}>
                  No clients were directly assigned to this employee at the time of deletion.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="owner-table" style={{ width: "100%", fontSize: 12.5 }}>
                    <thead>
                      <tr>
                        <th>Client / Company</th>
                        <th>Service / Scheme</th>
                        <th>Contact</th>
                        <th>Stage</th>
                        <th style={{ textAlign: "right" }}>Total Fee</th>
                        <th style={{ textAlign: "right" }}>Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c, idx) => (
                        <tr key={c.id || idx}>
                          <td>
                            <strong>{c.name || c.clientName}</strong>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{c.companyName || c.businessName || "—"}</div>
                          </td>
                          <td>
                            <span className="owner-service-pill">
                              {c.serviceName || c.scheme || c.serviceType || "Standard"}
                            </span>
                          </td>
                          <td>
                            <div>{c.email || "—"}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{c.phone || "—"}</div>
                          </td>
                          <td>
                            <span className="owner-status-badge">{c.stage || c.applicationStatus || "Active"}</span>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>
                            ₹{Number(c.totalPayment || 0).toLocaleString("en-IN")}
                          </td>
                          <td style={{ textAlign: "right", color: "#10b981", fontWeight: 700 }}>
                            ₹{Number(c.paymentReceived || 0).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Schemes */}
          {activeTab === "schemes" && (
            <div>
              {schemes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 10px", color: "#94a3b8", fontSize: 13 }}>
                  No active schemes were linked to this employee's accounts at deletion.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="owner-table" style={{ width: "100%", fontSize: 12.5 }}>
                    <thead>
                      <tr>
                        <th>Scheme Code</th>
                        <th>Scheme Name</th>
                        <th>Service Type</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Pitched Fee</th>
                        <th style={{ textAlign: "right" }}>Received</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schemes.map((s, idx) => (
                        <tr key={s.id || idx}>
                          <td>
                            <code style={{ fontSize: 11, background: "rgba(99, 102, 241, 0.1)", padding: "2px 6px", borderRadius: 4, color: "#6366f1" }}>
                              {s.schemeCode || `SCH-${idx + 1}`}
                            </code>
                          </td>
                          <td>
                            <strong>{s.serviceName || "Scheme"}</strong>
                          </td>
                          <td>{s.serviceType || "Consultancy"}</td>
                          <td>
                            <span className="owner-status-badge">{s.applicationStatus || s.stage || "Active"}</span>
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>
                            ₹{Number(s.pitchedAmount || 0).toLocaleString("en-IN")}
                          </td>
                          <td style={{ textAlign: "right", color: "#10b981", fontWeight: 700 }}>
                            ₹{Number(s.receivedAmount || 0).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Services */}
          {activeTab === "services" && (
            <div style={{ padding: "10px 0" }}>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                All distinct services and consultancy portfolios registered or managed under this employee:
              </p>
              {services.length === 0 ? (
                <div style={{ color: "#94a3b8", fontSize: 13 }}>No distinct services cataloged.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {services.map((srv, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: dark ? "rgba(99, 102, 241, 0.18)" : "rgba(99, 102, 241, 0.1)",
                        color: dark ? "#a5b4fc" : "#4338ca",
                        border: "1px solid rgba(99, 102, 241, 0.25)",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      ✓ {srv}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="cem-footer" style={{ borderTop: dark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #e2e8f0", padding: "14px 26px" }}>
          {onRestore && (
            <button
              type="button"
              className="cem-btn"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                color: "#fff",
                marginRight: "auto",
              }}
              onClick={() => onRestore(archiveRecord.originalUserId || archiveRecord.id)}
            >
              <Icon name="checkCircle" size={14} />
              Restore Employee
            </button>
          )}
          <button type="button" className="cem-btn cem-btn-secondary" onClick={onClose}>
            Close Archive
          </button>
        </div>
      </div>
    </div>
  );
}
