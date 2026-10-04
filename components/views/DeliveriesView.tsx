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
  Calendar,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { DeliveryHandoverWatch } from '@/lib/types';
import { PaginationControls } from '@/components/ui/PaginationControls';

export function DeliveriesView() {
  const {
    deliveryWatch,
    deliveryWatchPagination,
    fetchDeliveryWatch,
    addDeliveryHandoverNote,
    requestDeliveryDateChange,
    selectedSite,
    setSelectedSite,
    addToast,
  } = useCrm();

  const [searchFilter, setSearchFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState<string>(() => (selectedSite !== 'All Sites' ? selectedSite : 'All Locations'));
  const [consultantFilter, setConsultantFilter] = useState('All');
  const [contactStatusFilter, setContactStatusFilter] = useState('All');
  const [docsFilter, setDocsFilter] = useState('All');
  const [timeframeFilter, setTimeframeFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  const [selectedClientForNote, setSelectedClientForNote] = useState<DeliveryHandoverWatch | null>(null);
  const [noteText, setNoteText] = useState('');

  // Date Change Modal state
  const [selectedClientForDateChange, setSelectedClientForDateChange] = useState<DeliveryHandoverWatch | null>(null);
  const [requestedDate, setRequestedDate] = useState('');
  const [dateChangeReason, setDateChangeReason] = useState('Customer Schedule Preference');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const formatDeliveryDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Sync siteFilter with global selectedSite
  useEffect(() => {
    if (selectedSite && selectedSite !== 'All Sites') {
      setSiteFilter(selectedSite);
    }
  }, [selectedSite]);

  // Debounced server-side fetch on search, stage, site, consultant, docs, timeframe
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const effectiveSite = siteFilter !== 'All Locations' ? siteFilter : (selectedSite !== 'All Sites' ? selectedSite : undefined);
        await fetchDeliveryWatch({
          page: currentPage,
          limit: pageSize,
          q: searchFilter.trim() || undefined,
          stage: stageFilter !== 'All' ? stageFilter : undefined,
          site: effectiveSite,
          yard: effectiveSite,
          location: effectiveSite,
          consultant: consultantFilter !== 'All' ? consultantFilter : undefined,
          contact_status: contactStatusFilter !== 'All' ? contactStatusFilter : undefined,
          docs_completeness: docsFilter !== 'All' ? docsFilter : undefined,
          timeframe: timeframeFilter !== 'All' ? timeframeFilter : undefined,
        });
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, searchFilter, stageFilter, siteFilter, consultantFilter, contactStatusFilter, docsFilter, timeframeFilter, selectedSite, fetchDeliveryWatch]);

  const hasActiveFilters = Boolean(
    searchFilter.trim() ||
    stageFilter !== 'All' ||
    (siteFilter !== 'All Locations' && siteFilter !== selectedSite) ||
    consultantFilter !== 'All' ||
    contactStatusFilter !== 'All' ||
    docsFilter !== 'All' ||
    timeframeFilter !== 'All'
  );

  const clearAllFilters = () => {
    setSearchFilter('');
    setStageFilter('All');
    setSiteFilter(selectedSite !== 'All Sites' ? selectedSite : 'All Locations');
    setConsultantFilter('All');
    setContactStatusFilter('All');
    setDocsFilter('All');
    setTimeframeFilter('All');
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    setCurrentPage(1);
    setter(val);
  };

  const handleSendNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForNote || !noteText.trim()) return;
    addDeliveryHandoverNote(selectedClientForNote.client_id, noteText.trim());
    setNoteText('');
    setSelectedClientForNote(null);
  };

  const handleDateChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientForDateChange || !requestedDate) return;
    await requestDeliveryDateChange(
      selectedClientForDateChange.client_id,
      requestedDate,
      dateChangeReason
    );
    setSelectedClientForDateChange(null);
    setRequestedDate('');
  };

  const SITES = [
    'All Locations',
    'BYD Nunawading',
    'BYD Melbourne City',
    'BYD Fairfield',
    'BYD Caroline Springs',
    'BYD Doncaster',
    'Denza Melbourne',
    'Holding Yard VIC',
    'Nunawading',
    'Fairfield',
    'Melbourne City',
    'Caroline Springs',
  ];

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
            Read-only projection of the post-sale handover pipeline from Delivery Centre ({deliveryWatchPagination?.total ?? deliveryWatch.length} active clients). Track PDI progress, paperwork verification, delivery date slots, and transmit handover notes.
          </p>
        </div>
      </div>

      {/* Filter Row 1: Search & Site & Stage */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => handleFilterChange(setSearchFilter, e.target.value)}
              placeholder="Search buyer, vehicle, VIN, rego..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <select
            value={siteFilter}
            onChange={(e) => handleFilterChange(setSiteFilter, e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
          >
            {SITES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={stageFilter}
            onChange={(e) => handleFilterChange(setStageFilter, e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
          >
            <option value="All">All Delivery Stages</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Pre-Delivery Inspection">Pre-Delivery Inspection (PDI)</option>
            <option value="In Transit">In Transit</option>
            <option value="Ready for Pickup">Ready for Pickup</option>
            <option value="Delivered">Delivered</option>
          </select>

          <select
            value={timeframeFilter}
            onChange={(e) => handleFilterChange(setTimeframeFilter, e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
          >
            <option value="All">All Dates / Slots</option>
            <option value="Today">Delivering Today</option>
            <option value="Tomorrow">Delivering Tomorrow</option>
            <option value="This Week">Delivering This Week</option>
            <option value="Overdue">Overdue / Delayed</option>
          </select>
        </div>

        {/* Filter Row 2: Secondary refinement & action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={docsFilter}
              onChange={(e) => handleFilterChange(setDocsFilter, e.target.value)}
              className="text-xs p-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
            >
              <option value="All">All Paperwork</option>
              <option value="Complete">Docs Complete (ATR Signed)</option>
              <option value="Partial">Docs Pending / Incomplete</option>
            </select>

            <select
              value={contactStatusFilter}
              onChange={(e) => handleFilterChange(setContactStatusFilter, e.target.value)}
              className="text-xs p-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
            >
              <option value="All">All Contact Status</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Contacted">Contacted</option>
              <option value="Awaiting Reply">Awaiting Reply</option>
              <option value="Attempted">Attempted</option>
              <option value="Unreachable">Unreachable</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          <span className="font-mono text-slate-500 text-right sm:text-left">
            Showing <strong className="text-slate-900 font-bold">{deliveryWatch.length}</strong> of{' '}
            <strong className="text-slate-900 font-bold">{deliveryWatch.length === 0 ? 0 : (deliveryWatchPagination?.total ?? deliveryWatch.length)}</strong> clients
          </span>
        </div>
      </div>

      {/* Handover Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="surface-card p-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500 font-mono">Loading delivery operations pipeline...</p>
          </div>
        ) : deliveryWatch.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Delivery Watch Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No delivery or handover records match your current filters for{' '}
              <strong className="text-slate-700">{siteFilter !== 'All Locations' ? siteFilter : selectedSite}</strong>.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="mt-2 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          deliveryWatch.map((client) => (
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
                  <strong className="text-sm font-bold text-slate-900">{formatDeliveryDate(client.delivery_date)}</strong>
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
                    onClick={() => {
                      setSelectedClientForDateChange(client);
                      setRequestedDate(client.delivery_date ? client.delivery_date.split('T')[0] : '');
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Request Date Change</span>
                  </button>
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
          ))
        )}
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        pagination={deliveryWatchPagination}
        currentPage={currentPage}
        totalItems={deliveryWatch.length === 0 ? 0 : (deliveryWatchPagination?.total ?? deliveryWatch.length)}
        pageSize={pageSize}
        pageSizeOptions={[10, 20, 50]}
        itemLabel="clients"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
      />

      {/* Request Date Change Modal */}
      {selectedClientForDateChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#e60012]" />
              <span>Request Delivery Handover Reschedule</span>
            </h3>
            <p className="text-xs text-slate-500">
              Submit a formal slot reschedule request to Delivery Centre operations for{' '}
              <strong className="text-slate-900">{selectedClientForDateChange.customer_name}</strong>.
            </p>
            <form onSubmit={handleDateChangeSubmit} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Handover Date:</label>
                <input
                  type="date"
                  required
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Reschedule Reason:</label>
                <select
                  value={dateChangeReason}
                  onChange={(e) => setDateChangeReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                >
                  <option value="Customer Schedule Preference">Customer Schedule Preference</option>
                  <option value="Customer Travel / Interstate">Customer Travel / Interstate</option>
                  <option value="Finance Settlement Delay">Finance Settlement Delay</option>
                  <option value="Trade-in Vehicle Availability">Trade-in Vehicle Availability</option>
                  <option value="PDI / Accessory Fitment Request">PDI / Accessory Fitment Request</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedClientForDateChange(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs font-mono uppercase"
                >
                  Transmit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
