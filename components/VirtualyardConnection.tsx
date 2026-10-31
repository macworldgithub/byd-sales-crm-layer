'use client';

import { useEffect, useState } from 'react';
import { virtualyardApi, VirtualyardSessionStatus } from '@/lib/api';
import { useCrm } from '@/lib/crmContext';

export function VirtualyardConnection() {
  const { currentUser } = useCrm();
  const [status, setStatus] = useState<VirtualyardSessionStatus | null>(null);
  const [cookie, setCookie] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canConnect = ['site_admin', 'super_admin', 'admin'].includes(currentUser.role);
  const check = async () => {
    setBusy(true); setError('');
    const response = await virtualyardApi.session();
    if (response.success && response.data) setStatus(response.data);
    else setError(response.message || 'Could not check Virtual Yard.');
    setBusy(false);
  };
  useEffect(() => { void check(); }, []);
  const connect = async () => {
    setBusy(true); setError('');
    const response = await virtualyardApi.connect(cookie.trim());
    if (response.success && response.data) { setStatus(response.data); setCookie(''); }
    else setError(response.message || 'Could not connect this session.');
    setBusy(false);
  };
  return (
    <div className="p-4 border border-slate-200 rounded-xl space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div><h3 className="text-sm font-bold text-slate-900">Virtual Yard test-drive connection</h3>
          <p className={`text-xs mt-1 ${status?.connected ? 'text-emerald-700' : 'text-amber-700'}`}>{status ? (status.connected ? 'Connected · session kept active automatically' : 'Needs reconnecting') : 'Checking connection…'}</p>
        </div>
        <button type="button" disabled={busy} onClick={check} className="text-xs border rounded-lg px-3 py-2 disabled:opacity-50">Check</button>
      </div>
      <p className="text-xs text-slate-500">The backend checks the session every five minutes and saves replacement cookies. If Virtual Yard expires or revokes it, sign in there and reconnect here.</p>
      {canConnect ? <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700">Virtual Yard session cookie
          <input type="password" autoComplete="off" value={cookie} onChange={event => setCookie(event.target.value)} placeholder="PHPSESSID=…" className="mt-1 w-full p-2 border rounded-lg font-mono text-xs" />
        </label>
        <button type="button" disabled={busy || !cookie.trim()} onClick={connect} className="text-xs px-3 py-2 rounded-lg bg-slate-900 text-white disabled:opacity-50">{busy ? 'Checking…' : 'Connect session'}</button>
      </div> : <p className="text-xs text-slate-500">A site administrator can reconnect the Virtual Yard session.</p>}
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  );
}
