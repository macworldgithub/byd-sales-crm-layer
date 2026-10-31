'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Download, X } from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { browseApi, customerApi } from '@/lib/api';
import { useBrowse, useBrowseQuery, readAllPages } from '@/lib/useBrowse';
import {
  addDays,
  addMonths,
  calendarRange,
  CalendarMode,
  dateLabel,
  melbourneToday,
  calendarIcs,
} from '@/lib/calendar';
import {
  BrowseSelect,
  BrowseState,
  browseInput,
} from '@/components/ui/BrowseControls';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { VirtualyardSyncStatus } from '@/components/VirtualyardSyncStatus';
import { Appointment, Customer } from '@/lib/types';

export interface CalendarViewProps {
  onOpenBookDrive?: () => void;
  onOpenQuickDeal?: () => void;
  onSelectCustomer?: (customer: Customer) => void;
}
export interface CalendarUnifiedEvent {
  id: string;
  type: 'drive' | 'followup' | 'delivery';
  title: string;
  subtitle: string;
  date: string;
  endsAt: string;
  dateStr: string;
  timeStr: string;
  endTimeStr: string;
  customer_id?: string;
  customer_name: string;
  phone?: string;
  email?: string;
  vehicle?: string;
  site?: string;
  consultant?: string;
  status?: string;
  notes?: string;
  rawSource: string;
  rawObject?: Appointment;
}
const colors = {
  drive: 'bg-cyan-50 border-cyan-200 text-cyan-900',
  followup: 'bg-amber-50 border-amber-200 text-amber-900',
  delivery: 'bg-emerald-50 border-emerald-200 text-emerald-900',
};
const categories = {
  drive: 'Appointment',
  followup: 'Follow-up',
  delivery: 'Delivery',
};
const initial = {
  q: '',
  category: '',
  consultant: '',
  status: '',
  eventYard: '',
};
export function CalendarView({
  onOpenBookDrive,
  onSelectCustomer,
}: CalendarViewProps) {
  const { selectedSite, appointments, opportunities, deliveryWatch, addToast } =
    useCrm();
  const [mode, setMode] = useState<CalendarMode>('month');
  const [anchor, setAnchor] = useState(melbourneToday);
  const [selected, setSelected] = useState<CalendarUnifiedEvent | null>(null);
  const [exporting, setExporting] = useState(false);
  const [openingCustomer, setOpeningCustomer] = useState(false);
  const range = calendarRange(anchor, mode);
  const query = useBrowseQuery(
    initial,
    `${selectedSite}:${mode}:${range.from}:${range.to}`
  );
  const params = {
    ...query.filters,
    ...range,
    category: query.filters.category || 'all',
    site: selectedSite,
    page: query.page,
    limit: query.limit,
  };
  const grid = mode === 'month' || mode === 'week';
  const result = useBrowse<CalendarUnifiedEvent>('calendar', params, grid);
  useEffect(() => {
    result.reload();
  }, [appointments, opportunities, deliveryWatch]);
  const move = (direction: number) =>
    setAnchor((old) =>
      mode === 'month' || mode === 'list'
        ? addMonths(old, direction)
        : addDays(old, direction * (mode === 'week' ? 7 : 1))
    );
  const days = Array.from({ length: mode === 'month' ? 42 : 7 }, (_, index) =>
    addDays(range.from, index)
  );
  const openDay = (day: string) => {
    setAnchor(day);
    setMode('day');
  };
  const openCustomer = async (event: CalendarUnifiedEvent) => {
    if (!onSelectCustomer) return;
    setOpeningCustomer(true);
    try {
      if (event.customer_id) {
        const response = await customerApi.getCustomer(event.customer_id);
        if (response.success && response.data) {
          onSelectCustomer(response.data);
          setSelected(null);
          return;
        }
      }
      const response = await customerApi.getCustomers({
        q: event.phone || event.email || event.customer_name,
        limit: 100,
        site: selectedSite,
      });
      const phone = (value?: string) =>
        (value || '').replace(/\D/g, '').replace(/^0/, '61');
      const matches = (response.data || []).filter((customer) =>
        event.phone
          ? phone(customer.phone) === phone(event.phone)
          : event.email
            ? customer.email?.toLowerCase() === event.email.toLowerCase()
            : customer.name?.toLowerCase() === event.customer_name.toLowerCase()
      );
      if (matches.length === 1) {
        onSelectCustomer(matches[0]);
        setSelected(null);
      } else
        addToast(
          'info',
          'No unique CRM customer linked',
          'The appointment remains visible here. Use the Leads tab to find the prospect.'
        );
    } finally {
      setOpeningCustomer(false);
    }
  };
  const exportCalendar = async () => {
    setExporting(true);
    try {
      const controller = new AbortController();
      const response = grid
        ? { data: result.data }
        : await readAllPages<CalendarUnifiedEvent>(
            (page) =>
              browseApi.list(
                'calendar',
                { ...params, page, limit: 100 },
                controller.signal
              ),
            controller.signal
          );
      const blob = new Blob([calendarIcs(response.data || [])], {
        type: 'text/calendar;charset=utf-8',
      });
      const url = URL.createObjectURL(blob),
        link = document.createElement('a');
      link.href = url;
      link.download = `BYD-Calendar-${range.from}.ics`;
      link.click();
      URL.revokeObjectURL(url);
      addToast(
        'success',
        'Calendar exported',
        `${response.data?.length || 0} matching events exported.`
      );
    } catch (error) {
      addToast(
        'error',
        'Export failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setExporting(false);
    }
  };
  const card = (event: CalendarUnifiedEvent) => (
    <button
      key={event.id}
      onClick={() => setSelected(event)}
      className={`w-full text-left rounded-lg border p-2 text-xs space-y-1 ${colors[event.type]}`}
    >
      <span className="font-semibold block">
        {event.timeStr} · {event.customer_name}
      </span>
      <span className="block truncate">{event.vehicle || event.title}</span>
      <span className="block text-[11px]">
        {event.consultant || 'Unassigned'} ·{' '}
        {event.status || categories[event.type]}
      </span>
    </button>
  );
  return (
    <div className="view-stack space-y-4">
      <div className="page-intro">
        <div>
          <h1 className="page-title">Calendar & Schedule</h1>
          <p className="page-subtitle">
            Appointments, deal follow-ups and scheduled handovers. All dates and
            times use Australia/Melbourne.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            disabled={result.loading || !!result.error || exporting}
            className={`${browseInput} flex gap-2 items-center disabled:opacity-50`}
            onClick={exportCalendar}
          >
            <Download size={16} />
            {exporting ? 'Exporting…' : 'Export .ics'}
          </button>
          {onOpenBookDrive && (
            <button
              className="signal-button px-4 py-2 rounded-lg flex items-center gap-2"
              onClick={onOpenBookDrive}
            >
              <Plus size={16} />
              Book Test Drive
            </button>
          )}
        </div>
      </div>
      <div className="surface-card p-4 space-y-4">
        <div className="flex flex-wrap justify-between gap-3 items-end">
          <div className="flex gap-2 items-center">
            <button
              className={browseInput}
              aria-label="Previous period"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className={browseInput}
              onClick={() => {
                setAnchor(melbourneToday());
                query.setPage(1);
              }}
            >
              Today
            </button>
            <button
              className={browseInput}
              aria-label="Next period"
              onClick={() => move(1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <label className="text-xs text-slate-600 flex flex-col gap-1">
            Month
            <input
              className={browseInput}
              type="month"
              value={anchor.slice(0, 7)}
              onChange={(e) => {
                if (/^\d{4}-\d{2}$/.test(e.target.value))
                  setAnchor(`${e.target.value}-01`);
              }}
            />
          </label>
          {(mode === 'week' || mode === 'day') && (
            <label className="text-xs text-slate-600 flex flex-col gap-1">
              Date
              <input
                className={browseInput}
                type="date"
                value={anchor}
                onChange={(e) => {
                  if (e.target.value) setAnchor(e.target.value);
                }}
              />
            </label>
          )}
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            {(['month', 'week', 'day', 'list'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setMode(view)}
                className={`px-3 py-2 text-sm capitalize ${mode === view ? 'bg-slate-900 text-white' : 'bg-white'}`}
              >
                {view}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Search events
            <input
              className={browseInput}
              value={query.filters.q}
              placeholder="Customer, phone, vehicle, notes…"
              onChange={(e) => query.change('q', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-600">
            Event type
            <select
              className={browseInput}
              value={query.filters.category}
              onChange={(e) => query.change('category', e.target.value)}
            >
              <option value="">All event types</option>
              <option value="drive">Appointments / test drives</option>
              <option value="followup">Follow-ups / callbacks</option>
              <option value="delivery">Deliveries / handovers</option>
            </select>
          </label>
          <BrowseSelect
            label="Consultants"
            value={query.filters.consultant}
            values={result.meta?.filters?.consultants || []}
            onChange={(value) => query.change('consultant', value)}
          />
          <BrowseSelect
            label="Statuses"
            value={query.filters.status}
            values={result.meta?.filters?.statuses || []}
            onChange={(value) => query.change('status', value)}
          />
          <BrowseSelect
            label="Yards"
            value={query.filters.eventYard}
            values={result.meta?.filters?.yards || []}
            onChange={(value) => query.change('eventYard', value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>
            {dateLabel(range.from)} – {dateLabel(addDays(range.to, -1))} ·{' '}
            {selectedSite} ·{' '}
            <strong>{result.pagination?.total ?? 0} matching events</strong>
          </span>
          <div className="flex gap-3">
            <button
              className="text-red-700 font-semibold"
              onClick={query.reset}
            >
              Clear filters
            </button>
            <button className={browseInput} onClick={result.reload}>
              Refresh
            </button>
          </div>
        </div>
      </div>
      <BrowseState
        loading={result.loading}
        error={result.error}
        empty={!result.data.length}
        retry={result.reload}
      />
      {!result.loading && !result.error && grid && (
        <div className="surface-card overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[770px]">
            {[
              'Monday',
              'Tuesday',
              'Wednesday',
              'Thursday',
              'Friday',
              'Saturday',
              'Sunday',
            ].map((day) => (
              <div
                className="p-3 bg-slate-50 border-b text-xs font-semibold text-center"
                key={day}
              >
                {day}
              </div>
            ))}
            {days.map((day) => {
              const events = result.data.filter(
                (event) => event.dateStr === day
              );
              const shown = mode === 'month' ? 3 : 6;
              return (
                <div
                  className={`border-r border-b p-2 space-y-2 min-h-[145px] ${day.slice(0, 7) !== anchor.slice(0, 7) && mode === 'month' ? 'bg-slate-50' : 'bg-white'}`}
                  key={day}
                >
                  <button
                    onClick={() => openDay(day)}
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${day === melbourneToday() ? 'bg-red-600 text-white' : 'hover:bg-slate-100'}`}
                  >
                    {mode === 'week'
                      ? dateLabel(day).split(' ').slice(0, 3).join(' ')
                      : Number(day.slice(-2))}
                  </button>
                  {events.slice(0, shown).map(card)}
                  {events.length > shown && (
                    <button
                      className="text-xs text-red-700 font-semibold"
                      onClick={() => openDay(day)}
                    >
                      View all {events.length} events
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {!result.loading && !result.error && !grid && !!result.data.length && (
        <div className="surface-card divide-y divide-slate-100">
          {result.data.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelected(event)}
              className="w-full p-4 text-left hover:bg-slate-50 grid grid-cols-1 md:grid-cols-[180px_1fr_1fr_180px] gap-3 text-sm"
            >
              <span>
                <strong className="block">{dateLabel(event.dateStr)}</strong>
                {event.timeStr} – {event.endTimeStr}
              </span>
              <span>
                <strong className="block">{event.customer_name}</strong>
                {event.vehicle || event.title}
              </span>
              <span>
                <strong className="block">{event.site || 'No yard set'}</strong>
                {event.consultant || 'Unassigned'}
              </span>
              <span>
                <small
                  className={`border rounded-full px-2 py-1 ${colors[event.type]}`}
                >
                  {categories[event.type]}
                </small>
                <span className="block mt-2">{event.status}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {!grid && !result.loading && !result.error && (
        <PaginationControls
          pagination={result.pagination}
          currentPage={query.page}
          totalItems={result.pagination?.total || 0}
          pageSize={query.limit}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={query.setPage}
          onPageSizeChange={query.setLimit}
          itemLabel="events"
        />
      )}
      {selected && (
        <div
          className="fixed inset-0 z-[80] bg-slate-950/50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Calendar event details"
            className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500">
                  {categories[selected.type]}
                </span>
                <h2 className="text-xl font-bold">{selected.customer_name}</h2>
              </div>
              <button
                aria-label="Close event details"
                onClick={() => setSelected(null)}
              >
                <X />
              </button>
            </div>
            {selected.rawSource === 'appointment' && selected.rawObject && (
              <VirtualyardSyncStatus
                key={selected.id}
                appointment={selected.rawObject}
              />
            )}
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries({
                Date: dateLabel(selected.dateStr),
                'Time (Melbourne)': `${selected.timeStr} – ${selected.endTimeStr}`,
                Vehicle: selected.vehicle || '—',
                Yard: selected.site || '—',
                Consultant: selected.consultant || 'Unassigned',
                Status: selected.status || '—',
              }).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-slate-500">{key}</dt>
                  <dd className="font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {selected.notes && (
              <p className="whitespace-pre-wrap text-sm bg-slate-50 p-3 rounded-lg">
                {selected.notes}
              </p>
            )}
            <div className="flex flex-wrap gap-3 text-sm">
              {selected.phone && (
                <a className={browseInput} href={`tel:${selected.phone}`}>
                  Call {selected.phone}
                </a>
              )}
              {selected.email && (
                <a className={browseInput} href={`mailto:${selected.email}`}>
                  Email
                </a>
              )}
              {onSelectCustomer && (
                <button
                  className={browseInput}
                  disabled={openingCustomer}
                  onClick={() => openCustomer(selected)}
                >
                  {openingCustomer ? 'Finding customer…' : 'Open Customer 360'}
                </button>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
