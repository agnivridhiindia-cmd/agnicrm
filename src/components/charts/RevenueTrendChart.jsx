import React from "react";

export default function RevenueTrendChart({
  data = [],
  color = "#6366f1",
  gradientId = "revGrad",
  height = 135,
}) {
  const width = 640;
  const chartHeight = height || 135;
  const paddingX = 26;
  const paddingY = 16;
  const baselineOffset = 14;
  const baselineY = chartHeight - paddingY - baselineOffset;

  const values = data.map((item) => item.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;
  const usableHeight = Math.max(baselineY - paddingY, 10);

  const points = data.map((item, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / Math.max(data.length - 1, 1);
    const y = baselineY - ((item.value - minValue) / range) * usableHeight;
    return { x, y, label: item.label, value: item.value };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
    : "";

  const uniqueGradId = `${gradientId}_${color.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${chartHeight}`}
      className="dashboard-chart"
      style={{ maxHeight: `${chartHeight}px`, width: "100%", height: "auto", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={uniqueGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <line
        x1={paddingX}
        y1={baselineY}
        x2={width - paddingX}
        y2={baselineY}
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeDasharray="3 3"
      />
      {areaPath && <path d={areaPath} fill={`url(#${uniqueGradId})`} />}
      {linePath && <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="3.5" fill="#fff" stroke={color} strokeWidth="2">
            <title>{`${point.label}: ₹${Number(point.value || 0).toLocaleString("en-IN")}`}</title>
          </circle>
          <text
            x={point.x}
            y={chartHeight - 4}
            textAnchor="middle"
            fill="currentColor"
            opacity="0.75"
            fontSize="9.5"
            fontWeight="600"
          >
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
