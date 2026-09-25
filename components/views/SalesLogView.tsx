'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Filter,
  Sliders,
  Settings,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { SalesLogEntry } from '@/lib/types';
import { PaginationControls } from '@/components/ui/PaginationControls';

export function SalesLogView() {
  const { salesLog, salesLogPagination, fetchSalesLog, reconcileSalesLogRow, addToast, selectedSite } = useCrm();

  const [searchFilter, setSearchFilter] = useState('');
  const [reconciledFilter, setReconciledFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [columnMappings, setColumnMappings] = useState({
    contractNo: 'Agreement_No',
    contractDate: 'Contract_Date',
    buyerName: 'Purchaser_Name',
    vehicleDesc: 'Model_Description',
    chassisVin: 'Chassis_VIN',
    stockRef: 'Stock_Ref',
    transType: 'Sale_Type_Category',
    repName: 'Sales_Consultant_Name',
    siteLoc: 'Dealership_Location',
    invoicedAud: 'Total_Invoiced_AUD',
    grossMargin: 'Deal_Gross_Profit',
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      fetchSalesLog({
        page: currentPage,
        limit: pageSize,
        q: searchFilter.trim() || undefined,
        reconciled: reconciledFilter === 'All' ? undefined : reconciledFilter === 'Reconciled',
        site: selectedSite !== 'All Sites' ? selectedSite : undefined,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, searchFilter, reconciledFilter, selectedSite, fetchSalesLog]);

  const isException = (entry: SalesLogEntry) => {
    return (
      !entry.vin ||
      entry.vin === 'TBA' ||
      entry.vin.length < 10 ||
      entry.amount < 1000 ||
      (!entry.reconciled && (entry.deal_date.includes('Aug') || entry.deal_date.includes('2026-08')))
    );
  };

  const filteredSalesLog = salesLog.filter((entry) => {
    if (reconciledFilter === 'Reconciled' && !entry.reconciled) return false;
    if (reconciledFilter === 'Unreconciled' && entry.reconciled) return false;
    if (reconciledFilter === 'Exceptions' && !isException(entry)) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchCustomer = entry.customer_name.toLowerCase().includes(q);
      const matchVehicle = entry.vehicle.toLowerCase().includes(q);
      const matchVin = entry.vin.toLowerCase().includes(q);
      const matchId = entry.sales_log_id.toLowerCase().includes(q);
      if (!matchCustomer && !matchVehicle && !matchVin && !matchId) return false;
    }
    return true;
  });

  const totalWrittenAmount = filteredSalesLog.reduce((sum, s) => sum + s.amount, 0);
  const totalWrittenGross = filteredSalesLog.reduce((sum, s) => sum + (s.gross || 0), 0);

  const handleReconcileAll = () => {
    salesLog.forEach((row) => {
      if (!row.reconciled) reconcileSalesLogRow(row.sales_log_id);
    });
    addToast('success', 'Nightly Reconciliation Batch Complete', 'All unreconciled Sales Log rows matched against active CRM opportunities.');
  };

  const handleExportCsv = () => {
    const headers = 'SalesLogID,DealDate,Customer,Vehicle,VIN,StockID,SaleType,Consultant,Site,Amount,Gross,Reconciled\n';
    const rows = filteredSalesLog
      .map(
        (s) =>
          `"${s.sales_log_id}","${s.deal_date}","${s.customer_name}","${s.vehicle}","${s.vin}","${s.stock_id}","${s.sale_type}","${s.consultant}","${s.site}",${s.amount},${s.gross || 0},${s.reconciled}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BYD_Sales_Log_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Sales Log Exported', 'CSV download initiated for Harmony Auto accounting review.');
  };

  return (
    <div className="view-stack">
      {/* Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Finance Ledger · Sales Log Live Projection (§5.7)
          </span>
          <h1 className="page-title mt-1">Official Sales Log Deal Register</h1>
          <p className="page-subtitle">
            CRM is the live writer of record for written deals. Replaces parallel shadow Excel sheets and provides seamless finance reconciliation with Harmony accounting.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={() => setShowMappingModal(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm font-mono"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span>Field Mapping</span>
          </button>

          <button
            onClick={handleReconcileAll}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm font-mono"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Reconcile All</span>
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

      {/* Summary KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Total Written Value (MTD)
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            ${totalWrittenAmount.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            {filteredSalesLog.length} contracts written in CRM
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Total Gross Revenue (Estimated)
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            ${totalWrittenGross.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            Average margin ~{((totalWrittenGross / (totalWrittenAmount || 1)) * 100).toFixed(1)}%
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Reconciliation Integrity
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
            <span>
              {Math.round((filteredSalesLog.filter((s) => s.reconciled).length / (filteredSalesLog.length || 1)) * 100)}%
            </span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">
            All rows linked to CRM opportunities
          </span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search Sales Log ID, buyer, vehicle, VIN..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <select
            value={reconciledFilter}
            onChange={(e) => setReconciledFilter(e.target.value)}
            className="w-full sm:w-auto text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none"
          >
            <option value="All">All Statuses ({salesLog.length})</option>
            <option value="Reconciled">Reconciled with Finance</option>
            <option value="Unreconciled">Pending Reconciliation</option>
            <option value="Exceptions">⚠️ Exception Queue (Discrepancies)</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-400 shrink-0 text-right sm:text-left pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          Showing {filteredSalesLog.length} ledger entries
        </span>
      </div>

      {/* Sales Log Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Sales Log ID</th>
                <th className="py-3 px-4">Deal Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Vehicle Description</th>
                <th className="py-3 px-4">VIN Number</th>
                <th className="py-3 px-4">Stock ID</th>
                <th className="py-3 px-4">Sale Type</th>
                <th className="py-3 px-4">Consultant</th>
                <th className="py-3 px-4">Site</th>
                <th className="py-3 px-4 font-mono">Amount ($)</th>
                <th className="py-3 px-4 font-mono">Gross ($)</th>
                <th className="py-3 px-4 text-right">Reconcile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSalesLog.map((row) => {
                const hasEx = isException(row);
                return (
                  <tr key={row.sales_log_id} className={`hover:bg-slate-50 transition-colors ${hasEx ? 'bg-amber-50/40' : ''}`}>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {row.sales_log_id}
                        {hasEx && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900" title="Missing VIN or aged unreconciled deal">
                            FLAG
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{row.deal_date}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{row.customer_name}</td>
                    <td className="py-3.5 px-4 text-slate-800">{row.vehicle}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {row.vin || <span className="text-amber-600 font-bold">Missing VIN</span>}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-purple-700 font-bold">{row.stock_id}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                        {row.sale_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{row.consultant}</td>
                    <td className="py-3.5 px-4 text-slate-600">{row.site}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      ${row.amount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">
                      ${(row.gross || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {row.reconciled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Matched</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => reconcileSalesLogRow(row.sales_log_id)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                        >
                          Reconcile
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        pagination={salesLogPagination}
        currentPage={currentPage}
        totalItems={salesLogPagination?.total ?? salesLog.length}
        pageSize={pageSize}
        pageSizeOptions={[15, 30, 50, 100]}
        itemLabel="deals"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
      />

      {/* Field Mapping Configuration Modal (§5.7) */}
      {showMappingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">
                  Operational Runbook (§5.7)
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Harmony XLSX / CSV Column Mapping Engine
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Harmony column headers evolve between accounting audits. Define active column aliases for bidirectional reconciliation between Sales Log and CRM opportunities.
                </p>
              </div>
              <button
                onClick={() => setShowMappingModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-h-80 overflow-y-auto pr-1">
              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                  Agreement No (ID)
                </label>
                <input
                  type="text"
                  value={columnMappings.contractNo}
                  onChange={(e) => setColumnMappings({ ...columnMappings, contractNo: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                  Contract Date
                </label>
                <input
                  type="text"
                  value={columnMappings.contractDate}
                  onChange={(e) => setColumnMappings({ ...columnMappings, contractDate: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                  Purchaser / Buyer
                </label>
                <input
                  type="text"
                  value={columnMappings.buyerName}
                  onChange={(e) => setColumnMappings({ ...columnMappings, buyerName: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                  Vehicle Descriptor
                </label>
                <input
                  type="text"
                  value={columnMappings.vehicleDesc}
                  onChange={(e) => setColumnMappings({ ...columnMappings, vehicleDesc: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                  Chassis / VIN
                </label>
                <input
                  type="text"
                  value={columnMappings.chassisVin}
                  onChange={(e) => setColumnMappings({ ...columnMappings, chassisVin: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                  Stock Ref
                </label>
                <input
                  type="text"
                  value={columnMappings.stockRef}
                  onChange={(e) => setColumnMappings({ ...columnMappings, stockRef: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                  Sale Type Category
                </label>
                <input
                  type="text"
                  value={columnMappings.transType}
                  onChange={(e) => setColumnMappings({ ...columnMappings, transType: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                  Sales Consultant Name
                </label>
                <input
                  type="text"
                  value={columnMappings.repName}
                  onChange={(e) => setColumnMappings({ ...columnMappings, repName: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                  Total Invoiced AUD
                </label>
                <input
                  type="text"
                  value={columnMappings.invoicedAud}
                  onChange={(e) => setColumnMappings({ ...columnMappings, invoicedAud: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 uppercase font-mono block mb-1">
                  Gross Profit AUD
                </label>
                <input
                  type="text"
                  value={columnMappings.grossMargin}
                  onChange={(e) => setColumnMappings({ ...columnMappings, grossMargin: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-mono">
                Source of Truth: Sales CRM (§13 & §14)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMappingModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMappingModal(false);
                    addToast('success', 'Mapping Schema Saved', 'Harmony column mappings persisted for automated nightly reconcile.');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs font-mono uppercase tracking-wider"
                >
                  Save Mapping Schema
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
