import React, { useRef, useState, useEffect } from "react";

export function SalesQuotaChart({ months, quotaData, acquiredData }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(800);
  const height = 260;
  const paddingX = 24;
  const paddingTop = 28;
  const paddingBottom = 40;

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

  const validAcquiredNums = acquiredData.filter((v) => v !== null && v !== undefined);
  const maxValue = Math.max(...quotaData, ...(validAcquiredNums.length > 0 ? validAcquiredNums : [0]), 80000);
  const plotHeight = height - paddingTop - paddingBottom;

  const points = months.map((label, index) => {
    const x = paddingX + (index * (width - paddingX * 2)) / Math.max(months.length - 1, 1);
    const quotaY = height - paddingBottom - (quotaData[index] / maxValue) * plotHeight;
    const acqVal = acquiredData[index];
    const acquiredY = acqVal !== null && acqVal !== undefined ? height - paddingBottom - (acqVal / maxValue) * plotHeight : null;
    return { label, x, quotaY, acquiredY, quota: quotaData[index], acquired: acqVal };
  });

  const quotaPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.quotaY}`).join(" ");

  const validAcquiredPoints = points.filter((p) => p.acquiredY !== null);
  const acquiredPath = validAcquiredPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.acquiredY}`).join(" ");

  const [hoverPoint, setHoverPoint] = useState(null);

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#4e5579" }}>
            <span style={{ width: 10, height: 10, background: "#9a74e9", borderRadius: 999 }} /> Quota (₹80,000)
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "#4e5579" }}>
            <span style={{ width: 10, height: 10, background: "#44bfb0", borderRadius: 999 }} /> Acquired (Excl. GST)
          </span>
        </div>

        {hoverPoint && (
          <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0", background: "rgba(15, 23, 42, 0.85)", padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)" }}>
            {hoverPoint.label}: Quota <strong>₹{hoverPoint.quota.toLocaleString("en-IN")}</strong> | Acquired <strong>{hoverPoint.acquired !== null && hoverPoint.acquired !== undefined ? `₹${hoverPoint.acquired.toLocaleString("en-IN")}` : "Blank (Month pending)"}</strong>
          </div>
        )}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: 260, overflow: "visible", display: "block" }}
        aria-hidden="true"
      >
        <path d={quotaPath} fill="none" stroke="#9a74e9" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        {acquiredPath && (
          <path d={acquiredPath} fill="none" stroke="#44bfb0" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        )}

        {points.map((point) => (
          <g
            key={point.label}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHoverPoint(point)}
            onMouseLeave={() => setHoverPoint(null)}
          >
            <circle cx={point.x} cy={point.quotaY} r={5} fill="#fff" stroke="#9a74e9" strokeWidth={2.5} />
            {point.acquiredY !== null && (
              <circle cx={point.x} cy={point.acquiredY} r={5} fill="#fff" stroke="#44bfb0" strokeWidth={2.5} />
            )}
          </g>
        ))}

        {points.map((point) => (
          <text
            key={`${point.label}-label`}
            x={point.x}
            y={height - 12}
            textAnchor="middle"
            fontSize="12"
            fontWeight="500"
            fill="#6b6b77"
          >
            {point.label}
          </text>
        ))}
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
