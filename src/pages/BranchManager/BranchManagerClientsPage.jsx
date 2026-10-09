import React, { useState, useMemo, useEffect } from "react";
import Icon from "../../components/Icon";
import SimpleModal from "../../components/SimpleModal";
import EditForm from "../../components/EditForm";
import ConfirmDialog from "../../components/ConfirmDialog";
import BranchManagerCreateRequestModal from "./BranchManagerCreateRequestModal";
import { apiFetch } from "../../services/apiClient";
import "./branchmanagerdashboard.css";

export default function BranchManagerClientsPage({
  clients = [],
  setClients,
  employeesList = [],
}) {
  const [activeTab, setActiveTab] = useState("active"); // "active" | "deleted"
  const [selectedClient, setSelectedClient] = useState(null);
  const [editClientValues, setEditClientValues] = useState(null);
  const [deleteTargetClient, setDeleteTargetClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState("all");
  const [notification, setNotification] = useState("");

  // Deleted Archive State
  const [deletedClients, setDeletedClients] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [archiveSearchQuery, setArchiveSearchQuery] = useState("");

  const [requestModalConfig, setRequestModalConfig] = useState({
    isOpen: false,
    initialCategory: "client",
    initialType: "",
    clientId: "",
  });

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
      console.warn("Could not fetch deleted clients for branch manager:", err);
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
        setNotification(`✓ Client "${clientName || 'Account'}" successfully restored to Branch Directory!`);
        setTimeout(() => setNotification(""), 4500);
        fetchDeletedClients();
        window.dispatchEvent(new Event("agni_clients_updated"));
      } else {
        alert(data.message || "Failed to restore client.");
      }
    } catch (err) {
      alert("Network error while restoring client.");
    }
  };

  const regions = useMemo(() => {
    return Array.from(new Set(clients.map((c) => c.region || c.branch))).filter(Boolean);
  }, [clients]);

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (selectedRegionFilter !== "all") {
        if (client.region !== selectedRegionFilter && client.branch !== selectedRegionFilter) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = client.name?.toLowerCase().includes(q);
        const matchCompany = (client.company || client.companyName)?.toLowerCase().includes(q);
        const matchRep = (client.salesRep || client.owner || client.salesPerson)?.toLowerCase().includes(q);
        const matchEmail = client.email?.toLowerCase().includes(q);
        const matchPhone = client.phone?.toLowerCase().includes(q);
        const matchManager = client.managerName?.toLowerCase().includes(q);
        if (!matchName && !matchCompany && !matchRep && !matchEmail && !matchPhone && !matchManager) return false;
      }
      return true;
    });
  }, [clients, selectedRegionFilter, searchQuery]);

  const filteredDeletedClients = useMemo(() => {
    if (!archiveSearchQuery.trim()) return deletedClients;
    const q = archiveSearchQuery.toLowerCase().trim();
    return deletedClients.filter((client) => {
      const matchName = (client.name || "").toLowerCase().includes(q);
      const matchCompany = (client.companyName || client.company || "").toLowerCase().includes(q);
      const matchEmail = (client.email || "").toLowerCase().includes(q);
      const matchOrig = (client.originalSalesPerson?.fullName || "").toLowerCase().includes(q);
      const matchLast = (client.lastSalesPerson?.fullName || "").toLowerCase().includes(q);
      const matchReason = (client.deleteReason || "").toLowerCase().includes(q);
      return matchName || matchCompany || matchEmail || matchOrig || matchLast || matchReason;
    });
  }, [deletedClients, archiveSearchQuery]);

  const stats = useMemo(() => {
    const total = clients.length;
    const totalRev = clients.reduce((sum, c) => {
      const num = parseFloat(String(c.revenue || c.totalPayment || "0").replace(/[^0-9.-]+/g, "")) || 0;
      return sum + num;
    }, 0);
    const uniqueReps = new Set(clients.map((c) => c.salesRep || c.owner || c.salesPerson)).size;
    return { total, totalRev, uniqueReps };
  }, [clients]);

  function openClientInfo(client) {
    setSelectedClient(client);
    setEditClientValues(null);
  }

  function closeClientInfo() {
    setSelectedClient(null);
    setEditClientValues(null);
  }

  function openDeleteConfirm(client) {
    setDeleteTargetClient(client);
  }

  function closeDeleteConfirm() {
    setDeleteTargetClient(null);
  }

  function handleDeleteClient(clientId) {
    if (setClients) {
      setClients((prev) => prev.filter((client) => client.id !== clientId));
    }
    if (selectedClient?.id === clientId) {
      setSelectedClient(null);
      setEditClientValues(null);
    }
  }

  function confirmDeleteClient() {
    if (!deleteTargetClient) return;
    handleDeleteClient(deleteTargetClient.id);
    closeDeleteConfirm();
  }

  function startClientEdit() {
    setEditClientValues(selectedClient);
  }

  function handleEditClientChange(event) {
    const { name, value } = event.target;
    setEditClientValues((prev) => ({ ...prev, [name]: value }));
  }

  function saveClientEdit() {
    if (setClients) {
      setClients((prev) =>
        prev.map((client) => (client.id === editClientValues.id ? editClientValues : client))
      );
    }
    setSelectedClient(editClientValues);
    setEditClientValues(null);
  }

  function cancelClientEdit() {
    setEditClientValues(null);
  }

  const selectedInitials = selectedClient
    ? (selectedClient.company || selectedClient.name || "CL")
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CL";

  return (
    <section className="bm-page-view">
      {/* Header Banner */}
      <div className="bm-header-banner">
        <div className="bm-header-info">
          <p className="bm-header-eyebrow">Client Relationship Management</p>
          <h1 className="bm-header-title">Regional Client Directory</h1>
          <p className="bm-header-subtitle">
            Oversee corporate enterprise accounts, client lifecycle progressions, portfolio reallocations, and historical audit archives.
          </p>
        </div>
        <button
          type="button"
          className="bm-btn-primary"
          style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}
          onClick={() =>
            setRequestModalConfig({
              isOpen: true,
              initialCategory: "client",
              initialType: "Edit Client",
              clientId: "",
            })
          }
        >
          <Icon name="plus" size={15} />
          <span>Create Request</span>
        </button>
      </div>

      {notification && (
        <div className="manager-alert-banner" style={{ marginBottom: 16 }}>
          <Icon name="checkCircle" size={16} />
          <span>{notification}</span>
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
          <span>Active Client Portfolios ({clients.length})</span>
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
          {/* Summary KPI Stats Ribbon */}
          <div className="bm-kpi-ribbon">
            <div className="analytics-card bm-kpi-tile">
              <div className="bm-kpi-tile-top">
                <span className="bm-kpi-tile-label">Total Accounts</span>
                <div className="bm-kpi-tile-icon">
                  <Icon name="clients" size={16} />
                </div>
              </div>
              <div>
                <strong className="bm-kpi-tile-value">{stats.total}</strong>
              </div>
            </div>

            <div className="analytics-card bm-kpi-tile">
              <div className="bm-kpi-tile-top">
                <span className="bm-kpi-tile-label">Handling Reps</span>
                <div className="bm-kpi-tile-icon" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
                  <Icon name="team" size={16} />
                </div>
              </div>
              <div>
                <strong className="bm-kpi-tile-value" style={{ color: "#3b82f6" }}>{stats.uniqueReps}</strong>
              </div>
            </div>

            <div className="analytics-card bm-kpi-tile">
              <div className="bm-kpi-tile-top">
                <span className="bm-kpi-tile-label">Contract Book</span>
                <div className="bm-kpi-tile-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
                  <Icon name="revenue" size={16} />
                </div>
              </div>
              <div>
                <strong className="bm-kpi-tile-value" style={{ color: "#10b981" }}>
                  ₹{stats.totalRev.toLocaleString("en-IN")}
                </strong>
              </div>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="analytics-card bm-toolbar-card">
            <div className="bm-toolbar-filters">
              <div className="bm-search-box">
                <span className="bm-search-icon">
                  <Icon name="search" size={15} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by client, company, rep, manager, email..."
                />
              </div>

              <select
                className="bm-filter-select"
                value={selectedRegionFilter}
                onChange={(e) => setSelectedRegionFilter(e.target.value)}
              >
                <option value="all">All Regions &amp; Branches</option>
                {regions.map((reg) => (
                  <option key={reg} value={reg}>
                    {reg}
                  </option>
                ))}
              </select>
            </div>

            <div className="bm-count-badge">
              Showing <strong>{filteredClients.length}</strong> of {clients.length} clients
            </div>
          </div>

          {/* Active Clients Table */}
          <div className="analytics-card bm-table-card">
            <div className="bm-table-scroll">
              <table className="bm-table">
                <thead>
                  <tr>
                    <th>CLIENT / COMPANY</th>
                    <th>ASSIGNED SALES REP</th>
                    <th>SERVICE PLAN</th>
                    <th>CONTRACT REVENUE</th>
                    <th style={{ textAlign: "right", whiteSpace: "nowrap" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const clientTitle = client.company || client.name || "Client Account";
                    const clientSubtitle = client.contactPerson && client.contactPerson !== clientTitle
                      ? `Contact: ${client.contactPerson}`
                      : client.email || "Corporate Account";

                    const revNum = Number(client.revenue || client.totalPayment || client.totalPaymentAmount || 0);
                    const hasTransfer = Array.isArray(client.transferLogs) && client.transferLogs.length > 0;

                    return (
                      <tr key={client.id}>
                        <td>
                          <div className="bm-client-cell">
                            <div className="bm-member-details">
                              <strong className="bm-client-name">{clientTitle}</strong>
                              <span className="bm-client-company">{clientSubtitle}</span>
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
                          <span className="bm-rep-tag">
                            <Icon name="user" size={12} />
                            <span>{client.salesRep || client.owner || client.salesPerson || "Unassigned"}</span>
                          </span>
                        </td>
                        <td>
                          <span className="stage-tag completed">
                            {client.service || client.scheme || "Standard"}
                          </span>
                        </td>
                        <td>
                          <strong className="bm-revenue-text">
                            ₹{revNum.toLocaleString("en-IN")}
                          </strong>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div className="bm-actions-cell" style={{ display: "inline-flex", gap: 6, flexWrap: "nowrap", alignItems: "center", justifyContent: "flex-end", whiteSpace: "nowrap" }}>
                            <button
                              className="bm-view-btn"
                              type="button"
                              title="View Profile Details"
                              onClick={() => openClientInfo(client)}
                            >
                              <Icon name="eye" size={13} />
                              <span>View</span>
                            </button>
                            <button
                              className="bm-action-btn edit"
                              type="button"
                              title="Edit Details / Submit Petition"
                              onClick={() => {
                                setRequestModalConfig({
                                  isOpen: true,
                                  initialCategory: "client",
                                  initialType: "Edit Client",
                                  clientId: String(client.id),
                                });
                              }}
                            >
                              <Icon name="edit" size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="bm-action-btn delete"
                              type="button"
                              title="Submit Offboarding Petition"
                              onClick={() => {
                                setRequestModalConfig({
                                  isOpen: true,
                                  initialCategory: "client",
                                  initialType: "Delete Client",
                                  clientId: String(client.id),
                                });
                              }}
                            >
                              <Icon name="trash" size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="bm-empty-state">
                        No client records match your search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* DELETED CLIENTS ARCHIVE TAB */
        <div>
          <div className="analytics-card bm-toolbar-card">
            <div className="bm-toolbar-filters">
              <div className="bm-search-box">
                <span className="bm-search-icon">
                  <Icon name="search" size={15} />
                </span>
                <input
                  type="text"
                  value={archiveSearchQuery}
                  onChange={(e) => setArchiveSearchQuery(e.target.value)}
                  placeholder="Search deleted clients by company, creator, last rep, reason..."
                />
              </div>

              {archiveSearchQuery && (
                <button
                  type="button"
                  className="bm-btn-secondary"
                  onClick={() => setArchiveSearchQuery("")}
                >
                  Clear Search
                </button>
              )}
            </div>

            <div className="bm-count-badge">
              Preserved in Database: <strong>{filteredDeletedClients.length} deleted client(s)</strong>
            </div>
          </div>

          <div className="analytics-card bm-table-card">
            <div className="bm-table-scroll">
              <table className="bm-table">
                <thead>
                  <tr>
                    <th>CLIENT / COMPANY</th>
                    <th>SERVICE SCHEME</th>
                    <th>CRM CREATED BY (ORIGINATOR)</th>
                    <th>LAST HELD BY (FINAL REP)</th>
                    <th>DELETED ON &amp; BY</th>
                    <th>DELETION REASON</th>
                    <th style={{ textAlign: "right" }}>ACTIONS</th>
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
                      <td colSpan={7} className="bm-empty-state">
                        {archiveSearchQuery
                          ? "No deleted clients match your search criteria."
                          : "No client accounts currently in the deleted archive."}
                      </td>
                    </tr>
                  ) : (
                    filteredDeletedClients.map((client) => {
                      const creatorName = client.originalSalesPerson?.fullName || client.salesPerson?.fullName || "Original Rep";
                      const lastRepName = client.lastSalesPerson?.fullName || client.salesPerson?.fullName || creatorName;
                      const deleterName = client.deletedByUser?.fullName || "Branch Manager / Owner";
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
                            <div className="bm-client-cell">
                              <div className="bm-member-details">
                                <strong
                                  className="bm-client-name"
                                  style={{ textDecoration: "line-through", opacity: 0.85 }}
                                >
                                  {client.companyName || client.name || "Client Account"}
                                </strong>
                                <span className="bm-client-company">
                                  {client.contactPerson || client.email || "Corporate Contact"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="stage-tag completed" style={{ opacity: 0.85 }}>
                              {client.serviceName || client.serviceType || client.service || "Standard"}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
                              👤 {creatorName}
                            </div>
                            <span style={{ fontSize: 11, color: "#64748b" }}>Registered Account</span>
                          </td>
                          <td>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#0f766e" }}>
                              📌 {lastRepName}
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
                              className="bm-btn-secondary"
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
        </div>
      )}

      {/* Client Detail / Edit Modal */}
      {selectedClient && (
        <SimpleModal onClose={closeClientInfo}>
          <div className="bm-modal-profile">
            <div className="bm-modal-avatar">{selectedInitials}</div>
            <div>
              <h2 className="bm-header-title">{selectedClient.name}</h2>
              <span className="bm-header-subtitle">{selectedClient.company || "Individual Account"}</span>
            </div>
          </div>

          {editClientValues ? (
            <div>
              <EditForm values={editClientValues} onChange={handleEditClientChange} />
              <div className="bm-modal-actions">
                <button className="bm-btn-secondary" type="button" onClick={cancelClientEdit}>
                  Cancel
                </button>
                <button className="bm-btn-primary" type="button" onClick={saveClientEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="bm-modal-info-grid">
                <div className="bm-modal-card">
                  <span className="bm-modal-card-label">Client Name</span>
                  <span className="bm-modal-card-val">{selectedClient.name}</span>
                </div>
                <div className="bm-modal-card">
                  <span className="bm-modal-card-label">Company / Organization</span>
                  <span className="bm-modal-card-val">{selectedClient.company || "—"}</span>
                </div>
                <div className="bm-modal-card">
                  <span className="bm-modal-card-label">Assigned Sales Representative</span>
                  <span className="bm-modal-card-val">{selectedClient.salesRep || "Unassigned"}</span>
                </div>
                <div className="bm-modal-card">
                  <span className="bm-modal-card-label">Managing Regional Lead</span>
                  <span className="bm-modal-card-val">{selectedClient.managerName || "Branch Direct"}</span>
                </div>
                <div className="bm-modal-card">
                  <span className="bm-modal-card-label">Territory / Region</span>
                  <span className="bm-modal-card-val">{selectedClient.region || selectedClient.branch}</span>
                </div>
                <div className="bm-modal-card">
                  <span className="bm-modal-card-label">Service Package</span>
                  <span className="bm-modal-card-val">{selectedClient.service || "Standard"}</span>
                </div>
                <div className="bm-modal-card">
                  <span className="bm-modal-card-label">Email Address</span>
                  <span className="bm-modal-card-val">{selectedClient.email}</span>
                </div>
                <div className="bm-modal-card">
                  <span className="bm-modal-card-label">Phone Number</span>
                  <span className="bm-modal-card-val bm-phone-text">
                    {selectedClient.phone}
                  </span>
                </div>
                <div className="bm-modal-card">
                  <span className="bm-modal-card-label">Onboarding Date</span>
                  <span className="bm-modal-card-val">
                    {selectedClient.startDate || (selectedClient.createdAt ? String(selectedClient.createdAt).split("T")[0] : "—")}
                  </span>
                </div>
                <div className="bm-modal-card">
                  <span className="bm-modal-card-label">Contract Valuation</span>
                  <span className="bm-modal-card-val" style={{ color: "#10b981", fontWeight: 700 }}>
                    ₹{Number(selectedClient.revenue || selectedClient.totalPayment || 0).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Transferred Account Mobility Card if applicable */}
                {(selectedClient.transferLogs?.length > 0 || (selectedClient.originalSalesPersonId && selectedClient.originalSalesPersonId !== selectedClient.salesPersonId)) && (
                  <div
                    className="bm-modal-card"
                    style={{
                      gridColumn: "1 / -1",
                      background: "rgba(59, 130, 246, 0.06)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    <span className="bm-modal-card-label" style={{ color: "#2563eb", fontWeight: 700 }}>
                      🔄 Client Transfer &amp; Quota Governance
                    </span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8, fontSize: 13 }}>
                      <div>
                        <span style={{ color: "#64748b", display: "block" }}>Original CRM Creator:</span>
                        <strong>{selectedClient.originalSalesPerson?.fullName || "Original Rep"}</strong>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          (Historical payments locked to original rep)
                        </div>
                      </div>
                      <div>
                        <span style={{ color: "#64748b", display: "block" }}>Current Assigned Custodian:</span>
                        <strong>{selectedClient.salesPerson?.fullName || selectedClient.salesRep || "Current Rep"}</strong>
                        <div style={{ fontSize: 11, color: "#10b981", marginTop: 2 }}>
                          (100% quota credit on collected pending &amp; upsells)
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bm-modal-actions">
                <button
                  className="bm-btn-primary"
                  type="button"
                  onClick={() => {
                    setRequestModalConfig({
                      isOpen: true,
                      initialCategory: "client",
                      initialType: "Transfer Client",
                      clientId: String(selectedClient.id),
                    });
                    closeClientInfo();
                  }}
                >
                  Transfer Portfolio
                </button>
                <button className="bm-btn-secondary" type="button" onClick={startClientEdit}>
                  Edit Account
                </button>
                <button
                  className="bm-btn-danger"
                  type="button"
                  onClick={() => {
                    openDeleteConfirm(selectedClient);
                  }}
                >
                  Delete Account
                </button>
              </div>
            </>
          )}
        </SimpleModal>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTargetClient && (
        <ConfirmDialog
          title="Delete Client Portfolio"
          message={`Are you sure you want to permanently delete the portfolio record for "${deleteTargetClient.name}"? This will deactivate their active pipeline and archive their history.`}
          confirmLabel="Delete Account"
          cancelLabel="Cancel"
          danger
          onConfirm={confirmDeleteClient}
          onCancel={closeDeleteConfirm}
        />
      )}

      {/* Unified Hierarchical Request Modal */}
      {requestModalConfig.isOpen && (
        <BranchManagerCreateRequestModal
          onClose={() => setRequestModalConfig({ isOpen: false, initialCategory: "client", initialType: "", clientId: "" })}
          onSubmit={(newRequest) => {
            setNotification(`✓ Change request petition ${newRequest.id} submitted successfully to Owner.`);
            setTimeout(() => setNotification(""), 4500);
          }}
          clients={clients}
          staffMembers={employeesList}
          initialCategory={requestModalConfig.initialCategory}
          initialType={requestModalConfig.initialType}
          initialClientId={requestModalConfig.clientId}
        />
      )}
    </section>
  );
}
