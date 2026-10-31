'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { Appointment, Customer } from '@/lib/types';
import { virtualyardApi, VirtualyardOption, VirtualyardOptions } from '@/lib/api';
import { melbourneBookingTime } from '@/lib/bookingTime';

interface BookTestDriveModalProps { isOpen: boolean; onClose: () => void; preselectedCustomer?: Customer | null }
const fieldClass = 'w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none';
const localStatus: Record<string, Appointment['status']> = { P: 'Pending', C: 'Confirmed', I: 'In-Progress', F: 'Completed', R: 'Rescheduled', X: 'Cancelled', M: 'No Show' };

export function BookTestDriveModal({ isOpen, onClose, preselectedCustomer }: BookTestDriveModalProps) {
  const { customers, selectedSite, currentUser, createAppointment } = useCrm();
  const [customerId, setCustomerId] = useState('');
  const [options, setOptions] = useState<VirtualyardOptions | null>(null);
  const [vehicles, setVehicles] = useState<VirtualyardOption[]>([]);
  const [users, setUsers] = useState<VirtualyardOption[]>([]);
  const [drivers, setDrivers] = useState<VirtualyardOption[]>([]);
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [searchError, setSearchError] = useState('');
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
  const [lookupError, setLookupError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const requestId = useRef('');
  const inFlight = useRef(false);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setLoading(true); setError(''); setSavedMessage(''); setOptions(null);
    setVehicleId(''); setUserId(''); setDriver(null); setDriverQuery(''); setDrivers([]);
    setVehicleQuery(''); setUserQuery(currentUser.name); setSearchError('');
    setCustomerId(preselectedCustomer?.customer_id || customers[0]?.customer_id || '');
    setDate(new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
    requestId.current = crypto.randomUUID();
    Promise.all([virtualyardApi.options(), virtualyardApi.lookup('vehicles'), virtualyardApi.lookup('users', currentUser.name)]).then(([meta, fleet, people]) => {
      if (cancelled) return;
      if (!meta.success || !meta.data || !fleet.success || !people.success) throw new Error(meta.message || fleet.message || people.message || 'Could not load Virtual Yard.');
      setOptions(meta.data); setVehicles(fleet.data || []); setUsers(people.data || []);
      const siteKey = (value: string) => value.toLowerCase().replace(/^byd\s+/, '').replace(/[^a-z0-9]/g, '');
      setYardId(meta.data.yards.find(yard => siteKey(yard.name) === siteKey(selectedSite))?.id || meta.data.yards[0]?.id || '');
      const matches = (people.data || []).filter(person => person.name.trim().toLowerCase() === currentUser.name.trim().toLowerCase());
      if (matches.length === 1) setUserId(matches[0].id);
    }).catch(err => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // Customer data can refresh while the form is open; do not erase an in-progress booking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedSite, preselectedCustomer?.customer_id]);

  const allCustomers = preselectedCustomer && !customers.some(c => c.customer_id === preselectedCustomer.customer_id) ? [preselectedCustomer, ...customers] : customers;
  const targetCustomer = allCustomers.find(c => c.customer_id === customerId);
  useEffect(() => {
    if (!isOpen) return;
    setDriver(null); setDriverQuery(targetCustomer?.name || '');
  }, [isOpen, targetCustomer?.customer_id, targetCustomer?.name]);

  useEffect(() => {
    if (!isOpen || driverQuery.trim().length < 2) { setDrivers([]); return; }
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await virtualyardApi.lookup('customers', driverQuery);
      if (cancelled) return;
      setDrivers(result.data || []);
      setLookupError(result.success ? '' : result.message || 'Driver lookup failed.');
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isOpen, driverQuery]);

  useEffect(() => {
    if (!isOpen || !options) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await virtualyardApi.lookup('vehicles', vehicleQuery);
      if (cancelled) return;
      setVehicles(result.data || []);
      setSearchError(result.success ? '' : result.message || 'Vehicle lookup failed.');
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isOpen, options, vehicleQuery]);

  useEffect(() => {
    if (!isOpen || !options) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await virtualyardApi.lookup('users', userQuery);
      if (cancelled) return;
      setUsers(result.data || []);
      if (!result.success) setSearchError(result.message || 'Salesperson lookup failed.');
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isOpen, options, userQuery]);

  if (!isOpen) return null;
  const fleet = vehicles.filter(vehicle => vehicle.locationId === yardId);
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current || !targetCustomer || !driver) return;
    inFlight.current = true; setSubmitting(true); setError('');
    try {
      const yard = options?.yards.find(row => row.id === yardId);
      const vehicle = fleet.find(row => row.id === vehicleId);
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
    <label className="block text-xs font-semibold text-slate-700 space-y-1">
      <span>{label}</span>
      <select required className={fieldClass} value={value} onChange={event => onChange(event.target.value)} disabled={submitting || !!savedMessage}>
        <option value="">Select…</option>
        {rows.map(row => <option key={row.id} value={row.id}>{row.name}{row.registration ? ` · ${row.registration}` : ''}{row.phone ? ` · ${row.phone}` : ''}</option>)}
      </select>
    </label>
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
          {loading && <p role="status" className="text-sm text-slate-500">Loading Virtual Yard booking options…</p>}
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}
          {savedMessage && <p role="status" className="text-sm text-amber-900 bg-amber-50 p-3 rounded-lg">{savedMessage}</p>}
          {options && <fieldset disabled={submitting || !!savedMessage} className="space-y-4 min-w-0">
            {select('CRM customer', customerId, setCustomerId, allCustomers.map(c => ({ id: c.customer_id, name: `${c.name} (${c.phone})` })))}
            {select('Yard', yardId, value => { setYardId(value); setVehicleId(''); }, options.yards)}
            <label className="block text-xs font-semibold text-slate-700 space-y-1"><span>Search demo vehicles</span>
              <input className={fieldClass} value={vehicleQuery} disabled={submitting || !!savedMessage} onChange={e => { setVehicleQuery(e.target.value); setVehicleId(''); }} placeholder="Model, stock number or registration" />
            </label>
            {select('Demo vehicle', vehicleId, setVehicleId, fleet)}
            {!fleet.length && <p className="text-xs text-amber-700">No demo vehicles are available for this yard.</p>}
            <label className="block text-xs font-semibold text-slate-700 space-y-1"><span>Search salespeople</span>
              <input className={fieldClass} value={userQuery} disabled={submitting || !!savedMessage} onChange={e => { setUserQuery(e.target.value); setUserId(''); }} placeholder="Salesperson name" />
            </label>
            {select('Salesperson', userId, setUserId, users)}
            {searchError && <p role="alert" className="text-xs text-red-700">{searchError}</p>}
            <label className="block text-xs font-semibold text-slate-700 space-y-1"><span>Search Virtual Yard driver</span>
              <input className={fieldClass} value={driverQuery} disabled={submitting || !!savedMessage} onChange={e => { setDriverQuery(e.target.value); setDriver(null); }} placeholder="Enter the driver’s name" />
            </label>
            {lookupError && <p role="alert" className="text-xs text-red-700">{lookupError}</p>}
            {select('Virtual Yard driver', driver?.id || '', id => setDriver(drivers.find(row => row.id === id) || null), drivers)}
            {!drivers.length && driverQuery.length >= 2 && <p className="text-xs text-slate-500">Search for an existing Virtual Yard customer. Add new drivers in Virtual Yard first.</p>}
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
            {!savedMessage && <button type="submit" disabled={loading || submitting || !options || !driver || !vehicleId || !userId} className="px-5 py-2 rounded-xl bg-[#e60012] text-white font-semibold text-sm disabled:opacity-50">{submitting ? 'Saving booking…' : 'Confirm booking'}</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
