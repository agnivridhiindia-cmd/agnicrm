import React, { useMemo } from "react";
import { RevenueTrendChart } from "../../components/charts";
import { calculateRevenueMetrics } from "../../utils/revenueCalculator";

export default function BranchManagerReportsPage({
  myBranch = "West Zone",
  clients = [],
  employeesList = [],
}) {
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

  const metrics = useMemo(
    () => calculateRevenueMetrics(branchClients, []),
    [branchClients]
  );

  const totalClients = branchClients.length;
  const convertedCount = branchClients.filter(
    (c) => (parseFloat(String(c.paymentReceived || 0).replace(/[^0-9.]/g, "")) || 0) > 0
  ).length;
  const conversionRate = totalClients > 0 ? Math.round((convertedCount / totalClients) * 100) : 0;

  const totalRealized = metrics.totalReceivedNet || 0;
  const totalPending = metrics.totalPendingNet || 0;
  const totalPipeline = totalRealized + totalPending;

  const branchTarget = 5000000; // Standard 50L branch quarterly benchmark
  const targetPct = totalRealized > 0 ? ((totalRealized / branchTarget) * 100).toFixed(1) : "0.0";
  const avgDeal = totalClients > 0 ? Math.round(totalPipeline / totalClients) : 0;
  const clearanceRate = totalPipeline > 0 ? Math.round((totalRealized / totalPipeline) * 100) : 0;

  const performanceMetrics = [
    {
      label: "Quarterly Target",
      value: `₹${totalRealized.toLocaleString("en-IN")}`,
      achieved: `Benchmark: ₹${branchTarget.toLocaleString("en-IN")}`,
      rate: `${targetPct}%`,
      isPositive: totalRealized > 0,
    },
    {
      label: "Client Conversion",
      value: `${conversionRate}%`,
      achieved: `${convertedCount} of ${totalClients} Portfolios Settled`,
      rate: conversionRate >= 50 ? "Optimal" : `${conversionRate}%`,
      isPositive: conversionRate > 0,
    },
    {
      label: "Average Portfolio Value",
      value: `₹${avgDeal.toLocaleString("en-IN")}`,
      achieved: `Net ₹${(totalClients > 0 ? Math.round(totalRealized / totalClients) : 0).toLocaleString("en-IN")} Realized / client`,
      rate: `${totalClients} Portfolios`,
      isPositive: avgDeal > 0,
    },
    {
      label: "Milestone Clearance",
      value: `${clearanceRate}%`,
      achieved: `₹${totalPending.toLocaleString("en-IN")} Pending Clearance`,
      rate: `${clearanceRate}% Settled`,
      isPositive: clearanceRate >= 50,
    },
  ];

  // Dynamic monthly trend sourced strictly from PostgreSQL transactions
  const chartData = useMemo(() => {
    if (metrics.chartSeries?.monthly && Array.isArray(metrics.chartSeries.monthly)) {
      return metrics.chartSeries.monthly;
    }
    return [];
  }, [metrics]);

  return (
    <section className="bm-page-view">
      {/* Header Banner */}
      <div className="bm-header-banner">
        <div className="bm-header-info">
          <p className="bm-header-eyebrow">{myBranch} Branch Headquarters</p>
          <h1 className="bm-header-title">Branch Performance &amp; Analytics Reports</h1>
          <p className="bm-header-subtitle">
            Quarterly target realisations, conversion trajectories, and operational turnaround velocity metrics.
          </p>
        </div>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="bm-kpi-ribbon">
        {performanceMetrics.map((item) => (
          <div key={item.label} className="analytics-card bm-kpi-tile">
            <div className="bm-kpi-tile-top">
              <span className="bm-kpi-tile-label">{item.label}</span>
              <span className={`bm-trend-pill ${item.isPositive ? "positive" : ""}`}>{item.rate}</span>
            </div>
            <div>
              <strong className="bm-kpi-tile-value">{item.value}</strong>
              <span className="bm-kpi-tile-sub">
                {item.achieved}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue & Growth Analysis Card */}
      <div className="analytics-card bm-analytics-card">
        <div className="panel-header bm-panel-header-gap">
          <div>
            <p className="eyebrow bm-panel-eyebrow">Performance Trajectory</p>
            <h2 className="bm-header-title">Branch Revenue Trend &amp; Growth Analysis</h2>
            <p className="bm-header-subtitle">
              Cumulative billing volume and target milestone settlement trajectory for the operational branch.
            </p>
          </div>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <RevenueTrendChart
            data={chartData}
            color="#9a74e9"
            height={220}
          />
        </div>
      </div>
    </section>
  );
}
