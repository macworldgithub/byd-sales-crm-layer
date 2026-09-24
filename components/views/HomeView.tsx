'use client';

import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Clock,
  Car,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Inbox,
  DollarSign,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { Opportunity, Customer } from '@/lib/types';
import { CONSULTANT_SCORES } from '@/lib/data';

interface HomeViewProps {
  onNavigateTab: (tab: string) => void;
  onSelectCustomer: (customer: Customer) => void;
  onOpenQuickDeal: () => void;
  onOpenAddCustomer: () => void;
  onOpenBookDrive: () => void;
  onOpenMarkSold: (opp: Opportunity) => void;
}

export function HomeView({
  onNavigateTab,
  onSelectCustomer,
  onOpenQuickDeal,
  onOpenAddCustomer,
  onOpenBookDrive,
  onOpenMarkSold,
}: HomeViewProps) {
  const {
    currentUser,
    currentRole,
    selectedSite,
    opportunities,
    allocations,
    customers,
    appointments,
    requestMoreLeads,
  } = useCrm();

  const myScore = CONSULTANT_SCORES.find((s) => s.name === currentUser.name) || CONSULTANT_SCORES[0];

  // Urgent SLA Allocations (< 15 mins)
  const urgentAllocations = allocations.filter((a) => a.status === 'pending' || a.status === 'escalated');

  // Overdue or Today's Deals
  const urgentDeals = opportunities.filter(
    (o) => o.is_overdue || o.stage === 'New / Allocated' || o.stage === 'Negotiation'
  );

  return (
    <div className="view-stack">
      {/* Hero Welcome Banner */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#e60012]" />
            Operating Sales Desk · {selectedSite}
          </span>
          <h1 className="page-title mt-1">
            Good morning, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="page-subtitle">
            Sitting between Lead Centre and Delivery Centre — your daily command post for lead intake, customer engagement, stock holds, and written deals.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenQuickDeal}
            className="signal-button px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg uppercase tracking-wider font-mono"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Register Deal</span>
          </button>
          <button
            onClick={onOpenAddCustomer}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Add Customer</span>
          </button>
          <button
            onClick={onOpenBookDrive}
            className="px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Book Drive</span>
          </button>
        </div>
      </div>

      {/* Hero Performance Metrics Row (§5.5 & AC-6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Written Units MTD */}
        <div className="metric-card metric-red">
          <div className="flex items-center justify-between">
            <span className="metric-label">Written Units (MTD)</span>
            <div className="metric-icon text-[#e60012] bg-red-50">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="metric-value">{myScore.written_units_mtd}</span>
            <span className="text-slate-400 font-semibold text-sm">/ {myScore.target_units} Target</span>
          </div>
          <div className="metric-change text-emerald-600">
            {Math.round((myScore.written_units_mtd / myScore.target_units) * 100)}% of monthly quota
          </div>
        </div>

        {/* Metric 2: Written Gross */}
        <div className="metric-card metric-cyan">
          <div className="flex items-center justify-between">
            <span className="metric-label">Written Gross (MTD)</span>
            <div className="metric-icon text-cyan-700 bg-cyan-50">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="metric-value mt-1">
            ${myScore.written_gross_mtd.toLocaleString()}
          </div>
          <div className="metric-change text-slate-500">
            Avg Gross: ${(myScore.written_gross_mtd / myScore.written_units_mtd).toFixed(0)} / unit
          </div>
        </div>

        {/* Metric 3: Lead-to-Sale Conversion */}
        <div className="metric-card metric-green">
          <div className="flex items-center justify-between">
            <span className="metric-label">Conversion Funnel</span>
            <div className="metric-icon text-emerald-700 bg-emerald-50">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="metric-value mt-1">{myScore.conversion_rate_pct}%</div>
          <div className="metric-change text-emerald-600">
            Allocated › Appt › Written
          </div>
        </div>

        {/* Metric 4: SLA & Intake Watch */}
        <div className="metric-card metric-amber">
          <div className="flex items-center justify-between">
            <span className="metric-label">Intake & SLA Clock</span>
            <div className="metric-icon text-amber-700 bg-amber-50">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="metric-value text-amber-700">{urgentAllocations.length}</span>
            <span className="text-slate-500 font-medium text-xs">Unworked Leads</span>
          </div>
          <div className="metric-change text-slate-500">
            Avg 1st touch: {myScore.avg_first_touch_minutes} min
          </div>
        </div>
      </div>

      {/* Main Grid: Live Intake Queue + Pipeline Hotlist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Centre Intake & SLA Inbox (§5.3 & AC-4) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="surface-card">
            <div className="card-header-row">
              <div>
                <span className="text-[10px] font-bold text-[#e60012] uppercase tracking-wider font-mono">
                  Upstream Feed · Lead Centre
                </span>
                <h3 className="section-title text-xl">Allocation Inbox</h3>
              </div>
              <button
                onClick={() => onNavigateTab('inbox')}
                className="text-link"
              >
                <span>View All ({allocations.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 space-y-2.5">
              {urgentAllocations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Inbox clear! No SLA breached leads.
                  <button
                    onClick={requestMoreLeads}
                    className="block mx-auto mt-2 text-[#e60012] font-bold hover:underline"
                  >
                    Request More Leads from BDC ›
                  </button>
                </div>
              ) : (
                urgentAllocations.slice(0, 3).map((alloc) => (
                  <div
                    key={alloc.allocation_id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-sm transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-slate-900 font-bold">{alloc.prospect_name}</strong>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-100 text-[#e60012] font-mono font-bold">
                            Score: {alloc.ai_score}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          {alloc.vehicle} · Source: {alloc.source}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
                          alloc.status === 'escalated'
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {alloc.status === 'escalated' ? 'SLA Breached' : '15m SLA'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2 italic bg-white p-2 rounded-lg border border-slate-200/60">
                      &ldquo;{alloc.last_sms_summary}&rdquo;
                    </p>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {alloc.site} · Rep: {alloc.assigned_to}
                      </span>
                      <button
                        onClick={() => onNavigateTab('inbox')}
                        className="text-xs font-bold text-[#e60012] hover:underline flex items-center gap-1"
                      >
                        <span>Work Lead</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Today's Scheduled Appointments */}
          <div className="surface-card">
            <div className="card-header-row">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Floor Cadence
                </span>
                <h3 className="section-title text-xl">Today&apos;s Appointments</h3>
              </div>
              <button onClick={() => onNavigateTab('appointments')} className="text-link">
                <span>Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 space-y-2">
              {appointments.slice(0, 3).map((appt) => (
                <div
                  key={appt.appointment_id}
                  className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-[#e60012] flex items-center justify-center font-bold text-xs">
                      {appt.type === 'Test Drive' ? 'TD' : 'SV'}
                    </div>
                    <div>
                      <strong className="text-slate-900 block">{appt.customer_name}</strong>
                      <span className="text-[11px] text-slate-500">
                        {appt.vehicle} ({new Date(appt.when).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                      </span>
                    </div>
                  </div>
                  <span className="stage-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px]">
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Active Deals Requiring Attention & Negotiations */}
        <div className="lg:col-span-2 space-y-4">
          <div className="surface-card">
            <div className="card-header-row">
              <div>
                <span className="text-[10px] font-bold text-[#e60012] uppercase tracking-wider font-mono">
                  Operational Selling Middle
                </span>
                <h3 className="section-title text-xl">Deals Requiring Immediate Action</h3>
              </div>
              <button onClick={() => onNavigateTab('pipeline')} className="text-link">
                <span>View Full Pipeline ({opportunities.length})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {urgentDeals.slice(0, 4).map((opp) => (
                <div
                  key={opp.opportunity_id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{opp.customer_name}</span>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                          {opp.opportunity_id}
                        </span>
                        <span className="stage-pill bg-red-50 text-[#e60012] border border-red-200">
                          {opp.stage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Vehicle: <strong className="text-slate-800">{opp.vehicle_descriptor}</strong> · Stock:{' '}
                        <strong className="text-slate-800 font-mono">{opp.vy_stock_id || 'Factory Order'}</strong> · Rep:{' '}
                        <strong className="text-slate-800">{opp.owner_name}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-slate-900">
                        ${opp.total_deal_value.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Target Close: {opp.expected_close}
                      </span>
                    </div>
                  </div>

                  {/* Next Step Banner */}
                  <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-white border border-slate-200 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Clock
                        className={`w-3.5 h-3.5 ${
                          opp.is_overdue ? 'text-red-500 animate-pulse' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-slate-700">
                        {opp.is_overdue ? (
                          <strong className="text-red-600 uppercase font-mono mr-1">[Overdue SLA]</strong>
                        ) : null}
                        {opp.next_action_text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {opp.stage === 'Negotiation' && (
                        <button
                          onClick={() => onOpenMarkSold(opp)}
                          className="px-3 py-1.5 rounded-lg bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-[11px] shadow-sm uppercase tracking-wider font-mono flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Mark Sold</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const cust = customers.find((c) => c.customer_id === opp.customer_id);
                          if (cust) onSelectCustomer(cust);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px]"
                      >
                        Open 360 Record
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
