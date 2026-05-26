import React, { useState } from 'react';
import SalesChart from './SalesChart';

function getStockStatus(currentStock, avg12MthSales) {
  if (currentStock === 0) return 'out';
  if (currentStock < avg12MthSales * 3) return 'low';
  return 'ok';
}

const PLACEHOLDER = (
  <div className="photo-placeholder" aria-label="No photo available">
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#2A4060" strokeWidth="2">
      <rect x="4" y="12" width="56" height="40" rx="4" />
      <circle cx="22" cy="28" r="6" />
      <polyline points="4,52 20,34 30,44 42,30 60,52" />
    </svg>
    <span>No Photo</span>
  </div>
);

export default function ResultCard({ product, query, notFound, onBack, stockAsAt }) {
  const [imgError, setImgError] = useState(false);

  if (notFound) {
    return (
      <div className="result-screen">
        <button className="back-btn" onClick={onBack} aria-label="Go back">
          <BackArrow /> Back
        </button>
        <div className="not-found-card">
          <div className="not-found-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="12" />
              <circle cx="11" cy="15" r="0.5" fill="#EF4444" />
            </svg>
          </div>
          <h2 className="not-found-heading">Part Not Found</h2>
          <p className="not-found-query">"{query}"</p>
          <p className="not-found-hint">Check the Part ID or barcode and try again.</p>
        </div>
      </div>
    );
  }

  const photoSrc = `/photos/${product.PhotoFile}`;
  const stockStatus = getStockStatus(product.CurrentStock, product.Avg12MthSales);
  const threshold = Math.round(product.Avg12MthSales * 3);

  return (
    <div className="result-screen">
      <button className="back-btn" onClick={onBack} aria-label="Go back">
        <BackArrow /> Back
      </button>

      <div className="result-card">
        {/* Photo */}
        <div className="part-photo-wrap">
          {imgError ? PLACEHOLDER : (
            <img
              className="part-photo"
              src={photoSrc}
              alt={product.PartDescription}
              onError={() => setImgError(true)}
              loading="lazy"
            />
          )}
        </div>

        <div className="result-body">
          {/* Part ID + stock badge + description */}
          <div className="part-id-row">
            <div className="part-id-label">{product.PartID_upper}</div>
            {stockStatus !== 'ok' && (
              <span className={`stock-badge stock-badge--${stockStatus}`}>
                {stockStatus === 'out' ? 'Out of stock' : 'Low stock'}
              </span>
            )}
          </div>
          <div className="part-desc">{product.PartDescription}</div>
          {product.ProductClass && (
            <div className="part-class">{product.ProductClass}</div>
          )}

          <div className="divider" />

          {/* Bin address — the most important thing */}
          <div className="bin-section">
            <div className="bin-label">BIN LOCATION</div>
            <div className="bin-address">{product.PartBinAddress}</div>
          </div>

          <div className="divider" />

          {/* Stock + 12-month avg */}
          <div className="stock-row">
            <div className="stock-cell">
              <span className="stock-label">Current Stock</span>
              <span className={`stock-value${stockStatus !== 'ok' ? ` stock-value--${stockStatus}` : ''}`}>
                {product.CurrentStock.toLocaleString()}
              </span>
              {stockAsAt && (
                <span className="stock-as-at">({stockAsAt})</span>
              )}
            </div>
            {product.sales && product.sales.length > 0 && (
              <div className="stock-cell stock-cell--right">
                <span className="stock-label">12 MTH AVG SALES</span>
                <span className="stock-value">
                  {Math.round(
                    product.sales.slice(-12).reduce((sum, s) => sum + s.qty, 0) /
                    Math.min(product.sales.length, 12)
                  ).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* Pending order note */}
          {product.OnOrder > 0 && (
            <div className="on-order-note">
              <OrderIcon />
              <span><strong>{product.OnOrder.toLocaleString()} units</strong> on order</span>
            </div>
          )}

          {/* Low / out of stock alert banner */}
          {stockStatus !== 'ok' && (
            <div className={`stock-alert stock-alert--${stockStatus}`}>
              <WarningIcon />
              <span>
                {stockStatus === 'out'
                  ? <><strong>No stock on hand.</strong> Reorder urgently — 90-day import lead time applies.</>
                  : <><strong>Stock below 90-day cover.</strong> {product.CurrentStock.toLocaleString()} units on hand — under the {threshold}-unit reorder threshold (3× avg monthly sales).</>
                }
              </span>
            </div>
          )}

          {/* Sales chart */}
          {product.sales && product.sales.length > 0 && (
            <div className="chart-section">
              <div className="chart-heading">Monthly Sales History</div>
              <SalesChart data={product.sales} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/>
      <path d="M16.5 9.4 7.55 4.24"/>
      <polyline points="3.29 7 12 12 20.71 7"/>
      <line x1="12" y1="22" x2="12" y2="12"/>
      <polyline points="16 16 19 19 22 16"/>
      <line x1="19" y1="19" x2="19" y2="13"/>
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
