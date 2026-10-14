import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../../../services/apiClient";
import DailyRevenueDetailModal from "./DailyRevenueDetailModal";

export default function OwnerRevenueCalendarWidget({ dark, branchId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const popoverRef = useRef(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1; // 1-12

  // Fetch monthly calendar summary from PostgreSQL
  const fetchMonthSummary = () => {
    setLoading(true);
    const queryParams = new URLSearchParams({
      year: String(year),
      month: String(month),
    });
    if (branchId && branchId !== "ALL") {
      queryParams.set("branchId", branchId);
    }

    apiFetch(`/revenue/calendar-summary?${queryParams.toString()}`)
      .then((res) => (res && res.ok ? res.json() : null))
      .then((resData) => {
        if (resData && resData.success) {
          setSummaryData(resData.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load calendar summary:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMonthSummary();
  }, [year, month, branchId]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const changeMonth = (delta) => {
    const nextDate = new Date(year, currentDate.getMonth() + delta, 1);
    setCurrentDate(nextDate);
  };

  const handleDateClick = (dateStr) => {
    setSelectedDate(dateStr);
    setModalOpen(true);
  };

  // Generate days grid for month
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0 is Sun
  // Convert so Monday is 0, Sunday is 6
  const startDay = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  const daysMap = summaryData?.days || {};

  const formatCompactINR = (amount) => {
    const num = Number(amount) || 0;
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(1)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(1)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num}`;
  };

  const monthName = currentDate.toLocaleString("en-IN", { month: "long" });

  const todayStr = (() => {
    const t = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const ist = new Date(t.getTime() + istOffsetMs);
    return ist.toISOString().slice(0, 10);
  })();

  return (
    <div className="owner-calendar-widget-container" ref={popoverRef} style={{ position: "relative" }}>
      {/* Trigger Pill (Placed in section header) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="owner-calendar-trigger-btn"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "9px",
          padding: "6px 14px",
          borderRadius: "24px",
          background: dark
            ? "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)"
            : "linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)",
          border: dark ? "1px solid rgba(99, 102, 241, 0.35)" : "1px solid rgba(99, 102, 241, 0.25)",
          color: dark ? "#e2e8f0" : "#334155",
          cursor: "pointer",
          fontSize: "0.82rem",
          fontWeight: 600,
          boxShadow: isOpen
            ? "0 0 0 3px rgba(99, 102, 241, 0.25), 0 4px 12px rgba(0,0,0,0.1)"
            : "0 2px 6px rgba(0, 0, 0, 0.05)",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
        title="Open Daily Revenue Calendar"
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: "6px",
            background: "rgba(16, 185, 129, 0.15)",
            color: "#10b981",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>

        <span>Daily Revenue Calendar</span>

        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            opacity: 0.7,
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Popover Calendar Dropdown */}
      {isOpen && (
        <div
          className="owner-calendar-popover"
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "360px",
            zIndex: 1000,
            backgroundColor: dark ? "#0f172a" : "#ffffff",
            color: dark ? "#f8fafc" : "#1e293b",
            borderRadius: "16px",
            border: dark ? "1px solid #334155" : "1px solid #e2e8f0",
            boxShadow: dark
              ? "0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)"
              : "0 20px 40px -10px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)",
            padding: "16px",
            animation: "ownerFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Calendar Header with Month Navigation */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: "1.02rem", letterSpacing: "-0.01em" }}>
                {monthName} {year}
              </div>
              <div style={{ fontSize: "0.75rem", color: dark ? "#94a3b8" : "#64748b" }}>
                {summaryData?.monthTotalGross
                  ? `Month: ₹${summaryData.monthTotalGross.toLocaleString("en-IN")} Gross`
                  : "Click date for salesperson breakdown"}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                title="Previous Month"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "6px",
                  border: dark ? "1px solid #334155" : "1px solid #cbd5e1",
                  background: dark ? "#1e293b" : "#f8fafc",
                  color: dark ? "#e2e8f0" : "#334155",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                title="Next Month"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "6px",
                  border: dark ? "1px solid #334155" : "1px solid #cbd5e1",
                  background: dark ? "#1e293b" : "#f8fafc",
                  color: dark ? "#e2e8f0" : "#334155",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                }}
              >
                ›
              </button>
            </div>
          </div>

          {/* Weekday Row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              textAlign: "center",
              marginBottom: 6,
              fontSize: "0.72rem",
              fontWeight: 700,
              color: dark ? "#64748b" : "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <div key={d} style={{ padding: "4px 0" }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "4px",
            }}
          >
            {/* Previous month filler days */}
            {Array.from({ length: startDay }).map((_, i) => {
              const dayNum = daysInPrevMonth - startDay + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  style={{
                    height: 48,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.76rem",
                    color: dark ? "#475569" : "#cbd5e1",
                    opacity: 0.5,
                  }}
                >
                  {dayNum}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const paddedDay = String(dayNum).padStart(2, "0");
              const paddedMonth = String(month).padStart(2, "0");
              const dateKey = `${year}-${paddedMonth}-${paddedDay}`;
              const dayRev = daysMap[dateKey];
              const isToday = dateKey === todayStr;
              const hasRev = !!dayRev && dayRev.totalGross > 0;

              return (
                <div
                  key={dateKey}
                  onClick={() => handleDateClick(dateKey)}
                  style={{
                    height: 48,
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.15s ease",
                    backgroundColor: hasRev
                      ? (dark ? "rgba(16, 185, 129, 0.16)" : "rgba(16, 185, 129, 0.1)")
                      : (isToday ? (dark ? "#1e293b" : "#f1f5f9") : "transparent"),
                    border: hasRev
                      ? "1px solid rgba(16, 185, 129, 0.45)"
                      : (isToday ? "1px solid rgba(99, 102, 241, 0.5)" : "1px solid transparent"),
                    color: hasRev
                      ? (dark ? "#34d399" : "#059669")
                      : (dark ? "#f1f5f9" : "#1e293b"),
                  }}
                  title={
                    hasRev
                      ? `${dateKey}: ₹${dayRev.totalGross.toLocaleString("en-IN")} gross (${dayRev.transactionCount} deals)\nClick to view salesperson breakdown`
                      : `${dateKey}: No payments recorded\nClick to view details`
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    if (!hasRev) e.currentTarget.style.backgroundColor = dark ? "#1e293b" : "#f8fafc";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    if (!hasRev && !isToday) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: hasRev || isToday ? 700 : 500,
                      lineHeight: 1,
                    }}
                  >
                    {dayNum}
                  </span>

                  {hasRev ? (
                    <span
                      style={{
                        fontSize: "0.62rem",
                        fontWeight: 700,
                        marginTop: 2,
                        padding: "1px 3px",
                        borderRadius: "3px",
                        backgroundColor: "rgba(16, 185, 129, 0.2)",
                        color: dark ? "#34d399" : "#047857",
                        lineHeight: 1,
                      }}
                    >
                      {formatCompactINR(dayRev.totalGross)}
                    </span>
                  ) : (
                    isToday && (
                      <span
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          backgroundColor: "#6366f1",
                          marginTop: 3,
                        }}
                      />
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Legend & Action */}
          <div
            style={{
              marginTop: "12px",
              paddingTop: "10px",
              borderTop: dark ? "1px solid #1e293b" : "1px solid #f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.72rem",
              color: dark ? "#94a3b8" : "#64748b",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981" }} />
                Has Revenue
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "2px", border: "1px solid #6366f1" }} />
                Today
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleDateClick(todayStr)}
              style={{
                background: "transparent",
                border: "none",
                color: "#6366f1",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
                fontSize: "0.72rem",
              }}
            >
              View Today →
            </button>
          </div>
        </div>
      )}

      {/* Daily Revenue Detail Modal */}
      <DailyRevenueDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={selectedDate}
        onDateChange={(newDate) => setSelectedDate(newDate)}
        dark={dark}
        branchId={branchId}
      />
    </div>
  );
}
