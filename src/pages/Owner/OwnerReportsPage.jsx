import React, { useState } from "react";
import TopPerformerLeaderboard from "../../components/TopPerformerLeaderboard";
import { PerformanceChart } from "../../components/charts";
import SimpleModal from "../../components/SimpleModal";
import {
  topPerformers,
  reportRoleOptions,
  branchOptions,
  generateYearlySeries,
} from "./mockOwnerData";

import { isBranchMatch } from "../../utils/branchHelper";

export default function OwnerReportsPage({
  employeesList = [],
}) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [reportRoleFilter, setReportRoleFilter] = useState("");
  const [reportBranchFilter, setReportBranchFilter] = useState("");
  const [selectedEmployeeForChart, setSelectedEmployeeForChart] = useState(null);

  const resetReportFilters = () => {
    setReportRoleFilter("");
    setReportBranchFilter("");
  };

  const openPerformance = (employee) => {
    const series = generateYearlySeries(employee);
    const lastMonth = series[10];
    const thisMonth = series[11];
    setSelectedEmployeeForChart({ ...employee, lastMonth, thisMonth, series });
  };

  const closePerformance = () => {
    setSelectedEmployeeForChart(null);
  };

  const filteredEmployees = employeesList.filter((employee) => {
    const empRole = (employee.role || employee.rawRole || "").toLowerCase();
    const fltRole = (reportRoleFilter || "").toLowerCase();
    const roleOk =
      !fltRole ||
      empRole.includes(fltRole) ||
      fltRole.includes(empRole);
    const branchOk = isBranchMatch(employee.branch, reportBranchFilter);
    return roleOk && branchOk;
  });

  return (
    <section className="owner-page-view">
      {/* Header Banner */}
      <div className="owner-header-banner">
        <div className="owner-header-info">
          <p className="owner-header-eyebrow">Executive Intelligence</p>
          <h1 className="owner-header-title">Employee Performance & Analytics</h1>
          <p className="owner-header-subtitle">
            Month-over-Month realization trajectories, departmental productivity, and cross-branch leaderboards.
          </p>
        </div>
      </div>

      {/* Toolbar & Filter Card */}
      <div className="analytics-card owner-toolbar-card">
        <div className="owner-toolbar-filters">
          <label className="field-label" style={{ margin: 0 }}>
            <span>Role:</span>
            <select
              className="owner-filter-select"
              value={reportRoleFilter}
              onChange={(e) => setReportRoleFilter(e.target.value)}
            >
              {reportRoleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label" style={{ margin: 0 }}>
            <span>Branch:</span>
            <select
              className="owner-filter-select"
              value={reportBranchFilter}
              onChange={(e) => setReportBranchFilter(e.target.value)}
            >
              {branchOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="owner-btn-secondary" onClick={resetReportFilters}>
            Reset Filters
          </button>
        </div>

        <button
          type="button"
          className="owner-btn-primary"
          onClick={() => setShowLeaderboard((show) => !show)}
        >
          {showLeaderboard ? "Hide Leaderboard" : "View Leaderboard"}
        </button>
      </div>

      {showLeaderboard ? (
        <div style={{ marginBottom: 18 }}>
          <TopPerformerLeaderboard performers={topPerformers} />
        </div>
      ) : (
        /* Reports Table Card */
        <div className="analytics-card owner-table-card">
          <div className="owner-table-scroll">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Branch Location</th>
                  <th>Role Designation</th>
                  <th>Last Month</th>
                  <th>This Month</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="owner-empty-state">
                      No employee reports found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((employee) => {
                    const series = generateYearlySeries(employee);
                    const lastMonth = series[10];
                    const thisMonth = series[11];

                    const initials = employee.name
                      ? employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "EM";

                    return (
                      <tr key={employee.id}>
                        <td>
                          <div className="owner-member-avatar-cell">
                            <div className="owner-member-avatar">{initials}</div>
                            <div className="owner-member-details">
                              <strong className="owner-member-name">{employee.name}</strong>
                              <span className="owner-member-branch">
                                {employee.branch} Operations
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="owner-rep-pill">
                            {employee.branch} Branch
                          </span>
                        </td>
                        <td>
                          <span className="owner-role-tag">
                            {employee.role}
                          </span>
                        </td>
                        <td>₹{lastMonth.toLocaleString()}</td>
                        <td>
                          <strong className="owner-revenue-text">
                            ₹{thisMonth.toLocaleString()}
                          </strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="owner-view-btn"
                            type="button"
                            onClick={() => openPerformance(employee)}
                          >
                            View Chart
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
      )}

      {selectedEmployeeForChart && (
        <SimpleModal onClose={closePerformance}>
          <div className="owner-modal-profile">
            <div className="owner-modal-avatar">
              {selectedEmployeeForChart.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="owner-header-title">{selectedEmployeeForChart.name}</h2>
              <span className="owner-header-subtitle">
                Role: {selectedEmployeeForChart.role} | Branch: {selectedEmployeeForChart.branch}
              </span>
            </div>
          </div>
          <PerformanceChart
            series={selectedEmployeeForChart.series}
            label={`Employee: ${selectedEmployeeForChart.name}`}
          />
          <div className="owner-modal-actions">
            <button className="owner-btn-secondary" type="button" onClick={closePerformance}>
              Close
            </button>
          </div>
        </SimpleModal>
      )}
    </section>
  );
}
