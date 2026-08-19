import React, { useState, useRef, useMemo } from 'react';

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
  const [items, setItems] = useState([]);       // parts added to the pick list
  const [adding, setAdding] = useState(true);    // is the search box open?
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);  // null = builder view; array = results view
  const inputRef = useRef(null);

  // Suggestions: match Part ID / description, exclude parts already added.
  const suggestions = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return [];
    const chosen = new Set(items.map((p) => p.PartID_upper));
    return products
      .filter((p) => p.PartID_upper.includes(q) && !chosen.has(p.PartID_upper))
      .slice(0, 8);
  }, [query, products, items]);

  const addItem = (p) => {
    setItems((prev) =>
      prev.some((x) => x.PartID_upper === p.PartID_upper) ? prev : [...prev, { ...p, qty: 1 }]
    );
    setQuery('');
    setAdding(false);
    if (inputRef.current) inputRef.current.blur(); // dismiss keypad after picking
  };

  const removeItem = (pid) => {
    setItems((prev) => prev.filter((p) => p.PartID_upper !== pid));
  };

  // Pick quantity — always at least 1, capped at a sane 9999.
  const setQty = (pid, next) => {
    setItems((prev) =>
      prev.map((p) => (p.PartID_upper === pid ? { ...p, qty: next } : p))
    );
  };

  const bumpQty = (pid, delta) => {
    setItems((prev) =>
      prev.map((p) =>
        p.PartID_upper === pid
          ? { ...p, qty: Math.min(9999, Math.max(1, (p.qty || 1) + delta)) }
          : p
      )
    );
  };

  const totalPieces = items.reduce((sum, p) => sum + (Number(p.qty) || 0), 0);

  // Focus synchronously inside the tap so mobile opens the keypad immediately.
  const startAdding = () => {
    if (inputRef.current) inputRef.current.focus();
    setAdding(true);
  };

  const cancelAdding = () => {
    if (inputRef.current) inputRef.current.blur();
    setQuery('');
    setAdding(false);
  };

  const findBins = () => {
    setResults([...items].sort(binCompare));
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
            {results.length} {results.length === 1 ? 'part' : 'parts'} ·{' '}
            {results.reduce((sum, p) => sum + (Number(p.qty) || 0), 0).toLocaleString()} pcs to pick · sorted by bin
          </p>
        </div>

        <ol className="bin-run-list">
          {results.map((p) => {
            const bin = (p.PartBinAddress || '').trim();
            const qty = Number(p.qty) || 1;
            const out = p.CurrentStock === 0;
            const short = !out && qty > p.CurrentStock;
            return (
              <li key={p.PartID_upper} className="bin-run-row">
                <div className="bin-run-bin">{bin || '—'}</div>
                <div className="bin-run-info">
                  <div className="bin-run-pid">{p.PartID_upper}</div>
                  <div className="bin-run-desc">{p.PartDescription}</div>
                  <div
                    className={`bin-run-stockline${out ? ' bin-run-stockline--out' : ''}${short ? ' bin-run-stockline--short' : ''}`}
                  >
                    {out
                      ? 'OUT OF STOCK'
                      : short
                        ? `Only ${p.CurrentStock.toLocaleString()} in stock`
                        : `${p.CurrentStock.toLocaleString()} in stock`}
                  </div>
                </div>
                <div className={`bin-run-pick${out || short ? ' bin-run-pick--short' : ''}`}>
                  <span className="bin-run-pick-num">{qty.toLocaleString()}</span>
                  <span className="bin-run-pick-lbl">to pick</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  // ---------- BUILDER VIEW ----------
  return (
    <div className="result-screen">
      <button className="back-btn" onClick={onBack} aria-label="Go back">
        <BackArrow /> Back
      </button>

      <div className="bin-run-header">
        <h2 className="bin-run-title">BIN RUN</h2>
        <p className="bin-run-sub">Add parts and quantities, then find their bins.</p>
      </div>

      {items.length > 0 && (
        <ol className="bin-build-list">
          {items.map((p, i) => (
            <li key={p.PartID_upper} className="bin-build-item">
              <span className="bin-build-num">{i + 1}</span>
              <div className="bin-build-info">
                <div className="bin-build-pid">{p.PartID_upper}</div>
                <div className="bin-build-desc">{p.PartDescription}</div>
              </div>
              <button
                className="bin-build-remove"
                onClick={() => removeItem(p.PartID_upper)}
                aria-label={`Remove ${p.PartID_upper}`}
              >
                ×
              </button>

              <div className="bin-build-qty">
                <span className="bin-build-qty-lbl">Qty to pick</span>
                <button
                  className="bin-qty-btn"
                  onClick={() => bumpQty(p.PartID_upper, -1)}
                  disabled={(p.qty || 1) <= 1}
                  aria-label={`Decrease quantity for ${p.PartID_upper}`}
                >
                  −
                </button>
                <input
                  className="bin-qty-input"
                  type="tel"
                  inputMode="numeric"
                  value={p.qty}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                    setQty(p.PartID_upper, digits === '' ? '' : parseInt(digits, 10));
                  }}
                  onBlur={() => {
                    if (!p.qty || p.qty < 1) setQty(p.PartID_upper, 1);
                  }}
                  aria-label={`Quantity to pick for ${p.PartID_upper}`}
                />
                <button
                  className="bin-qty-btn"
                  onClick={() => bumpQty(p.PartID_upper, 1)}
                  aria-label={`Increase quantity for ${p.PartID_upper}`}
                >
                  +
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Search field stays mounted (hidden when collapsed) so the keypad can
          be opened synchronously from the Add-next-item tap. */}
      <div className={`search-wrap bin-search-wrap${adding ? '' : ' collapsed'}`}>
        <div className="typeahead-group">
          <input
            ref={inputRef}
            className="search-input"
            type="search"
            inputMode="numeric"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Part ID…"
            autoCapitalize="characters"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-label="Search part to add"
            aria-autocomplete="list"
            tabIndex={adding ? 0 : -1}
          />
          {adding && suggestions.length > 0 && (
            <ul className="suggestions" role="listbox" aria-label="Matching parts">
              {suggestions.map((p) => (
                <li
                  key={p.PartID_upper}
                  className="suggestion-item"
                  role="option"
                  aria-selected={false}
                  onMouseDown={(e) => { e.preventDefault(); addItem(p); }}
                  onTouchEnd={(e) => { e.preventDefault(); addItem(p); }}
                >
                  <span className="sug-id">{p.PartID_upper}</span>
                  <span className="sug-desc">{p.PartDescription}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {adding && items.length > 0 && (
          <button className="bin-add-cancel" onClick={cancelAdding}>Cancel</button>
        )}
      </div>

      {!adding && (
        <button className="bin-add-next" onClick={startAdding}>
          <PlusIcon /> Add next item
        </button>
      )}

      {items.length > 0 && (
        <button className="search-btn bin-find-btn" onClick={findBins}>
          FIND BINS ({items.length} · {totalPieces.toLocaleString()} PCS)
        </button>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8, flexShrink: 0 }}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
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
