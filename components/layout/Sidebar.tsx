'use client';

import React from 'react';
import {
  LayoutDashboard,
  GitBranch,
  Inbox,
  Users,
  Calendar,
  Car,
  Truck,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Settings,
  Sparkles,
} from 'lucide-react';
import { ASSET_PATHS } from '@/lib/data';
import { useCrm } from '@/lib/crmContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickDeal?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  onOpenQuickDeal,
  isMobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const { currentRole, allocations, opportunities, deliveryWatch, selectedSite } = useCrm();

  const pendingAllocationsCount = allocations.filter((a) => a.status === 'pending' || a.status === 'escalated').length;
  const overdueDealsCount = opportunities.filter((o) => o.is_overdue).length;
  const deliveryWatchCount = deliveryWatch.filter((d) => d.stage !== 'Delivered').length;

  const mainNav = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    {
      id: 'pipeline',
      label: 'Deals Pipeline',
      icon: GitBranch,
      badge: overdueDealsCount > 0 ? overdueDealsCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'inbox',
      label: 'Intake Inbox',
      icon: Inbox,
      badge: pendingAllocationsCount > 0 ? pendingAllocationsCount : undefined,
      badgeColor: 'bg-[#e60012]',
    },
    { id: 'customers', label: 'Customer 360', icon: Users },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'virtual-yard', label: 'Virtual Yard', icon: Car },
    {
      id: 'deliveries',
      label: 'Delivery Watch',
      icon: Truck,
      badge: deliveryWatchCount > 0 ? deliveryWatchCount : undefined,
      badgeColor: 'bg-emerald-600',
    },
    { id: 'sales-log', label: 'Sales Log', icon: BookOpen },
  ];

  const managerNav = [
    { id: 'team', label: 'Team & Targets', icon: BarChart3 },
    { id: 'audit', label: 'Audit & ACMA', icon: ShieldCheck },
  ];

  const renderNavContent = (isMobile = false) => (
    <>
      {/* Brand Header */}
      <div className="p-4 pb-3 border-b border-white/10 flex items-center justify-between">
        <div className="brand-lockup">
          <div className="brand-plate shadow-sm">
            <img
              src={ASSET_PATHS.officialBrandPng}
              alt="BYD Sales Desk"
              className="h-6 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="mt-1.5 pl-0.5">
            <strong>BYD SALES CRM</strong>
            <span> · </span>
            <span>OmniSuiteAI</span>
          </div>
        </div>

        {isMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <span className="text-xl leading-none">✕</span>
          </button>
        )}
      </div>

      {/* Dealership Scope Badge (useful on mobile) */}
      <div className="px-4 py-2 bg-white/5 border-b border-white/5 flex items-center justify-between text-[11px] text-slate-300">
        <span className="text-slate-400">Location:</span>
        <span className="font-semibold text-white flex items-center gap-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e60012] inline-block animate-pulse" />
          {selectedSite}
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Sales Operations Workspace */}
        <div>
          <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2 font-mono">
            Operating Desk
          </p>
          <nav className="space-y-1">
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isMobile && onCloseMobile) onCloseMobile();
                  }}
                  data-active={isActive}
                  className="sidebar-link w-full text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`${item.badgeColor || 'bg-[#e60012]'} text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-5 text-center shadow-sm`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Manager & Governance Console (§5.5, §5.10) */}
        <div>
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
              Management & Controls
            </p>
            {currentRole === 'manager' || currentRole === 'super_admin' ? (
              <span className="text-[9px] font-bold text-[#e60012] bg-red-950/60 border border-red-900/60 px-1.5 py-0.2 rounded uppercase">
                Admin
              </span>
            ) : null}
          </div>
          <nav className="space-y-1">
            {managerNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (isMobile && onCloseMobile) onCloseMobile();
                  }}
                  data-active={isActive}
                  className="sidebar-link w-full text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Quick Action */}
      <div className="p-3 border-t border-white/10 bg-[#13171e]">
        <button
          onClick={() => {
            if (onOpenQuickDeal) onOpenQuickDeal();
            if (isMobile && onCloseMobile) onCloseMobile();
          }}
          className="w-full py-2.5 px-3 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition-all font-mono uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+ Register Deal</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[#171b22] text-slate-200 h-screen sticky top-0 shrink-0 border-r border-white/10 z-40">
        {renderNavContent(false)}
      </aside>

      {/* Mobile Drawer Slide-over */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[#171b22] text-slate-200 h-full flex flex-col shadow-2xl border-r border-white/10 animate-in slide-in-from-left duration-200">
            {renderNavContent(true)}
          </aside>
        </div>
      )}
    </>
  );
}
