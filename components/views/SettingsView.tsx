'use client';
import { useEffect, useState } from 'react';
import { useCrm } from '@/lib/crmContext';
import { runtimeApi } from '@/lib/api';
import { VirtualyardConnection } from '@/components/VirtualyardConnection';
import { browseInput, BrowseState } from '@/components/ui/BrowseControls';

export function SettingsView() {
  const { currentUser, currentRole, reference, addToast } = useCrm();
  const [sla, setSla] = useState('');
  const [hold, setHold] = useState('');
  const [health, setHealth] = useState<any>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const canEdit =
    ['manager', 'site_admin', 'super_admin'].includes(currentRole) &&
    (currentUser.all_sites || !Array.isArray(currentUser.allowed_sites));
  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [config, status] = await Promise.all([
        runtimeApi.governance(),
        runtimeApi.health(),
      ]);
      if (!config.success || !config.data)
        throw new Error(config.message || 'Configuration is unavailable.');
      setSla(String(config.data.effective.slaTimeoutMinutes));
      setHold(String(config.data.effective.stockHoldHours));
      setUpdatedAt(config.data.updatedAt);
      setHealth(status.success ? (status as any).data || status : null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to load configuration.'
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await runtimeApi.saveGovernance({
        slaTimeoutMinutes: Number(sla),
        stockHoldHours: Number(hold),
      });
      if (!response.success)
        throw new Error(response.message || 'Configuration was not saved.');
      setUpdatedAt(response.data.updatedAt);
      addToast('success', 'Configuration saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="view-stack space-y-4">
      <div className="page-intro">
        <div>
          <h1 className="page-title">CRM Settings</h1>
          <p className="page-subtitle">
            Current connection status and applied dealership rules.
          </p>
        </div>
        <button className={browseInput} onClick={load}>
          Refresh
        </button>
      </div>
      <BrowseState loading={loading} error={error} empty={false} retry={load} />
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <form className="surface-card p-5 space-y-4" onSubmit={save}>
            <h2 className="font-semibold">Applied rules</h2>
            <label className="block text-sm">
              First response SLA (minutes)
              <input
                required
                disabled={!canEdit || saving}
                className={`${browseInput} block mt-1 w-full`}
                type="number"
                min="1"
                max="1440"
                value={sla}
                onChange={(e) => setSla(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Stock reservation duration (hours)
              <input
                required
                disabled={!canEdit || saving}
                className={`${browseInput} block mt-1 w-full`}
                type="number"
                min="1"
                max="720"
                value={hold}
                onChange={(e) => setHold(e.target.value)}
              />
            </label>
            <p className="text-xs text-slate-500">
              {updatedAt
                ? `Last saved: ${new Date(updatedAt).toLocaleString()}`
                : 'No custom rules have been saved. These are the currently applied service rules.'}
            </p>
            {canEdit ? (
              <button
                disabled={saving || !sla || !hold}
                className="signal-button rounded-lg px-4 py-2"
              >
                {saving ? 'Saving…' : 'Save rules'}
              </button>
            ) : (
              <p className="text-sm text-slate-500">
                An administrator with access to all sites can change these
                rules.
              </p>
            )}
          </form>
          <section className="surface-card p-5 space-y-4">
            <h2 className="font-semibold">Connections and saved data</h2>
            <VirtualyardConnection />
            <dl className="space-y-3 text-sm">
              {Object.entries(health?.databases || {}).map(([key, value]) => (
                <div className="flex justify-between" key={key}>
                  <dt>
                    {key === 'leadCenter'
                      ? 'Lead Centre database'
                      : 'Delivery Centre database'}
                  </dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
              <div className="flex justify-between">
                <dt>Inventory records in this scope</dt>
                <dd>{reference.inventoryCount.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Saved SMS templates</dt>
                <dd>{reference.smsTemplates.length}</dd>
              </div>
            </dl>
            {!health && (
              <p className="text-amber-800 text-sm">
                Connection status is unavailable.
              </p>
            )}
            <p className="text-sm text-slate-500">
              Account roles and site permissions are managed under Users &
              Access.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
