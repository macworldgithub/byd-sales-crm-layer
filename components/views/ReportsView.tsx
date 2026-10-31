'use client';
import { useEffect, useState } from 'react';
import { useCrm } from '@/lib/crmContext';
import {
  runtimeApi,
  syncApi,
  opportunityApi,
  customerApi,
  downloadAuthenticated,
} from '@/lib/api';
import { BrowseState, browseInput } from '@/components/ui/BrowseControls';

export function ReportsView() {
  const { selectedSite, addToast } = useCrm();
  const [summary, setSummary] =
    useState<Awaited<ReturnType<typeof runtimeApi.reports>>['data']>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSummary(undefined);
    setError('');
    runtimeApi.reports(selectedSite).then((response) => {
      if (cancelled) return;
      if (response.success && response.data) setSummary(response.data);
      else setError(response.message || 'Unable to load report totals.');
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSite]);
  const download = async (kind: 'saleslog' | 'opportunities' | 'customers') => {
    setExporting(kind);
    try {
      const query = { site: selectedSite };
      const url =
        kind === 'saleslog'
          ? syncApi.exportSalesLogCsvUrl(query)
          : kind === 'opportunities'
            ? opportunityApi.exportOpportunitiesCsvUrl(query)
            : customerApi.exportCustomersCsvUrl(query);
      await downloadAuthenticated(
        url,
        `CRM-${kind}-${new Date().toISOString().slice(0, 10)}.csv`
      );
      addToast('success', 'CSV downloaded');
    } catch (err) {
      addToast(
        'error',
        'Export failed',
        err instanceof Error ? err.message : 'Please try again.'
      );
    } finally {
      setExporting('');
    }
  };
  return (
    <div className="view-stack space-y-4">
      <div className="page-intro">
        <div>
          <h1 className="page-title">Reports & Exports</h1>
          <p className="page-subtitle">
            All saved records in {selectedSite}. Totals cover the full dataset.
          </p>
        </div>
      </div>
      <BrowseState
        loading={loading}
        error={error}
        empty={false}
        retry={() => location.reload()}
      />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {Object.entries({
          'Sales records': summary?.sales,
          'Recorded gross':
            summary?.gross == null ? '—' : `$${summary.gross.toLocaleString()}`,
          Reconciled: summary?.reconciled,
          'Opted out customers': summary?.optOuts,
        }).map(([label, value]) => (
          <div key={label} className="surface-card p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <strong className="block text-2xl mt-2">{value ?? '—'}</strong>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(
          [
            { kind: 'saleslog', title: 'Sales ledger', count: summary?.sales },
            {
              kind: 'opportunities',
              title: 'Opportunities',
              count: summary?.opportunities,
            },
            {
              kind: 'customers',
              title: 'Customer registry',
              count: summary?.customers,
            },
          ] as const
        ).map((report) => (
          <section key={report.kind} className="surface-card p-5 space-y-3">
            <h2 className="font-semibold">{report.title}</h2>
            <p className="text-sm text-slate-500">
              {report.count ?? '—'} saved records · CSV
            </p>
            <button
              disabled={!!exporting || loading || !!error}
              className={browseInput}
              onClick={() => download(report.kind)}
            >
              {exporting === report.kind ? 'Exporting…' : 'Download CSV'}
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}
