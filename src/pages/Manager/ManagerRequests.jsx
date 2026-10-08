import React, { useState, useMemo, useEffect } from "react";
import { apiFetch } from "../../services/apiClient";
import Icon from "../../components/Icon";
import RequestTable from "./RequestTable";
import RequestHistory from "./RequestHistory";
import RequestModal from "./RequestModal";
import ManagerCreateRequestModal from "./ManagerCreateRequestModal";
import { getManagerBranchDetails, normalizeSalesPersonName, repairPendingClientCreations } from "../../utils/branchHelper";

export default function ManagerRequests({ branchTeamNames = [], managedRegion = "East Zone", branchTeam = [], clients = [] }) {
  const [activeTab, setActiveTab] = useState("Review");
  const [myRequests, setMyRequests] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);

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

  const branchInfo = useMemo(() => {
    const userEmail = localStorage.getItem("agni_user_email") || "";
    return getManagerBranchDetails(userEmail);
  }, []);

  // Consolidate all branch team member names & emails for isolation
  const branchSalesNames = useMemo(() => {
    const set = new Set();
    if (branchInfo.salespersons) branchInfo.salespersons.forEach((n) => set.add(n.toLowerCase()));
    if (Array.isArray(branchTeamNames)) branchTeamNames.forEach((n) => set.add(String(n).toLowerCase()));
    if (Array.isArray(branchTeam)) {
      branchTeam.forEach((t) => {
        if (typeof t === "string") set.add(t.toLowerCase());
        else if (t?.name) set.add(t.name.toLowerCase());
      });
    }
    return set;
  }, [branchInfo, branchTeamNames, branchTeam]);

  const branchSalesEmails = useMemo(() => {
    const set = new Set();
    if (branchInfo.salesEmails) branchInfo.salesEmails.forEach((e) => set.add(e.toLowerCase()));
    if (Array.isArray(branchTeam)) {
      branchTeam.forEach((t) => {
        if (t?.email) set.add(t.email.toLowerCase());
      });
    }
    return set;
  }, [branchInfo, branchTeam]);

  // Live state for requests loaded directly from backend PostgreSQL database
  const [dbRequests, setDbRequests] = useState([]);

  const fetchRequestsFromDB = async () => {
    try {
      const response = await apiFetch("/requests");
      if (response.ok) {
        const resData = await response.json();
        if (resData.success && Array.isArray(resData.data)) {
          setDbRequests(resData.data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch requests from DB:", err);
    }
  };

  useEffect(() => {
    fetchRequestsFromDB();

    const handleSync = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      fetchRequestsFromDB();
    };
    window.addEventListener("storage", handleSync);
    window.addEventListener("agni_pending_updated", handleSync);
    window.addEventListener("agni_clients_updated", handleSync);
    const interval = setInterval(handleSync, 15000);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("agni_pending_updated", handleSync);
      window.removeEventListener("agni_clients_updated", handleSync);
      clearInterval(interval);
    };
  }, []);

  // Helper to check if a request belongs to this manager's branch
  const isBranchRequest = (req) => {
    if (!req) return false;
    return true;
  };

  // Normalize & filter all salesperson-to-manager requests
  const normalizedBranchRequests = useMemo(() => {
    const list = [];

    if (Array.isArray(dbRequests)) {
      dbRequests.forEach((r) => {
        const reqTypeDisplay =
          r.requestType === "NEW_SERVICE" || r.requestType === "NEW_CLIENT"
            ? "New Client"
            : r.requestType === "EDIT_CLIENT"
            ? "Edit Client"
            : r.requestType === "DELETE_CLIENT"
            ? "Delete Client"
            : r.requestType === "TRANSFER_CLIENT"
            ? "Transfer Client"
            : r.requestType || "Approval Request";

        const statusDisplay =
          r.status === "PENDING"
            ? "Pending"
            : r.status === "APPROVED"
            ? "Approved"
            : r.status === "REJECTED"
            ? "Rejected"
            : r.status || "Pending";

        const pendingData = r.requestType === "NEW_SERVICE" && r.requestedChanges ? r.requestedChanges : null;

        // Payment demands and settlement verification are exclusively between the client and their designated salesperson
        const isPaymentSettlement =
          pendingData?.isPaymentSettlement ||
          pendingData?.category === "Payment Settlement" ||
          String(r.reason || "").toLowerCase().includes("payment settlement") ||
          String(r.reason || "").toLowerCase().includes("payment demand") ||
          String(r.reason || "").toLowerCase().includes("payment request");
        if (isPaymentSettlement) return;

        const clientName = r.client?.companyName || r.client?.name || pendingData?.companyName || pendingData?.name || "Client Account";
        const contactPerson = r.client?.contactPerson || r.client?.name || pendingData?.contactPerson || pendingData?.name || "N/A";
        const email = r.client?.email || pendingData?.email || "";
        const phone = r.client?.phone || pendingData?.phone || "";
        const scheme = r.client?.serviceName || pendingData?.serviceName || "PMEGP";
        const pitchedAmount = r.client?.totalPayment || pendingData?.amount || 0;
        const paymentReceived = r.client?.paymentReceived || pendingData?.paymentReceived || 0;
        const salesPerson = r.requester?.fullName || r.client?.salesPerson?.fullName || "Sales Executive";
        const salesPersonEmail = r.requester?.email || r.client?.salesPerson?.email || "";

        list.push({
          id: r.requestCode || r.id,
          rawId: r.id,
          clientId: r.clientId,
          clientName,
          company: clientName,
          companyName: clientName,
          subtitle: `Contact: ${contactPerson} (${email || "No Email"})`,
          contactPerson,
          email,
          phone,
          scheme,
          pitchedAmount,
          paymentReceived,
          totalPayment: pitchedAmount,
          salesPerson,
          salesPersonEmail,
          owner: salesPerson,
          requestType: reqTypeDisplay,
          reason: r.reason || `New client onboarding request for ${clientName}`,
          requestedChanges: r.requestedChanges || [],
          createdAt: r.createdAt ? String(r.createdAt).split("T")[0] : new Date().toISOString().split("T")[0],
          status: statusDisplay,
          currentStage: r.currentStage,
          approvalChain: r.approvalChain,
          currentChainIndex: r.currentChainIndex,
          auditHistory: r.auditHistory || [],
          source: r.requestType === "NEW_SERVICE" ? "client_creation" : "client_requests",
          raw: r,
        });
      });
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [dbRequests]);

  const isPendingReq = (status) => {
    if (!status) return true;
    const s = String(status).toLowerCase().trim();
    return s === "pending" || s === "pending manager approval" || s.includes("pending");
  };

  const pendingRequests = useMemo(
    () => normalizedBranchRequests.filter((r) => isPendingReq(r.status)),
    [normalizedBranchRequests]
  );

  const historyRequests = useMemo(
    () => normalizedBranchRequests.filter((r) => !isPendingReq(r.status)),
    [normalizedBranchRequests]
  );

  // Approval logic for manager requests
  const handleApproveRequest = async (request) => {
    if (!request || !request.rawId) return;

    try {
      const res = await apiFetch(`/requests/${request.rawId}/decision`, {
        method: "PATCH",
        body: { decision: "APPROVED" },
      });

      if (res.ok) {
        setNotification(`✓ Approved request for "${request.clientName}". Client activated in database.`);
        window.dispatchEvent(new CustomEvent("agni_pending_updated"));
        window.dispatchEvent(new CustomEvent("agni_clients_updated"));
        window.dispatchEvent(new Event("storage"));
        fetchRequestsFromDB();
        setSelectedRequest(null);
        setTimeout(() => setNotification(""), 4500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setNotification(`⚠️ ${errData.message || "Failed to approve request."}`);
      }
    } catch (e) {
      console.error("Error approving request:", e);
    }
  };

  // Rejection logic for manager requests
  const handleRejectRequest = async (request) => {
    if (!request || !request.rawId) return;

    try {
      const res = await apiFetch(`/requests/${request.rawId}/decision`, {
        method: "PATCH",
        body: { decision: "REJECTED" },
      });

      if (res.ok) {
        setNotification(`✓ Request ${request.id} has been Rejected.`);
        window.dispatchEvent(new CustomEvent("agni_pending_updated"));
        window.dispatchEvent(new CustomEvent("agni_clients_updated"));
        window.dispatchEvent(new Event("storage"));
        fetchRequestsFromDB();
        setSelectedRequest(null);
        setTimeout(() => setNotification(""), 4500);
      } else {
        const errData = await res.json().catch(() => ({}));
        setNotification(`⚠️ ${errData.message || "Failed to reject request."}`);
      }
    } catch (e) {
      console.error("Error rejecting request:", e);
    }
  };

  return (
    <section className="manager-page-view">
      {/* Header Banner */}
      <div className="manager-header-banner">
        <div className="manager-header-info">
          <p className="manager-header-eyebrow">Approvals & Workflow — {branchInfo.branchName}</p>
          <h1 className="manager-header-title">Sales Team Approval Requests</h1>
          <p className="manager-header-subtitle">
            Review live branch sales requests, client registrations, and modification petitions submitted by your branch team.
          </p>
        </div>
        <button
          type="button"
          className="manager-btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Icon name="plus" size={15} />
          <span>Create Request</span>
        </button>
      </div>

      {/* Segmented Tabs Strip */}
      <div className="manager-tabs-strip">
        <button
          type="button"
          className={`manager-tab-btn ${activeTab === "Review" ? "active" : ""}`}
          onClick={() => setActiveTab("Review")}
        >
          <Icon name="alert" size={15} />
          <span>Pending Team Review</span>
          <span className="manager-tab-count">{pendingRequests.length}</span>
        </button>

        <button
          type="button"
          className={`manager-tab-btn ${activeTab === "Pending" ? "active" : ""}`}
          onClick={() => setActiveTab("Pending")}
        >
          <Icon name="clock" size={15} />
          <span>My Submitted Requests</span>
          <span className="manager-tab-count">{myRequests.length}</span>
        </button>

        <button
          type="button"
          className={`manager-tab-btn ${activeTab === "History" ? "active" : ""}`}
          onClick={() => setActiveTab("History")}
        >
          <Icon name="history" size={15} />
          <span>Decision History</span>
          <span className="manager-tab-count">{historyRequests.length}</span>
        </button>
      </div>

      {notification && (
        <div className="manager-alert-banner">
          <Icon name="checkCircle" size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Views */}
      {activeTab === "Review" ? (
        <RequestTable requests={pendingRequests} onView={(req) => setSelectedRequest(req)} />
      ) : activeTab === "Pending" ? (
        <div>
          {myRequests.length > 0 ? (
            <RequestTable requests={myRequests} onView={(req) => setSelectedRequest(req)} />
          ) : (
            <div className="analytics-card manager-empty-state">
              <Icon name="document" size={32} style={{ margin: "0 auto 12px", opacity: 0.5, display: "block" }} />
              <strong>No requests submitted by you yet.</strong>
              <p style={{ margin: "6px 0 0", color: "#7a748e", fontSize: 13 }}>
                Click "+ Create Request" at the top right to submit a new account transfer or operational request.
              </p>
            </div>
          )}
        </div>
      ) : (
        <RequestHistory
          receivedRequests={historyRequests}
          sentRequests={myRequests}
          onView={(req) => setSelectedRequest(req)}
        />
      )}

      {/* Review Modal */}
      {selectedRequest && (
        <RequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={() => handleApproveRequest(selectedRequest)}
          onReject={() => handleRejectRequest(selectedRequest)}
          readOnly={activeTab === "History" || activeTab === "Pending"}
        />
      )}

      {/* Manager Create Request Modal */}
      {showCreateModal && (
        <ManagerCreateRequestModal
          salesPeople={branchTeam}
          clients={localClients}
          onClose={() => setShowCreateModal(false)}
          onSubmit={(newReq) => {
            setMyRequests((prev) => [newReq, ...prev]);
            const targetName = newReq.clientName || newReq.salespersonName || "Account";
            setNotification(`✓ Created "${newReq.requestType}" petition for ${targetName}.`);
            setTimeout(() => setNotification(""), 4500);
          }}
        />
      )}
    </section>
  );
}
