import React, { useState, useMemo } from "react";
import Icon from "../../components/Icon";
import SimpleModal from "../../components/SimpleModal";

export default function BranchManagerAdminPage({
  branchAdmins = [],
  branchManagerName = "",
  managedRegion = "",
  managedBranch = "",
}) {
  const [selectedEmployeeInfo, setSelectedEmployeeInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTeam = useMemo(() => {
    return branchAdmins.filter((emp) => {
      if (!emp) return false;
      const empBM = (emp.branchManagerName || emp.branchManager || "").toLowerCase().trim();
      const empRegion = (emp.region || "").toLowerCase().trim();
      const empBranch = (emp.branch || "").toLowerCase().trim();

      const targetBM = (branchManagerName || "").toLowerCase().trim();
      const targetRegion = (managedRegion || "").toLowerCase().trim();
      const targetBranch = (managedBranch || "").toLowerCase().trim();

      // Check if matches this branch/region
      let matchesBranch = false;
      if (targetBM && empBM && empBM === targetBM) {
        matchesBranch = true;
      } else if (targetBranch && empBranch && (empBranch === targetBranch || empBranch.includes(targetBranch) || targetBranch.includes(empBranch))) {
        matchesBranch = true;
      } else if (targetRegion && empRegion && (empRegion === targetRegion || empRegion.includes(targetRegion) || targetRegion.includes(empRegion))) {
        matchesBranch = true;
      } else {
        const keywords = ["mumbai", "west", "delhi", "north", "bengaluru", "south", "kolkata", "east"];
        for (const kw of keywords) {
          const matchesTarget = (targetRegion && targetRegion.includes(kw)) || (targetBranch && targetBranch.includes(kw));
          const matchesEmp = (empRegion && empRegion.includes(kw)) || (empBranch && empBranch.includes(kw));
          if (matchesTarget && matchesEmp) {
            matchesBranch = true;
            break;
          }
        }
      }

      if (!matchesBranch) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.name?.toLowerCase().includes(q);
        const matchRole = emp.role?.toLowerCase().includes(q);
        const matchEmail = emp.email?.toLowerCase().includes(q);
        const matchRegion = (emp.region || emp.branch)?.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchEmail && !matchRegion) return false;
      }
      return true;
    });
  }, [branchAdmins, branchManagerName, managedRegion, managedBranch, searchQuery]);

  function openEmployeeInfo(admin) {
    setSelectedEmployeeInfo(admin);
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
    : "AD";

  return (
    <section className="bm-page-view">
      {/* Header Banner */}
      <div className="bm-header-banner">
        <div className="bm-header-info">
          <p className="bm-header-eyebrow">Governance & Compliance</p>
          <h1 className="bm-header-title">Branch Administrators</h1>
          <p className="bm-header-subtitle">
            Operations coordinators, administrative officers, and regulatory compliance staff managing {managedRegion}.
          </p>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="bm-kpi-ribbon">
        <div className="analytics-card bm-kpi-tile">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Branch Admins</span>
            <div className="bm-kpi-tile-icon amber">
              <Icon name="roles" size={16} />
            </div>
          </div>
          <div>
            <strong className="bm-kpi-tile-value">{filteredTeam.length}</strong>
            <span className="bm-kpi-tile-sub">Active Administrators</span>
          </div>
        </div>

        <div className="analytics-card bm-kpi-tile">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Compliance Score</span>
            <div className="bm-kpi-tile-icon green">
              <Icon name="checkCircle" size={16} />
            </div>
          </div>
          <div>
            <strong className="bm-kpi-tile-value">100%</strong>
            <span className="bm-kpi-tile-sub">Audit & Regulatory Pass</span>
          </div>
        </div>

        <div className="analytics-card bm-kpi-tile">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Admin Hubs</span>
            <div className="bm-kpi-tile-icon blue">
              <Icon name="building" size={16} />
            </div>
          </div>
          <div>
            <strong className="bm-kpi-tile-value">{managedRegion}</strong>
            <span className="bm-kpi-tile-sub">Designated Admin Territory</span>
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
              placeholder="Search administrator by name, designation, email, or zone..."
            />
          </div>
        </div>

        <div className="bm-count-badge">
          <span>Showing</span>
          <strong>{filteredTeam.length}</strong>
          <span>of {filteredTeam.length} administrators</span>
        </div>
      </div>

      {/* Admin Table */}
      <div className="analytics-card bm-table-card">
        <div className="bm-table-scroll">
          <table className="bm-table">
            <thead>
              <tr>
                <th>Administrator</th>
                <th>Role & Scope</th>
                <th>Designated Zone</th>
                <th>Email Address</th>
                <th>Joining Date</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.map((admin) => {
                const initials = admin.name
                  ? admin.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "AD";

                return (
                  <tr key={admin.id}>
                    <td>
                      <div className="bm-member-avatar-cell">
                        <div className="bm-member-avatar admin">
                          {initials}
                        </div>
                        <div className="bm-member-details">
                          <strong className="bm-member-name">{admin.name}</strong>
                          <span className="bm-member-branch">
                            Branch Operations Admin
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="bm-service-pill admin">
                        {admin.role || "Admin Officer"}
                      </span>
                    </td>
                    <td>
                      <span className="bm-rep-pill">
                        <Icon name="building" size={12} />
                        {admin.region || managedRegion}
                      </span>
                    </td>
                    <td>
                      <span>{admin.email}</span>
                    </td>
                    <td>
                      <span className="bm-date-text">{admin.joiningDate || "2023"}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="bm-view-btn"
                        type="button"
                        onClick={() => openEmployeeInfo(admin)}
                      >
                        <Icon name="eye" size={13} />
                        <span>View Profile</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredTeam.length === 0 && (
                <tr>
                  <td colSpan={6} className="bm-empty-state">
                    No administrators found for this branch matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Employee Modal */}
      {selectedEmployeeInfo && (
        <SimpleModal onClose={closeEmployeeInfo}>
          <div className="bm-modal-profile">
            <div className="bm-modal-avatar admin">
              {selectedInitials}
            </div>
            <div>
              <h2 className="bm-header-title">{selectedEmployeeInfo.name}</h2>
              <span className="bm-role-tag admin">
                {selectedEmployeeInfo.role}
              </span>
            </div>
          </div>

          <div className="bm-modal-info-grid">
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Administrator Name</span>
              <span className="bm-modal-card-val">{selectedEmployeeInfo.name}</span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Operational Role</span>
              <span className="bm-modal-card-val">{selectedEmployeeInfo.role}</span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Governance Territory</span>
              <span className="bm-modal-card-val">{selectedEmployeeInfo.region || managedRegion}</span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Reporting Branch Head</span>
              <span className="bm-modal-card-val">
                {selectedEmployeeInfo.branchManagerName || branchManagerName}
              </span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Email Address</span>
              <span className="bm-modal-card-val">{selectedEmployeeInfo.email}</span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Onboarding Date</span>
              <span className="bm-modal-card-val">{selectedEmployeeInfo.joiningDate || "2023"}</span>
            </div>
          </div>
        </SimpleModal>
      )}
    </section>
  );
}
