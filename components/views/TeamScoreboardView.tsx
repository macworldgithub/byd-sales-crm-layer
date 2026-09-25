'use client';

import React from 'react';
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
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { CONSULTANT_SCORES } from '@/lib/data';

export function TeamScoreboardView() {
  const { selectedSite, addToast } = useCrm();
  const [siteFilter, setSiteFilter] = React.useState<string>('All');

  const filteredConsultants = CONSULTANT_SCORES.filter((c) => {
    if (siteFilter !== 'All' && c.site !== siteFilter) return false;
    return true;
  });

  const totalDepartmentUnits = filteredConsultants.reduce((s, c) => s + c.written_units_mtd, 0);
  const totalDepartmentTarget = filteredConsultants.reduce((s, c) => s + c.target_units, 0);
  const totalDepartmentGross = filteredConsultants.reduce((s, c) => s + c.written_gross_mtd, 0);

  const handleExportCsv = () => {
    const headers = 'Consultant,Site,WrittenUnitsMTD,TargetUnits,PacePct,WrittenGrossMTD,ConversionRatePct,AvgFirstTouchMin,OpenDeals\n';
    const rows = filteredConsultants
      .map(
        (c) =>
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
            <span className="text-slate-500 font-semibold">/ {totalDepartmentTarget} Target</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-[#e60012] h-full rounded-full"
              style={{ width: `${Math.round((totalDepartmentUnits / totalDepartmentTarget) * 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 block pt-1">
            {Math.round((totalDepartmentUnits / totalDepartmentTarget) * 100)}% of monthly target achieved
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Total Written Gross Revenue
          </span>
          <div className="text-3xl font-bold text-slate-900 font-mono">
            ${totalDepartmentGross.toLocaleString()}
          </div>
          <span className="text-[11px] text-emerald-600 block pt-1 font-semibold">
            Pacing +8.4% above previous month
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Network Conversion Funnel
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
              {filteredConsultants.sort((a, b) => b.written_units_mtd - a.written_units_mtd).map((rep, idx) => {
                const pacePct = Math.round((rep.written_units_mtd / rep.target_units) * 100);
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
                      {rep.written_units_mtd}{' '}
                      <span className="text-slate-400 font-normal">/ {rep.target_units}</span>
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
                      ${rep.written_gross_mtd.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">
                      {rep.conversion_rate_pct}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {rep.avg_first_touch_minutes} min
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-900 font-bold">
                      {rep.open_deals_count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
