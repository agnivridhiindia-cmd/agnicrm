import React, { useState, useMemo, useEffect } from "react";
import Icon from "../../components/Icon";
import ManagerEmployeeInfoModal from "./ManagerEmployeeInfoModal";
import { calculatePaymentMetricsFromClients, formatCurrency } from "../../utils/paymentHelpers";
import { normalizeSalesPersonName, cleanBranchDisplay } from "../../utils/branchHelper";
import { getSalesPersonProfile, getSalesPersonQuota } from "../../utils/salesConfigHelper";

export default function ManagerTeamPage({
  branchTeam = [],
  clients = [],
  managedRegion = "East Zone",
  managerName = "Manager",
  branchManagerName = "",
}) {
  const effectiveBranchManager = branchManagerName || branchTeam[0]?.branchManager || managerName || "Branch Manager";
  const [selectedMember, setSelectedMember] = useState(null);
  const [filterRole, setFilterRole] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [configUpdateTrigger, setConfigUpdateTrigger] = useState(0);

  useEffect(() => {
    const handleConfigUpdate = () => {
      setConfigUpdateTrigger((prev) => prev + 1);
    };
    window.addEventListener("agni_sales_config_updated", handleConfigUpdate);
    window.addEventListener("storage", handleConfigUpdate);
    return () => {
      window.removeEventListener("agni_sales_config_updated", handleConfigUpdate);
      window.removeEventListener("storage", handleConfigUpdate);
    };
  }, []);

  const roles = Array.from(new Set(branchTeam.map((m) => m.role))).filter(Boolean);

  // Use the same payment metrics calculator as Overview & Revenue pages
  // This ensures consistency: manager sees the same numbers the salesperson sees
  const paymentMetrics = useMemo(() => {
    return calculatePaymentMetricsFromClients(clients, branchTeam, "all");
  }, [clients, branchTeam]);

  // Build a lookup map: normalized salesperson name → monthly total from breakdown
  const memberMonthlyMap = useMemo(() => {
    const map = new Map();
    (paymentMetrics.breakdown || []).forEach((sp) => {
      if (sp.name) {
        map.set(sp.name.toLowerCase().trim(), sp.monthly || 0);
      }
    });
    return map;
  }, [paymentMetrics]);

  const displayedTeam = useMemo(() => {
    return branchTeam.filter((member) => {
      if (filterRole !== "all" && member.role !== filterRole) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = member.name?.toLowerCase().includes(q);
        const matchEmail = member.email?.toLowerCase().includes(q);
        const matchPhone = member.phone?.toLowerCase().includes(q);
        const matchRole = member.role?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchRole) return false;
      }
      return true;
    });
  }, [branchTeam, filterRole, searchQuery]);

  // Helper: get monthly achieved for a team member from the shared metrics breakdown
  const getMemberMonthlyAchieved = (member) => {
    if (!member) return 0;
    const normName = normalizeSalesPersonName(member.name);
    return memberMonthlyMap.get((normName || "").toLowerCase().trim()) || 0;
  };

  return (
    <section className="manager-page-view">
      {/* Header Banner */}
      <div className="manager-header-banner">
        <div className="manager-header-info">
          <p className="manager-header-eyebrow">Sales Team Operations</p>
          <h1 className="manager-header-title">{managedRegion} Team</h1>
          <p className="manager-header-subtitle">
            Manage regional sales representatives, monthly quotas, territory coverage, and employee profiles.
          </p>
        </div>
      </div>

      {/* Team KPI Stats Ribbon */}
      <div className="manager-kpi-ribbon">
        <div className="analytics-card manager-kpi-tile">
          <div className="manager-kpi-tile-top">
            <span className="manager-kpi-tile-label">Team Members</span>
            <div className="manager-kpi-tile-icon">
              <Icon name="users" size={16} />
            </div>
          </div>
          <div>
            <strong className="manager-kpi-tile-value">{branchTeam.length}</strong>
          </div>
        </div>

        <div className="analytics-card manager-kpi-tile">
          <div className="manager-kpi-tile-top">
            <span className="manager-kpi-tile-label">Branch Region</span>
            <div className="manager-kpi-tile-icon" style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6" }}>
              <Icon name="building" size={16} />
            </div>
          </div>
          <div>
            <strong className="manager-kpi-tile-value" style={{ color: "#3b82f6" }}>{managedRegion}</strong>
          </div>
        </div>

        <div className="analytics-card manager-kpi-tile">
          <div className="manager-kpi-tile-top">
            <span className="manager-kpi-tile-label">Reporting Manager</span>
            <div className="manager-kpi-tile-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
              <Icon name="checkCircle" size={16} />
            </div>
          </div>
          <div>
            <strong className="manager-kpi-tile-value" style={{ color: "#10b981" }}>{effectiveBranchManager}</strong>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
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
              placeholder="Search team member by name, role, email, or phone..."
            />
          </div>

          {roles.length > 0 && (
            <select
              className="manager-filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="manager-count-badge">
          <span>Showing</span>
          <strong>{displayedTeam.length}</strong>
          <span>of {branchTeam.length} members</span>
        </div>
      </div>

      {/* Team Table Card */}
      <div className="analytics-card manager-table-card">
        <div className="manager-table-scroll">
          <table className="manager-team-table" style={{ tableLayout: "fixed", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ width: "31%" }}>Member</th>
                <th style={{ width: "15%" }}>Role</th>
                <th style={{ width: "27%" }}>Monthly Quota</th>
                <th style={{ width: "12%" }}>Joined</th>
                <th style={{ width: "15%", textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayedTeam.map((member) => {
                const quotaTargetNum = Number(member.targetQuota || getSalesPersonQuota(member.name || member.id) || 80000);
                const achievedNum = getMemberMonthlyAchieved(member);
                const progressPct = quotaTargetNum > 0 ? Math.min(100, Math.max(0, Math.round((achievedNum / quotaTargetNum) * 100))) : 0;
                const displayTarget = quotaTargetNum >= 1000 ? `₹${Math.round(quotaTargetNum / 1000)}k` : `₹${quotaTargetNum}`;
                const displayAchieved = achievedNum > 0 ? (achievedNum >= 1000 ? `₹${Math.round(achievedNum / 1000)}k` : `₹${achievedNum}`) : "₹0";
                const displayRole = member.designation || getSalesPersonProfile(member.name || member.id, member.role);

                return (
                  <tr key={member.id}>
                    <td>
                      <div className="manager-member-details">
                        <strong className="manager-member-name" style={{ whiteSpace: "nowrap" }}>{member.name}</strong>
                        <span className="manager-member-branch" style={{ whiteSpace: "nowrap" }}>
                          {cleanBranchDisplay(member.branch)} • {member.region || managedRegion}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="manager-role-tag">{displayRole}</span>
                    </td>
                    <td>
                      <div className="manager-quota-cell">
                        <div className="manager-quota-numbers">
                          <span>{displayAchieved}</span>
                          <span style={{ color: "#7a748e" }}>Target: {displayTarget}</span>
                        </div>
                        <div className="manager-quota-bar">
                          <div
                            className="manager-quota-fill"
                            style={{
                              width: `${progressPct}%`,
                              background: progressPct >= 100 ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #8c5ff8, #6d3bf5)",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12.5, color: "#7a748e", whiteSpace: "nowrap" }}>{member.joiningDate || "Jan 2025"}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="manager-view-btn"
                        type="button"
                        onClick={() => setSelectedMember({ ...member, monthlySales: displayAchieved, quota: displayTarget })}
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
                  <td colSpan={5} className="manager-empty-state">
                    No team members found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedMember && (
        <ManagerEmployeeInfoModal
          member={selectedMember}
          managerName={effectiveBranchManager}
          onClose={() => setSelectedMember(null)}
        />
      )}
    </section>
  );
}
