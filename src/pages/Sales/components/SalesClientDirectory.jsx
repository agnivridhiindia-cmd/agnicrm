import React, { useState } from "react";
import Icon from "../../../components/Icon";
import SalesClientViewModal from "./SalesClientViewModal";
import { getTrackerState } from "../../../utils/schemeTracker";
import { exportClientsToCSV, downloadClientDossierPDF } from "../../../utils/exportHelpers";

export default function SalesClientDirectory({
  clients = [],
  filteredClients = [],
  clientSearch,
  setClientSearch,
  stageFilter,
  setStageFilter,
  paymentFilter,
  setPaymentFilter,
  pipelineFilter = "all",
  setPipelineFilter,
  onSelectClient,
  onCreateNewClient,
  salesPersonName,
  dark,
}) {
  const [viewingClient, setViewingClient] = useState(null);

  return (
    <div className="sales-clients-view">
      {/* Header Banner */}
      <div className="sales-header-banner">
        <div className="sales-header-info">
          <p className="sales-header-eyebrow">Client Dossier</p>
          <h1 className="sales-header-title">Sales Client Directory</h1>
          <p className="sales-header-subtitle">
            Click <strong>View</strong> on any client record to explore their full profile, commercials, and documentation.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            type="button"
            className="sales-btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontWeight: 700 }}
            title="Download client directory as spreadsheet"
            onClick={() => exportClientsToCSV(filteredClients, "My_Sales_Clients")}
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="sales-add-btn"
            onClick={onCreateNewClient}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
            <span>Register New Client</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="analytics-card sales-toolbar-card">
        <div className="sales-toolbar-filters">
          <div className="sales-search-box">
            <span className="sales-search-icon">
              <Icon name="search" size={15} />
            </span>
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Search by client, company, email, or scheme..."
            />
          </div>

          <select
            className="sales-filter-select"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
          >
            <option value="all">All Service Types</option>
            <option value="Consultancy Services">Consultancy Services</option>
            <option value="Certification">Certification</option>
            <option value="IT">IT</option>
            <option value="Marketing">Marketing</option>
          </select>

          <select
            className="sales-filter-select"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="all">All Payment Status</option>
            <option value="paid">Fully Paid</option>
            <option value="partial">Partially Paid</option>
            <option value="pending">Pending</option>
          </select>

          <select
            className="sales-filter-select"
            value={pipelineFilter || "all"}
            onChange={(e) => setPipelineFilter && setPipelineFilter(e.target.value)}
          >
            <option value="all">All Pipeline Statuses</option>
            <option value="active_incomplete">Active (Pipeline Incomplete)</option>
            <option value="completed">Pipeline Completed (100%)</option>
          </select>
        </div>

        <div className="sales-count-badge">
          <span>Showing</span>
          <strong>{filteredClients.length}</strong>
          <span>of {clients.length} clients</span>
        </div>
      </div>

      {/* Directory Table Card */}
      <div className="analytics-card sales-table-card">
        {filteredClients.length === 0 ? (
          <div className="sales-empty-cell">
            No clients found matching the search and filter criteria.
          </div>
        ) : (
          <div className="sales-table-scroll">
            <table className="sales-clients-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Client & Company</th>
                  <th>Contact Info</th>
                  <th>Scheme</th>
                  <th style={{ minWidth: 150 }}>Pipeline Progress</th>
                  <th>Total Value</th>
                  <th style={{ minWidth: 150 }}>Payment Status</th>
                  <th>Stage</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => {
                  const isSec = client.isPrimary === false || client.processType === "secondary" || client.serviceType === "More Services" || (typeof client.appId === "string" && (client.appId.endsWith("-S") || client.appId.endsWith("-E")));
                  const rawTotal = parseFloat(client.totalPayment || client.amount || 0) || 0;
                  const total = (!isSec && rawTotal === 0) ? 118000 : rawTotal;
                  const rawRec = parseFloat(client.paymentReceived) || 0;
                  const received = (!isSec && rawRec === 0 && (client.paymentStatus === "Paid" || client.approvalStatus === "ACTIVE")) ? total : rawRec;
                  const pending = total > 0 ? Math.max(0, total - received) : (parseFloat(client.paymentPending) || 0);
                  const pct = total > 0 ? Math.min(Math.round((received / total) * 100), 100) : 0;
                  const isPaid = (received >= total && total > 0) || (pending === 0 && received > 0);
                  const isPartial = !isPaid && received > 0;
                  const tracker = getTrackerState(client);

                  return (
                    <tr key={client.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: "#8c5ff8", fontFamily: "monospace", fontSize: 13 }}>
                          {client.appId ? client.appId : (client.id && String(client.id).length > 12 ? `#${String(client.id).slice(0, 8)}` : `#${client.id}`)}
                        </span>
                      </td>
                      <td>
                        <div className="client-avatar-cell">
                          <div className="client-avatar">
                            {client.name ? client.name.slice(0, 2).toUpperCase() : "CL"}
                          </div>
                          <div>
                            <strong className="client-name-title" style={{ display: "block" }}>{client.name}</strong>
                            <span className="client-company-sub" style={{ display: "block" }}>{client.company || "Individual"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span>{client.email}</span>
                          <span className="contact-phone">{client.phone}</span>
                        </div>
                      </td>
                      <td>
                        <span className="scheme-tag">
                          {client.scheme || "Standard"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                            <span style={{ fontWeight: 600, color: tracker.isComplete ? "#10b981" : "#38bdf8" }}>
                              {tracker.isComplete ? "✓ Completed" : tracker.currentStage}
                            </span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: tracker.isComplete ? "#10b981" : "#f2aa38" }}>
                              {tracker.progressPercent}%
                            </span>
                          </div>
                          <div style={{ width: "100%", height: 5, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${tracker.progressPercent}%`, background: tracker.isComplete ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #38bdf8, #818cf8)", borderRadius: 4, transition: "width 0.3s ease" }} />
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: 14, fontWeight: 700 }}>₹{total.toLocaleString("en-IN")}</strong>
                      </td>
                      <td>
                        <div className="payment-progress-cell">
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: isPaid ? "#10b981" : isPartial ? "#f59e0b" : "#f43f5e",
                              }}
                            >
                              {isPaid ? "✓ Paid" : isPartial ? `₹${pending.toLocaleString("en-IN")} pending` : "Unpaid"}
                            </span>
                            <span style={{ fontSize: 11, color: "#7a748e", fontWeight: 600 }}>{isPaid ? 100 : pct}%</span>
                          </div>
                          <div className="payment-mini-bar">
                            <div
                              className={`payment-mini-fill ${isPaid ? "paid" : isPartial ? "partial" : "pending"}`}
                              style={{ width: `${isPaid ? 100 : pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`stage-tag ${client.stage === "Active"
                            ? "active"
                            : client.stage === "Onboarding"
                              ? "onboarding"
                              : client.stage === "Renewal"
                                ? "renewal"
                                : "prospect"
                            }`}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: "currentColor" }} />
                          {client.stage || "Active"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: 6, alignItems: "center" }}>
                          <button
                            type="button"
                            className="sales-btn-secondary"
                            style={{ padding: "6px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 6 }}
                            title="Download Official Client Dossier (PDF)"
                            onClick={() => downloadClientDossierPDF(client)}
                          >
                            <span>📄</span>
                            <span>Dossier</span>
                          </button>
                          <button
                            type="button"
                            className="sales-view-btn"
                            onClick={() => setViewingClient(client)}
                          >
                            <Icon name="eye" size={13} />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client View Pop-up Modal */}
      {viewingClient && (
        <SalesClientViewModal
          client={viewingClient}
          onClose={() => setViewingClient(null)}
          onOpenFullDossier={(client) => {
            setViewingClient(null);
            onSelectClient?.(client);
          }}
          salesPersonName={salesPersonName}
          dark={dark}
        />
      )}
    </div>
  );
}


