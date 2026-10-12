import React, { useMemo, useState, useEffect, useCallback } from "react";
import KpiCard from "../../components/KpiCard";
import { MonthlyRevenueBarChart } from "../../components/charts";
import { calculateRevenueMetrics } from "../../utils/revenueCalculator";
import { apiFetch } from "../../services/apiClient";

function formatRelativeTime(dateInput) {
  if (!dateInput) return "Recently";
  const timestamp = typeof dateInput === "number" ? dateInput : new Date(dateInput).getTime();
  if (isNaN(timestamp)) return "Recently";
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

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
  const netRev = revenueMetrics.totalReceivedNet || 0;

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

  const [pendingCount, setPendingCount] = useState(0);
  const [requestsList, setRequestsList] = useState([]);
  const [notifsList, setNotifsList] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function syncWorkflowData() {
      try {
        const [reqRes, notifRes] = await Promise.allSettled([
          apiFetch("/requests"),
          apiFetch("/notifications"),
        ]);

        if (reqRes.status === "fulfilled" && reqRes.value.ok) {
          const resData = await reqRes.value.json();
          if (resData.success && Array.isArray(resData.data) && isMounted) {
            setRequestsList(resData.data);
            const count = resData.data.filter((r) => r.status === "PENDING").length;
            setPendingCount(count);
          }
        }

        if (notifRes.status === "fulfilled" && notifRes.value.ok) {
          const resData = await notifRes.value.json();
          if (resData.success && Array.isArray(resData.data) && isMounted) {
            setNotifsList(resData.data);
          }
        }
      } catch (e) {
        console.warn("Could not sync workflow data for Branch Manager:", e);
      }
    }

    syncWorkflowData();
    window.addEventListener("storage", syncWorkflowData);
    window.addEventListener("agni_requests_updated", syncWorkflowData);
    window.addEventListener("agni_pending_updated", syncWorkflowData);
    window.addEventListener("agni_clients_updated", syncWorkflowData);
    window.addEventListener("agni_notifications_updated", syncWorkflowData);
    const interval = setInterval(syncWorkflowData, 20000);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", syncWorkflowData);
      window.removeEventListener("agni_requests_updated", syncWorkflowData);
      window.removeEventListener("agni_pending_updated", syncWorkflowData);
      window.removeEventListener("agni_clients_updated", syncWorkflowData);
      window.removeEventListener("agni_notifications_updated", syncWorkflowData);
      clearInterval(interval);
    };
  }, []);

  const dynamicKpiCards = useMemo(() => {
    return [
      { label: "Total Regional Managers", value: String(salesManagersCount), accent: "#9a74e9", linkTo: "Employees" },
      { label: "Total Employees", value: String(totalEmployeesCount), accent: "#4e7cff", linkTo: "Employees" },
      { label: "Active Clients", value: String(clients.length || 0), accent: "#44bfb0", linkTo: "Clients" },
      { label: "Pending Requests", value: String(pendingCount), accent: "#f2aa38", linkTo: "Requests" },
      { label: "Branch Revenue", value: `₹${netRev.toLocaleString("en-IN")}`, accent: "#f97316", linkTo: "Revenue" },
    ];
  }, [clients, netRev, pendingCount, salesManagersCount, totalEmployeesCount]);

  // Dynamically derive live workflow activity feed from live database requests:
  // ONLY:
  // 1. Requests from Sales Manager (requesterRole === 'MANAGER' or stage === 'PENDING_BRANCH_MANAGER')
  // 2. Requests from Branch Manager to Owner (requesterRole === 'BRANCH_MANAGER' or stage === 'PENDING_OWNER')
  const liveActivities = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    const addActivity = (item) => {
      if (!item || !item.title) return;
      const key = `${item.title}::${item.detail}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      list.push(item);
    };

    const formatReqType = (type) => {
      if (!type) return "Request";
      const clean = type.replace(/_/g, " ").toLowerCase();
      if (clean.includes("edit emp") || clean.includes("edit profile")) return "Edit Staff";
      if (clean.includes("del emp") || clean.includes("delete staff")) return "Delete Staff";
      if (clean.includes("trans emp") || clean.includes("transfer staff")) return "Transfer Staff";
      if (clean.includes("edit client")) return "Edit Client";
      if (clean.includes("delete client")) return "Delete Client";
      if (clean.includes("transfer client")) return "Transfer Client";
      if (clean.includes("new service")) return "New Service";
      return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };

    (requestsList || []).forEach((r) => {
      if (!r) return;

      const reqRole = String(r.requester?.role || r.requesterRole || "").toUpperCase();
      const currentStage = String(r.currentStage || "").toUpperCase();
      const rawChain = Array.isArray(r.approvalChain) ? r.approvalChain.map((s) => String(s).toUpperCase()) : [];
      const audits = Array.isArray(r.auditHistory) ? r.auditHistory : [];

      const isFromSalesManager =
        reqRole === "MANAGER" ||
        currentStage === "PENDING_BRANCH_MANAGER" ||
        audits.some((a) => String(a.actorRole).toUpperCase() === "MANAGER" || a.stage === "PENDING_BRANCH_MANAGER") ||
        rawChain.includes("BRANCH_MANAGER");

      const isFromBranchManagerToOwner =
        reqRole === "BRANCH_MANAGER" ||
        currentStage === "PENDING_OWNER" ||
        audits.some((a) => String(a.actorRole).toUpperCase() === "BRANCH_MANAGER" && (a.action === "SUBMITTED" || a.stage === "PENDING_OWNER")) ||
        (reqRole === "BRANCH_MANAGER" && rawChain.includes("OWNER"));

      if (!isFromSalesManager && !isFromBranchManagerToOwner) {
        return;
      }

      const typeLabel = formatReqType(r.requestType);
      const reqCode = r.requestCode || "RQ";
      const targetName =
        r.targetUser?.fullName ||
        r.client?.companyName ||
        r.client?.name ||
        r.requestedChanges?.fullName ||
        r.requestedChanges?.name ||
        r.requestedChanges?.companyName ||
        "";
      const subject = targetName ? `for ${targetName}` : "";

      if (isFromSalesManager) {
        const mgrName = r.requester?.fullName || "Sales Manager";
        if (r.status === "PENDING") {
          addActivity({
            id: `sm-req-${r.id}`,
            badge: "Sales Mgr",
            title: `${typeLabel} Requested`,
            detail: `${mgrName} submitted request ${reqCode} ${subject}`.trim(),
            tone: "#6366f1",
            timestamp: new Date(r.createdAt).getTime(),
          });
        } else if (r.status === "APPROVED") {
          addActivity({
            id: `sm-app-${r.id}`,
            badge: "Approved",
            title: `${typeLabel} Approved`,
            detail: `${reqCode} from ${mgrName} approved ${subject}`.trim(),
            tone: "#10b981",
            timestamp: new Date(r.decisionDate || r.updatedAt || r.createdAt).getTime(),
          });
        } else if (r.status === "REJECTED") {
          addActivity({
            id: `sm-rej-${r.id}`,
            badge: "Rejected",
            title: `${typeLabel} Rejected`,
            detail: `${reqCode} from ${mgrName} rejected: ${r.managerRemarks || "Not approved"}`.trim(),
            tone: "#ef4444",
            timestamp: new Date(r.decisionDate || r.updatedAt || r.createdAt).getTime(),
          });
        }
      }

      if (isFromBranchManagerToOwner) {
        if (r.status === "PENDING") {
          addActivity({
            id: `bm-req-${r.id}`,
            badge: "Sent to Owner",
            title: `${typeLabel} Sent to Owner`,
            detail: `${reqCode} escalated to Owner for final decision ${subject}`.trim(),
            tone: "#f59e0b",
            timestamp: new Date(r.createdAt).getTime(),
          });
        } else if (r.status === "APPROVED") {
          addActivity({
            id: `bm-app-${r.id}`,
            badge: "Owner Approved",
            title: `Owner Approved ${typeLabel}`,
            detail: `Owner approved ${reqCode} ${subject}`.trim(),
            tone: "#10b981",
            timestamp: new Date(r.decisionDate || r.updatedAt || r.createdAt).getTime(),
          });
        } else if (r.status === "REJECTED") {
          addActivity({
            id: `bm-rej-${r.id}`,
            badge: "Owner Rejected",
            title: `Owner Rejected ${typeLabel}`,
            detail: `Owner rejected ${reqCode}: ${r.managerRemarks || "Declined"}`.trim(),
            tone: "#ef4444",
            timestamp: new Date(r.decisionDate || r.updatedAt || r.createdAt).getTime(),
          });
        }
      }
    });

    list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    return list.slice(0, 50).map((act) => ({
      ...act,
      time: formatRelativeTime(act.timestamp),
    }));
  }, [requestsList]);

  return (
    <section className="dashboard-layout bm-overview-layout">
      <div className="dashboard-main bm-overview-main">
        {/* KPI Grid */}
        <section className="kpi-grid bm-kpi-grid">
          {dynamicKpiCards.map((card) => (
            <KpiCard
              key={card.label}
              card={card}
              dark={dark}
              onAction={(c) => onNavigate && onNavigate(c.linkTo)}
            />
          ))}
        </section>

        {/* Branch Revenue Trajectory Bar Chart */}
        <div className="analytics-card bm-overview-chart-card">
          <div className="panel-header bm-panel-header-gap">
            <div>
              <p className="eyebrow bm-panel-eyebrow">Financial Health</p>
              <h2 className="bm-panel-heading">Branch Revenue Trajectory</h2>
              <p className="bm-panel-subtext">
                Live net commercial billing performance for {managedBranch}.
              </p>
            </div>
          </div>
          <div style={{ padding: "10px 14px" }}>
            <MonthlyRevenueBarChart
              data={revenueMetrics.chartSeries?.monthly || []}
              barColor="#6366f1"
              gradientId="bmFinancialHealthBarGrad"
              height={140}
            />
          </div>
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
            {liveActivities.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "28px 0", margin: 0 }}>
                No recent workflow activity.
              </p>
            ) : (
              liveActivities.map((act) => (
                <div className="activity-row bm-activity-row" key={act.id}>
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
              ))
            )}
          </div>
        </section>
      </aside>
    </section>
  );
}
