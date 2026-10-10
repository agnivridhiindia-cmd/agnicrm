import React, { useState } from "react";
import Icon from "../../components/Icon";
import { branchOptions, downloadInvoiceFile } from "./mockOwnerData";
import { isBranchMatch } from "../../utils/branchHelper";

const PAGE_SIZE = 15;

export default function OwnerInvoicePage({
  invoices = [],
  onOpenInvoiceDetails,
}) {
  const [invoiceBranchFilter, setInvoiceBranchFilter] = useState("");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceDownloadNotice, setInvoiceDownloadNotice] = useState(null);

  const filteredInvoices = invoices.filter((inv) => {
    const branchOk = isBranchMatch(inv.branch, invoiceBranchFilter);
    const statusOk = !invoiceStatusFilter || (inv.status && inv.status.toLowerCase() === invoiceStatusFilter.toLowerCase());
    const searchLower = invoiceSearch.toLowerCase().trim();
    const searchOk =
      !searchLower ||
      (inv.id || "").toLowerCase().includes(searchLower) ||
      (inv.invoiceNo || "").toLowerCase().includes(searchLower) ||
      (inv.clientName || "").toLowerCase().includes(searchLower) ||
      (inv.company || "").toLowerCase().includes(searchLower) ||
      (inv.serviceName || "").toLowerCase().includes(searchLower) ||
      (inv.description || "").toLowerCase().includes(searchLower);
    return branchOk && statusOk && searchOk;
  });

  const invoiceTotalPages = Math.max(1, Math.ceil(filteredInvoices.length / PAGE_SIZE));
  const invoicePageItems = filteredInvoices.slice(
    (invoicePage - 1) * PAGE_SIZE,
    invoicePage * PAGE_SIZE
  );

  const totalInvoicedAmount = filteredInvoices.reduce(
    (sum, inv) => sum + (inv.rawTotal || 0),
    0
  );
  const totalPaidAmount = filteredInvoices
    .filter((i) => i.status === "Paid")
    .reduce((sum, inv) => sum + (inv.rawTotal || 0), 0);
  const totalPendingAmount = filteredInvoices
    .filter((i) => i.status !== "Paid")
    .reduce((sum, inv) => sum + (inv.rawTotal || 0), 0);

  const handleDownload = (inv) => {
    downloadInvoiceFile(inv, (msg) => {
      setInvoiceDownloadNotice(msg);
      setTimeout(() => setInvoiceDownloadNotice(null), 4000);
    });
  };

  const handleResetFilters = () => {
    setInvoiceBranchFilter("");
    setInvoiceStatusFilter("");
    setInvoiceSearch("");
    setInvoicePage(1);
  };

  return (
    <section className="owner-page-view">
      {/* Header Banner */}
      <div className="owner-header-banner">
        <div className="owner-header-info">
          <p className="owner-header-eyebrow">Financial Billing & Records</p>
          <h1 className="owner-header-title">Client Invoices</h1>
        </div>
        <button
          type="button"
          className="owner-btn-secondary"
          onClick={handleResetFilters}
        >
          Reset All Filters
        </button>
      </div>

      {invoiceDownloadNotice && (
        <div className="owner-milestone-stage-row" style={{ color: "#10b981", fontWeight: 700, padding: "12px 18px" }}>
          <span>✓ {invoiceDownloadNotice}</span>
          <button
            type="button"
            onClick={() => setInvoiceDownloadNotice(null)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontWeight: "bold" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Ribbon */}
      <div className="owner-kpi-ribbon">
        <div className="owner-kpi-tile blue">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Total Invoiced</span>
            <div className="owner-kpi-tile-icon blue">
              <Icon name="invoice" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value">₹{totalInvoicedAmount.toLocaleString()}</strong>
          </div>
        </div>

        <div className="owner-kpi-tile green">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Collected / Paid</span>
            <div className="owner-kpi-tile-icon green">
              <Icon name="checkCircle" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value" style={{ color: "#10b981" }}>
              ₹{totalPaidAmount.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="owner-kpi-tile amber">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Pending / Overdue</span>
            <div className="owner-kpi-tile-icon amber">
              <Icon name="overview" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value" style={{ color: "#f59e0b" }}>
              ₹{totalPendingAmount.toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Toolbar Filter Card */}
      <div className="analytics-card owner-toolbar-card">
        <div className="owner-toolbar-filters">
          <div className="owner-search-box">
            <span className="owner-search-icon">
              <Icon name="search" size={15} />
            </span>
            <input
              type="text"
              placeholder="Search by client, ID, service, company..."
              value={invoiceSearch}
              onChange={(e) => {
                setInvoiceSearch(e.target.value);
                setInvoicePage(1);
              }}
            />
            {invoiceSearch && (
              <button
                type="button"
                className="owner-search-clear-btn"
                onClick={() => {
                  setInvoiceSearch("");
                  setInvoicePage(1);
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="owner-filter-control-group">
            <label className="owner-filter-inline-label" htmlFor="owner-invoice-branch-filter">
              <Icon name="branches" size={13} />
              <span>Branch:</span>
            </label>
            <div className="owner-select-wrapper">
              <select
                id="owner-invoice-branch-filter"
                className="owner-filter-select"
                value={invoiceBranchFilter}
                onChange={(e) => {
                  setInvoiceBranchFilter(e.target.value);
                  setInvoicePage(1);
                }}
              >
                {branchOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="owner-select-chevron">▾</span>
            </div>
          </div>

          <div className="owner-filter-control-group">
            <label className="owner-filter-inline-label" htmlFor="owner-invoice-status-filter">
              <Icon name="checkCircle" size={13} />
              <span>Status:</span>
            </label>
            <div className="owner-select-wrapper">
              <select
                id="owner-invoice-status-filter"
                className="owner-filter-select"
                value={invoiceStatusFilter}
                onChange={(e) => {
                  setInvoiceStatusFilter(e.target.value);
                  setInvoicePage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
              <span className="owner-select-chevron">▾</span>
            </div>
          </div>

          {(invoiceSearch || invoiceBranchFilter || invoiceStatusFilter) && (
            <button
              type="button"
              className="owner-btn-reset-filters"
              onClick={handleResetFilters}
              title="Reset all active filters"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="owner-count-badge">
          <span className="owner-count-dot"></span>
          <span>Showing</span>
          <strong>{filteredInvoices.length}</strong>
          <span>of {invoices.length} invoices</span>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="analytics-card owner-table-card">
        <div className="owner-table-scroll">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Client & Company</th>
                <th>Branch Location</th>
                <th>Service Scheme</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoicePageItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="owner-empty-state">
                    No invoices found matching the selected filters.
                  </td>
                </tr>
              ) : (
                invoicePageItems.map((inv) => {
                  const initials = (inv.clientName || "")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase();

                  const statusClass = (inv.status || "pending").toLowerCase();

                  return (
                    <tr key={inv.id}>
                      <td>
                        <span className="owner-rep-pill" style={{ fontFamily: "monospace", fontWeight: 700 }}>
                          {inv.id}
                        </span>
                      </td>
                      <td>
                        <div className="owner-member-avatar-cell">
                          <div className="owner-member-avatar">{initials}</div>
                          <div className="owner-member-details">
                            <strong className="owner-member-name">{inv.clientName}</strong>
                            <span className="owner-member-branch">{inv.company || "Corporate Account"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="owner-rep-pill">{inv.branch}</span>
                      </td>
                      <td>
                        <span className="owner-service-pill">{inv.serviceName}</span>
                      </td>
                      <td>
                        <strong className="owner-revenue-text">
                          {inv.totalAmount || inv.total || (inv.rawTotal ? `₹${inv.rawTotal.toLocaleString()}` : "—")}
                        </strong>
                      </td>
                      <td>
                        <span className={`owner-status-pill ${statusClass}`}>
                          ● {inv.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div className="owner-actions-cell">
                          <button
                            className="owner-view-btn"
                            type="button"
                            onClick={() => onOpenInvoiceDetails && onOpenInvoiceDetails(inv)}
                          >
                            View
                          </button>
                          <button
                            className="owner-btn-secondary"
                            style={{ padding: "6px 12px", fontSize: 12 }}
                            type="button"
                            onClick={() => handleDownload(inv)}
                          >
                            Download
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
          Showing {filteredInvoices.length === 0 ? 0 : (invoicePage - 1) * PAGE_SIZE + 1} -{" "}
          {Math.min(invoicePage * PAGE_SIZE, filteredInvoices.length)} of{" "}
          {filteredInvoices.length}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="owner-btn-secondary"
            disabled={invoicePage <= 1}
            onClick={() => setInvoicePage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span style={{ margin: "0 6px", fontSize: 13, fontWeight: 600 }}>
            Page {invoicePage} / {invoiceTotalPages}
          </span>
          <button
            className="owner-btn-secondary"
            disabled={invoicePage >= invoiceTotalPages}
            onClick={() => setInvoicePage((p) => Math.min(invoiceTotalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
