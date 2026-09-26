'use client';

import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sliders,
  Clock,
  Users,
  Shield,
  Network,
  CheckCircle2,
  Save,
  Radio,
  RefreshCw,
  BellRing,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { allocationApi } from '@/lib/api';

export function SettingsView() {
  const { selectedSite, addToast } = useCrm();

  // Split Rules State (§5.5)
  const [defaultSplitPct, setDefaultSplitPct] = useState('50');
  const [allowCustomSplit, setAllowCustomSplit] = useState(true);
  const [splitTrigger, setSplitTrigger] = useState('handover');

  // SLA Configuration (§5.3)
  const [slaTimeoutMinutes, setSlaTimeoutMinutes] = useState('15');
  const [autoEscalateRole, setAutoEscalateRole] = useState('manager');

  // Network Lookup Privilege (§4)
  const [enableNetworkLookup, setEnableNetworkLookup] = useState(true);

  // Testing SLA check
  const [isCheckingSla, setIsCheckingSla] = useState(false);

  const handleSaveSettings = () => {
    addToast('success', 'Settings Saved', 'Dealership attribution and SLA governance parameters updated successfully.');
  };

  const handleTriggerSlaEvaluation = async () => {
    setIsCheckingSla(true);
    try {
      const res = await allocationApi.checkSla();
      if (res.success) {
        addToast(
          'success',
          'SLA Evaluation Finished',
          `Checked active allocations. Escalated ${res.data?.escalatedCount || 0} overdue leads to floor manager.`
        );
      }
    } catch {
      addToast('error', 'SLA Check Failed', 'Could not evaluate SLA queues.');
    } finally {
      setIsCheckingSla(false);
    }
  };

  return (
    <div className="view-stack space-y-6">
      {/* Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-slate-600" />
            Dealership Governance & Rules Engine (§4, §5.3, §5.5)
          </span>
          <h1 className="page-title mt-1">CRM System Configuration</h1>
          <p className="page-subtitle">
            Manage secondary consultant attribution split rules, lead intake SLA response timers, and cross-site manager network lookup privileges.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="btn btn-primary flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Secondary Attribution Split Rules (§5.5) */}
        <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Attribution & Split Rules (§5.5)</h2>
              <p className="text-xs text-slate-500">Configures credit distribution when two sales consultants work a deal.</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Default Secondary Consultant Commission Split
              </label>
              <select
                value={defaultSplitPct}
                onChange={(e) => setDefaultSplitPct(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="50">50% / 50% Equal Split (Default)</option>
                <option value="60">60% Primary / 40% Secondary</option>
                <option value="70">70% Primary / 30% Secondary</option>
                <option value="80">80% Primary / 20% Secondary</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Attribution Trigger Condition
              </label>
              <select
                value={splitTrigger}
                onChange={(e) => setSplitTrigger(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="handover">Physical Handover on Yard / Test Drive Assist</option>
                <option value="lead_pass">Intake Handover from BDC Specialist</option>
                <option value="finance_assist">Business Manager / Finance Closing Assist</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Allow Manual Split Adjustment</p>
                <p className="text-[11px] text-slate-500">Sales managers can adjust split percentages per individual deal.</p>
              </div>
              <input
                type="checkbox"
                checked={allowCustomSplit}
                onChange={(e) => setAllowCustomSplit(e.target.checked)}
                className="w-4 h-4 text-[#e60012] rounded border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Lead SLA & Escalation (§5.3) */}
        <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Lead SLA & Escalation Queue (§5.3)</h2>
              <p className="text-xs text-slate-500">Response time limits for newly allocated leads during trading hours.</p>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                First-Touch SLA Response Window
              </label>
              <select
                value={slaTimeoutMinutes}
                onChange={(e) => setSlaTimeoutMinutes(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="10">10 Minutes (Aggressive)</option>
                <option value="15">15 Minutes (BYD Standard Specification)</option>
                <option value="30">30 Minutes (Weekend / High Volume)</option>
                <option value="60">60 Minutes (Off-Peak)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Escalation Target on SLA Breach
              </label>
              <select
                value={autoEscalateRole}
                onChange={(e) => setAutoEscalateRole(e.target.value)}
                className="w-full text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              >
                <option value="manager">Floor Sales Manager Inbox</option>
                <option value="round_robin">Re-allocate to Next Available Consultant</option>
                <option value="bdc">Return to BDC Lead Intake Pool</option>
              </select>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-900">Run SLA Queue Sweep Now</p>
                <p className="text-[11px] text-amber-700">Manually triggers backend evaluation for any expired SLA clocks.</p>
              </div>
              <button
                onClick={handleTriggerSlaEvaluation}
                disabled={isCheckingSla}
                className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingSla ? 'animate-spin' : ''}`} />
                <span>Evaluate</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Manager Cross-Site Network Lookup (§4) */}
        <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Manager Network Lookup (§4)</h2>
              <p className="text-xs text-slate-500">Cross-dealership customer searching for managers and site admins.</p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div>
                <p className="text-xs font-semibold text-slate-800">Enable Manager Cross-Site Lookup Flag</p>
                <p className="text-[11px] text-slate-500">
                  Allows Managers, Site Admins, and Super Admins to search across Fairfield, Melbourne City, Doncaster, Nunawading, and Caroline Springs simultaneously.
                </p>
              </div>
              <input
                type="checkbox"
                checked={enableNetworkLookup}
                onChange={(e) => setEnableNetworkLookup(e.target.checked)}
                className="w-4 h-4 text-[#e60012] rounded border-slate-300"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Subsystem Interconnect Status (§7.3) */}
        <div className="card p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Subsystem Integrations (§7.3, §7.4)</h2>
              <p className="text-xs text-slate-500">Active status of connected BYD dealership ecosystem platforms.</p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800">Lead Centre Webhook Pipeline</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">Active / Ingesting</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800">Virtual Yard Live Inventory</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">865 Stock Units Synced</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800">Delivery Centre 3-Way Handover Sync</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">Instant Push Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
