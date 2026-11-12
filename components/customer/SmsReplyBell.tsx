'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { smsReplyApi } from '@/lib/api';

export type SmsReplyNotice = { id: string; sender_name: string; preview: string; phone: string; site_name: string; sent_at: string; read: boolean };
export type SmsReplyPage = { items: SmsReplyNotice[]; unread_count: number; has_more: boolean; next_offset: number };
export type SmsReplyThread = { recipient: { phone: string; site: string; client_id?: string; name: string }; messages: { id: string; body: string; direction: string; sent_at: string; status?: string }[] };
const empty: SmsReplyPage = { items: [], unread_count: 0, has_more: false, next_offset: 0 };

export function SmsReplyBell({ scope = '', extra, extraCount = 0 }: { scope?: string; extra?: React.ReactNode; extraCount?: number }) {
  const [data, setData] = useState<SmsReplyPage>(empty);
  const [open, setOpen] = useState(false);
  const [all, setAll] = useState(false);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<SmsReplyNotice | null>(null);
  const [thread, setThread] = useState<SmsReplyThread | null>(null);
  const [threadError, setThreadError] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const reload = useCallback(() => smsReplyApi.list(scope, all, offset), [scope, all, offset]);
  useEffect(() => { setOffset(0); setSelected(null); setOpen(false); setData(empty); }, [scope]);
  useEffect(() => {
    let active = true, pending = false;
    const refresh = async () => {
      if (pending || document.visibilityState !== 'visible') return; pending = true;
      try { const page = await reload(); if (active) { setData(page); setError(''); } }
      catch (error) { if (active) setError(error instanceof Error ? error.message : 'SMS notifications unavailable.'); }
      finally { pending = false; }
    };
    void refresh(); const timer = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [reload]);
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); setSelected(null); } };
    document.addEventListener('mousedown', outside); document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
  }, []);
  useEffect(() => {
    if (!selected) return;
    let active = true, pending = false;
    let lastRead = '';
    setThread(null); setBody(''); setThreadError('');
    const refresh = async () => {
      if (pending || document.visibilityState !== 'visible') return; pending = true;
      try {
        const response = await smsReplyApi.conversation(selected.id);
        if (!active) return;
        setThread(response); setThreadError('');
        const seen = response.messages.filter(m => m.direction === 'inbound').map(m => m.id);
        const signature = JSON.stringify(seen);
        if (signature !== lastRead) { await smsReplyApi.read(selected.id, seen); lastRead = signature; }
        const page = await reload(); if (active) setData(page);
      } catch (error) { if (active) setThreadError(error instanceof Error ? error.message : 'Conversation unavailable.'); }
      finally { pending = false; }
    };
    void refresh(); const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [selected, reload]);
  async function reply(event: React.FormEvent) {
    event.preventDefault(); if (!thread || !selected || sending || !body.trim()) return;
    setSending(true); setThreadError('');
    try {
      await smsReplyApi.send({ ...thread.recipient, body: body.trim() }); setBody('');
      setThread(await smsReplyApi.conversation(selected.id));
    } catch (error) { setThreadError(error instanceof Error ? error.message : 'SMS was not sent.'); }
    finally { setSending(false); }
  }
  const count = data.unread_count + extraCount;
  return <div ref={root} className="relative shrink-0">
    <button type="button" aria-label={`Notifications${count ? ` (${count} unread or active)` : ''}`} aria-expanded={open} title="SMS reply notifications" onClick={() => setOpen(!open)} className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50">
      <Bell className="h-4 w-4"/>{count > 0 && <span data-testid="sms-unread-count" className="absolute -right-1.5 -top-1.5 min-w-4 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold text-white">{count > 99 ? '99+' : count}</span>}
    </button>
    {open && <section aria-label="SMS reply notifications" className="fixed left-3 right-3 top-16 z-[65] max-h-[75dvh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-900">SMS replies</h2><span className="text-xs text-slate-500">{data.unread_count} unread</span></div>
      <div className="mb-3 flex gap-2">{[false,true].map(value => <button key={String(value)} onClick={() => { setAll(value); setOffset(0); }} className={`rounded-lg px-3 py-1 text-xs font-semibold ${all === value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>{value ? 'All' : 'Unread'}</button>)}</div>
      {error && <p role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
      {!data.items.length && !error && <p className="py-5 text-center text-sm text-slate-500">{all ? 'No SMS replies yet.' : 'No unread SMS replies.'}</p>}
      <div className="space-y-2">{data.items.map(item => <button type="button" key={item.id} onClick={() => { setSelected(item); setOpen(false); }} className={`block w-full rounded-lg border p-3 text-left ${item.read ? 'border-slate-200 bg-white' : 'border-sky-200 bg-sky-50'}`}>
        <div className="flex items-start justify-between gap-3"><strong className="text-sm text-slate-900">{item.sender_name || item.phone}</strong>{!item.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-600"/>}</div>
        <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm text-slate-700">{item.preview}</p><p className="mt-2 text-[11px] text-slate-500">{item.site_name} · {new Date(item.sent_at).toLocaleString('en-AU')}</p><span className="mt-2 block text-xs font-semibold text-red-700">Open conversation</span>
      </button>)}</div>
      <div className="mt-3 flex justify-between gap-3">{offset > 0 && <button onClick={() => setOffset(Math.max(0,offset-20))} className="text-xs font-semibold text-slate-700">Newer replies</button>}{data.has_more && <button onClick={() => setOffset(data.next_offset)} className="ml-auto text-xs font-semibold text-slate-700">Older replies</button>}</div>
      {extra}
    </section>}
    {selected && <div className="fixed inset-0 z-[75] flex items-center justify-center bg-slate-900/60 p-3 text-left" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}><section role="dialog" aria-modal="true" aria-label="Customer SMS conversation" className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 p-4"><div><h2 className="text-base font-semibold text-slate-900">{selected.sender_name || selected.phone}</h2><p className="mt-1 text-xs text-slate-500">{selected.phone} · {selected.site_name}</p></div><button aria-label="Close SMS conversation" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500"><X className="h-5 w-5"/></button></header>
      {threadError && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{threadError}</p>}
      <div role="log" aria-label="Customer SMS messages" aria-live="polite" className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">{!thread && !threadError && <p className="text-sm text-slate-500">Loading conversation…</p>}{thread?.messages.map(message => <article key={`${message.direction}:${message.id}`} className={`max-w-[90%] rounded-xl border p-3 ${message.direction === 'inbound' ? 'border-sky-100 bg-white' : 'ml-auto border-slate-200 bg-slate-100'}`}><p className="whitespace-pre-wrap break-words text-sm text-slate-900">{message.body}</p><p className="mt-2 text-[11px] text-slate-500">{message.direction === 'inbound' ? 'Customer' : 'Team'} · {message.sent_at ? new Date(message.sent_at).toLocaleString('en-AU') : 'Time unavailable'}{message.direction === 'outbound' && message.status ? ` · ${message.status}` : ''}</p></article>)}</div>
      <form onSubmit={reply} className="shrink-0 space-y-2 border-t border-slate-200 p-4"><label htmlFor="notification-sms-reply" className="text-xs font-semibold text-slate-700">Reply by SMS</label><textarea id="notification-sms-reply" required maxLength={1600} rows={2} value={body} onChange={event => setBody(event.target.value)} disabled={!thread || sending} className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900" placeholder="Write a reply…"/><button disabled={!thread || sending || !body.trim()} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{sending ? 'Sending…' : 'Send SMS'}</button></form>
    </section></div>}
  </div>;
}
