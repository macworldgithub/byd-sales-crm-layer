'use client';

import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { authApi, setToken } from '@/lib/api';

interface LoginViewProps {
  onSuccess?: () => void;
}

export function LoginView({ onSuccess }: LoginViewProps) {
  const { setCurrentUser, setCurrentRole, setSelectedSite, addToast } = useCrm();
  const [email, setEmail] = useState('alex.rivers@bydsouthport.com.au');
  const [password, setPassword] = useState('BYD2026!Demo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customCredentials?: { email: string; password: string }) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const creds = customCredentials || { email: email.trim(), password };

    try {
      const res = await authApi.login(creds);
      if (res.success && res.data?.access_token) {
        setToken(res.data.access_token);
        if (typeof window !== 'undefined') {
          localStorage.setItem('byd_crm_auth', 'true');
        }
        const u = res.data.user || {};
        setCurrentUser({
          id: u.id || u._id || 'usr-001',
          name: u.name || 'Sales Consultant',
          email: u.email || creds.email,
          role: u.role || 'sales_consultant',
          site: u.site || 'Fairfield',
          team: u.team || 'Sales Floor',
          avatarInitials: (u.name || 'SC')
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        });
        if (u.role) setCurrentRole(u.role);
        if (u.site) setSelectedSite(u.site);
        addToast('success', 'Authenticated Successfully', `Welcome, ${u.name || 'Consultant'}.`);
        if (onSuccess) onSuccess();
      } else {
        setError(res.message || 'Invalid email or password. Please verify your credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const quickRoles = [
    { name: 'Alex Rivers', role: 'sales_consultant', email: 'alex.rivers@bydsouthport.com.au', password: 'BYD2026!Demo', label: 'Sales Consultant', site: 'Fairfield' },
    { name: 'Sarah Chen', role: 'sales_manager', email: 'sarah.chen@bydsouthport.com.au', password: 'BYD2026!Demo', label: 'Floor Manager', site: 'Fairfield' },
    { name: 'Marcus Vance', role: 'bdc', email: 'marcus.vance@bydsouthport.com.au', password: 'BYD2026!Demo', label: 'BDC Lead Controller', site: 'Melbourne City' },
    { name: 'BYD Admin', role: 'admin', email: 'admin@byd.com', password: 'BYD@Admin2024', label: 'System Admin', site: 'All Sites' },
  ];

  const handleQuickSwitch = async (r: typeof quickRoles[0]) => {
    setEmail(r.email);
    setPassword(r.password);
    await handleLogin(undefined, { email: r.email, password: r.password });
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
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              <span>Quick Role Switcher</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Verified
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {quickRoles.map((r) => (
                <button
                  key={r.email}
                  type="button"
                  onClick={() => handleQuickSwitch(r)}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-red-600/60 text-left transition-all group cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-slate-200 group-hover:text-[#e60012] truncate">
                    {r.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {r.label}
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5">
                    {r.site}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[10px] font-mono text-slate-400 space-y-1">
              <div className="text-slate-300 font-semibold flex items-center justify-between">
                <span>Verified Credentials</span>
                <span className="text-slate-500">MongoDB Bcrypt</span>
              </div>
              <div className="text-slate-400">
                Staff: <strong className="text-slate-200">BYD2026!Demo</strong> | Admin: <strong className="text-slate-200">BYD@Admin2024</strong>
              </div>
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
