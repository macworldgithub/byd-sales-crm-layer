'use client';

import React, { useState } from 'react';
import {
  LayoutGrid,
  List,
  Filter,
  Search,
  Plus,
  Car,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  ArrowRight,
  MoreVertical,
  DollarSign,
  Tag,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { Opportunity, OpportunityStage, Customer, SaleType } from '@/lib/types';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { useBrowse, useBrowseQuery } from '@/lib/useBrowse';
import { customerApi, opportunityApi } from '@/lib/api';
import { BrowseSelect, BrowseState, browseInput } from '@/components/ui/BrowseControls';

interface PipelineViewProps {
  onSelectCustomer: (customer: Customer) => void;
  onOpenQuickDeal: () => void;
  onOpenMarkSold: (opp: Opportunity) => void;
}

export function PipelineView({
  onSelectCustomer,
  onOpenQuickDeal,
  onOpenMarkSold,
}: PipelineViewProps) {
  const { opportunities: changedOpportunities, customers, selectedSite, setSelectedSite, addToast } = useCrm();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const query = useBrowseQuery({ q: '', stage: '', model: '', owner: '', sale_type: '', dealYard: '' }, selectedSite);
  const result = useBrowse<Opportunity>('opportunities', { ...query.filters, browse: true, site: selectedSite, page: query.page, limit: query.limit });
  const opportunities = result.data;
  const filteredDeals = opportunities;
  const [saving, setSaving] = useState(false);
  React.useEffect(() => { result.reload(); }, [changedOpportunities]);
  const openCustomer = async (deal: Opportunity) => {
    const cached = customers.find(customer => customer.customer_id === deal.customer_id);
    if (cached) { onSelectCustomer(cached); return; }
    const response = await customerApi.getCustomer(deal.customer_id);
    if (response.success && response.data) onSelectCustomer(response.data);
    else addToast('error', 'Customer record unavailable', response.message || 'No linked customer was found.');
  };

  const STAGES = [...new Set<OpportunityStage>([
    'New / Allocated',
    'Working',
    'Appointment',
    'Negotiation',
    'Written / Sold',
    'In Delivery',
    'Delivered / Won',
    'Lost / Parked',
    ...(result.meta?.filters?.stages || []) as OpportunityStage[],
  ])];

  const totalPipelineValue = result.meta?.totalValue || 0;
  const handleStageChange = async (opp: Opportunity, newStage: OpportunityStage) => {
    if (newStage === 'Written / Sold') { onOpenMarkSold(opp); return; }
    let reason: string | undefined;
    if (newStage === 'Lost / Parked') {
      reason = window.prompt('Reason for parking this deal (Price, Stock Unavailable, Chose Competitor, Finance Declined, Opted Out, Other):')?.trim();
      if (!reason) return;
    }
    setSaving(true);
    const response = await opportunityApi.updateOpportunity(opp.opportunity_id, { stage: newStage, loss_reason: reason } as any);
    setSaving(false);
    if (response.success) result.reload();
    else addToast('error', 'Stage change failed', response.message || 'Please try again.');
  };

  return (
    <div className="view-stack">
      {/* Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#e60012]" />
            Selling Middle · Dual Pipeline View (§8.1)
          </span>
          <h1 className="page-title mt-1">Opportunity & Deal Management</h1>
          <p className="page-subtitle">
            Track active buying motions from lead allocation to contract written. List and board views optimized for showroom and yard execution.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Board / List Switcher */}
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm flex-1 sm:flex-initial justify-center">
            <button
              onClick={() => setViewMode('board')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'board'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                viewMode === 'list'
                  ? 'bg-slate-900 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Table</span>
            </button>
          </div>

          <button
            onClick={onOpenQuickDeal}
            className="signal-button flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md uppercase tracking-wider font-mono min-w-[130px]"
          >
            <Plus className="w-4 h-4" />
            <span>Register Deal</span>
          </button>
        </div>
      </div>

      {/* Active Yard Filter Notice */}
      {selectedSite !== 'All Sites' && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/80 border border-red-200 text-xs text-red-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#e60012] animate-pulse" />
            <span>
              Deal pipeline scoped to yard / site: <strong>{selectedSite}</strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedSite('All Sites')}
            className="text-[11px] font-semibold text-[#e60012] hover:underline"
          >
            Show All Sites
          </button>
        </div>
      )}


      <div className="surface-card p-4 space-y-3">
        <label className="flex flex-col gap-1 text-xs text-slate-600">Search all matching deals<input className={browseInput} value={query.filters.q} onChange={e => query.change('q', e.target.value)} placeholder="Buyer, phone, vehicle, stock, order ID, VIN or consultant…" /></label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <BrowseSelect label="Stages" value={query.filters.stage} values={[...new Set([...STAGES, ...(result.meta?.filters?.stages || [])])]} onChange={v => query.change('stage', v)} />
          <BrowseSelect label="Models" value={query.filters.model} values={result.meta?.filters?.models || []} onChange={v => query.change('model', v)} />
          <BrowseSelect label="Consultants" value={query.filters.owner} values={result.meta?.filters?.owners || []} onChange={v => query.change('owner', v)} />
          <BrowseSelect label="Sale types" value={query.filters.sale_type} values={result.meta?.filters?.saleTypes || []} onChange={v => query.change('sale_type', v)} />
          <BrowseSelect label="Yards" value={query.filters.dealYard} values={result.meta?.filters?.yards || []} onChange={v => query.change('dealYard', v)} />
        </div>
        <div className="flex flex-wrap gap-4 items-center justify-between text-sm"><p>{result.pagination?.total || 0} matching deals · Total value <strong>${totalPipelineValue.toLocaleString()}</strong></p><div className="flex gap-3"><button onClick={query.reset} className="text-red-700 font-semibold">Clear filters</button><button onClick={result.reload} className={browseInput}>Refresh</button></div></div>
        <p className="text-xs text-slate-500">Board and list show the selected page. Counts and values cover all matching deals.</p>
      </div>
      <BrowseState loading={result.loading} error={result.error} empty={!result.data.length} retry={result.reload} />

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'board' ? (
        <div className="overflow-x-auto pb-4 -mx-1 px-1 touch-scroll overscroll-x-contain">
          <div className="flex gap-3 sm:gap-4 min-w-max">
            {STAGES.map((colStage) => {
              const stageDeals = filteredDeals.filter((d) => d.stage === colStage);
              const colValue = result.meta?.stages?.[colStage]?.value || 0;

              return (
                <div key={colStage} className="kanban-col">
                  {/* Column Header */}
                  <div className="kanban-header">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 tracking-tight">{colStage}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ${colValue.toLocaleString()}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {stageDeals.length} on page / {result.meta?.stages?.[colStage]?.count || 0} total
                    </span>
                  </div>

                  {/* Deals Cards */}
                  <div className="kanban-body">
                    {stageDeals.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400 italic">No deals on this page</div>
                    ) : (
                      stageDeals.map((deal) => (
                        <div
                          key={deal.opportunity_id}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-2.5"
                        >
                          {/* Card Title & Value */}
                          <div className="flex items-start justify-between">
                            <div>
                              <strong className="text-xs font-bold text-slate-900 block leading-snug">
                                {deal.customer_name}
                              </strong>
                              <span className="text-[11px] text-slate-500 block truncate max-w-[190px]">
                                {deal.vehicle_descriptor}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              ${deal.total_deal_value.toLocaleString()}
                            </span>
                          </div>

                          {/* Stock & Sale Type Tags */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                              {deal.sale_type}
                            </span>
                            {deal.vy_stock_id ? (
                              <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-mono font-bold">
                                {deal.vy_stock_id}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                Factory Slot
                              </span>
                            )}
                            {deal.trade_in_flag && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                                Trade-in
                              </span>
                            )}
                          </div>

                          {/* Owner & Site Meta */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>Rep: <strong className="text-slate-800">{deal.owner_name}</strong></span>
                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100">{deal.site}</span>
                          </div>

                          {/* Delivery Centre Live Stage Badge (§5.8 & AC-9) */}
                          {deal.delivery_stage && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span>Handover: {deal.delivery_stage}</span>
                            </div>
                          )}

                          {/* Next Action Cadence */}
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/60 flex items-center justify-between">
                            <span className="truncate pr-1">
                              {deal.is_overdue && <span className="text-red-600 font-bold mr-1">!</span>}
                              {deal.next_action_text}
                            </span>
                            <Clock className={`w-3 h-3 shrink-0 ${deal.is_overdue ? 'text-red-500' : 'text-slate-400'}`} />
                          </div>

                          {/* Card Footer: Stage Selector & Customer 360 Action */}
                          <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-xs">
                            <select
                              disabled={saving}
                              value={deal.stage}
                              onChange={(e) => handleStageChange(deal, e.target.value as OpportunityStage)}
                              className="text-[10px] font-bold p-1 rounded-lg border border-slate-200 bg-white outline-none cursor-pointer"
                            >
                              {STAGES.map((s) => (
                                <option key={s} value={s}>
                                  → {s}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => {
                                void openCustomer(deal);
                              }}
                              className="text-[11px] font-semibold text-[#e60012] hover:underline"
                            >
                              View 360 ›
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* LIST TABLE VIEW (§8.1) */
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Deal ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Consultant</th>
                  <th className="py-3 px-4">Vehicle Descriptor</th>
                  <th className="py-3 px-4">VY Stock / Order</th>
                  <th className="py-3 px-4">Sale Type</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Delivery Stage</th>
                  <th className="py-3 px-4">Deal Value</th>
                  <th className="py-3 px-4">Next Cadence</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredDeals.map((deal) => (
                  <tr key={deal.opportunity_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {deal.opportunity_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 block">{deal.customer_name}</strong>
                      <span className="text-[11px] text-slate-400">{deal.customer_phone}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-slate-800 font-semibold">{deal.owner_name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono uppercase">{deal.site}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      <div>{deal.vehicle_descriptor}</div>
                      <span className="text-[10px] text-slate-400">{deal.colour}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {deal.vy_stock_id ? (
                        <span className="text-purple-700 font-bold">{deal.vy_stock_id}</span>
                      ) : (
                        <span className="text-slate-400 italic">Factory Slot</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                        {deal.sale_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="stage-pill bg-red-50 text-[#e60012] border border-red-200">
                        {deal.stage}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {deal.delivery_stage ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold font-mono">
                          {deal.delivery_stage}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ${deal.total_deal_value.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {deal.is_overdue && <span className="text-red-600 font-bold mr-1">!</span>}
                      {deal.next_action_text}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {deal.stage === 'Negotiation' && (
                          <button
                            onClick={() => onOpenMarkSold(deal)}
                            className="px-2.5 py-1 rounded bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-[10px] uppercase font-mono tracking-wider shadow-sm"
                          >
                            Mark Sold
                          </button>
                        )}
                        <button
                          onClick={() => {
                            void openCustomer(deal);
                          }}
                          className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold"
                        >
                          360
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
      {!result.loading && !result.error && <PaginationControls pagination={result.pagination} currentPage={query.page} totalItems={result.pagination?.total || 0} pageSize={query.limit} pageSizeOptions={[10, 25, 50, 100]} itemLabel="deals" onPageChange={query.setPage} onPageSizeChange={query.setLimit} />}
    </div>
  );
}
