import React, { useMemo, useState, useEffect } from "react";
import { apiFetch } from "../../services/apiClient";
import RequestTable from "./RequestTable";
import RequestHistory from "./RequestHistory";
import CreateRequestModal from "./CreateRequestModal";
import RequestDetailsModal from "./RequestDetailsModal";
import ApproveSchemeModal from "./ApproveSchemeModal";
import Icon from "../../components/Icon";
import { mockRequests } from "./mockRequests";
import { mockClients } from "./mockClients";

const TABS = [
  { id: "Pending Requests", label: "Pending Requests", icon: "clock" },
  { id: "Request History", label: "Request History", icon: "history" },
];

export default function SalesRequests() {
  const [activeTab, setActiveTab] = useState("Pending Requests");
  const [requests, setRequests] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approvingScheme, setApprovingScheme] = useState(null);
  const [notification, setNotification] = useState("");

  const fetchRequests = async () => {
    try {
      const res = await apiFetch("/requests");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const mapped = data.data.map((r) => {
            const pendingData = r.requestType === "NEW_SERVICE" && r.requestedChanges ? r.requestedChanges : null;
            const clientName = r.client?.companyName || r.client?.name || pendingData?.companyName || pendingData?.name || "Client Account";
            return {
              id: r.requestCode || r.id,
              clientName,
              companyName: clientName,
              requestType: r.requestType === "NEW_SERVICE" ? "Client Create" : r.requestType,
              status: r.status === "PENDING" ? "Pending" : r.status === "APPROVED" ? "Approved" : r.status === "REJECTED" ? "Rejected" : "Pending",
              category: r.requestType === "NEW_SERVICE" ? "Manager Approval: Client Create" : r.requestType,
              decisionDate: r.decisionDate ? new Date(r.decisionDate).toISOString().split("T")[0] : "",
              managerRemarks: r.managerRemarks || "",
              raw: r,
            };
          });
          setRequests(mapped);
        }
      }

      const savedSchemes = localStorage.getItem("agni_pending_scheme_requests");
      if (savedSchemes) {
        try {
          const clientReqs = JSON.parse(savedSchemes);
          if (Array.isArray(clientReqs)) {
            const mappedClientReqs = clientReqs.map(r => ({
              id: r.id,
              clientName: r.clientName,
              companyName: r.clientName,
              requestType: "Eligible Scheme",
              status: r.status.includes("Pending") ? "Pending" : r.status,
              category: "Eligible Scheme",
              schemeName: r.schemeName,
              decisionDate: r.decisionDate || "",
              managerRemarks: r.managerRemarks || "",
              raw: r,
            }));
            setRequests(prev => {
              const mapIds = new Set(prev.map(p => p.id));
              const newReqs = mappedClientReqs.filter(r => !mapIds.has(r.id));
              return [...prev, ...newReqs];
            });
          }
        } catch (e) { }
      }

    } catch (e) {
      console.error("Failed to fetch requests", e);
    }
  };

  useEffect(() => {
    fetchRequests();

    const handleSync = () => fetchRequests();
    window.addEventListener("storage", handleSync);
    window.addEventListener("agni_pending_updated", handleSync);
    window.addEventListener("agni_clients_updated", handleSync);
    const interval = setInterval(handleSync, 5000);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("agni_pending_updated", handleSync);
      window.removeEventListener("agni_clients_updated", handleSync);
      clearInterval(interval);
    };
  }, []);

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "Pending"),
    [requests]
  );

  const historyRequests = useMemo(
    () => requests.filter((request) => request.status !== "Pending"),
    [requests]
  );

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = pendingRequests.length;
    const approved = requests.filter((r) => r.status === "Approved").length;
    const cancelled = requests.filter((r) => r.status === "Cancelled" || r.status === "Rejected").length;
    return { total, pending, approved, cancelled };
  }, [requests, pendingRequests]);

  const addRequest = (newRequest) => {
    setRequests((prev) => [newRequest, ...prev]);
    setNotification(
      newRequest.requestType === "Edit Client"
        ? `✓ Edit request for "${newRequest.clientName}" (${newRequest.id}) submitted successfully!`
        : `✓ Deletion request for "${newRequest.clientName}" (${newRequest.id}) submitted successfully!`
    );
    setTimeout(() => setNotification(""), 4500);
  };

  const cancelPendingRequest = (requestId) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
            ...request,
            status: "Cancelled",
            decisionDate: new Date().toISOString().split("T")[0],
            managerRemarks: "Cancelled by salesperson.",
          }
          : request
      )
    );
    setNotification(`Request ${requestId} has been cancelled.`);
    setTimeout(() => setNotification(""), 3500);
  };

  const handleApproveScheme = async (details) => {
    if (!approvingScheme) return;
    try {
      const savedSchemes = localStorage.getItem("agni_pending_scheme_requests");
      if (savedSchemes) {
        let allReqs = JSON.parse(savedSchemes);
        allReqs = allReqs.map(r =>
          r.id === approvingScheme.id
            ? {
                ...r,
                status: "Approved & Active",
                pitchedAmount: details.pitchedAmount,
                paymentMode: details.paymentMode,
                totalPayment: details.totalPayment,
                amountRequired: details.amountRequired,
                decisionDate: new Date().toISOString()
              }
            : r
        );
        localStorage.setItem("agni_pending_scheme_requests", JSON.stringify(allReqs));
      }

      const clientEmail = approvingScheme.raw?.clientEmail || approvingScheme.raw?.email || approvingScheme.email;
      if (clientEmail) {
        await apiFetch("/clients", {
          method: "POST",
          body: {
            companyName: approvingScheme.companyName || approvingScheme.clientName,
            contactPerson: approvingScheme.clientName,
            name: approvingScheme.clientName,
            email: clientEmail,
            phone: approvingScheme.raw?.phone || "+91 98765 43210",
            serviceName: approvingScheme.schemeName,
            serviceType: "CONSULTANCY",
            amount: details.totalPayment || details.pitchedAmount,
            paymentMode: (details.paymentMode || "ONLINE").toUpperCase(),
            paymentReceived: 0,
            fundingRequirement: details.amountRequired,
            approvalStatus: "ACTIVE",
          }
        });
      }

      window.dispatchEvent(new Event("agni_pending_updated"));
      window.dispatchEvent(new CustomEvent("agni_pending_updated"));
      window.dispatchEvent(new CustomEvent("agni_clients_updated"));
      window.dispatchEvent(new Event("storage"));

      setNotification(`✓ Scheme ${approvingScheme.schemeName} approved successfully for ${approvingScheme.clientName}!`);
      setTimeout(() => setNotification(""), 4500);
    } catch (e) {
      console.error(e);
    }
    setApprovingScheme(null);
  };

  const handleDeclineScheme = (requestId) => {
    const savedSchemes = localStorage.getItem("agni_pending_scheme_requests");
    if (savedSchemes) {
      let allReqs = JSON.parse(savedSchemes);
      allReqs = allReqs.map(r => r.id === requestId ? { ...r, status: "Declined", decisionDate: new Date().toISOString() } : r);
      localStorage.setItem("agni_pending_scheme_requests", JSON.stringify(allReqs));
      window.dispatchEvent(new Event("agni_pending_updated"));
      setNotification(`Request ${requestId} declined.`);
      setTimeout(() => setNotification(""), 4500);
    }
  };


  return (
    <section className="sales-page-view">
      {/* Header section */}
      <div className="sales-header-banner">
        <div className="sales-header-info">
          <p className="sales-header-eyebrow">
            Workflow & Approvals
          </p>
          <h1 className="sales-header-title">
            My Requests
          </h1>
          <p className="sales-header-subtitle">
            Track client profile edits and account deletion requests submitted for manager authorization.
          </p>
        </div>

        <button
          type="button"
          className="sales-add-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
          <span>Create Request</span>
        </button>
      </div>

      {/* KPI Stats Ribbon */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        <div className="analytics-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(140, 95, 248, 0.12)", color: "#8c5ff8", display: "grid", placeItems: "center", fontWeight: 700 }}>
            {stats.total}
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Total Requests</span>
            <strong style={{ display: "block", fontSize: 16 }}>{stats.total}</strong>
          </div>
        </div>

        <div className="analytics-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(245, 158, 11, 0.14)", color: "#f59e0b", display: "grid", placeItems: "center", fontWeight: 700 }}>
            {stats.pending}
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Pending Approval</span>
            <strong style={{ display: "block", fontSize: 16, color: "#f59e0b" }}>{stats.pending}</strong>
          </div>
        </div>

        <div className="analytics-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(16, 185, 129, 0.14)", color: "#10b981", display: "grid", placeItems: "center", fontWeight: 700 }}>
            {stats.approved}
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Approved</span>
            <strong style={{ display: "block", fontSize: 16, color: "#10b981" }}>{stats.approved}</strong>
          </div>
        </div>

        <div className="analytics-card" style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(100, 116, 139, 0.14)", color: "#64748b", display: "grid", placeItems: "center", fontWeight: 700 }}>
            {stats.cancelled}
          </div>
          <div>
            <span style={{ fontSize: 11.5, color: "#7a748e", textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>Closed / Cancelled</span>
            <strong style={{ display: "block", fontSize: 16, color: "#64748b" }}>{stats.cancelled}</strong>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: 4,
          borderRadius: 12,
          background: "rgba(140, 95, 248, 0.08)",
          border: "1px solid rgba(140, 95, 248, 0.14)",
          marginBottom: 18,
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const count = tab.id === "Pending Requests" ? pendingRequests.length : historyRequests.length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: 9,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
                background: isActive ? "linear-gradient(135deg, #8c5ff8 0%, #6d3bf5 100%)" : "transparent",
                color: isActive ? "#ffffff" : "#7a748e",
                boxShadow: isActive ? "0 4px 12px rgba(109, 59, 245, 0.3)" : "none",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 18,
                  height: 18,
                  padding: "0 6px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  background: isActive ? "rgba(255, 255, 255, 0.25)" : "rgba(140, 95, 248, 0.12)",
                  color: isActive ? "#ffffff" : "#8c5ff8",
                }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {notification && (
        <div
          style={{
            marginBottom: 18,
            padding: "12px 18px",
            borderRadius: 12,
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)",
            color: "#059669",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <span>{notification}</span>
          <button
            type="button"
            onClick={() => setNotification("")}
            style={{ background: "transparent", border: "none", color: "#059669", cursor: "pointer", fontSize: 14 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Table Card Container */}
      <div className="analytics-card" style={{ padding: 0, overflow: "hidden" }}>
        {activeTab === "Pending Requests" ? (
          <RequestTable
            requests={pendingRequests}
            onView={setSelectedRequest}
            onCancel={cancelPendingRequest}
            onApproveScheme={setApprovingScheme}
            onDeclineScheme={handleDeclineScheme}
          />
        ) : (
          <RequestHistory requests={historyRequests} onView={setSelectedRequest} />
        )}
      </div>

      {showCreateModal && (
        <CreateRequestModal
          clients={mockClients}
          onClose={() => setShowCreateModal(false)}
          onSubmit={addRequest}
        />
      )}

      {selectedRequest && (
        <RequestDetailsModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />
      )}

      {approvingScheme && (
        <ApproveSchemeModal
          request={approvingScheme}
          onClose={() => setApprovingScheme(null)}
          onSubmit={handleApproveScheme}
        />
      )}
    </section>
  );
}

export function isEligibleSchemeRequest(req = {}) {
  if (!req) return false;
  const type = String(req.requestType || req.type || "").toLowerCase();
  return type.includes("scheme") || type.includes("service") || type.includes("enrollment");
}

