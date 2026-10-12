import React, { useMemo, useState } from "react";
import Icon from "../../components/Icon";
import AdminCreateRequestModal from "./AdminCreateRequestModal";
import AdminRequestModal from "./AdminRequestModal";
import { initialAdminRequests } from "./mockAdminRequests";
import "./AdminDashboard.css";

export default function AdminRequestsPage({ clients = [], onRollbackApproved }) {
  const [activeTab, setActiveTab] = useState("My Requests");
  const [requests, setRequests] = useState(initialAdminRequests);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState("");

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === "Pending"),
    [requests]
  );

  const approvedRequests = useMemo(
    () => requests.filter((r) => r.status === "Approved"),
    [requests]
  );

  const historyList = useMemo(() => {
    return requests.filter((r) => {
      const matchStatus = statusFilter === "All" || r.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [requests, statusFilter, searchQuery]);

  const handleCreateRequest = (newReq) => {
    setRequests((prev) => [newReq, ...prev]);
    setNotification(`Rollback petition ${newReq.id} submitted to Branch Manager successfully.`);
    setTimeout(() => setNotification(""), 4500);
  };

  const renderStatusBadge = (status) => {
    return (
      <span className={`admin-badge ${status === "Approved" ? "admin-status-approved" : status === "Rejected" ? "admin-status-rejected" : "admin-status-pending"}`}>
        <span className="admin-status-dot" />
        {status}
      </span>
    );
  };

  return (
    <div className="admin-page-container">
      {/* 1. Header Banner */}
      <div className="admin-header-banner">
        <div>
          <span className="admin-kicker">BRANCH GOVERNANCE &amp; MILESTONE REVERSALS</span>
          <h1 className="admin-title">
            Admin Requests &amp; Stage Rollbacks
          </h1>
          <p className="admin-desc">
            Once a client tracker is updated, reversals require Branch Manager approval. Create rollback petitions and monitor decision statuses.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn-primary admin-req-header-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Icon name="plus" size={16} />
          <span>Create Request</span>
        </button>
      </div>

      {/* 2. Glassmorphic KPI Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-stat-card amber">
          <div>
            <span className="admin-stat-label">Pending Manager Review</span>
            <div className="admin-stat-value" style={{ margin: "4px 0 0" }}>{pendingRequests.length}</div>
          </div>
        </div>

        <div className="admin-stat-card green">
          <div>
            <span className="admin-stat-label">Approved Rollbacks</span>
            <div className="admin-stat-value" style={{ margin: "4px 0 0" }}>{approvedRequests.length}</div>
          </div>
        </div>

        <div className="admin-stat-card blue">
          <div>
            <span className="admin-stat-label">Total Petitions Logged</span>
            <div className="admin-stat-value" style={{ margin: "4px 0 0" }}>{requests.length}</div>
          </div>
        </div>

        <div className="admin-stat-card purple">
          <div>
            <span className="admin-stat-label">Governing Authority</span>
            <div className="admin-stat-value admin-req-stat-authority" style={{ margin: "4px 0 0" }}>Branch Manager</div>
          </div>
        </div>
      </div>

      {/* 3. Filter Bar & Segmented Tabs Strip */}
      <div className="admin-filter-bar">
        <div className="admin-branch-tabs">
          <button
            type="button"
            className={`admin-branch-tab ${activeTab === "My Requests" ? "active" : ""}`}
            onClick={() => setActiveTab("My Requests")}
          >
            <Icon name="clock" size={13} className="admin-req-tab-icon" />
            <span>Pending Review</span>
            <span className="admin-badge admin-req-tab-badge">
              {pendingRequests.length}
            </span>
          </button>

          <button
            type="button"
            className={`admin-branch-tab ${activeTab === "Approved" ? "active" : ""}`}
            onClick={() => setActiveTab("Approved")}
          >
            <Icon name="checkCircle" size={13} className="admin-req-tab-icon" />
            <span>Approved Actions</span>
            <span className="admin-badge admin-req-tab-badge">
              {approvedRequests.length}
            </span>
          </button>

          <button
            type="button"
            className={`admin-branch-tab ${activeTab === "History" ? "active" : ""}`}
            onClick={() => setActiveTab("History")}
          >
            <Icon name="history" size={13} className="admin-req-tab-icon" />
            <span>Request Ledger &amp; History</span>
            <span className="admin-badge admin-req-tab-badge">
              {requests.length}
            </span>
          </button>
        </div>

        {activeTab === "History" && (
          <div className="admin-req-filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-form-input admin-req-filter-select"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search records..."
              className="admin-form-input admin-req-search-input"
            />
          </div>
        )}
      </div>

      {notification && (
        <div className="admin-req-notification">
          <Icon name="checkCircle" size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* 4. Table Views */}

      {/* TAB 1: PENDING REVIEW */}
      {activeTab === "My Requests" && (
        <div className="admin-panel-card admin-req-panel">
          <div className="admin-req-panel-header">
            <div>
              <h3 className="admin-req-panel-title">
                Requests Awaiting Branch Manager Approval
              </h3>
              <p className="admin-req-panel-desc">
                Milestone rollback petitions pending authorization by the Branch Manager.
              </p>
            </div>
            <span className="admin-badge admin-req-count-badge amber">
              {pendingRequests.length} Pending
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-req-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Client Name</th>
                  <th>Request Type</th>
                  <th>Current Milestone</th>
                  <th>Target Rollback</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <code className="admin-req-code">
                        {req.id}
                      </code>
                    </td>
                    <td>
                      <div>
                        <strong>{req.clientName}</strong>
                        <div className="admin-req-subtext">
                          {req.clientAppId} • {req.company}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge admin-req-type-pill">
                        {req.requestType}
                      </span>
                    </td>
                    <td>
                      <span>{req.currentStage || "—"}</span>
                    </td>
                    <td>
                      <strong className="admin-req-target-amber">
                        ↩ {req.targetStage || "—"}
                      </strong>
                    </td>
                    <td>
                      <span className={req.priority === "High" || req.priority === "Urgent" ? "admin-req-priority-high" : "admin-req-priority-normal"}>
                        {req.priority}
                      </span>
                    </td>
                    <td>{renderStatusBadge(req.status)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="admin-btn-secondary admin-req-inspect-btn"
                        onClick={() => setSelectedRequest(req)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="admin-req-empty-cell">
                      No pending rollback requests in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: APPROVED ACTIONS */}
      {activeTab === "Approved" && (
        <div className="admin-panel-card admin-req-panel">
          <div className="admin-req-panel-header">
            <div>
              <h3 className="admin-req-panel-title">
                Approved Milestone Rollbacks
              </h3>
              <p className="admin-req-panel-desc">
                Authorized by the Branch Manager with official decision remarks.
              </p>
            </div>
            <span className="admin-badge admin-req-count-badge green">
              {approvedRequests.length} Approved
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-req-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Client</th>
                  <th>Request Type</th>
                  <th>Target Reversal</th>
                  <th>Decision Date</th>
                  <th>Manager Remarks</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {approvedRequests.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <code className="admin-req-code">
                        {req.id}
                      </code>
                    </td>
                    <td>
                      <div>
                        <strong>{req.clientName}</strong>
                        <div className="admin-req-subtext">
                          {req.clientAppId} • {req.company}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge" style={{ background: "rgba(78, 124, 255, 0.12)", color: "#4e7cff" }}>
                        {req.requestType}
                      </span>
                    </td>
                    <td>
                      <strong className="admin-req-target-green">↩ {req.targetStage || "Applied"}</strong>
                    </td>
                    <td>{req.decisionDate || "—"}</td>
                    <td>
                      <span className="admin-req-subtext">
                        {req.managerRemarks || "Approved by Branch Manager"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="admin-btn-secondary admin-req-inspect-btn"
                        onClick={() => setSelectedRequest(req)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {approvedRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="admin-req-empty-cell">
                      No approved rollback requests logged yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REQUEST HISTORY */}
      {activeTab === "History" && (
        <div className="admin-panel-card admin-req-panel">
          <div className="admin-req-panel-header">
            <div>
              <h3 className="admin-req-panel-title">
                Complete Request History &amp; Audit Log
              </h3>
              <p className="admin-req-panel-desc">
                Historical ledger of all rollback petitions and Branch Manager determinations.
              </p>
            </div>
            <span className="admin-badge admin-req-count-badge purple">
              {historyList.length} Total Records
            </span>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table admin-req-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Client</th>
                  <th>Current Milestone</th>
                  <th>Target Reversal</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th>Decision Date</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <code className="admin-req-code">
                        {req.id}
                      </code>
                    </td>
                    <td>
                      <div>
                        <strong>{req.clientName}</strong>
                        <div className="admin-req-subtext">
                          {req.clientAppId} • {req.company}
                        </div>
                      </div>
                    </td>
                    <td>{req.currentStage || "—"}</td>
                    <td>
                      <strong className={req.status === "Approved" ? "admin-req-target-green" : "admin-req-target-amber"}>
                        ↩ {req.targetStage || "—"}
                      </strong>
                    </td>
                    <td>{req.createdAt}</td>
                    <td>{renderStatusBadge(req.status)}</td>
                    <td>{req.decisionDate || "Pending"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="admin-btn-secondary admin-req-inspect-btn"
                        onClick={() => setSelectedRequest(req)}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
                {historyList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="admin-req-empty-cell">
                      No records match the active filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE REQUEST MODAL */}
      {showCreateModal && (
        <AdminCreateRequestModal
          clients={clients}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRequest}
        />
      )}

      {/* INSPECT REQUEST MODAL */}
      {selectedRequest && (
        <AdminRequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
}
