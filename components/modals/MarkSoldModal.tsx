'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  Car,
  FileCheck2,
  Truck,
  AlertTriangle,
  ArrowRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Opportunity, SaleType } from '@/lib/types';
import { useCrm } from '@/lib/crmContext';

interface MarkSoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: Opportunity | null;
}

export function MarkSoldModal({ isOpen, onClose, opportunity }: MarkSoldModalProps) {
  const { vyStock, currentUser, executeMarkSold } = useCrm();

  const [vin, setVin] = useState('');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [saleType, setSaleType] = useState<SaleType>('Retail');
  const [primarySalesperson, setPrimarySalesperson] = useState(currentUser.name);
  const [secondarySalesperson, setSecondarySalesperson] = useState('');
  const [splitPercent, setSplitPercent] = useState('100');
  const [deposit, setDeposit] = useState('');
  const [financeMethod, setFinanceMethod] = useState('Finance');
  const [promises, setPromises] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [provider, setProvider] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isFactoryOrder, setIsFactoryOrder] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize defaults when modal opens or opportunity changes
  React.useEffect(() => {
    if (opportunity) {
      setError(''); setPromises(''); setLeadTime(''); setProvider(''); setDeliveryNotes(''); setFinanceMethod('Finance');
      setSaleType(opportunity.sale_type || 'Retail');
      setPrimarySalesperson(opportunity.owner_name || currentUser.name);
      setIsFactoryOrder(opportunity.order_type === 'Factory Order');
      if (opportunity.vy_stock_id) {
        setSelectedStockId(opportunity.vy_stock_id);
        const matched = vyStock.find((s) => s.stock_id === opportunity.vy_stock_id);
        if (matched) setVin(matched.vin);
      } else {
        const available = vyStock.find(
          (s) => s.model === opportunity.model && (s.status === 'Available' || s.status === 'Held')
        );
        if (available) {
          setSelectedStockId(available.stock_id);
          setVin(available.vin);
        } else if (opportunity.order_type === 'Factory Order') {
          setVin('');
        } else {
          setVin('');
        }
      }
    }
  }, [opportunity?.opportunity_id, isOpen]);

  if (!isOpen || !opportunity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vin.trim() && !isFactoryOrder) {
      alert('Please enter a vehicle VIN or check "Factory Order Slot" (§7.5, Step 1).');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await executeMarkSold(opportunity.opportunity_id, {
        vin: vin.trim() || (isFactoryOrder ? 'FACTORY_ORDER_PENDING' : ''),
        vy_stock_id: selectedStockId || undefined,
        sale_type: saleType,
        primary_salesperson: primarySalesperson,
        secondary_salesperson: secondarySalesperson || undefined,
        deposit: parseFloat(deposit) || 0,
        finance_method: financeMethod,
        delivery_handoff: { promises, lead_time: leadTime, payment_method: financeMethod, finance_provider: provider, delivery_notes: deliveryNotes },
        is_factory_order: isFactoryOrder,
      });
      if (result.success) onClose();
      else setError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saleTypes: SaleType[] = [
    'Retail',
    'Lease',
    'Novated',
    'Fleet',
    'Government',
    'Rental',
    'Cash',
    'Demo',
    'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 text-[#e60012] flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#e60012] tracking-wider uppercase font-mono">
                Sales to Delivery
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Sold · Delivery handoff
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1">
                {opportunity.vehicle_descriptor} · {opportunity.customer_name} (${opportunity.total_deal_value.toLocaleString()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1">
          {error && <p role="alert" className="p-3 rounded-lg bg-red-50 text-red-800 text-sm">{error}</p>}
          {/* Stock & VIN Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex flex-col sm:flex-row sm:items-center justify-between gap-1 font-mono">
              <span>Vehicle Identification & Stock Unit *</span>
              <span className="text-[10px] text-slate-500 font-normal">Mandatory for Delivery & Sales Log</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] font-medium text-slate-600 block mb-1">
                  Virtual Yard Stock Picker
                </span>
                <select
                  value={selectedStockId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    setSelectedStockId(sid);
                    const matched = vyStock.find((s) => s.stock_id === sid);
                    if (matched) setVin(matched.vin);
                  }}
                  className="w-full text-xs font-medium p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none"
                >
                  <option value="">-- Choose Stock or Factory Order --</option>
                  {vyStock.map((s) => (
                    <option key={s.stock_id} value={s.stock_id}>
                      {s.stock_id} · {s.model} {s.variant} ({s.colour}) - {s.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-600 block mb-1">
                  Vehicle VIN Number *
                </span>
                <input
                  type="text"
                  required={!isFactoryOrder}
                  value={vin}
                  onChange={(e) => setVin(e.target.value)}
                  placeholder={isFactoryOrder ? 'Optional for Factory Order slot' : 'e.g. 6T1BYD779X2910488'}
                  className="w-full text-xs font-mono uppercase p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-slate-400 outline-none font-semibold text-slate-900"
                />
                <label className="flex items-center gap-2 mt-1.5 cursor-pointer text-[11px] text-slate-600 font-medium">
                  <input
                    type="checkbox"
                    checked={isFactoryOrder}
                    onChange={(e) => {
                      setIsFactoryOrder(e.target.checked);
                      if (e.target.checked && !vin) setVin('FACTORY_ORDER_PENDING');
                    }}
                    className="w-3.5 h-3.5 text-[#e60012] rounded border-slate-300"
                  />
                  <span>Factory Order Slot (VIN not yet allocated / Slotted for OEM build)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Sale Type & Finance Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Sale Type (Delivery Centre Enum) *
              </label>
              <select
                value={saleType}
                onChange={(e) => setSaleType(e.target.value as SaleType)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                {saleTypes.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Payment / Settlement Method
              </label>
              <select
                value={financeMethod}
                onChange={(e) => setFinanceMethod(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Cash">Direct Bank Transfer (EFT)</option>
                <option value="Finance">Dealer Finance (St. George / Macquarie)</option>
                <option value="Novated lease">Novated Lease (Salary Packaging)</option>
                <option value="Lease">Lease</option><option value="Other">Other</option>
              </select>
            </div>
          </div>

          <fieldset className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><legend className="px-1 text-sm font-semibold">Delivery handoff</legend><p className="text-xs text-slate-600">Share the customer's agreed promises and delivery expectations with the Delivery team.</p>
            <label className="block text-sm">Promises made<textarea required maxLength={2000} rows={2} value={promises} onChange={e => setPromises(e.target.value)} placeholder="List agreed promises, or enter None." className="mt-1 w-full rounded-lg border p-2"/></label>
            <label className="block text-sm">Expected lead time / delivery window<input required maxLength={2000} value={leadTime} onChange={e => setLeadTime(e.target.value)} className="mt-1 w-full rounded-lg border p-2"/></label>
            <label className="block text-sm">Finance / leasing provider<input required={['Finance','Lease','Novated lease'].includes(financeMethod)} maxLength={2000} value={provider} onChange={e => setProvider(e.target.value)} className="mt-1 w-full rounded-lg border p-2"/></label>
            <label className="block text-sm">Notes for Delivery<textarea maxLength={2000} rows={3} value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)} className="mt-1 w-full rounded-lg border p-2"/></label>
          </fieldset>
          {/* Deposit & Commission Attribution (§5.5) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Deposit Received ($)
              </label>
              <input
                type="number"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
                placeholder="2000"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Primary Salesperson
              </label>
              <input
                type="text"
                value={primarySalesperson}
                onChange={(e) => setPrimarySalesperson(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Secondary Split (%)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Consultant name"
                  value={secondarySalesperson}
                  onChange={(e) => setSecondarySalesperson(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none"
                />
                <input
                  type="number"
                  placeholder="%"
                  value={splitPercent}
                  onChange={(e) => setSplitPercent(e.target.value)}
                  className="w-16 text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 outline-none text-center font-bold"
                />
              </div>
            </div>
          </div>

          {/* Failure & Resiliency Mode Notice (§7.5, §9) */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Resilient Handover Compensation</strong>
              <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
                If the downstream Delivery Centre or Virtual Yard connector is temporarily degraded, the deal will be recorded locally and flagged as &ldquo;sync pending&rdquo;. Sales staff are never blocked from completing the deal on the floor.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 uppercase tracking-wider font-mono disabled:opacity-50 text-center"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Orchestrating Deal...' : 'Execute Mark Sold'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
