import React, { useState, useMemo } from "react";
import Icon from "../../components/Icon";
import ITClientInfoModal from "./ITClientInfoModal";
import "./ITDashboard.css";

export default function ITClientDetailsPage({
  createdClients = [],
  salesPitchedClients = [],
  onNavigateToCreateClient,
}) {
  const [selectedBranch, setSelectedBranch] = useState("East");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedClientForModal, setSelectedClientForModal] = useState(null);

  // Combine direct IT created clients + sales pitched IT clients
  const allITClients = useMemo(() => {
    const created = createdClients.map((c) => ({
      ...c,
      origin: "IT Direct Created",
    }));

    const pitched = salesPitchedClients.map((c) => ({
      ...c,
      origin: "Sales Pitched",
    }));

    return [...created, ...pitched];
  }, [createdClients, salesPitchedClients]);

  const filteredClients = useMemo(() => {
    return allITClients.filter((client) => {
      if (selectedBranch !== "ALL" && client.branch !== selectedBranch) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (client.name || "").toLowerCase().includes(q);
        const matchesCompany = (client.company || "").toLowerCase().includes(q);
        const matchesContact = (client.contactPerson || "").toLowerCase().includes(q);
        const matchesEmail = (client.email || "").toLowerCase().includes(q);
        const matchesPhone = (client.phone || "").toLowerCase().includes(q);
        const matchesSalesPerson = (client.salesPerson || "").toLowerCase().includes(q);
        const matchesService = (client.serviceName || "").toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesCompany &&
          !matchesContact &&
          !matchesEmail &&
          !matchesPhone &&
          !matchesSalesPerson &&
          !matchesService
        ) {
          return false;
        }
      }

      if (stageFilter !== "all" && client.stage !== stageFilter) {
        return false;
      }

      const pending = Number(client.paymentPending || 0);
      const received = Number(client.paymentReceived || 0);
      if (paymentFilter === "paid" && (pending > 0 || received === 0)) return false;
      if (paymentFilter === "partial" && (pending === 0 || received === 0)) return false;
      if (paymentFilter === "pending" && received > 0) return false;

      return true;
    });
  }, [allITClients, selectedBranch, searchQuery, stageFilter, paymentFilter]);

  const totalClientsCount = filteredClients.length;
  const branchPitchedCount = filteredClients.filter((c) => c.origin === "Sales Pitched").length;
  const itCreatedCount = filteredClients.filter((c) => c.origin === "IT Direct Created").length;
  const totalRevenue = filteredClients.reduce(
    (acc, c) => acc + Number(c.totalPayment || c.amount || 0),
    0
  );

  return (
    <div className="it-page-container it-details-page">
      {/* Glass Header Banner */}
      <div className="it-header-banner">
        <div>
          <span className="it-kicker">CENTRALIZED IT CLIENT DIRECTORY</span>
          <h2 className="it-title">Client &amp; Service Details</h2>
          <p className="it-desc">
            Unified register of all IT-created clients and branch clients pitched by sales representatives for IT services.
          </p>
        </div>

        <button
          type="button"
          className="it-btn-primary"
          onClick={onNavigateToCreateClient}
        >
          <Icon name="plus" size={16} />
          <span>Create New Client</span>
        </button>
      </div>

      {/* High-Aesthetic KPI Stat Cards */}
      <div className="it-kpi-grid">
        <div className="it-stat-card blue">
          <div className="it-stat-top">
            <span className="it-stat-label">Total Displayed Clients</span>
            <div className="it-stat-icon-wrap">
              <Icon name="clients" size={18} />
            </div>
          </div>
          <div className="it-stat-value">{totalClientsCount}</div>
          <div className="it-stat-pill">
            <span>●</span>
            <span>{selectedBranch === "ALL" ? "All Branches" : `${selectedBranch} Branch Active`}</span>
          </div>
        </div>

        <div className="it-stat-card green">
          <div className="it-stat-top">
            <span className="it-stat-label">Sales Pitched (IT)</span>
            <div className="it-stat-icon-wrap">
              <Icon name="reports" size={18} />
            </div>
          </div>
          <div className="it-stat-value">{branchPitchedCount}</div>
          <div className="it-stat-pill">
            <span>●</span>
            <span>From Branch Sales</span>
          </div>
        </div>

        <div className="it-stat-card purple">
          <div className="it-stat-top">
            <span className="it-stat-label">Direct IT Created</span>
            <div className="it-stat-icon-wrap">
              <Icon name="plus" size={18} />
            </div>
          </div>
          <div className="it-stat-value">{itCreatedCount}</div>
          <div className="it-stat-pill">
            <span>●</span>
            <span>IT Module Direct</span>
          </div>
        </div>

        <div className="it-stat-card amber">
          <div className="it-stat-top">
            <span className="it-stat-label">IT Pipeline Revenue</span>
            <div className="it-stat-icon-wrap">
              <Icon name="revenue" size={18} />
            </div>
          </div>
          <div className="it-stat-value">₹{totalRevenue.toLocaleString("en-IN")}</div>
          <div className="it-stat-pill">
            <span>●</span>
            <span>Total Invoiced / Deals</span>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="it-filter-bar">
        {/* Branch Filter Tabs */}
        <div className="it-branch-tabs">
          <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginRight: 4 }}>
            Branch:
          </span>
          {["East", "West", "South", "North", "ALL"].map((branch) => {
            const isSelected = selectedBranch === branch;
            return (
              <button
                key={branch}
                type="button"
                className={`it-branch-tab ${isSelected ? "active" : ""}`}
                onClick={() => setSelectedBranch(branch)}
              >
                {branch === "ALL" ? "All Branches" : `${branch} Branch`}
              </button>
            );
          })}
        </div>

        {/* Search Field */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexGrow: 1, maxWidth: 340 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              type="text"
              className="it-form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, client, sales rep..."
              style={{ paddingRight: 32 }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 8,
                  top: 9,
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            className="it-form-select"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{ width: "auto" }}
          >
            <option value="all">All Stages</option>
            <option value="Active">Active</option>
            <option value="In Progress">In Progress</option>
            <option value="Agreement">Agreement</option>
          </select>

          <select
            className="it-form-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={{ width: "auto" }}
          >
            <option value="all">All Payments</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="it-table-wrap">
        <div style={{ overflowX: "auto" }}>
          <table className="it-table" style={{ minWidth: 960 }}>
            <thead>
              <tr>
                <th>Client &amp; Company</th>
                <th>Branch</th>
                <th>Pitched By / Creator</th>
                <th>IT Service Request</th>
                <th>Deal Amount</th>
                <th>Payment Status</th>
                <th>SLA / Stage</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 48, textAlign: "center", color: "#64748b" }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
                    <strong style={{ fontSize: 16, display: "block" }}>
                      No IT clients found for the selected branch &amp; filters.
                    </strong>
                    <span style={{ fontSize: 13, marginTop: 4, display: "block" }}>
                      Try adjusting the search query, clearing filters, or create a new client.
                    </span>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const pending = Number(client.paymentPending || 0);
                  const received = Number(client.paymentReceived || 0);
                  const isPaid = pending <= 0 && received > 0;
                  const isPartial = pending > 0 && received > 0;

                  return (
                    <tr key={client.id}>
                      {/* Client Name & Origin */}
                      <td>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          {client.company || client.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                          {client.contactPerson || client.name} • {client.email}
                        </div>
                        <span
                          className="it-badge"
                          style={{
                            marginTop: 4,
                            background:
                              client.origin === "IT Direct Created"
                                ? "rgba(154, 116, 233, 0.15)"
                                : "rgba(78, 124, 255, 0.15)",
                            color: client.origin === "IT Direct Created" ? "#9a74e9" : "#4e7cff",
                          }}
                        >
                          {client.origin}
                        </span>
                      </td>

                      {/* Branch */}
                      <td>
                        <span
                          className="it-badge"
                          style={{
                            background:
                              client.branch === "East"
                                ? "rgba(78, 124, 255, 0.15)"
                                : client.branch === "West"
                                ? "rgba(245, 158, 11, 0.15)"
                                : client.branch === "South"
                                ? "rgba(16, 185, 129, 0.15)"
                                : "rgba(154, 116, 233, 0.15)",
                            color:
                              client.branch === "East"
                                ? "#4e7cff"
                                : client.branch === "West"
                                ? "#f59e0b"
                                : client.branch === "South"
                                ? "#10b981"
                                : "#9a74e9",
                          }}
                        >
                          {client.branch} Branch
                        </span>
                      </td>

                      {/* Pitched By */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {client.salesPerson || "Mia Rose"}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {client.origin === "Sales Pitched" ? "Salesperson Pitch" : "IT Direct"}
                        </div>
                      </td>

                      {/* IT Service Name */}
                      <td style={{ maxWidth: 240 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>
                          {client.serviceName || "Enterprise IT Service"}
                        </div>
                        <div style={{ fontSize: 11, color: "#4e7cff", fontWeight: 700 }}>
                          Service Request: IT
                        </div>
                      </td>

                      {/* Deal Amount */}
                      <td>
                        <strong style={{ fontSize: 14 }}>
                          ₹{Number(client.totalPayment || client.amount || 0).toLocaleString("en-IN")}
                        </strong>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {client.paymentMode || "Online"} (incl. GST)
                        </div>
                      </td>

                      {/* Payment Status */}
                      <td>
                        <span
                          className="it-badge"
                          style={{
                            background: isPaid
                              ? "rgba(16, 185, 129, 0.15)"
                              : isPartial
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                            color: isPaid ? "#10b981" : isPartial ? "#f59e0b" : "#ef4444",
                          }}
                        >
                          {isPaid ? "✓ Paid" : isPartial ? "Partial" : "Pending"}
                        </span>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          Rec: ₹{received.toLocaleString("en-IN")}
                        </div>
                      </td>

                      {/* SLA & Stage */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12.5 }}>
                          {client.stage || "Active"}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>
                          {client.slaTier || "Standard"}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="it-btn-secondary"
                          onClick={() => setSelectedClientForModal(client)}
                          style={{ padding: "6px 12px", fontSize: 12 }}
                        >
                          View Details
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

      {/* Client Dossier Modal */}
      {selectedClientForModal && (
        <ITClientInfoModal
          client={selectedClientForModal}
          onClose={() => setSelectedClientForModal(null)}
        />
      )}
    </div>
  );
}
