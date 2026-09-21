import React from 'react';
import Icon from './Icon';

export default function RevenueSummaryCard({ card }) {
  const isReceived = card.accentClass === 'received';
  const isPending = card.accentClass === 'pending';
  
  const statusLabel = isReceived ? 'Collected' : isPending ? 'Pending' : 'Total Pipeline';
  const statusPercent = card.percentage !== undefined ? `${card.percentage}%` : (isReceived ? '72%' : isPending ? '28%' : '100%');

  return (
    <div className={`revenue-summary-card ${card.accentClass || ''}`}>
      <div className="revenue-summary-card__top">
        <div className={`revenue-summary-icon ${card.accentClass || ''}`}>
          <Icon name={card.icon || 'wallet'} size={18} />
        </div>
        <span className={`revenue-summary-pill ${card.accentClass || ''}`}>
          <span className="revenue-summary-dot" />
          {statusLabel}
        </span>
      </div>

      <div className="revenue-summary-card__body">
        <p className="revenue-summary-card__label">{card.label}</p>
        <h3>{card.value}</h3>
      </div>

      <div className="revenue-summary-card__bottom">
        <div className="revenue-summary-progress">
          <div
            className={`revenue-summary-progress-fill ${card.accentClass || ''}`}
            style={{ width: statusPercent }}
          />
        </div>
        <p className="revenue-summary-card__hint">
          <span>{card.hint}</span>
          <strong>{statusPercent}</strong>
        </p>
      </div>
    </div>
  );
}
