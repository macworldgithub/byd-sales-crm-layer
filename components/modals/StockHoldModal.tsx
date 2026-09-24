'use client';

import React, { useState } from 'react';
import { X, Car, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { VirtualYardStock } from '@/lib/types';

interface StockHoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: VirtualYardStock | null;
}

export function StockHoldModal({ isOpen, onClose, stock }: StockHoldModalProps) {
  const { opportunities, holdStock } = useCrm();
  const [selectedOppId, setSelectedOppId] = useState(opportunities[0]?.opportunity_id || '');

  if (!isOpen || !stock) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOppId) return;
    holdStock(stock.stock_id, selectedOppId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider font-mono">
                Virtual Yard · §5.6
              </span>
              <h3 className="text-lg font-bold text-slate-900">Place Stock Hold</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stock Details */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span>{stock.model} {stock.variant}</span>
              <span className="font-mono text-purple-700">{stock.stock_id}</span>
            </div>
            <div className="text-slate-500 flex items-center justify-between">
              <span>Colour: {stock.colour}</span>
              <span className="font-mono">VIN: ...{stock.vin.slice(-6)}</span>
            </div>
            <div className="text-slate-500">
              Location: <strong>{stock.location}</strong>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
              Hold Against Active Opportunity *
            </label>
            <select
              value={selectedOppId}
              onChange={(e) => setSelectedOppId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            >
              {opportunities.map((o) => (
                <option key={o.opportunity_id} value={o.opportunity_id}>
                  {o.opportunity_id} · {o.customer_name} ({o.vehicle_descriptor})
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 text-xs flex items-start gap-2">
            <Clock className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">48-Hour Complimentary Hold Window</strong>
              <p className="text-[11px] text-purple-800 leading-relaxed mt-0.5">
                The stock unit will be locked against this deal across all Harmony sites in Virtual Yard. If not converted to written deal within 48 hours, the hold will automatically lapse.
              </p>
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
              className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md font-mono uppercase tracking-wider"
            >
              Confirm 48h Hold
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
