'use client';
import { useState } from 'react';
import { useCrm } from '@/lib/crmContext';
import { useBrowse, useBrowseQuery, readAllPages } from '@/lib/useBrowse';
import { browseApi } from '@/lib/api';
import { AuditLogEntry } from '@/lib/types';
import {
  BrowseSelect,
  BrowseState,
  browseInput,
} from '@/components/ui/BrowseControls';
import { PaginationControls } from '@/components/ui/PaginationControls';
export function AuditView() {
  const { selectedSite, addToast } = useCrm();
  const query = useBrowseQuery({ q: '', source: '' }, selectedSite);
  const params = {
    ...query.filters,
    site: selectedSite,
    page: query.page,
    limit: query.limit,
  };
  const result = useBrowse<AuditLogEntry>('audit', params);
  const [exporting, setExporting] = useState(false);
  const download = async () => {
    setExporting(true);
    try {
      const all = await readAllPages<AuditLogEntry>(
        (page) =>
          browseApi.list(
            'audit',
            { ...params, page, limit: 100 },
            new AbortController().signal
          ),
        new AbortController().signal
      );
      const cell = (value: unknown) =>
        '"' + String(value ?? '').replace(/"/g, '""') + '"';
      const csv = [
        'AuditID,Actor,Action,Target,Details,Source,Time',
        ...all.data.map((row) =>
          [
            row.audit_id,
            row.actor,
            row.action,
            row.target_id,
            row.details,
            row.source,
            row.timestamp,
          ]
            .map(cell)
            .join(',')
        ),
      ].join('\r\n');
      const url = URL.createObjectURL(
        new Blob([csv], { type: 'text/csv;charset=utf-8' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `CRM-activity-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      addToast(
        'error',
        'Export failed',
        err instanceof Error ? err.message : 'Please try again.'
      );
    } finally {
      setExporting(false);
    }
  };
  return (
    <div className="view-stack space-y-4">
      <div className="page-intro">
        <div>
          <h1 className="page-title">Activity & Audit History</h1>
          <p className="page-subtitle">
            Saved CRM activity for {selectedSite}.
          </p>
        </div>
        <button
          className={browseInput}
          disabled={exporting || result.loading || !!result.error}
          onClick={download}
        >
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
      <div className="surface-card p-4 flex gap-3 flex-wrap">
        <label className="text-sm flex-1">
          Search
          <input
            className={`${browseInput} block w-full mt-1`}
            value={query.filters.q}
            onChange={(e) => query.change('q', e.target.value)}
            placeholder="Actor, action, customer ID or details"
          />
        </label>
        <BrowseSelect
          label="Sources"
          value={query.filters.source}
          values={result.meta?.filters?.sources || []}
          onChange={(value) => query.change('source', value)}
        />
        <button className={browseInput} onClick={query.reset}>
          Clear
        </button>
        <button className={browseInput} onClick={result.reload}>
          Refresh
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
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                {['When', 'Actor', 'Action', 'Record', 'Details', 'Source'].map(
                  (value) => (
                    <th className="p-3" key={value}>
                      {value}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {result.data.map((row) => (
                <tr className="border-t border-slate-100" key={row.audit_id}>
                  <td className="p-3 whitespace-nowrap">
                    {row.timestamp && Number.isFinite(Date.parse(row.timestamp))
                      ? new Date(row.timestamp).toLocaleString('en-AU', {
                          timeZone: 'Australia/Melbourne',
                        })
                      : '—'}
                  </td>
                  <td className="p-3">{row.actor || '—'}</td>
                  <td className="p-3">{row.action}</td>
                  <td className="p-3">{row.target_id || '—'}</td>
                  <td className="p-3 whitespace-pre-wrap">{row.details}</td>
                  <td className="p-3">{row.source}</td>
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
          pageSize={query.limit}
          totalItems={result.pagination?.total || 0}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageChange={query.setPage}
          onPageSizeChange={query.setLimit}
          itemLabel="events"
        />
      )}
    </div>
  );
}
