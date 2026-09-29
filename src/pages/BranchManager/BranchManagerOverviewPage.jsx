import React, { useMemo } from "react";
import KpiCard from "../../components/KpiCard";
import { BranchRevenueChart } from "../../components/charts";
import {
  kpiCards as defaultKpiCards,
  branchRevenueData,
  initialEmployeesList as defaultEmployeesList,
  initialBranchAdmins as defaultBranchAdmins,
  initialBranchIT as defaultBranchIT,
  initialBranchMarketing as defaultBranchMarketing,
} from "./mockBranchManagerData";
import { calculateRevenueMetrics } from "../../utils/revenueCalculator";

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
    if (role.includes("branch manager") || role.includes("branch director")) return false;
    if (emp.name && branchManagerName && emp.name.toLowerCase().trim() === branchManagerName.toLowerCase().trim()) return false;

    const empBM = (emp.branchManager || emp.branchManagerName || "").toLowerCase().trim();
    const empRegion = (emp.region || emp.branch || "").toLowerCase().trim();
    const targetBM = (branchManagerName || "").toLowerCase().trim();
    const targetRegion = (managedRegion || "").toLowerCase().trim();

    if (targetBM && empBM && empBM === targetBM) return true;
    if (targetRegion && empRegion) {
      const firstWordTarget = targetRegion.split(" ")[0].toLowerCase();
      if (empRegion.includes(firstWordTarget) || targetRegion.includes(empRegion)) return true;
    }
    return false;
  }, [branchManagerName, managedRegion]);

  // Number of Sales Managers in that branch
  const salesManagersCount = useMemo(() => {
    const list = Array.isArray(employeesList) && employeesList.length > 0 ? employeesList : defaultEmployeesList;
    const branchSalesTeam = list.filter(isBranchMember);
    const smList = branchSalesTeam.filter((emp) => (emp.role || "").toLowerCase().includes("manager"));
    return smList.length;
  }, [employeesList, isBranchMember]);

  // Total Employees working in that branch (excluding Branch Manager himself)
  const totalEmployeesCount = useMemo(() => {
    const salesList = Array.isArray(employeesList) && employeesList.length > 0 ? employeesList : defaultEmployeesList;
    const adminList = Array.isArray(branchAdmins) && branchAdmins.length > 0 ? branchAdmins : defaultBranchAdmins;
    const itList = Array.isArray(branchIT) && branchIT.length > 0 ? branchIT : defaultBranchIT;
    const mktList = Array.isArray(branchMarketing) && branchMarketing.length > 0 ? branchMarketing : defaultBranchMarketing;

    const salesTeam = salesList.filter(isBranchMember);
    const adminTeam = adminList.filter(isBranchMember);
    const itTeam = itList.filter(isBranchMember);
    const mktTeam = mktList.filter(isBranchMember);

    return salesTeam.length + adminTeam.length + itTeam.length + mktTeam.length;
  }, [employeesList, branchAdmins, branchIT, branchMarketing, isBranchMember]);

  const [pendingCount, setPendingCount] = React.useState(() => {
    try {
      const c = JSON.parse(localStorage.getItem("agni_pending_client_creations") || "[]");
      const r = JSON.parse(localStorage.getItem("agni_client_requests") || "[]");
      const s = JSON.parse(localStorage.getItem("agni_pending_scheme_requests") || "[]");
      const isPending = (x) => {
        if (!x) return false;
        const st = String(x.status || "Pending").toLowerCase().trim();
        return st === "pending" || st === "pending manager approval" || st.includes("pending");
      };
      const pC = Array.isArray(c) ? c.filter(isPending).length : 0;
      const pR = Array.isArray(r) ? r.filter(isPending).length : 0;
      const pS = Array.isArray(s) ? s.filter(isPending).length : 0;
      return pC + pR + pS;
    } catch (e) { return 0; }
  });

  React.useEffect(() => {
    function syncPending() {
      try {
        const c = JSON.parse(localStorage.getItem("agni_pending_client_creations") || "[]");
        const r = JSON.parse(localStorage.getItem("agni_client_requests") || "[]");
        const s = JSON.parse(localStorage.getItem("agni_pending_scheme_requests") || "[]");
        const isPending = (x) => {
          if (!x) return false;
          const st = String(x.status || "Pending").toLowerCase().trim();
          return st === "pending" || st === "pending manager approval" || st.includes("pending");
        };
        const pC = Array.isArray(c) ? c.filter(isPending).length : 0;
        const pR = Array.isArray(r) ? r.filter(isPending).length : 0;
        const pS = Array.isArray(s) ? s.filter(isPending).length : 0;
        setPendingCount(pC + pR + pS);
      } catch (e) {}
    }
    window.addEventListener("storage", syncPending);
    window.addEventListener("agni_requests_updated", syncPending);
    window.addEventListener("agni_pending_updated", syncPending);
    window.addEventListener("agni_clients_updated", syncPending);
    const interval = setInterval(syncPending, 60000);
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
