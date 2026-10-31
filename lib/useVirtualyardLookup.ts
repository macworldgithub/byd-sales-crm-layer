'use client';

import { useEffect, useState } from 'react';
import { virtualyardApi, VirtualyardOption } from './api';

export function useVirtualyardLookup(kind: 'vehicles' | 'users' | 'customers', query: string, enabled: boolean, refresh: number) {
  const [rows, setRows] = useState<VirtualyardOption[]>([]);
  const [limit, setLimit] = useState(1000);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { setLimit(1000); setRows([]); }, [query, refresh]);
  useEffect(() => {
    if (!enabled) { setRows([]); setLoading(false); setHasMore(false); return; }
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true); setError('');
    const timer = setTimeout(async () => {
      const result = await virtualyardApi.lookup(kind, query, limit, controller.signal);
      if (cancelled) return;
      if (result.success) {
        setRows(result.data || []); setHasMore(Boolean(result.hasMore));
      } else {
        setRows([]); setHasMore(false); setError(result.message || 'Virtual Yard lookup failed.');
      }
      setLoading(false);
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [kind, query, enabled, limit, refresh]);

  return { rows, hasMore, loading, error, limit, loadMore: () => setLimit(value => Math.min(value + 1000, 50000)) };
}
