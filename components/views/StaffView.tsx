'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Building2,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  Lock,
  Globe,
  RefreshCw,
  UserCheck,
  UserCog,
  Briefcase,
  SlidersHorizontal,
  Copy,
  Check,
} from 'lucide-react';
import { staffApi, StaffMember } from '@/lib/api';
import { useCrm } from '@/lib/crmContext';

export function StaffView() {
  const { currentUser, lockedSite, addToast } = useCrm();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('All Sites');
  const [selectedRole, setSelectedRole] = useState<string>('All Roles');
  const [availableSites, setAvailableSites] = useState<string[]>([]);
  const [hasFullAccess, setHasFullAccess] = useState<boolean>(true);
  const [userSite, setUserSite] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchStaffData = async (siteOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const activeSiteParam = siteOverride !== undefined ? siteOverride : selectedSite;
      const res = await staffApi.getStaff(activeSiteParam, search);
      if (res && res.data) {
        setStaff(res.data);
        setHasFullAccess(res.userScope?.hasFullAccess ?? true);
        setUserSite(res.userScope?.userSite || lockedSite || currentUser?.site || 'All Sites');
        if (res.availableSites && res.availableSites.length > 0) {
          setAvailableSites(res.availableSites);
        }
      }
    } catch (err: any) {
      console.error('Error fetching staff directory:', err);
      setError(err.message || 'Failed to fetch staff directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, [selectedSite]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaffData();
  };

  const handleCopy = (text: string, id: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('info', 'Copied to clipboard', `${label}: ${text}`);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const filteredStaff = useMemo(() => {
    return staff.filter((m) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.role?.toLowerCase().includes(q) ||
        m.position?.toLowerCase().includes(q) ||
        m.phone?.toLowerCase().includes(q) ||
        m.site?.toLowerCase().includes(q) ||
        m.locked_site?.toLowerCase().includes(q);

      const matchesRole =
        selectedRole === 'All Roles' ||
        (selectedRole === 'Managers' &&
          ((m.role || '').toLowerCase().includes('manager') ||
            (m.position || '').toLowerCase().includes('manager') ||
            (m.role || '').toLowerCase().includes('admin'))) ||
        (selectedRole === 'Consultants' &&
          ((m.role || '').toLowerCase().includes('consultant') ||
            (m.role || '').toLowerCase().includes('agent') ||
            (m.position || '').toLowerCase().includes('consultant'))) ||
        (selectedRole === 'Operations' &&
          ((m.role || '').toLowerCase().includes('delivery') ||
            (m.role || '').toLowerCase().includes('bdc') ||
            (m.position || '').toLowerCase().includes('delivery') ||
            (m.department || '').toLowerCase().includes('operations')));

      return matchesSearch && matchesRole;
    });
  }, [staff, search, selectedRole]);

  const stats = useMemo(() => {
    const total = filteredStaff.length;
    const active = filteredStaff.filter((s) => s.active !== false).length;
    const managers = filteredStaff.filter(
      (s) =>
        (s.role || '').toLowerCase().includes('manager') ||
        (s.position || '').toLowerCase().includes('manager') ||
        (s.role || '').toLowerCase().includes('admin')
    ).length;
    const consultants = filteredStaff.filter(
      (s) =>
        (s.role || '').toLowerCase().includes('consultant') ||
        (s.role || '').toLowerCase().includes('agent') ||
        (s.position || '').toLowerCase().includes('consultant')
    ).length;
    return { total, active, managers, consultants };
  }, [filteredStaff]);

  const formatRole = (role: string) => {
    if (!role) return 'Staff Member';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getRoleBadgeStyle = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r.includes('admin') || r.includes('super')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (r.includes('manager')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (r.includes('delivery')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getInitials = (name: string) => {
    if (!name) return 'BYD';
    return name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Showroom Staff</h1>
            <span className="bg-red-50 text-[#e60012] border border-red-200 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono uppercase">
              Staff Directory
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            CRM consultants, showroom managers, and delivery specialists across dealer network
          </p>
        </div>

        <button
          onClick={() => fetchStaffData()}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Directory</span>
        </button>
      </div>

      {/* Access Scope Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          hasFullAccess ? 'bg-slate-50 border-slate-200' : 'bg-amber-50/70 border-amber-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              hasFullAccess ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {hasFullAccess ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <span>{hasFullAccess ? 'Cross-Site View · All Showrooms' : `Showroom Scoped · ${userSite}`}</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  hasFullAccess ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {hasFullAccess ? 'Enterprise Access' : 'Site Scoped'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {hasFullAccess
                ? 'Your account has network access across all dealer sites. Use the showroom selector to isolate teams.'
                : `Your account is assigned to ${userSite}. You only see team members belonging to this showroom.`}
            </p>
          </div>
        </div>

        {/* Site Filter for users with full enterprise access */}
        {hasFullAccess && availableSites.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-slate-600">Showroom:</span>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-[#e60012]"
            >
              <option value="All Sites">All Sites ({availableSites.length})</option>
              {availableSites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 leading-tight">{stats.total}</div>
            <div className="text-xs text-slate-500">Total Staff</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 leading-tight">{stats.active}</div>
            <div className="text-xs text-slate-500">Active Members</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 leading-tight">{stats.managers}</div>
            <div className="text-xs text-slate-500">Managers & Leads</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 leading-tight">{stats.consultants}</div>
            <div className="text-xs text-slate-500">Consultants</div>
          </div>
        </div>
      </div>

      {/* Toolbar & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff by name, email, phone, role, or showroom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#e60012] shadow-sm"
          />
        </form>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="bg-white border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-2 font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-[#e60012]"
          >
            <option value="All Roles">All Roles</option>
            <option value="Managers">Managers & Admin</option>
            <option value="Consultants">Sales Consultants</option>
            <option value="Operations">Operations & Delivery</option>
          </select>
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-[#e60012]" />
          <p className="text-sm font-medium">Loading showroom team directory...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-red-50 border border-red-200 rounded-xl text-red-700">
          <p className="font-semibold">{error}</p>
          <button
            onClick={() => fetchStaffData()}
            className="mt-3 px-4 py-1.5 bg-[#e60012] text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-xl shadow-sm">
          <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No staff members found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or showroom filter to find team members.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((member) => {
            const memberKey = member.id || member._id || member.email;
            const memberSite = member.locked_site || member.site || 'Melbourne CBD';
            const initials = getInitials(member.name);
            const badgeClass = getRoleBadgeStyle(member.role);

            return (
              <div
                key={memberKey}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4"
              >
                <div>
                  {/* Top user row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-900 text-white font-bold text-base flex items-center justify-center shadow-sm shrink-0 border border-slate-700">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base leading-snug">{member.name}</h3>
                          {member.active !== false && (
                            <span
                              className="w-2 h-2 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-100"
                              title="Active"
                            />
                          )}
                        </div>
                        <span
                          className={`inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badgeClass}`}
                        >
                          {formatRole(member.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Showroom location */}
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">{memberSite}</span>
                    </div>

                    {member.position && (
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{member.position}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <a
                      href={`mailto:${member.email}`}
                      className="text-slate-600 hover:text-[#e60012] truncate flex items-center gap-1.5 transition"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(member.email, `${memberKey}-email`, 'Email')}
                      className="text-slate-400 hover:text-slate-600 p-1"
                      title="Copy Email"
                    >
                      {copiedId === `${memberKey}-email` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {member.phone && (
                    <div className="flex items-center justify-between text-xs">
                      <a
                        href={`tel:${member.phone}`}
                        className="text-slate-600 hover:text-[#e60012] flex items-center gap-1.5 transition font-mono"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{member.phone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(member.phone || '', `${memberKey}-phone`, 'Phone')}
                        className="text-slate-400 hover:text-slate-600 p-1"
                        title="Copy Phone"
                      >
                        {copiedId === `${memberKey}-phone` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
