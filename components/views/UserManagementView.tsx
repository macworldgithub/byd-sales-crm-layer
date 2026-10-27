'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, LockKeyhole, X, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { userManagementApi, type ManagedUser, type ManagedUserInput, type UserAccessOptions } from '@/lib/api';
import { useCrm } from '@/lib/crmContext';

const PLATFORM_NAMES: Record<string, string> = { crm: 'Sales CRM', sales_floor: 'Sales Floor', lead_centre: 'Lead Centre', delivery_centre: 'Delivery Centre' };
const label = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200';
const roleValue = (role: string) => ({ admin: 'site_admin', manager: 'sales_manager', consultant: 'sales_consultant', delivery_consultant: 'delivery' }[role] || role);
export const canManageUsers = (user: { email?: string; role?: string }) => user.email?.trim().toLowerCase() === 'devs@omnisuiteai.com' && user.role === 'super_admin';

export function UserManagementView() {
  const { currentUser, selectedSite, addToast } = useCrm();
  const permitted = canManageUsers(currentUser);
  const [options, setOptions] = useState<UserAccessOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('current');
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<ManagedUserInput | null>(null);
  const [deleting, setDeleting] = useState<ManagedUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await userManagementApi.list();
      if (!response.success || !response.data) throw new Error(response.message || 'Could not load users.');
      setOptions(response.data);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load users.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (permitted) void load(); else setLoading(false); }, [permitted, load]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving) { setForm(null); setDeleting(null); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [saving]);
  if (!permitted) return <div className="card p-6"><h1 className="text-xl font-bold">User management</h1><p className="mt-2 text-slate-600">Sign in with the devs@omnisuiteai.com super admin account to manage users.</p></div>;

  const startEdit = (user: ManagedUser | null) => {
    setEditing(user); setFormError('');
    const home = options?.sites.includes(selectedSite) ? selectedSite : options?.sites[0] || '';
    setForm(user ? { name: user.name, email: user.email, role: roleValue(user.role), site: user.site, all_sites: user.all_sites,
      allowed_sites: user.allowed_sites, platform_access: user.platform_access, network_lookup: user.network_lookup, active: user.active, password: '' }
      : { name: '', email: '', role: 'sales_consultant', site: home, all_sites: false, allowed_sites: [home], platform_access: ['crm'], network_lookup: false, active: true, password: '' });
  };
  const change = <K extends keyof ManagedUserInput>(key: K, value: ManagedUserInput[K]) => setForm(old => old ? { ...old, [key]: value } : old);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (!form || saving) return;
    setSaving(true); setFormError('');
    const input = { ...form };
    if (!input.password) delete input.password;
    try {
      const response = editing ? await userManagementApi.update(editing.id, input) : await userManagementApi.create(input);
      if (!response.success) throw new Error(response.message || 'Could not save user.');
      setForm(null); addToast('success', editing ? 'User updated' : 'User created', 'Site and platform access saved across all connected platforms.');
      await load();
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Could not save user.'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!deleting || saving) return;
    setSaving(true); setFormError('');
    try {
      const response = await userManagementApi.remove(deleting.id);
      if (!response.success) throw new Error(response.message || 'Could not delete user.');
      setDeleting(null); addToast('success', 'User deleted', 'Sign-in access and existing sessions have been revoked.'); await load();
    } catch (e) { setFormError(e instanceof Error ? e.message : 'Could not delete user.'); }
    finally { setSaving(false); }
  };
  const users = options?.users.filter(user => {
    const matchesStatus = status === 'deleted' ? user.deleted : !user.deleted && (status === 'current' || (status === 'active' ? user.active : !user.active));
    return matchesStatus && `${user.name} ${user.email} ${user.role} ${user.allowed_sites.join(' ')} ${user.platform_access.map(p => PLATFORM_NAMES[p]).join(' ')}`.toLowerCase().includes(search.toLowerCase());
  }) || [];
  return <div className="view-stack space-y-5">
    <div className="page-intro"><div><span className="eyebrow">Administration</span><h1 className="page-title">Users & Access</h1><p className="page-subtitle">Create accounts and manage roles, sites, platform access, and passwords.</p></div>
      <button className="btn btn-primary flex items-center gap-2" disabled={!options || loading} onClick={() => startEdit(null)}><Plus size={16} />Create user</button></div>
    <div className="card p-4 flex flex-wrap gap-3 items-center">
      <label className="flex flex-1 min-w-48 items-center gap-2"><Search size={16} /><input aria-label="Search users" placeholder="Search name, email, site, or platform" className={inputClass} value={search} onChange={e => setSearch(e.target.value)} /></label>
      <select aria-label="Account status filter" className="rounded-xl border border-slate-300 px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}><option value="current">All current users</option><option value="active">Active users</option><option value="inactive">Disabled users</option><option value="deleted">Deleted users</option></select>
      <button className="btn btn-ghost flex gap-2 items-center" disabled={loading} onClick={() => void load()}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh</button>
    </div>
    {error && <div role="alert" className="rounded-xl bg-red-50 text-red-800 p-4">{error}</div>}
    <div className="card overflow-x-auto"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-600"><tr>{['User', 'Role', 'Sites', 'Platforms', 'Status', 'Actions'].map(text => <th key={text} className="p-4 font-semibold">{text}</th>)}</tr></thead><tbody>
      {loading ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">Loading users…</td></tr> : users.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">No matching users.</td></tr> : users.map(user => <tr key={user.id} className="border-t border-slate-100">
        <td className="p-4"><div className="font-semibold text-slate-900">{user.name}</div><div className="text-xs text-slate-500">{user.email}</div></td><td className="p-4 whitespace-nowrap">{label(user.role)}</td>
        <td className="p-4 text-xs max-w-60">{user.all_sites ? 'All sites' : user.allowed_sites.join(', ')}</td><td className="p-4"><div className="flex flex-wrap gap-1 max-w-56">{user.platform_access.map(p => <span key={p} className="rounded bg-slate-100 px-2 py-1 text-xs">{PLATFORM_NAMES[p] || p}</span>)}</div></td>
        <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs ${user.deleted ? 'bg-red-50 text-red-700' : user.active ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{user.deleted ? 'Deleted' : user.active ? 'Active' : 'Disabled'}</span></td>
        <td className="p-4">{user.protected ? <span className="inline-flex gap-1 items-center text-xs text-slate-500"><ShieldCheck size={15} />Protected owner</span> : <div className="flex gap-2"><button aria-label={`Edit ${user.email}`} className="btn btn-ghost" onClick={() => startEdit(user)}><Pencil size={15} /></button>{!user.deleted && <button aria-label={`Delete ${user.email}`} className="btn btn-ghost text-red-700" onClick={() => { setFormError(''); setDeleting(user); }}><Trash2 size={15} /></button>}</div>}</td>
      </tr>)}
    </tbody></table><div className="p-4 text-xs text-slate-500 border-t">{users.length} users</div></div>
    {form && <div className="fixed inset-0 z-[100] bg-slate-950/60 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-labelledby="user-dialog-title" className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">
      <div className="p-5 border-b flex justify-between items-center"><h2 id="user-dialog-title" className="text-lg font-bold">{editing ? 'Edit user' : 'Create user'}</h2><button aria-label="Close user editor" disabled={saving} onClick={() => setForm(null)}><X size={20} /></button></div>
      <form onSubmit={save} className="p-5 space-y-5"><div className="grid sm:grid-cols-2 gap-4">
        <label className="space-y-1 text-sm">Full name<input autoFocus required maxLength={120} className={inputClass} value={form.name} onChange={e => change('name', e.target.value)} /></label>
        <label className="space-y-1 text-sm">Email address<input type="email" required className={inputClass} value={form.email} onChange={e => change('email', e.target.value)} /></label>
        <label className="space-y-1 text-sm">Role<select className={inputClass} value={form.role} onChange={e => change('role', e.target.value)}>{options?.roles.map(role => <option key={role} value={role}>{label(role)}</option>)}</select></label>
        <label className="space-y-1 text-sm">{editing ? 'New password (optional)' : 'Password'}<input type="password" autoComplete="new-password" minLength={8} required={!editing} className={inputClass} value={form.password || ''} placeholder={editing ? 'Leave blank to keep the current password' : 'At least 8 characters'} onChange={e => change('password', e.target.value)} /></label>
      </div>
      <fieldset className="border rounded-xl p-4 space-y-3"><legend className="text-sm font-semibold px-1">Site access</legend>
        <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={form.all_sites} onChange={e => { change('all_sites', e.target.checked); if (!e.target.checked) change('network_lookup', false); }} />All sites</label>
        {!form.all_sites && <div className="grid sm:grid-cols-2 gap-2">{options?.sites.map(site => <label key={site} className="flex gap-2 items-center text-sm"><input type="checkbox" checked={form.allowed_sites.includes(site)} onChange={e => { const sites = e.target.checked ? [...form.allowed_sites, site] : form.allowed_sites.filter(s => s !== site); change('allowed_sites', sites); if (!sites.includes(form.site)) change('site', sites[0] || ''); }} />{site}</label>)}</div>}
        <label className="block text-sm space-y-1">Home site<select className={inputClass} value={form.site} onChange={e => change('site', e.target.value)}><option value="">{form.all_sites ? 'All sites' : 'Select a site'}</option>{(form.all_sites ? options?.sites || [] : form.allowed_sites).map(site => <option key={site}>{site}</option>)}</select></label>
        <label className="flex gap-2 items-center text-sm"><input type="checkbox" disabled={!form.all_sites} checked={form.network_lookup} onChange={e => change('network_lookup', e.target.checked)} />Cross-site network lookup</label>
      </fieldset>
      <fieldset className="border rounded-xl p-4"><legend className="text-sm font-semibold px-1">Platform access</legend><div className="grid sm:grid-cols-2 gap-3">{options?.platforms.map(platform => <label key={platform} className="flex gap-2 items-center text-sm"><input type="checkbox" checked={form.platform_access.includes(platform)} onChange={e => change('platform_access', e.target.checked ? [...form.platform_access, platform] : form.platform_access.filter(p => p !== platform))} />{PLATFORM_NAMES[platform]}</label>)}</div></fieldset>
      <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={form.active} onChange={e => change('active', e.target.checked)} />Account enabled</label>
      {editing?.deleted && <p className="text-sm text-amber-800">Saving this user restores the account with the access selected above.</p>}
      {formError && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{formError}</p>}
      <div className="flex justify-end gap-3 pt-2"><button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary flex gap-2 items-center" disabled={saving}><LockKeyhole size={15} />{saving ? 'Saving…' : editing ? 'Save user' : 'Create user'}</button></div></form>
    </section></div>}
    {deleting && <div className="fixed inset-0 z-[110] bg-slate-950/60 flex items-center justify-center p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="delete-user-title" className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4"><h2 id="delete-user-title" className="font-bold text-lg">Delete {deleting.name}?</h2><p className="text-sm text-slate-600">{deleting.email} will lose access to every platform and all existing sessions will end. Existing business records and audit history are retained.</p>{formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}<div className="flex justify-end gap-3"><button autoFocus className="btn btn-ghost" disabled={saving} onClick={() => setDeleting(null)}>Cancel</button><button className="btn btn-primary" disabled={saving} onClick={() => void remove()}>{saving ? 'Deleting…' : 'Delete user'}</button></div></section></div>}
  </div>;
}
