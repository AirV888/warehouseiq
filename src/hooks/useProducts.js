import { useState, useEffect } from 'react';

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/data/products.json')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => { setProducts(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return { products, loading, error };
}
