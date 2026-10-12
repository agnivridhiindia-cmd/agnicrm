import React, { useState } from "react";
import { formatCurrency } from "../../utils/paymentHelpers";

export default function MonthlyRevenueBarChart({
  data = [],
  barColor = "#8c5ff8",
  gradientId = "monthlyBarGrad",
  height = 140,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Ensure all 12 calendar months are mapped
  const chartData = months.map((m, idx) => {
    const found = Array.isArray(data)
      ? data.find((d) => d && (d.label === m || d.month === idx || d.monthIndex === idx))
      : null;
    return {
      label: m,
      value: found ? Number(found.value || 0) : (Array.isArray(data) && data[idx] ? Number(data[idx].value || 0) : 0),
    };
  });

  const width = 640;
  const chartHeight = height || 140;
  const padX = 24;
  const padTop = 24;
  const padBottom = 26;
  const usableHeight = chartHeight - padTop - padBottom;
  const baselineY = chartHeight - padBottom;

  const values = chartData.map((d) => d.value);
  const maxValue = Math.max(...values, 1);

  const availableWidth = width - padX * 2;
  const slotWidth = availableWidth / 12;
  const barWidth = Math.min(26, slotWidth * 0.6);

  const formatShort = (val) => {
    if (!val || val === 0) return "₹0";
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  const currentMonthIdx = new Date().getMonth();
  const gradId = `${gradientId}_${barColor.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg
        viewBox={`0 0 ${width} ${chartHeight}`}
        className="dashboard-chart"
        style={{ maxHeight: `${chartHeight}px`, width: "100%", height: "auto", display: "block", overflow: "visible" }}
        role="img"
        aria-label="12-Month Revenue Breakdown from PostgreSQL"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c4b5fd" stopOpacity="1" />
            <stop offset="100%" stopColor={barColor} stopOpacity="0.88" />
          </linearGradient>
          <linearGradient id={`${gradId}_hover`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ede9fe" stopOpacity="1" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`${gradId}_zero`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.08)" />
          </linearGradient>
        </defs>

        {/* Dotted horizontal baseline */}
        <line
          x1={padX}
          y1={baselineY}
          x2={width - padX}
          y2={baselineY}
          className="monthly-bar-baseline"
          stroke="currentColor"
          strokeDasharray="3 3"
        />

        {chartData.map((item, idx) => {
          const slotCenterX = padX + (idx + 0.5) * slotWidth;
          const barX = slotCenterX - barWidth / 2;
          const isPositive = item.value > 0;
          const barHeight = isPositive
            ? Math.max(Math.round((item.value / maxValue) * usableHeight), 8)
            : 3;
          const barY = baselineY - barHeight;
          const isHovered = hoveredIdx === idx;
          const isCurrentMonth = currentMonthIdx === idx;

          return (
            <g
              key={item.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Slot hover background glow */}
              {isHovered && (
                <rect
                  x={slotCenterX - slotWidth * 0.46}
                  y={padTop - 4}
                  width={slotWidth * 0.92}
                  height={usableHeight + 8}
                  className="monthly-bar-slot-hover"
                  rx="6"
                />
              )}

              {/* Bar track background slot */}
              <rect
                x={barX}
                y={padTop}
                width={barWidth}
                height={usableHeight}
                className="monthly-bar-track"
                rx="4"
              />

              {/* Bar */}
              <rect
                x={barX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={
                  isPositive
                    ? isHovered
                      ? `url(#${gradId}_hover)`
                      : `url(#${gradId})`
                    : `url(#${gradId}_zero)`
                }
                rx={isPositive ? 4 : 1.5}
                style={{
                  transition: "all 0.25s ease",
                  filter: isHovered && isPositive ? "drop-shadow(0 2px 10px rgba(139, 92, 246, 0.55))" : "none",
                }}
              >
                <title>{`${item.label}: ${formatCurrency(item.value)}`}</title>
              </rect>

              {/* Bar Value on top if positive or hovered */}
              {(isPositive || isHovered) && (
                <text
                  x={slotCenterX}
                  y={Math.max(barY - 5, 12)}
                  textAnchor="middle"
                  className="monthly-bar-val"
                  fontSize={isHovered ? "11" : "10"}
                  fontWeight="800"
                >
                  {formatShort(item.value)}
                </text>
              )}

              {/* Month label below baseline */}
              <text
                x={slotCenterX}
                y={chartHeight - 6}
                textAnchor="middle"
                className={`monthly-bar-label ${isCurrentMonth ? "current" : ""} ${isHovered ? "hovered" : ""}`}
                fontSize="10"
                fontWeight={isCurrentMonth || isHovered ? "700" : "600"}
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
