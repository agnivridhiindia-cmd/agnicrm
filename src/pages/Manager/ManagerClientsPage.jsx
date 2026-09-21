import React, { useState, useMemo } from "react";
import Icon from "../../components/Icon";
import SimpleModal from "../../components/SimpleModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import ManagerClientInfoModal from "./ManagerClientInfoModal";
import { normalizeSalesPersonName } from "../../utils/branchHelper";
import { parseNetRevenue, parseRevenueValue, formatCurrency } from "../../utils/paymentHelpers";

export default function ManagerClientsPage({
  clients = [],
  setClients,
  salesPeople = [],
}) {
  const [selectedSalesPerson, setSelectedSalesPerson] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [deleteTargetClient, setDeleteTargetClient] = useState(null);

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

  const stats = useMemo(() => {
    const total = clients.length;
    const totalRevenue = clients.reduce((sum, c) => {
      const rawVal = c.revenue || c.totalPayment || c.amount || c.paymentReceived || 0;
      const netVal = parseNetRevenue(rawVal);
      return sum + netVal;
    }, 0);
    return { total, totalRevenue };
  }, [clients]);

  function handleDeleteClient(clientId) {
    if (setClients) {
      setClients((prev) => prev.filter((client) => client.id !== clientId));
    }
    if (selectedClient?.id === clientId) {
      setSelectedClient(null);
    }
  }

  function confirmDeleteClient() {
    if (!deleteTargetClient) return;
    handleDeleteClient(deleteTargetClient.id);
    setDeleteTargetClient(null);
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
      </div>

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
                const clientNameStr = client.name || client.company || "Client Account";
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

                return (
                  <tr key={client.id}>
                    <td>
                      <div className="manager-member-avatar-cell">
                        <div className="manager-member-avatar">{initials}</div>
                        <div className="manager-member-details">
                          <strong className="manager-member-name">{clientNameStr}</strong>
                          <span className="manager-member-branch">
                            {client.company || client.name || "Corporate Account"}
                          </span>
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
                      <div style={{ display: "inline-flex", gap: 8 }}>
                        <button
                          className="manager-view-btn"
                          type="button"
                          onClick={() => setSelectedClient(client)}
                        >
                          <Icon name="eye" size={13} />
                          <span>View</span>
                        </button>
                        <button
                          className="manager-btn-danger"
                          type="button"
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
    </section>
  );
}
