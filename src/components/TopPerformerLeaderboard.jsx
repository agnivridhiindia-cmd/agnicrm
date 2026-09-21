import React from 'react';

function scoreValue(score) {
  if (typeof score !== 'string') return 0;
  return parseInt(score.replace('%', ''), 10) || 0;
}

export default function TopPerformerLeaderboard({ performers = [] }) {
  const grouped = performers.reduce((acc, performer) => {
    const role = performer.role || 'Other';
    acc[role] = acc[role] || [];
    acc[role].push(performer);
    return acc;
  }, {});

  const groups = Object.entries(grouped)
    .map(([role, items]) => ({
      role,
      items: items
        .slice()
        .sort((a, b) => scoreValue(b.score) - scoreValue(a.score))
        .slice(0, 5),
    }))
    .sort((a, b) => a.role.localeCompare(b.role));

  return (
    <section className="performance-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Leaderboard</p>
          <h2>Top performers</h2>
        </div>
        <button type="button">See all</button>
      </div>
      {groups.map((group) => (
        <div key={group.role} className="performance-panel-group">
          <h3 style={{ margin: '0 0 16px', color: '#6f6a86', fontSize: 14 }}>{group.role}</h3>
          <div className="performance-lists">
            {group.items.map((item) => {
              const value = scoreValue(item.score);
              return (
                <div className="performance-item" key={`${group.role}-${item.name}`}>
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.detail}</small>
                  </div>
                  <span>{item.score}</span>
                  <div className="progress-bar">
                    <span style={{ width: `${value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}
