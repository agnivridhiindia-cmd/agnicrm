import React, { useMemo, useState, useEffect } from "react";
import KpiCard from "../../components/KpiCard";
import Icon from "../../components/Icon";
import { RevenueSparkline } from "../../components/charts";
import { kpiCards, activities } from "./mockManagerData";
import { calculatePaymentMetricsFromClients, formatCurrency } from "../../utils/paymentHelpers";
import { calculateRevenueMetrics } from "../../utils/revenueCalculator";
import { apiFetch } from "../../services/apiClient";

export default function ManagerOverviewPage({ onNavigate, dark, branchTeam = [], clients = [] }) {
  const [dbClients, setDbClients] = useState(clients);

  useEffect(() => {
    let isMounted = true;
    async function fetchClients() {
      try {
        const response = await apiFetch("/clients");
        if (response.ok) {
          const resData = await response.json();
          if (resData.success && Array.isArray(resData.data) && isMounted) {
            setDbClients(resData.data);
          }
        }
      } catch (err) {
        console.warn("Error fetching PostgreSQL clients in ManagerOverviewPage:", err);
      }
    }
    fetchClients();
    const handleUpdate = () => fetchClients();
    window.addEventListener("agni_clients_updated", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("agni_clients_updated", handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (Array.isArray(clients) && clients.length > 0) {
      setDbClients(clients);
    }
  }, [clients]);

  const activeClients = useMemo(() => {
    return Array.isArray(dbClients) && dbClients.length > 0 ? dbClients : clients;
  }, [dbClients, clients]);

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

  // Dynamically calculate payment metrics from PostgreSQL clients
  const paymentMetrics = useMemo(() => {
    return calculatePaymentMetricsFromClients(activeClients, branchTeam, "all");
  }, [activeClients, branchTeam]);

  // Compute live revenue movement from PostgreSQL
  const sparklineData = useMemo(() => {
    const metrics = calculateRevenueMetrics(activeClients, []);
    return metrics?.sparklineData || [0, 0, 0, 0];
  }, [activeClients]);

  const openDealsCount = useMemo(() => {
    return (activeClients || []).filter((c) => {
      if (c && c.isDeleted) return false;
      const st = (c.stage || c.applicationStatus || "").toLowerCase();
      return st !== "completed" && st !== "rejected" && st !== "cancelled";
    }).length;
  }, [activeClients]);

  const closedDealsCount = useMemo(() => {
    return (activeClients || []).filter((c) => {
      if (c && c.isDeleted) return false;
      const st = (c.stage || c.applicationStatus || "").toLowerCase();
      return st === "completed";
    }).length;
  }, [activeClients]);

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
              data={sparklineData}
              strokeColor="rgba(255,255,255,0.9)"
            />
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
            {activities.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "16px 0", margin: 0 }}>
                No recent activity.
              </p>
            ) : (
              activities.map((activity) => (
                <div className="activity-row" key={activity.title}>
                  <span className="activity-mark" style={{ background: activity.tone }} />
                  <div>
                    <strong>{activity.title}</strong>
                    <small>{activity.detail}</small>
                  </div>
                  <time>{activity.time}</time>
                </div>
              ))
            )}
          </div>
        </section>
      </aside>
    </section>
  );
}
