'use client';

import React, { useState } from 'react';
import { X, Sparkles, Car, DollarSign, Calendar, Tag } from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { SaleType, OpportunityStage } from '@/lib/types';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddDealModal({ isOpen, onClose }: AddDealModalProps) {
  const { customers, vyStock, selectedSite, addOpportunity, addToast } = useCrm();

  const [customerId, setCustomerId] = useState(customers[0]?.customer_id || '');
  const [model, setModel] = useState('SEALION 7');
  const [variant, setVariant] = useState('Premium AWD');
  const [colour, setColour] = useState('Atlantis Grey');
  const [saleType, setSaleType] = useState<SaleType>('Retail');
  const [orderType, setOrderType] = useState<'Stock' | 'Factory Order'>('Stock');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [listPrice, setListPrice] = useState('65990');
  const [discount, setDiscount] = useState('1000');
  const [extras, setExtras] = useState('0');
  const [stage, setStage] = useState<OpportunityStage>('Working');
  const [tradeInFlag, setTradeInFlag] = useState(false);
  const [tradeInMake, setTradeInMake] = useState('');
  const [tradeInValuation, setTradeInValuation] = useState('');
  const [expectedClose, setExpectedClose] = useState(
    new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lPrice = parseFloat(listPrice) || 60000;
    const dPrice = parseFloat(discount) || 0;
    const ePrice = parseFloat(extras) || 0;

    addOpportunity({
      customer_id: customerId,
      model,
      variant,
      colour,
      vehicle_descriptor: `BYD ${model} ${variant}`,
      sale_type: saleType,
      order_type: orderType,
      vy_stock_id: selectedStockId || undefined,
      list_price: lPrice,
      discount: dPrice,
      extras: ePrice,
      stage,
      trade_in_flag: tradeInFlag,
      trade_in_details: tradeInFlag
        ? {
            makeModel: tradeInMake || 'Trade-in Vehicle',
            rego: 'TRADE-IN',
            year: 2020,
            valuation: parseFloat(tradeInValuation) || 15000,
            status: 'Pending',
          }
        : undefined,
      expected_close: expectedClose,
    });

    onClose();
  };

  const models = [
    { name: 'SEALION 7', defaultPrice: '65990', variants: ['Comfort RWD', 'Premium AWD', 'Performance Dual-Motor'] },
    { name: 'SEAL', defaultPrice: '58798', variants: ['Dynamic RWD', 'Premium RWD', 'Performance AWD'] },
    { name: 'ATTO 3', defaultPrice: '48990', variants: ['Standard Range', 'Extended Range'] },
    { name: 'SHARK 6', defaultPrice: '57900', variants: ['Premium Dual-Cab 4WD'] },
    { name: 'DOLPHIN', defaultPrice: '38890', variants: ['Dynamic', 'Premium'] },
    { name: 'SEAGULL', defaultPrice: '32990', variants: ['Standard', 'Long Range'] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 text-[#e60012] flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#e60012] uppercase tracking-wider font-mono">
                Pipeline Deal Registration
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Register New Opportunity</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Customer Selection */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
              Target Customer *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            >
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.name} ({c.phone}) - {c.site}
                </option>
              ))}
            </select>
          </div>

          {/* Model & Variant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                BYD Vehicle Model *
              </label>
              <select
                value={model}
                onChange={(e) => {
                  const m = e.target.value;
                  setModel(m);
                  const matched = models.find((mod) => mod.name === m);
                  if (matched) {
                    setListPrice(matched.defaultPrice);
                    setVariant(matched.variants[0]);
                  }
                }}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                {models.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Trim Variant
              </label>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                {models.find((m) => m.name === model)?.variants.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Link or Order Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Order Type
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType('Stock')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    orderType === 'Stock'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Yard Stock
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('Factory Order')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    orderType === 'Factory Order'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Factory Order
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Virtual Yard Stock Unit
              </label>
              <select
                value={selectedStockId}
                onChange={(e) => setSelectedStockId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-mono"
              >
                <option value="">-- Unallocated Stock Pool --</option>
                {vyStock
                  .filter((s) => s.status === 'Available')
                  .map((s) => (
                    <option key={s.stock_id} value={s.stock_id}>
                      {s.stock_id} ({s.model} {s.colour})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Pricing Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                List Price ($)
              </label>
              <input
                type="number"
                value={listPrice}
                onChange={(e) => setListPrice(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none font-semibold"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Discount ($)
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Extras ($)
              </label>
              <input
                type="number"
                value={extras}
                onChange={(e) => setExtras(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          {/* Trade-in Toggle */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
              <input
                type="checkbox"
                checked={tradeInFlag}
                onChange={(e) => setTradeInFlag(e.target.checked)}
                className="rounded text-[#e60012] focus:ring-[#e60012]"
              />
              <span>Includes Trade-in Vehicle</span>
            </label>

            {tradeInFlag && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Make & Model (e.g. 2019 Mazda CX-5)"
                  value={tradeInMake}
                  onChange={(e) => setTradeInMake(e.target.value)}
                  className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                />
                <input
                  type="number"
                  placeholder="Estimated Valuation ($)"
                  value={tradeInValuation}
                  onChange={(e) => setTradeInValuation(e.target.value)}
                  className="text-xs p-2.5 rounded-lg border border-slate-200 bg-white"
                />
              </div>
            )}
          </div>

          {/* Submit Action */}
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
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs shadow-md shadow-red-600/20 font-mono uppercase tracking-wider text-center"
            >
              Register Opportunity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
