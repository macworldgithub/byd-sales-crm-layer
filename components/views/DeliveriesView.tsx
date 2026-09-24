'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ExternalLink,
  MessageSquare,
  Search,
  Filter,
  Send,
  UserCheck,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { DeliveryHandoverWatch } from '@/lib/types';
import { PaginationControls } from '@/components/ui/PaginationControls';

export function DeliveriesView() {
  const { deliveryWatch, deliveryWatchPagination, fetchDeliveryWatch, addDeliveryHandoverNote, addToast } = useCrm();

  const [searchFilter, setSearchFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [selectedClientForNote, setSelectedClientForNote] = useState<DeliveryHandoverWatch | null>(null);
  const [noteText, setNoteText] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Debounced server-side fetch on search, stage, page, or limit change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDeliveryWatch({
        page: currentPage,
        limit: pageSize,
        q: searchFilter.trim() || undefined,
        stage: stageFilter !== 'All' ? stageFilter : undefined,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, searchFilter, stageFilter, fetchDeliveryWatch]);

  const handleFilterChange = (type: 'search' | 'stage', val: string) => {
    setCurrentPage(1);
    if (type === 'search') setSearchFilter(val);
    if (type === 'stage') setStageFilter(val);
  };

  const handleSendNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForNote || !noteText.trim()) return;
    addDeliveryHandoverNote(selectedClientForNote.client_id, noteText.trim());
    setNoteText('');
    setSelectedClientForNote(null);
  };

  return (
    <div className="view-stack">
      {/* Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Downstream Handshake · Delivery Centre Watcher (§5.8 & AC-9)
          </span>
          <h1 className="page-title mt-1">Delivery & Handover Operations</h1>
          <p className="page-subtitle">
            Read-only projection of the post-sale handover pipeline from Delivery Centre ({deliveryWatchPagination?.total ?? 109} active clients). Track PDI progress, paperwork verification, delivery date slots, and transmit handover notes.
          </p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search customer, vehicle, VIN..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => handleFilterChange('stage', e.target.value)}
            className="text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none"
          >
            <option value="All">All Delivery Stages</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Pre-Delivery Inspection">Pre-Delivery Inspection (PDI)</option>
            <option value="In Transit">In Transit</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-500">
          Showing <strong className="text-slate-900 font-bold">{deliveryWatch.length}</strong> of{' '}
          <strong className="text-slate-900 font-bold">{deliveryWatchPagination?.total ?? deliveryWatch.length}</strong> clients in handover
        </span>
      </div>

      {/* Handover Cards */}
      <div className="space-y-4">
        {deliveryWatch.map((client) => (
          <div
            key={client.client_id}
            className="surface-card p-5 space-y-4 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="text-base font-bold text-slate-900">{client.customer_name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                    {client.client_id}
                  </span>
                  <span className="stage-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {client.stage}
                  </span>
                  {client.alert && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-[#e60012] flex items-center gap-1 font-mono">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{client.alert}</span>
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 mt-1 flex items-center gap-3">
                  <span className="font-semibold text-slate-900">{client.vehicle}</span>
                  <span>·</span>
                  <span className="font-mono text-slate-500">VIN: {client.vin}</span>
                  <span>·</span>
                  <span className="font-mono text-slate-500">Rego: {client.rego}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  Target Handover Date
                </span>
                <strong className="text-sm font-bold text-slate-900">{client.delivery_date}</strong>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Specialist: <strong className="text-slate-800">{client.handover_specialist}</strong>
                </span>
              </div>
            </div>

            {/* Handover Stage Progress Bar (§5.8) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="text-[10px] font-bold uppercase text-slate-400 font-mono flex items-center justify-between">
                <span>Handover Progression</span>
                <span>Docs Status: {client.docs_completeness}</span>
              </div>
              <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-bold">
                {['Scheduled', 'Pre-Delivery Inspection', 'In Transit', 'Ready for Pickup', 'Delivered'].map((step, idx) => {
                  const stages = ['Scheduled', 'Pre-Delivery Inspection', 'In Transit', 'Ready for Pickup', 'Delivered'];
                  const stepIndex = stages.indexOf(client.stage);
                  const isCurrent = client.stage === step;
                  const isPast = stepIndex > idx;

                  return (
                    <div
                      key={step}
                      className={`p-2 rounded-lg border transition-all ${
                        isCurrent
                          ? 'bg-[#171b22] text-white border-[#171b22] shadow-sm'
                          : isPast
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-white text-slate-400 border-slate-200'
                      }`}
                    >
                      <div className="truncate">{step}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="text-slate-500 flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span className="italic truncate max-w-md">&quot;{client.last_comment}&quot;</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedClientForNote(client)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3 h-3 text-slate-500" />
                  <span>Transmit Handover Note</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        pagination={deliveryWatchPagination}
        currentPage={currentPage}
        totalItems={deliveryWatchPagination?.total ?? deliveryWatch.length}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50]}
        itemLabel="clients"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
      />

      {/* Transmit Note Modal */}
      {selectedClientForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Transmit Handover Note to Delivery Centre
            </h3>
            <p className="text-xs text-slate-500">
              Notes appear directly on the Delivery Centre client record for {selectedClientForNote.customer_name}.
            </p>
            <form onSubmit={handleSendNote} className="space-y-4">
              <textarea
                rows={3}
                required
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Customer requested rubber all-weather mats be fitted in boot prior to pickup..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClientForNote(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs font-mono uppercase"
                >
                  Transmit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
