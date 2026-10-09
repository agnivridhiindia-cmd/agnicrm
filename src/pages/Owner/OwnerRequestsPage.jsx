import React, { useState } from "react";
import Icon from "../../components/Icon";
import { monthNamesList } from "./mockOwnerData";

export default function OwnerRequestsPage({
  requestsList = [],
  onOpenRequestDecision,
  onCancelRequest,
}) {
  const [requestsActiveTab, setRequestsActiveTab] = useState("Pending Requests");
  const [historyMonthFilter, setHistoryMonthFilter] = useState("All");
  const [historyYearFilter, setHistoryYearFilter] = useState("All");
  const [historyStatusFilter, setHistoryStatusFilter] = useState("All");

  // Filter out secondary scheme requests (e.g. NEW_SERVICE) from Owner Governance view
  const ownerRequestsList = requestsList.filter((r) => {
    const rawType = String(r.requestType || r.raw?.requestType || "").toUpperCase();
    const reason = String(r.reason || "").toLowerCase();
    return rawType !== "NEW_SERVICE" && rawType !== "NEW_SCHEME" && !reason.includes("self-enrollment");
  });

  const pendingRequests = ownerRequestsList.filter((r) => r.status === "Pending");
  const historyRequests = ownerRequestsList.filter((r) => {
    if (r.status === "Pending") return false;
    if (historyStatusFilter !== "All" && r.status !== historyStatusFilter) return false;
    if (historyMonthFilter !== "All" && r.month !== historyMonthFilter) return false;
    if (historyYearFilter !== "All" && String(r.year) !== String(historyYearFilter)) return false;
    return true;
  });

  const displayedRequests = requestsActiveTab === "Pending Requests" ? pendingRequests : historyRequests;

  return (
    <section className="owner-page-view">
      {/* Header Section */}
      <div className="owner-header-banner">
        <div className="owner-header-info">
          <p className="owner-header-eyebrow">Governance & Approvals</p>
          <h1 className="owner-header-title">Branch Manager Requests</h1>
        </div>
      </div>

      {/* Segmented Tabs Navigation */}
      <div className="owner-tabs-nav">
        {["Pending Requests", "Request History"].map((tab) => {
          const count =
            tab === "Pending Requests"
              ? ownerRequestsList.filter((r) => r.status === "Pending").length
              : ownerRequestsList.filter((r) => r.status !== "Pending").length;
          return (
            <button
              key={tab}
              type="button"
              className={`owner-tab-btn ${requestsActiveTab === tab ? "active" : ""}`}
              onClick={() => setRequestsActiveTab(tab)}
            >
              <span>{tab}</span>
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: 999,
                  background: requestsActiveTab === tab ? "rgba(255, 255, 255, 0.25)" : "rgba(99, 102, 241, 0.12)",
                  color: requestsActiveTab === tab ? "#ffffff" : "#6366f1",
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* History Filters Toolbar (if on history tab) */}
      {requestsActiveTab === "Request History" && (
        <div className="analytics-card owner-toolbar-card">
          <div className="owner-toolbar-filters">
            <label className="field-label" style={{ margin: 0 }}>
              <span>Status:</span>
              <select
                className="owner-filter-select"
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </label>

            <label className="field-label" style={{ margin: 0 }}>
              <span>Month:</span>
              <select
                className="owner-filter-select"
                value={historyMonthFilter}
                onChange={(e) => setHistoryMonthFilter(e.target.value)}
              >
                <option value="All">All Months</option>
                {monthNamesList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </label>

            <label className="field-label" style={{ margin: 0 }}>
              <span>Year:</span>
              <select
                className="owner-filter-select"
                value={historyYearFilter}
                onChange={(e) => setHistoryYearFilter(e.target.value)}
              >
                <option value="All">All Years</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
              </select>
            </label>
          </div>

          <div className="owner-count-badge">
            <span>Historical Records:</span>
            <strong>{displayedRequests.length}</strong>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="analytics-card owner-table-card">
        <div className="owner-table-scroll">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Client / Entity</th>
                <th>Submitting Branch Manager</th>
                <th>Request Category</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="owner-empty-state">
                    {requestsActiveTab === "Pending Requests"
                      ? "No pending Branch Manager requests requiring decision."
                      : "No historical request records found matching the filters."}
                  </td>
                </tr>
              ) : (
                displayedRequests.map((req) => {
                  const clientTitle = req.clientName || req.client?.name || req.title || "Client Request";
                  const companyTitle = req.company || req.client?.company || "Commercial Account";
                  const initials = clientTitle
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  const statusClass = (req.status || "pending").toLowerCase();

                  return (
                    <tr key={req.id}>
                      <td>
                        <span className="owner-rep-pill" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                          #{req.id}
                        </span>
                      </td>
                      <td>
                        <div className="owner-member-avatar-cell">
                          <div className="owner-member-avatar">{initials}</div>
                          <div className="owner-member-details">
                            <strong className="owner-member-name">{clientTitle}</strong>
                            <span className="owner-member-branch">{companyTitle}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="owner-rep-pill">
                          <Icon name="user" size={12} />
                          {req.branchManagerName || req.managerName || "Branch Head"}
                        </span>
                      </td>
                      <td>
                        <span className="owner-service-pill">
                          {req.requestType || req.category || "General Update"}
                        </span>
                      </td>
                      <td>
                        <span className="owner-date-text">{req.date || "Today"}</span>
                      </td>
                      <td>
                        <span className={`owner-status-pill ${statusClass}`}>
                          ● {req.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div className="owner-actions-cell">
                          {requestsActiveTab === "Pending Requests" ? (
                            <>
                              <button
                                className="owner-btn-primary"
                                style={{ padding: "6px 14px", fontSize: 12 }}
                                type="button"
                                onClick={() => onOpenRequestDecision && onOpenRequestDecision(req)}
                              >
                                Decide
                              </button>
                              {onCancelRequest && (
                                <button
                                  className="owner-btn-danger"
                                  type="button"
                                  onClick={() => onCancelRequest(req.id)}
                                >
                                  Dismiss
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              className="owner-view-btn"
                              type="button"
                              onClick={() => onOpenRequestDecision && onOpenRequestDecision(req)}
                            >
                              View Details
                            </button>
                          )}
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
    </section>
  );
}
