'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Download,
  Filter,
  FileCheck2,
  Lock,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { AuditLogEntry } from '@/lib/types';
import { PaginationControls } from '@/components/ui/PaginationControls';

export function AuditView() {
  const { auditLog, customers, addToast } = useCrm();

  const [searchFilter, setSearchFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const filteredLogs = auditLog.filter((a) => {
    if (sourceFilter !== 'All' && a.source !== sourceFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchActor = a.actor.toLowerCase().includes(q);
      const matchAction = a.action.toLowerCase().includes(q);
      const matchDetails = a.details.toLowerCase().includes(q);
      const matchTarget = a.target_id.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchDetails && !matchTarget) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const optOutCount = customers.filter((c) => c.do_not_contact).length;

  const handleExportAudit = () => {
    const headers = 'AuditID,Actor,Action,TargetType,TargetID,Details,Source,Timestamp\n';
    const rows = filteredLogs
      .map(
        (a) =>
          `"${a.audit_id}","${a.actor}","${a.action}","${a.target_type}","${a.target_id}","${a.details}","${a.source}","${a.timestamp}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BYD_CRM_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Audit Trail Exported', 'Downloaded compliance log for regulatory record-keeping.');
  };

  return (
    <div className="view-stack">
      {/* Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#e60012]" />
            Governance & ACMA Compliance (§5.10 & AC-10)
          </span>
          <h1 className="page-title mt-1">Audit Trail & Compliance Log</h1>
          <p className="page-subtitle">
            Every deal stage progression, stock reservation, customer merge, and mark-sold action is immutably audited. Privacy Act 1988 (APP) & ACMA spam consent tracking.
          </p>
        </div>

        <button
          onClick={handleExportAudit}
          className="signal-button w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md uppercase tracking-wider font-mono"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Compliance Overview Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Privacy & Consent Status
            </span>
            <div className="text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5" />
              <span>ACMA Compliant</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Global unsubscribe propagation &lt; 5 mins
            </span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Global Opt-Out Registry
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {optOutCount} customers
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Auto-halted in Lead Centre AI & CRM SMS
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Total Audited Events
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {auditLog.length} events
            </div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Signed & timestamped in AEST
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
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
              onChange={(e) => {
                setSearchFilter(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search actor, action, target ID, details..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <select
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none"
          >
            <option value="All">All Systems ({auditLog.length})</option>
            <option value="Sales CRM">Sales CRM</option>
            <option value="Lead Centre">Lead Centre</option>
            <option value="Delivery Centre">Delivery Centre</option>
            <option value="Virtual Yard">Virtual Yard</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-400 shrink-0 text-right sm:text-left pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          Showing {Math.min(filteredLogs.length, (currentPage - 1) * pageSize + 1)} to{' '}
          {Math.min(currentPage * pageSize, filteredLogs.length)} of {filteredLogs.length} records
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Audit ID</th>
                <th className="py-3 px-4">Timestamp (UTC/AEST)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4">Source System</th>
                <th className="py-3 px-4">Detailed Audit Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginatedLogs.map((entry) => (
                <tr key={entry.audit_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {entry.audit_id}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{entry.actor}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{entry.action}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                      {entry.target_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{entry.target_id}</td>
                  <td className="py-3.5 px-4">
                    <span className="stage-pill bg-slate-100 text-slate-700 border border-slate-200 text-[9px]">
                      {entry.source}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-md truncate">
                    {entry.details}
                  </td>
                </tr>
              ))}
              {paginatedLogs.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No compliance audit logs match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        currentPage={currentPage}
        totalItems={filteredLogs.length}
        pageSize={pageSize}
        pageSizeOptions={[10, 15, 30, 50]}
        itemLabel="events"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
