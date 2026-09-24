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
}

export function Sidebar({ activeTab, setActiveTab, onOpenQuickDeal }: SidebarProps) {
  const { currentRole, allocations, opportunities, deliveryWatch } = useCrm();

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

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#171b22] text-slate-200 h-screen sticky top-0 shrink-0 border-r border-white/10 z-40">
      {/* Brand Header */}
      <div className="p-4 pb-3 border-b border-white/10">
        <div className="brand-lockup">
          <div className="brand-plate shadow-sm">
            <img
              src={ASSET_PATHS.officialBrandPng}
              alt="BYD Sales Desk"
              className="h-6 w-auto object-contain"
              onError={(e) => {
                // Graceful fallback to text if image path is altered
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
                  onClick={() => setActiveTab(item.id)}
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
                  onClick={() => setActiveTab(item.id)}
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
          onClick={onOpenQuickDeal}
          className="w-full py-2.5 px-3 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-950/40 transition-all font-mono uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>+ Register Deal</span>
        </button>
      </div>
    </aside>
  );
}
