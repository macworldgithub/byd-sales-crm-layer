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

  const directLogins = [
    {
      name: 'BYD Nunawading',
      role: 'agent',
      email: 'nunawading@byd.com',
      password: '123456',
      label: 'Sales Desk & Handover',
      site: 'BYD Nunawading',
      badge: 'Nunawading Site',
      highlight: true,
    },
    {
      name: 'Alex Rivers',
      role: 'sales_consultant',
      email: 'alex.rivers@bydsouthport.com.au',
      password: 'BYD2026!Demo',
      label: 'Sales Consultant',
      site: 'Fairfield',
      badge: 'Fairfield',
      highlight: false,
    },
    {
      name: 'Sarah Chen',
      role: 'sales_manager',
      email: 'sarah.chen@bydsouthport.com.au',
      password: 'BYD2026!Demo',
      label: 'Floor Manager',
      site: 'Fairfield',
      badge: 'Fairfield',
      highlight: false,
    },
    {
      name: 'Marcus Vance',
      role: 'bdc',
      email: 'marcus.vance@bydsouthport.com.au',
      password: 'BYD2026!Demo',
      label: 'BDC Lead Controller',
      site: 'Melbourne City',
      badge: 'Melbourne City',
      highlight: false,
    },
    {
      name: 'System Admin',
      role: 'admin',
      email: 'admin@byd.com',
      password: 'BYD@Admin2024',
      label: 'Super Admin',
      site: 'All Sites',
      badge: 'All Sites',
      highlight: false,
    },
  ];

  const handleQuickSwitch = async (r: typeof directLogins[0]) => {
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

          {/* 1-Click Direct Sign In */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              <span>1-Click Direct Sign In</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live MongoDB Verified
              </span>
            </div>

            {/* Nunawading Highlighted 1-Click Button */}
            {directLogins.filter((d) => d.highlight).map((r) => (
              <button
                key={r.email}
                type="button"
                onClick={() => handleQuickSwitch(r)}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-red-950/70 via-slate-900 to-slate-950 border-2 border-[#e60012]/70 hover:border-[#e60012] text-left transition-all group cursor-pointer shadow-lg shadow-red-950/40 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#e60012] animate-ping inline-block" />
                    <span className="text-xs font-bold text-white group-hover:text-red-400 transition-colors font-mono">
                      {r.name}
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 font-mono border border-red-700/50">
                      1-Click Sign In
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono group-hover:text-white transition-colors">
                    {r.email} →
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-mono">
                  <span>{r.label}</span>
                  <span className="text-slate-500">Pass: 123456</span>
                </div>
              </button>
            ))}

            {/* Other Direct Dealership Logins */}
            <div className="grid grid-cols-2 gap-2">
              {directLogins.filter((d) => !d.highlight).map((r) => (
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
                  <div className="text-[9px] font-mono text-slate-500 truncate mt-0.5 flex items-center justify-between">
                    <span>{r.site}</span>
                    <span className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">Login →</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-[10px] font-mono text-slate-400 space-y-1">
              <div className="text-slate-300 font-semibold flex items-center justify-between">
                <span>Verified Credentials</span>
                <span className="text-emerald-400 font-bold">1-Click Instant Login</span>
              </div>
              <div className="text-slate-400">
                Nunawading: <strong className="text-slate-200">123456</strong> | Staff: <strong className="text-slate-200">BYD2026!Demo</strong> | Admin: <strong className="text-slate-200">BYD@Admin2024</strong>
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
