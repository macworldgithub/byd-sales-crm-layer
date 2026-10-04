'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { Appointment } from '@/lib/types';

interface AppointmentsViewProps {
  onOpenBookDrive: () => void;
}

const LOCATION_OPTIONS = [
  'All Locations',
  'BYD Melbourne City',
  'BYD Caroline Springs',
  'BYD Nunawading',
  'BYD Fairfield',
  'Denza Melbourne',
  'Holding Yard VIC',
  'BYD Doncaster',
];

export function AppointmentsView({ onOpenBookDrive }: AppointmentsViewProps) {
  const { appointments, appointmentsPagination, fetchAppointments, selectedSite, setSelectedSite, addToast } = useCrm();

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState(() => (selectedSite !== 'All Sites' ? selectedSite : 'All Locations'));
  const [typeFilter, setTypeFilter] = useState('All');
  const [consultantFilter, setConsultantFilter] = useState('All');
  const [timeframeFilter, setTimeframeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Sync with global overall filter
  useEffect(() => {
    if (selectedSite && selectedSite !== 'All Sites') {
      setLocationFilter(selectedSite);
    }
  }, [selectedSite]);

  // Trigger backend fetch on filter / page change
  const handleFetch = useCallback(() => {
    const effectiveLoc = locationFilter !== 'All Locations' ? locationFilter : (selectedSite !== 'All Sites' ? selectedSite : undefined);
    fetchAppointments({
      page: currentPage,
      limit: pageSize,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      location: effectiveLoc,
      site: effectiveLoc,
      yard: effectiveLoc,
      type: typeFilter !== 'All' ? typeFilter : undefined,
      consultant: consultantFilter !== 'All' ? consultantFilter : undefined,
      consultantName: consultantFilter !== 'All' ? consultantFilter : undefined,
      timeframe: timeframeFilter !== 'All' ? timeframeFilter : undefined,
      q: searchFilter.trim() || undefined,
    });
  }, [currentPage, statusFilter, locationFilter, selectedSite, typeFilter, consultantFilter, timeframeFilter, searchFilter, fetchAppointments]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleFetch();
    }, 250);
    return () => clearTimeout(timer);
  }, [handleFetch]);

  const hasActiveFilters = Boolean(
    searchFilter.trim() ||
    statusFilter !== 'All' ||
    (locationFilter !== 'All Locations' && locationFilter !== selectedSite) ||
    typeFilter !== 'All' ||
    consultantFilter !== 'All' ||
    timeframeFilter !== 'All'
  );

  const clearAllFilters = () => {
    setSearchFilter('');
    setStatusFilter('All');
    setLocationFilter(selectedSite !== 'All Sites' ? selectedSite : 'All Locations');
    setTypeFilter('All');
    setConsultantFilter('All');
    setTimeframeFilter('All');
    setCurrentPage(1);
  };

  const displayAppointments = appointments;
  const totalCount = appointmentsPagination?.total ?? displayAppointments.length;
  const totalPages = Math.max(1, appointmentsPagination?.pages ?? Math.ceil(totalCount / pageSize));

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
            Synchronized with Lead Centre appointments & Virtual Yard staging bays. Coordinate test drives, showroom consults, and vehicle handovers.
          </p>
        </div>

        <button
          onClick={onOpenBookDrive}
          className="signal-button w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md uppercase tracking-wider font-mono cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Book Test Drive</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search customer, vehicle, phone..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          {/* Location / Yard Filter */}
          <select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
          >
            {LOCATION_OPTIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
          >
            <option value="All">All Types</option>
            <option value="Test Drive">Test Drive</option>
            <option value="Consultation">Showroom Consultation</option>
            <option value="Handover">Vehicle Handover</option>
            <option value="Appraisal">Trade-In Appraisal</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No Show">No Show</option>
          </select>
        </div>

        {/* Secondary Row: Timeframe, Consultant, and Clear button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={timeframeFilter}
              onChange={(e) => {
                setTimeframeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs p-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="Tomorrow">Tomorrow</option>
              <option value="This Week">This Week</option>
              <option value="Upcoming">Upcoming</option>
            </select>

            <select
              value={consultantFilter}
              onChange={(e) => {
                setConsultantFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs p-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
            >
              <option value="All">All Consultants</option>
              <option value="Alex Rivers">Alex Rivers</option>
              <option value="Sarah Chen">Sarah Chen</option>
              <option value="Marcus Vance">Marcus Vance</option>
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
            Showing <strong className="text-slate-900 font-bold">{displayAppointments.length}</strong> of{' '}
            <strong className="text-slate-900 font-bold">{totalCount}</strong> appointments
          </span>
        </div>
      </div>

      {/* Appointments List Grid */}
      {displayAppointments.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200/80">
          No matching appointments found for the selected location and criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {displayAppointments.map((appt) => (
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
                  <span className="text-slate-400">Location / Yard:</span>
                  <span className="font-medium text-slate-800 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#e60012]" />
                    {appt.site || 'BYD Melbourne'}
                  </span>
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
      )}

      {/* Pagination Controls */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="text-slate-500">
          Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalCount} items)
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1 text-slate-700 font-medium"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="px-3 py-1.5 rounded-lg bg-red-50 text-[#e60012] font-bold">
            {currentPage}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages || displayAppointments.length === 0}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 flex items-center gap-1 text-slate-700 font-medium"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
