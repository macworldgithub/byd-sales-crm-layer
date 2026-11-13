'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { fetchApi } from '@/lib/api';

type Handoff = { promises: string; lead_time: string; payment_method: string; finance_provider: string; delivery_notes: string; submitted_by?: string; submitted_at?: string };
type Message = { id: string; body: string; author_name: string; team: string; created_at: string };
type Profile = { customer_id: string; client_id: string | null; handoff: Handoff | null; stage: string | null; messages: Message[]; last_delivery_message_id?: string; unread: number; has_more: boolean };
const initial: Omit<Handoff, 'submitted_by' | 'submitted_at'> = { promises: '', lead_time: '', payment_method: 'Cash', finance_provider: '', delivery_notes: '' };
const labels: Record<keyof typeof initial, string> = { promises: 'Promises made', lead_time: 'Expected lead time / delivery window', payment_method: 'Payment method', finance_provider: 'Finance / leasing provider', delivery_notes: 'Notes for Delivery' };
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900';

export function DeliveryProfile({ referenceId, opportunityId, vehicle, allowSold = true, onSold, historyOnly = false }: { referenceId: string; opportunityId?: string; vehicle?: string; allowSold?: boolean; onSold?: () => void; historyOnly?: boolean }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [olderMessages, setOlderMessages] = useState<Message[]>([]);
  const [olderHasMore, setOlderHasMore] = useState<boolean | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [selling, setSelling] = useState(false);
  const [handoff, setHandoff] = useState<Handoff>(initial);
  const [vin, setVin] = useState('');
  const [factory, setFactory] = useState(false);
  const [saleType, setSaleType] = useState('Retail');
  const path = `/customer-delivery/profiles/${encodeURIComponent(referenceId)}`;
  const activePath = useRef(path);
  const reload = useCallback(async () => {
    const result = await fetchApi<Profile>(`${path}/delivery`);
    if (!result.success || !result.data) throw new Error(result.message || 'Delivery profile unavailable.');
    return result.data;
  }, [path]);
  useEffect(() => {
    let active = true, pending = false; activePath.current = path;
    setProfile(null); setError(''); setSelling(false); setHandoff(initial); setVin(''); setMessage(''); setFactory(false); setOlderMessages([]); setOlderHasMore(null); setLoadingOlder(false);
    const refresh = async () => {
      if (pending || document.visibilityState !== 'visible') return;
      pending = true;
      try {
        const data = await reload();
        if (active) {
          setProfile(data); setError('');
          setOlderMessages(previous => previous.length ? [...new Map([...previous, ...data.messages].map(message => [message.id, message])).values()] : previous);
          if (!historyOnly && data.unread && data.last_delivery_message_id) await fetchApi(`${path}/delivery/read`, { method: 'POST', body: JSON.stringify({ last_message_id: data.last_delivery_message_id }) });
        }
      } catch (error) { if (active) setError(error instanceof Error ? error.message : 'Delivery profile unavailable.'); }
      finally { pending = false; }
    };
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [reload, path, historyOnly]);
  const messages = [...new Map([...olderMessages, ...(profile?.messages || [])].map(message => [message.id, message])).values()];
  async function loadEarlier() {
    if (loadingOlder || !messages.length) return;
    setLoadingOlder(true); setError('');
    try {
      const result = await fetchApi<Profile>(`${path}/delivery?before=${encodeURIComponent(messages[0].id)}`);
      if (activePath.current !== path) return;
      if (!result.success || !result.data) throw new Error(result.message || 'Earlier messages unavailable.');
      setOlderMessages(previous => [...new Map([...result.data!.messages, ...previous, ...messages].map(message => [message.id, message])).values()]); setOlderHasMore(result.data.has_more);
    } catch (error) { if (activePath.current === path) setError(error instanceof Error ? error.message : 'Earlier messages unavailable.'); }
    finally { if (activePath.current === path) setLoadingOlder(false); }
  }
  async function send(event: React.FormEvent) {
    event.preventDefault(); if (busy || !message.trim()) return;
    setBusy(true); setError('');
    try {
      const response = await fetchApi(`${path}/delivery/messages`, { method: 'POST', body: JSON.stringify({ body: message.trim() }) });
      if (!response.success) throw new Error(response.message || 'Message was not saved.');
      setMessage(''); setProfile(await reload());
    } catch (error) { setError(error instanceof Error ? error.message : 'Message was not saved.'); }
    finally { setBusy(false); }
  }
  async function sold(event: React.FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetchApi<{ deliverySyncSuccess: boolean }>(`${path}/sold`, { method: 'POST', body: JSON.stringify({ opportunity_id: opportunityId, vehicle_descriptor: vehicle, vin, is_factory_order: factory, sale_type: saleType, delivery_handoff: handoff }) });
      if (!response.success) throw new Error(response.message || 'The deal was not saved.');
      setProfile(await reload());
      if (response.data?.deliverySyncSuccess === false) throw new Error('The sale is recorded, but Delivery sync is pending. Contact your manager before retrying.');
      setSelling(false); onSold?.();
    } catch (error) { setError(error instanceof Error ? error.message : 'The deal was not saved.'); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4" aria-label="Delivery handoff and team chat">
    {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {!profile && !error && <p className="text-sm text-slate-500">Loading Delivery profile…</p>}
    {profile && !profile.client_id && !selling && !historyOnly && <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">Ready for Delivery?</h3>
      <p className="mt-1 text-sm text-slate-600">Mark the deal Sold to share the agreed promises, delivery window and payment details with Delivery.</p>
      {allowSold && <button type="button" onClick={() => setSelling(true)} className="mt-4 rounded-lg bg-[#e60012] px-4 py-2 text-sm font-semibold text-white">Sold · send to Delivery</button>}
    </div>}
    {selling && <form onSubmit={sold} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5" aria-label="Sold handoff form">
      <h3 className="font-semibold text-slate-900">Sold · Delivery handoff</h3>
      <p className="text-sm text-slate-600">Record what was agreed with the customer so Delivery can take over.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-sm">Vehicle VIN<input aria-label="Vehicle VIN" required={!factory} maxLength={40} value={vin} onChange={e => setVin(e.target.value)} className={inputClass}/></label>
        <label className="space-y-1 text-sm">Sale type<select value={saleType} onChange={e => setSaleType(e.target.value)} className={inputClass}>{['Retail','Lease','Novated','Fleet','Government','Rental','Cash','Demo','Other'].map(v => <option key={v}>{v}</option>)}</select></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={factory} onChange={e => setFactory(e.target.checked)}/>Factory order — VIN not yet allocated</label>
      {(Object.keys(labels) as (keyof typeof initial)[]).map(key => <label key={key} className="block space-y-1 text-sm"><span>{labels[key]}</span>
        {key === 'payment_method' ? <select className={inputClass} value={handoff[key]} onChange={e => setHandoff({ ...handoff, [key]: e.target.value })}>{['Cash','Finance','Lease','Novated lease','Other'].map(value => <option key={value}>{value}</option>)}</select>
          : <textarea className={inputClass} rows={key === 'delivery_notes' || key === 'promises' ? 3 : 2} maxLength={2000} required={key === 'promises' || key === 'lead_time' || key === 'finance_provider' && ['Finance','Lease','Novated lease'].includes(handoff.payment_method)} value={handoff[key]} onChange={e => setHandoff({ ...handoff, [key]: e.target.value })} placeholder={key === 'promises' ? 'List agreed promises, or enter None.' : undefined}/>}</label>)}
      <div className="flex gap-3"><button disabled={busy} className="rounded-lg bg-[#e60012] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Confirm Sold & send handoff'}</button><button type="button" disabled={busy} onClick={() => setSelling(false)} className="rounded-lg border px-4 py-2 text-sm">Cancel</button></div>
    </form>}
    {profile?.handoff && !historyOnly && <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-slate-900">Delivery handoff</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">{profile.stage || 'Submitted'}</span></div>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">{(Object.keys(labels) as (keyof typeof initial)[]).map(key => <div key={key}><dt className="text-xs font-semibold text-slate-500">{labels[key]}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{profile.handoff?.[key] || 'Not specified'}</dd></div>)}</dl>
      {profile.handoff.submitted_by && <p className="mt-4 text-xs text-slate-500">Shared by {profile.handoff.submitted_by}{profile.handoff.submitted_at ? ` · ${new Date(profile.handoff.submitted_at).toLocaleString('en-AU')}` : ''}</p>}
    </div>}
    {historyOnly && profile && !profile.client_id && <p className="text-sm text-slate-500">No linked Sales and Delivery conversation yet.</p>}
    {profile?.client_id && <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="font-semibold text-slate-900">{historyOnly ? 'Sales ↔ Delivery message history' : 'Sales ↔ Delivery chat'}</h3><p className="mt-1 text-xs text-slate-500">Internal team messages stay on this customer profile. They are not sent to the customer.</p>
      {(olderHasMore ?? profile.has_more) && <button type="button" disabled={loadingOlder} onClick={loadEarlier} className="mt-3 rounded-lg border px-3 py-2 text-sm disabled:opacity-50">{loadingOlder ? 'Loading…' : 'Load earlier messages'}</button>}
      <div role="log" aria-label="Sales and Delivery messages" aria-live="polite" className="my-4 max-h-80 space-y-3 overflow-y-auto">
        {!messages.length && <p className="py-5 text-center text-sm text-slate-500">No team messages yet.</p>}
        {messages.map(m => <article key={m.id} className={`rounded-lg p-3 ${m.team === 'sales' ? 'bg-slate-50' : 'bg-sky-50'}`}><div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500"><strong className="text-slate-800">{m.author_name} · {m.team === 'sales' ? 'Sales' : 'Delivery'}</strong><time dateTime={m.created_at}>{new Date(m.created_at).toLocaleString('en-AU')}</time></div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-900">{m.body}</p></article>)}
      </div>
      {!historyOnly && <form onSubmit={send} className="space-y-2"><label className="sr-only" htmlFor={`delivery-message-${referenceId}`}>Message Delivery</label><textarea id={`delivery-message-${referenceId}`} maxLength={2000} required rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder="Ask Delivery a question…" className={inputClass}/><button disabled={busy || !message.trim()} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">{busy ? 'Sending…' : 'Send to Delivery'}</button></form>}
    </div>}
  </section>;
}

export function DeliveryNotifications() {
  const [rows, setRows] = useState<{customer_id: string; name: string; unread: number}[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    let active = true, pending = false;
    const refresh = async () => { if (pending || document.visibilityState !== 'visible') return; pending = true; try {
      const response = await fetchApi<typeof rows>('/customer-delivery/delivery-notifications');
      if (active && response.success && response.data) setRows(response.data);
    } catch {} finally { pending = false; } };
    void refresh(); const timer = window.setInterval(refresh, 15000); return () => { active = false; window.clearInterval(timer); };
  }, []);
  return <>{!!rows.length && <aside aria-label="Delivery replies" className="flex flex-wrap items-center gap-3 border-b border-sky-200 bg-sky-50 px-5 py-3 text-sm text-sky-900"><strong>Delivery replies</strong>{rows.filter(r => r.customer_id).map(row => <button key={row.customer_id} onClick={() => setSelected(row.customer_id)} className="rounded-lg border border-sky-200 bg-white px-3 py-1">{row.name} · {row.unread} unread</button>)}</aside>}
    {selected && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 p-4"><div role="dialog" aria-modal="true" aria-label="Customer Delivery conversation" className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-slate-50 p-5"><div className="flex justify-between"><h2 className="font-bold">Customer Delivery conversation</h2><button onClick={() => setSelected(null)} className="rounded-lg border bg-white px-3 py-1">Close</button></div><DeliveryProfile referenceId={selected} allowSold={false}/></div></div>}
  </>;
}

export function DeliveryFinance({ referenceId }: { referenceId: string }) {
  const [data, setData] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; setData(null); setError('');
    fetchApi<Profile>(`/customer-delivery/profiles/${encodeURIComponent(referenceId)}/delivery`).then(result => {
      if (active) { if (result.success && result.data) setData(result.data); else setError(result.message || 'Payment details unavailable.'); }
    }).catch(() => { if (active) setError('Payment details unavailable.'); });
    return () => { active = false; };
  }, [referenceId]);
  if (error) return <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="mt-4 text-sm text-slate-500">Loading payment details…</p>;
  return <dl className="mt-4 grid gap-4 sm:grid-cols-2">{[['Payment method', data.handoff?.payment_method], ['Finance / leasing provider', data.handoff?.finance_provider]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 text-sm">{value || 'Not recorded'}</dd></div>)}</dl>;
}
