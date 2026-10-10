import React, { useState, useMemo } from "react";
import Icon from "../../components/Icon";
import SimpleModal from "../../components/SimpleModal";
import { sortByRoleRanking, cleanBranchDisplay } from "../../utils/branchHelper";

export default function BranchManagerEmployeesPage({
  employeesList = [],
  branchManagerName = "",
  managedRegion = "",
  managedBranch = "",
}) {
  const [selectedManagerForTeam, setSelectedManagerForTeam] = useState(null);
  const [selectedEmployeeInfo, setSelectedEmployeeInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const branchEmployees = useMemo(() => {
    const list = employeesList.filter((emp) => {
      if (!emp) return false;

      // Exclude Branch Manager herself/himself from branch subordinate list
      const rawRole = (emp.rawRole || emp.role || "").toUpperCase();
      const roleStr = (emp.role || "").toLowerCase();
      if (
        rawRole === "BRANCH_MANAGER" ||
        roleStr.includes("branch manager") ||
        roleStr.includes("branch director")
      ) {
        return false;
      }
      if (
        emp.name &&
        branchManagerName &&
        emp.name.toLowerCase().trim() === branchManagerName.toLowerCase().trim()
      ) {
        return false;
      }

      const empBM = (emp.branchManager || emp.branchManagerName || "").toLowerCase().trim();
      const empRegion = (emp.region || "").toLowerCase().trim();
      const empBranch = (emp.branch || "").toLowerCase().trim();
      const targetBM = (branchManagerName || "").toLowerCase().trim();
      const targetRegion = (managedRegion || "").toLowerCase().trim();
      const targetBranch = (managedBranch || "").toLowerCase().trim();

      // 1. Direct BM match
      if (targetBM && empBM && empBM === targetBM) return true;

      // 2. Exact match on branch or region
      if (targetBranch && empBranch && (empBranch === targetBranch || empBranch.includes(targetBranch) || targetBranch.includes(empBranch))) return true;
      if (targetRegion && empRegion && (empRegion === targetRegion || empRegion.includes(targetRegion) || targetRegion.includes(empRegion))) return true;

      // 3. Keyword matching across zones
      const keywords = ["mumbai", "west", "delhi", "north", "bengaluru", "south", "kolkata", "east"];
      for (const kw of keywords) {
        const matchesTarget = (targetRegion && targetRegion.includes(kw)) || (targetBranch && targetBranch.includes(kw));
        const matchesEmp = (empRegion && empRegion.includes(kw)) || (empBranch && empBranch.includes(kw));
        if (matchesTarget && matchesEmp) return true;
      }

      return false;
    });
    return sortByRoleRanking(list);
  }, [employeesList, branchManagerName, managedRegion, managedBranch]);

  const managers = useMemo(() => {
    return branchEmployees.filter((emp) => {
      const r = (emp.role || "").toLowerCase();
      const raw = (emp.rawRole || "").toUpperCase();
      return (raw === "MANAGER" || r.includes("manager") || r.includes("lead")) && !r.includes("branch");
    });
  }, [branchEmployees]);

  const displayedManagers = useMemo(() => {
    return managers.filter((m) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = m.name?.toLowerCase().includes(q);
        const matchBranch = m.branch?.toLowerCase().includes(q);
        const matchEmail = m.email?.toLowerCase().includes(q);
        if (!matchName && !matchBranch && !matchEmail) return false;
      }
      return true;
    });
  }, [managers, searchQuery]);

  const teamMembers = useMemo(() => {
    if (!selectedManagerForTeam) return [];
    const mgrName = (selectedManagerForTeam.name || selectedManagerForTeam.fullName || "").toLowerCase().trim();
    return branchEmployees.filter((emp) => {
      const repMgr = (typeof emp.reportingManager === "object"
        ? (emp.reportingManager?.fullName || emp.reportingManager?.name || "")
        : (emp.reportingManager || "")).toLowerCase().trim();
      const empBM = (emp.branchManager || emp.branchManagerName || "").toLowerCase().trim();
      const isManagerHimself = emp.id === selectedManagerForTeam.id || (emp.email && emp.email.toLowerCase() === selectedManagerForTeam.email?.toLowerCase());
      if (isManagerHimself) return false;

      return (
        (repMgr && (repMgr === mgrName || repMgr.includes(mgrName) || mgrName.includes(repMgr))) ||
        (empBM && (empBM === mgrName || empBM.includes(mgrName) || mgrName.includes(empBM))) ||
        (managers.length === 1 && !((emp.role || "").toLowerCase().includes("manager")))
      );
    });
  }, [branchEmployees, selectedManagerForTeam, managers.length]);

  const displayedTeam = useMemo(() => {
    return teamMembers.filter((emp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.name?.toLowerCase().includes(q);
        const matchRole = emp.role?.toLowerCase().includes(q);
        const matchEmail = emp.email?.toLowerCase().includes(q);
        const matchPhone = emp.phone?.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  }, [teamMembers, searchQuery]);

  function openEmployeeInfo(employee) {
    setSelectedEmployeeInfo(employee);
  }
  function closeEmployeeInfo() {
    setSelectedEmployeeInfo(null);
  }

  const selectedInitials = selectedEmployeeInfo?.name
    ? selectedEmployeeInfo.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "EM";

  return (
    <section className="bm-page-view">
      {selectedManagerForTeam ? (
        <>
          {/* Header for Team View */}
          <div className="bm-header-banner">
            <div className="bm-header-info">
              <p className="bm-header-eyebrow">{selectedManagerForTeam.branch} Region</p>
              <h1 className="bm-header-title">Team: {selectedManagerForTeam.name}</h1>
              <p className="bm-header-subtitle">
                Sales representatives reporting directly under {selectedManagerForTeam.name}.
              </p>
            </div>
            <button
              type="button"
              className="bm-btn-secondary"
              onClick={() => {
                setSelectedManagerForTeam(null);
                setSearchQuery("");
              }}
            >
              ← Back to Managers
            </button>
          </div>

          {/* Search Toolbar */}
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
                  placeholder="Search team member by name, role, email, or phone..."
                />
              </div>
            </div>

            <div className="bm-count-badge">
              <span>Showing</span>
              <strong>{displayedTeam.length}</strong>
              <span>of {teamMembers.length} members</span>
            </div>
          </div>

          {/* Team Table */}
          <div className="analytics-card bm-table-card">
            <div className="bm-table-scroll">
              <table className="bm-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Email Address</th>
                    <th>Phone</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedTeam.map((employee) => {
                    const initials = employee.name
                      ? employee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "SP";

                    return (
                      <tr key={employee.id}>
                        <td>
                          <div className="bm-member-avatar-cell">
                            <div className="bm-member-avatar">{initials}</div>
                            <div className="bm-member-details">
                              <strong className="bm-member-name">{employee.name}</strong>
                              <span className="bm-member-branch">
                                {cleanBranchDisplay(employee.branch)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="bm-role-tag">{employee.role}</span>
                        </td>
                        <td>
                          <span>{employee.email}</span>
                        </td>
                        <td>
                          <span className="bm-phone-text">
                            {employee.phone}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="bm-view-btn"
                            type="button"
                            onClick={() => openEmployeeInfo(employee)}
                          >
                            <Icon name="eye" size={13} />
                            <span>View Profile</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {displayedTeam.length === 0 && (
                    <tr>
                      <td colSpan={5} className="bm-empty-state">
                        No team members found for this manager.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Header for Managers View */}
          <div className="bm-header-banner">
            <div className="bm-header-info">
              <p className="bm-header-eyebrow">Workforce Leadership</p>
              <h1 className="bm-header-title">Branch Regional Managers</h1>
              <p className="bm-header-subtitle">
                Select a regional sales manager to inspect their assigned sales team, territory coverage, and staff directory.
              </p>
            </div>
          </div>

          {/* KPI Ribbon */}
          <div className="bm-kpi-ribbon">
            <div className="analytics-card bm-kpi-tile">
              <div className="bm-kpi-tile-top">
                <span className="bm-kpi-tile-label">Total Managers</span>
                <div className="bm-kpi-tile-icon">
                  <Icon name="team" size={16} />
                </div>
              </div>
              <div>
                <strong className="bm-kpi-tile-value">{managers.length}</strong>
                <span className="bm-kpi-tile-sub">Active Regional Leads</span>
              </div>
            </div>

            <div className="analytics-card bm-kpi-tile">
              <div className="bm-kpi-tile-top">
                <span className="bm-kpi-tile-label">Total Staff</span>
                <div className="bm-kpi-tile-icon blue">
                  <Icon name="users" size={16} />
                </div>
              </div>
              <div>
                <strong className="bm-kpi-tile-value">{branchEmployees.length}</strong>
                <span className="bm-kpi-tile-sub">Employees at Branch</span>
              </div>
            </div>

            <div className="analytics-card bm-kpi-tile">
              <div className="bm-kpi-tile-top">
                <span className="bm-kpi-tile-label">Territory Nodes</span>
                <div className="bm-kpi-tile-icon green">
                  <Icon name="building" size={16} />
                </div>
              </div>
              <div>
                <strong className="bm-kpi-tile-value">{managedRegion}</strong>
                <span className="bm-kpi-tile-sub">Designated Territory</span>
              </div>
            </div>
          </div>

          {/* Search Toolbar */}
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
                  placeholder="Search managers by name, branch, or email..."
                />
              </div>
            </div>

            <div className="bm-count-badge">
              <span>Showing</span>
              <strong>{displayedManagers.length}</strong>
              <span>of {managers.length} managers</span>
            </div>
          </div>

          {/* Managers Table */}
          <div className="analytics-card bm-table-card">
            <div className="bm-table-scroll">
              <table className="bm-table">
                <thead>
                  <tr>
                    <th>Manager Name</th>
                    <th>Region / Branch</th>
                    <th>Assigned Sales Reps</th>
                    <th>Contact Info</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedManagers.map((manager) => {
                    const mgrName = (manager.name || manager.fullName || "").toLowerCase().trim();
                    const teamCount = branchEmployees.filter((emp) => {
                      const repMgr = (typeof emp.reportingManager === "object"
                        ? (emp.reportingManager?.fullName || emp.reportingManager?.name || "")
                        : (emp.reportingManager || "")).toLowerCase().trim();
                      const empBM = (emp.branchManager || emp.branchManagerName || "").toLowerCase().trim();
                      const isManagerHimself = emp.id === manager.id || (emp.email && emp.email.toLowerCase() === manager.email?.toLowerCase());
                      if (isManagerHimself) return false;

                      return (
                        (repMgr && (repMgr === mgrName || repMgr.includes(mgrName) || mgrName.includes(repMgr))) ||
                        (empBM && (empBM === mgrName || empBM.includes(mgrName) || mgrName.includes(empBM))) ||
                        (managers.length === 1 && !((emp.role || "").toLowerCase().includes("manager")))
                      );
                    }).length;

                    const initials = manager.name
                      ? manager.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "MG";

                    return (
                      <tr key={manager.id}>
                        <td>
                          <div className="bm-member-avatar-cell">
                            <div className="bm-member-avatar">{initials}</div>
                            <div className="bm-member-details">
                              <strong className="bm-member-name">{manager.name}</strong>
                              <span className="bm-member-branch">
                                {manager.branch} Regional Head
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="bm-service-pill">{manager.branch} Region</span>
                        </td>
                        <td>
                          <span className="bm-rep-pill">
                            <Icon name="team" size={12} />
                            {teamCount} Team Members
                          </span>
                        </td>
                        <td>
                          <div>
                            <div>{manager.email}</div>
                            <div className="bm-phone-text">{manager.phone}</div>
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="bm-view-btn"
                            type="button"
                            onClick={() => {
                              setSelectedManagerForTeam(manager);
                              setSearchQuery("");
                            }}
                          >
                            <Icon name="eye" size={13} />
                            <span>View Team</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {displayedManagers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="bm-empty-state">
                        No manager records found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Employee Info Modal */}
      {selectedEmployeeInfo && (
        <SimpleModal onClose={closeEmployeeInfo}>
          <div className="bm-modal-profile">
            <div className="bm-modal-avatar">{selectedInitials}</div>
            <div>
              <h2 className="bm-header-title">{selectedEmployeeInfo.name}</h2>
              <span className="bm-role-tag">{selectedEmployeeInfo.role}</span>
            </div>
          </div>

          <div className="bm-modal-info-grid">
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Employee Name</span>
              <span className="bm-modal-card-val">{selectedEmployeeInfo.name}</span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Designation / Role</span>
              <span className="bm-modal-card-val">{selectedEmployeeInfo.role}</span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Assigned Branch</span>
              <span className="bm-modal-card-val">{selectedEmployeeInfo.branch || managedRegion}</span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Reporting Manager</span>
              <span className="bm-modal-card-val">
                {selectedEmployeeInfo.branchManager || selectedEmployeeInfo.reportingManager || branchManagerName}
              </span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Email Address</span>
              <span className="bm-modal-card-val">{selectedEmployeeInfo.email}</span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Phone Number</span>
              <span className="bm-modal-card-val bm-phone-text">
                {selectedEmployeeInfo.phone}
              </span>
            </div>
          </div>
        </SimpleModal>
      )}
    </section>
  );
}
