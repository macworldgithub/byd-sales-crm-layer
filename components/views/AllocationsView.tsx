'use client';

import React, { useState, useEffect } from 'react';
import {
  Inbox,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Send,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { AllocationItem, Customer } from '@/lib/types';
import { ALL_USERS } from '@/lib/data';
import { PaginationControls } from '@/components/ui/PaginationControls';

interface AllocationsViewProps {
  onSelectCustomer: (customer: Customer) => void;
}

export function AllocationsView({ onSelectCustomer }: AllocationsViewProps) {
  const {
    allocations,
    allocationsPagination,
    fetchAllocations,
    customers,
    currentUser,
    selectedSite,
    createAllocation,
    acceptAllocation,
    reassignAllocation,
    requestMoreLeads,
    addToast,
  } = useCrm();

  const [reassignModalAlloc, setReassignModalAlloc] = useState<AllocationItem | null>(null);
  const [targetConsultant, setTargetConsultant] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Direct Intake Modal State
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [intakeName, setIntakeName] = useState('');
  const [intakePhone, setIntakePhone] = useState('');
  const [intakeEmail, setIntakeEmail] = useState('');
  const [intakeVehicle, setIntakeVehicle] = useState('BYD Seal');
  const [intakeConsultant, setIntakeConsultant] = useState(currentUser.name);
  const [isSubmittingIntake, setIsSubmittingIntake] = useState(false);

  const consultants = ALL_USERS.filter((u) => u.role === 'consultant');

  useEffect(() => {
    fetchAllocations({
      page: currentPage,
      limit: pageSize,
      site: selectedSite !== 'All Sites' ? selectedSite : undefined,
    });
  }, [currentPage, pageSize, selectedSite, fetchAllocations]);

  const handleReassignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalAlloc || !targetConsultant) return;
    reassignAllocation(reassignModalAlloc.allocation_id, targetConsultant);
    setReassignModalAlloc(null);
  };

  const handleDirectIntakeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeName || !intakePhone) return;
    setIsSubmittingIntake(true);
    try {
      await createAllocation({
        lead_prospect_id: `LP-${Date.now().toString().slice(-6)}`,
        name: intakeName,
        phone: intakePhone,
        email: intakeEmail,
        vehicle: intakeVehicle,
        assigned_to: intakeConsultant || currentUser.name,
        dealership: selectedSite !== 'All Sites' ? selectedSite : currentUser.site,
        source: 'Direct Intake / BDC Push',
        intent_summary: `Direct walk-in / BDC intake inquiry for ${intakeVehicle}. Immediate contact requested.`,
        urgency: 'high',
      });
      setShowIntakeModal(false);
      setIntakeName('');
      setIntakePhone('');
      setIntakeEmail('');
    } finally {
      setIsSubmittingIntake(false);
    }
  };

  return (
    <div className="view-stack">
      {/* Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#e60012]" />
            Upstream Handshake · Lead Centre Intake (§5.3)
          </span>
          <h1 className="page-title mt-1">Allocation Inbox & SLA Queue</h1>
          <p className="page-subtitle">
            Pre-qualified inbound prospects pushed from Lead Centre AI and BDC. 15-minute response SLA clock starts on allocation to stop lead decay.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowIntakeModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 shadow-sm uppercase tracking-wider font-mono"
          >
            <Plus className="w-4 h-4 text-[#e60012]" />
            <span>Direct Intake (BDC Push)</span>
          </button>
          <button
            onClick={requestMoreLeads}
            className="signal-button w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md uppercase tracking-wider font-mono"
          >
            <Sparkles className="w-4 h-4" />
            <span>Request More Leads</span>
          </button>
        </div>
      </div>

      {/* AC-11 Quarantine & Production Guard Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs shadow-sm flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white flex items-center gap-1.5 flex-wrap">
              Production Mode Active · Lead Centre Sandbox Quarantined (§5.10 & AC-11)
            </span>
            <span className="text-[11px] text-slate-300 block sm:inline">
              Demo-dataset records (~4,036 attachment prospects) are isolated from production CRM. Only live verified customer records are allocated to sales floor desks.
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 shrink-0">
          Zero Bleed Guard
        </span>
      </div>

      {/* SLA Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Pending First Touch
            </span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">
              {allocations.filter((a) => a.status === 'pending').length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              SLA Breaches (Escalated to Floor Mgr)
            </span>
            <div className="text-2xl font-bold text-red-600 mt-0.5">
              {allocations.filter((a) => a.status === 'escalated').length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#e60012] flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
              Accepted Today (Fairfield Desk)
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-0.5">
              {allocations.filter((a) => a.status === 'accepted').length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Allocation Queue */}
      <div className="surface-card">
        <div className="card-header-row">
          <div>
            <span className="text-[10px] font-bold text-[#e60012] uppercase tracking-wider font-mono">
              Live Inbound Stream
            </span>
            <h3 className="section-title text-xl">Assigned Prospects Queue</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {allocations.length} allocated prospects
          </span>
        </div>

        <div className="p-4 space-y-4">
          {allocations.map((alloc) => (
            <div
              key={alloc.allocation_id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                alloc.status === 'escalated'
                  ? 'border-red-300 bg-red-50/30'
                  : alloc.status === 'accepted'
                  ? 'border-slate-200 bg-white'
                  : 'border-amber-200 bg-amber-50/20'
              }`}
            >
              {/* Header Info */}
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h4 className="text-base font-bold text-slate-900">{alloc.prospect_name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {alloc.allocation_id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-[#e60012] font-mono">
                      AI Intent: {alloc.ai_score}/100
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                      Source: {alloc.source}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 mt-1.5 text-xs text-slate-600 flex-wrap">
                    <span className="font-mono font-medium">{alloc.phone}</span>
                    <span>·</span>
                    <span className="truncate max-w-[200px]">{alloc.email}</span>
                    <span>·</span>
                    <span className="font-semibold text-slate-800">{alloc.vehicle}</span>
                  </div>
                </div>

                {/* SLA Clock Badge (§5.3 & AC-4) */}
                <div className="text-right shrink-0">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono ${
                      alloc.status === 'escalated'
                        ? 'bg-red-500 text-white animate-pulse'
                        : alloc.status === 'accepted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {alloc.status === 'escalated'
                        ? 'SLA BREACHED (Overdue)'
                        : alloc.status === 'accepted'
                        ? 'SLA Met · Active'
                        : '15m SLA Window'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                    Allocated: {new Date(alloc.allocated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Last SMS Summary Payload */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                  Lead Centre Two-Way Conversation Context
                </span>
                <p className="text-slate-700 italic leading-relaxed">
                  &ldquo;{alloc.last_sms_summary}&rdquo;
                </p>
                {alloc.appointment_booked && (
                  <div className="pt-1 text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Test Drive Scheduled: {alloc.appointment_booked}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2.5 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-slate-500">Current Owner:</span>
                  <strong className="text-slate-900">{alloc.assigned_to}</strong>
                  <a
                    href={`https://byd-leads-crm.vercel.app/leads/${alloc.lead_prospect_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#e60012] hover:underline flex items-center gap-1 font-semibold ml-1 sm:ml-2"
                  >
                    <span>Lead Centre</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                  {alloc.status !== 'accepted' && (
                    <button
                      onClick={() => acceptAllocation(alloc.allocation_id)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 font-mono uppercase tracking-wider min-w-[140px]"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Accept SLA</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setReassignModalAlloc(alloc);
                      setTargetConsultant(consultants[0]?.name || '');
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs text-center"
                  >
                    Reassign
                  </button>

                  <button
                    onClick={() => {
                      const cust = customers.find((c) => c.customer_id === alloc.customer_id);
                      if (cust) onSelectCustomer(cust);
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs text-center"
                  >
                    Customer 360
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        pagination={allocationsPagination}
        currentPage={currentPage}
        totalItems={allocationsPagination?.total ?? allocations.length}
        pageSize={pageSize}
        pageSizeOptions={[5, 10, 20]}
        itemLabel="allocations"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
      />

      {/* Reassign Modal */}
      {reassignModalAlloc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              Reassign {reassignModalAlloc.prospect_name}
            </h4>
            <p className="text-xs text-slate-500">
              Route lead to a different sales consultant in the Harmony network.
            </p>
            <form onSubmit={handleReassignSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                  Select Consultant
                </label>
                <select
                  value={targetConsultant}
                  onChange={(e) => setTargetConsultant(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                >
                  {consultants.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.site})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReassignModalAlloc(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs font-mono uppercase"
                >
                  Confirm Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Intake / BDC Push Modal (§5.3 & AC-4) */}
      {showIntakeModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#e60012] font-bold">
                  Lead Intake Handshake (§5.3)
                </span>
                <h3 className="text-base font-bold text-slate-900">Direct Inbound Lead Push</h3>
              </div>
              <button
                onClick={() => setShowIntakeModal(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectIntakeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. David Morrison"
                  value={intakeName}
                  onChange={(e) => setIntakeName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="04xx xxx xxx"
                    value={intakePhone}
                    onChange={(e) => setIntakePhone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="david@example.com"
                    value={intakeEmail}
                    onChange={(e) => setIntakeEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vehicle Model
                  </label>
                  <select
                    value={intakeVehicle}
                    onChange={(e) => setIntakeVehicle(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  >
                    <option value="BYD Seal">BYD Seal</option>
                    <option value="BYD Atto 3">BYD Atto 3</option>
                    <option value="BYD Sealion 6">BYD Sealion 6</option>
                    <option value="BYD Sealion 7">BYD Sealion 7</option>
                    <option value="BYD Shark 6">BYD Shark 6</option>
                    <option value="BYD Dolphin">BYD Dolphin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Consultant
                  </label>
                  <select
                    value={intakeConsultant}
                    onChange={(e) => setIntakeConsultant(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  >
                    {consultants.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} ({c.site})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                <p>
                  <strong>SLA Policy:</strong> Upon creation, a 15-minute response SLA timer begins immediately. If unaccepted, the floor manager will be alerted.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIntake}
                  className="px-4 py-2 rounded-xl bg-[#e60012] hover:bg-[#c40010] text-white font-bold text-xs font-mono uppercase tracking-wider shadow-sm flex items-center gap-1.5"
                >
                  {isSubmittingIntake ? 'Allocating...' : 'Push to Sales Floor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
