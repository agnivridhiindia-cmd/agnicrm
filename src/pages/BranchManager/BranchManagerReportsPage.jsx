import React from "react";
import { RevenueTrendChart } from "../../components/charts";

export default function BranchManagerReportsPage({
  myBranch = "West Zone",
}) {
  const performanceMetrics = [
    { label: "Quarterly Target", value: "₹4,500,000", achieved: "₹4,120,000 Realized", rate: "91.5%", isPositive: true },
    { label: "Client Conversion", value: "68.4%", achieved: "+5.2% MoM Velocity", rate: "Optimal", isPositive: true },
    { label: "Average Case TAT", value: "4.2 Days", achieved: "-1.1 Days Faster", rate: "Fast Track", isPositive: true },
    { label: "Milestone Clearance", value: "94.8%", achieved: "5-Point Compliance", rate: "Excellent", isPositive: true },
  ];

  return (
    <section className="bm-page-view">
      {/* Header Banner */}
      <div className="bm-header-banner">
        <div className="bm-header-info">
          <p className="bm-header-eyebrow">{myBranch} Branch Headquarters</p>
          <h1 className="bm-header-title">Branch Performance & Analytics Reports</h1>
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
              <span className="bm-trend-pill positive">{item.rate}</span>
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
            <h2 className="bm-header-title">Branch Revenue Trend & Growth Analysis</h2>
            <p className="bm-header-subtitle">
              Cumulative billing volume and target milestone settlement trajectory for the operational branch.
            </p>
          </div>
        </div>
        <div style={{ padding: "12px 16px" }}>
          <RevenueTrendChart
            data={[
              { label: "Jan", value: 320000 },
              { label: "Feb", value: 410000 },
              { label: "Mar", value: 390000 },
              { label: "Apr", value: 520000 },
              { label: "May", value: 680000 },
              { label: "Jun", value: 750000 },
            ]}
            color="#9a74e9"
            height={220}
          />
        </div>
      </div>
    </section>
  );
}
