import React, { useState, useMemo, useEffect } from "react";
import Icon from "../../components/Icon";
import RevenueSummaryCard from "../../components/RevenueSummaryCard";
import { MonthlyRevenueBarChart } from "../../components/charts";
import { apiFetch } from "../../services/apiClient";
import {
  calculatePaymentMetricsFromClients,
  formatCurrency,
  parseRevenueValue,
  parseNetRevenue,
  parseDate,
  isSameDay,
  isSameWeek,
  isSameMonth
} from "../../utils/paymentHelpers";

export default function ManagerRevenuePage({
  branchTeam = [],
  managedRegion = "East Zone",
  managedBranch = "East",
  clients = [],
}) {
  const [revenueRange, setRevenueRange] = useState("monthly");
  const [revenueSalesPersonFilter, setRevenueSalesPersonFilter] = useState("all");
  const [dbClients, setDbClients] = useState(clients);

  useEffect(() => {
    let isMounted = true;
    async function fetchClients() {
      try {
        const res = await apiFetch("/clients");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && isMounted) {
            setDbClients(json.data);
          }
        }
      } catch (err) {
        console.warn("Error fetching clients for ManagerRevenuePage:", err);
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

  // Dynamic payment metrics directly calculated from live client records & salesperson sales
  const liveMetrics = useMemo(() => {
    return calculatePaymentMetricsFromClients(activeClients, branchTeam, revenueSalesPersonFilter);
  }, [activeClients, branchTeam, revenueSalesPersonFilter]);

  // 12-Month revenue bar chart series strictly calculated from PostgreSQL database
  const twelveMonthData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyTotals = new Array(12).fill(0);
    const today = new Date();
    const currYear = today.getFullYear();

    const clientList = Array.isArray(activeClients) ? activeClients : [];

    clientList.forEach((c) => {
      if (!c) return;

      // Filter by salesperson if selected
      if (revenueSalesPersonFilter !== "all") {
        const repName = (c.salesRep || c.assignedSalesPerson || c.salesPerson || c.owner || "").toLowerCase();
        if (repName !== revenueSalesPersonFilter.toLowerCase()) {
          return;
        }
      }

      // Check detailed payment transactions from PostgreSQL
      const subPayments = Array.isArray(c.payments) && c.payments.length > 0
        ? c.payments
        : (Array.isArray(c.paymentsHistory) && c.paymentsHistory.length > 0
          ? c.paymentsHistory
          : (Array.isArray(c.invoices) && c.invoices.some((inv) => Array.isArray(inv.payments) && inv.payments.length > 0)
            ? c.invoices.flatMap((inv) => inv.payments || [])
            : null));

      if (subPayments && subPayments.length > 0) {
        subPayments.forEach((p) => {
          if (!p) return;
          const st = (p.status || "").toLowerCase();
          if (st === "failed" || st === "cancelled") return;
          const amt = parseRevenueValue(p.amount || p.paidAmount || 0);
          if (amt <= 0) return;
          const dt = parseDate(p.paymentDate || p.date || p.createdAt || c.updatedAt);
          if (dt.getFullYear() === currYear) {
            monthlyTotals[dt.getMonth()] += parseNetRevenue(amt);
          }
        });
      } else {
        const rec = parseRevenueValue(c.paymentReceived || (c.paymentStatus === "Paid" ? c.totalPayment || c.amount : 0));
        if (rec > 0) {
          const dtStr = c.lastPaymentDate || c.paymentDate || c.createdAt || c.startDate || c.updatedAt;
          const dt = parseDate(dtStr);
          if (dt.getFullYear() === currYear) {
            monthlyTotals[dt.getMonth()] += parseNetRevenue(rec);
          }
        }
      }
    });

    return months.map((label, idx) => ({
      label,
      value: monthlyTotals[idx],
    }));
  }, [activeClients, revenueSalesPersonFilter]);


  const { revenueReceived, revenuePending, revenueTotal } = useMemo(() => {
    let rec = 0;
    let pend = 0;
    let tot = 0;
    const today = new Date();

    if (Array.isArray(activeClients)) {
      activeClients.forEach(c => {
        // Apply Salesperson Filter
        if (revenueSalesPersonFilter !== "all") {
          const repName = (c.salesRep || c.assignedSalesPerson || c.owner || "").toLowerCase();
          if (repName !== revenueSalesPersonFilter.toLowerCase()) {
            return;
          }
        }

        // Apply Time Horizon Filter and calculate received
        const subPayments = Array.isArray(c.payments) && c.payments.length > 0
          ? c.payments
          : (Array.isArray(c.invoices) && c.invoices.some(inv => Array.isArray(inv.payments) && inv.payments.length > 0)
            ? c.invoices.flatMap(inv => inv.payments || [])
            : null);

        if (subPayments && subPayments.length > 0) {
          subPayments.forEach((sp) => {
            const spDt = parseDate(sp.paymentDate || sp.createdAt || c.updatedAt);
            if (revenueRange === "daily" && !isSameDay(spDt, today)) return;
            if (revenueRange === "weekly" && !isSameWeek(spDt, today)) return;
            if (revenueRange === "monthly" && !isSameMonth(spDt, today)) return;
            rec += parseRevenueValue(sp.amount);
          });
        } else {
          const dtStr = c.updatedAt || c.lastPaymentDate || c.paymentDate || c.createdAt || c.startDate;
          const dt = parseDate(dtStr);
          const inRange = (revenueRange === "daily" && isSameDay(dt, today)) ||
            (revenueRange === "weekly" && isSameWeek(dt, today)) ||
            (revenueRange === "monthly" && isSameMonth(dt, today));
          if (inRange) {
            rec += parseRevenueValue(c.paymentReceived);
          }
        }

        pend += parseRevenueValue(c.paymentPending);
      });
    }

    const netRec = parseNetRevenue(rec);
    const netPend = parseNetRevenue(pend);

    return {
      revenueReceived: netRec,
      revenuePending: netPend,
      revenueTotal: netRec + netPend
    };
  }, [activeClients, revenueRange, revenueSalesPersonFilter]);

  const totalCollectedPct = revenueTotal > 0 ? Math.round((revenueReceived / revenueTotal) * 100) : 0;
  const totalPendingPct = revenueTotal > 0 ? Math.round((revenuePending / revenueTotal) * 100) : 0;

  const revenueSummaryCards = [
    {
      label: "Payment Received",
      value: formatCurrency(revenueReceived),
      hint: `Realized for ${revenueRange.toUpperCase()}`,
      accentClass: "received",
      icon: "arrowUp",
      percentage: totalCollectedPct,
    },
    {
      label: "Payment Pending",
      value: formatCurrency(revenuePending),
      hint: "Pending team invoices",
      accentClass: "pending",
      icon: "overview",
      percentage: totalPendingPct,
    },
    {
      label: "Total Collection Revenue",
      value: formatCurrency(revenueTotal),
      hint: "Direct sum from sales team",
      accentClass: "total",
      icon: "wallet",
      percentage: revenueTotal > 0 ? 100 : 0,
    },
  ];

  return (
    <section className="manager-page-view" style={{ animation: "fadeIn 0.25s ease-out" }}>
      {/* Header Banner */}
      <div className="manager-header-banner">
        <div className="manager-header-info">
          <p className="manager-header-eyebrow">Financial Velocity</p>
          <h1 className="manager-header-title">Team Revenue Intelligence</h1>
          <p className="manager-header-subtitle">
            Track commercial deal flows, quota achievement velocities, and collection pipelines for {managedRegion} ({managedBranch} Branch).
          </p>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="analytics-card manager-toolbar-card">
        <div className="manager-toolbar-filters">
          <label className="field-label" style={{ margin: 0 }}>
            <span>Filter Salesperson</span>
            <select
              className="manager-filter-select"
              value={revenueSalesPersonFilter}
              onChange={(e) => setRevenueSalesPersonFilter(e.target.value)}
            >
              <option value="all">Entire Sales Team ({branchTeam.length} Members)</option>
              {branchTeam.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field-label" style={{ margin: 0 }}>
            <span>Time Horizon</span>
            <select
              className="manager-filter-select"
              value={revenueRange}
              onChange={(event) => setRevenueRange(event.target.value)}
            >
              <option value="daily">Daily Collection (Today)</option>
              <option value="weekly">Weekly View (This Week)</option>
              <option value="monthly">Monthly Cycle (This Month)</option>
              <option value="allTime">All-Time Cumulative</option>
            </select>
          </label>
        </div>

        <div className="manager-count-badge">
          <span>Active Horizon:</span>
          <strong>{revenueRange.toUpperCase()}</strong>
        </div>
      </div>

      {/* Hero Sparkline Section */}
      <div className="revenue-panel">
        <div className="revenue-summary">
          <div>
            <p className="eyebrow">
              {revenueSalesPersonFilter === "all"
                ? "Team Revenue Overview"
                : `${revenueSalesPersonFilter}'s Revenue`}
            </p>
            <h2>{formatCurrency(revenueTotal)}</h2>
            <p className="revenue-copy">
              {revenueSalesPersonFilter === "all"
                ? `Aggregate billing performance generated across ${branchTeam.length} active sales representatives.`
                : "Individual pipeline revenue generated for the designated cycle."}
            </p>
          </div>

          <div className="revenue-breakdown">
            <div>
              <span>Daily Total</span>
              <strong style={{ color: "#f2938f" }}>{formatCurrency(liveMetrics.dailyTotal)}</strong>
            </div>
            <div>
              <span>Weekly Total</span>
              <strong style={{ color: "#6f94f8" }}>{formatCurrency(liveMetrics.weeklyTotal)}</strong>
            </div>
            <div>
              <span>Monthly Total</span>
              <strong style={{ color: "#56c37d" }}>{formatCurrency(liveMetrics.monthlyTotal)}</strong>
            </div>
          </div>
        </div>

        <div className="revenue-chart-panel">
          <div className="revenue-chip">
            <Icon name="arrowUp" size={14} />
            <span>12-Month Revenue Breakdown</span>
          </div>
          <MonthlyRevenueBarChart
            data={twelveMonthData}
            barColor="#8c5ff8"
            gradientId="managerMonthlyBarGrad"
          />
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="revenue-summary-grid">
        {revenueSummaryCards.map((card) => (
          <RevenueSummaryCard key={card.label} card={card} />
        ))}
      </div>

      {/* Team Salesperson Quota & Timestamp Breakdown Table */}
      <div className="analytics-card manager-table-card">
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid rgba(140, 95, 248, 0.12)" }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
            Salesperson Quota & Payment Breakdown
          </h2>
          <p style={{ margin: "4px 0 0", color: "#7a748e", fontSize: 13 }}>
            Individual daily, weekly, and monthly sales performance timestamped directly per salesperson.
          </p>
        </div>

        <div className="manager-table-scroll">
          <table className="manager-team-table">
            <thead>
              <tr>
                <th>Salesperson</th>
                <th>Target Quota</th>
                <th>Daily Collection</th>
                <th>Weekly Collection</th>
                <th>Monthly Realized</th>
                <th>Quota Progress</th>
                <th style={{ textAlign: "right" }}>Timestamp Card</th>
              </tr>
            </thead>
            <tbody>
              {liveMetrics.breakdown.map((sp) => {
                const quotaVal = parseRevenueValue(sp.quota || "100000");
                const realized = sp.monthly;
                const pct = Math.min(Math.round((realized / (quotaVal || 1)) * 100), 100);
                const initials = sp.name
                  ? sp.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "SP";

                const tsFormatted = sp.latestTimestamp
                  ? new Date(sp.latestTimestamp).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                  : "Today";

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
                      <span style={{ fontWeight: 700 }}>{sp.quota}</span>
                    </td>
                    <td>
                      <strong style={{ color: sp.daily > 0 ? "#10b981" : "#94a3b8" }}>
                        {formatCurrency(sp.daily)}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: sp.weekly > 0 ? "#4e7cff" : "#94a3b8" }}>
                        {formatCurrency(sp.weekly)}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: "#10b981", fontSize: 14 }}>
                        {formatCurrency(sp.monthly)}
                      </strong>
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <div className="manager-quota-cell">
                        <div className="manager-quota-bar">
                          <div
                            className="manager-quota-fill"
                            style={{
                              width: `${pct}%`,
                              background: pct >= 80 ? "linear-gradient(90deg, #10b981, #34d399)" : "linear-gradient(90deg, #8c5ff8, #6d3bf5)",
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <span
                        className={`manager-trend-pill ${pct >= 75 ? "positive" : "negative"}`}
                        style={{ fontSize: 11, padding: "4px 10px", fontWeight: 700 }}
                      >
                        {tsFormatted} ({pct}% Target)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
