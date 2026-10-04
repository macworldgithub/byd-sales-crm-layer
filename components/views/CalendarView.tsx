'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Car,
  Clock,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  MapPin,
  Sparkles,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  Truck,
  User,
  Filter,
  ExternalLink,
  BatteryCharging,
  Layers,
  CalendarCheck,
  CheckCircle,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { Appointment, Opportunity, DeliveryHandoverWatch, Customer, SiteLocation } from '@/lib/types';

export type CalendarEventType = 'drive' | 'followup' | 'delivery' | 'hold';

export interface CalendarUnifiedEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  subtitle: string;
  date: Date;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  endTimeStr: string; // HH:mm
  customer_id?: string;
  customer_name: string;
  phone?: string;
  email?: string;
  vehicle?: string;
  site?: SiteLocation;
  consultant?: string;
  status?: string;
  notes?: string;
  is_overdue?: boolean;
  rawSource: 'appointment' | 'opportunity' | 'delivery';
  rawObject?: any;
}

export interface CalendarViewProps {
  onOpenBookDrive?: () => void;
  onOpenQuickDeal?: () => void;
  onSelectCustomer?: (customer: Customer) => void;
}

const LOCATION_OPTIONS = [
  'All Locations',
  'Fairfield',
  'Melbourne City',
  'Doncaster',
  'Nunawading',
  'Caroline Springs',
  'BYD Melbourne City',
  'BYD Caroline Springs',
  'BYD Nunawading',
  'BYD Fairfield',
  'BYD Doncaster',
  'Denza Melbourne',
  'Holding Yard VIC',
];

const FLEET_STAGING = [
  { model: 'SEALION 7 Premium AWD', plate: 'BYD-071', battery: '96%', location: 'Bay 1 Staged' },
  { model: 'SEAL Performance AWD', plate: 'BYD-082', battery: '100%', location: 'Bay 2 Staged' },
  { model: 'ATTO 3 Extended', plate: 'BYD-044', battery: '88%', location: 'Holding Staging' },
];

export function CalendarView({
  onOpenBookDrive,
  onOpenQuickDeal,
  onSelectCustomer,
}: CalendarViewProps) {
  const {
    appointments,
    opportunities,
    deliveryWatch,
    customers,
    selectedSite,
    addToast,
  } = useCrm();

  // Navigation & View Mode
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  
  // Date Cursor (defaulting around late September 2026 where CRM dataset is situated, or current date)
  const [currentDate, setCurrentDate] = useState(() => {
    // If we have appointments, anchor to their month, otherwise current date
    const firstDate = appointments[0]?.when ? new Date(appointments[0].when) : new Date(2026, 8, 23);
    return isNaN(firstDate.getTime()) ? new Date() : firstDate;
  });

  const [selectedDayDate, setSelectedDayDate] = useState<Date>(() => new Date(2026, 8, 23));
  const [selectedEvent, setSelectedEvent] = useState<CalendarUnifiedEvent | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'drive' | 'followup' | 'delivery'>('all');
  const [locationFilter, setLocationFilter] = useState(() => (selectedSite !== 'All Sites' ? selectedSite : 'All Locations'));
  const [consultantFilter, setConsultantFilter] = useState('All');
  const [searchFilter, setSearchFilter] = useState('');
  const [timeframeFilter, setTimeframeFilter] = useState('All');

  // List view pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // 1. UNIFY APPOINTMENTS, FOLLOW-UPS & DELIVERIES INTO CANONICAL CALENDAR STREAM
  const unifiedEvents = useMemo(() => {
    const list: CalendarUnifiedEvent[] = [];

    // A. Appointments (Test Drives, Showroom Visits, Appraisals)
    appointments.forEach((appt) => {
      let d = new Date(appt.when);
      if (isNaN(d.getTime())) {
        d = new Date(2026, 8, 23, 9, 30);
      }

      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const endD = new Date(d.getTime() + (appt.duration_minutes || 45) * 60000);
      const endHours = endD.getHours().toString().padStart(2, '0');
      const endMinutes = endD.getMinutes().toString().padStart(2, '0');

      const dateStr = d.toISOString().split('T')[0];

      list.push({
        id: appt.appointment_id,
        type: appt.type === 'Handover' ? 'delivery' : 'drive',
        title: `${appt.type}: ${appt.customer_name}`,
        subtitle: `${appt.vehicle} · ${appt.loop || (appt.site || 'Fairfield')}`,
        date: d,
        dateStr,
        timeStr: `${hours}:${minutes}`,
        endTimeStr: `${endHours}:${endMinutes}`,
        customer_id: appt.customer_id,
        customer_name: appt.customer_name,
        phone: appt.phone,
        vehicle: appt.vehicle,
        site: appt.site,
        consultant: appt.consultant,
        status: appt.status,
        notes: appt.notes,
        rawSource: 'appointment',
        rawObject: appt,
      });
    });

    // B. Follow-ups (Opportunities Cadence Actions & Deadlines)
    opportunities.forEach((opp) => {
      if (!opp.next_action_at && !opp.expected_close) return;
      
      let d = new Date(opp.next_action_at || opp.expected_close);
      if (isNaN(d.getTime())) {
        d = new Date(2026, 8, 24, 10, 0);
      }

      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const endD = new Date(d.getTime() + 30 * 60000);
      const endHours = endD.getHours().toString().padStart(2, '0');
      const endMinutes = endD.getMinutes().toString().padStart(2, '0');

      const dateStr = d.toISOString().split('T')[0];

      list.push({
        id: `FU-${opp.opportunity_id}`,
        type: 'followup',
        title: `Follow-up: ${opp.customer_name}`,
        subtitle: `${opp.next_action_text || 'Cadence Touch'} · ${opp.vehicle_descriptor}`,
        date: d,
        dateStr,
        timeStr: `${hours}:${minutes}`,
        endTimeStr: `${endHours}:${endMinutes}`,
        customer_id: opp.customer_id,
        customer_name: opp.customer_name,
        phone: opp.customer_phone,
        email: opp.customer_email,
        vehicle: opp.vehicle_descriptor,
        site: opp.site,
        consultant: opp.owner_name,
        status: opp.is_overdue ? 'Overdue Cadence' : opp.stage,
        notes: opp.next_action_text,
        is_overdue: opp.is_overdue,
        rawSource: 'opportunity',
        rawObject: opp,
      });
    });

    // C. Deliveries (Delivery Centre Handover Pipeline)
    deliveryWatch.forEach((del) => {
      let d = new Date(del.delivery_date);
      if (isNaN(d.getTime())) {
        d = new Date(2026, 8, 25, 11, 0);
      } else {
        d.setHours(11, 0, 0, 0); // Default handover staging window
      }

      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      const endD = new Date(d.getTime() + 60 * 60000);
      const endHours = endD.getHours().toString().padStart(2, '0');
      const endMinutes = endD.getMinutes().toString().padStart(2, '0');

      const dateStr = d.toISOString().split('T')[0];

      list.push({
        id: `DEL-${del.client_id}`,
        type: 'delivery',
        title: `Delivery: ${del.customer_name}`,
        subtitle: `${del.vehicle} (${del.rego || 'Rego Pending'}) · ${del.stage}`,
        date: d,
        dateStr,
        timeStr: `${hours}:${minutes}`,
        endTimeStr: `${endHours}:${endMinutes}`,
        customer_name: del.customer_name,
        phone: del.phone,
        vehicle: del.vehicle,
        site: del.site || 'Fairfield',
        consultant: del.handover_specialist || del.delivery_consultant,
        status: del.stage,
        notes: del.last_comment || (del.alert ? `Alert: ${del.alert}` : undefined),
        rawSource: 'delivery',
        rawObject: del,
      });
    });

    // Sort chronologically
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [appointments, opportunities, deliveryWatch]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return unifiedEvents.filter((evt) => {
      // Category filter
      if (categoryFilter !== 'all' && evt.type !== categoryFilter) {
        return false;
      }

      // Location filter
      if (locationFilter !== 'All Locations') {
        const siteMatch = (evt.site || '').toLowerCase();
        const filterMatch = locationFilter.toLowerCase().replace('byd ', '');
        if (!siteMatch.includes(filterMatch)) return false;
      }

      // Consultant filter
      if (consultantFilter !== 'All') {
        if ((evt.consultant || '').toLowerCase() !== consultantFilter.toLowerCase()) {
          return false;
        }
      }

      // Search filter
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesName = evt.customer_name.toLowerCase().includes(q);
        const matchesVehicle = (evt.vehicle || '').toLowerCase().includes(q);
        const matchesPhone = (evt.phone || '').includes(q);
        const matchesSub = evt.subtitle.toLowerCase().includes(q);
        if (!matchesName && !matchesVehicle && !matchesPhone && !matchesSub) return false;
      }

      return true;
    });
  }, [unifiedEvents, categoryFilter, locationFilter, consultantFilter, searchFilter]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      all: unifiedEvents.length,
      drive: unifiedEvents.filter((e) => e.type === 'drive').length,
      followup: unifiedEvents.filter((e) => e.type === 'followup').length,
      delivery: unifiedEvents.filter((e) => e.type === 'delivery').length,
    };
  }, [unifiedEvents]);

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const setToday = () => {
    setCurrentDate(new Date(2026, 8, 23));
    setSelectedDayDate(new Date(2026, 8, 23));
  };

  // Build calendar matrix (days in month with padded prev/next days)
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    // Adjust to Monday start (0 is Monday, 6 is Sunday)
    const adjustedStart = (firstDayIndex + 6) % 7;

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = adjustedStart - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const dateObj = new Date(year, month - 1, d);
      days.push({
        dateObj,
        dayNum: d,
        isCurrentMonth: false,
        dateStr: dateObj.toISOString().split('T')[0],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateObj = new Date(year, month, d);
      days.push({
        dateObj,
        dayNum: d,
        isCurrentMonth: true,
        dateStr: dateObj.toISOString().split('T')[0],
      });
    }

    // Next month padding to fill complete grid of 35 or 42 cells
    const remaining = 35 - days.length > 0 ? 35 - days.length : 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dateObj = new Date(year, month + 1, d);
      days.push({
        dateObj,
        dayNum: d,
        isCurrentMonth: false,
        dateStr: dateObj.toISOString().split('T')[0],
      });
    }

    return days;
  }, [year, month]);

  // Selected Day's events
  const selectedDayStr = selectedDayDate.toISOString().split('T')[0];
  const selectedDayEvents = useMemo(() => {
    return filteredEvents.filter((e) => e.dateStr === selectedDayStr);
  }, [filteredEvents, selectedDayStr]);

  // RFC 5545 iCalendar Export (.ics download)
  const handleExportIcs = () => {
    try {
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      const toIcsTime = (d: Date) => {
        return (
          String(d.getUTCFullYear()) +
          pad(d.getUTCMonth() + 1) +
          pad(d.getUTCDate()) +
          'T' +
          pad(d.getUTCHours()) +
          pad(d.getUTCMinutes()) +
          '00Z'
        );
      };

      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//OmniSuiteAI//BYD Sales CRM Calendar//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'X-WR-CALNAME:BYD Harmony Sales Desk',
        'X-WR-TIMEZONE:Australia/Melbourne',
      ];

      filteredEvents.forEach((evt) => {
        const start = toIcsTime(evt.date);
        const end = toIcsTime(new Date(evt.date.getTime() + 45 * 60000));
        icsContent.push(
          'BEGIN:VEVENT',
          `UID:${evt.id}@crm.byd.omnisuiteai.com`,
          `DTSTAMP:${toIcsTime(new Date())}`,
          `DTSTART:${start}`,
          `DTEND:${end}`,
          `SUMMARY:[${evt.type.toUpperCase()}] ${evt.title}`,
          `DESCRIPTION:${evt.subtitle}\\n${evt.notes || ''}\\nContact: ${evt.phone || 'N/A'}`,
          `LOCATION:${evt.site || 'BYD Showroom VIC'}`,
          `STATUS:CONFIRMED`,
          'END:VEVENT'
        );
      });

      icsContent.push('END:VCALENDAR');

      const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BYD_Harmony_Calendar_${new Date().toISOString().split('T')[0]}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast(
        'success',
        'iCalendar Export Generated',
        `Exported ${filteredEvents.length} events to .ics format for Google / Outlook Calendar.`
      );
    } catch {
      alert('Unable to generate iCalendar file.');
    }
  };

  const getEventClass = (type: CalendarEventType) => {
    switch (type) {
      case 'drive':
        return 'calendar-drive';
      case 'delivery':
        return 'calendar-delivery';
      case 'followup':
        return 'calendar-followup';
      default:
        return 'calendar-hold';
    }
  };

  const handleOpenCustomer360FromEvent = (evt: CalendarUnifiedEvent) => {
    if (!onSelectCustomer) return;
    const match =
      (evt.customer_id && customers.find((c) => c.customer_id === evt.customer_id)) ||
      (evt.phone && customers.find((c) => c.phone.replace(/[^0-9]/g, '') === evt.phone?.replace(/[^0-9]/g, ''))) ||
      customers.find((c) => c.name.toLowerCase() === evt.customer_name.toLowerCase()) ||
      customers[0];

    if (match) {
      onSelectCustomer(match);
      setSelectedEvent(null);
    }
  };

  // Week View calculation (Monday to Sunday around currentDate)
  const weekDays = useMemo(() => {
    const curr = new Date(selectedDayDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(curr.setDate(diff));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push({
        dateObj: nextDay,
        name: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i],
        dateStr: nextDay.toISOString().split('T')[0],
      });
    }
    return days;
  }, [selectedDayDate]);

  // Hourly slots for Day View (08:00 to 18:00)
  const timeSlots = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  return (
    <div className="view-stack space-y-4">
      {/* ── Intro Header ── */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#e60012] animate-pulse" />
            Unified Dealership Calendar & Cadence Desk (§5.2, §5.8, §5.9)
          </span>
          <h1 className="page-title mt-1">Calendar & Schedule Hub</h1>
          <p className="page-subtitle">
            Synchronized timeline of test drives, cadence follow-ups, and Delivery Centre vehicle handovers across all Harmony sites.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* View Mode Segmented */}
          <div className="segmented">
            <button
              onClick={() => setViewMode('month')}
              className={viewMode === 'month' ? 'active' : ''}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={viewMode === 'week' ? 'active' : ''}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={viewMode === 'day' ? 'active' : ''}
            >
              Day Agenda
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'active' : ''}
            >
              List
            </button>
          </div>

          {/* Export RFC 5545 iCalendar */}
          <button
            onClick={handleExportIcs}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            title="Export .ics file for Google Calendar, Outlook & Apple Calendar"
          >
            <Download className="w-3.5 h-3.5 text-cyan-600" />
            <span className="hidden sm:inline">Export (.ics)</span>
          </button>

          {/* Book Test Drive */}
          {onOpenBookDrive && (
            <button
              onClick={onOpenBookDrive}
              className="signal-button px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md uppercase tracking-wider font-mono cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Category Quick Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
            categoryFilter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All Cadence</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setCategoryFilter('drive')}
          className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
            categoryFilter === 'drive'
              ? 'bg-cyan-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-cyan-500" />
          <span>Appointments & Drives</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyan-100 text-cyan-800 font-mono font-bold">
            {counts.drive}
          </span>
        </button>

        <button
          onClick={() => setCategoryFilter('followup')}
          className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
            categoryFilter === 'followup'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Follow-ups & Tasks</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono font-bold">
            {counts.followup}
          </span>
        </button>

        <button
          onClick={() => setCategoryFilter('delivery')}
          className={`px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition-all ${
            categoryFilter === 'delivery'
              ? 'bg-[#e60012] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-red-500" />
          <span>Deliveries & Handovers</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-[#e60012] font-mono font-bold">
            {counts.delivery}
          </span>
        </button>
      </div>

      {/* ── Search & Location Filter Toolbar ── */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search customer, vehicle, task..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
          >
            {LOCATION_OPTIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>

          <select
            value={consultantFilter}
            onChange={(e) => setConsultantFilter(e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
          >
            <option value="All">All Consultants & Specialists</option>
            <option value="Alex Rivers">Alex Rivers</option>
            <option value="Elena Rostova">Elena Rostova</option>
            <option value="Rachel Adams">Rachel Adams (Delivery)</option>
            <option value="Liam Walker">Liam Walker (Delivery)</option>
            <option value="Harrison Reed">Harrison Reed</option>
          </select>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearchFilter('');
                setLocationFilter('All Locations');
                setConsultantFilter('All');
                setCategoryFilter('all');
              }}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN CALENDAR SHELL ── */}
      <div className="calendar-shell">
        {/* Calendar Nav Toolbar */}
        <div className="calendar-toolbar">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-baseline gap-2">
              <strong className="text-sm sm:text-base font-bold text-slate-900 font-condensed tracking-wide">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
              </strong>
              <button
                onClick={setToday}
                className="text-[11px] font-bold text-[#e60012] hover:underline uppercase font-mono"
              >
                Jump to September 2026 Today
              </button>
            </div>
          </div>

          {/* Color-Coded Legend */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-slate-500 font-mono">
            <div className="legend-item">
              <i className="bg-cyan-500" />
              <span>Drive ({counts.drive})</span>
            </div>
            <div className="legend-item">
              <i className="bg-amber-500" />
              <span>Follow-up ({counts.followup})</span>
            </div>
            <div className="legend-item">
              <i className="bg-[#e60012]" />
              <span>Delivery ({counts.delivery})</span>
            </div>
          </div>
        </div>

        {/* ── 1. MONTH VIEW ── */}
        {viewMode === 'month' && (
          <div>
            {/* Weekday Column Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-2.5 uppercase font-mono">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>

            {/* Monthly Day Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50/40">
              {calendarDays.map((cd, index) => {
                const dayEvents = filteredEvents.filter((e) => e.dateStr === cd.dateStr);
                const isSelected = cd.dateStr === selectedDayStr;
                const isToday = cd.dateStr === '2026-09-23';

                return (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedDayDate(cd.dateObj);
                    }}
                    className={`min-h-[105px] sm:min-h-[120px] p-1.5 sm:p-2 flex flex-col transition-all cursor-pointer ${
                      cd.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 text-slate-400'
                    } ${
                      isSelected ? 'ring-2 ring-inset ring-[#e60012] bg-red-50/20' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs font-bold font-mono w-6 h-6 rounded-full flex items-center justify-center ${
                          isToday
                            ? 'bg-[#e60012] text-white shadow-xs'
                            : isSelected
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-700'
                        }`}
                      >
                        {cd.dayNum}
                      </span>

                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {dayEvents.length} items
                        </span>
                      )}
                    </div>

                    {/* Event Pills for the Day */}
                    <div className="flex-1 space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate flex items-center gap-1 border transition-all ${
                            evt.type === 'drive'
                              ? 'bg-cyan-50 text-cyan-900 border-cyan-200 hover:bg-cyan-100'
                              : evt.type === 'delivery'
                              ? 'bg-red-50 text-red-900 border-red-200 hover:bg-red-100'
                              : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              evt.type === 'drive'
                                ? 'bg-cyan-500'
                                : evt.type === 'delivery'
                                ? 'bg-[#e60012]'
                                : 'bg-amber-500'
                            }`}
                          />
                          <span className="font-mono text-[9px] shrink-0">{evt.timeStr}</span>
                          <span className="truncate">{evt.customer_name}</span>
                        </div>
                      ))}

                      {dayEvents.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-500 block text-right pr-1">
                          +{dayEvents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Day Agenda Drilldown Tray */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-[#e60012]" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide font-mono">
                    Schedule for {selectedDayDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold font-mono">
                    {selectedDayEvents.length} items
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('day')}
                    className="text-xs font-bold text-[#e60012] hover:underline flex items-center gap-1"
                  >
                    <span>Open in Hourly Day Agenda</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-200">
                  No appointments, follow-ups or deliveries recorded for this day. Click &ldquo;Book Drive&rdquo; to add an appointment.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedDayEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3.5 rounded-xl border bg-white shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 border-l-4 ${
                        evt.type === 'drive'
                          ? 'border-l-cyan-500'
                          : evt.type === 'delivery'
                          ? 'border-l-[#e60012]'
                          : 'border-l-amber-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span
                            className={`text-[9px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                              evt.type === 'drive'
                                ? 'bg-cyan-100 text-cyan-800'
                                : evt.type === 'delivery'
                                ? 'bg-red-100 text-[#e60012]'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {evt.type === 'drive' ? 'Test Drive / Consult' : evt.type === 'delivery' ? 'Delivery Handover' : 'Cadence Follow-up'}
                          </span>
                          <h5 className="text-xs font-bold text-slate-900 mt-1">{evt.customer_name}</h5>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-slate-800">{evt.timeStr}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{evt.endTimeStr}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-1">{evt.subtitle}</p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                        <span>{evt.site || 'Fairfield'}</span>
                        <span className="font-semibold text-slate-700">{evt.consultant}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 2. WEEK VIEW ── */}
        {viewMode === 'week' && (
          <div className="overflow-x-auto w-full p-4">
            <div className="min-w-[850px] grid grid-cols-7 gap-3">
              {weekDays.map((wd) => {
                const dayEvts = filteredEvents.filter((e) => e.dateStr === wd.dateStr);
                const isSelected = wd.dateStr === selectedDayStr;

                return (
                  <div
                    key={wd.dateStr}
                    onClick={() => setSelectedDayDate(wd.dateObj)}
                    className={`rounded-xl p-3 border flex flex-col min-h-[460px] transition-all ${
                      isSelected
                        ? 'border-[#e60012] bg-red-50/15 ring-1 ring-[#e60012]'
                        : 'border-slate-200 bg-slate-50/70 hover:bg-slate-50'
                    }`}
                  >
                    <div className="border-b border-slate-200 pb-2 mb-2 flex items-center justify-between">
                      <div>
                        <strong className="text-xs font-bold text-slate-900 block">{wd.name}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{wd.dateStr}</span>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 font-bold text-slate-700">
                        {dayEvts.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 overflow-y-auto">
                      {dayEvts.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[11px] text-slate-400 italic">
                          Clear
                        </div>
                      ) : (
                        dayEvts.map((evt) => (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(evt);
                            }}
                            className={`p-2.5 rounded-lg border text-left cursor-pointer hover:shadow-md transition-all text-xs space-y-1 ${getEventClass(
                              evt.type
                            )}`}
                          >
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="font-bold uppercase tracking-wider">{evt.type}</span>
                              <span className="font-bold">{evt.timeStr}</span>
                            </div>
                            <p className="font-bold text-[11px] leading-tight truncate">{evt.customer_name}</p>
                            <p className="text-[10px] opacity-75 line-clamp-2 leading-snug">{evt.subtitle}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 3. DAY AGENDA (HOURLY RHYTHM + FLEET & STAGING CONTEXT) ── */}
        {viewMode === 'day' && (
          <div className="day-calendar">
            {/* Time Gutter */}
            <div className="time-gutter">
              {timeSlots.map((time, idx) => (
                <span key={idx}>{time}</span>
              ))}
            </div>

            {/* Day Track Area */}
            <div className="day-track min-h-[660px] relative">
              {/* Hour Grid Lines */}
              {Array.from({ length: 11 }).map((_, idx) => (
                <div key={idx} className="hour-line" />
              ))}

              {/* Real-time Indicator Line */}
              <div className="now-line" style={{ top: '18%' }}>
                <span>NOW · MELBOURNE AEST</span>
              </div>

              {/* Positioned Events for Selected Day */}
              {selectedDayEvents.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400">
                  No scheduled items for this date ({selectedDayStr}). Use &ldquo;Book Drive&rdquo; to reserve a slot.
                </div>
              ) : (
                selectedDayEvents.map((evt, idx) => {
                  // Calculate vertical positioning based on hours (08:00 to 18:00 = 10 hours)
                  const [h, m] = evt.timeStr.split(':').map(Number);
                  const totalMin = 10 * 60;
                  const startMin = Math.max(0, (h - 8) * 60 + (m || 0));
                  const topPct = Math.max(2, Math.min(88, (startMin / totalMin) * 100));

                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`calendar-event ${getEventClass(evt.type)} cursor-pointer shadow-md`}
                      style={{
                        top: `${topPct}%`,
                        left: '14px',
                        right: '14px',
                        minHeight: '4.5rem',
                      }}
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold uppercase tracking-wider font-mono">
                          {evt.type === 'drive' ? 'Test Drive' : evt.type === 'delivery' ? 'Delivery Handover' : 'Follow-up Cadence'}
                        </span>
                        <strong className="font-mono">{evt.timeStr} – {evt.endTimeStr}</strong>
                      </div>
                      <strong className="text-xs text-slate-900 block mt-0.5">{evt.customer_name} · {evt.vehicle || 'BYD Range'}</strong>
                      <small className="text-[11px] opacity-80 block truncate">{evt.subtitle}</small>
                    </div>
                  );
                })
              )}
            </div>

            {/* Context Sidebar: Fleet Demo Staging & Handover Capacity */}
            <div className="calendar-context p-4 space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                  Showroom Demo Fleet
                </span>
                {FLEET_STAGING.map((car, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-xs text-xs"
                  >
                    <div>
                      <strong className="text-slate-900 block font-semibold">{car.model}</strong>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {car.plate} · {car.location}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                      <BatteryCharging className="w-3.5 h-3.5" />
                      <span>{car.battery}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Bay Status Note */}
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-900 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#e60012]">
                  <Truck className="w-4 h-4 shrink-0" />
                  <span>Handover Bay Staging</span>
                </div>
                <p className="text-[11px] text-red-800 leading-snug">
                  Bay 1 active for Priya Nair ATTO 3. Bay 2 cleared for afternoon commercial deliveries.
                </p>
              </div>

              {/* Today's Follow-up Count */}
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>Cadence Actions</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  {counts.followup} high-priority opportunity touchpoints due for follow-up today across Fairfield & Melbourne City.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. TABLE / LIST VIEW ── */}
        {viewMode === 'list' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Showing {filteredEvents.length} total scheduled events</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredEvents.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-4 rounded-xl border bg-white shadow-xs hover:shadow-lg transition-all cursor-pointer space-y-3 border-l-4 ${
                    evt.type === 'drive'
                      ? 'border-l-cyan-500'
                      : evt.type === 'delivery'
                      ? 'border-l-[#e60012]'
                      : 'border-l-amber-500'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`text-[9px] font-bold uppercase font-mono px-2 py-0.5 rounded ${
                          evt.type === 'drive'
                            ? 'bg-cyan-100 text-cyan-800'
                            : evt.type === 'delivery'
                            ? 'bg-red-100 text-[#e60012]'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {evt.type === 'drive'
                          ? 'Appointment'
                          : evt.type === 'delivery'
                          ? 'Handover'
                          : 'Follow-up'}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">{evt.customer_name}</h4>
                      {evt.phone && <span className="text-xs text-slate-500 font-mono">{evt.phone}</span>}
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-800 block">
                        {evt.date.toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">{evt.timeStr}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="text-slate-700 truncate">
                      <strong>Vehicle:</strong> {evt.vehicle || 'BYD Range'}
                    </div>
                    <div className="text-slate-600 line-clamp-2 italic">
                      &ldquo;{evt.subtitle}&rdquo;
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
                    <span>{evt.site || 'Fairfield'}</span>
                    <span className="font-semibold text-slate-700">Rep: {evt.consultant}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── INTERACTIVE EVENT DETAIL MODAL ── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
                    selectedEvent.type === 'drive'
                      ? 'bg-cyan-600'
                      : selectedEvent.type === 'delivery'
                      ? 'bg-[#e60012]'
                      : 'bg-amber-600'
                  }`}
                >
                  {selectedEvent.type === 'drive' ? (
                    <Car className="w-5 h-5" />
                  ) : selectedEvent.type === 'delivery' ? (
                    <Truck className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider font-mono ${
                      selectedEvent.type === 'drive'
                        ? 'text-cyan-700'
                        : selectedEvent.type === 'delivery'
                        ? 'text-[#e60012]'
                        : 'text-amber-700'
                    }`}
                  >
                    {selectedEvent.type === 'drive'
                      ? 'Test Drive / Consultation'
                      : selectedEvent.type === 'delivery'
                      ? 'Delivery Handover'
                      : 'Opportunity Cadence Action'}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    {selectedEvent.customer_name}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Event Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Scheduled Date & Time</span>
                  <strong className="text-slate-900 text-xs font-mono">
                    {selectedEvent.date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </strong>
                  <span className="text-slate-600 font-mono block mt-0.5">
                    {selectedEvent.timeStr} – {selectedEvent.endTimeStr}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Site Location</span>
                  <strong className="text-slate-900 text-xs flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#e60012]" />
                    {selectedEvent.site || 'Fairfield'}
                  </strong>
                  <span className="text-slate-500 block mt-0.5">Owner: {selectedEvent.consultant}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-mono block">Vehicle & Subject</span>
                <strong className="text-sm text-slate-900 block mt-0.5">
                  {selectedEvent.vehicle || 'BYD Electric Vehicle Range'}
                </strong>
                <p className="text-slate-600 mt-1 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                  {selectedEvent.subtitle}
                </p>
              </div>

              {selectedEvent.notes && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Operational Notes</span>
                  <p className="text-slate-700 italic bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 mt-1">
                    &ldquo;{selectedEvent.notes}&rdquo;
                  </p>
                </div>
              )}

              {/* Contact Details */}
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                {selectedEvent.phone && (
                  <a
                    href={`tel:${selectedEvent.phone}`}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call {selectedEvent.phone}</span>
                  </a>
                )}
                {selectedEvent.email && (
                  <a
                    href={`mailto:${selectedEvent.email}`}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-sky-600" />
                    <span>Email</span>
                  </a>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-600"
              >
                Close
              </button>

              <button
                onClick={() => handleOpenCustomer360FromEvent(selectedEvent)}
                className="px-4 py-2 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Customer 360 Record</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
