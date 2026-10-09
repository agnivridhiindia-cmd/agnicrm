import React, { useState, useMemo } from "react";
import KpiCard from "../../components/KpiCard";
import Icon from "../../components/Icon";
import Modal from "../../components/Modal";
import { RevenueSparkline } from "../../components/charts";
import { workforceKpiCards } from "./mockOwnerData";
import { calculateRevenueMetrics } from "../../utils/revenueCalculator";
import "./owner.css";
const defaultOwnerActivities = [];

export default function OwnerOverviewPage({
  clients = [],
  employeesList = [],
  invoices = [],
  onNavigate,
  onSelectEmployeeRole,
  onSelectRevenueRange,
  dark,
}) {
  const [breakdownModal, setBreakdownModal] = useState(null);

  // Dynamic Workforce & Account KPI cards from live database data
  const workforceKpiCards = useMemo(() => {
    const clientsCount = (clients || []).length;

    const branchManagersCount = (employeesList || []).filter((e) => {
      const r = (e.role || e.rawRole || "").toLowerCase();
      return r === "branch manager" || r === "branch_manager" || r === "bm";
    }).length;

    const salesManagersCount = (employeesList || []).filter((e) => {
      const r = (e.role || e.rawRole || "").toLowerCase();
      return r === "sales manager" || r === "manager" || r === "sales_manager" || r === "sm";
    }).length;

    const salesPersonsCount = (employeesList || []).filter((e) => {
      const r = (e.role || e.rawRole || "").toLowerCase();
      return r === "sales person" || r === "sales" || r === "sales_person" || r === "salesperson" || r === "sr";
    }).length;

    return [
      {
        label: "Total Clients",
        value: clientsCount.toLocaleString("en-IN"),
        trend: "Live DB",
        description: "Active client accounts",
        accent: "#3b82f6",
        icon: "clients",
        linkTo: "Clients",
        slug: "clients",
      },
      {
        label: "Total Branch Managers",
        value: branchManagersCount.toLocaleString("en-IN"),
        trend: "Live DB",
        description: "Branch performance leads",
        accent: "#0284c7",
        icon: "branches",
        linkTo: "Employees",
        employeeRole: "branch manager",
        slug: "branch-managers",
      },
      {
        label: "Total Sales Managers",
        value: salesManagersCount.toLocaleString("en-IN"),
        trend: "Live DB",
        description: "Regional sales leads",
        accent: "#4f46e5",
        icon: "team",
        linkTo: "Employees",
        employeeRole: "manager",
        slug: "managers",
      },
      {
        label: "Sales Persons",
        value: salesPersonsCount.toLocaleString("en-IN"),
        trend: "Live DB",
        description: "Active sales reps",
        accent: "#14b8a6",
        icon: "team",
        linkTo: "Employees",
        employeeRole: "sales",
        slug: "sales",
      },
    ];
  }, [clients, employeesList]);

  // Dynamic Revenue Engine calculation across all salespeople & branches
  // Formula: Net Revenue = Math.round(Gross Collection / 1.18)
  const revenueMetrics = useMemo(
    () => calculateRevenueMetrics(clients, invoices) || {},
    [clients, invoices]
  );

  const revenueKpiCards = useMemo(() => {
    return [
      {
        label: "Daily Revenue",
        value: `₹${(revenueMetrics.dailyNet || 0).toLocaleString("en-IN")}`,
        trend: "+12%",
        description: "All salespeople & branches (Today)",
        accent: "#10b981",
        icon: "revenue",
        linkTo: "Revenue",
        slug: "daily-revenue",
        rangeType: "daily",
      },
      {
        label: "Weekly Revenue",
        value: `₹${(revenueMetrics.weeklyNet || 0).toLocaleString("en-IN")}`,
        trend: "+15%",
        description: "All salespeople & branches (This week)",
        accent: "#6366f1",
        icon: "revenue",
        linkTo: "Revenue",
        slug: "weekly-revenue",
        rangeType: "weekly",
      },
      {
        label: "Monthly Revenue",
        value: `₹${(revenueMetrics.monthlyNet || 0).toLocaleString("en-IN")}`,
        trend: "+22%",
        description: "All salespeople & branches (This month)",
        accent: "#f59e0b",
        icon: "revenue",
        linkTo: "Revenue",
        slug: "monthly-revenue",
        rangeType: "monthly",
      },
      {
        label: "Yearly Revenue",
        value: `₹${(revenueMetrics.yearlyNet || 0).toLocaleString("en-IN")}`,
        trend: "+28%",
        description: "FY 2026-27 annual total",
        accent: "#8b5cf6",
        icon: "revenue",
        linkTo: "Revenue",
        slug: "yearly-revenue",
        rangeType: "yearly",
      },
      {
        label: "Total Payment Received",
        value: `₹${(revenueMetrics.totalReceivedNet || 0).toLocaleString("en-IN")}`,
        trend: "Verified",
        description: "All revenue generated till date (÷ 1.18)",
        accent: "#059669",
        icon: "overview",
        linkTo: "Invoice",
        slug: "payment-received",
        rangeType: "received",
      },
      {
        label: "Total Payment Pending",
        value: `₹${(revenueMetrics.totalPendingNet || 0).toLocaleString("en-IN")}`,
        trend: "Outstanding",
        description: "Pending dues from token & partial clients",
        accent: "#dc2626",
        icon: "bell",
        linkTo: "Invoice",
        slug: "payment-pending",
        rangeType: "pending",
      },
    ];
  }, [revenueMetrics]);

  const displayActivities = useMemo(() => {
    const dynamicList = [];
    if (clients && clients.length > 0) {
      clients.slice(0, 3).forEach((c, i) => {
        dynamicList.push({
          title: "New Client Added",
          detail: `${c.companyName || c.clientName || "Client"} (${c.serviceType || "Services"})`,
          tone: "#9a74e9",
          time: i === 0 ? "Just now" : `${(i + 1) * 20}m ago`,
        });
      });
    }
    if (invoices && invoices.length > 0) {
      invoices.slice(0, 2).forEach((inv, i) => {
        dynamicList.push({
          title: "Payment Received",
          detail: `${inv.invoiceNo || "Invoice"} - ₹${(inv.grandTotal || inv.amount || 0).toLocaleString("en-IN")}`,
          tone: "#10b981",
          time: `${(i + 1) * 35}m ago`,
        });
      });
    }
    const merged = [...dynamicList, ...defaultOwnerActivities];
    return merged.slice(0, 8);
  }, [clients, invoices]);

  return (
    <div className="owner-dashboard-layout" style={{ animation: "ownerFadeIn 0.25s ease-out" }}>
      <div className="dashboard-main">
        {/* Revenue & Financial KPIs */}
        <div style={{ marginBottom: 26 }}>
          <div className="owner-section-header">
            <h3 className="owner-section-title">
              <span className="owner-section-title-dot" style={{ background: '#6366f1' }} />
              Revenue &amp; Payment Overview
            </h3>
            <span className="owner-section-subtitle">Real-time Financial Metrics (Formula: Amount / 1.18)</span>
          </div>
          <section className="kpi-grid">
            {revenueKpiCards.map((card) => (
              <KpiCard
                key={card.label}
                card={card}
                dark={dark}
                onAction={(c) => {
                  if (c.rangeType) {
                    setBreakdownModal(c);
                  } else if (c.linkTo === "Employees") {
                    if (onSelectEmployeeRole) onSelectEmployeeRole(c.employeeRole || "All roles");
                    if (onNavigate) onNavigate("Employees");
                  } else if (c.linkTo === "Revenue") {
                    if (onSelectRevenueRange) onSelectRevenueRange("monthly");
                    if (onNavigate) onNavigate("Revenue");
                  } else {
                    if (onNavigate) onNavigate(c.linkTo);
                  }
                }}
              />
            ))}
          </section>
        </div>

        {/* Workforce & Operations KPIs */}
        <div style={{ marginBottom: 26 }}>
          <div className="owner-section-header">
            <h3 className="owner-section-title">
              <span className="owner-section-title-dot" style={{ background: '#10b981' }} />
              Workforce &amp; Client Operations
            </h3>
            <span className="owner-section-subtitle">Team &amp; Account Metrics</span>
          </div>
          <section className="kpi-grid">
            {workforceKpiCards.map((card) => (
              <KpiCard
                key={card.label}
                card={card}
                dark={dark}
                onAction={(c) => {
                  if (c.linkTo === "Employees") {
                    if (onSelectEmployeeRole) onSelectEmployeeRole(c.employeeRole || "All roles");
                    if (onNavigate) onNavigate("Employees");
                  } else {
                    if (onNavigate) onNavigate(c.linkTo);
                  }
                }}
              />
            ))}
          </section>
        </div>

        {/* Revenue sparkline panel */}
        <section className="revenue-panel">
          <div className="revenue-summary">
            <p className="eyebrow">Revenue overview</p>
            <h2>₹{(revenueMetrics.monthlyNet || 0).toLocaleString("en-IN")}</h2>
            <p className="revenue-copy">Current net revenue calculated across all regional sales teams (Formula: Collection / 1.18).</p>
            <div className="revenue-breakdown">
              <div>
                <span>Monthly Net Revenue</span>
                <strong>₹{(revenueMetrics.monthlyNet || 0).toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span>Daily Net Revenue</span>
                <strong>₹{(revenueMetrics.dailyNet || 0).toLocaleString("en-IN")}</strong>
              </div>
              <div>
                <span>Weekly Net Revenue</span>
                <strong>₹{(revenueMetrics.weeklyNet || 0).toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>
          <div className="revenue-chart-panel">
            <div className="revenue-chip">
              <Icon name="arrowUp" size={14} />
              <span>Revenue trend</span>
            </div>
            <RevenueSparkline />
          </div>
        </section>
      </div>

      {/* Full-Height Live Activity Sidebar covering whole right block */}
      <aside className="owner-sidebar-widgets owner-sidebar-widgets-flex">
        <section className="activity-panel owner-activity-panel">
          <div className="panel-header owner-activity-header">
            <div>
              <p className="eyebrow owner-activity-eyebrow">Live Activity Feed</p>
              <h2 className="owner-activity-heading">What’s happening</h2>
            </div>
          </div>
          <div className="activity-list owner-activity-list">
            {displayActivities.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: 13, textAlign: "center", padding: "24px 0", margin: 0 }}>
                No recent activity.
              </p>
            ) : (
              displayActivities.map((activity, idx) => (
                <div className="activity-row owner-activity-row" key={`${activity.title}-${idx}`}>
                  <span
                    className="activity-mark owner-activity-mark"
                    style={{
                      background: activity.tone,
                      boxShadow: `0 0 8px ${activity.tone}`,
                    }}
                  />
                  <div className="owner-activity-content">
                    <strong className="owner-activity-title">{activity.title}</strong>
                    <small className="owner-activity-detail">{activity.detail}</small>
                  </div>
                  <time className="owner-activity-time">{activity.time}</time>
                </div>
              ))
            )}
          </div>
        </section>
      </aside>

      {/* Detailed Revenue Breakdown Modal by Salesperson & Branch */}
      {breakdownModal && (() => {
        const range = breakdownModal.rangeType || "daily";
        const label = breakdownModal.label || "Revenue Breakdown";

        if (range === "pending") {
          const list = revenueMetrics.pendingClientsList || [];
          const totalPendingGross = list.reduce((sum, item) => sum + (item.pendingGross || 0), 0);
          const totalPendingNet = list.reduce((sum, item) => sum + (item.pendingNet || 0), 0);
          const tokenPaidCount = list.filter((item) => item.isTokenPaid).length;

          return (
            <Modal
              title="Total Payment Pending Breakdown (Token &amp; Partial Accounts)"
              onClose={() => setBreakdownModal(null)}
              footer={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                    Calculated for clients with remaining dues after token/partial payments (Net = Remaining / 1.18)
                  </span>
                  <button
                    type="button"
                    className="owner-btn-secondary"
                    onClick={() => setBreakdownModal(null)}
                    style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
                  >
                    Close
                  </button>
                </div>
              }
            >
              <div style={{ padding: "6px 0" }}>
                {/* Metric Highlights */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
                  <div style={{ background: "rgba(220, 38, 38, 0.08)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(220, 38, 38, 0.25)" }}>
                    <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600, display: "block" }}>Total Net Pending</span>
                    <strong style={{ fontSize: 22, color: "#991b1b", fontWeight: 800 }}>₹{totalPendingNet.toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                    <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600, display: "block" }}>Gross Pending Dues</span>
                    <strong style={{ fontSize: 22, color: "#b45309", fontWeight: 800 }}>₹{totalPendingGross.toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ background: "rgba(99, 102, 241, 0.08)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(99, 102, 241, 0.25)" }}>
                    <span style={{ fontSize: 12, color: "#4f46e5", fontWeight: 600, display: "block" }}>Token Paid Accounts</span>
                    <strong style={{ fontSize: 22, color: "#4338ca", fontWeight: 800 }}>{tokenPaidCount} Clients</strong>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className="owner-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "rgba(220, 38, 38, 0.06)", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                        <th style={{ padding: "10px 14px", borderRadius: "8px 0 0 8px" }}>Client Account</th>
                        <th style={{ padding: "10px 14px" }}>Sales Rep &amp; Branch</th>
                        <th style={{ padding: "10px 14px" }}>Total Deal (₹)</th>
                        <th style={{ padding: "10px 14px" }}>Token Paid (₹)</th>
                        <th style={{ padding: "10px 14px" }}>Remaining Gross (₹)</th>
                        <th style={{ padding: "10px 14px" }}>Net Pending (÷ 1.18)</th>
                        <th style={{ padding: "10px 14px", borderRadius: "0 8px 8px 0" }}>Token Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
                            No pending client accounts found. All payments clear!
                          </td>
                        </tr>
                      ) : (
                        list.map((item, idx) => (
                          <tr key={idx} style={{ background: dark ? "rgba(255, 255, 255, 0.03)" : "#f8fafc" }}>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: dark ? "#f1f5f9" : "#1e293b" }}>
                              {item.company}
                              <small style={{ display: "block", color: "#64748b", fontWeight: 400 }}>{item.clientName}</small>
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ fontWeight: 600, color: "#334155" }}>{item.salesPerson}</span>
                              <small style={{ display: "block", color: "#6366f1", fontWeight: 500 }}>{item.branch}</small>
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 600, color: "#475569" }}>
                              ₹{(item.totalDeal || 0).toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "#059669" }}>
                              ₹{(item.paidGross || 0).toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: "#d97706" }}>
                              ₹{(item.pendingGross || 0).toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 800, color: "#dc2626", fontSize: 15 }}>
                              ₹{(item.pendingNet || 0).toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span
                                style={{
                                  background: item.isTokenPaid ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                                  color: item.isTokenPaid ? "#047857" : "#b45309",
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                {item.isTokenPaid ? "● Token Paid (Bal. Due)" : "● Pending Full"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Modal>
          );
        }

        if (range === "received") {
          const list = revenueMetrics.receivedClientsList || [];
          const totalRecGross = list.reduce((sum, item) => sum + (item.grossPaid || 0), 0);
          const totalRecNet = list.reduce((sum, item) => sum + (item.netPaid || 0), 0);

          return (
            <Modal
              title="Total Payment Received Breakdown (All Revenue Till Date)"
              onClose={() => setBreakdownModal(null)}
              footer={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                    Formula: Net Revenue = Gross Collection / 1.18 (All-time cumulative total)
                  </span>
                  <button
                    type="button"
                    className="owner-btn-secondary"
                    onClick={() => setBreakdownModal(null)}
                    style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
                  >
                    Close
                  </button>
                </div>
              }
            >
              <div style={{ padding: "6px 0" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>
                  <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                    <span style={{ fontSize: 12, color: "#059669", fontWeight: 600, display: "block" }}>All-Time Net Revenue</span>
                    <strong style={{ fontSize: 22, color: "#047857", fontWeight: 800 }}>₹{totalRecNet.toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ background: "rgba(99, 102, 241, 0.08)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(99, 102, 241, 0.25)" }}>
                    <span style={{ fontSize: 12, color: "#4f46e5", fontWeight: 600, display: "block" }}>Total Gross Collections</span>
                    <strong style={{ fontSize: 22, color: "#4338ca", fontWeight: 800 }}>₹{totalRecGross.toLocaleString("en-IN")}</strong>
                  </div>
                  <div style={{ background: "rgba(245, 158, 11, 0.08)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                    <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600, display: "block" }}>Paid Records</span>
                    <strong style={{ fontSize: 22, color: "#b45309", fontWeight: 800 }}>{list.length} Accounts</strong>
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table className="owner-table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "rgba(16, 185, 129, 0.06)", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "#64748b", letterSpacing: "0.5px" }}>
                        <th style={{ padding: "10px 14px", borderRadius: "8px 0 0 8px" }}>Account / Client</th>
                        <th style={{ padding: "10px 14px" }}>Sales Rep &amp; Branch</th>
                        <th style={{ padding: "10px 14px" }}>Gross Paid (₹)</th>
                        <th style={{ padding: "10px 14px" }}>Net Revenue (÷ 1.18)</th>
                        <th style={{ padding: "10px 14px", borderRadius: "0 8px 8px 0" }}>Date / Checkpoint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}>
                            No payment collection records found yet.
                          </td>
                        </tr>
                      ) : (
                        list.map((item, idx) => (
                          <tr key={idx} style={{ background: dark ? "rgba(255, 255, 255, 0.03)" : "#f8fafc" }}>
                            <td style={{ padding: "12px 14px", fontWeight: 700, color: dark ? "#f1f5f9" : "#1e293b" }}>
                              {item.clientName}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span style={{ fontWeight: 600, color: "#334155" }}>{item.salesPerson}</span>
                              <small style={{ display: "block", color: "#6366f1", fontWeight: 500 }}>{item.branch}</small>
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 600, color: "#475569" }}>
                              ₹{(item.grossPaid || 0).toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 800, color: "#10b981", fontSize: 15 }}>
                              ₹{(item.netPaid || 0).toLocaleString("en-IN")}
                            </td>
                            <td style={{ padding: "12px 14px", fontSize: 12, color: "#64748b" }}>
                              {item.date}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Modal>
          );
        }

        const getNet = (sp) => {
          if (range === "daily") return sp.dailyNet;
          if (range === "weekly") return sp.weeklyNet;
          if (range === "monthly") return sp.monthlyNet;
          if (range === "yearly") return sp.yearlyNet;
          return sp.totalNet;
        };

        const getGross = (sp) => {
          if (range === "daily") return sp.dailyGross;
          if (range === "weekly") return sp.weeklyGross;
          if (range === "monthly") return sp.monthlyGross;
          if (range === "yearly") return sp.yearlyGross;
          return sp.totalGross;
        };

        const list = (revenueMetrics.salespeopleBreakdown || []).filter(
          (sp) => getNet(sp) > 0 || getGross(sp) > 0
        );

        const totalNet = list.reduce((sum, sp) => sum + getNet(sp), 0);
        const totalGross = list.reduce((sum, sp) => sum + getGross(sp), 0);

        return (
          <Modal
            title={`${label} Breakdown (All Salespeople & Branches)`}
            onClose={() => setBreakdownModal(null)}
            footer={
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", flexWrap: "wrap", gap: 10 }}>
                <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                  Formula: Revenue = Gross Collection Amount / 1.18 (Net revenue excluding 18% GST)
                </span>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    type="button"
                    className="owner-btn-secondary"
                    onClick={() => setBreakdownModal(null)}
                    style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer", fontWeight: 600 }}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    className="owner-btn-primary"
                    onClick={() => {
                      setBreakdownModal(null);
                      if (onSelectRevenueRange) onSelectRevenueRange(range);
                      if (onNavigate) onNavigate("Revenue");
                    }}
                    style={{ padding: "8px 18px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}
                  >
                    Open Revenue Analytics Page →
                  </button>
                </div>
              </div>
            }
          >
            <div style={{ padding: "6px 0" }}>
              {/* Metric Highlights Header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#059669", fontWeight: 600, display: "block" }}>
                    Total Net Revenue
                  </span>
                  <strong style={{ fontSize: 22, color: "#047857", fontWeight: 800 }}>
                    ₹{totalNet.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div
                  style={{
                    background: "rgba(99, 102, 241, 0.08)",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#4f46e5", fontWeight: 600, display: "block" }}>
                    Total Gross Collection
                  </span>
                  <strong style={{ fontSize: 22, color: "#4338ca", fontWeight: 800 }}>
                    ₹{totalGross.toLocaleString("en-IN")}
                  </strong>
                </div>
                <div
                  style={{
                    background: "rgba(245, 158, 11, 0.08)",
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid rgba(245, 158, 11, 0.25)",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600, display: "block" }}>
                    Contributing Salespeople
                  </span>
                  <strong style={{ fontSize: 22, color: "#b45309", fontWeight: 800 }}>
                    {list.length} Sales Reps
                  </strong>
                </div>
              </div>

              {/* Per-Salesperson & Branch Table */}
              <div style={{ overflowX: "auto" }}>
                <table
                  className="owner-table"
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0 6px",
                    fontSize: 13,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "rgba(99, 102, 241, 0.06)",
                        textAlign: "left",
                        fontSize: 11,
                        textTransform: "uppercase",
                        color: "#64748b",
                        letterSpacing: "0.5px",
                      }}
                    >
                      <th style={{ padding: "10px 14px", borderRadius: "8px 0 0 8px" }}>
                        Salesperson
                      </th>
                      <th style={{ padding: "10px 14px" }}>Branch / Region</th>
                      <th style={{ padding: "10px 14px" }}>Gross Collection</th>
                      <th style={{ padding: "10px 14px" }}>Net Revenue (÷ 1.18)</th>
                      <th style={{ padding: "10px 14px", borderRadius: "0 8px 8px 0" }}>
                        Formula Verification
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          style={{ textAlign: "center", padding: 24, color: "#94a3b8" }}
                        >
                          No collections recorded for this period yet.
                        </td>
                      </tr>
                    ) : (
                      list.map((sp) => {
                        const gross = getGross(sp);
                        const net = getNet(sp);
                        return (
                          <tr
                            key={sp.name}
                            style={{
                              background: dark ? "rgba(255, 255, 255, 0.03)" : "#f8fafc",
                              transition: "all 0.15s",
                            }}
                          >
                            <td
                              style={{
                                padding: "12px 14px",
                                fontWeight: 700,
                                color: dark ? "#f1f5f9" : "#1e293b",
                              }}
                            >
                              {sp.name}
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <span
                                style={{
                                  background: "rgba(99, 102, 241, 0.1)",
                                  color: "#4f46e5",
                                  padding: "4px 10px",
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {sp.branch || "Pan-India"}
                              </span>
                            </td>
                            <td style={{ padding: "12px 14px", fontWeight: 600, color: "#475569" }}>
                              ₹{gross.toLocaleString("en-IN")}
                            </td>
                            <td
                              style={{
                                padding: "12px 14px",
                                fontWeight: 800,
                                color: "#10b981",
                                fontSize: 15,
                              }}
                            >
                              ₹{net.toLocaleString("en-IN")}
                            </td>
                            <td
                              style={{
                                padding: "12px 14px",
                                fontSize: 12,
                                color: "#64748b",
                                fontFamily: "monospace",
                              }}
                            >
                              ₹{gross.toLocaleString("en-IN")} / 1.18 = ₹{net.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
