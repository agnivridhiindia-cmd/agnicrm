import React, { useState, useMemo } from "react";
import RevenueSummaryCard from "../../components/RevenueSummaryCard";
import Icon from "../../components/Icon";
import { RevenueTrendChart } from "../../components/charts";
import { revenueSeries } from "./mockBranchManagerData";
import { calculateRevenueMetrics } from "../../utils/revenueCalculator";

export default function BranchManagerRevenuePage({
  myBranch = "West Zone",
  clients = [],
}) {
  const [revenueRange, setRevenueRange] = useState("monthly");

  const branchClients = useMemo(() => {
    if (!clients || !Array.isArray(clients)) return [];
    return clients.filter((c) => {
      if (!c) return false;
      const cBranch = (c.branch || c.region || "").toLowerCase().trim();
      const targetBranch = (myBranch || "").toLowerCase().trim();
      if (!targetBranch) return true;
      const firstWord = targetBranch.split(" ")[0].toLowerCase();
      return cBranch.includes(firstWord) || targetBranch.includes(cBranch);
    });
  }, [clients, myBranch]);

  const metrics = useMemo(() => calculateRevenueMetrics(branchClients, []), [branchClients]);

  const revenueReceived = useMemo(() => {
    switch (revenueRange) {
      case "daily": return metrics.dailyNet || 0;
      case "weekly": return metrics.weeklyNet || 0;
      case "monthly": return metrics.monthlyNet || 0;
      case "yearly": return metrics.yearlyNet || 0;
      default: return metrics.totalReceivedNet || 0;
    }
  }, [revenueRange, metrics]);

  const revenuePending = useMemo(() => {
    switch (revenueRange) {
      case "daily": return metrics.dailyPendingNet || 0;
      case "weekly": return metrics.weeklyPendingNet || 0;
      case "monthly": return metrics.monthlyPendingNet || 0;
      case "yearly": return metrics.yearlyPendingNet || 0;
      default: return metrics.totalPendingNet || 0;
    }
  }, [revenueRange, metrics]);

  const revenueTotal = revenueReceived + revenuePending;

  const selectedRevenueData = useMemo(() => {
    const defaultData = revenueSeries[revenueRange] || revenueSeries.monthly;
    if (revenueTotal === 0) {
      return defaultData.map((item) => ({ ...item, value: 0 }));
    }
    return defaultData;
  }, [revenueRange, revenueTotal]);

  const totalCollectedPct = revenueTotal > 0 ? Math.round((revenueReceived / revenueTotal) * 100) : 0;
  const totalPendingPct = revenueTotal > 0 ? Math.round((revenuePending / revenueTotal) * 100) : 0;

  const revenueSummaryCards = [
    {
      label: "Branch Payment Received",
      value: `₹${revenueReceived.toLocaleString("en-IN")}`,
      hint: "Collected from clients (Excl. 18% GST)",
      accentClass: "received",
      icon: "arrowUp",
      percentage: totalCollectedPct,
    },
    {
      label: "Branch Payment Pending",
      value: `₹${revenuePending.toLocaleString("en-IN")}`,
      hint: "Awaiting invoice settlement",
      accentClass: "pending",
      icon: "overview",
      percentage: totalPendingPct,
    },
    {
      label: "Total Branch Revenue",
      value: `₹${revenueTotal.toLocaleString("en-IN")}`,
      hint: revenueRange === "allTime" ? "Cumulative pipeline revenue" : `${revenueRange.charAt(0).toUpperCase() + revenueRange.slice(1)} pipeline revenue`,
      accentClass: "total",
      icon: "wallet",
      percentage: revenueTotal > 0 ? 100 : 0,
    },
  ];

  return (
    <section className="bm-page-view">
      {/* Header Banner */}
      <div className="bm-header-banner">
        <div className="bm-header-info">
          <p className="bm-header-eyebrow">{myBranch} Branch Financials</p>
          <h1 className="bm-header-title">Revenue Intelligence & Analytics</h1>
          <p className="bm-header-subtitle">
            Comprehensive billing volume, collection rate trajectories, and commercial pipeline horizons.
          </p>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="analytics-card bm-toolbar-card">
        <div className="bm-toolbar-filters">
          <label className="field-label">
            <span>Time Horizon:</span>
            <select
              className="bm-filter-select"
              value={revenueRange}
              onChange={(event) => setRevenueRange(event.target.value)}
            >
              <option value="daily">Daily Collection</option>
              <option value="weekly">Weekly Cycle</option>
              <option value="monthly">Monthly Cycle</option>
              <option value="yearly">Yearly Aggregate</option>
              <option value="allTime">All-Time Cumulative</option>
            </select>
          </label>
        </div>

        <div className="bm-count-badge">
          <span>Active Cycle:</span>
          <strong>{revenueRange.toUpperCase()}</strong>
        </div>
      </div>

      {/* Hero Sparkline Section */}
      <div className="revenue-panel">
        <div className="revenue-summary">
          <div>
            <p className="eyebrow">Branch Revenue Performance</p>
            <h2>₹{revenueTotal.toLocaleString("en-IN")}</h2>
            <p className="revenue-copy">
              Aggregate billing revenue captured for the {revenueRange} horizon across all regional sales accounts.
            </p>
          </div>

          <div className="revenue-breakdown">
            <div>
              <span>Average Run Rate</span>
              <strong>₹{Math.round(revenueTotal / selectedRevenueData.length).toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <span>Cycle Peak</span>
              <strong>₹{Math.max(...selectedRevenueData.map((item) => item.value)).toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <span>Data Checkpoints</span>
              <strong>{selectedRevenueData.length} Points</strong>
            </div>
          </div>
        </div>

        <div className="revenue-chart-panel">
          <div className="revenue-chip">
            <Icon name="arrowUp" size={14} />
            <span>Branch Pipeline Trend</span>
          </div>
          <RevenueTrendChart
            data={selectedRevenueData}
            color="#8c5ff8"
            gradientId="bmRevGrad"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="revenue-summary-grid">
        {revenueSummaryCards.map((card) => (
          <RevenueSummaryCard key={card.label} card={card} />
        ))}
      </div>
    </section>
  );
}
