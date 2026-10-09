import React from 'react';
import Icon from './Icon';

function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return '78, 124, 255';
  let c = hex.substring(1);
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return '78, 124, 255';
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export default function KpiCard({ card, onAction, onClick, dark, ...props }) {
  // Support both `card` object and spread individual props
  const data = card || props;
  const accent = data.accent || "#4e7cff";
  const label = data.label || "";
  const value = data.value || "";
  const trend = data.trend || "";
  const description = data.description || "";
  const icon = data.icon || null;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (onAction && card) {
      onAction(card);
    }
  };

  const rgb = hexToRgb(accent);

  return (
    <article
      className="kpi-card"
      style={{
        '--kpi-accent': accent,
        '--kpi-rgb': rgb,
        cursor: onClick || onAction ? 'pointer' : 'default',
      }}
      onClick={handleClick}
    >
      <div className="kpi-card-header">
        <div className="kpi-card-title">
          {icon && (
            <span className="kpi-card-icon">
              <Icon name={icon} size={18} />
            </span>
          )}
          <span>{label}</span>
        </div>
      </div>
      <h2>{value}</h2>
      {description && <p>{description}</p>}
    </article>
  );
}
