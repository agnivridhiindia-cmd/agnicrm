import React, { useState, useMemo } from "react";
import Icon from "../../components/Icon";
import RevenueSummaryCard from "../../components/RevenueSummaryCard";
import { RevenueTrendChart } from "../../components/charts";
import { revenueSeries } from "./mockOwnerData";
import { calculateRevenueMetrics } from "../../utils/revenueCalculator";

export default function OwnerRevenuePage({
  revenueRange = "monthly",
  setRevenueRange,
  clients = [],
  invoices = [],
}) {
  const [localRange, setLocalRange] = useState(revenueRange);

  const activeRange = setRevenueRange ? revenueRange : localRange;
  const handleRangeChange = (val) => {
    if (setRevenueRange) setRevenueRange(val);
    else setLocalRange(val);
  };

  const metrics = useMemo(
    () => calculateRevenueMetrics(clients || [], invoices || []),
    [clients, invoices]
  );

  const revenueReceived = useMemo(() => {
    switch (activeRange) {
      case "daily":
        return metrics.dailyNet || 0;
      case "weekly":
        return metrics.weeklyNet || 0;
      case "monthly":
        return metrics.monthlyNet || 0;
      case "yearly":
        return metrics.yearlyNet || 0;
      case "allTime":
        return metrics.totalReceivedNet || 0;
      default:
        return metrics.monthlyNet || 0;
    }
  }, [activeRange, metrics]);

  const revenuePending = useMemo(() => {
    switch (activeRange) {
      case "daily":
        return metrics.dailyPendingNet || 0;
      case "weekly":
        return metrics.weeklyPendingNet || 0;
      case "monthly":
        return metrics.monthlyPendingNet || 0;
      case "yearly":
        return metrics.yearlyPendingNet || 0;
      case "allTime":
        return metrics.totalPendingNet || 0;
      default:
        return metrics.monthlyPendingNet || 0;
    }
  }, [activeRange, metrics]);

  const revenueTotal = revenueReceived + revenuePending;

  const selectedRevenueData = useMemo(() => {
    const baseSeries = revenueSeries[activeRange] || revenueSeries.monthly;
    if (revenueReceived === 0) {
      return baseSeries.map((pt) => ({ ...pt, value: 0 }));
    }

    const baseTotal = baseSeries.reduce((sum, pt) => sum + pt.value, 0) || 1;
    const scaleRatio = revenueReceived / baseTotal;
    return baseSeries.map((pt) => ({
      label: pt.label,
      value: Math.round(pt.value * scaleRatio),
    }));
  }, [activeRange, revenueReceived]);

  const averageRunRate = selectedRevenueData.length > 0
    ? Math.round(revenueReceived / selectedRevenueData.length)
    : 0;
  const cyclePeak = selectedRevenueData.length > 0
    ? Math.max(...selectedRevenueData.map((pt) => pt.value))
    : 0;

  const receivedPct = revenueTotal > 0 ? Math.round((revenueReceived / revenueTotal) * 100) : 0;
  const pendingPct = revenueTotal > 0 ? Math.round((revenuePending / revenueTotal) * 100) : 0;
  const totalPct = revenueTotal > 0 ? 100 : 0;

  const revenueSummaryCards = [
    {
      label: "Payment received",
      value: `₹${revenueReceived.toLocaleString("en-IN")}`,
      hint: "Collected from clients (Net)",
      accentClass: "received",
      icon: "arrowUp",
      percentage: receivedPct,
    },
    {
      label: "Payment pending",
      value: `₹${revenuePending.toLocaleString("en-IN")}`,
      hint: "Awaiting confirmation",
      accentClass: "pending",
      icon: "overview",
      percentage: pendingPct,
    },
    {
      label: "Total payment",
      value: `₹${revenueTotal.toLocaleString("en-IN")}`,
      hint: "Overall revenue range",
      accentClass: "total",
      icon: "revenue",
      percentage: totalPct,
    },
  ];

  return (
    <section className="owner-page-view">
      {/* Header Banner */}
      <div className="owner-header-banner">
        <div className="owner-header-info">
          <p className="owner-header-eyebrow">Financial Analytics</p>
          <h1 className="owner-header-title">Executive Revenue Analytics</h1>
        </div>
      </div>

      {/* Toolbar Filter */}
      <div className="analytics-card owner-toolbar-card">
        <div className="owner-toolbar-filters">
          <label className="field-label" style={{ margin: 0 }}>
            <span>Time Horizon:</span>
            <select
              className="owner-filter-select"
              value={activeRange}
              onChange={(event) => handleRangeChange(event.target.value)}
            >
              <option value="daily">Daily Collection</option>
              <option value="weekly">Weekly Cycle</option>
              <option value="monthly">Monthly Cycle</option>
              <option value="yearly">Yearly Aggregate</option>
              <option value="allTime">All-Time Cumulative</option>
            </select>
          </label>
        </div>

        <div className="owner-count-badge">
          <span>Active Cycle:</span>
          <strong>{activeRange.toUpperCase()}</strong>
        </div>
      </div>

      {/* Hero Sparkline Section */}
      <div className="revenue-panel">
        <div className="revenue-summary">
          <div>
            <p className="eyebrow">Revenue overview</p>
            <h2>₹{revenueReceived.toLocaleString("en-IN")}</h2>
            <p className="revenue-copy">
              Selected range: {activeRange.charAt(0).toUpperCase() + activeRange.slice(1)} horizon across all active enterprise portfolios.
            </p>
          </div>

          <div className="revenue-breakdown">
            <div>
              <span>Average Run Rate</span>
              <strong>
                ₹{averageRunRate.toLocaleString("en-IN")}
              </strong>
            </div>
            <div>
              <span>Cycle Peak</span>
              <strong>
                ₹{cyclePeak.toLocaleString("en-IN")}
              </strong>
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
            <span>Revenue Trend</span>
          </div>
          <RevenueTrendChart data={selectedRevenueData} />
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
