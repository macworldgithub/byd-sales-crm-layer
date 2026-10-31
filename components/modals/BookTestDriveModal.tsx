'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { Appointment, Customer } from '@/lib/types';
import { virtualyardApi, VirtualyardOption, VirtualyardOptions } from '@/lib/api';
import { melbourneBookingTime } from '@/lib/bookingTime';
import { useVirtualyardLookup } from '@/lib/useVirtualyardLookup';
import { VirtualyardSelect } from '@/components/VirtualyardSelect';

interface BookTestDriveModalProps { isOpen: boolean; onClose: () => void; preselectedCustomer?: Customer | null }
const fieldClass = 'w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none';
const localStatus: Record<string, Appointment['status']> = { P: 'Pending', C: 'Confirmed', I: 'In-Progress', F: 'Completed', R: 'Rescheduled', X: 'Cancelled', M: 'No Show' };

export function BookTestDriveModal({ isOpen, onClose, preselectedCustomer }: BookTestDriveModalProps) {
  const { customerOptions: customers, selectedSite, createAppointment } = useCrm();
  const [customerId, setCustomerId] = useState('');
  const [options, setOptions] = useState<VirtualyardOptions | null>(null);
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [driverQuery, setDriverQuery] = useState('');
  const [driver, setDriver] = useState<VirtualyardOption | null>(null);
  const [vehicleId, setVehicleId] = useState('');
  const [userId, setUserId] = useState('');
  const [yardId, setYardId] = useState('');
  const [bookingType, setBookingType] = useState('T');
  const [status, setStatus] = useState('C');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState('45');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const requestId = useRef('');
  const inFlight = useRef(false);
  const vehicleLookup = useVirtualyardLookup('vehicles', vehicleQuery, isOpen && !!options, refresh);
  const userLookup = useVirtualyardLookup('users', userQuery, isOpen && !!options, refresh);
  const driverLookup = useVirtualyardLookup('customers', driverQuery, isOpen && !!options, refresh);
  const vehicles = vehicleLookup.rows;
  const users = userLookup.rows;
  const drivers = driverLookup.rows;

  useEffect(() => {
    if (!isOpen) return;
    setError(''); setSavedMessage('');
    setVehicleId(''); setUserId(''); setDriver(null); setDriverQuery('');
    setVehicleQuery(''); setUserQuery('');
    setCustomerId(preselectedCustomer?.customer_id || '');
    setDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
    requestId.current = crypto.randomUUID();
  }, [isOpen, selectedSite, preselectedCustomer?.customer_id]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true); setError(''); setOptions(null);
    setVehicleId(''); setUserId(''); setDriver(null);
    virtualyardApi.options().then(meta => {
      if (cancelled) return;
      if (!meta.success || !meta.data) throw new Error(meta.message || 'Could not load Virtual Yard.');
      setOptions(meta.data);
      const siteKey = (value: string) => value.toLowerCase().replace(/^byd\s+/, '').replace(/[^a-z0-9]/g, '');
      setYardId(meta.data.yards.find(yard => siteKey(yard.name) === siteKey(selectedSite))?.id || meta.data.yards[0]?.id || '');
    }).catch(err => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isOpen, selectedSite, refresh]);

  const allCustomers = preselectedCustomer && !customers.some(c => c.customer_id === preselectedCustomer.customer_id) ? [preselectedCustomer, ...customers] : customers;
  const targetCustomer = allCustomers.find(c => c.customer_id === customerId);
  if (!isOpen) return null;
  const selectVehicle = (id: string) => {
    setVehicleId(id);
    const vehicle = vehicles.find(row => row.id === id);
    if (vehicle?.locationId && options?.yards.some(yard => yard.id === vehicle.locationId)) setYardId(vehicle.locationId);
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current || !targetCustomer || !driver) return;
    inFlight.current = true; setSubmitting(true); setError('');
    try {
      const yard = options?.yards.find(row => row.id === yardId);
      const vehicle = vehicles.find(row => row.id === vehicleId);
      if (!yard || !vehicle || !userId) throw new Error('Select a yard, demo vehicle and salesperson.');
      const appointment = await createAppointment({
        bookingRequestId: requestId.current, customer_id: targetCustomer.customer_id, customer_name: targetCustomer.name,
        phone: targetCustomer.phone, type: 'Test Drive', when: melbourneBookingTime(date, time), duration_minutes: Number(duration),
        vehicle: vehicle.name, consultant: users.find(person => person.id === userId)?.name,
        notes, site: yard.name as Customer['site'],
        status: localStatus[status] || 'Confirmed',
        virtualyard: { vehicleId, vehicleName: vehicle.name, userId, userName: users.find(person => person.id === userId)?.name, customerId: driver.id, customerName: driver.name, locationId: yardId, bookingType, status },
      });
      if (appointment.virtualyardSync?.state === 'synced') onClose();
      else setSavedMessage(`Appointment saved in CRM. ${appointment.virtualyardSync?.message || 'Virtual Yard confirmation is pending.'} Review its sync status in Appointments; do not create another booking.`);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not save booking.'); }
    finally { inFlight.current = false; setSubmitting(false); }
  };

  const select = (label: string, value: string, onChange: (value: string) => void, rows: VirtualyardOption[]) => (
    <VirtualyardSelect label={label} value={value} onChange={onChange} rows={rows} disabled={submitting || !!savedMessage}
      yardNames={Object.fromEntries((options?.yards || []).map(yard => [yard.id, yard.name]))} />
  );
  const lookupFeedback = (lookup: ReturnType<typeof useVirtualyardLookup>, label: string) => (
    <div className="space-y-1 text-xs">
      {lookup.loading && <p role="status" className="text-slate-500">Loading current {label} from Virtual Yard…</p>}
      {lookup.error && <p role="alert" className="text-red-700">{lookup.error}</p>}
      {!lookup.loading && !lookup.error && <p className="text-slate-500">{lookup.rows.length} {label} loaded{lookup.hasMore ? ' · more matches available' : ''}.</p>}
      {lookup.hasMore && (lookup.limit < 50000 ? <button type="button" disabled={lookup.loading} onClick={lookup.loadMore} className="text-red-700 underline disabled:opacity-50">Load more {label}</button> : <p>Enter a more specific search to find the remaining matches.</p>)}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby="test-drive-title" className="bg-white rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[94vh] overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center gap-3">
          <Calendar className="text-[#e60012] w-6 h-6" />
          <div className="flex-1"><h3 id="test-drive-title" className="font-bold text-slate-900">Book Test Drive</h3><p className="text-xs text-slate-500">Save to CRM and Virtual Yard · Melbourne time</p></div>
          <button type="button" aria-label="Close booking" disabled={submitting} onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <button type="button" disabled={loading || submitting || !!savedMessage} onClick={() => setRefresh(value => value + 1)} className="text-xs text-red-700 underline">Refresh Virtual Yard dropdowns</button>
          {loading && <p role="status" className="text-sm text-slate-500">Loading Virtual Yard booking options…</p>}
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}
          {savedMessage && <p role="status" className="text-sm text-amber-900 bg-amber-50 p-3 rounded-lg">{savedMessage}</p>}
          {options && <fieldset disabled={submitting || !!savedMessage} className="space-y-4 min-w-0">
            {select('CRM customer', customerId, setCustomerId, allCustomers.map(c => ({ id: c.customer_id, name: `${c.name} (${c.phone})` })))}
            {select('Yard', yardId, value => { setYardId(value); setVehicleId(''); }, options.yards)}
            <label className="block text-xs font-semibold text-slate-700 space-y-1"><span>Search demo vehicles</span>
              <input autoComplete="off" className={fieldClass} value={vehicleQuery} disabled={submitting || !!savedMessage} onChange={e => { setVehicleQuery(e.target.value); setVehicleId(''); }} placeholder="Model, stock number or registration" />
            </label>
            {select('Demo vehicle', vehicleId, selectVehicle, vehicles)}
            {lookupFeedback(vehicleLookup, 'vehicles')}
            {!vehicleLookup.loading && !vehicleLookup.error && !vehicles.length && <p className="text-xs text-amber-700">No matching demo vehicles are available.</p>}
            <label className="block text-xs font-semibold text-slate-700 space-y-1"><span>Search salespeople</span>
              <input autoComplete="off" className={fieldClass} value={userQuery} disabled={submitting || !!savedMessage} onChange={e => { setUserQuery(e.target.value); setUserId(''); }} placeholder="Salesperson name" />
            </label>
            {select('Salesperson', userId, setUserId, users)}
            {lookupFeedback(userLookup, 'salespeople')}
            <label className="block text-xs font-semibold text-slate-700 space-y-1"><span>Search Virtual Yard driver</span>
              <input autoComplete="off" className={fieldClass} value={driverQuery} disabled={submitting || !!savedMessage} onChange={e => { setDriverQuery(e.target.value); setDriver(null); }} placeholder="Driver name, phone or customer ID" />
            </label>
            {select('Virtual Yard driver', driver?.id || '', id => setDriver(drivers.find(row => row.id === id) || null), drivers)}
            {lookupFeedback(driverLookup, 'drivers')}
            {!driverLookup.loading && !driverLookup.error && !drivers.length && <p className="text-xs text-slate-500">No matching Virtual Yard drivers. Try a name, phone number or customer ID, or add the driver in Virtual Yard first.</p>}
            <div className="grid grid-cols-2 gap-3">
              {select('Booking type', bookingType, setBookingType, options.bookingTypes)}
              {select('Status', status, setStatus, options.statuses)}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label className="block text-xs font-semibold space-y-1"><span>Date</span><input type="date" required value={date} onChange={e => setDate(e.target.value)} className={fieldClass} /></label>
              <label className="block text-xs font-semibold space-y-1"><span>Time (Melbourne)</span><input type="time" required value={time} onChange={e => setTime(e.target.value)} className={fieldClass} /></label>
              {select('Duration', duration, setDuration, ['30', '45', '60'].map(id => ({ id, name: `${id} min` })))}
            </div>
            <label className="block text-xs font-semibold space-y-1"><span>Notes</span><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className={fieldClass} /></label>
          </fieldset>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" disabled={submitting} onClick={onClose} className="px-4 py-2 rounded-xl border text-sm">{savedMessage ? 'Close' : 'Cancel'}</button>
            {!savedMessage && <button type="submit" disabled={loading || submitting || vehicleLookup.loading || userLookup.loading || driverLookup.loading || !options || !driver || !vehicleId || !userId} className="px-5 py-2 rounded-xl bg-[#e60012] text-white font-semibold text-sm disabled:opacity-50">{submitting ? 'Saving booking…' : 'Confirm booking'}</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
