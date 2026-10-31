'use client';

import { useState } from 'react';
import { useCrm } from '@/lib/crmContext';
import { useBrowse, useBrowseQuery } from '@/lib/useBrowse';
import {
  BrowseSelect,
  BrowseState,
  browseInput,
} from '@/components/ui/BrowseControls';
import { PaginationControls } from '@/components/ui/PaginationControls';

type Lead = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  vehicle?: string;
  dealer?: string;
  stage?: string;
  status?: string;
  score?: number;
  platform?: string;
  source?: string;
  assignedTo?: string;
  allocatedPersonFullName?: string;
  leadId?: string;
  virtualyardId?: string;
  customerId?: string;
  stockNum?: string;
  notes?: string;
  enquiryDesc?: string;
  previewText?: string;
  leadDate?: string;
  createdAt?: string;
  updatedAt?: string;
  do_not_contact?: boolean;
  doNotContact?: boolean;
  isArchived?: boolean;
  testDrive?: { testDriveDate?: string; location?: string; status?: string };
};
const initial = {
  q: '',
  stage: '',
  status: '',
  source: '',
  platform: '',
  owner: '',
  leadYard: '',
  archived: '',
  scoreMin: '',
  scoreMax: '',
  receivedFrom: '',
  receivedTo: '',
  sort: 'updated',
};
const date = (value?: string) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString('en-AU', {
        timeZone: 'Australia/Melbourne',
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—';
export function LeadsView() {
  const { selectedSite } = useCrm();
  const query = useBrowseQuery(initial, selectedSite);
  const [selected, setSelected] = useState<Lead | null>(null);
  const result = useBrowse<Lead>('leads', {
    ...query.filters,
    page: query.page,
    limit: query.limit,
    site: selectedSite,
  });
  const filters = result.meta?.filters || {};
  const change = query.change;
  return (
    <div className="view-stack space-y-4">
      <div className="page-intro">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">
            Lead Centre prospects, including hourly Virtual Yard imports.
            Showing {selectedSite}.
          </p>
        </div>
        <button className={browseInput} onClick={result.reload}>
          Refresh
        </button>
      </div>
      <div className="surface-card p-4 space-y-3">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Search all matching leads
          <input
            className={browseInput}
            placeholder="Name, phone, email, vehicle, lead ID or stock…"
            value={query.filters.q}
            onChange={(e) => change('q', e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {(
            [
              ['leadYard', 'Yards', 'yards'],
              ['stage', 'Stages', 'stages'],
              ['status', 'Statuses', 'statuses'],
              ['source', 'Sources', 'sources'],
              ['platform', 'Platforms', 'platforms'],
              ['owner', 'Consultants', 'owners'],
            ] as const
          ).map(([key, label, options]) => (
            <BrowseSelect
              key={key}
              label={label}
              value={query.filters[key]}
              values={filters[options] || []}
              onChange={(value) => change(key, value)}
            />
          ))}
          <label className="text-xs text-slate-600 flex flex-col gap-1">
            Archive status
            <select
              className={browseInput}
              value={query.filters.archived}
              onChange={(e) => change('archived', e.target.value)}
            >
              <option value="">Active</option>
              <option value="true">Archived</option>
              <option value="all">All records</option>
            </select>
          </label>
          <label className="text-xs text-slate-600 flex flex-col gap-1">
            Minimum score
            <input
              aria-label="Minimum score"
              className={browseInput}
              type="number"
              min="0"
              max="100"
              value={query.filters.scoreMin}
              onChange={(e) => change('scoreMin', e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-600 flex flex-col gap-1">
            Maximum score
            <input
              aria-label="Maximum score"
              className={browseInput}
              type="number"
              min="0"
              max="100"
              value={query.filters.scoreMax}
              onChange={(e) => change('scoreMax', e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-600 flex flex-col gap-1">
            Sort by
            <select
              className={browseInput}
              value={query.filters.sort}
              onChange={(e) => change('sort', e.target.value)}
            >
              <option value="updated">Recently updated</option>
              <option value="newest">Newest created</option>
              <option value="oldest">Oldest created</option>
              <option value="score">Highest score</option>
              <option value="name">Name</option>
            </select>
          </label>
          <label className="text-xs text-slate-600 flex flex-col gap-1">
            Received from
            <input
              className={browseInput}
              type="date"
              value={query.filters.receivedFrom}
              onChange={(e) => change('receivedFrom', e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-600 flex flex-col gap-1">
            Received through
            <input
              className={browseInput}
              type="date"
              value={query.filters.receivedTo}
              onChange={(e) => change('receivedTo', e.target.value)}
            />
          </label>
        </div>
        <button
          className="text-sm text-red-700 font-semibold"
          onClick={query.reset}
        >
          Clear filters
        </button>
      </div>
      <BrowseState
        loading={result.loading}
        error={result.error}
        empty={!result.data.length}
        retry={result.reload}
      />
      {!!result.data.length && (
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                {[
                  'Prospect / ID',
                  'Contact',
                  'Vehicle / Yard',
                  'Stage / Status',
                  'Consultant',
                  'Source',
                  'Score',
                  'Updated',
                  '',
                ].map((title, i) => (
                  <th className="px-4 py-3 whitespace-nowrap" key={i}>
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.data.map((lead) => (
                <tr key={lead._id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <button
                      className="font-semibold text-red-700 text-left"
                      onClick={() => setSelected(lead)}
                    >
                      {lead.name || 'Unnamed prospect'}
                    </button>
                    <small className="block text-slate-500">
                      {lead.virtualyardId || lead.leadId || lead._id}
                    </small>
                  </td>
                  <td className="p-4">
                    <span className="block">{lead.phone || '—'}</span>
                    <small>{lead.email}</small>
                  </td>
                  <td className="p-4">
                    <span className="block">{lead.vehicle || '—'}</span>
                    <small>{lead.dealer}</small>
                  </td>
                  <td className="p-4">
                    <span className="block">{lead.stage || '—'}</span>
                    <small>{lead.status}</small>
                    {(lead.do_not_contact ||
                      lead.doNotContact ||
                      lead.status === 'opted out') && (
                      <small className="block text-red-700">
                        Do not contact
                      </small>
                    )}
                  </td>
                  <td className="p-4">
                    {lead.allocatedPersonFullName ||
                      lead.assignedTo ||
                      'Unassigned'}
                  </td>
                  <td className="p-4">
                    {lead.source || lead.platform || '—'}
                    <small className="block text-slate-500">
                      {lead.platform}
                    </small>
                  </td>
                  <td className="p-4">{lead.score ?? '—'}</td>
                  <td className="p-4 whitespace-nowrap text-xs">
                    {date(lead.updatedAt)}
                  </td>
                  <td className="p-4">
                    <button
                      className="underline"
                      onClick={() => setSelected(lead)}
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!result.loading && !result.error && (
        <PaginationControls
          pagination={result.pagination}
          currentPage={query.page}
          totalItems={result.pagination?.total || 0}
          pageSize={query.limit}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={query.setPage}
          onPageSizeChange={query.setLimit}
          itemLabel="leads"
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
            aria-label="Lead details"
            className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between gap-4">
              <h2 className="text-xl font-bold">{selected.name}</h2>
              <button className={browseInput} onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {Object.entries({
                'Lead ID':
                  selected.virtualyardId || selected.leadId || selected._id,
                Phone: selected.phone,
                Email: selected.email,
                Vehicle: selected.vehicle,
                Stock: selected.stockNum,
                Yard: selected.dealer,
                Stage: selected.stage,
                Status: selected.status,
                Consultant:
                  selected.allocatedPersonFullName || selected.assignedTo,
                Source: selected.source,
                Platform: selected.platform,
                Score: selected.score,
                Received: date(selected.leadDate || selected.createdAt),
                Updated: date(selected.updatedAt),
                Archived: selected.isArchived ? 'Yes' : 'No',
              }).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-slate-500">{label}</dt>
                  <dd className="font-medium break-words">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
            {(selected.do_not_contact ||
              selected.doNotContact ||
              selected.status === 'opted out') && (
              <p className="p-3 bg-red-50 text-red-800 rounded-lg">
                This prospect has opted out. Do not contact.
              </p>
            )}
            {selected.testDrive?.testDriveDate && (
              <p className="p-3 bg-slate-50 rounded-lg text-sm">
                Test drive: {date(selected.testDrive.testDriveDate)} ·{' '}
                {selected.testDrive.location} · {selected.testDrive.status}
              </p>
            )}
            {[
              ...new Set(
                [
                  selected.notes,
                  selected.enquiryDesc,
                  selected.previewText,
                ].filter(Boolean)
              ),
            ].map((note, i) => (
              <p
                key={i}
                className="text-sm whitespace-pre-wrap p-3 bg-slate-50 rounded-lg"
              >
                {note}
              </p>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}
