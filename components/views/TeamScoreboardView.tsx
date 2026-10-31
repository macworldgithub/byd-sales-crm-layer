'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Trophy,
  TrendingUp,
  Target,
  Clock,
  Car,
  DollarSign,
  Building2,
  Users,
  CheckCircle2,
  Download,
  Filter,
  Sliders,
  X,
  Send,
} from 'lucide-react';
import { useCrm, matchesSite } from '@/lib/crmContext';

export function TeamScoreboardView() {
  const { selectedSite, addToast, boardTeam, updateConsultantTarget, reference, sites, setSelectedSite, dataErrors, fetchScoreboards } = useCrm();
  const [siteFilter, setSiteFilter] = useState<string>(() => (selectedSite !== 'All Sites' ? selectedSite : 'All'));

  useEffect(() => {
    if (selectedSite && selectedSite !== 'All Sites') {
      setSiteFilter(selectedSite);
    } else {
      setSiteFilter('All');
    }
  }, [selectedSite]);

  // Target Quota Modal State
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [targetConsultant, setTargetConsultant] = useState('');
  const [targetUnitsInput, setTargetUnitsInput] = useState<number | ''>('');
  const [targetYard, setTargetYard] = useState(selectedSite === 'All Sites' ? '' : selectedSite);
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  const baseScores = Array.isArray(boardTeam?.consultants) ? boardTeam.consultants : [];

  const filteredConsultants = baseScores.filter((c: any) => {
    if (siteFilter !== 'All' && !matchesSite(c.site, siteFilter)) return false;
    return true;
  });


  const totalDepartmentUnits = filteredConsultants.reduce((s: number, c: any) => s + (c.written_units_mtd || 0), 0);
  const totalDepartmentTarget = filteredConsultants.some((c: any) => c.target_units != null) ? filteredConsultants.reduce((s: number, c: any) => s + (c.target_units ?? 0), 0) : null;
  const totalDepartmentGross = filteredConsultants.some((row: any) => row.written_gross_mtd == null) ? null : filteredConsultants.reduce((sum: number, row: any) => sum + row.written_gross_mtd, 0);

  const handleExportCsv = () => {
    const headers = 'Consultant,Site,WrittenUnitsMTD,TargetUnits,PacePct,WrittenGrossMTD,ConversionRatePct,AvgFirstTouchMin,OpenDeals\n';
    const rows = filteredConsultants
      .map(
        (c: any) =>
          `"${c.name}","${c.site}",${c.written_units_mtd},${c.target_units ?? ''},${c.pace_pct ?? ''},${c.written_gross_mtd ?? ''},${c.conversion_rate_pct ?? ''},${c.avg_first_touch_minutes ?? ''},${c.open_deals_count}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BYD_Sales_Performance_Leaderboard_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'OEM Scoreboard Exported', 'CSV download initiated for Harmony Auto & BYD OEM management reviews.');
  };

  const handleSaveQuota = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingTarget(true);
    try {
      if (await updateConsultantTarget(targetConsultant, Number(targetUnitsInput), targetYard)) setIsQuotaModalOpen(false);
    } finally {
      setIsSavingTarget(false);
    }
  };

  if (!Array.isArray(boardTeam?.consultants)) return (
    <div className="surface-card p-6 space-y-3">
      <h1 className="page-title">Department Performance</h1>
      <p>{dataErrors['Team scoreboard'] || 'Loading saved performance records…'}</p>
      {dataErrors['Team scoreboard'] && <button className="signal-button px-4 py-2" onClick={() => void fetchScoreboards()}>Retry</button>}
    </div>
  );

  return (
    <div className="view-stack">
      {/* Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#e60012]" />
            Manager Console · Department & Rep Scoreboards (§5.5 & AC-6)
          </span>
          <h1 className="page-title mt-1">Department Performance & Leaderboards</h1>
          <p className="page-subtitle">
            Live written unit delivery, monthly target pace, funnel conversion rates, and SLA responsiveness across the Harmony Auto sales network.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <select
            value={siteFilter}
            onChange={(e) => { setSiteFilter(e.target.value); setSelectedSite(e.target.value === 'All' ? 'All Sites' : e.target.value); }}
            className="flex-1 sm:flex-initial text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium outline-none shadow-sm min-w-[160px]"
          >
            <option value="All">All Sites & Yards</option>
            {sites.map(site => <option key={site} value={site}>{site}</option>)}
          </select>

          <button
            onClick={() => setIsQuotaModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Set Quota Targets</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="signal-button flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md uppercase tracking-wider font-mono min-w-[120px]"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Network Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Network Written Units (MTD)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">{totalDepartmentUnits}</span>
            <span className="text-slate-400 font-semibold">/ {totalDepartmentTarget ?? 'Not set'} Target</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block pt-1 font-mono">
            {totalDepartmentTarget ? `${Math.round(totalDepartmentUnits / totalDepartmentTarget * 100)}% of saved targets` : 'No targets configured'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Recorded Written Gross Profit
          </span>
          <div className="text-3xl font-bold text-slate-900 font-mono">
            {totalDepartmentGross == null ? '—' : `$${totalDepartmentGross.toLocaleString()}`}
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">
            Avg Profit: {totalDepartmentGross == null || !totalDepartmentUnits ? '—' : `$${(totalDepartmentGross / totalDepartmentUnits).toFixed(0)}`} / written contract
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Funnel Conversion Rate
          </span>
          <div className="text-3xl font-bold text-emerald-600 font-mono">{boardTeam?.averageConversionRate == null ? '—' : `${boardTeam.averageConversionRate}%`}</div>
          <span className="text-[11px] text-slate-500 block pt-1">
            Lead Centre Allocation › Test Drive › Contract
          </span>
        </div>
      </div>

      {/* Consultant Leaderboard Table (§5.5) */}
      <div className="surface-card overflow-hidden">
        <div className="card-header-row">
          <div>
            <span className="text-[10px] font-bold text-[#e60012] uppercase tracking-wider font-mono">
              Individual Sales Tracking
            </span>
            <h3 className="section-title text-xl">Consultant Leaderboard</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">Current Month Pacing</span>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Consultant</th>
                <th className="py-3 px-4">Showroom Site</th>
                <th className="py-3 px-4">Written Units (MTD)</th>
                <th className="py-3 px-4">Target Pace (%)</th>
                <th className="py-3 px-4 font-mono">Written Gross</th>
                <th className="py-3 px-4">Conversion (%)</th>
                <th className="py-3 px-4">Avg First Touch</th>
                <th className="py-3 px-4 text-right">Open Deals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredConsultants.sort((a: any, b: any) => (b.written_units_mtd || 0) - (a.written_units_mtd || 0)).map((rep: any, idx: number) => {
                const pacePct = rep.pace_pct ?? 0;
                return (
                  <tr key={rep.name} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {idx === 0 ? (
                          <Trophy className="w-4 h-4 text-amber-500" />
                        ) : (
                          <span className="w-4 text-center text-slate-400">#{idx + 1}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <strong className="text-slate-900 text-xs block">{rep.name}</strong>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{rep.site}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {rep.written_units_mtd || 0}{' '}
                      <span className="text-slate-400 font-normal">/ {rep.target_units ?? 'Not set'}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              pacePct >= 100 ? 'bg-emerald-500' : 'bg-[#e60012]'
                            }`}
                            style={{ width: `${Math.min(pacePct, 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px]">{rep.pace_pct == null ? 'Not set' : `${pacePct}%`}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {rep.written_gross_mtd == null ? '—' : `$${rep.written_gross_mtd.toLocaleString()}`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">
                      {rep.conversion_rate_pct == null ? '—' : `${rep.conversion_rate_pct}%`}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {rep.avg_first_touch_minutes ?? '—'} min
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-bold">
                      {rep.open_deals_count ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Target Quota Modal */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 space-y-4 animate-in fade-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Manager Override</p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">Adjust Monthly Target Quota</h3>
              </div>
              <button
                onClick={() => setIsQuotaModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuota} className="space-y-3.5">
              <label className="block text-xs font-semibold">Yard<select required value={targetYard} className="w-full p-2.5 border rounded-lg mt-1" onChange={event => setTargetYard(event.target.value)}><option value="">Select yard</option>{sites.map(site => <option key={site} value={site}>{site}</option>)}</select></label>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sales Consultant / Scope</label>
                <select
                  value={targetConsultant}
                  onChange={(e) => setTargetConsultant(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                >
                  <option value="">Select consultant</option>
                  {baseScores.map((row: any) => <option key={`${row.name}:${row.site}`} value={row.name}>{row.name} ({row.site})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Units (Monthly)</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={targetUnitsInput}
                  onChange={(e) => setTargetUnitsInput(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold font-mono outline-none focus:border-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuotaModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingTarget || !targetConsultant || !targetYard || targetUnitsInput === ''}
                  className="signal-button px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  {isSavingTarget ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Target className="w-3.5 h-3.5" />
                  )}
                  <span>Persist Target Quota</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
