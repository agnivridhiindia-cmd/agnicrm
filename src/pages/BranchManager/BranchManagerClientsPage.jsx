import React, { useState, useMemo } from "react";
import Icon from "../../components/Icon";
import SimpleModal from "../../components/SimpleModal";
import EditForm from "../../components/EditForm";
import ConfirmDialog from "../../components/ConfirmDialog";

export default function BranchManagerClientsPage({
  clients = [],
  setClients,
}) {
  const [selectedClient, setSelectedClient] = useState(null);
  const [editClientValues, setEditClientValues] = useState(null);
  const [deleteTargetClient, setDeleteTargetClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegionFilter, setSelectedRegionFilter] = useState("all");

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
        const matchCompany = client.company?.toLowerCase().includes(q);
        const matchRep = client.salesRep?.toLowerCase().includes(q);
        const matchEmail = client.email?.toLowerCase().includes(q);
        const matchPhone = client.phone?.toLowerCase().includes(q);
        const matchManager = client.managerName?.toLowerCase().includes(q);
        if (!matchName && !matchCompany && !matchRep && !matchEmail && !matchPhone && !matchManager) return false;
      }
      return true;
    });
  }, [clients, selectedRegionFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = clients.length;
    const totalRev = clients.reduce((sum, c) => {
      const num = parseFloat(String(c.revenue || "0").replace(/[^0-9.-]+/g, "")) || 0;
      return sum + num;
    }, 0);
    const uniqueReps = new Set(clients.map((c) => c.salesRep)).size;
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
    setClients((prev) => prev.filter((client) => client.id !== clientId));
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
    setClients((prev) =>
      prev.map((client) => (client.id === editClientValues.id ? editClientValues : client))
    );
    setSelectedClient(editClientValues);
    setEditClientValues(null);
  }

  function cancelClientEdit() {
    setEditClientValues(null);
  }

  const selectedInitials = selectedClient?.name
    ? selectedClient.name
        .split(" ")
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
          <p className="bm-header-eyebrow">Enterprise Client Accounts</p>
          <h1 className="bm-header-title">Branch Client Directory</h1>
          <p className="bm-header-subtitle">
            Comprehensive directory of commercial client accounts managed across all sales teams in your branch.
          </p>
        </div>
      </div>

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
            <span className="bm-kpi-tile-sub">Active Client Portfolios</span>
          </div>
        </div>

        <div className="analytics-card bm-kpi-tile">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Assigned Reps</span>
            <div className="bm-kpi-tile-icon blue">
              <Icon name="team" size={16} />
            </div>
          </div>
          <div>
            <strong className="bm-kpi-tile-value">{stats.uniqueReps}</strong>
            <span className="bm-kpi-tile-sub">Account Handling Reps</span>
          </div>
        </div>

        <div className="analytics-card bm-kpi-tile">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Branch Volume</span>
            <div className="bm-kpi-tile-icon green">
              <Icon name="wallet" size={16} />
            </div>
          </div>
          <div>
            <strong className="bm-kpi-tile-value">₹{stats.totalRev.toLocaleString("en-IN")}k</strong>
            <span className="bm-kpi-tile-sub">Realized Contract Revenue</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="analytics-card bm-toolbar-card">
        <div className="bm-toolbar-filters">
          <div className="bm-search-box">
            <span className="bm-search-icon">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client, company, rep, manager, or email..."
            />
          </div>

          {regions.length > 0 && (
            <select
              className="bm-filter-select"
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
            >
              <option value="all">All Territories / Branches</option>
              {regions.map((reg) => (
                <option key={reg} value={reg}>
                  {reg}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="bm-count-badge">
          <span>Showing</span>
          <strong>{filteredClients.length}</strong>
          <span>of {clients.length} clients</span>
        </div>
      </div>

      {/* Clients Table Card */}
      <div className="analytics-card bm-table-card">
        <div className="bm-table-scroll">
          <table className="bm-table">
            <thead>
              <tr>
                <th>Client & Company</th>
                <th>Assigned Rep</th>
                <th>Region & Manager</th>
                <th>Contact Info</th>
                <th>Service Tier</th>
                <th>Contract Revenue</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => {
                const initials = client.name
                  ? client.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "CL";

                return (
                  <tr key={client.id}>
                    <td>
                      <div className="bm-member-avatar-cell">
                        <div className="bm-member-avatar">{initials}</div>
                        <div className="bm-member-details">
                          <strong className="bm-member-name">{client.name}</strong>
                          <span className="bm-member-branch">
                            {client.company || "Individual Account"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="bm-rep-pill">
                        <Icon name="user" size={12} />
                        {client.salesRep || "Unassigned"}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong>{client.region || `${client.branch} Branch`}</strong>
                        <div className="bm-date-text">
                          Mgr: {client.managerName || "Direct"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{client.email}</div>
                        <div className="bm-phone-text">
                          {client.phone}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="bm-service-pill">
                        {client.service || "Standard"}
                      </span>
                    </td>
                    <td>
                      <strong className="bm-revenue-text">
                        {client.revenue || "—"}
                      </strong>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="bm-actions-cell">
                        <button
                          className="bm-view-btn"
                          type="button"
                          onClick={() => openClientInfo(client)}
                        >
                          <Icon name="eye" size={13} />
                          <span>View</span>
                        </button>
                        <button
                          className="bm-btn-danger"
                          type="button"
                          onClick={() => openDeleteConfirm(client)}
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
                  <td colSpan={7} className="bm-empty-state">
                    No client records match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                  <span className="bm-modal-card-label">Contract Revenue Value</span>
                  <span className="bm-modal-card-val bm-revenue-text">
                    {selectedClient.revenue && selectedClient.revenue !== "0"
                      ? (selectedClient.revenue.includes("₹") ? selectedClient.revenue : `₹${Number(selectedClient.revenue).toLocaleString("en-IN")}`)
                      : (selectedClient.totalPayment ? `₹${Number(selectedClient.totalPayment).toLocaleString("en-IN")}` : "—")}
                  </span>
                </div>
              </div>

              <div className="bm-modal-actions">
                <button className="bm-btn-primary" type="button" onClick={startClientEdit}>
                  Edit Client Profile
                </button>
              </div>
            </>
          )}
        </SimpleModal>
      )}

      {deleteTargetClient && (
        <SimpleModal onClose={closeDeleteConfirm} showCloseButton={false}>
          <ConfirmDialog
            title="Delete Client Account?"
            message={`Are you sure you want to remove ${deleteTargetClient.name} (${deleteTargetClient.company || "Client"}) from branch clients?`}
            confirmLabel="Delete Account"
            onConfirm={confirmDeleteClient}
            onCancel={closeDeleteConfirm}
          />
        </SimpleModal>
      )}
    </section>
  );
}
