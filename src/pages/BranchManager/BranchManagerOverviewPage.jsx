import React, { useMemo } from "react";
import KpiCard from "../../components/KpiCard";
import { BranchRevenueChart } from "../../components/charts";
import { branchRevenueData } from "./mockBranchManagerData";
import { calculateRevenueMetrics } from "../../utils/revenueCalculator";
import { apiFetch } from "../../services/apiClient";

const branchActivities = [
  {
    title: "New Client Assignment",
    detail: "Bright Retail assigned to East branch",
    tone: "#9a74e9",
    time: "10m ago",
  },
  {
    title: "Milestone Cleared",
    detail: "Doc audit completed for Urban Foods",
    tone: "#10b981",
    time: "32m ago",
  },
  {
    title: "Revenue Disbursed",
    detail: "₹68k commercial token settled",
    tone: "#4e7cff",
    time: "1h ago",
  },
  {
    title: "IT Support Resolved",
    detail: "Server sync verified for West branch",
    tone: "#f59e0b",
    time: "2h ago",
  },
  {
    title: "Manager Review Scheduled",
    detail: "Monthly regional sync with North Zone",
    tone: "#8c5ff8",
    time: "4h ago",
  },
  {
    title: "Campaign Initiated",
    detail: "Q3 Marketing leads allocated to sales",
    tone: "#ec4899",
    time: "Yesterday",
  },
  {
    title: "Compliance Verified",
    detail: "Quarterly audit & tax filings checked",
    tone: "#06b6d4",
    time: "1d ago",
  },
  {
    title: "Team Quota Updated",
    detail: "South Zone targets increased by 15%",
    tone: "#10b981",
    time: "2d ago",
  },
];

export default function BranchManagerOverviewPage({
  dark,
  onNavigate,
  clients = [],
  managedBranch = "West Zone (Mumbai)",
  managedRegion = "West Zone",
  branchManagerName = "Ariana Lee",
  employeesList = [],
  branchAdmins = [],
  branchIT = [],
  branchMarketing = [],
}) {
  const revenueMetrics = useMemo(() => calculateRevenueMetrics(clients, []), [clients]);

  // Helper filter for branch staff members excluding Branch Manager himself
  const isBranchMember = React.useCallback((emp) => {
    if (!emp) return false;
    const role = (emp.role || "").toLowerCase().trim();
    const rawRole = (emp.rawRole || "").toUpperCase().trim();
    if (rawRole === "BRANCH_MANAGER" || role.includes("branch manager") || role.includes("branch director")) return false;
    if (emp.name && branchManagerName && emp.name.toLowerCase().trim() === branchManagerName.toLowerCase().trim()) return false;

    const empBM = (emp.branchManager || emp.branchManagerName || "").toLowerCase().trim();
    const empRegion = (emp.region || "").toLowerCase().trim();
    const empBranch = (emp.branch || "").toLowerCase().trim();
    const targetBM = (branchManagerName || "").toLowerCase().trim();
    const targetRegion = (managedRegion || "").toLowerCase().trim();
    const targetBranch = (managedBranch || "").toLowerCase().trim();

    if (targetBM && empBM && empBM === targetBM) return true;
    if (targetBranch && empBranch && (empBranch === targetBranch || empBranch.includes(targetBranch) || targetBranch.includes(empBranch))) return true;
    if (targetRegion && empRegion && (empRegion === targetRegion || empRegion.includes(targetRegion) || targetRegion.includes(empRegion))) return true;

    const keywords = ["mumbai", "west", "delhi", "north", "bengaluru", "south", "kolkata", "east"];
    for (const kw of keywords) {
      const matchesTarget = (targetRegion && targetRegion.includes(kw)) || (targetBranch && targetBranch.includes(kw));
      const matchesEmp = (empRegion && empRegion.includes(kw)) || (empBranch && empBranch.includes(kw));
      if (matchesTarget && matchesEmp) return true;
    }
    return false;
  }, [branchManagerName, managedRegion, managedBranch]);

  // Number of Sales Managers in that branch (strictly from PostgreSQL)
  const salesManagersCount = useMemo(() => {
    const list = Array.isArray(employeesList) ? employeesList : [];
    const branchSalesTeam = list.filter(isBranchMember);
    const smList = branchSalesTeam.filter((emp) => {
      const r = (emp.role || "").toLowerCase();
      const raw = (emp.rawRole || "").toUpperCase();
      return (raw === "MANAGER" || r.includes("manager") || r.includes("lead")) && !r.includes("branch");
    });
    return smList.length;
  }, [employeesList, isBranchMember]);

  // Total Employees working in that branch (excluding Branch Manager himself, strictly from PostgreSQL)
  const totalEmployeesCount = useMemo(() => {
    const salesList = Array.isArray(employeesList) ? employeesList : [];
    const adminList = Array.isArray(branchAdmins) ? branchAdmins : [];
    const itList = Array.isArray(branchIT) ? branchIT : [];
    const mktList = Array.isArray(branchMarketing) ? branchMarketing : [];

    const salesTeam = salesList.filter(isBranchMember);
    const adminTeam = adminList.filter(isBranchMember);
    const itTeam = itList.filter(isBranchMember);
    const mktTeam = mktList.filter(isBranchMember);

    return salesTeam.length + adminTeam.length + itTeam.length + mktTeam.length;
  }, [employeesList, branchAdmins, branchIT, branchMarketing, isBranchMember]);

  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    async function syncPending() {
      try {
        const res = await apiFetch("/requests");
        if (res.ok) {
          const resData = await res.json();
          if (resData.success && Array.isArray(resData.data)) {
            const count = resData.data.filter((r) => r.status === "PENDING").length;
            setPendingCount(count);
          }
        }
      } catch (e) {}
    }
    syncPending();
    window.addEventListener("storage", syncPending);
    window.addEventListener("agni_requests_updated", syncPending);
    window.addEventListener("agni_pending_updated", syncPending);
    window.addEventListener("agni_clients_updated", syncPending);
    const interval = setInterval(syncPending, 30000);
    return () => {
      window.removeEventListener("storage", syncPending);
      window.removeEventListener("agni_requests_updated", syncPending);
      window.removeEventListener("agni_pending_updated", syncPending);
      window.removeEventListener("agni_clients_updated", syncPending);
      clearInterval(interval);
    };
  }, []);

  const dynamicKpiCards = useMemo(() => {
    const netRev = revenueMetrics.totalReceivedNet || 0;
    return [
      { label: "Total Regional Managers", value: String(salesManagersCount), trend: "Sales Managers", description: "Sales managers in branch", accent: "#9a74e9", linkTo: "Employees" },
      { label: "Total Employees", value: String(totalEmployeesCount), trend: "Live DB", description: "Staff in branch (excl. manager)", accent: "#4e7cff", linkTo: "Employees" },
      { label: "Active Clients", value: String(clients.length || 0), trend: "Live DB", description: "Currently active", accent: "#44bfb0", linkTo: "Clients" },
      { label: "Pending Requests", value: String(pendingCount), trend: pendingCount > 0 ? `${pendingCount} Needs Action` : "All Clear", description: "Awaiting review", accent: "#f2aa38", linkTo: "Requests" },
      { label: "Branch Revenue", value: `₹${netRev.toLocaleString("en-IN")}`, trend: "Excl. 18% GST", description: "Payments minus 18% GST (payment/1.18)", accent: "#f97316", linkTo: "Revenue" },
    ];
  }, [clients, revenueMetrics, pendingCount, salesManagersCount, totalEmployeesCount]);

  return (
    <section className="dashboard-layout bm-overview-layout">
      <div className="dashboard-main bm-overview-main">
        {/* KPI Grid */}
        <section className="kpi-grid">
          {dynamicKpiCards.map((card) => (
            <KpiCard
              key={card.label}
              card={card}
              dark={dark}
              onAction={(c) => onNavigate && onNavigate(c.linkTo)}
            />
          ))}
        </section>

        {/* Branch Overview Analytics Chart */}
        <div className="analytics-card bm-overview-chart-card">
          <div className="panel-header bm-panel-header-gap">
            <div>
              <p className="eyebrow bm-panel-eyebrow">Financial Health</p>
              <h2 className="bm-panel-heading">Branch Overview</h2>
              <p className="bm-panel-subtext">
                Key metrics, territorial distribution, and regional branch revenue across zones.
              </p>
            </div>
          </div>
          <BranchRevenueChart data={branchRevenueData} />
        </div>
      </div>

      {/* Full-Height Recent Activity Sidebar with No Scroll */}
      <aside className="owner-sidebar-widgets bm-sidebar-widgets-flex">
        <section className="activity-panel bm-activity-panel">
          <div className="panel-header bm-panel-header-gap-sm">
            <div>
              <p className="eyebrow bm-panel-eyebrow">Live Activity Feed</p>
              <h2 className="bm-panel-heading">What’s happening</h2>
            </div>
          </div>

          <div className="activity-list bm-activity-list">
            {branchActivities.map((act) => (
              <div className="activity-row bm-activity-row" key={act.title}>
                <span className="activity-mark bm-activity-mark" style={{ background: act.tone, boxShadow: `0 0 8px ${act.tone}` }} />
                <div className="bm-activity-content">
                  <strong className="bm-activity-title">
                    {act.title}
                  </strong>
                  <small className="bm-activity-detail">
                    {act.detail}
                  </small>
                </div>
                <time className="bm-activity-time">
                  {act.time}
                </time>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}
