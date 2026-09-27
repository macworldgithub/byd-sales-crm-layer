'use client';

import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { authApi } from '@/lib/api';

interface LoginViewProps {
  onSuccess?: () => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const { setCurrentUser, setCurrentRole, setSelectedSite, addToast } = useCrm();
  const [email, setEmail] = useState('alex.rivers@bydsouthport.com.au');
  const [password, setPassword] = useState('BYD2026!Demo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.data) {
        const u = res.data.user;
        setCurrentUser({
          id: u.id || u._id || 'usr-001',
          name: u.name || 'Alex Rivers',
          email: u.email,
          role: u.role || 'sales_consultant',
          site: u.site || 'Fairfield',
          team: u.team || 'Sales Floor',
          avatarInitials: (u.name || 'AR')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        });
        if (u.role) setCurrentRole(u.role);
        if (u.site) setSelectedSite(u.site);
        addToast('success', 'Authenticated Successfully', `Welcome back, ${u.name || 'Consultant'}.`);
        if (onSuccess) onSuccess();
      } else {
        // Fallback desk session if demo password isn't set
        const deskRes = await authApi.getDeskSession();
        if (deskRes.success && deskRes.data) {
          const u = deskRes.data.user;
          setCurrentUser({
            id: u.id || 'usr-001',
            name: u.name,
            email: u.email,
            role: u.role,
            site: u.site || 'Fairfield',
            team: 'Sales Floor',
            avatarInitials: 'AR',
          });
          addToast('success', 'Desk Session Initialized', `Signed in as ${u.name}.`);
          if (onSuccess) onSuccess();
        } else {
          setError(res.message || 'Invalid credentials. Please verify your email and password.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    { name: 'Alex Rivers', role: 'sales_consultant', email: 'alex.rivers@bydsouthport.com.au', label: 'Sales Consultant', site: 'Fairfield' },
    { name: 'Sarah Chen', role: 'sales_manager', email: 'sarah.chen@bydsouthport.com.au', label: 'Floor Manager', site: 'Fairfield' },
    { name: 'Marcus Vance', role: 'bdc', email: 'marcus.vance@bydsouthport.com.au', label: 'BDC Lead Controller', site: 'Melbourne City' },
    { name: 'Elena Rostova', role: 'super_admin', email: 'elena.rostova@bydsouthport.com.au', label: 'Super Admin', site: 'All Sites' },
  ];

  const handleQuickSwitch = async (r: typeof quickRoles[0]) => {
    setEmail(r.email);
    setPassword('BYD2026!Demo');
    setLoading(true);
    try {
      const res = await authApi.getDeskSession();
      if (res.success) {
        setCurrentUser({
          id: `usr-${r.role}`,
          name: r.name,
          email: r.email,
          role: r.role as any,
          site: r.site as any,
          team: 'Sales Operations',
          avatarInitials: r.name.split(' ').map((n) => n[0]).join(''),
        });
        setCurrentRole(r.role as any);
        setSelectedSite(r.site as any);
        addToast('success', 'Role Profile Loaded', `Active as ${r.name} (${r.label})`);
        if (onSuccess) onSuccess();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#e60012]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/50 text-[#e60012] text-xs font-mono font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#e60012] animate-pulse" />
            BYD Harmony Sales Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">
            BYD SALES CRM
          </h1>
          <p className="text-xs text-slate-400">
            One Customer Identity · Unified Timeline · Delivery Centre Link
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/60 text-red-300 text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="consultant@byd.com.au"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:border-[#e60012] focus:ring-1 focus:ring-[#e60012] outline-none font-mono transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-800 bg-slate-950 text-white focus:border-[#e60012] focus:ring-1 focus:ring-[#e60012] outline-none font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#e60012] text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-red-700 shadow-lg shadow-red-950/50 transition-all disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Sales Desk'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Desk Role Switcher */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider block text-center">
              Quick Role Switcher (Pre-Configured Desk Profiles)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {quickRoles.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleQuickSwitch(r)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 text-left transition-all group"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-[#e60012] truncate">
                    {r.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">
                    {r.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-[11px] font-mono text-slate-500 text-center">
          Security: JWT Bearer Tokens · ACMA Spam Compliant · Privacy Act APP 12/13
        </p>
      </div>
    </div>
  );
}
