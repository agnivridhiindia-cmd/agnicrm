import React, { useState, useEffect } from "react";
import { apiFetch } from "../../../services/apiClient";

export default function DailyRevenueDetailModal({
  isOpen,
  onClose,
  selectedDate,
  onDateChange,
  dark,
  branchId,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dailyData, setDailyData] = useState(null);

  useEffect(() => {
    if (!isOpen || !selectedDate) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams({ date: selectedDate });
    if (branchId && branchId !== "ALL") {
      queryParams.set("branchId", branchId);
    }

    apiFetch(`/revenue/daily-breakdown?${queryParams.toString()}`)
      .then(async (res) => {
        if (!isMounted) return null;
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.message || `Server returned status ${res.status}`);
        }
        return res.json();
      })
      .then((resData) => {
        if (!isMounted || !resData) return;
        if (resData.success) {
          setDailyData(resData.data);
        } else {
          setError(resData?.message || "Failed to load daily revenue data.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || "Error connecting to database.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedDate, branchId]);

  if (!isOpen) return null;

  // Format date display (e.g., "Monday, 13 Oct 2026")
  const formatDateHeader = (dStr) => {
    if (!dStr) return "";
    try {
      const [y, m, d] = dStr.split("-").map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dStr;
    }
  };

  const shiftDay = (delta) => {
    if (!selectedDate) return;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d + delta);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    if (onDateChange) onDateChange(`${yyyy}-${mm}-${dd}`);
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return "";
    try {
      return new Date(isoStr).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  return (
    <div
      className="revenue-modal-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 15, 30, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
        animation: "ownerFadeIn 0.2s ease-out",
      }}
    >
      <div
        className="revenue-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          backgroundColor: dark ? "#111827" : "#ffffff",
          color: dark ? "#f3f4f6" : "#1f2937",
          borderRadius: "20px",
          boxShadow: dark
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: dark ? "1px solid #1f2937" : "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: dark
              ? "linear-gradient(180deg, rgba(31, 41, 55, 0.6) 0%, rgba(17, 24, 39, 0.6) 100%)"
              : "linear-gradient(180deg, #f9fafb 0%, #ffffff 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, letterSpacing: "-0.01em" }}>
                  {formatDateHeader(selectedDate)}
                </h3>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                  }}
                >
                  Verified Collections
                </span>
              </div>
              <p style={{ margin: "3px 0 0", fontSize: "0.82rem", color: dark ? "#9ca3af" : "#6b7280" }}>
                Exact day collections and salesperson contribution breakdown
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Prev / Next Day buttons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: dark ? "#1f2937" : "#f3f4f6",
                borderRadius: "8px",
                padding: "2px",
              }}
            >
              <button
                type="button"
                onClick={() => shiftDay(-1)}
                title="Previous Day"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: dark ? "#d1d5db" : "#4b5563",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  transition: "background 0.15s",
                }}
              >
                ← Prev
              </button>
              <div style={{ width: 1, height: 16, background: dark ? "#374151" : "#d1d5db" }} />
              <button
                type="button"
                onClick={() => shiftDay(1)}
                title="Next Day"
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: dark ? "#d1d5db" : "#4b5563",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  transition: "background 0.15s",
                }}
              >
                Next →
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                width: 34,
                height: 34,
                borderRadius: 8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: dark ? "#9ca3af" : "#6b7280",
                backgroundColor: dark ? "#1f2937" : "#f3f4f6",
                transition: "all 0.15s",
              }}
              title="Close Modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {loading && (
            <div style={{ padding: "48px 0", textAlign: "center", color: dark ? "#9ca3af" : "#6b7280" }}>
              <div
                style={{
                  display: "inline-block",
                  width: 32,
                  height: 32,
                  border: "3px solid rgba(16, 185, 129, 0.2)",
                  borderTopColor: "#10b981",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  marginBottom: 12,
                }}
              />
              <p style={{ margin: 0, fontSize: "0.9rem" }}>Fetching live payment data from PostgreSQL...</p>
            </div>
          )}

          {error && !loading && (
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                fontSize: "0.9rem",
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {!loading && dailyData && (
            <>
              {/* Grand Metrics Banner */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "14px",
                }}
              >
                {/* Total Gross (With GST) */}
                <div
                  style={{
                    padding: "18px 20px",
                    borderRadius: "14px",
                    background: dark
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(5, 150, 105, 0.05) 100%)"
                      : "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.08)",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#10b981", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Collections (With GST)
                  </div>
                  <div
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color: dark ? "#34d399" : "#059669",
                      marginTop: "6px",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {formatCurrency(dailyData.totalGross)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: dark ? "#9ca3af" : "#6b7280", marginTop: "4px" }}>
                    Gross realized into bank
                  </div>
                </div>

                {/* Net Revenue (Excl GST) */}
                <div
                  style={{
                    padding: "18px 20px",
                    borderRadius: "14px",
                    background: dark ? "#1f2937" : "#f9fafb",
                    border: dark ? "1px solid #374151" : "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: dark ? "#9ca3af" : "#6b7280", textTransform: "uppercase" }}>
                    Base Revenue (Net)
                  </div>
                  <div style={{ fontSize: "1.45rem", fontWeight: 700, color: dark ? "#f3f4f6" : "#111827", marginTop: "6px" }}>
                    {formatCurrency(dailyData.totalNet)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: dark ? "#9ca3af" : "#6b7280", marginTop: "4px" }}>
                    Excluding GST
                  </div>
                </div>

                {/* GST Component */}
                <div
                  style={{
                    padding: "18px 20px",
                    borderRadius: "14px",
                    background: dark ? "#1f2937" : "#f9fafb",
                    border: dark ? "1px solid #374151" : "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: dark ? "#9ca3af" : "#6b7280", textTransform: "uppercase" }}>
                    GST Component (18%)
                  </div>
                  <div style={{ fontSize: "1.45rem", fontWeight: 700, color: "#6366f1", marginTop: "6px" }}>
                    {formatCurrency(dailyData.totalGst)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: dark ? "#9ca3af" : "#6b7280", marginTop: "4px" }}>
                    Government tax payable
                  </div>
                </div>

                {/* Deals Count */}
                <div
                  style={{
                    padding: "18px 20px",
                    borderRadius: "14px",
                    background: dark ? "#1f2937" : "#f9fafb",
                    border: dark ? "1px solid #374151" : "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: dark ? "#9ca3af" : "#6b7280", textTransform: "uppercase" }}>
                    Transactions Recorded
                  </div>
                  <div style={{ fontSize: "1.45rem", fontWeight: 700, color: dark ? "#f3f4f6" : "#111827", marginTop: "6px" }}>
                    {dailyData.transactionCount}{" "}
                    <span style={{ fontSize: "0.9rem", fontWeight: 500, color: dark ? "#9ca3af" : "#6b7280" }}>
                      deals
                    </span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: dark ? "#9ca3af" : "#6b7280", marginTop: "4px" }}>
                    {dailyData.salespeople?.length || 0} active sales reps
                  </div>
                </div>
              </div>

              {dailyData.transactionCount === 0 ? (
                /* Empty State */
                <div
                  style={{
                    padding: "48px 24px",
                    textAlign: "center",
                    borderRadius: "14px",
                    border: dark ? "1px dashed #374151" : "1px dashed #d1d5db",
                    background: dark ? "rgba(31, 41, 55, 0.4)" : "rgba(249, 250, 251, 0.6)",
                  }}
                >
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      margin: "0 auto 14px",
                      borderRadius: "50%",
                      background: dark ? "#1f2937" : "#e5e7eb",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: dark ? "#9ca3af" : "#6b7280",
                    }}
                  >
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: 600 }}>
                    No Payments Recorded on {formatDateHeader(selectedDate)}
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: dark ? "#9ca3af" : "#6b7280" }}>
                    No client collections or onboarding transactions occurred on this date.
                  </p>
                </div>
              ) : (
                <>
                  {/* Salesperson Contribution Leaderboard */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                          Salesperson Contributions Leaderboard
                        </h4>
                        <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: dark ? "#9ca3af" : "#6b7280" }}>
                          Who brought in what percentage of this day's revenue (with GST)
                        </p>
                      </div>
                      <span style={{ fontSize: "0.8rem", color: dark ? "#9ca3af" : "#6b7280", fontWeight: 600 }}>
                        {dailyData.salespeople?.length} Contributors
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {dailyData.salespeople.map((sp, idx) => {
                        const rankColors = [
                          { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", label: "🥇 #1" },
                          { bg: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)", label: "🥈 #2" },
                          { bg: "linear-gradient(135deg, #d97706 0%, #b45309 100%)", label: "🥉 #3" },
                        ];
                        const rank = idx < 3 ? rankColors[idx] : { bg: dark ? "#374151" : "#e5e7eb", label: `#${idx + 1}` };

                        return (
                          <div
                            key={sp.salesPersonId || idx}
                            style={{
                              padding: "14px 18px",
                              borderRadius: "12px",
                              backgroundColor: dark ? "#1f2937" : "#ffffff",
                              border: dark ? "1px solid #374151" : "1px solid #e5e7eb",
                              display: "flex",
                              flexDirection: "column",
                              gap: 10,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    background: rank.bg,
                                    color: "#ffffff",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                  }}
                                >
                                  {rank.label}
                                </span>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                                    {sp.name}
                                  </div>
                                  <div style={{ fontSize: "0.75rem", color: dark ? "#9ca3af" : "#6b7280" }}>
                                    {sp.designation || "Sales Officer"} • {sp.branchName} • {sp.dealCount} deal{sp.dealCount > 1 ? "s" : ""}
                                  </div>
                                </div>
                              </div>

                              <div style={{ textAlign: "right" }}>
                                <div style={{ fontWeight: 800, fontSize: "1.05rem", color: dark ? "#34d399" : "#059669" }}>
                                  {formatCurrency(sp.totalGross)}
                                </div>
                                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#6366f1" }}>
                                  {sp.percentageOfTotal}% of day total
                                </div>
                              </div>
                            </div>

                            {/* Percentage Progress Bar */}
                            <div
                              style={{
                                width: "100%",
                                height: 7,
                                backgroundColor: dark ? "#374151" : "#e5e7eb",
                                borderRadius: 10,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, Math.max(2, sp.percentageOfTotal))}%`,
                                  height: "100%",
                                  background: "linear-gradient(90deg, #10b981 0%, #3b82f6 100%)",
                                  borderRadius: 10,
                                  transition: "width 0.5s ease-out",
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Transactions Table */}
                  <div>
                    <h4 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1" }} />
                      Client Payment Transactions ({dailyData.transactions?.length})
                    </h4>

                    <div
                      style={{
                        overflowX: "auto",
                        borderRadius: "12px",
                        border: dark ? "1px solid #374151" : "1px solid #e5e7eb",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: "0.84rem",
                          textAlign: "left",
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              backgroundColor: dark ? "#1f2937" : "#f9fafb",
                              borderBottom: dark ? "1px solid #374151" : "1px solid #e5e7eb",
                              color: dark ? "#9ca3af" : "#6b7280",
                              fontSize: "0.75rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            <th style={{ padding: "12px 14px" }}>Client / Company</th>
                            <th style={{ padding: "12px 14px" }}>Scheme / Service</th>
                            <th style={{ padding: "12px 14px" }}>Sales Rep</th>
                            <th style={{ padding: "12px 14px" }}>Payment Mode</th>
                            <th style={{ padding: "12px 14px" }}>Time</th>
                            <th style={{ padding: "12px 14px", textAlign: "right" }}>Amount (With GST)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyData.transactions.map((t, idx) => (
                            <tr
                              key={t.id || idx}
                              style={{
                                borderBottom: dark ? "1px solid #1f2937" : "1px solid #f3f4f6",
                                backgroundColor: idx % 2 === 0 ? "transparent" : (dark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)"),
                              }}
                            >
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ fontWeight: 600 }}>{t.companyName || t.clientName}</div>
                                {t.appId && (
                                  <div style={{ fontSize: "0.72rem", color: dark ? "#9ca3af" : "#6b7280" }}>
                                    {t.appId}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <span
                                  style={{
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    backgroundColor: dark ? "#374151" : "#f3f4f6",
                                    fontSize: "0.76rem",
                                    fontWeight: 500,
                                  }}
                                >
                                  {t.schemeName || "Service"}
                                </span>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <div style={{ fontWeight: 600 }}>{t.salesPersonName}</div>
                                <div style={{ fontSize: "0.72rem", color: dark ? "#9ca3af" : "#6b7280" }}>
                                  {t.branchName}
                                </div>
                              </td>
                              <td style={{ padding: "12px 14px" }}>
                                <span
                                  style={{
                                    padding: "2px 7px",
                                    borderRadius: "4px",
                                    fontSize: "0.72rem",
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    backgroundColor: "rgba(59, 130, 246, 0.12)",
                                    color: "#3b82f6",
                                    border: "1px solid rgba(59, 130, 246, 0.25)",
                                  }}
                                >
                                  {t.paymentMode || "ONLINE"}
                                </span>
                              </td>
                              <td style={{ padding: "12px 14px", color: dark ? "#9ca3af" : "#6b7280", fontSize: "0.78rem" }}>
                                {formatTime(t.paymentDate)}
                              </td>
                              <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                <div style={{ fontWeight: 800, color: dark ? "#34d399" : "#059669" }}>
                                  {formatCurrency(t.grossAmount)}
                                </div>
                                <div style={{ fontSize: "0.7rem", color: dark ? "#9ca3af" : "#6b7280" }}>
                                  Base: {formatCurrency(t.netAmount)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: dark ? "1px solid #1f2937" : "1px solid #e5e7eb",
            backgroundColor: dark ? "#111827" : "#f9fafb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.8rem",
            color: dark ? "#9ca3af" : "#6b7280",
          }}
        >
          <span>Daily Sales Payment Records</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              backgroundColor: dark ? "#374151" : "#e5e7eb",
              color: dark ? "#f3f4f6" : "#1f2937",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
