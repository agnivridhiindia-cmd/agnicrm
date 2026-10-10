import React, { useState, useMemo, useEffect } from "react";
import Icon from "../../components/Icon";
import BranchManagerCreateRequestModal from "./BranchManagerCreateRequestModal";
import BranchManagerRequestModal from "./BranchManagerRequestModal";
import { initialBranchSentRequests, initialManagerReceivedRequests } from "./mockBranchRequests";
import { apiFetch } from "../../services/apiClient";
import { saveSalesPersonConfig } from "../../utils/salesConfigHelper";

export default function BranchManagerRequestsPage({
  employeesList = [],
  branchAdmins = [],
  branchIT = [],
  branchMarketing = [],
  clients = [],
}) {
  const [activeTab, setActiveTab] = useState("My Requests"); // "My Requests", "Manager Requests", "Decision History"
  const [sentRequests, setSentRequests] = useState(initialBranchSentRequests);
  const [receivedRequests, setReceivedRequests] = useState(initialManagerReceivedRequests);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedIsManagerReq, setSelectedIsManagerReq] = useState(false);
  const [notification, setNotification] = useState("");

  const [localClients, setLocalClients] = useState(clients || []);
  useEffect(() => {
    if (clients && clients.length > 0) {
      setLocalClients(clients);
    } else {
      apiFetch("/clients")
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && Array.isArray(resData.data)) {
            setLocalClients(resData.data);
          }
        })
        .catch((err) => console.warn("Failed fetching clients fallback:", err));
    }
  }, [clients]);

  // Filter states for History tab
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync live requests from backend DB into Branch Manager received requests pool
  React.useEffect(() => {
    function loadLiveBranchRequests() {
      try {
        apiFetch("/requests")
          .then((r) => r.json())
          .then((resData) => {
            if (resData.success && Array.isArray(resData.data)) {
              const liveApiRequests = resData.data
                .filter((r) => {
                  const changes = r.requestedChanges;
                  const isPaymentSettlement =
                    changes?.isPaymentSettlement === true ||
                    changes?.category === "Payment Settlement" ||
                    String(r.reason || "").toLowerCase().includes("payment settlement") ||
                    String(r.reason || "").toLowerCase().includes("payment demand") ||
                    String(r.reason || "").toLowerCase().includes("payment request");
                  return !isPaymentSettlement;
                })
                .map((r) => {
                  const targetEmployeeName = r.targetUser?.fullName || (r.targetEntityType === "EMPLOYEE" ? r.salesPerson?.fullName : null);
                  const clientName = r.client?.companyName || r.client?.name || r.requestedChanges?.companyName || r.requestedChanges?.name || (targetEmployeeName ? `Representative: ${targetEmployeeName}` : "Client Account");
                return {
                  id: r.requestCode || r.id,
                  rawId: r.id,
                  requesterName: r.requester?.fullName || "Regional Manager",
                  requesterRole: r.requester?.role || "Manager",
                  requesterBranch: r.client?.branch?.name || "Branch",
                  targetName: clientName,
                  targetRole: r.targetEntityType || "Client",
                  department: "Sales",
                  salesPerson: targetEmployeeName || r.client?.salesPerson?.fullName || r.salesPerson?.fullName || r.salesPerson || "",
                  salespersonName: targetEmployeeName || r.client?.salesPerson?.fullName || r.salesPerson?.fullName || "",
                  salespersonId: r.targetEntityId || r.targetUser?.id || r.client?.salesPersonId || "",
                  requestType: r.requestType === "DELETE_CLIENT"
                    ? "Delete Client"
                    : r.requestType === "TRANSFER_CLIENT"
                    ? "Transfer Client"
                    : r.requestType === "EDIT_CLIENT"
                    ? "Edit Client"
                    : r.requestType === "DELETE_EMPLOYEE"
                    ? "Delete Staff"
                    : r.requestType === "TRANSFER_EMPLOYEE"
                    ? "Transfer Staff"
                    : r.requestType === "EDIT_EMPLOYEE"
                    ? "Edit Profile"
                    : r.requestType,
                  reason: r.reason,
                  status: r.status === "PENDING" ? "Pending" : r.status === "APPROVED" ? "Approved" : "Rejected",
                  createdAt: r.createdAt ? String(r.createdAt).split("T")[0] : "",
                  currentStage: r.currentStage,
                  approvalChain: r.approvalChain,
                  currentChainIndex: r.currentChainIndex,
                  requestedChanges: Array.isArray(r.requestedChanges) ? r.requestedChanges : [],
                  auditHistory: r.auditHistory || [],
                  raw: r,
                };
              });
              setReceivedRequests((prev) => {
                const nonApi = prev.filter((p) => !p.rawId);
                return [...liveApiRequests, ...nonApi];
              });
            }
          })
          .catch(() => {});
      } catch (e) {}
    }

    loadLiveBranchRequests();
    window.addEventListener("storage", loadLiveBranchRequests);
    window.addEventListener("agni_requests_updated", loadLiveBranchRequests);
    window.addEventListener("agni_pending_updated", loadLiveBranchRequests);
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      loadLiveBranchRequests();
    }, 15000);
    return () => {
      window.removeEventListener("storage", loadLiveBranchRequests);
      window.removeEventListener("agni_requests_updated", loadLiveBranchRequests);
      window.removeEventListener("agni_pending_updated", loadLiveBranchRequests);
      clearInterval(interval);
    };
  }, []);

  const handleApproveManagerRequest = async (requestId, remarks = "") => {
    try {
      const targetReq = receivedRequests.find((r) => r.id === requestId || r.rawId === requestId);
      const targetId = targetReq?.rawId || requestId;

      // Extract any approved salesperson profile or quota changes
      const applyApprovedConfig = () => {
        if (!targetReq) return;
        const changes = targetReq.requestedChanges || [];
        let approvedTitle = null;
        let approvedQuota = null;
        changes.forEach((c) => {
          if (c.field === "Salesperson Designation" || c.field === "Designation" || c.field === "Role") approvedTitle = c.newValue;
          if (c.field === "Salesperson Quota" || c.field === "Quota" || c.field === "Target Quota") approvedQuota = c.newValue;
        });

        if (approvedTitle || approvedQuota) {
          const identifiers = new Set([
            targetReq.salespersonName,
            targetReq.salesPerson,
            targetReq.targetRep,
            targetReq.salespersonId,
            targetReq.raw?.targetEntityId,
            targetReq.raw?.targetUser?.fullName,
            targetReq.raw?.targetUser?.email,
            targetReq.raw?.targetUser?.id,
            targetReq.raw?.client?.salesPerson?.fullName,
            targetReq.raw?.client?.salesPersonId,
          ].filter(Boolean));

          const matchReason = String(targetReq.reason || "").match(/for\s+([A-Za-z\s]+?)(?:\.|$)/i);
          if (matchReason && matchReason[1]) {
            identifiers.add(matchReason[1].trim());
          }

          identifiers.forEach((idOrName) => {
            saveSalesPersonConfig(idOrName, { designation: approvedTitle, quota: approvedQuota });
          });
        }
      };

      if (targetReq?.rawId) {
        const res = await apiFetch(`/requests/${targetId}/decision`, {
          method: "PATCH",
          body: { decision: "APPROVED", managerRemarks: remarks },
        });
        if (res.ok) {
          applyApprovedConfig();
          setNotification("✓ Request approved and forwarded according to workflow hierarchy.");
          window.dispatchEvent(new CustomEvent("agni_requests_updated"));
          window.dispatchEvent(new CustomEvent("agni_clients_updated"));
          window.dispatchEvent(new CustomEvent("agni_employees_updated"));
          setTimeout(() => setNotification(""), 4000);
        } else {
          const err = await res.json().catch(() => ({}));
          setNotification(`⚠️ ${err.message || "Failed to approve request."}`);
        }
      } else {
        // Fallback for mock/local items
        applyApprovedConfig();
        setReceivedRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "Approved",
                  decisionDate: new Date().toISOString().split("T")[0],
                  managerRemarks: remarks || "Approved by Branch Manager.",
                }
              : r
          )
        );
        setNotification(`Request ${requestId} has been Approved.`);
        setTimeout(() => setNotification(""), 4500);
      }
    } catch (e) {
      setNotification("⚠️ Network error while approving request.");
    }
  };

  const handleRejectManagerRequest = async (requestId, remarks = "") => {
    try {
      const targetReq = receivedRequests.find((r) => r.id === requestId || r.rawId === requestId);
      const targetId = targetReq?.rawId || requestId;
      if (targetReq?.rawId) {
        const res = await apiFetch(`/requests/${targetId}/decision`, {
          method: "PATCH",
          body: { decision: "REJECTED", managerRemarks: remarks },
        });
        if (res.ok) {
          setNotification("✓ Request rejected.");
          window.dispatchEvent(new CustomEvent("agni_requests_updated"));
          setTimeout(() => setNotification(""), 4000);
        } else {
          const err = await res.json().catch(() => ({}));
          setNotification(`⚠️ ${err.message || "Failed to reject request."}`);
        }
      } else {
        // Fallback for mock/local items
        setReceivedRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: "Rejected",
                  decisionDate: new Date().toISOString().split("T")[0],
                  managerRemarks: remarks || "Rejected by Branch Manager.",
                }
              : r
          )
        );
        setNotification(`Request ${requestId} has been Rejected.`);
        setTimeout(() => setNotification(""), 4500);
      }
    } catch (e) {
      setNotification("⚠️ Network error while rejecting request.");
    }
  };

  // KPIs
  const pendingSentCount = useMemo(
    () => sentRequests.filter((r) => r.status === "Pending").length,
    [sentRequests]
  );
  const pendingReceivedCount = useMemo(
    () => receivedRequests.filter((r) => r.status === "Pending").length,
    [receivedRequests]
  );

  // Filtered Decision History
  const historyList = useMemo(() => {
    const combined = [
      ...sentRequests.map((r) => ({ ...r, flowType: "Sent to Owner" })),
      ...receivedRequests.map((r) => ({ ...r, flowType: "Manager Petition" })),
    ];

    return combined.filter((item) => {
      const matchStatus = statusFilter === "All" || item.status === statusFilter;
      const matchDept =
        deptFilter === "All" ||
        item.department === deptFilter ||
        item.targetRole?.toLowerCase().includes(deptFilter.toLowerCase());
      const query = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        item.id.toLowerCase().includes(query) ||
        item.targetName.toLowerCase().includes(query) ||
        item.requestType.toLowerCase().includes(query) ||
        (item.requesterName && item.requesterName.toLowerCase().includes(query));

      return matchStatus && matchDept && matchSearch;
    });
  }, [sentRequests, receivedRequests, statusFilter, deptFilter, searchQuery]);

  const handleCreateSentRequest = async (newReq) => {
    try {
      let backendReqType = null;
      let targetEntityType = "CLIENT";
      if (newReq.requestType === "Delete Client") {
        backendReqType = "DELETE_CLIENT";
      } else if (newReq.requestType === "Transfer Client") {
        backendReqType = "TRANSFER_CLIENT";
      } else if (newReq.requestType === "Edit Client") {
        backendReqType = "EDIT_CLIENT";
      } else if (newReq.requestType === "Delete Staff") {
        backendReqType = "DELETE_EMPLOYEE";
        targetEntityType = "EMPLOYEE";
      } else if (newReq.requestType === "Transfer Staff") {
        backendReqType = "TRANSFER_EMPLOYEE";
        targetEntityType = "EMPLOYEE";
      } else if (newReq.requestType === "Edit Profile") {
        backendReqType = "EDIT_EMPLOYEE";
        targetEntityType = "EMPLOYEE";
      }

      if (backendReqType) {
        const payload = {
          requestType: backendReqType,
          targetEntityType,
          targetEntityId: targetEntityType === "EMPLOYEE" ? newReq.targetId : undefined,
          clientId: targetEntityType === "CLIENT" ? newReq.targetId : undefined,
          reason: newReq.reason,
          requestedChanges: newReq.requestedChanges || {
            destinationBranch: newReq.destinationBranch,
            receivingManager: newReq.receivingManager,
          },
        };
        const res = await apiFetch("/requests", {
          method: "POST",
          body: payload,
        });
        if (res.ok) {
          window.dispatchEvent(new CustomEvent("agni_requests_updated"));
        }
      }
    } catch (e) {
      console.warn("Failed creating live backend request:", e);
    }
    setSentRequests((prev) => [newReq, ...prev]);
    setNotification(`Governance request ${newReq.id} submitted to Owner successfully.`);
    setTimeout(() => setNotification(""), 4500);
  };

  const statusBadge = (status) => {
    const color =
      status === "Approved"
        ? "#10b981"
        : status === "Rejected"
        ? "#f43f5e"
        : "#f59e0b";
    return (
      <span
        className="stage-tag bm-req-status-badge"
        style={{
          background: `${color}1a`,
          color: color,
          border: `1px solid ${color}33`,
        }}
      >
        <span className="bm-req-status-dot" style={{ background: color }} />
        {status}
      </span>
    );
  };

  return (
    <section className="bm-page-view">
      {/* Header Banner */}
      <div className="bm-header-banner">
        <div className="bm-header-info">
          <p className="bm-header-eyebrow">Governance &amp; Team Requests</p>
          <h1 className="bm-header-title">Branch Requests &amp; Approvals</h1>
          <p className="bm-header-subtitle">
            Review operational requests from Regional Managers and submit Edit, Delete, or Transfer petitions for Manager, Admin, IT, and Marketing staff to the Owner.
          </p>
        </div>

        <button
          type="button"
          className="manager-btn-primary bm-req-header-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <Icon name="plus" size={16} />
          <span>Create Request</span>
        </button>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="bm-kpi-ribbon">
        <div className="analytics-card bm-kpi-tile bm-req-kpi-owner">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Pending Owner Decisions</span>
            <Icon name="clock" size={16} />
          </div>
          <h2 className="bm-kpi-tile-value bm-req-kpi-val bm-req-kpi-val-purple">
            {pendingSentCount}
          </h2>
          <span className="bm-kpi-tile-trend bm-req-kpi-trend">Sent to Owner queue</span>
        </div>

        <div className="analytics-card bm-kpi-tile bm-req-kpi-manager">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Manager Requests to Review</span>
            <Icon name="alert" size={16} />
          </div>
          <h2 className="bm-kpi-tile-value bm-req-kpi-val bm-req-kpi-val-amber">
            {pendingReceivedCount}
          </h2>
          <span className="bm-kpi-tile-trend bm-req-kpi-trend">Awaiting Branch approval</span>
        </div>

        <div className="analytics-card bm-kpi-tile bm-req-kpi-approved">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Approved Governance Actions</span>
            <Icon name="checkCircle" size={16} />
          </div>
          <h2 className="bm-kpi-tile-value bm-req-kpi-val bm-req-kpi-val-green">
            {sentRequests.filter((r) => r.status === "Approved").length + receivedRequests.filter((r) => r.status === "Approved").length}
          </h2>
          <span className="bm-kpi-tile-trend bm-req-kpi-trend">Active across branch</span>
        </div>

        <div className="analytics-card bm-kpi-tile bm-req-kpi-teams">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Total Governed Teams</span>
            <Icon name="team" size={16} />
          </div>
          <h2 className="bm-kpi-tile-value bm-req-kpi-val bm-req-kpi-val-blue">
            4 Depts
          </h2>
          <span className="bm-kpi-tile-trend bm-req-kpi-trend">Manager, Admin, IT, Marketing</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="manager-tabs-strip">
        <button
          type="button"
          className={`manager-tab-btn ${activeTab === "My Requests" ? "active" : ""}`}
          onClick={() => setActiveTab("My Requests")}
        >
          <Icon name="document" size={15} />
          <span>My Requests (To Owner)</span>
          <span className="manager-tab-count">{sentRequests.length}</span>
        </button>

        <button
          type="button"
          className={`manager-tab-btn ${activeTab === "Manager Requests" ? "active" : ""}`}
          onClick={() => setActiveTab("Manager Requests")}
        >
          <Icon name="alert" size={15} />
          <span>Manager Requests (To Review)</span>
          <span className="manager-tab-count">{receivedRequests.length}</span>
        </button>

        <button
          type="button"
          className={`manager-tab-btn ${activeTab === "Decision History" ? "active" : ""}`}
          onClick={() => setActiveTab("Decision History")}
        >
          <Icon name="history" size={15} />
          <span>Decision History</span>
          <span className="manager-tab-count">{sentRequests.length + receivedRequests.length}</span>
        </button>
      </div>

      {notification && (
        <div className="manager-alert-banner bm-req-alert-banner">
          <Icon name="checkCircle" size={16} />
          <span>{notification}</span>
          <button type="button" className="bm-req-alert-close" onClick={() => setNotification("")}>✕</button>
        </div>
      )}

      {/* TAB 1: MY REQUESTS (SENT TO OWNER) */}
      {activeTab === "My Requests" && (
        <div className="analytics-card sales-table-card">
          <div className="bm-req-card-header">
            <div>
              <h3 className="bm-req-card-title">Governance Petitions Submitted to Owner</h3>
              <p className="bm-req-card-sub">
                Edit, Delete, and Transfer requests created for Managers, Admin, IT, and Marketing staff.
              </p>
            </div>
            <span className="bm-req-meta-tag bm-req-meta-purple">
              Recipient: Business Owner
            </span>
          </div>

          <div className="sales-table-scroll">
            <table className="sales-clients-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Target Employee</th>
                  <th>Department</th>
                  <th>Request Action</th>
                  <th>Submission Date</th>
                  <th>Priority</th>
                  <th>Owner Status</th>
                  <th className="bm-req-text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sentRequests.map((req) => (
                  <tr key={req.id}>
                    <td><strong>{req.id}</strong></td>
                    <td>
                      <div>
                        <strong>{req.targetName}</strong>
                        <small className="bm-req-subtext">
                          {req.targetRole} ({req.targetBranch} Branch)
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className="stage-tag bm-req-dept-pill">
                        {req.department}
                      </span>
                    </td>
                    <td>
                      <strong className={req.requestType.includes("Delete") ? "bm-req-action-del" : req.requestType.includes("Transfer") ? "bm-req-action-transfer" : "bm-req-action-edit"}>
                        {req.requestType}
                      </strong>
                    </td>
                    <td>{req.createdAt}</td>
                    <td>
                      <span className={`bm-req-priority ${req.priority === "High" ? "bm-req-priority-high" : ""}`}>
                        {req.priority || "Normal"}
                      </span>
                    </td>
                    <td>{statusBadge(req.status)}</td>
                    <td className="bm-req-text-right">
                      <button
                        type="button"
                        className="sales-view-btn"
                        onClick={() => {
                          setSelectedRequest(req);
                          setSelectedIsManagerReq(false);
                        }}
                      >
                        <Icon name="eye" size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {sentRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="sales-empty-cell">
                      No requests submitted to Owner yet. Click "+ Create Request" to submit a petition.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGER REQUESTS (RECEIVED FROM MANAGERS) */}
      {activeTab === "Manager Requests" && (
        <div className="analytics-card sales-table-card">
          <div className="bm-req-card-header">
            <div>
              <h3 className="bm-req-card-title">Requests Received from Regional Managers</h3>
              <p className="bm-req-card-sub">
                Review and approve client modifications or operational petitions submitted by branch managers.
              </p>
            </div>
            <span className="bm-req-meta-tag bm-req-meta-amber">
              {pendingReceivedCount} Pending Review
            </span>
          </div>

          <div className="sales-table-scroll">
            <table className="sales-clients-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Submitted By Manager</th>
                  <th>Target Entity</th>
                  <th>Request Type</th>
                  <th>Date</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th className="bm-req-text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {receivedRequests.map((req) => (
                  <tr key={req.id}>
                    <td><strong>{req.id}</strong></td>
                    <td>
                      <div>
                        <strong>{req.requesterName}</strong>
                        <small className="bm-req-subtext">
                          {req.requesterRole} ({req.requesterBranch || "South"} Branch)
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{req.targetName}</strong>
                        <small className="bm-req-subtext">
                          {req.targetType || "Client"}
                        </small>
                      </div>
                    </td>
                    <td><strong>{req.requestType}</strong></td>
                    <td>{req.createdAt}</td>
                    <td>
                      <span className={`bm-req-priority ${req.priority === "High" ? "bm-req-priority-high" : ""}`}>
                        {req.priority || "Normal"}
                      </span>
                    </td>
                    <td>{statusBadge(req.status)}</td>
                    <td className="bm-req-text-right">
                      <div className="bm-req-actions-group">
                        <button
                          type="button"
                          className="sales-view-btn"
                          onClick={() => {
                            setSelectedRequest(req);
                            setSelectedIsManagerReq(true);
                          }}
                        >
                          <Icon name="eye" size={13} />
                          <span>Review</span>
                        </button>
                        {req.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              className="sales-view-btn bm-req-btn-approve"
                              onClick={() => handleApproveManagerRequest(req.id)}
                              title="Quick Approve"
                            >
                              <Icon name="check" size={13} />
                            </button>
                            <button
                              type="button"
                              className="sales-view-btn bm-req-btn-reject"
                              onClick={() => handleRejectManagerRequest(req.id)}
                              title="Quick Reject"
                            >
                              <Icon name="close" size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {receivedRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="sales-empty-cell">
                      No manager requests in queue.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DECISION HISTORY */}
      {activeTab === "Decision History" && (
        <div className="analytics-card sales-table-card">
          {/* History Filters Toolbar */}
          <div className="bm-req-filter-bar">
            <div className="bm-req-filter-group">
              <label className="bm-req-filter-label">
                <span>Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bm-req-filter-select-input"
                >
                  <option value="All">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>

              <label className="bm-req-filter-label">
                <span>Department:</span>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="bm-req-filter-select-input"
                >
                  <option value="All">All Departments</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="IT">IT</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                </select>
              </label>
            </div>

            <div className="bm-req-filter-search-box">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history records..."
                className="bm-req-filter-search-input"
              />
            </div>
          </div>

          <div className="sales-table-scroll">
            <table className="sales-clients-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Flow Category</th>
                  <th>Target / Entity</th>
                  <th>Action Type</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Decided Date</th>
                  <th className="bm-req-text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map((item) => (
                  <tr key={`${item.id}-${item.flowType}`}>
                    <td><strong>{item.id}</strong></td>
                    <td>
                      <span className={`stage-tag ${item.flowType.includes("Owner") ? "bm-req-stage-owner" : "bm-req-stage-manager"}`}>
                        {item.flowType}
                      </span>
                    </td>
                    <td>
                      <strong>{item.targetName}</strong>
                      <small className="bm-req-subtext">
                        {item.department || "Client"}
                      </small>
                    </td>
                    <td><strong>{item.requestType}</strong></td>
                    <td>{item.createdAt}</td>
                    <td>{statusBadge(item.status)}</td>
                    <td>{item.decisionDate || "Pending Review"}</td>
                    <td className="bm-req-text-right">
                      <button
                        type="button"
                        className="sales-view-btn"
                        onClick={() => {
                          setSelectedRequest(item);
                          setSelectedIsManagerReq(item.flowType.includes("Manager"));
                        }}
                      >
                        <Icon name="eye" size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {historyList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="sales-empty-cell">
                      No historical request records found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE GOVERNANCE REQUEST MODAL */}
      {showCreateModal && (
        <BranchManagerCreateRequestModal
          employeesList={employeesList}
          branchAdmins={branchAdmins}
          branchIT={branchIT}
          branchMarketing={branchMarketing}
          clients={localClients}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateSentRequest}
        />
      )}

      {/* INSPECT & DECIDE REQUEST MODAL */}
      {selectedRequest && (
        <BranchManagerRequestModal
          request={selectedRequest}
          isManagerRequest={selectedIsManagerReq}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApproveManagerRequest}
          onReject={handleRejectManagerRequest}
        />
      )}
    </section>
  );
}
