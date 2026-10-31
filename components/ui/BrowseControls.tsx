'use client';

export const browseInput =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm min-w-0';
export function BrowseSelect({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-600">
      <span>{label}</span>
      <select
        className={browseInput}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All {label.toLowerCase()}</option>
        {[...new Set([value, ...values].filter(Boolean))].map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
export function BrowseState({
  loading,
  error,
  empty,
  retry,
}: {
  loading: boolean;
  error?: string;
  empty: boolean;
  retry: () => void;
}) {
  if (loading)
    return (
      <p role="status" className="p-8 text-center text-slate-500">
        Loading records…
      </p>
    );
  if (error)
    return (
      <div role="alert" className="p-5 bg-red-50 text-red-800 rounded-xl">
        {error}{' '}
        <button onClick={retry} className="underline font-semibold ml-2">
          Try again
        </button>
      </div>
    );
  if (empty)
    return (
      <p className="p-8 text-center text-slate-500">
        No records match these filters.
      </p>
    );
  return null;
}
