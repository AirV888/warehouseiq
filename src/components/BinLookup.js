import React, { useState } from 'react';

const MAX_PARTS = 10;

// Natural sort for bin addresses like "15-B-5-3" so segments compare
// numerically (5 before 11) rather than as text (11 before 5).
// Parts with no bin address are pushed to the end.
function binCompare(a, b) {
  const binA = (a.PartBinAddress || '').trim();
  const binB = (b.PartBinAddress || '').trim();
  if (!binA && !binB) return 0;
  if (!binA) return 1;
  if (!binB) return -1;

  const pa = binA.split(/[-\s/.]+/);
  const pb = binB.split(/[-\s/.]+/);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const sa = pa[i] || '';
    const sb = pb[i] || '';
    const bothNumeric = /^\d+$/.test(sa) && /^\d+$/.test(sb);
    if (bothNumeric) {
      const diff = parseInt(sa, 10) - parseInt(sb, 10);
      if (diff !== 0) return diff;
    } else {
      const cmp = sa.localeCompare(sb, undefined, { numeric: true });
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

export default function BinLookup({ products, onBack }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState(null); // null = input view; object = results view

  // Split on new lines, commas, tabs; trim; uppercase; drop blanks; dedupe.
  const parseTokens = (raw) => {
    const seen = new Set();
    const out = [];
    raw.split(/[\n,\t]+/).forEach((t) => {
      const v = t.trim().toUpperCase();
      if (v && !seen.has(v)) { seen.add(v); out.push(v); }
    });
    return out;
  };

  const tokens = parseTokens(text);
  const count = tokens.length;

  const runLookup = () => {
    const use = tokens.slice(0, MAX_PARTS);
    const found = [];
    const missing = [];
    use.forEach((tok) => {
      const p = products.find((pr) => pr.PartID_upper === tok);
      if (p) found.push(p); else missing.push(tok);
    });
    found.sort(binCompare);
    setResults({ found, missing, overflow: tokens.length > MAX_PARTS });
  };

  // ---------- RESULTS VIEW ----------
  if (results) {
    return (
      <div className="result-screen">
        <button className="back-btn" onClick={() => setResults(null)} aria-label="Edit list">
          <BackArrow /> Edit list
        </button>

        <div className="bin-run-header">
          <h2 className="bin-run-title">BIN RUN</h2>
          <p className="bin-run-sub">
            {results.found.length} {results.found.length === 1 ? 'part' : 'parts'} · sorted by bin
          </p>
        </div>

        {results.overflow && (
          <div className="bin-run-note">Only the first {MAX_PARTS} Part IDs were used.</div>
        )}

        {results.found.length > 0 ? (
          <ol className="bin-run-list">
            {results.found.map((p) => {
              const bin = (p.PartBinAddress || '').trim();
              const out = p.CurrentStock === 0;
              return (
                <li key={p.PartID_upper} className="bin-run-row">
                  <div className="bin-run-bin">{bin || '—'}</div>
                  <div className="bin-run-info">
                    <div className="bin-run-pid">{p.PartID_upper}</div>
                    <div className="bin-run-desc">{p.PartDescription}</div>
                  </div>
                  <div className={`bin-run-stock${out ? ' bin-run-stock--out' : ''}`}>
                    <span className="bin-run-stock-num">{p.CurrentStock.toLocaleString()}</span>
                    <span className="bin-run-stock-lbl">{out ? 'OUT' : 'in stock'}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="bin-run-empty">None of those Part IDs were found.</p>
        )}

        {results.missing.length > 0 && (
          <div className="bin-run-missing">
            <div className="bin-run-missing-head">Not found ({results.missing.length})</div>
            <div className="bin-run-missing-list">
              {results.missing.map((m) => (
                <span key={m} className="bin-run-missing-item">{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------- INPUT VIEW ----------
  return (
    <div className="result-screen">
      <button className="back-btn" onClick={onBack} aria-label="Go back">
        <BackArrow /> Back
      </button>

      <div className="bin-run-header">
        <h2 className="bin-run-title">BIN RUN</h2>
        <p className="bin-run-sub">Enter up to {MAX_PARTS} Part IDs — get their bins in picking order.</p>
      </div>

      <textarea
        className="bin-run-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={'One Part ID per line…\n\nEM-5551\nAG-0210\nAAMHO1060'}
        autoCapitalize="characters"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        rows={9}
        aria-label="Part IDs, one per line"
      />

      <div className="bin-run-count">
        <span className={count > MAX_PARTS ? 'over' : ''}>{count}</span> / {MAX_PARTS} entered
        {count > MAX_PARTS && <span className="bin-run-count-warn"> — extra will be ignored</span>}
      </div>

      <button
        className="search-btn"
        onClick={runLookup}
        disabled={count === 0}
        style={count === 0 ? { opacity: 0.5 } : undefined}
      >
        FIND BINS
      </button>

      {text.trim() !== '' && (
        <button className="bin-run-clear" onClick={() => setText('')}>Clear</button>
      )}
    </div>
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
