'use client';

import { useState } from 'react';
import { Appointment } from '@/lib/types';
import { appointmentApi } from '@/lib/api';
import { useCrm } from '@/lib/crmContext';

export function VirtualyardSyncStatus({ appointment }: { appointment: Appointment }) {
  const [sync, setSync] = useState(appointment.virtualyardSync);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { fetchAppointments } = useCrm();
  if (!sync || sync.state === 'not_applicable') return null;
  const retry = async () => {
    setBusy(true); setError('');
    const result = await appointmentApi.retryVirtualyard(appointment.appointment_id);
    if (result.success && result.data) { setSync(result.data.virtualyardSync); await fetchAppointments(); }
    else setError(result.message || 'Retry failed.');
    setBusy(false);
  };
  return <div className={`p-3 rounded-xl border space-y-2 ${sync.state === 'synced' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
    <p className="font-semibold">{sync.state === 'synced' ? `Virtual Yard booked · #${sync.externalId}` : `Virtual Yard: ${sync.state === 'unknown' || sync.state === 'sending' ? 'confirmation needed' : sync.state}`}</p>
    {sync.message && <p>{sync.message}</p>}
    {['unknown', 'sending'].includes(sync.state) && <p>Check Virtual Yard for an existing booking before taking further action.</p>}
    {['pending', 'failed'].includes(sync.state) && <button disabled={busy} onClick={retry} className="border border-amber-400 rounded-lg px-3 py-1.5 font-semibold disabled:opacity-50">{busy ? 'Retrying…' : 'Retry Virtual Yard sync'}</button>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div>;
}
