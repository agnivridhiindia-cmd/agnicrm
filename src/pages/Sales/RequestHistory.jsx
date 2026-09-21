import React, { useMemo, useState } from "react";
import Icon from "../../components/Icon";
import { getCategoryBadgeStyle } from "./RequestTable";

const months = [
  "All",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const statusConfig = {
  "Approved & Active": { bg: "rgba(16, 185, 129, 0.14)", color: "#047857", border: "rgba(16, 185, 129, 0.4)", label: "Approved & Active" },
  "Approved by Manager": { bg: "rgba(16, 185, 129, 0.14)", color: "#047857", border: "rgba(16, 185, 129, 0.4)", label: "Approved by Manager" },
  "Approved": { bg: "rgba(16, 185, 129, 0.14)", color: "#047857", border: "rgba(16, 185, 129, 0.4)", label: "Approved" },
  "Rejected by Manager": { bg: "rgba(239, 68, 68, 0.14)", color: "#be123c", border: "rgba(239, 68, 68, 0.4)", label: "Rejected by Manager" },
  "Declined": { bg: "rgba(239, 68, 68, 0.14)", color: "#be123c", border: "rgba(239, 68, 68, 0.4)", label: "Declined" },
  "Rejected": { bg: "rgba(239, 68, 68, 0.14)", color: "#be123c", border: "rgba(239, 68, 68, 0.4)", label: "Rejected" },
  "Cancelled": { bg: "rgba(100, 116, 139, 0.14)", color: "#475569", border: "rgba(100, 116, 139, 0.4)", label: "Cancelled" },
  "Pending": { bg: "rgba(245, 158, 11, 0.14)", color: "#b45309", border: "rgba(245, 158, 11, 0.4)", label: "Pending" },
};

export default function RequestHistory({ requests = [], onView }) {
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const years = useMemo(() => {
    const yearSet = new Set(
      requests
        .filter((r) => r.createdAt || r.submittedDate || r.decisionDate)
        .map((request) => {
          const dateStr = request.decisionDate || request.createdAt || request.submittedDate;
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? 2026 : d.getFullYear();
        })
    );
    return ["All", ...Array.from(yearSet).sort().reverse()];
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((request) => {
      if (selectedStatus !== "All") {
        if (selectedStatus === "Approved" && !request.status.includes("Approved")) return false;
        if (selectedStatus === "Rejected" && (!request.status.includes("Rejected") && request.status !== "Declined")) return false;
        if (selectedStatus === "Cancelled" && request.status !== "Cancelled") return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (request.clientName || request.companyName || "").toLowerCase().includes(q);
        const matchId = (request.id || "").toLowerCase().includes(q);
        const matchMgr = (request.managerName || request.actionedBy || "").toLowerCase().includes(q);
        const matchScheme = (request.schemeName || request.category || "").toLowerCase().includes(q);
        if (!matchName && !matchId && !matchMgr && !matchScheme) return false;
      }

      const rawDate = request.decisionDate || request.createdAt || request.submittedDate;
      if (rawDate) {
        const createdDate = new Date(rawDate);
        if (!isNaN(createdDate.getTime())) {
          const monthName = months[createdDate.getMonth() + 1];
          if (selectedMonth !== "All" && monthName !== selectedMonth) {
            return false;
          }
          if (selectedYear !== "All" && String(createdDate.getFullYear()) !== selectedYear) {
            return false;
          }
        }
      }

      return true;
    });
  }, [requests, selectedMonth, selectedYear, selectedStatus, searchQuery]);

  return (
    <div>
      {/* Filter Toolbar */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: "1px solid rgba(140, 95, 248, 0.12)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, flex: 1 }}>
          <div style={{ minWidth: 220, flex: "1 1 220px" }}>
            <input
              type="text"
              placeholder="Search by client, ID, service or decision maker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 14px",
                borderRadius: 10,
                fontSize: 13,
                border: "1px solid rgba(140, 95, 248, 0.2)",
                background: "rgba(255, 255, 255, 0.9)",
                color: "#0f172a",
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, fontSize: 13, background: "rgba(255, 255, 255, 0.9)", color: "#0f172a", border: "1px solid rgba(140, 95, 248, 0.2)" }}
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved / Active</option>
              <option value="Rejected">Rejected / Declined</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, fontSize: 13, background: "rgba(255, 255, 255, 0.9)", color: "#0f172a", border: "1px solid rgba(140, 95, 248, 0.2)" }}
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month === "All" ? "All Months" : month}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
              style={{ padding: "8px 12px", borderRadius: 10, fontSize: 13, background: "rgba(255, 255, 255, 0.9)", color: "#0f172a", border: "1px solid rgba(140, 95, 248, 0.2)" }}
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year === "All" ? "All Years" : year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(selectedStatus !== "All" || selectedMonth !== "All" || selectedYear !== "All" || searchQuery) && (
          <button
            type="button"
            className="sales-btn-secondary"
            onClick={() => {
              setSelectedStatus("All");
              setSelectedMonth("All");
              setSelectedYear("All");
              setSearchQuery("");
            }}
            style={{ padding: "7px 12px", fontSize: 12, cursor: "pointer" }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* History Table */}
      {filtered.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: 13.5, opacity: 0.8 }}>
            No request history records found matching the selected filter criteria.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="sales-clients-table" style={{ width: "100%", minWidth: 960, margin: 0, tableLayout: "auto" }}>
            <thead>
              <tr>
                <th style={{ width: "14%" }}>Request ID</th>
                <th style={{ width: "24%" }}>Client Name</th>
                <th style={{ width: "20%" }}>Category</th>
                <th style={{ width: "22%" }}>Actioned By &amp; Decision Date</th>
                <th style={{ width: "14%" }}>Status</th>
                <th style={{ textAlign: "right", paddingRight: 20 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request) => {
                const conf = statusConfig[request.status] || statusConfig.Approved;
                const badge = getCategoryBadgeStyle(request.category || request.requestType || request.schemeName);

                return (
                  <tr key={request.id}>
                    <td>
                      <span className="req-table-id">
                        {request.id}
                      </span>
                    </td>
                    <td>
                      <strong className="req-table-client-name">{request.clientName || request.companyName}</strong>
                    </td>
                    <td>
                      <div>
                        <span
                          className="req-category-badge"
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                          }}
                        >
                          <Icon name={badge.icon} size={12} />
                          {badge.label}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong className="req-table-target-dept">
                          {request.actionedBy || request.managerName || "Sales Executive"}
                        </strong>
                        <span className="req-table-submitted-date" style={{ display: "block" }}>
                          {request.decisionDate || request.actionedAt || request.createdAt || "Recorded"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="req-status-badge"
                        style={{
                          background: conf.bg,
                          color: conf.color,
                          border: `1px solid ${conf.border}`,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 999, background: conf.color, flexShrink: 0 }} />
                        {conf.label || request.status}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", paddingRight: 16 }}>
                      <div className="req-actions-cell">
                        <button
                          className="sales-view-btn"
                          type="button"
                          onClick={() => onView(request)}
                          style={{ padding: "6px 14px", fontSize: 12, whiteSpace: "nowrap" }}
                        >
                          <span>View Audit Dossier</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
