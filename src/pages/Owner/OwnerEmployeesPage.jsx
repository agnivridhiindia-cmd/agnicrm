import React, { useState, useEffect, useMemo } from "react";
import Icon from "../../components/Icon";
import { employeeRoles, branchOptions, branchToRegionMap } from "./mockOwnerData";
import { getTrackerState } from "../../utils/schemeTracker";
import { sortByRoleRanking, isBranchMatch, cleanBranchDisplay } from "../../utils/branchHelper";
import { apiFetch } from "../../services/apiClient";
import CreateEmployeeModal from "./CreateEmployeeModal";
import DeleteConfirmModal from "./DeleteConfirmModal";
import DeletedEmployeeArchiveModal from "./DeletedEmployeeArchiveModal";

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
  onEmployeeCreated,
  dark,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [employeesPage, setEmployeesPage] = useState(1);
  const [managerTeamView, setManagerTeamView] = useState(null);
  const [salesClientsView, setSalesClientsView] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeDirectoryTab, setActiveDirectoryTab] = useState("active"); // 'active' | 'deleted'
  const [deletedEmployees, setDeletedEmployees] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [selectedArchiveRecord, setSelectedArchiveRecord] = useState(null);
  const [archiveSearchTerm, setArchiveSearchTerm] = useState("");

  const fetchDeletedEmployees = async () => {
    setDeletedLoading(true);
    try {
      const res = await apiFetch("/employees/deleted");
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.deletedEmployees)) {
          setDeletedEmployees(data.deletedEmployees);
        }
      }
    } catch (err) {
      console.warn("Could not load deleted employees archive:", err);
    } finally {
      setDeletedLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedEmployees();
    window.addEventListener("agni_employees_updated", fetchDeletedEmployees);
    return () => {
      window.removeEventListener("agni_employees_updated", fetchDeletedEmployees);
    };
  }, []);

  const handleConfirmSoftDelete = async (emp) => {
    const res = await apiFetch(`/employees/${emp.id}`, {
      method: "DELETE",
      body: { reason: "Soft-deleted by Owner from Workforce Directory" },
    });
    const data = await res.json();
    if (data.success) {
      setEmployeeToDelete(null);
      if (onDeleteEmployee) {
        onDeleteEmployee(emp);
      }
      fetchDeletedEmployees();
    } else {
      throw new Error(data.message || "Failed to soft-delete employee.");
    }
  };

  const handleRestoreEmployee = async (empId) => {
    try {
      const res = await apiFetch(`/employees/${empId}/restore`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setSelectedArchiveRecord(null);
        fetchDeletedEmployees();
        window.dispatchEvent(new Event("agni_employees_updated"));
        window.location.reload();
      } else {
        alert(data.message || "Could not restore employee.");
      }
    } catch (err) {
      alert("Network error while restoring employee.");
    }
  };

  const filteredDeletedEmployees = useMemo(() => {
    if (!archiveSearchTerm.trim()) return deletedEmployees;
    const q = archiveSearchTerm.toLowerCase();
    return deletedEmployees.filter(
      (d) =>
        d.fullName?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q) ||
        d.role?.toLowerCase().includes(q) ||
        d.branchName?.toLowerCase().includes(q)
    );
  }, [deletedEmployees, archiveSearchTerm]);

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

  const branchFilterList = useMemo(() => {
    const branchesFromStaff = Array.from(validBranches).filter(Boolean);
    const cleanNames = branchesFromStaff.map((b) => cleanBranchDisplay(b));
    const unique = Array.from(new Set(cleanNames));
    if (unique.length === 0) unique.push("Noida Branch");
    return [
      { value: "", label: "All branches" },
      ...unique.map((b) => ({ value: b, label: b })),
    ];
  }, [validBranches]);

  const ROLE_DISPLAY_NAMES = {
    "All roles": "All roles",
    "branch manager": "Branch Manager",
    "manager": "Sales Manager",
    "sales": "Sales Person",
    "admin": "Admin",
    "IT": "IT Lead",
    "market": "Marketing",
  };

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
                              <span className="owner-member-branch">{cleanBranchDisplay(member.branch)}</span>
                              {(member.isTransferred || (member.originBranch && member.branch && member.originBranch !== member.branch)) && (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 3,
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    color: "#d97706",
                                    background: "rgba(217, 119, 6, 0.12)",
                                    padding: "2px 6px",
                                    borderRadius: 4,
                                    marginTop: 3,
                                    width: "fit-content",
                                  }}
                                  title={`Transferred staff: Started at ${member.originBranch}`}
                                >
                                  🔄 Origin: {member.originBranch}
                                </span>
                              )}
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
                              type="button"
                              onClick={() => onDeleteEmployee(member)}
                              title={`Delete ${member.name}`}
                            >
                              <Icon name="trash" size={13} />
                              <span>Delete</span>
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
      {/* Create Employee Modal */}
      {showCreateModal && (
        <CreateEmployeeModal
          dark={dark}
          onClose={() => setShowCreateModal(false)}
          onCreated={(emp) => {
            setShowCreateModal(false);
            if (onEmployeeCreated) onEmployeeCreated(emp);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {employeeToDelete && (
        <DeleteConfirmModal
          employee={employeeToDelete}
          dark={dark}
          onClose={() => setEmployeeToDelete(null)}
          onConfirm={handleConfirmSoftDelete}
        />
      )}

      {/* Deleted Employee Archive Modal */}
      {selectedArchiveRecord && (
        <DeletedEmployeeArchiveModal
          archiveRecord={selectedArchiveRecord}
          dark={dark}
          onClose={() => setSelectedArchiveRecord(null)}
          onRestore={handleRestoreEmployee}
        />
      )}

      {/* Header Banner */}
      <div className="owner-header-banner">
        <div className="owner-header-info">
          <p className="owner-header-eyebrow">Workforce Governance</p>
          <h1 className="owner-header-title">Enterprise Employee Directory</h1>
        </div>
        <button
          type="button"
          className="owner-btn-primary"
          style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}
          onClick={() => setShowCreateModal(true)}
        >
          <Icon name="plus" size={15} />
          Create Employee
        </button>
      </div>

      {/* Directory Section Tabs */}
      <div className="owner-directory-tabs">
        <button
          type="button"
          className={`owner-tab-pill ${activeDirectoryTab === "active" ? "active" : ""}`}
          onClick={() => setActiveDirectoryTab("active")}
        >
          <Icon name="team" size={15} />
          <span>Active Workforce ({staffEmployeesList.length})</span>
        </button>

        <button
          type="button"
          className={`owner-tab-pill owner-tab-pill-deleted ${activeDirectoryTab === "deleted" ? "active" : ""}`}
          onClick={() => {
            setActiveDirectoryTab("deleted");
            fetchDeletedEmployees();
          }}
        >
          <Icon name="trash" size={15} />
          <span>Deleted Employees Database Section ({deletedEmployees.length})</span>
        </button>
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

      {/* Directory Content Based on Tab */}
      {activeDirectoryTab === "deleted" ? (
        <div>
          {/* Deleted Directory Toolbar */}
          <div className="analytics-card owner-toolbar-card" style={{ marginBottom: 14 }}>
            <div className="owner-toolbar-filters">
              <div className="owner-search-box" style={{ maxWidth: 440 }}>
                <span className="owner-search-icon">
                  <Icon name="search" size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search deleted employees by name, email, role, branch..."
                  value={archiveSearchTerm}
                  onChange={(e) => setArchiveSearchTerm(e.target.value)}
                />
              </div>
              <div style={{ marginLeft: "auto", fontSize: 13, color: "#64748b" }}>
                <span>Preserved in Database: <strong>{deletedEmployees.length} employee(s)</strong></span>
              </div>
            </div>
          </div>

          {/* Deleted Employees Table */}
          <div className="analytics-card owner-table-card">
            <div className="owner-table-wrapper">
              <table className="owner-table">
                <thead>
                  <tr>
                    <th>DELETED EMPLOYEE &amp; BRANCH</th>
                    <th>CONTACT &amp; ROLE</th>
                    <th>DELETED ON / BY</th>
                    <th>PRESERVED DATA SNAPSHOT</th>
                    <th style={{ textAlign: "right" }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {deletedLoading ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, color: "#64748b" }}>
                          <span className="cem-spinner" style={{ borderColor: "#6366f1", borderTopColor: "transparent" }} />
                          <span>Loading deleted employees database section...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredDeletedEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: "48px 20px" }}>
                        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 8, color: "#94a3b8" }}>
                          <Icon name="checkCircle" size={32} />
                          <strong style={{ fontSize: 15, color: dark ? "#cbd5e1" : "#475569" }}>
                            {archiveSearchTerm ? "No matching deleted records found" : "No deleted employees in archive"}
                          </strong>
                          <span style={{ fontSize: 13, maxWidth: 360 }}>
                            {archiveSearchTerm
                              ? "Try searching with a different term."
                              : "When an employee is soft-deleted, their record and all registered clients, schemes, and services will appear here."}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredDeletedEmployees.map((record) => {
                      const initials = (record.fullName || "E").substring(0, 2).toUpperCase();
                      const delDate = record.deletedAt
                        ? new Date(record.deletedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—";

                      return (
                        <tr key={record.id}>
                          <td>
                            <div className="owner-member-avatar-cell">
                              <div
                                className="owner-member-avatar"
                                style={{
                                  background: "linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(220, 38, 38, 0.3))",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                }}
                              >
                                {initials}
                              </div>
                              <div className="owner-member-details">
                                <strong className="owner-member-name" style={{ textDecoration: "line-through", opacity: 0.85 }}>
                                  {record.fullName}
                                </strong>
                                <span className="owner-member-branch">
                                  {record.branchName || record.region || "All Branches"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 13, color: dark ? "#cbd5e1" : "#1e293b", fontWeight: 600 }}>
                              {record.email}
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                              <span className="owner-role-pill" style={{ opacity: 0.85 }}>
                                {record.role}
                              </span>
                              {record.phone && (
                                <span style={{ fontSize: 11.5, color: "#64748b" }}>{record.phone}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 12.5, fontWeight: 600, color: dark ? "#f8fafc" : "#334155" }}>
                              {delDate}
                            </div>
                            <div style={{ fontSize: 11.5, color: "#64748b", marginTop: 2 }}>
                              by {record.deletedBy || "Owner"}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  background: "rgba(99, 102, 241, 0.12)",
                                  color: "#6366f1",
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                }}
                              >
                                {record.totalClients || 0} Clients
                              </span>
                              <span
                                style={{
                                  padding: "3px 8px",
                                  borderRadius: 6,
                                  background: "rgba(16, 185, 129, 0.12)",
                                  color: "#10b981",
                                  fontSize: 11.5,
                                  fontWeight: 700,
                                }}
                              >
                                {record.totalSchemes || 0} Schemes
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div className="owner-actions-cell" style={{ justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                className="owner-btn-primary"
                                style={{ padding: "6px 12px", fontSize: 12 }}
                                onClick={() => setSelectedArchiveRecord(record)}
                              >
                                View Archived Data
                              </button>
                              <button
                                type="button"
                                className="owner-btn-secondary"
                                style={{
                                  padding: "6px 12px",
                                  fontSize: 12,
                                  borderColor: "rgba(16, 185, 129, 0.3)",
                                  color: "#10b981",
                                }}
                                onClick={() => handleRestoreEmployee(record.originalUserId || record.id)}
                              >
                                Restore
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
        </div>
      ) : (
        <div>
          {/* Toolbar Filter Card */}
      <div className="analytics-card owner-toolbar-card">
        <div className="owner-toolbar-filters">
          <div className="owner-search-box">
            <span className="owner-search-icon">
              <Icon name="search" size={15} />
            </span>
            <input
              type="text"
              placeholder="Search by name, branch, email, phone, role..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setEmployeesPage(1);
              }}
            />
            {searchTerm && (
              <button
                type="button"
                className="owner-search-clear-btn"
                onClick={() => {
                  setSearchTerm("");
                  setEmployeesPage(1);
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="owner-filter-control-group">
            <label className="owner-filter-inline-label" htmlFor="owner-role-filter">
              <Icon name="roles" size={13} />
              <span>Role:</span>
            </label>
            <div className="owner-select-wrapper">
              <select
                id="owner-role-filter"
                className="owner-filter-select"
                value={selectedRole}
                onChange={(event) => {
                  if (setSelectedRole) setSelectedRole(event.target.value);
                  setEmployeesPage(1);
                }}
              >
                {employeeRoles.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_DISPLAY_NAMES[role] || role}
                  </option>
                ))}
              </select>
              <span className="owner-select-chevron">▾</span>
            </div>
          </div>

          <div className="owner-filter-control-group">
            <label className="owner-filter-inline-label" htmlFor="owner-branch-filter">
              <Icon name="branches" size={13} />
              <span>Branch:</span>
            </label>
            <div className="owner-select-wrapper">
              <select
                id="owner-branch-filter"
                className="owner-filter-select"
                value={selectedBranch}
                onChange={(event) => {
                  setSelectedBranch(event.target.value);
                  setEmployeesPage(1);
                }}
              >
                {branchFilterList.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="owner-select-chevron">▾</span>
            </div>
          </div>

          {(searchTerm || (selectedRole && selectedRole !== "All roles") || selectedBranch) && (
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
                            <span className="owner-member-branch">{cleanBranchDisplay(employee.branch)}</span>
                            {(employee.isTransferred || (employee.originBranch && employee.branch && employee.originBranch !== employee.branch)) && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 3,
                                  fontSize: 10.5,
                                  fontWeight: 700,
                                  color: "#d97706",
                                  background: "rgba(217, 119, 6, 0.12)",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  marginTop: 3,
                                  width: "fit-content",
                                }}
                                title={`Transferred staff: Started at ${employee.originBranch}`}
                              >
                                🔄 Origin: {employee.originBranch}
                              </span>
                            )}
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
                            type="button"
                            onClick={() => setEmployeeToDelete(employee)}
                            title={`Delete ${employee.name}`}
                          >
                            <Icon name="trash" size={13} />
                            <span>Delete</span>
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
    </div>
  )}
</section>
  );
}
