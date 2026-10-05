import React, { useState } from "react";

export default function PerformanceChart({ series = [], label, quotaData }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hasQuota = Array.isArray(quotaData);
  const [hoverIndex, setHoverIndex] = useState(null);
  const width = 720;
  const height = 260;
  const padLeft = hasQuota ? 58 : 36;
  const padRight = 18;
  const padTop = 20;
  const padBottom = 44;
  const max = Math.max(...series, ...(hasQuota ? quotaData : []), 1);
  const plotHeight = height - padTop - padBottom;
  const plotWidth = width - padLeft - padRight;
  const baseline = height - padBottom;
  const slotWidth = plotWidth / months.length;
  const barGap = 4;
  const barWidth = Math.min(18, (slotWidth * 0.68 - barGap) / 2);
  const points = series.map((v, i) => {
    const x = padLeft + (i * plotWidth) / Math.max(series.length - 1, 1);
    const y = baseline - Math.round((v / max) * plotHeight);
    return { x, y, v, label: months[i] };
  });
  const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

  return (
    <div style={{ padding: 12 }}>
      {hasQuota && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 10, color: "#5b6475", fontSize: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#9a74e9" }} />
            Monthly quota
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: "#44bfb0" }} />
            Sales (Excl. GST)
          </span>
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: "auto", minHeight: 190, display: "block" }}
        role="img"
        aria-label={hasQuota ? `${label || "Employee performance"} by month: quota and sales` : label || "Employee performance by month"}
      >
        {hasQuota && [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
          const y = baseline - fraction * plotHeight;
          const tick = Math.round((max * fraction) / 1000);
          return (
            <g key={fraction}>
              <line x1={padLeft} y1={y} x2={width - padRight} y2={y} stroke="#e2e8f0" strokeDasharray="3 5" />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#718096">
                ₹{tick}k
              </text>
            </g>
          );
        })}

        {hasQuota ? months.map((month, index) => {
          const centerX = padLeft + slotWidth * (index + 0.5);
          const sales = Number(series[index]) || 0;
          const quota = Number(quotaData[index]) || 0;
          const quotaHeight = (quota / max) * plotHeight;
          const salesHeight = (sales / max) * plotHeight;
          const groupWidth = barWidth * 2 + barGap;
          const quotaX = centerX - groupWidth / 2;
          const salesX = quotaX + barWidth + barGap;

          return (
            <g
              key={month}
              tabIndex={0}
              role="group"
              aria-label={`${month}: quota ${formatCurrency(quota)}, sales ${formatCurrency(sales)}`}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              onFocus={() => setHoverIndex(index)}
              onBlur={() => setHoverIndex(null)}
            >
              {hoverIndex === index && (
                <rect
                  x={centerX - slotWidth * 0.48}
                  y={padTop}
                  width={slotWidth * 0.96}
                  height={plotHeight}
                  fill="rgba(154, 116, 233, 0.06)"
                />
              )}
              <rect x={quotaX} y={baseline - quotaHeight} width={barWidth} height={quotaHeight} rx={3} fill="#9a74e9" />
              <rect x={salesX} y={baseline - salesHeight} width={barWidth} height={salesHeight} rx={3} fill="#44bfb0" />
              <text x={centerX} y={height - 14} textAnchor="middle" fontSize="11" fill="#7b7790">{month}</text>
            </g>
          );
        }) : (
          <>
            <polyline
              fill="none"
              stroke="#cfcff6"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points.map(p => `${p.x},${p.y}`).join(' ')}
            />
            {points.map((p, idx) => (
              <g key={idx}>
                <circle cx={p.x} cy={p.y} r={6} fill={idx >= 10 ? (idx === 11 ? '#44bfb0' : '#9a74e9') : '#9a74e9'} />
                <text x={p.x} y={height - 14} textAnchor="middle" fontSize="11" fill="#7b7790">{p.label}</text>
              </g>
            ))}
          </>
        )}
      </svg>

      {hasQuota && hoverIndex !== null && (
        <div role="status" style={{ marginTop: 6, color: "#334155", fontSize: 12, fontWeight: 600 }}>
          {months[hoverIndex]}: quota {formatCurrency(quotaData[hoverIndex])} · sales {formatCurrency(series[hoverIndex])}
        </div>
      )}
      {label && <div style={{ marginTop: 12, color: '#6b6b77' }}>{label}</div>}
    </div>
  );
}
