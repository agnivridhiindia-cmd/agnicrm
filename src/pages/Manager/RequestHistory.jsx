import React, { useMemo, useState } from "react";
import Icon from "../../components/Icon";

const months = [
  "All", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function RequestHistory({ receivedRequests = [], sentRequests = [], onView }) {
  const [selectedType, setSelectedType] = useState("Received");
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const activeRequests = useMemo(() => {
    return selectedType === "Received" ? receivedRequests : sentRequests;
  }, [selectedType, receivedRequests, sentRequests]);

  const years = useMemo(() => {
    const yearSet = new Set(activeRequests.map((request) => new Date(request.createdAt).getFullYear()));
    return ["All", ...Array.from(yearSet).sort()];
  }, [activeRequests]);

  const filtered = useMemo(() => {
    return activeRequests.filter((request) => {
      if (selectedStatus !== "All" && request.status !== selectedStatus) {
        return false;
      }

      const createdDate = new Date(request.createdAt);
      const monthName = months[createdDate.getMonth() + 1];
      if (selectedMonth !== "All" && monthName !== selectedMonth) {
        return false;
      }

      if (selectedYear !== "All" && String(createdDate.getFullYear()) !== selectedYear) {
        return false;
      }

      return true;
    });
  }, [activeRequests, selectedMonth, selectedYear, selectedStatus]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* History Filter Toolbar */}
      <div className="analytics-card manager-toolbar-card">
        <div className="manager-toolbar-filters">
          <label className="field-label" style={{ margin: 0 }}>
            <span>Direction</span>
            <select
              className="manager-filter-select"
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
            >
              <option value="Received">Received from Team</option>
              <option value="Sent">Submitted by Me</option>
            </select>
          </label>

          <label className="field-label" style={{ margin: 0 }}>
            <span>Month</span>
            <select
              className="manager-filter-select"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </label>

          <label className="field-label" style={{ margin: 0 }}>
            <span>Year</span>
            <select
              className="manager-filter-select"
              value={selectedYear}
              onChange={(event) => setSelectedYear(event.target.value)}
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>

          <label className="field-label" style={{ margin: 0 }}>
            <span>Status</span>
            <select
              className="manager-filter-select"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Pending">Pending</option>
            </select>
          </label>
        </div>

        <div className="manager-count-badge">
          <span>Found</span>
          <strong>{filtered.length}</strong>
          <span>records</span>
        </div>
      </div>

      {/* History Table */}
      <div className="analytics-card manager-table-card">
        <div className="manager-table-scroll">
          <table className="manager-team-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>{selectedType === "Received" ? "Client Name" : "Target Client"}</th>
                <th>{selectedType === "Received" ? "Sales Representative" : "Recipient Manager"}</th>
                <th>Request Type</th>
                <th>Status</th>
                <th>Decision Date</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((request) => {
                const statusClass = (request.status || "Pending").toLowerCase();
                const clientTitle = selectedType === "Received" ? request.clientName : (request.salespersonName || request.clientName);
                const initials = clientTitle
                  ? clientTitle
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "CL";

                return (
                  <tr key={request.id}>
                    <td>
                      <span className="manager-id-pill">{request.id}</span>
                    </td>
                    <td>
                      <div>
                        <strong className="manager-member-name" style={{ display: "block" }}>{clientTitle}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="manager-rep-pill">
                        <Icon name="user" size={12} />
                        {request.salesPerson || (selectedType === "Received" ? "Sales Executive" : request.managerName)}
                      </span>
                    </td>
                    <td>
                      <span className="manager-service-pill">{request.requestType}</span>
                    </td>
                    <td>
                      <span className={`manager-status-badge ${statusClass}`}>
                        <span className="manager-status-dot" />
                        {request.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12.5, color: "#7a748e" }}>{request.decisionDate || "—"}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="manager-view-btn"
                        type="button"
                        onClick={() => onView(request)}
                      >
                        <Icon name="eye" size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="manager-empty-state">
                    No historical request entries found for the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
