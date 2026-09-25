'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Car,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  MapPin,
  Sparkles,
  Phone,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { Appointment } from '@/lib/types';

interface AppointmentsViewProps {
  onOpenBookDrive: () => void;
}

export function AppointmentsView({ onOpenBookDrive }: AppointmentsViewProps) {
  const { appointments, selectedSite, addToast } = useCrm();

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter !== 'All' && a.status !== statusFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchCustomer = a.customer_name.toLowerCase().includes(q);
      const matchVehicle = a.vehicle.toLowerCase().includes(q);
      if (!matchCustomer && !matchVehicle) return false;
    }
    return true;
  });

  return (
    <div className="view-stack">
      {/* Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#e60012]" />
            Test Drive & Showroom Operations (§5.9)
          </span>
          <h1 className="page-title mt-1">Appointments & Demo Schedules</h1>
          <p className="page-subtitle">
            Synchronized with Lead Centre appointments. Coordinate customer evaluation loops, showroom consultations, and demo vehicle staging bays.
          </p>
        </div>

        <button
          onClick={onOpenBookDrive}
          className="signal-button w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md uppercase tracking-wider font-mono"
        >
          <Plus className="w-4 h-4" />
          <span>Book Test Drive</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search customer, vehicle model..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none"
          >
            <option value="All">All Statuses ({appointments.length})</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No Show">No Show</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-400 shrink-0 text-right sm:text-left pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          {filteredAppointments.length} appointments booked
        </span>
      </div>

      {/* Appointments List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredAppointments.map((appt) => (
          <div
            key={appt.appointment_id}
            className="surface-card p-5 space-y-3 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#e60012] flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{appt.customer_name}</h4>
                  <span className="text-xs text-slate-500 font-mono">{appt.phone}</span>
                </div>
              </div>
              <span
                className={`stage-pill ${
                  appt.status === 'Completed'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : appt.status === 'Confirmed'
                    ? 'bg-red-50 text-[#e60012] border border-red-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {appt.status}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-400">Type:</span>
                <strong className="text-slate-900">{appt.type}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-400">Vehicle:</span>
                <span className="font-semibold text-slate-800">{appt.vehicle}</span>
              </div>
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-slate-400">Scheduled:</span>
                <span className="font-mono text-slate-800">
                  {new Date(appt.when).toLocaleString([], {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              {appt.loop && (
                <div className="text-slate-500 pt-1 text-[11px] border-t border-slate-200/60">
                  Route: <strong>{appt.loop}</strong>
                </div>
              )}
            </div>

            {appt.notes && (
              <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                &ldquo;{appt.notes}&rdquo;
              </p>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono text-[10px]">{appt.appointment_id}</span>
              <span className="text-slate-600">
                Consultant: <strong>{appt.consultant}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
