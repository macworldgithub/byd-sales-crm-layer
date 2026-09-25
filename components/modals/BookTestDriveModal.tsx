'use client';

import React, { useState } from 'react';
import { X, Calendar, Car, Clock, MapPin, Sparkles } from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { Customer } from '@/lib/types';

interface BookTestDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCustomer?: Customer | null;
}

export function BookTestDriveModal({
  isOpen,
  onClose,
  preselectedCustomer,
}: BookTestDriveModalProps) {
  const { customers, selectedSite, createAppointment } = useCrm();

  const [customerId, setCustomerId] = useState(preselectedCustomer?.customer_id || customers[0]?.customer_id || '');
  const [vehicle, setVehicle] = useState('BYD SEALION 7 Premium AWD');
  const [loop, setLoop] = useState('Fairfield Yarra Bend & Eastern Freeway Loop');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('45');
  const [notes, setNotes] = useState('Test cabin NVH, highway lane assist and acceleration.');

  if (!isOpen) return null;

  const targetCustomer = customers.find((c) => c.customer_id === customerId) || preselectedCustomer;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCustomer) return;

    createAppointment({
      customer_id: targetCustomer.customer_id,
      customer_name: targetCustomer.name,
      phone: targetCustomer.phone,
      type: 'Test Drive',
      when: `${date}T${time}:00Z`,
      duration_minutes: parseInt(duration),
      vehicle,
      loop,
      notes,
      site: targetCustomer.site,
    });

    onClose();
  };

  const routes = [
    'Fairfield Yarra Bend & Eastern Freeway Loop (45 min)',
    'Melbourne CBD Urban Stop-and-Go & NVH Evaluation (30 min)',
    'Heidelberg & Ivanhoe Hill Performance Assessment (45 min)',
    'Eastern Freeway Extended High-Speed Evaluation (60 min)',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 text-[#e60012] flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#e60012] uppercase tracking-wider font-mono">
                Fleet & Demo Drive Scheduling
              </span>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Book Test Drive Appointment</h3>
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
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
              Customer *
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

          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
              Vehicle Model *
            </label>
            <select
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            >
              <option value="BYD SEALION 7 Premium AWD">BYD SEALION 7 Premium AWD (Demo Bay 1)</option>
              <option value="BYD SEALION 7 Performance">BYD SEALION 7 Performance Dual-Motor</option>
              <option value="BYD SEAL Performance AWD">BYD SEAL Performance AWD (Demo Bay 2)</option>
              <option value="BYD ATTO 3 Extended">BYD ATTO 3 Extended Range</option>
              <option value="BYD SHARK 6 Dual-Cab PHEV">BYD SHARK 6 Dual-Cab PHEV (Commercial Demo)</option>
              <option value="BYD DOLPHIN Premium">BYD DOLPHIN Premium Extended</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
              Certified Route Loop
            </label>
            <select
              value={loop}
              onChange={(e) => setLoop(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            >
              {routes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Time
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Duration (min)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
              Evaluation Notes & Customer Focus
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

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
              Confirm & Stage Demo Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
