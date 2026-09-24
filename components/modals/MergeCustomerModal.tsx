'use client';

import React, { useState } from 'react';
import { X, GitMerge, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { Customer } from '@/lib/types';

interface MergeCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomer?: Customer | null;
}

export function MergeCustomerModal({
  isOpen,
  onClose,
  preselectedCustomer,
}: MergeCustomerModalProps) {
  const { customers, mergeCustomers } = useCrm();

  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState(preselectedCustomer?.customer_id || customers[0]?.customer_id || '');

  if (!isOpen) return null;

  const sourceCustomer = customers.find((c) => c.customer_id === sourceId);
  const targetCustomer = customers.find((c) => c.customer_id === targetId);

  const handleMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || sourceId === targetId) {
      alert('Please select two distinct customer records to merge.');
      return;
    }

    mergeCustomers(sourceId, targetId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-mono">
                Controlled Merge Tool · §5.1
              </span>
              <h3 className="text-lg font-bold text-slate-900">Merge Duplicate Profiles</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Merge Form */}
        <form onSubmit={handleMerge} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
              Duplicate Record (To be absorbed & closed) *
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            >
              <option value="">-- Choose Duplicate Record --</option>
              {customers
                .filter((c) => c.customer_id !== targetId)
                .map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name} ({c.phone}) - {c.site} [{c.customer_id}]
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-center text-slate-400">
            <ArrowRight className="w-5 h-5 rotate-90" />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
              Primary Canonical Record (System of Record) *
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            >
              {customers
                .filter((c) => c.customer_id !== sourceId)
                .map((c) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name} ({c.phone}) - {c.site} [{c.customer_id}]
                  </option>
                ))}
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Immutable Audit Log Trace:</strong> All timeline events, open opportunities, and notes from{' '}
              {sourceCustomer?.name || 'the duplicate'} will be repointed to {targetCustomer?.name || 'the primary'}. The duplicate record will be soft-deleted with full compliance history preserved.
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!sourceId || !targetId || sourceId === targetId}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md font-mono uppercase tracking-wider disabled:opacity-40"
            >
              Execute Controlled Merge
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
