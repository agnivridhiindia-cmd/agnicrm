import React from "react";
import KpiCard from "../../../components/KpiCard";
import Icon from "../../../components/Icon";
import { DashboardChart } from "../../../components/charts";
import { requestActivities } from "../mockSalesData";

export default function SalesOverview({ kpiCards, monthlyQuotaChartData, selectedYear = "2026", setSelectedYear, onNavigate, onSelectKpiFilter, dark }) {
  return (
    <section className="dashboard-layout sales-dashboard">
      <div className="dashboard-main">
        <div className="scheme-grid sales-layout-grid">
          {kpiCards.map((card) => (
            <KpiCard
              key={card.label}
              card={card}
              dark={dark}
              onClick={() => {
                if (card.filterKey && onSelectKpiFilter) {
                  onSelectKpiFilter(card.filterKey);
                } else if (onNavigate) {
                  onNavigate("Clients");
                }
              }}
            />
          ))}
        </div>

        <div className="analytics-card" style={{ padding: 24 }}>
          <div className="panel-header" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <p className="eyebrow" style={{ margin: "0 0 6px" }}>Monthly quota</p>
              <h2 style={{ margin: 0 }}>Monthly quota ({selectedYear})</h2>
              <p className="dashboard-copy" style={{ margin: "6px 0 0", maxWidth: "100%" }}>
                Monthly quota (₹80,000) vs this employee’s sales (excl. 18% GST).
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#7a748e" }}>Year:</span>
              <select
                className="sales-filter-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear && setSelectedYear(e.target.value)}
                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}
              >
                <option value="2026">2026 (Current)</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>
          <DashboardChart
            months={monthlyQuotaChartData?.months}
            quotaData={monthlyQuotaChartData?.quotaData}
            acquiredData={monthlyQuotaChartData?.acquiredData}
          />
        </div>
      </div>

      <aside className="owner-sidebar-widgets">
        <section className="activity-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Recent activity</p>
              <h2>What's happening</h2>
            </div>
          </div>
          <div className="activity-list">
            {requestActivities.map((activity) => (
              <button
                key={activity.title}
                className="activity-row sales-activity-btn"
                type="button"
                onClick={() => onNavigate && onNavigate("Requests")}
              >
                <span className="activity-mark" style={{ background: activity.tone }} />
                <div>
                  <strong>{activity.title}</strong>
                  <small>{activity.detail}</small>
                </div>
                <Icon name="arrowUp" size={16} />
              </button>
            ))}
          </div>
        </section>
      </aside>
    </section>
  );
}
