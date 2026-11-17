import React from 'react';

// BoxFinder — Warehouse 2 box locator with Check In / Check Out.
// Front-page entry points are live; each opens a Coming Soon screen
// until BoxFinder launches.

const MODES = {
  find: {
    title: 'FIND A BOX',
    sub: 'Scan or type a box barcode or Part ID to see its pallet and rack.',
    steps: [
      'Scan the box barcode, or type a Part ID',
      'See the pallet number and rack address',
      'Walk to the rack and pull the box',
    ],
  },
  checkin: {
    title: 'CHECK IN',
    sub: 'Put a box onto a pallet in Warehouse 2 or 3.',
    steps: [
      'Scan the box barcode',
      'Scan the pallet barcode',
      'Confirm — the rack address comes from the pallet',
    ],
  },
  move: {
    title: 'MOVE',
    sub: 'Shift boxes or a whole pallet within W2 or W3.',
    steps: [
      'Choose a box or a whole pallet',
      'Scan it, then scan where it is going',
      'Confirm — the old spot stays in the log',
    ],
  },
  checkout: {
    title: 'CHECK OUT',
    sub: 'A whole box is leaving Warehouse 2 or 3.',
    steps: [
      'Scan the box barcode',
      'Choose where it is going (e.g. Warehouse 1)',
      'Confirm — the box is logged out with your name and the time',
    ],
  },
};

export default function BoxFinder({ mode, onBack }) {
  const m = MODES[mode] || MODES.find;

  return (
    <div className="result-screen">
      <button className="back-btn" onClick={onBack} aria-label="Go back">
        <BackArrow /> Back
      </button>

      <div className="bin-run-header">
        <p className="box-eyebrow">BOX FINDER · WAREHOUSE 2 &amp; 3</p>
        <h2 className="bin-run-title">{m.title}</h2>
        <p className="bin-run-sub">{m.sub}</p>
      </div>

      <div className="box-coming">
        <div className="box-coming-icon">
          <BoxIcon kind={mode} />
        </div>
        <p className="box-coming-title">COMING SOON</p>
        <p className="box-coming-sub">Launching in 2027</p>
      </div>
    </div>
  );
}

export function BoxIcon({ kind }) {
  const common = {
    width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
  };
  if (kind === 'checkin') {
    return (
      <svg {...common}>
        <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
        <line x1="12" y1="8" x2="12" y2="15" />
        <polyline points="9 12 12 15 15 12" />
      </svg>
    );
  }
  if (kind === 'move') {
    return (
      <svg {...common}>
        <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
        <line x1="7.5" y1="12" x2="16.5" y2="12" />
        <polyline points="10 9.5 7.5 12 10 14.5" />
        <polyline points="14 9.5 16.5 12 14 14.5" />
      </svg>
    );
  }
  if (kind === 'checkout') {
    return (
      <svg {...common}>
        <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
        <line x1="12" y1="15" x2="12" y2="8" />
        <polyline points="9 11 12 8 15 11" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
      <circle cx="12" cy="12" r="3" />
      <line x1="14.2" y1="14.2" x2="16.5" y2="16.5" />
    </svg>
  );
}

function BackArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6, verticalAlign: 'middle' }}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
