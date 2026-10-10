import React, { useState, useMemo, useEffect } from "react";
import Icon from "../../components/Icon";
import { services } from "./mockOwnerData";
import { getTrackerState } from "../../utils/schemeTracker";
import { apiFetch } from "../../services/apiClient";
import "./owner.css";

const PAGE_SIZE = 12;

export default function OwnerClientsPage({
  clients = [],
  onOpenClientInfo,
  onDeleteClient,
}) {
  const [activeTab, setActiveTab] = useState("active"); // "active" | "deleted"
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientsPage, setClientsPage] = useState(1);

  // Deleted Clients Archive State
  const [deletedClients, setDeletedClients] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [archiveSearchTerm, setArchiveSearchTerm] = useState("");
  const [archivePage, setArchivePage] = useState(1);
  const [actionMessage, setActionMessage] = useState("");

  const fetchDeletedClients = async () => {
    setDeletedLoading(true);
    try {
      const res = await apiFetch("/clients?deletedOnly=true");
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDeletedClients(json.data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch deleted clients:", err);
    } finally {
      setDeletedLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedClients();
    window.addEventListener("agni_clients_updated", fetchDeletedClients);
    return () => {
      window.removeEventListener("agni_clients_updated", fetchDeletedClients);
    };
  }, []);

  const handleRestoreClient = async (clientId, clientName) => {
    try {
      const res = await apiFetch(`/clients/${clientId}/restore`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setActionMessage(`✓ Client "${clientName || 'Account'}" successfully restored to Active Directory!`);
        setTimeout(() => setActionMessage(""), 4500);
        fetchDeletedClients();
        window.dispatchEvent(new Event("agni_clients_updated"));
      } else {
        alert(data.message || "Failed to restore client.");
      }
    } catch (err) {
      alert("Network error while restoring client.");
    }
  };

  // Compute Active KPI metrics
  const totalClients = clients.length;
  const { fullyPaidCount, activePipelineCount, totalPortfolioValue } = useMemo(() => {
    let paid = 0;
    let pipeline = 0;
    let totalVal = 0;
    for (let i = 0; i < clients.length; i++) {
      const c = clients[i];
      const received = c.paymentReceived || 0;
      const total = c.totalPayment || 0;
      if (received >= total && total > 0) {
        paid++;
      } else {
        pipeline++;
      }
      totalVal += (parseFloat(String(total).replace(/[^0-9.]/g, "")) || 0);
    }
    return { fullyPaidCount: paid, activePipelineCount: pipeline, totalPortfolioValue: totalVal };
  }, [clients]);

  // Filter active clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const nameMatch = (c.name || "").toLowerCase().includes(searchLower);
      const companyMatch = (c.company || c.companyName || "").toLowerCase().includes(searchLower);
      const emailMatch = (c.email || "").toLowerCase().includes(searchLower);
      const phoneMatch = (c.phone || "").toLowerCase().includes(searchLower);
      const schemeMatch = (c.serviceName || c.scheme || c.serviceType || "").toLowerCase().includes(searchLower);

      const searchOk = !searchLower || nameMatch || companyMatch || emailMatch || phoneMatch || schemeMatch;
      const serviceOk = !serviceFilter || c.serviceType === serviceFilter || c.serviceName === serviceFilter || c.scheme === serviceFilter;
      
      const isPaid = (c.paymentReceived || 0) >= (c.totalPayment || 0) && (c.totalPayment || 0) > 0;
      let statusOk = true;
      if (statusFilter === "Paid") statusOk = isPaid;
      if (statusFilter === "Pending") statusOk = !isPaid;

      return searchOk && serviceOk && statusOk;
    });
  }, [clients, searchTerm, serviceFilter, statusFilter]);

  const clientsTotalPages = Math.max(1, Math.ceil(filteredClients.length / PAGE_SIZE));
  const clientsPageItems = filteredClients.slice(
    (clientsPage - 1) * PAGE_SIZE,
    clientsPage * PAGE_SIZE
  );

  // Filter deleted clients
  const filteredDeletedClients = useMemo(() => {
    if (!archiveSearchTerm.trim()) return deletedClients;
    const q = archiveSearchTerm.toLowerCase().trim();
    return deletedClients.filter((c) => {
      const matchName = (c.name || "").toLowerCase().includes(q);
      const matchCompany = (c.companyName || c.company || "").toLowerCase().includes(q);
      const matchEmail = (c.email || "").toLowerCase().includes(q);
      const matchOrig = (c.originalSalesPerson?.fullName || "").toLowerCase().includes(q);
      const matchLast = (c.lastSalesPerson?.fullName || "").toLowerCase().includes(q);
      const matchReason = (c.deleteReason || "").toLowerCase().includes(q);
      return matchName || matchCompany || matchEmail || matchOrig || matchLast || matchReason;
    });
  }, [deletedClients, archiveSearchTerm]);

  const archiveTotalPages = Math.max(1, Math.ceil(filteredDeletedClients.length / PAGE_SIZE));
  const archivePageItems = filteredDeletedClients.slice(
    (archivePage - 1) * PAGE_SIZE,
    archivePage * PAGE_SIZE
  );

  const handleResetFilters = () => {
    setSearchTerm("");
    setServiceFilter("");
    setStatusFilter("");
    setClientsPage(1);
  };

  return (
    <section className="owner-page-view">
      {/* Header Banner */}
      <div className="owner-header-banner">
        <div className="owner-header-info">
          <p className="owner-header-eyebrow">Enterprise Client Portfolios</p>
          <h1 className="owner-header-title">Corporate Client Directory</h1>
        </div>
      </div>

      {actionMessage && (
        <div
          style={{
            margin: "0 0 16px",
            padding: "12px 18px",
            borderRadius: 10,
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
            fontWeight: 600,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="checkCircle" size={18} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Directory Tab Toggle: Active vs Deleted Clients */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 18,
          borderBottom: "1px solid rgba(0,0,0,0.08)",
          paddingBottom: 10,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.2s ease",
            background: activeTab === "active" ? "#6366f1" : "rgba(0,0,0,0.04)",
            color: activeTab === "active" ? "#fff" : "#64748b",
            boxShadow: activeTab === "active" ? "0 4px 12px rgba(99, 102, 241, 0.25)" : "none",
          }}
        >
          <Icon name="clients" size={16} />
          <span>Active Client Accounts ({clients.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("deleted");
            fetchDeletedClients();
          }}
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            transition: "all 0.2s ease",
            background: activeTab === "deleted" ? "#ef4444" : "rgba(0,0,0,0.04)",
            color: activeTab === "deleted" ? "#fff" : "#64748b",
            boxShadow: activeTab === "deleted" ? "0 4px 12px rgba(239, 68, 68, 0.25)" : "none",
          }}
        >
          <Icon name="trash" size={16} />
          <span>Deleted Clients Archive ({deletedClients.length})</span>
        </button>
      </div>

      {activeTab === "active" ? (
        <>
          {/* KPI Ribbon */}
          <div className="owner-kpi-ribbon">
            <div className="owner-kpi-tile blue">
              <div className="owner-kpi-tile-top">
                <span className="owner-kpi-tile-label">Total Accounts</span>
                <div className="owner-kpi-tile-icon blue">
                  <Icon name="clients" size={16} />
                </div>
              </div>
              <div>
                <strong className="owner-kpi-tile-value">{totalClients}</strong>
              </div>
            </div>

            <div className="owner-kpi-tile green">
              <div className="owner-kpi-tile-top">
                <span className="owner-kpi-tile-label">Fully Settled</span>
                <div className="owner-kpi-tile-icon green">
                  <Icon name="checkCircle" size={16} />
                </div>
              </div>
              <div>
                <strong className="owner-kpi-tile-value">{fullyPaidCount}</strong>
              </div>
            </div>

            <div className="owner-kpi-tile amber">
              <div className="owner-kpi-tile-top">
                <span className="owner-kpi-tile-label">In Pipeline</span>
                <div className="owner-kpi-tile-icon amber">
                  <Icon name="clock" size={16} />
                </div>
              </div>
              <div>
                <strong className="owner-kpi-tile-value">{activePipelineCount}</strong>
              </div>
            </div>

            <div className="owner-kpi-tile purple">
              <div className="owner-kpi-tile-top">
                <span className="owner-kpi-tile-label">Portfolio Value</span>
                <div className="owner-kpi-tile-icon purple">
                  <Icon name="revenue" size={16} />
                </div>
              </div>
              <div>
                <strong className="owner-kpi-tile-value">₹{totalPortfolioValue.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* Toolbar Filter Card */}
          <div className="analytics-card owner-toolbar-card">
            <div className="owner-toolbar-filters">
              <div className="owner-search-box">
                <span className="owner-search-icon">
                  <Icon name="search" size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Search by client, company, email, phone, scheme..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setClientsPage(1);
                  }}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="owner-search-clear-btn"
                    onClick={() => {
                      setSearchTerm("");
                      setClientsPage(1);
                    }}
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="owner-filter-control-group">
                <label className="owner-filter-inline-label" htmlFor="owner-client-scheme-filter">
                  <Icon name="document" size={13} />
                  <span>Scheme:</span>
                </label>
                <div className="owner-select-wrapper">
                  <select
                    id="owner-client-scheme-filter"
                    className="owner-filter-select"
                    value={serviceFilter}
                    onChange={(e) => {
                      setServiceFilter(e.target.value);
                      setClientsPage(1);
                    }}
                  >
                    <option value="">All Services</option>
                    {services.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <span className="owner-select-chevron">▾</span>
                </div>
              </div>

              <div className="owner-filter-control-group">
                <label className="owner-filter-inline-label" htmlFor="owner-client-payment-filter">
                  <Icon name="currency" size={13} />
                  <span>Payment:</span>
                </label>
                <div className="owner-select-wrapper">
                  <select
                    id="owner-client-payment-filter"
                    className="owner-filter-select"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setClientsPage(1);
                    }}
                  >
                    <option value="">All Payment States</option>
                    <option value="Paid">Fully Paid</option>
                    <option value="Pending">Payment Pending</option>
                  </select>
                  <span className="owner-select-chevron">▾</span>
                </div>
              </div>

              {(searchTerm || serviceFilter || statusFilter) && (
                <button
                  type="button"
                  className="owner-btn-reset-filters"
                  onClick={handleResetFilters}
                  title="Reset all active filters"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="owner-count-badge">
              <span className="owner-count-dot"></span>
              <span>Showing</span>
              <strong>{filteredClients.length}</strong>
              <span>of {clients.length} clients</span>
            </div>
          </div>

          {/* Active Clients Table Card */}
          <div className="analytics-card owner-table-card">
            <div className="owner-table-scroll">
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Client &amp; Company</th>
                    <th>Service Scheme</th>
                    <th>Activity Status</th>
                    <th>Milestone Progress</th>
                    <th>Payment State</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clientsPageItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="owner-empty-state">
                        No clients found matching the selected filter criteria.
                      </td>
                    </tr>
                  ) : (
                    clientsPageItems.map((client) => {
                      const clientScheme = client.serviceName || client.scheme || client.serviceType || "PMEGP";
                      const tracker = getTrackerState({
                        scheme: clientScheme,
                        completedSteps: client.completedSteps,
                      });

                      const initials = client.name
                        ? client.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        : "CL";

                      const remaining = Math.max(0, (client.totalPayment || 0) - (client.paymentReceived || 0));
                      const isPaid = (client.totalPayment || 0) > 0 && remaining === 0;
                      const hasTransfer = Array.isArray(client.transferLogs) && client.transferLogs.length > 0;

                      return (
                        <tr key={client.id}>
                          <td>
                            <div className="owner-member-avatar-cell">
                              <div className="owner-member-avatar">{initials}</div>
                              <div className="owner-member-details">
                                <strong className="owner-member-name">{client.name}</strong>
                                <span className="owner-member-branch">
                                  {client.company || client.companyName || "Individual Account"}
                                </span>
                                {hasTransfer && (
                                  <span
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      fontSize: 10.5,
                                      fontWeight: 700,
                                      color: "#3b82f6",
                                      background: "rgba(59, 130, 246, 0.12)",
                                      padding: "2px 6px",
                                      borderRadius: 4,
                                      marginTop: 3,
                                      width: "fit-content",
                                    }}
                                    title={`Transferred from ${client.transferLogs[0]?.fromSalesPerson?.fullName || client.originalSalesPerson?.fullName || 'Original Rep'} to ${client.transferLogs[0]?.toSalesPerson?.fullName || client.salesPerson || 'Current Rep'}`}
                                  >
                                    🔄 Transferred Client
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="owner-service-pill">
                              {client.serviceName || client.serviceType || "PMEGP"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                              <span className="owner-status-pill completed">
                                ● {client.applicationStatus || tracker.currentStage}
                              </span>
                              <div className="owner-scheme-dots">
                                {tracker.stages.map((st) => {
                                  const isDone = tracker.completedStages.includes(st.name);
                                  return (
                                    <span
                                      key={st.name}
                                      className="owner-scheme-dot"
                                      title={`${st.name} (${st.percent}%) - ${
                                        isDone ? "Completed" : "Pending"
                                      }`}
                                      style={{
                                        background: isDone ? "#10b981" : "rgba(99, 102, 241, 0.2)",
                                      }}
                                    />
                                  );
                                })}
                                <span style={{ fontSize: 11, color: "#64748b", marginLeft: 4 }}>
                                  {tracker.completedStages.length}/{tracker.totalStages} Points
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ minWidth: 150 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div className="owner-progress-bar-wrap">
                                <div
                                  className="owner-progress-bar-fill"
                                  style={{
                                    width: `${tracker.progressPercent}%`,
                                    background:
                                      tracker.progressPercent === 100
                                        ? "#10b981"
                                        : "linear-gradient(90deg, #6366f1 0%, #10b981 100%)",
                                  }}
                                />
                              </div>
                              <span
                                className="owner-progress-percent"
                                style={{
                                  color: tracker.progressPercent === 100 ? "#10b981" : "inherit",
                                }}
                              >
                                {tracker.progressPercent}%
                              </span>
                            </div>
                          </td>
                          <td>
                            {isPaid ? (
                              <span className="owner-status-pill completed">
                                ✓ Fully Paid
                              </span>
                            ) : remaining > 0 ? (
                              <span className="owner-status-pill pending">
                                Due ₹{remaining.toLocaleString()}
                              </span>
                            ) : (
                              <span className="owner-date-text">Pending</span>
                            )}
                          </td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <div className="owner-actions-cell">
                              <button
                                className="owner-view-btn"
                                type="button"
                                onClick={() => onOpenClientInfo(client)}
                              >
                                Info &amp; Tracker
                              </button>
                              <button
                                className="owner-btn-danger"
                                type="button"
                                onClick={() => onDeleteClient(client)}
                                title={`Delete ${client.name}`}
                              >
                                <Icon name="trash" size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ color: "#64748b", fontSize: 13 }}>
              Showing {filteredClients.length === 0 ? 0 : (clientsPage - 1) * PAGE_SIZE + 1} -{" "}
              {Math.min(clientsPage * PAGE_SIZE, filteredClients.length)} of{" "}
              {filteredClients.length}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className="owner-btn-secondary"
                disabled={clientsPage <= 1}
                onClick={() => setClientsPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span style={{ margin: "0 6px", fontSize: 13, fontWeight: 600 }}>
                Page {clientsPage} / {clientsTotalPages}
              </span>
              <button
                className="owner-btn-secondary"
                disabled={clientsPage >= clientsTotalPages}
                onClick={() => setClientsPage((p) => Math.min(clientsTotalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        /* DELETED CLIENTS ARCHIVE TAB */
        <div>
          <div className="analytics-card owner-toolbar-card">
            <div className="owner-toolbar-filters">
              <div className="owner-search-box">
                <span className="owner-search-icon">
                  <Icon name="search" size={15} />
                </span>
                <input
                  type="text"
                  placeholder="Search deleted clients by company, email, original creator, last holder, reason..."
                  value={archiveSearchTerm}
                  onChange={(e) => {
                    setArchiveSearchTerm(e.target.value);
                    setArchivePage(1);
                  }}
                />
                {archiveSearchTerm && (
                  <button
                    type="button"
                    className="owner-search-clear-btn"
                    onClick={() => {
                      setArchiveSearchTerm("");
                      setArchivePage(1);
                    }}
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {archiveSearchTerm && (
                <button
                  type="button"
                  className="owner-btn-reset-filters"
                  onClick={() => {
                    setArchiveSearchTerm("");
                    setArchivePage(1);
                  }}
                  title="Reset search"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="owner-count-badge">
              <span className="owner-count-dot"></span>
              <span>Preserved in Database:</span>
              <strong>{filteredDeletedClients.length}</strong>
              <span>deleted client(s)</span>
            </div>
          </div>

          <div className="analytics-card owner-table-card">
            <div className="owner-table-scroll">
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>Client &amp; Company</th>
                    <th>Service Scheme</th>
                    <th>CRM Created By (Originator)</th>
                    <th>Last Held By (Final Custodian)</th>
                    <th>Deleted On &amp; By</th>
                    <th>Reason for Deletion</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#64748b" }}>
                          <span>Loading deleted client accounts...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDeletedClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="owner-empty-state">
                        {archiveSearchTerm
                          ? "No deleted clients match your search criteria."
                          : "No client accounts currently in the deleted archive."}
                      </td>
                    </tr>
                  ) : (
                    archivePageItems.map((client) => {
                      const initials = (client.name || client.companyName || "CL")
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      const creatorName = client.originalSalesPerson?.fullName || client.salesPerson?.fullName || "Original Rep";
                      const lastRepName = client.lastSalesPerson?.fullName || client.salesPerson?.fullName || creatorName;
                      const deleterName = client.deletedByUser?.fullName || "Owner/Admin";
                      const delDateStr = client.deletedAt
                        ? new Date(client.deletedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—";

                      return (
                        <tr key={client.id}>
                          <td>
                            <div className="owner-member-avatar-cell">
                              <div
                                className="owner-member-avatar"
                                style={{
                                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3))",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                }}
                              >
                                {initials}
                              </div>
                              <div className="owner-member-details">
                                <strong
                                  className="owner-member-name"
                                  style={{ textDecoration: "line-through", opacity: 0.85 }}
                                >
                                  {client.companyName || client.name || "Client Account"}
                                </strong>
                                <span className="owner-member-branch">
                                  {client.contactPerson || client.email || "Corporate Contact"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="owner-service-pill" style={{ opacity: 0.85 }}>
                              {client.serviceName || client.serviceType || "PMEGP"}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                                👤 {creatorName}
                              </span>
                            </div>
                            <span style={{ fontSize: 11, color: "#64748b" }}>Registered CRM Record</span>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f766e" }}>
                                📌 {lastRepName}
                              </span>
                            </div>
                            <span style={{ fontSize: 11, color: "#64748b" }}>Held prior to deletion</span>
                          </td>
                          <td>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: "#334155" }}>
                              {delDateStr}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                              by {deleterName}
                            </div>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: 12,
                                color: "#475569",
                                background: "rgba(0,0,0,0.04)",
                                padding: "4px 8px",
                                borderRadius: 6,
                                display: "inline-block",
                                maxWidth: 220,
                              }}
                            >
                              {client.deleteReason || "Requested for offboarding"}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <button
                              type="button"
                              className="owner-btn-secondary"
                              style={{
                                padding: "6px 12px",
                                fontSize: 12,
                                fontWeight: 700,
                                borderColor: "rgba(16, 185, 129, 0.4)",
                                color: "#059669",
                                background: "rgba(16, 185, 129, 0.08)",
                              }}
                              onClick={() => handleRestoreClient(client.id, client.companyName || client.name)}
                            >
                              🔄 Restore Client
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deleted Archive Pagination */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 14,
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <div style={{ color: "#64748b", fontSize: 13 }}>
              Showing {filteredDeletedClients.length === 0 ? 0 : (archivePage - 1) * PAGE_SIZE + 1} -{" "}
              {Math.min(archivePage * PAGE_SIZE, filteredDeletedClients.length)} of{" "}
              {filteredDeletedClients.length}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                className="owner-btn-secondary"
                disabled={archivePage <= 1}
                onClick={() => setArchivePage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span style={{ margin: "0 6px", fontSize: 13, fontWeight: 600 }}>
                Page {archivePage} / {archiveTotalPages}
              </span>
              <button
                className="owner-btn-secondary"
                disabled={archivePage >= archiveTotalPages}
                onClick={() => setArchivePage((p) => Math.min(archiveTotalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
