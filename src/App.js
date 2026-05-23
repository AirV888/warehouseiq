import React, { useState, useCallback } from 'react';
import SearchBar from './components/SearchBar';
import ResultCard from './components/ResultCard';
import RecentChips from './components/RecentChips';
import BarcodeModal from './components/BarcodeModal';
import useProducts from './hooks/useProducts';
import './App.css';

const MAX_RECENT = 8;

function getRecent() {
  try { return JSON.parse(localStorage.getItem('wiq_recent') || '[]'); }
  catch { return []; }
}

function saveRecent(list) {
  try { localStorage.setItem('wiq_recent', JSON.stringify(list)); } catch {}
}

export default function App() {
  const { products, loading, error: loadError } = useProducts();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [recent, setRecent] = useState(getRecent);

  const addRecent = useCallback((partIdUpper) => {
    setRecent(prev => {
      const next = [partIdUpper, ...prev.filter(p => p !== partIdUpper)].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  const search = useCallback((q) => {
    const upper = (q || '').trim().toUpperCase();
    if (!upper) return;
    const found = products.find(p => p.PartID_upper === upper);
    setResult(found ?? null);
    setNotFound(!found);
    setQuery(upper);
    if (found) addRecent(found.PartID_upper);
  }, [products, addRecent]);

  const searchByBarcode = useCallback((barcode) => {
    setScanMode(false);
    const found = products.find(p => p.PartBarCode === barcode);
    if (found) {
      setQuery(found.PartID_upper);
      setResult(found);
      setNotFound(false);
      addRecent(found.PartID_upper);
    } else {
      setQuery(barcode);
      setResult(null);
      setNotFound(true);
    }
  }, [products, addRecent]);

  const handleBack = useCallback(() => {
    setResult(null);
    setNotFound(false);
    setQuery('');
  }, []);

  if (loading) {
    return (
      <div className="splash">
        <div className="splash-logo">IQ</div>
        <p className="splash-text">Loading products…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="splash splash-error">
        <p>Failed to load product data.</p>
        <p className="splash-sub">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="app">
      {scanMode && (
        <BarcodeModal onDetect={searchByBarcode} onClose={() => setScanMode(false)} />
      )}

      {(result || notFound) ? (
        <ResultCard
          product={result}
          query={query}
          notFound={notFound}
          onBack={handleBack}
        />
      ) : (
        <div className="home">
          <header className="app-header">
            <div className="logo-mark" aria-hidden="true">IQ</div>
            <h1 className="app-title">BoonmaIQ</h1>
            <p className="app-subtitle">PART FINDER</p>
          </header>

          <main>
            <SearchBar
              value={query}
              onChange={setQuery}
              onSearch={search}
              onScanClick={() => setScanMode(true)}
            />
            <RecentChips items={recent} onSelect={search} />
          </main>
        </div>
      )}
    </div>
  );
}
