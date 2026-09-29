import React, { useState, useMemo, useEffect } from "react";
import Icon from "../../components/Icon";
import SimpleModal from "../../components/SimpleModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import ManagerClientInfoModal from "./ManagerClientInfoModal";
import ManagerCreateRequestModal from "./ManagerCreateRequestModal";
import { normalizeSalesPersonName } from "../../utils/branchHelper";
import { parseNetRevenue, parseRevenueValue, formatCurrency } from "../../utils/paymentHelpers";
import { apiFetch } from "../../services/apiClient";
import { exportClientsToCSV, downloadClientDossierPDF } from "../../utils/exportHelpers";

export default function ManagerClientsPage({
  clients = [],
  setClients,
  salesPeople = [],
}) {
  const [activeViewTab, setActiveViewTab] = useState("active"); // "active" | "deleted"
  const [selectedSalesPerson, setSelectedSalesPerson] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [deleteTargetClient, setDeleteTargetClient] = useState(null);
  const [notification, setNotification] = useState("");

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
      console.warn("Could not fetch deleted clients for manager:", err);
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

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (!client) return false;
      if (selectedSalesPerson !== "all") {
        const targetStr = String(selectedSalesPerson).toLowerCase().trim();
        const repName = String(client.salesRep || client.owner || client.salesPerson || "").toLowerCase().trim();
        const repId = String(client.assignedSalesPersonId || "");
        if (repName !== targetStr && repId !== targetStr && !repName.includes(targetStr)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (client.name || "").toLowerCase().includes(q);
        const matchCompany = (client.company || "").toLowerCase().includes(q);
        const matchRep = (client.salesRep || client.owner || client.salesPerson || "").toLowerCase().includes(q);
        const matchEmail = (client.email || "").toLowerCase().includes(q);
        const matchPhone = (client.phone || "").toLowerCase().includes(q);
        const matchService = (client.service || client.scheme || "").toLowerCase().includes(q);
        if (!matchName && !matchCompany && !matchRep && !matchEmail && !matchPhone && !matchService) return false;
      }
      return true;
    });
  }, [clients, selectedSalesPerson, searchQuery]);

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
    const totalRevenue = clients.reduce((sum, c) => {
      const rawVal = c.revenue || c.totalPayment || c.amount || c.paymentReceived || 0;
      const netVal = parseNetRevenue(rawVal);
      return sum + netVal;
    }, 0);
    return { total, totalRevenue };
  }, [clients]);

  async function confirmDeleteClient() {
    if (!deleteTargetClient) return;
    try {
      const res = await apiFetch(`/clients/${deleteTargetClient.id}`, {
        method: "DELETE",
        body: { reason: "Soft-deleted by Sales Manager" },
      });
      if (res.ok) {
        setNotification(`✓ Client "${deleteTargetClient.name || 'Account'}" moved to Deleted Archive.`);
        setTimeout(() => setNotification(""), 4500);
        if (setClients) {
          setClients((prev) => prev.filter((c) => c.id !== deleteTargetClient.id));
        }
        fetchDeletedClients();
        window.dispatchEvent(new Event("agni_clients_updated"));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Failed to delete client.");
      }
    } catch (e) {
      alert("Network error while deleting client.");
    } finally {
      setDeleteTargetClient(null);
    }
  }

  function handleSaveClientEdit(updatedClient) {
    if (setClients) {
      setClients((prev) =>
        prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
      );
    }
    setSelectedClient(updatedClient);
  }

  return (
    <section className="manager-page-view">
      {/* Header Banner */}
      <div className="manager-header-banner">
        <div className="manager-header-info">
          <p className="manager-header-eyebrow">Client Portfolio</p>
          <h1 className="manager-header-title">Branch Client Directory</h1>
          <p className="manager-header-subtitle">
            Overview of client accounts managed by regional sales representatives in your branch.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            className="manager-btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
            title="Download client directory as spreadsheet"
            onClick={() => exportClientsToCSV(activeViewTab === "active" ? filteredClients : filteredDeletedClients, activeViewTab === "active" ? "Branch_Clients_Register" : "Deleted_Clients_Archive")}
          >
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            className="manager-btn-primary"
            onClick={() =>
              setRequestModalConfig({
                isOpen: true,
                initialCategory: "client",
                initialType: "",
                clientId: "",
              })
            }
          >
            <Icon name="plus" size={15} />
            <span>Create Request</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="manager-alert-banner" style={{ marginBottom: 14 }}>
          <Icon name="checkCircle" size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* KPI Ribbon */}
      <div className="manager-kpi-ribbon">
        <div className="analytics-card manager-kpi-tile">
          <div className="manager-kpi-tile-top">
            <span className="manager-kpi-tile-label">Total Accounts</span>
            <div className="manager-kpi-tile-icon">
              <Icon name="clients" size={16} />
            </div>
          </div>
          <div>
            <strong className="manager-kpi-tile-value">{clients.length}</strong>
            <span className="manager-kpi-tile-sub">Managed Portfolio</span>
          </div>
        </div>

        <div className="analytics-card manager-kpi-tile">
          <div className="manager-kpi-tile-top">
            <span className="manager-kpi-tile-label">Assigned Reps</span>
            <div className="manager-kpi-tile-icon" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
              <Icon name="team" size={16} />
            </div>
          </div>
          <div>
            <strong className="manager-kpi-tile-value" style={{ color: "#3b82f6" }}>{salesPeople.length}</strong>
            <span className="manager-kpi-tile-sub">Active Sales Handlers</span>
          </div>
        </div>

        <div className="analytics-card manager-kpi-tile">
          <div className="manager-kpi-tile-top">
            <span className="manager-kpi-tile-label">Branch Volume</span>
            <div className="manager-kpi-tile-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <Icon name="wallet" size={16} />
            </div>
          </div>
          <div>
            <strong className="manager-kpi-tile-value" style={{ color: "#10b981" }}>{formatCurrency(stats.totalRevenue)}</strong>
            <span className="manager-kpi-tile-sub">Acquired Contract Revenue</span>
          </div>
        </div>
      </div>

      {/* Directory vs Deleted Archive Tab Selector */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <button
          type="button"
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            border: activeViewTab === "active" ? "1px solid #8c5ff8" : "1px solid rgba(255,255,255,0.08)",
            background: activeViewTab === "active" ? "rgba(140, 95, 248, 0.16)" : "transparent",
            color: activeViewTab === "active" ? "#fff" : "#94a3b8",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13.5px"
          }}
          onClick={() => setActiveViewTab("active")}
        >
          <Icon name="clients" size={15} />
          <span>Active Clients ({clients.length})</span>
        </button>

        <button
          type="button"
          style={{
            padding: "8px 18px",
            borderRadius: "8px",
            border: activeViewTab === "deleted" ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.08)",
            background: activeViewTab === "deleted" ? "rgba(239, 68, 68, 0.16)" : "transparent",
            color: activeViewTab === "deleted" ? "#ef4444" : "#94a3b8",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13.5px"
          }}
          onClick={() => {
            setActiveViewTab("deleted");
            fetchDeletedClients();
          }}
        >
          <Icon name="trash" size={15} />
          <span>Deleted Clients Archive ({deletedClients.length})</span>
        </button>
      </div>

      {activeViewTab === "active" ? (
        <>
          {/* Search & Filter Toolbar */}
          <div className="analytics-card manager-toolbar-card">
            <div className="manager-toolbar-filters">
              <div className="manager-search-box">
                <span className="manager-search-icon">
                  <Icon name="search" size={14} />
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by client, company, rep, email, or phone..."
                />
              </div>

              <select
                className="manager-filter-select"
                value={selectedSalesPerson}
                onChange={(event) => setSelectedSalesPerson(event.target.value)}
              >
                <option value="all">All Sales Persons</option>
                {salesPeople.map((person, idx) => {
                  const pName = typeof person === "string" ? person : person.name;
                  const pVal = pName;
                  return (
                    <option key={person.id || idx} value={pVal}>
                      {pName}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="manager-count-badge">
              <span>Showing</span>
              <strong>{filteredClients.length}</strong>
              <span>of {clients.length} clients</span>
            </div>
          </div>

          {/* Clients Table Card */}
          <div className="analytics-card manager-table-card">
            <div className="manager-table-scroll">
              <table className="manager-team-table">
                <thead>
                  <tr>
                    <th>Client &amp; Company</th>
                    <th>Assigned Rep</th>
                    <th>Contact Info</th>
                    <th>Service Plan</th>
                    <th>Revenue</th>
                    <th>Onboarding</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => {
                    const clientNameStr = client.company || client.name || "Client Account";
                    const initials = clientNameStr
                      ? clientNameStr
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "CL";

                    const repName = normalizeSalesPersonName(client.salesRep || client.owner || client.salesPerson || "Sales Executive");
                    const serviceName = client.service || client.scheme || client.serviceName || "Consultancy";
                    const rawRev = parseRevenueValue(client.paymentReceived) || parseRevenueValue(client.revenue) || parseRevenueValue(client.totalPayment) || parseRevenueValue(client.amount) || 0;
                    const netVal = parseNetRevenue(rawRev);
                    const revText = netVal > 0 ? formatCurrency(netVal) : (rawRev > 0 ? formatCurrency(parseNetRevenue(rawRev)) : "—");
                    const onbDate = client.startDate || (client.createdAt ? String(client.createdAt).split("T")[0] : "2025");
                    const hasTransfer = Array.isArray(client.transferLogs) && client.transferLogs.length > 0;

                    return (
                      <tr key={client.id}>
                        <td>
                          <div className="manager-member-avatar-cell">
                            <div className="manager-member-avatar">{initials}</div>
                            <div className="manager-member-details">
                              <strong className="manager-member-name">{clientNameStr}</strong>
                              <span className="manager-member-branch">
                                Contact: {client.contactPerson || client.name || "N/A"}
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
                          <span className="manager-rep-pill">
                            <Icon name="user" size={12} />
                            {repName}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span>{client.email || "—"}</span>
                            <span style={{ fontSize: 12, color: "#7a748e", fontFamily: "monospace" }}>
                              {client.phone || "—"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="manager-service-pill">
                            {serviceName}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontSize: 13.5, fontWeight: 800, color: "#10b981" }}>
                            {revText}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontSize: 12.5, color: "#7a748e" }}>{onbDate}</span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            <button
                              className="manager-view-btn"
                              type="button"
                              title="View Profile Details"
                              onClick={() => setSelectedClient(client)}
                            >
                              <Icon name="eye" size={13} />
                              <span>View</span>
                            </button>
                            <button
                              className="manager-view-btn"
                              type="button"
                              title="Download Client Dossier (PDF)"
                              style={{ color: "#10b981", borderColor: "rgba(16, 185, 129, 0.25)" }}
                              onClick={() => downloadClientDossierPDF(client)}
                            >
                              <span>📄</span>
                              <span>Dossier</span>
                            </button>
                            <button
                              className="manager-view-btn"
                              type="button"
                              title="Request Edit"
                              onClick={() =>
                                setRequestModalConfig({
                                  isOpen: true,
                                  initialCategory: "client",
                                  initialType: "Edit Client",
                                  clientId: client.id,
                                })
                              }
                            >
                              <Icon name="document" size={13} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="manager-view-btn"
                              type="button"
                              title="Request Client Transfer"
                              style={{ color: "#8c5ff8", borderColor: "rgba(140, 95, 248, 0.25)" }}
                              onClick={() =>
                                setRequestModalConfig({
                                  isOpen: true,
                                  initialCategory: "client",
                                  initialType: "Transfer Client",
                                  clientId: client.id,
                                })
                              }
                            >
                              <Icon name="team" size={13} />
                              <span>Transfer</span>
                            </button>
                            <button
                              className="manager-btn-danger"
                              type="button"
                              title="Delete Client Account"
                              onClick={() => setDeleteTargetClient(client)}
                            >
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredClients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="manager-empty-state">
                        No client records found matching your filters.
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
          <div className="analytics-card manager-toolbar-card">
            <div className="manager-toolbar-filters">
              <div className="manager-search-box">
                <span className="manager-search-icon">
                  <Icon name="search" size={14} />
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
                  className="manager-btn-secondary"
                  onClick={() => setArchiveSearchQuery("")}
                >
                  Clear Search
                </button>
              )}
            </div>

            <div className="manager-count-badge">
              <span>Preserved in Database:</span>
              <strong>{filteredDeletedClients.length} deleted client(s)</strong>
            </div>
          </div>

          <div className="analytics-card manager-table-card">
            <div className="manager-table-scroll">
              <table className="manager-team-table">
                <thead>
                  <tr>
                    <th>Client &amp; Company</th>
                    <th>Service Scheme</th>
                    <th>CRM Created By (Originator)</th>
                    <th>Last Held By (Final Rep)</th>
                    <th>Deleted On &amp; By</th>
                    <th>Deletion Reason</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedLoading ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                        Loading deleted client archive...
                      </td>
                    </tr>
                  ) : filteredDeletedClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="manager-empty-state">
                        {archiveSearchQuery
                          ? "No deleted clients match your search criteria."
                          : "No client accounts currently in the deleted archive."}
                      </td>
                    </tr>
                  ) : (
                    filteredDeletedClients.map((client) => {
                      const clientNameStr = client.companyName || client.name || "Client Account";
                      const initials = clientNameStr
                        ? clientNameStr
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()
                        : "CL";

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
                            <div className="manager-member-avatar-cell">
                              <div
                                className="manager-member-avatar"
                                style={{
                                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3))",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                }}
                              >
                                {initials}
                              </div>
                              <div className="manager-member-details">
                                <strong className="manager-member-name" style={{ textDecoration: "line-through", opacity: 0.85 }}>
                                  {clientNameStr}
                                </strong>
                                <span className="manager-member-branch">
                                  {client.contactPerson || client.email || "Corporate Contact"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="manager-service-pill">
                              {client.serviceName || "Consultancy"}
                            </span>
                          </td>
                          <td>
                            <span className="manager-rep-pill" style={{ color: "#3b82f6", borderColor: "rgba(59, 130, 246, 0.25)" }}>
                              <Icon name="user" size={12} />
                              {creatorName}
                            </span>
                          </td>
                          <td>
                            <span className="manager-rep-pill" style={{ color: "#f59e0b", borderColor: "rgba(245, 158, 11, 0.25)" }}>
                              <Icon name="user" size={12} />
                              {lastRepName}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#ef4444" }}>{deleterName}</span>
                              <span style={{ fontSize: 11.5, color: "#64748b" }}>{delDateStr}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic" }}>
                              "{client.deleteReason || "Direct deletion"}"
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              type="button"
                              className="manager-btn-primary"
                              style={{
                                padding: "6px 14px",
                                fontSize: "12px",
                                background: "#10b981",
                                borderColor: "#10b981",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                              title="Restore account to Active Directory"
                              onClick={() => handleRestoreClient(client.id, clientNameStr)}
                            >
                              <Icon name="checkCircle" size={13} />
                              <span>Restore Client</span>
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

      {selectedClient && (
        <ManagerClientInfoModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onSave={handleSaveClientEdit}
        />
      )}

      {deleteTargetClient && (
        <SimpleModal onClose={() => setDeleteTargetClient(null)} showCloseButton={false}>
          <ConfirmDialog
            title="Delete Client Account?"
            message={`Are you sure you want to remove ${deleteTargetClient.name} (${deleteTargetClient.company || "Client"}) from the active client roster?`}
            confirmLabel="Delete Account"
            onConfirm={confirmDeleteClient}
            onCancel={() => setDeleteTargetClient(null)}
          />
        </SimpleModal>
      )}

      {requestModalConfig.isOpen && (
        <ManagerCreateRequestModal
          salesPeople={salesPeople}
          clients={clients}
          initialCategory={requestModalConfig.initialCategory || "client"}
          initialType={requestModalConfig.initialType || ""}
          initialClientId={requestModalConfig.clientId || ""}
          onClose={() =>
            setRequestModalConfig({
              isOpen: false,
              initialCategory: "client",
              initialType: "",
              clientId: "",
            })
          }
          onSubmit={(newReq) => {
            const target = newReq.clientName || newReq.company || "Client Account";
            setNotification(`✓ Created "${newReq.requestType}" petition for ${target}. Available in Requests tab.`);
            setTimeout(() => setNotification(""), 4500);
            window.dispatchEvent(new CustomEvent("agni_requests_updated"));
            window.dispatchEvent(new CustomEvent("agni_pending_updated"));
          }}
        />
      )}
    </section>
  );
}
