import React, { useState, useMemo } from "react";
import Icon from "../../components/Icon";
import SimpleModal from "../../components/SimpleModal";

export default function BranchManagerMarketingPage({
  branchMarketing = [],
  branchManagerName = "Ariana Lee",
  managedRegion = "West Zone",
}) {
  const [selectedEmployeeInfo, setSelectedEmployeeInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTeam = useMemo(() => {
    return branchMarketing.filter((emp) => {
      if (!emp) return false;
      const empBM = (emp.branchManagerName || emp.branchManager || "").toLowerCase().trim();
      const empRegion = (emp.region || emp.branch || "").toLowerCase().trim();

      const targetBM = (branchManagerName || "").toLowerCase().trim();
      const targetRegion = (managedRegion || "").toLowerCase().trim();

      if (targetBM && empBM && empBM !== targetBM) return false;
      if (targetRegion && empRegion && !empRegion.includes(targetRegion.split(" ")[0].toLowerCase()) && !targetRegion.includes(empRegion)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.name?.toLowerCase().includes(q);
        const matchRole = emp.role?.toLowerCase().includes(q);
        const matchEmail = emp.email?.toLowerCase().includes(q);
        const matchRegion = emp.region?.toLowerCase().includes(q);
        if (!matchName && !matchRole && !matchEmail && !matchRegion) return false;
      }
      return true;
    });
  }, [branchMarketing, branchManagerName, managedRegion, searchQuery]);

  function openEmployeeInfo(emp) {
    setSelectedEmployeeInfo(emp);
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
    : "MK";

  return (
    <section className="bm-page-view">
      {/* Header Banner */}
      <div className="bm-header-banner">
        <div className="bm-header-info">
          <p className="bm-header-eyebrow">Growth & Campaigns</p>
          <h1 className="bm-header-title">Branch Marketing Specialists</h1>
          <p className="bm-header-subtitle">
            Marketing campaign leads, brand strategists, and SEO specialists deployed across {managedRegion}.
          </p>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="bm-kpi-ribbon">
        <div className="analytics-card bm-kpi-tile">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Marketing Team</span>
            <div className="bm-kpi-tile-icon pink">
              <Icon name="arrowUp" size={16} />
            </div>
          </div>
          <div>
            <strong className="bm-kpi-tile-value">{filteredTeam.length}</strong>
            <span className="bm-kpi-tile-sub">Active Specialists</span>
          </div>
        </div>

        <div className="analytics-card bm-kpi-tile">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Campaign Reach</span>
            <div className="bm-kpi-tile-icon green">
              <Icon name="checkCircle" size={16} />
            </div>
          </div>
          <div>
            <strong className="bm-kpi-tile-value">+24.6%</strong>
            <span className="bm-kpi-tile-sub">Lead Inflow Growth MoM</span>
          </div>
        </div>

        <div className="analytics-card bm-kpi-tile">
          <div className="bm-kpi-tile-top">
            <span className="bm-kpi-tile-label">Territory Coverage</span>
            <div className="bm-kpi-tile-icon blue">
              <Icon name="building" size={16} />
            </div>
          </div>
          <div>
            <strong className="bm-kpi-tile-value">{managedRegion}</strong>
            <span className="bm-kpi-tile-sub">Active Campaign Territory</span>
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
              placeholder="Search marketing expert by name, role, email, or region..."
            />
          </div>
        </div>

        <div className="bm-count-badge">
          <span>Showing</span>
          <strong>{filteredTeam.length}</strong>
          <span>of {filteredTeam.length} specialists</span>
        </div>
      </div>

      {/* Marketing Table */}
      <div className="analytics-card bm-table-card">
        <div className="bm-table-scroll">
          <table className="bm-table">
            <thead>
              <tr>
                <th>Specialist</th>
                <th>Role & Focus Area</th>
                <th>Target Territory</th>
                <th>Email Address</th>
                <th>Joining Date</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeam.map((emp) => {
                const initials = emp.name
                  ? emp.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "MK";

                return (
                  <tr key={emp.id}>
                    <td>
                      <div className="bm-member-avatar-cell">
                        <div className="bm-member-avatar marketing">
                          {initials}
                        </div>
                        <div className="bm-member-details">
                          <strong className="bm-member-name">{emp.name}</strong>
                          <span className="bm-member-branch">
                            Marketing Specialist
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="bm-service-pill marketing">
                        {emp.role || "Marketing"}
                      </span>
                    </td>
                    <td>
                      <span className="bm-rep-pill">
                        <Icon name="building" size={12} />
                        {emp.region || managedRegion}
                      </span>
                    </td>
                    <td>
                      <span>{emp.email}</span>
                    </td>
                    <td>
                      <span className="bm-date-text">{emp.joiningDate || "2023"}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="bm-view-btn"
                        type="button"
                        onClick={() => openEmployeeInfo(emp)}
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
                    No marketing specialists found for this branch matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Marketing Employee Modal */}
      {selectedEmployeeInfo && (
        <SimpleModal onClose={closeEmployeeInfo}>
          <div className="bm-modal-profile">
            <div className="bm-modal-avatar marketing">
              {selectedInitials}
            </div>
            <div>
              <h2 className="bm-header-title">{selectedEmployeeInfo.name}</h2>
              <span className="bm-role-tag marketing">
                {selectedEmployeeInfo.role}
              </span>
            </div>
          </div>

          <div className="bm-modal-info-grid">
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Specialist Name</span>
              <span className="bm-modal-card-val">{selectedEmployeeInfo.name}</span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Focus Area</span>
              <span className="bm-modal-card-val">{selectedEmployeeInfo.role}</span>
            </div>
            <div className="bm-modal-card">
              <span className="bm-modal-card-label">Campaign Territory</span>
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
