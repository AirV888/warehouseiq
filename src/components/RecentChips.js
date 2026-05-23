import React from 'react';

export default function RecentChips({ items, onSelect }) {
  if (!items.length) return null;
  return (
    <div className="recent-section">
      <h3 className="recent-title">Recent Searches</h3>
      <div className="chips">
        {items.map(item => (
          <button key={item} className="chip" onClick={() => onSelect(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
