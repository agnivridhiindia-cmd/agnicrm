import React, { useState, useEffect, useMemo } from "react";
import Icon from "../../components/Icon";
import { employeeRoles, branchOptions, branchToRegionMap } from "./mockOwnerData";
import { getTrackerState } from "../../utils/schemeTracker";
import { sortByRoleRanking, isBranchMatch } from "../../utils/branchHelper";

const PAGE_SIZE = 12;

export default function OwnerEmployeesPage({
  employeesList = [],
  clients = [],
  selectedRole = "All roles",
  setSelectedRole,
  onOpenEmployeeInfo,
  onOpenEditEmployee,
  onDeleteEmployee,
  onOpenClientInfo,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [employeesPage, setEmployeesPage] = useState(1);
  const [managerTeamView, setManagerTeamView] = useState(null);
  const [salesClientsView, setSalesClientsView] = useState(null);

  function getClientsForEmployee(emp) {
    if (!emp) return [];
    const empRole = (emp.role || emp.rawRole || "").toLowerCase().trim();
    const empRaw = (emp.rawRole || "").toLowerCase().trim();
    const empName = (emp.name || emp.fullName || "").toLowerCase().trim();
    const empFirstName = empName.split(" ")[0];
    const empBranch = (emp.branch || "").toLowerCase().trim();

    let matched = (clients || []).filter((c) => {
      if (!c) return false;
      const cSales = (c.assignedPerson || c.salesPerson || c.owner || c.assignedSalesPerson || "").toLowerCase().trim();
      if (!cSales) return false;

      return (
        cSales.includes(empName) ||
        empName.includes(cSales) ||
        (empFirstName && empFirstName.length > 2 && cSales.includes(empFirstName))
      );
    });

    if (matched.length > 0) return matched;

    if (empRole.includes("it") || empRaw === "it") {
      matched = (clients || []).filter(
        (c) => (c.serviceType || "").toLowerCase() === "it" || (c.branch || "").toLowerCase().includes(empBranch.split(" ")[0])
      );
    } else if (empRole.includes("market") || empRaw === "marketing") {
      matched = (clients || []).filter(
        (c) => (c.serviceType || "").toLowerCase() === "marketing" || (c.branch || "").toLowerCase().includes(empBranch.split(" ")[0])
      );
    } else if (empRole.includes("admin") || empRaw === "admin") {
      matched = (clients || []).filter(
        (c) =>
          (c.serviceType || "").toLowerCase() === "certificate" ||
          (c.serviceType || "").toLowerCase() === "consultancy" ||
          (c.branch || "").toLowerCase().includes(empBranch.split(" ")[0])
      );
    } else if (empRole.includes("sales") || empRaw === "sales_person" || empRole.includes("manager")) {
      matched = (clients || []).filter(
        (c) => (c.branch || "").toLowerCase().includes(empBranch.split(" ")[0]) || !!c.salesPerson
      );
    }

    if (matched.length > 0) return matched;
    return (clients || []).filter((c) => (c.branch || "").toLowerCase().includes(empBranch.split(" ")[0]));
  }

  function getTeamForManager(mgr) {
    if (!mgr) return [];
    const mgrName = (mgr.name || mgr.fullName || "").toLowerCase().trim();
    const mgrBranch = (mgr.branch || "").toLowerCase().trim();
    const mgrRole = (mgr.role || mgr.rawRole || "").toLowerCase().trim();

    return staffEmployeesList.filter((emp) => {
      if (!emp || emp.id === mgr.id) return false;
      const empRole = (emp.role || emp.rawRole || "").toLowerCase().trim();
      const empRM = (emp.reportingManager || "").toLowerCase().trim();
      const empBM = (emp.branchManager || "").toLowerCase().trim();
      const empBranch = (emp.branch || "").toLowerCase().trim();

      const sameBranch = empBranch && mgrBranch && (empBranch.includes(mgrBranch.split(" ")[0]) || mgrBranch.includes(empBranch.split(" ")[0]));

      if (mgrRole.includes("branch")) {
        return empBM === mgrName || empRM === mgrName || sameBranch;
      }

      if (mgrRole.includes("manager")) {
        const isSales = empRole.includes("sales") || empRole.includes("sr") || empRole === "sales person";
        if (isSales) {
          return empRM === mgrName || empBM === mgrName || sameBranch;
        }
        return empRM === mgrName;
      }
      return false;
    });
  }

  // Filter out CLIENT and OWNER accounts from staff employee directory
  const staffEmployeesList = useMemo(() => {
    return (employeesList || []).filter((e) => {
      if (!e) return false;
      const r = (e.rawRole || e.role || "").toUpperCase();
      return r !== "CLIENT" && r !== "OWNER";
    });
  }, [employeesList]);

  // Compute KPI metrics
  const totalEmployees = staffEmployeesList.length;
  const branchManagersCount = staffEmployeesList.filter((e) => {
    const r = (e.role || e.rawRole || "").toLowerCase();
    return r === "branch manager" || r === "branch_manager" || r === "bm";
  }).length;
  const salesManagersCount = staffEmployeesList.filter((e) => {
    const r = (e.role || e.rawRole || "").toLowerCase();
    return r === "sales manager" || r === "manager" || r === "sales_manager" || r === "sm";
  }).length;
  const validBranches = new Set(
    staffEmployeesList
      .map((e) => e.branch)
      .filter((b) => b && !b.toLowerCase().includes("pan-india"))
  );
  const uniqueBranchesCount = validBranches.size;

  const filteredEmployees = useMemo(() => {
    const matched = staffEmployeesList.filter((employee) => {
      const sLower = searchTerm.toLowerCase().trim();
      const nameMatch = (employee.name || "").toLowerCase().includes(sLower);
      const emailMatch = (employee.email || "").toLowerCase().includes(sLower);
      const phoneMatch = (employee.phone || "").toLowerCase().includes(sLower);
      const branchMatch = (employee.branch || "").toLowerCase().includes(sLower);
      const roleMatch = (employee.role || "").toLowerCase().includes(sLower);

      const searchOk = !sLower || nameMatch || emailMatch || phoneMatch || branchMatch || roleMatch;
      const empRole = (employee.role || "").toLowerCase();
      const empRaw = (employee.rawRole || "").toLowerCase();
      const selRole = (selectedRole || "").toLowerCase();

      let roleOk = selectedRole === "All roles" || !selectedRole || empRole === selRole || empRaw === selRole;
      if (!roleOk) {
        if (selRole === "admin") {
          roleOk = empRole.includes("admin") || empRaw.includes("admin");
        } else if (selRole === "market" || selRole === "marketing") {
          roleOk = empRole.includes("market") || empRaw.includes("market");
        } else if (selRole === "it") {
          roleOk = empRole.includes("it") || empRaw.includes("it");
        } else if (selRole === "manager" || selRole === "sales manager" || selRole === "sales_manager") {
          roleOk = (empRole.includes("manager") && !empRole.includes("branch")) || (empRaw.includes("manager") && !empRaw.includes("branch")) || empRole === "sm";
        } else if (selRole === "branch manager" || selRole === "branch_manager" || selRole === "bm") {
          roleOk = empRole.includes("branch") || empRaw.includes("branch") || empRole === "bm";
        } else if (selRole === "sales" || selRole === "sales person" || selRole === "salesperson" || selRole === "sales_person") {
          roleOk = empRole.includes("sales") || empRaw.includes("sales") || empRole === "sr";
        }
      }
      const branchOk = isBranchMatch(employee.branch, selectedBranch);

      return searchOk && roleOk && branchOk;
    });

    return sortByRoleRanking(matched);
  }, [staffEmployeesList, searchTerm, selectedRole, selectedBranch]);

  const employeesTotalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const employeesPageItems = filteredEmployees.slice(
    (employeesPage - 1) * PAGE_SIZE,
    employeesPage * PAGE_SIZE
  );

  useEffect(() => {
    setEmployeesPage(1);
  }, [selectedRole, selectedBranch, searchTerm]);

  const handleResetFilters = () => {
    setSearchTerm("");
    if (setSelectedRole) setSelectedRole("All roles");
    setSelectedBranch("");
    setEmployeesPage(1);
  };

  // VIEW 1: Team under Manager
  if (managerTeamView) {
    const team = getTeamForManager(managerTeamView);
    const uniqueRoles = Array.from(new Set(team.map((t) => t.role)));

    return (
      <section className="owner-page-view">
        {/* Header Bar */}
        <div className="owner-header-banner">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="button"
              className="owner-btn-secondary"
              onClick={() => setManagerTeamView(null)}
            >
              ← Back to All Employees
            </button>
            <div className="owner-header-info">
              <p className="owner-header-eyebrow">Managerial Team Drilldown</p>
              <h1 className="owner-header-title">Team Under — {managerTeamView.name}</h1>
              <p className="owner-header-subtitle">
                Role: {(managerTeamView.role || "").toUpperCase()} • Branch: {managerTeamView.branch} • Contact: {managerTeamView.email}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="owner-kpi-ribbon">
          <div className="owner-kpi-tile blue">
            <div className="owner-kpi-tile-top">
              <span className="owner-kpi-tile-label">Team Size</span>
              <div className="owner-kpi-tile-icon blue">
                <Icon name="team" size={16} />
              </div>
            </div>
            <div>
              <strong className="owner-kpi-tile-value">{team.length}</strong>
              <span className="owner-kpi-tile-sub">Subordinate Team Members</span>
            </div>
          </div>

          <div className="owner-kpi-tile purple">
            <div className="owner-kpi-tile-top">
              <span className="owner-kpi-tile-label">Role Profiles</span>
              <div className="owner-kpi-tile-icon purple">
                <Icon name="roles" size={16} />
              </div>
            </div>
            <div>
              <strong className="owner-kpi-tile-value">{uniqueRoles.length}</strong>
              <span className="owner-kpi-tile-sub">Distinct Functional Roles</span>
            </div>
          </div>

          <div className="owner-kpi-tile green">
            <div className="owner-kpi-tile-top">
              <span className="owner-kpi-tile-label">Branch Jurisdiction</span>
              <div className="owner-kpi-tile-icon green">
                <Icon name="branches" size={16} />
              </div>
            </div>
            <div>
              <strong className="owner-kpi-tile-value" style={{ color: "#10b981" }}>
                {managerTeamView.branch}
              </strong>
              <span className="owner-kpi-tile-sub">Assigned Territory</span>
            </div>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="analytics-card owner-table-card">
          <div className="owner-table-scroll">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Branch Location</th>
                  <th>Contact Details</th>
                  <th>Designation</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="owner-empty-state">
                      No direct team members currently assigned under this manager.
                    </td>
                  </tr>
                ) : (
                  team.map((member) => {
                    const initials = member.name
                      ? member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "TM";

                    return (
                      <tr key={member.id}>
                        <td>
                          <div className="owner-member-avatar-cell">
                            <div className="owner-member-avatar">{initials}</div>
                            <div className="owner-member-details">
                              <strong className="owner-member-name">{member.name}</strong>
                              <span className="owner-member-branch">{member.branch} Branch</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="owner-rep-pill">{member.branch}</span>
                        </td>
                        <td>
                          <div>
                            <div>{member.email}</div>
                            <div className="owner-phone-text">{member.phone}</div>
                          </div>
                        </td>
                        <td>
                          <span className="owner-role-tag">{member.role}</span>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div className="owner-actions-cell">
                            {["sales", "it", "admin", "market"].includes(
                              (member.role || "").toLowerCase()
                            ) && (
                              <button
                                className="owner-btn-primary"
                                style={{ padding: "6px 12px", fontSize: 12 }}
                                onClick={() => {
                                  setManagerTeamView(null);
                                  setSalesClientsView(member);
                                }}
                              >
                                Clients under
                              </button>
                            )}
                            <button
                              className="owner-view-btn"
                              onClick={() => onOpenEmployeeInfo(member)}
                            >
                              Info
                            </button>
                            <button
                              className="owner-btn-secondary"
                              style={{ padding: "6px 12px", fontSize: 12 }}
                              onClick={() => onOpenEditEmployee(member)}
                            >
                              Edit
                            </button>
                            <button
                              className="owner-btn-danger"
                              onClick={() => onDeleteEmployee(member)}
                            >
                              Delete
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
      </section>
    );
  }

  // VIEW 2: Clients under Employee
  if (salesClientsView) {
    const managedClients = getClientsForEmployee(salesClientsView);
    const totalVal = managedClients.reduce((sum, c) => sum + (c.totalPayment || 0), 0);
    const avgProgress = Math.round(
      managedClients.reduce(
        (sum, c) =>
          sum +
          (c.progressPercent ||
            (c.paymentReceived >= c.totalPayment ? 100 : 70)),
        0
      ) / Math.max(1, managedClients.length)
    );

    return (
      <section className="owner-page-view">
        {/* Header Bar */}
        <div className="owner-header-banner">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              type="button"
              className="owner-btn-secondary"
              onClick={() => setSalesClientsView(null)}
            >
              ← Back to All Employees
            </button>
            <div className="owner-header-info">
              <p className="owner-header-eyebrow">Client Portfolio Assignment</p>
              <h1 className="owner-header-title">Clients Under — {salesClientsView.name}</h1>
              <p className="owner-header-subtitle">
                Role: {(salesClientsView.role || "").toUpperCase()} • Branch: {salesClientsView.branch} • Contact: {salesClientsView.email}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="owner-kpi-ribbon">
          <div className="owner-kpi-tile blue">
            <div className="owner-kpi-tile-top">
              <span className="owner-kpi-tile-label">Clients Managed</span>
              <div className="owner-kpi-tile-icon blue">
                <Icon name="clients" size={16} />
              </div>
            </div>
            <div>
              <strong className="owner-kpi-tile-value">{managedClients.length}</strong>
              <span className="owner-kpi-tile-sub">Active Accounts</span>
            </div>
          </div>

          <div className="owner-kpi-tile purple">
            <div className="owner-kpi-tile-top">
              <span className="owner-kpi-tile-label">Total Portfolio Value</span>
              <div className="owner-kpi-tile-icon purple">
                <Icon name="revenue" size={16} />
              </div>
            </div>
            <div>
              <strong className="owner-kpi-tile-value">₹{totalVal.toLocaleString()}</strong>
              <span className="owner-kpi-tile-sub">Contracted Value</span>
            </div>
          </div>

          <div className="owner-kpi-tile green">
            <div className="owner-kpi-tile-top">
              <span className="owner-kpi-tile-label">Average Completion</span>
              <div className="owner-kpi-tile-icon green">
                <Icon name="overview" size={16} />
              </div>
            </div>
            <div>
              <strong className="owner-kpi-tile-value" style={{ color: "#10b981" }}>
                {avgProgress}%
              </strong>
              <span className="owner-kpi-tile-sub">Pipeline Milestone Rate</span>
            </div>
          </div>
        </div>

        {/* Managed Clients Table */}
        <div className="analytics-card owner-table-card">
          <div className="owner-table-scroll">
            <table className="owner-table">
              <thead>
                <tr>
                  <th>Client &amp; Company</th>
                  <th>Service Line</th>
                  <th>Total Billed</th>
                  <th>Payment Received</th>
                  <th>Milestone Progress</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {managedClients.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="owner-empty-state">
                      No clients currently assigned under this employee.
                    </td>
                  </tr>
                ) : (
                  managedClients.map((client) => {
                    const clientScheme = client.serviceName || client.scheme || client.serviceType || "PMEGP";
                    const tracker = getTrackerState({ scheme: clientScheme, completedSteps: client.completedSteps });

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
                          <div className="owner-member-avatar-cell">
                            <div className="owner-member-avatar">{initials}</div>
                            <div className="owner-member-details">
                              <strong className="owner-member-name">{client.name}</strong>
                              <span className="owner-member-branch">{client.company || "Enterprise Account"}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="owner-service-pill">
                            {client.serviceType} ({client.serviceName || "Standard"})
                          </span>
                        </td>
                        <td>
                          <strong className="owner-revenue-text">
                            ₹{(client.totalPayment || 0).toLocaleString()}
                          </strong>
                        </td>
                        <td>
                          <span style={{ color: "#10b981", fontWeight: 700 }}>
                            ₹{(client.paymentReceived || 0).toLocaleString()}
                          </span>
                        </td>
                        <td style={{ minWidth: 150 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="owner-progress-bar-wrap">
                              <div
                                className="owner-progress-bar-fill"
                                style={{
                                  width: `${tracker.progressPercent}%`,
                                  background:
                                    tracker.progressPercent === 100
                                      ? "#10b981"
                                      : "linear-gradient(90deg, #6366f1 0%, #10b981 100%)",
                                }}
                              />
                            </div>
                            <span
                              className="owner-progress-percent"
                              style={{ color: tracker.progressPercent === 100 ? "#10b981" : "inherit" }}
                            >
                              {tracker.progressPercent}%
                            </span>
                          </div>
                          <div className="owner-scheme-dots">
                            {tracker.stages.map((st) => {
                              const isDone = tracker.completedStages.includes(st.name);
                              return (
                                <span
                                  key={st.name}
                                  className="owner-scheme-dot"
                                  title={`${st.name} (${st.percent}%)`}
                                  style={{ background: isDone ? "#10b981" : "rgba(99, 102, 241, 0.2)" }}
                                />
                              );
                            })}
                            <span style={{ fontSize: 10.5, color: "#64748b", marginLeft: 4 }}>
                              {tracker.completedStages.length}/{tracker.totalStages} Stages
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div className="owner-actions-cell">
                            {onOpenClientInfo && (
                              <button
                                className="owner-view-btn"
                                onClick={() => onOpenClientInfo(client)}
                              >
                                Info &amp; Tracker
                              </button>
                            )}
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
      </section>
    );
  }

  // MAIN VIEW: Employees Directory
  return (
    <section className="owner-page-view">
      {/* Header Banner */}
      <div className="owner-header-banner">
        <div className="owner-header-info">
          <p className="owner-header-eyebrow">Workforce Governance</p>
          <h1 className="owner-header-title">Enterprise Employee Directory</h1>
          <p className="owner-header-subtitle">
            Manage corporate organization hierarchy, branch deployments, reporting chains, and cross-functional team allocations.
          </p>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="owner-kpi-ribbon">
        <div className="owner-kpi-tile blue">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Total Workforce</span>
            <div className="owner-kpi-tile-icon blue">
              <Icon name="team" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value">{totalEmployees}</strong>
            <span className="owner-kpi-tile-sub">Active Enterprise Staff</span>
          </div>
        </div>

        <div className="owner-kpi-tile green">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Branch Managers</span>
            <div className="owner-kpi-tile-icon green">
              <Icon name="roles" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value" style={{ color: "#10b981" }}>
              {branchManagersCount}
            </strong>
            <span className="owner-kpi-tile-sub">Territory Heads</span>
          </div>
        </div>

        <div className="owner-kpi-tile amber">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Regional Managers</span>
            <div className="owner-kpi-tile-icon amber">
              <Icon name="team" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value" style={{ color: "#f59e0b" }}>
              {salesManagersCount}
            </strong>
            <span className="owner-kpi-tile-sub">Sales Operations Leads</span>
          </div>
        </div>

        <div className="owner-kpi-tile purple">
          <div className="owner-kpi-tile-top">
            <span className="owner-kpi-tile-label">Operating Branches</span>
            <div className="owner-kpi-tile-icon purple">
              <Icon name="branches" size={16} />
            </div>
          </div>
          <div>
            <strong className="owner-kpi-tile-value">{uniqueBranchesCount}</strong>
            <span className="owner-kpi-tile-sub">Across All Regions</span>
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
              placeholder="Search by employee name, branch, email, phone, role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <label className="field-label" style={{ margin: 0 }}>
            <span>Filter by Role:</span>
            <select
              className="owner-filter-select"
              value={selectedRole}
              onChange={(event) => {
                if (setSelectedRole) setSelectedRole(event.target.value);
                setEmployeesPage(1);
              }}
            >
              {employeeRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label" style={{ margin: 0 }}>
            <span>Branch:</span>
            <select
              className="owner-filter-select"
              value={selectedBranch}
              onChange={(event) => {
                setSelectedBranch(event.target.value);
                setEmployeesPage(1);
              }}
            >
              {branchOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {(searchTerm || (selectedRole && selectedRole !== "All roles") || selectedBranch) && (
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
          <strong>{filteredEmployees.length}</strong>
          <span>of {employeesList.length} employees</span>
        </div>
      </div>

      {/* Employees Table Card */}
      <div className="analytics-card owner-table-card">
        <div className="owner-table-scroll">
          <table className="owner-table">
            <thead>
              <tr>
                <th>Employee &amp; Branch</th>
                <th>Contact Information</th>
                <th>Designation Role</th>
                <th>Reporting Hierarchy</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeesPageItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="owner-empty-state">
                    No employees found matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                employeesPageItems.map((employee) => {
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
                            <span className="owner-member-branch">{employee.branch} Branch</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{employee.email}</div>
                          <div className="owner-phone-text">{employee.phone}</div>
                        </div>
                      </td>
                      <td>
                        <span className="owner-role-tag">
                          {employee.role}
                        </span>
                      </td>
                      <td>
                        <span className="owner-rep-pill">
                          <Icon name="user" size={12} />
                          {employee.reportingManager || employee.branchManager || "Branch Executive"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <div className="owner-actions-cell">
                          {(() => {
                            const r = (employee.role || employee.rawRole || "").toLowerCase();
                            return r.includes("manager") || r.includes("branch");
                          })() && (
                            <button
                              className="owner-btn-primary"
                              style={{ padding: "6px 12px", fontSize: 12, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                              onClick={() => {
                                setSalesClientsView(null);
                                setManagerTeamView(employee);
                              }}
                            >
                              Team under
                            </button>
                          )}
                          {(() => {
                            const r = (employee.role || employee.rawRole || "").toLowerCase();
                            return r.includes("sales") || r.includes("it") || r.includes("admin") || r.includes("market");
                          })() && (
                            <button
                              className="owner-btn-primary"
                              style={{ padding: "6px 12px", fontSize: 12 }}
                              onClick={() => {
                                setManagerTeamView(null);
                                setSalesClientsView(employee);
                              }}
                            >
                              Clients under
                            </button>
                          )}
                          <button
                            className="owner-view-btn"
                            onClick={() => onOpenEmployeeInfo(employee)}
                          >
                            Info
                          </button>
                          <button
                            className="owner-btn-secondary"
                            style={{ padding: "6px 12px", fontSize: 12 }}
                            onClick={() => onOpenEditEmployee(employee)}
                          >
                            Edit
                          </button>
                          <button
                            className="owner-btn-danger"
                            onClick={() => onDeleteEmployee(employee)}
                          >
                            Delete
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
          Showing {filteredEmployees.length === 0 ? 0 : (employeesPage - 1) * PAGE_SIZE + 1} -{" "}
          {Math.min(employeesPage * PAGE_SIZE, filteredEmployees.length)} of{" "}
          {filteredEmployees.length}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            className="owner-btn-secondary"
            disabled={employeesPage <= 1}
            onClick={() => setEmployeesPage((page) => Math.max(1, page - 1))}
          >
            Prev
          </button>
          <span style={{ margin: "0 6px", fontSize: 13, fontWeight: 600 }}>
            Page {employeesPage} / {employeesTotalPages}
          </span>
          <button
            className="owner-btn-secondary"
            disabled={employeesPage >= employeesTotalPages}
            onClick={() => setEmployeesPage((page) => Math.min(employeesTotalPages, page + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
