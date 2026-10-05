import React, { useRef, useState, useEffect } from "react";

export function SalesQuotaChart({ months, quotaData, acquiredData }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);
  const [hoverIndex, setHoverIndex] = useState(null);
  const height = 280;
  const paddingLeft = 58;
  const paddingRight = 12;
  const paddingTop = 12;
  const paddingBottom = 42;

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const clientWidth = containerRef.current.clientWidth;
        if (clientWidth > 0) {
          setWidth(clientWidth);
        }
      }
    };
    updateWidth();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0) {
            setWidth(entry.contentRect.width);
          }
        }
      });
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    } else {
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
  }, []);

  const chartData = months.map((label, index) => ({
    label,
    quota: Number(quotaData[index]) || 0,
    acquired: acquiredData[index] === null || acquiredData[index] === undefined
      ? null
      : Number(acquiredData[index]) || 0,
  }));
  const maxValue = Math.max(
    ...chartData.map(({ quota, acquired }) => Math.max(quota, acquired ?? 0)),
    80000,
  );
  const plotWidth = Math.max(0, width - paddingLeft - paddingRight);
  const plotHeight = height - paddingTop - paddingBottom;
  const baseline = height - paddingBottom;
  const slotWidth = chartData.length > 0 ? plotWidth / chartData.length : 0;
  const barGap = Math.max(2, Math.min(5, slotWidth * 0.08));
  const barWidth = Math.max(2, Math.min(20, (slotWidth * 0.72 - barGap) / 2));
  const monthLabelFontSize = slotWidth < 20 ? 8 : slotWidth < 30 ? 9 : 11;
  const activeMonth = hoverIndex === null ? null : chartData[hoverIndex];
  const formatCurrency = (value) => `₹${value.toLocaleString("en-IN")}`;

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 18 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#4e5579" }}>
            <span style={{ width: 10, height: 10, background: "#9a74e9", borderRadius: 2 }} /> Monthly quota
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#4e5579" }}>
            <span style={{ width: 10, height: 10, background: "#44bfb0", borderRadius: 2 }} /> Employee sales (Excl. GST)
          </span>
        </div>

        {activeMonth && (
          <div role="status" style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", background: "rgba(15, 23, 42, 0.85)", padding: "5px 10px", borderRadius: 6 }}>
            {activeMonth.label}: Quota <strong>{formatCurrency(activeMonth.quota)}</strong>
            {" | "}Sales <strong>{activeMonth.acquired === null ? "Not recorded" : formatCurrency(activeMonth.acquired)}</strong>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: 280, overflow: "visible", display: "block" }}
        role="group"
        aria-label="Monthly quota and employee sales bar chart"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = baseline - fraction * plotHeight;
          const value = Math.round((maxValue * fraction) / 1000);
          return (
            <g key={fraction}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#dbe4ee" strokeDasharray="3 5" />
              <text x={paddingLeft - 9} y={y + 4} textAnchor="end" fontSize="10" fill="#718096">
                ₹{value}k
              </text>
            </g>
          );
        })}

        {chartData.map((month, index) => {
          const centerX = paddingLeft + slotWidth * (index + 0.5);
          const quotaHeight = (month.quota / maxValue) * plotHeight;
          const salesHeight = month.acquired === null ? 0 : (month.acquired / maxValue) * plotHeight;
          const groupWidth = barWidth * 2 + barGap;
          const quotaX = centerX - groupWidth / 2;
          const salesX = quotaX + barWidth + barGap;

          return (
            <g
              key={`${month.label}-${index}`}
              tabIndex={0}
              role="group"
              aria-label={`${month.label}: quota ${formatCurrency(month.quota)}, employee sales ${month.acquired === null ? "not recorded" : formatCurrency(month.acquired)}`}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(index)}
              onBlur={() => setHoverIndex(null)}
            >
              <rect
                x={quotaX}
                y={baseline - quotaHeight}
                width={barWidth}
                height={quotaHeight}
                rx={3}
                fill="#9a74e9"
              />
              {month.acquired !== null && (
                <rect
                  x={salesX}
                  y={baseline - salesHeight}
                  width={barWidth}
                  height={salesHeight}
                  rx={3}
                  fill="#44bfb0"
                />
              )}
              <text x={centerX} y={height - 12} textAnchor="middle" fontSize={monthLabelFontSize} fontWeight="500" fill="#6b6b77">
                {month.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function DashboardChart({ months, quotaData, acquiredData }) {
  const defaultMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const defaultQuota = [80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000, 80000];
  const defaultAcquired = [52000, 58000, 63000, 68000, 71000, 75000, 78000, 82000, 30000, 0, 0, 0];

  return (
    <SalesQuotaChart
      months={months || defaultMonths}
      quotaData={quotaData || defaultQuota}
      acquiredData={acquiredData || defaultAcquired}
    />
  );
}

export default DashboardChart;
