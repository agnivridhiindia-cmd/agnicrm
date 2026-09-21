import React, { useMemo, useState, useEffect } from "react";
import KpiCard from "../../components/KpiCard";
import Icon from "../../components/Icon";
import { RevenueSparkline } from "../../components/charts";
import { kpiCards, activities } from "./mockManagerData";
import { calculatePaymentMetricsFromClients, formatCurrency } from "../../utils/paymentHelpers";
import { apiFetch } from "../../services/apiClient";
export default function ManagerOverviewPage({ onNavigate, dark, branchTeam = [], clients = [] }) {
  const branchSalesSet = useMemo(() => {
    const set = new Set();
    if (Array.isArray(branchTeam)) {
      branchTeam.forEach((t) => {
        if (typeof t === "string") set.add(t.toLowerCase());
        else if (t?.name) set.add(t.name.toLowerCase());
        if (t?.email) set.add(t.email.toLowerCase());
      });
    }
    return set;
  }, [branchTeam]);

  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const response = await apiFetch("/requests");
        if (response.ok) {
          const resData = await response.json();
          if (resData.success && Array.isArray(resData.data)) {
            const pending = resData.data.filter(r => r.status === "PENDING").length;
            setPendingCount(pending);
          }
        }
      } catch (err) {
        console.error("Error fetching pending requests for manager overview:", err);
      }
    };
    
    fetchPendingRequests();
    
    // Listen for updates (when manager approves/rejects a request)
    window.addEventListener("agni_pending_updated", fetchPendingRequests);
    return () => {
      window.removeEventListener("agni_pending_updated", fetchPendingRequests);
    };
  }, []);

  // Dynamically calculate payment metrics & breakdown connected to salespeople and timestamps
  const paymentMetrics = useMemo(() => {
    return calculatePaymentMetricsFromClients(clients, branchTeam, "all");
  }, [clients, branchTeam]);

  const openDealsCount = useMemo(() => {
    return (clients || []).filter((c) => {
      if (c && c.isDeleted) return false;
      const st = (c.stage || c.applicationStatus || "").toLowerCase();
      return st !== "completed" && st !== "rejected" && st !== "cancelled";
    }).length;
  }, [clients]);

  const closedDealsCount = useMemo(() => {
    return (clients || []).filter((c) => {
      if (c && c.isDeleted) return false;
      const st = (c.stage || c.applicationStatus || "").toLowerCase();
      return st === "completed";
    }).length;
  }, [clients]);

  const dashboardKpiCards = useMemo(() => {
    const baseCards = kpiCards.map((card) => {
      if (card.label === "Team members") {
        return {
          ...card,
          value: String(branchTeam.length || 0),
          description: "Active sales reps in branch",
        };
      }
      if (card.label === "Open deals") {
        return {
          ...card,
          value: String(openDealsCount),
        };
      }
      if (card.label === "Closed this month") {
        return {
          ...card,
          value: String(closedDealsCount),
        };
      }
      return card;
    });

    const todayStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

    return [
      ...baseCards,
      {
        label: "Pending Requests",
        value: String(pendingCount),
        trend: pendingCount > 0 ? `${pendingCount} Needs Review` : "All Clear",
        description: "Awaiting Manager Approval",
        accent: "#f43f5e",
        icon: "alert",
        linkTo: "Requests",
      },
      {
        label: "Daily Payment",
        value: formatCurrency(paymentMetrics.dailyTotal),
        trend: "Today",
        description: `Today's collection (${todayStr})`,
        accent: "#f2938f",
        icon: "calendarToday",
      },
      {
        label: "Weekly Payment",
        value: formatCurrency(paymentMetrics.weeklyTotal),
        trend: "This week",
        description: "Sales team weekly collection",
        accent: "#6f94f8",
        icon: "calendarWeek",
      },
      {
        label: "Monthly Payment",
        value: formatCurrency(paymentMetrics.monthlyTotal),
        trend: "This month",
        description: "Manager monthly collection",
        accent: "#56c37d",
        icon: "wallet",
      },
    ];
  }, [paymentMetrics, branchTeam, pendingCount, openDealsCount, closedDealsCount]);

  return (
    <section className="dashboard-layout" style={{ animation: "fadeIn 0.25s ease-out" }}>
      <div className="dashboard-main">
        {/* KPI Cards Grid */}
        <section className="kpi-grid">
          {dashboardKpiCards.map((card) => (
            <KpiCard
              key={card.label}
              card={card}
              onAction={(c) => c.linkTo && onNavigate && onNavigate(c.linkTo)}
              dark={dark}
            />
          ))}
        </section>

        {/* Revenue Performance Overview */}
        <section className="revenue-panel">
          <div className="revenue-summary">
            <div>
              <p className="eyebrow">Performance Overview</p>
              <h2>{formatCurrency(paymentMetrics.monthlyTotal)}</h2>
              <p className="revenue-copy">Monthly revenue generated across branch sales representatives.</p>
            </div>

            <div className="revenue-breakdown">
              <div>
                <span>Daily Sum</span>
                <strong style={{ color: "#f2938f" }}>{formatCurrency(paymentMetrics.dailyTotal)}</strong>
              </div>
              <div>
                <span>Weekly Sum</span>
                <strong style={{ color: "#6f94f8" }}>{formatCurrency(paymentMetrics.weeklyTotal)}</strong>
              </div>
              <div>
                <span>Monthly Sum</span>
                <strong style={{ color: "#56c37d" }}>{formatCurrency(paymentMetrics.monthlyTotal)}</strong>
              </div>
            </div>
          </div>

          <div className="revenue-chart-panel">
            <div className="revenue-chip">
              <Icon name="arrowUp" size={14} />
              <span>Revenue Velocity</span>
            </div>
            <RevenueSparkline
              d="M12 48 C42 36 70 30 98 22 C126 14 154 18 182 12 C210 6 228 12 236 20"
              dots={[
                { cx: 12, cy: 48 },
                { cx: 98, cy: 22 },
                { cx: 236, cy: 20 },
              ]}
              strokeColor="rgba(255,255,255,0.9)"
            />
          </div>
        </section>

        {/* Salesperson Revenue & Timestamp Breakdown Card */}
        <section className="analytics-card manager-table-card" style={{ marginTop: 24, padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: dark ? "#f8fafc" : "#1e293b" }}>
                Salesperson Payment & Timestamp Breakdown
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
                Live payment collections sum calculated directly per salesperson & timestamp.
              </p>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: 20,
                background: "rgba(78, 124, 255, 0.12)",
                color: "#4e7cff",
              }}
            >
              {paymentMetrics.breakdown.length} Sales Representatives
            </span>
          </div>

          <div className="manager-table-scroll">
            <table className="manager-team-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th>Salesperson</th>
                  <th>Daily Payment</th>
                  <th>Weekly Payment</th>
                  <th>Monthly Payment</th>
                  <th>Total Generated</th>
                  <th style={{ textAlign: "right" }}>Timestamp Card</th>
                </tr>
              </thead>
              <tbody>
                {paymentMetrics.breakdown.map((sp) => {
                  const initials = sp.name
                    ? sp.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "SP";

                  const timestampStr = sp.latestTimestamp
                    ? new Date(sp.latestTimestamp).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Active Period";

                  const pctOfMonthly = paymentMetrics.monthlyTotal > 0
                    ? Math.round((sp.monthly / paymentMetrics.monthlyTotal) * 100)
                    : 0;

                  return (
                    <tr key={sp.id || sp.name}>
                      <td>
                        <div className="manager-member-avatar-cell">
                          <div className="manager-member-avatar">{initials}</div>
                          <div className="manager-member-details">
                            <strong className="manager-member-name">{sp.name}</strong>
                            <span className="manager-member-branch">{sp.role}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: sp.daily > 0 ? "#10b981" : "#94a3b8", fontSize: 14 }}>
                          {formatCurrency(sp.daily)}
                        </strong>
                      </td>
                      <td>
                        <strong style={{ color: sp.weekly > 0 ? "#4e7cff" : "#94a3b8", fontSize: 14 }}>
                          {formatCurrency(sp.weekly)}
                        </strong>
                      </td>
                      <td>
                        <strong style={{ color: sp.monthly > 0 ? "#8b5cf6" : "#94a3b8", fontSize: 14 }}>
                          {formatCurrency(sp.monthly)}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>{formatCurrency(sp.total)}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <span
                          className="manager-trend-pill positive"
                          style={{
                            fontSize: 11,
                            padding: "4px 10px",
                            fontWeight: 700,
                            background: "rgba(16, 185, 129, 0.1)",
                            color: "#10b981",
                            borderRadius: 6,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {timestampStr} ({pctOfMonthly}% Share)
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Activity Sidebar */}
      <aside className="owner-sidebar-widgets">
        <section className="activity-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>What’s happening</h2>
            </div>
          </div>
          <div className="activity-list">
            {activities.map((activity) => (
              <div className="activity-row" key={activity.title}>
                <span className="activity-mark" style={{ background: activity.tone }} />
                <div>
                  <strong>{activity.title}</strong>
                  <small>{activity.detail}</small>
                </div>
                <time>{activity.time}</time>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}
