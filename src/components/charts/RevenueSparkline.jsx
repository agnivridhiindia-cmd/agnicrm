import React, { useMemo } from "react";

export default function RevenueSparkline({
  data,
  d: propD,
  dots: propDots,
  strokeColor = "rgba(255, 255, 255, 0.85)",
}) {
  const { pathD, dotPoints } = useMemo(() => {
    // If explicit path props are passed without data, respect them
    if (propD && propDots && !data) {
      return { pathD: propD, dotPoints: propDots };
    }

    const series = Array.isArray(data) && data.length > 0 ? data : [0, 0, 0, 0];
    const maxVal = Math.max(...series, 0);

    const width = 240;
    const paddingX = 14;
    const topY = 14;
    const baselineY = 50;
    const rangeY = baselineY - topY; // 36px

    const n = series.length;

    // When all values are 0 (fresh database or no revenue recorded), render a flat baseline
    if (maxVal === 0) {
      const flatD = `M ${paddingX} ${baselineY} L ${width - paddingX} ${baselineY}`;
      const flatDots = [
        { cx: paddingX, cy: baselineY },
        { cx: Math.round(width / 2), cy: baselineY },
        { cx: width - paddingX, cy: baselineY },
      ];
      return { pathD: flatD, dotPoints: flatDots };
    }

    // Dynamic curve scaling according to real data
    const points = series.map((val, idx) => {
      const cx = paddingX + (idx / (n - 1)) * (width - 2 * paddingX);
      const ratio = maxVal > 0 ? Math.max(0, val) / maxVal : 0;
      const cy = Math.round((baselineY - ratio * rangeY) * 10) / 10;
      return { cx, cy };
    });

    let d = `M ${points[0].cx.toFixed(1)} ${points[0].cy.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const midX = (curr.cx + next.cx) / 2;
      d += ` C ${midX.toFixed(1)} ${curr.cy.toFixed(1)}, ${midX.toFixed(1)} ${next.cy.toFixed(1)}, ${next.cx.toFixed(1)} ${next.cy.toFixed(1)}`;
    }

    const dotsToShow = points.length <= 4 
      ? points 
      : [points[0], points[Math.floor(points.length / 2)], points[points.length - 1]];

    return { pathD: d, dotPoints: dotsToShow };
  }, [data, propD, propDots]);

  return (
    <svg viewBox="0 0 240 64" aria-hidden="true" className="sparkline-chart">
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {dotPoints.map((dot, idx) => (
        <circle key={idx} cx={dot.cx} cy={dot.cy} r="4" fill="#fff" />
      ))}
    </svg>
  );
}
