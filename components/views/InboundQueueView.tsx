'use client';

import React, { useState, useEffect } from 'react';
import {
  Inbox,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  ExternalLink,
  ChevronRight,
  Filter,
  Layers,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { inboundQueueApi, syncApi } from '@/lib/api';

export function InboundQueueView() {
  const { selectedSite, addToast } = useCrm();
  const [loading, setLoading] = useState(false);
  const [syncData, setSyncData] = useState<{
    pendingCount: number;
    pendingDeliveries: any[];
    salesLogExceptions: any[];
  }>({
    pendingCount: 0,
    pendingDeliveries: [],
    salesLogExceptions: [],
  });
  const [activeTab, setActiveTab] = useState<'all' | 'delivery' | 'saleslog'>('all');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const res = await inboundQueueApi.getSyncPending({
        site: selectedSite !== 'All Sites' ? selectedSite : undefined,
      });
      if (res.success && res.data) {
        setSyncData(res.data);
      }
    } catch (err) {
      console.warn('loadQueue error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [selectedSite]);

  const handleRetryDelivery = async (opportunityId: string) => {
    setRetryingId(opportunityId);
    try {
      const res = await inboundQueueApi.retryDeliverySync(opportunityId);
      if (res.success) {
        addToast('success', 'Delivery Centre Synchronized', 'Client record pushed to Delivery Centre successfully.');
        await loadQueue();
      } else {
        addToast('error', 'Re-sync Failed', res.message || 'Could not push client record');
      }
    } catch (err: any) {
      addToast('error', 'Re-sync Error', err.message);
    } finally {
      setRetryingId(null);
    }
  };

  const handleResolveSalesLog = async (salesLogId: string) => {
    try {
      const res = await syncApi.resolveException(salesLogId, {
        notes: 'Manually verified and resolved via Inbound Queue desk',
      });
      if (res.success) {
        addToast('success', 'Exception Resolved', `Sales log row ${salesLogId} resolved and reconciled.`);
        await loadQueue();
      }
    } catch (err: any) {
      addToast('error', 'Resolution Failed', err.message);
    }
  };

  const handleDismissSalesLog = async (salesLogId: string) => {
    try {
      const res = await syncApi.dismissException(salesLogId, 'Dismissed by operations desk');
      if (res.success) {
        addToast('info', 'Exception Dismissed', 'Row dismissed from active review queue.');
        await loadQueue();
      }
    } catch (err: any) {
      addToast('error', 'Dismissal Failed', err.message);
    }
  };

  return (
    <div className="view-stack">
      {/* Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#e60012]" />
            Operations & Data Governance (§5.7, §5.8, §7.5)
          </span>
          <h1 className="page-title mt-1">Inbound Queue & Sync Exceptions</h1>
          <p className="page-subtitle">
            Centralized clearinghouse for delivery handover compensation retries, Sales Log reconciliation conflicts, and external connector exceptions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadQueue}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="surface-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Total Queue Pending
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {syncData.pendingCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#e60012] flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Delivery Handover Retries
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1 font-mono">
              {syncData.pendingDeliveries.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="surface-card p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Sales Log Conflicts
            </span>
            <div className="text-2xl font-black text-slate-700 mt-1 font-mono">
              {syncData.salesLogExceptions.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Items ({syncData.pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
            activeTab === 'delivery'
              ? 'bg-[#e60012] text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Delivery Sync Pending ({syncData.pendingDeliveries.length})
        </button>
        <button
          onClick={() => setActiveTab('saleslog')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
            activeTab === 'saleslog'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sales Log Exceptions ({syncData.salesLogExceptions.length})
        </button>
      </div>

      {/* Queue Items */}
      <div className="space-y-3">
        {/* Delivery Pending Items */}
        {(activeTab === 'all' || activeTab === 'delivery') &&
          syncData.pendingDeliveries.map((opp) => (
            <div
              key={opp.opportunity_id}
              className="surface-card p-4 border-l-4 border-l-amber-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:shadow-md transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                    Delivery Sync Pending
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {opp.opportunity_id}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {opp.site}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {opp.customer_name} · {opp.vehicle_descriptor || `${opp.model} ${opp.variant}`}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  VIN: {opp.vin || 'Pending'} | Consultant: {opp.owner_name} | Sale: {opp.sale_type || 'Retail'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRetryDelivery(opp.opportunity_id)}
                  disabled={retryingId === opp.opportunity_id}
                  className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm hover:bg-[#e60012] transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${retryingId === opp.opportunity_id ? 'animate-spin' : ''}`} />
                  <span>{retryingId === opp.opportunity_id ? 'Re-syncing...' : 'Retry Delivery Sync'}</span>
                </button>
              </div>
            </div>
          ))}

        {/* Sales Log Exceptions */}
        {(activeTab === 'all' || activeTab === 'saleslog') &&
          syncData.salesLogExceptions.map((entry) => (
            <div
              key={entry._id || entry.sales_log_id}
              className="surface-card p-4 border-l-4 border-l-red-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:shadow-md transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                    Sales Log Reconcile Flagged
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {entry.sales_log_id || entry.deal_number}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {entry.site || 'Fairfield'}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {entry.customer_name || 'Customer'} · {entry.vehicle || 'Vehicle'}
                </h4>
                <p className="text-xs text-slate-500 font-mono">
                  Reason: {entry.exception_reason || 'Reconcile mismatch'} | Phone: {entry.phone || entry.mobile || 'N/A'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleResolveSalesLog(entry.sales_log_id || String(entry._id))}
                  className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm hover:bg-emerald-700 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolve & Reconcile</span>
                </button>
                <button
                  onClick={() => handleDismissSalesLog(entry.sales_log_id || String(entry._id))}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-bold font-mono hover:bg-slate-50 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}

        {syncData.pendingCount === 0 && (
          <div className="surface-card p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">All Synchronization Loops Clean</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No pending delivery compensations or Sales Log reconcile exceptions detected. System is in 100% steady-state operation.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
