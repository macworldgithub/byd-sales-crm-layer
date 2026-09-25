'use client';

import React, { useState } from 'react';
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
import { useCrm } from '@/lib/crmContext';
import { CONSULTANT_SCORES } from '@/lib/data';

export function TeamScoreboardView() {
  const { selectedSite, addToast, boardTeam, updateConsultantTarget } = useCrm();
  const [siteFilter, setSiteFilter] = useState<string>('All');

  // Target Quota Modal State
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [targetConsultant, setTargetConsultant] = useState('Alex Rivers');
  const [targetUnitsInput, setTargetUnitsInput] = useState(16);
  const [isSavingTarget, setIsSavingTarget] = useState(false);

  // Merge live boardTeam consultants if available
  const baseScores = (boardTeam && Array.isArray(boardTeam.consultants) && boardTeam.consultants.length > 0)
    ? boardTeam.consultants
    : CONSULTANT_SCORES;

  const filteredConsultants = baseScores.filter((c: any) => {
    if (siteFilter !== 'All' && c.site !== siteFilter) return false;
    return true;
  });

  const totalDepartmentUnits = filteredConsultants.reduce((s: number, c: any) => s + (c.written_units_mtd || 0), 0);
  const totalDepartmentTarget = filteredConsultants.reduce((s: number, c: any) => s + (c.target_units || 16), 0);
  const totalDepartmentGross = filteredConsultants.reduce((s: number, c: any) => s + (c.written_gross_mtd || 0), 0);

  const handleExportCsv = () => {
    const headers = 'Consultant,Site,WrittenUnitsMTD,TargetUnits,PacePct,WrittenGrossMTD,ConversionRatePct,AvgFirstTouchMin,OpenDeals\n';
    const rows = filteredConsultants
      .map(
        (c: any) =>
          `"${c.name}","${c.site}",${c.written_units_mtd},${c.target_units},${Math.round((c.written_units_mtd / (c.target_units || 1)) * 100)},${c.written_gross_mtd},${c.conversion_rate_pct},${c.avg_first_touch_minutes},${c.open_deals_count}`
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
      await updateConsultantTarget(targetConsultant, Number(targetUnitsInput));
      setIsQuotaModalOpen(false);
    } finally {
      setIsSavingTarget(false);
    }
  };

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
            onChange={(e) => setSiteFilter(e.target.value)}
            className="flex-1 sm:flex-initial text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium outline-none shadow-sm min-w-[140px]"
          >
            <option value="All">All Showroom Sites</option>
            <option value="Fairfield">Fairfield</option>
            <option value="Melbourne City">Melbourne City</option>
            <option value="Doncaster">Doncaster</option>
            <option value="Nunawading">Nunawading</option>
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
            <span className="text-slate-400 font-semibold">/ {totalDepartmentTarget} Target</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold block pt-1 font-mono">
            {Math.round((totalDepartmentUnits / (totalDepartmentTarget || 1)) * 100)}% of Network Quota Run-Rate
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Total Written Gross Profit (Est.)
          </span>
          <div className="text-3xl font-bold text-slate-900 font-mono">
            ${totalDepartmentGross.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 block pt-1">
            Avg Profit: ${(totalDepartmentGross / (totalDepartmentUnits || 1)).toFixed(0)} / written contract
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Funnel Conversion Rate
          </span>
          <div className="text-3xl font-bold text-emerald-600 font-mono">38.4%</div>
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
                const pacePct = Math.round(((rep.written_units_mtd || 0) / (rep.target_units || 16)) * 100);
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
                      <span className="text-slate-400 font-normal">/ {rep.target_units || 16}</span>
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
                        <span className="font-mono font-bold text-[11px]">{pacePct}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ${(rep.written_gross_mtd || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">
                      {rep.conversion_rate_pct || 25}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {rep.avg_first_touch_minutes || 11} min
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-bold">
                      {rep.open_deals_count || 4}
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
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sales Consultant / Scope</label>
                <select
                  value={targetConsultant}
                  onChange={(e) => setTargetConsultant(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none"
                >
                  <option value="Alex Rivers">Alex Rivers (Fairfield)</option>
                  <option value="Sophie Tran">Sophie Tran (Melbourne City)</option>
                  <option value="Jordan Vance">Jordan Vance (Doncaster)</option>
                  <option value="Chloe Bennett">Chloe Bennett (Nunawading)</option>
                  <option value="Site Target">Entire Department Target</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Units (Monthly)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
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
                  disabled={isSavingTarget}
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
