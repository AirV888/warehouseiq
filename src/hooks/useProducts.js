import { useState, useEffect } from 'react';

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [stockAsAt, setStockAsAt] = useState('');
  const [bagSizes, setBagSizes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/data/products.json').then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }),
      fetch('/data/metadata.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
      // Express Post bag size per part — derived from sales history, optional.
      fetch('/data/bagsizes.json').then(r => r.ok ? r.json() : {}).catch(() => ({})),
    ])
      .then(([data, meta, bags]) => {
        setProducts(data);
        setStockAsAt(meta.stockAsAt || '');
        setBagSizes(bags || {});
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return { products, stockAsAt, bagSizes, loading, error };
}
