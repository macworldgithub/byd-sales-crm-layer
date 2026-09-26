'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Filter,
  FileText,
  Users,
  DollarSign,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { syncApi, opportunityApi, customerApi } from '@/lib/api';

export function ReportsView() {
  const { selectedSite, salesLog, opportunities, customers, addToast } = useCrm();
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel'>('csv');
  const [dateRange, setDateRange] = useState('mtd');

  const totalSalesUnits = salesLog.length;
  const totalSalesGross = salesLog.reduce((acc, s) => acc + (s.gross || 0), 0);
  const reconciledUnits = salesLog.filter((s) => s.reconciled).length;
  const reconcileRate = totalSalesUnits > 0 ? Math.round((reconciledUnits / totalSalesUnits) * 100) : 100;

  const handleDownload = (type: 'saleslog' | 'opportunities' | 'customers') => {
    let url = '';
    const siteParam = selectedSite !== 'All Sites' ? selectedSite : undefined;

    if (type === 'saleslog') {
      url = syncApi.exportSalesLogCsvUrl({ site: siteParam });
    } else if (type === 'opportunities') {
      url = opportunityApi.exportOpportunitiesCsvUrl({ site: siteParam });
    } else if (type === 'customers') {
      url = customerApi.exportCustomersCsvUrl({ site: siteParam });
    }

    if (url) {
      window.open(url, '_blank');
      addToast('success', 'Export Dispatched', `Generating official CSV export for ${type} under site: ${selectedSite}`);
    }
  };

  return (
    <div className="view-stack space-y-6">
      {/* Page Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#e60012]" />
            Harmony Executive Reporting & OEM Review Hub (§5.5, §5.7)
          </span>
          <h1 className="page-title mt-1">Official OEM & Audit Reports</h1>
          <p className="page-subtitle">
            Generate and export reconciled sales ledgers, pipeline health reports, and privacy-compliant customer registries for OEM Harmony reviews.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-sm font-mono">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Scope: {selectedSite}</span>
          </div>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Written Deals MTD</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{totalSalesUnits}</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Units Sold
            </span>
          </div>
        </div>

        <div className="card p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Realised Gross Profit</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">${(totalSalesGross / 1000).toFixed(1)}k</span>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Avg $4.8k / unit
            </span>
          </div>
        </div>

        <div className="card p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Finance Reconciliation</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{reconcileRate}%</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {reconciledUnits} / {totalSalesUnits} Reconciled
            </span>
          </div>
        </div>

        <div className="card p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Active Opportunities</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{opportunities.length}</span>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              In Pipeline
            </span>
          </div>
        </div>
      </div>

      {/* Export Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Sales Log Finance Ledger */}
        <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Sales Log Finance Export</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Full finance ledger containing deal numbers, VIN, stock IDs, gross margin, deposit, and reconciliation status for Harmony Auto audits.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between"><span>Format:</span><span className="font-semibold text-slate-800">UTF-8 BOM (.CSV)</span></div>
              <div className="flex justify-between"><span>Rows:</span><span className="font-semibold text-slate-800">{salesLog.length} Records</span></div>
              <div className="flex justify-between"><span>Timestamps:</span><span className="font-semibold text-slate-800">AEST / Australian</span></div>
            </div>
          </div>
          <button
            onClick={() => handleDownload('saleslog')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#171b22] hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Sales Log (.CSV)</span>
          </button>
        </div>

        {/* Module 2: Opportunity Pipeline */}
        <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Pipeline & Forecasting Export</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Complete snapshot of all active, won, and lost deals, including models, competitor loss notes, expected close dates, and sales consultants.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between"><span>Format:</span><span className="font-semibold text-slate-800">UTF-8 BOM (.CSV)</span></div>
              <div className="flex justify-between"><span>Rows:</span><span className="font-semibold text-slate-800">{opportunities.length} Records</span></div>
              <div className="flex justify-between"><span>Attributes:</span><span className="font-semibold text-slate-800">Pipeline Stages & Ageing</span></div>
            </div>
          </div>
          <button
            onClick={() => handleDownload('opportunities')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#171b22] hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Export Opportunities (.CSV)</span>
          </button>
        </div>

        {/* Module 3: Customer Registry & Consent */}
        <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Customer 360 Registry</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Customer identity register including normalized E.164 Australian phone numbers, ACMA opt-out status, and external system mapping keys.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between"><span>Format:</span><span className="font-semibold text-slate-800">UTF-8 BOM (.CSV)</span></div>
              <div className="flex justify-between"><span>Rows:</span><span className="font-semibold text-slate-800">{customers.length} Records</span></div>
              <div className="flex justify-between"><span>Compliance:</span><span className="font-semibold text-slate-800">ACMA & Privacy Act</span></div>
            </div>
          </div>
          <button
            onClick={() => handleDownload('customers')}
            className="mt-6 w-full py-2.5 px-4 rounded-xl bg-[#171b22] hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-purple-400" />
            <span>Export Customers (.CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
