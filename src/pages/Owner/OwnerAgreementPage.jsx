import React, { useState, useEffect, useMemo } from "react";
import Icon from "../../components/Icon";
import {
  agreementService,
  AGREEMENT_STATUSES,
  normalizeAgreementData,
} from "../../services/agreementService";
import AgreementDocumentViewer from "../Agreement/components/AgreementDocumentViewer";

const PAGE_SIZE = 12;

function formatYYYYMMDD(dateVal) {
  if (!dateVal) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }
  const str = String(dateVal);
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}${isoMatch[2]}${isoMatch[3]}`;

  const slashMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) return `${slashMatch[3]}${slashMatch[2]}${slashMatch[1]}`;

  const parsed = new Date(dateVal);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const d = String(parsed.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }
  return "20260315";
}

export default function OwnerAgreementPage({ clients = [], showToast }) {
  const [agreements, setAgreements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [schemeFilter, setSchemeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [viewingAgreement, setViewingAgreement] = useState(null);

  // Load agreements from agreement service
  useEffect(() => {
    async function fetchAgreements() {
      try {
        const list = await agreementService.getAgreements();
        setAgreements(list || []);
      } catch (e) {
        console.error("Failed to load agreements:", e);
      }
    }
    fetchAgreements();
  }, []);

  // Map each client to their agreement record
  const clientAgreementRows = useMemo(() => {
    return clients.map((client, index) => {
      const match = agreements.find(
        (a) =>
          a.clientId === client.id ||
          a.applicationId === client.appId ||
          a.crmId === client.id ||
          (a.client?.companyName && client.company && a.client.companyName.toLowerCase() === client.company.toLowerCase())
      );

      const scheme = client.serviceName || client.scheme || client.serviceType || "PMEGP";
      const status = match?.status || match?.agreement?.status || AGREEMENT_STATUSES.READY;
      const agreementDate = match?.agreement?.date || match?.date || client.serviceStart || "2026-03-15";
      const dateFormatted = formatYYYYMMDD(agreementDate);

      // Company already has 500 agreements; continuing numbers start at 501
      const seqNum = 500 + index + 1;
      const refId = `AGR-${dateFormatted}-${seqNum}`;

      const rawAgr = match
        ? { ...normalizeAgreementData(match), id: refId }
        : normalizeAgreementData({
            id: refId,
            clientId: client.id,
            applicationId: client.appId || `CRM-${client.id}`,
            client: {
              clientName: client.name,
              companyName: client.company,
              email: client.email,
              phone: client.phone,
              address: client.address || "Corporate Suite, Sector 62",
            },
            scheme: {
              name: scheme,
              serviceType: client.serviceType || scheme,
            },
            agreement: {
              templateName: `${scheme} Engagement Agreement`,
              date: agreementDate,
              status: status,
            },
            commercial: {
              totalServiceFee: client.totalPayment || 50000,
              advancePayment: client.paymentReceived || 25000,
            },
          });

      return {
        client,
        agreement: rawAgr,
        status,
        refId,
        scheme,
        date: agreementDate,
      };
    });
  }, [clients, agreements]);

  // Filter agreements
  const filteredRows = useMemo(() => {
    return clientAgreementRows.filter((row) => {
      const sLower = searchTerm.toLowerCase().trim();
      const clientName = (row.client.name || "").toLowerCase();
      const companyName = (row.client.company || "").toLowerCase();
      const refId = (row.refId || "").toLowerCase();
      const schemeName = (row.scheme || "").toLowerCase();

      const searchOk =
        !sLower ||
        clientName.includes(sLower) ||
        companyName.includes(sLower) ||
        refId.includes(sLower) ||
        schemeName.includes(sLower);

      const statusOk = !statusFilter || row.status.toLowerCase() === statusFilter.toLowerCase();
      const schemeOk = !schemeFilter || row.scheme === schemeFilter;

      return searchOk && statusOk && schemeOk;
    });
  }, [clientAgreementRows, searchTerm, statusFilter, schemeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Statistics
  const totalAgreements = clientAgreementRows.length;
  const readyCount = clientAgreementRows.filter((r) => r.status === AGREEMENT_STATUSES.READY).length;
  const sentCount = clientAgreementRows.filter((r) => r.status === AGREEMENT_STATUSES.SENT).length;
  const pendingCount = clientAgreementRows.filter((r) => r.status === AGREEMENT_STATUSES.PENDING).length;

  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setSchemeFilter("");
    setPage(1);
  };

  return (
    <section className="owner-page-view">
      {/* Header Banner */}
      <div className="owner-header-banner">
        <div className="owner-header-info">
          <p className="owner-header-eyebrow">Enterprise Contracts &amp; Compliance</p>
          <h1 className="owner-header-title">Executive Client Agreements</h1>
          <p className="owner-header-subtitle">
            Review formal engagement agreements, statutory mandates, clause details, and delivery dispatches across all client portfolios.
          </p>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="owner-kpi-ribbon">
        <div className="owner-kpi-tile purple">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Total Mandates</span>
            <div className="owner-kpi-tile-icon purple">
              <Icon name="agreement" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value">{totalAgreements}</strong>
          </div>
        </div>

        <div className="owner-kpi-tile blue">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Ready / Executed</span>
            <div className="owner-kpi-tile-icon blue">
              <Icon name="checkCircle" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value" style={{ color: "#3b82f6" }}>
              {readyCount}
            </strong>
          </div>
        </div>

        <div className="owner-kpi-tile green">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Dispatched to Client</span>
            <div className="owner-kpi-tile-icon green">
              <Icon name="arrowUp" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value" style={{ color: "#10b981" }}>
              {sentCount}
            </strong>
          </div>
        </div>

        <div className="owner-kpi-tile amber">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Pending Execution</span>
            <div className="owner-kpi-tile-icon amber">
              <Icon name="overview" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value" style={{ color: "#f59e0b" }}>
              {pendingCount}
            </strong>
          </div>
        </div>
      </div>

      {/* Toolbar Filter Card */}
      <div className="analytics-card owner-toolbar-card">
        <div className="owner-toolbar-filters">
          <div className="owner-search-box">
            <span className="owner-search-icon">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              placeholder="Search by client, company, agreement ref, scheme..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <label className="field-label" style={{ margin: 0 }}>
            <span>Agreement Status:</span>
            <select
              className="owner-filter-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="Ready">Ready</option>
              <option value="Sent">Sent</option>
              <option value="Pending">Pending</option>
            </select>
          </label>

          <label className="field-label" style={{ margin: 0 }}>
            <span>Service Scheme:</span>
            <select
              className="owner-filter-select"
              value={schemeFilter}
              onChange={(e) => {
                setSchemeFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Schemes</option>
              <option value="PMEGP">PMEGP Scheme</option>
              <option value="MSME">MSME Scheme</option>
              <option value="Stand-Up India">Stand-Up India</option>
              <option value="Private Funding">Private Funding</option>
              <option value="CMEGP">CMEGP</option>
            </select>
          </label>

          {(searchTerm || statusFilter || schemeFilter) && (
            <button
              type="button"
              className="owner-btn-secondary"
              onClick={handleResetFilters}
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="owner-count-badge">
          <span>Showing</span>
          <strong>{filteredRows.length}</strong>
          <span>of {clientAgreementRows.length} agreements</span>
        </div>
      </div>

      {/* Agreements Table Card */}
      <div className="analytics-card owner-table-card">
        <div className="owner-table-scroll">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Agreement Ref</th>
                <th>Client &amp; Company</th>
                <th>Service Scheme</th>
                <th>Agreement Status</th>
                <th>Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="owner-empty-state">
                    No client agreements found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => {
                  const { client, agreement, status, refId, scheme, date } = row;
                  const initials = client.name
                    ? client.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "CL";

                  const statusClass = status.toLowerCase();

                  return (
                    <tr key={client.id || refId}>
                      <td>
                        <span className="owner-rep-pill" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {refId}
                        </span>
                      </td>
                      <td>
                        <div className="owner-member-avatar-cell">
                          <div className="owner-member-avatar">{initials}</div>
                          <div className="owner-member-details">
                            <strong className="owner-member-name">{client.name}</strong>
                            <span className="owner-member-branch">
                              {client.company || "Enterprise Account"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="owner-service-pill">{scheme}</span>
                      </td>
                      <td>
                        <span className={`owner-status-pill ${statusClass === "sent" ? "approved" : "paid"}`}>
                          ● {status}
                        </span>
                      </td>
                      <td>
                        <span className="owner-date-text">{date}</span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div className="owner-actions-cell">
                          <button
                            className="owner-view-btn"
                            type="button"
                            onClick={() => setViewingAgreement(agreement)}
                          >
                            <Icon name="agreement" size={14} />
                            <span>View Agreement</span>
                          </button>
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

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ color: "#64748b", fontSize: 13 }}>
          Showing {filteredRows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} -{" "}
          {Math.min(page * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="owner-btn-secondary"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span style={{ margin: "0 6px", fontSize: 13, fontWeight: 600 }}>
            Page {page} / {totalPages}
          </span>
          <button
            className="owner-btn-secondary"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Agreement Document Viewer Modal */}
      {viewingAgreement && (
        <AgreementDocumentViewer
          agreement={viewingAgreement}
          onClose={() => setViewingAgreement(null)}
          isHistoryView={false}
          showToast={showToast}
        />
      )}
    </section>
  );
}
