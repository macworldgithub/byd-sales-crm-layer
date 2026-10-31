import { VirtualyardOption } from '@/lib/api';

interface Props {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: VirtualyardOption[];
  yardNames?: Record<string, string>;
  disabled?: boolean;
}

export function VirtualyardSelect({ label, value, onChange, rows, yardNames = {}, disabled }: Props) {
  return (
    <label className="block text-xs font-semibold text-slate-700 space-y-1">
      <span>{label}</span>
      <select required className="w-full text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none" value={value} onChange={event => onChange(event.target.value)} disabled={disabled}>
        <option value="">Select…</option>
        {rows.map(row => (
          <option key={row.id} value={row.id}>
            {row.name}{row.registration ? ` · ${row.registration}` : ''}{row.phone ? ` · ${row.phone}` : ''}{row.locationId && yardNames[row.locationId] ? ` · ${yardNames[row.locationId]}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
