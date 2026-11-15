'use client';
import React, { useEffect, useState } from 'react';
import { vyApi } from '@/lib/api';
import { VirtualYardStock } from '@/lib/types';

type Selection = { stockId: string; vin: string; tba: boolean };
export function InventoryVinPicker({ site, value, onChange }: { site?: string; value: Selection; onChange: (value: Selection) => void }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [rows, setRows] = useState<VirtualYardStock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { setPage(1); setQuery(''); }, [site]);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    const timer = window.setTimeout(async () => {
      try {
        const response = await vyApi.getStock({ q: query, site, page, limit: 20 });
        if (!response.success || !response.data) throw new Error(response.message || 'Inventory unavailable.');
        if (active) { setRows(response.data); setPages(response.pagination?.pages || 1); }
      } catch (error) { if (active) { setRows([]); setError(error instanceof Error ? error.message : 'Inventory unavailable.'); } }
      finally { if (active) setLoading(false); }
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, page, site]);
  return <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
    <legend className="px-1 text-sm font-semibold">To Delivery · vehicle VIN</legend>
    <p className="text-xs text-slate-600">Search your dealership's inventory by VIN, stock number or model, or choose TBA if a VIN has not been allocated.</p>
    <label className="block text-sm">Search inventory<input type="search" aria-label="Search inventory" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="VIN, stock number or model" className="mt-1 w-full rounded-lg border bg-white p-2.5"/></label>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <label className="block text-sm">Inventory vehicle<select aria-label="Inventory vehicle" disabled={loading} value={value.tba ? '' : value.stockId} onChange={event => { const stock = rows.find(row => row.stock_id === event.target.value); if (stock) onChange({ stockId: stock.stock_id, vin: stock.vin, tba: false }); }} className="mt-1 w-full rounded-lg border bg-white p-2.5 disabled:opacity-50">
      <option value="">{loading ? 'Searching inventory…' : 'Choose an inventory vehicle'}</option>
      {!value.tba && value.stockId && !rows.some(row => row.stock_id === value.stockId) && <option value={value.stockId}>{value.stockId} · {value.vin}</option>}
      {rows.map(stock => <option key={stock.stock_id} value={stock.stock_id} disabled={!stock.vin || /sold|delivered|withdrawn/i.test(stock.status)}>{stock.stock_id} · {stock.vin || 'VIN pending — choose TBA'} · {stock.model} {stock.variant} · {stock.colour} · {stock.status}</option>)}
    </select></label>
    <div className="flex items-center justify-between gap-3 text-xs"><button type="button" disabled={loading || page <= 1} onClick={() => setPage(page - 1)} className="rounded border px-2 py-1 disabled:opacity-40">Previous inventory page</button><span>Page {page} of {pages}</span><button type="button" disabled={loading || page >= pages} onClick={() => setPage(page + 1)} className="rounded border px-2 py-1 disabled:opacity-40">Next inventory page</button></div>
    {!loading && !rows.length && !error && <p className="text-xs text-slate-500">No matching inventory. Refine the search or choose TBA.</p>}
    <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={value.tba} onChange={event => onChange({ stockId: '', vin: '', tba: event.target.checked })}/>TBA · VIN to be advised</label>
    <p className="text-xs text-slate-600">Selected VIN: <strong>{value.tba ? 'TBA' : value.vin || 'None selected'}</strong></p>
  </fieldset>;
}
