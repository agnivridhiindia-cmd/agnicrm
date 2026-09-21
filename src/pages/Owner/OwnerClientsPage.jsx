import React, { useState, useMemo } from "react";
import Icon from "../../components/Icon";
import { services } from "./mockOwnerData";
import { getTrackerState } from "../../utils/schemeTracker";
import "./owner.css";

const PAGE_SIZE = 12;

export default function OwnerClientsPage({
  clients = [],
  onOpenClientInfo,
  onDeleteClient,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientsPage, setClientsPage] = useState(1);

  // Compute KPI metrics
  const totalClients = clients.length;
  const fullyPaidCount = clients.filter(
    (c) => (c.paymentReceived || 0) >= (c.totalPayment || 0) && (c.totalPayment || 0) > 0
  ).length;
  const activePipelineCount = clients.filter(
    (c) => (c.paymentReceived || 0) < (c.totalPayment || 0)
  ).length;
  const totalPortfolioValue = clients.reduce(
    (sum, c) => sum + (parseFloat(String(c.totalPayment || 0).replace(/[^0-9.]/g, "")) || 0),
    0
  );

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const nameMatch = (c.name || "").toLowerCase().includes(searchLower);
      const companyMatch = (c.company || "").toLowerCase().includes(searchLower);
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
          <p className="owner-header-subtitle">
            Comprehensive directory of enterprise client accounts, multi-point scheme pipelines, commercial agreements, and milestone tracking.
          </p>
        </div>
      </div>

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
            <span className="owner-kpi-tile-sub">Active Corporate Portfolios</span>
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
            <strong className="owner-kpi-tile-value" style={{ color: "#10b981" }}>
              {fullyPaidCount}
            </strong>
            <span className="owner-kpi-tile-sub">100% Commercial Realization</span>
          </div>
        </div>

        <div className="owner-kpi-tile amber">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Pipeline Active</span>
            <div className="owner-kpi-tile-icon amber">
              <Icon name="overview" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value" style={{ color: "#f59e0b" }}>
              {activePipelineCount}
            </strong>
            <span className="owner-kpi-tile-sub">In Execution Pipeline</span>
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
            <span className="owner-kpi-tile-sub">Total Contracted Mandates</span>
          </div>
        </div>
      </div>

      {/* Toolbar Filter Card */}
      <div className="analytics-card owner-toolbar-card">
        <div className="owner-toolbar-filters">
          <div className="owner-search-box">
            <span className="owner-search-icon">
              <Icon name="search" size={14} />
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
          </div>

          <label className="field-label" style={{ margin: 0 }}>
            <span>Service Scheme:</span>
            <select
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
          </label>

          <label className="field-label" style={{ margin: 0 }}>
            <span>Payment Status:</span>
            <select
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
          </label>

          {(searchTerm || serviceFilter || statusFilter) && (
            <button
              type="button"
              className="owner-btn-secondary"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="owner-count-badge">
          <span>Showing</span>
          <strong>{filteredClients.length}</strong>
          <span>of {clients.length} clients</span>
        </div>
      </div>

      {/* Clients Table Card */}
      <div className="analytics-card owner-table-card">
        <div className="owner-table-scroll">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Client &amp; Company</th>
                <th>Contact Information</th>
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
                  <td colSpan={7} className="owner-empty-state">
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

                  return (
                    <tr key={client.id}>
                      <td>
                        <div className="owner-member-avatar-cell">
                          <div className="owner-member-avatar">{initials}</div>
                          <div className="owner-member-details">
                            <strong className="owner-member-name">{client.name}</strong>
                            <span className="owner-member-branch">
                              {client.company || "Individual Account"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{client.email}</div>
                          <div className="owner-phone-text">{client.phone}</div>
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
                      <td style={{ minWidth: 140 }}>
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
                          >
                            Delete
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

      {/* Pagination */}
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
    </section>
  );
}
