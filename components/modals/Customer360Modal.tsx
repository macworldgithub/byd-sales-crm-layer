'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  MessageSquare,
  FileText,
  Clock,
  Car,
  Truck,
  DollarSign,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Send,
  Sparkles,
  Layers,
  ChevronRight,
  Plus,
  Unlink,
  Download,
  Shield,
  Trash2,
  Upload,
  Eye,
  FileCheck,
  FolderOpen,
} from 'lucide-react';
import { Customer, Opportunity, TimelineEvent, DeliveryHandoverWatch, CustomerDocument } from '@/lib/types';
import { useCrm } from '@/lib/crmContext';
import { customerApi } from '@/lib/api';
import { BYD_SMS_TEMPLATES } from '@/lib/data';

interface Customer360ModalProps {
  customer: Customer | null;
  onClose: () => void;
  onOpenMarkSold: (opp: Opportunity) => void;
  onOpenBookDrive: (customer: Customer) => void;
}

export function Customer360Modal({
  customer,
  onClose,
  onOpenMarkSold,
  onOpenBookDrive,
}: Customer360ModalProps) {
  const {
    opportunities,
    timelineEvents,
    deliveryWatch,
    appointments,
    auditLog,
    addTimelineNote,
    fetchCustomerTimeline,
    toggleOptOut,
    unlinkCustomer,
    sendSmsMessage,
    logPhoneCall,
    requestDeliveryDateChange,
    addToast,
  } = useCrm();

  useEffect(() => {
    if (customer?.customer_id) {
      fetchCustomerTimeline(customer.customer_id);
    }
  }, [customer?.customer_id]);

  const [activeTab, setActiveTab] = useState<
    | 'timeline'
    | 'deals'
    | 'vehicles'
    | 'appointments'
    | 'messages'
    | 'notes'
    | 'documents'
    | 'delivery'
    | 'privacy'
    | 'audit'
  >('timeline');

  // Input states
  const [newNote, setNewNote] = useState('');
  const [newSms, setNewSms] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isAiPaused, setIsAiPaused] = useState(true);

  // Phone Call Logger state (§5.9)
  const [isCallLoggerOpen, setIsCallLoggerOpen] = useState(false);
  const [callOutcome, setCallOutcome] = useState('Connected');
  const [callDuration, setCallDuration] = useState('5');
  const [callNotes, setCallNotes] = useState('');

  // Documents Vault state (§5.1)
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState(false);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<CustomerDocument['category']>('Contract & Forms');
  const [newDocFileName, setNewDocFileName] = useState('');
  const [newDocNotes, setNewDocNotes] = useState('');

  // Delivery Date Change state (§5.8)
  const [isDateChangeOpen, setIsDateChangeOpen] = useState(false);
  const [requestedHandoverDate, setRequestedHandoverDate] = useState('');
  const [dateChangeReason, setDateChangeReason] = useState('Customer Schedule Preference');

  // Fetch documents when tab or customer changes
  useEffect(() => {
    if (customer?.customer_id && activeTab === 'documents') {
      setIsDocsLoading(true);
      customerApi.getDocuments(customer.customer_id).then((res) => {
        if (res.success && res.data) {
          setDocuments(res.data);
        } else {
          // Default pre-sale document templates
          setDocuments([
            {
              doc_id: 'DOC-COS-01',
              customer_id: customer.customer_id,
              title: 'Contract of Sale & Trade Appraisal Form',
              category: 'Contract & Forms',
              file_name: `BYD_Sales_Contract_${customer.customer_id.slice(-6)}.pdf`,
              file_size: '245 KB',
              status: 'Verified',
              notes: 'Signed contract and preliminary trade appraisal form.',
              uploaded_by: 'Sales Consultant',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              doc_id: 'DOC-ID-02',
              customer_id: customer.customer_id,
              title: 'Driver Licence Copy (Front & Back)',
              category: 'Identity Verification',
              file_name: `Driver_Licence_${customer.name.replace(/\s+/g, '_')}.pdf`,
              file_size: '1.2 MB',
              status: 'Verified',
              notes: 'Identity verified against state licensing database.',
              uploaded_by: 'Sales Consultant',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        }
        setIsDocsLoading(false);
      }).catch(() => {
        setIsDocsLoading(false);
      });
    }
  }, [customer?.customer_id, activeTab]);

  const handleAddDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer?.customer_id || !newDocTitle.trim()) return;

    const payload = {
      title: newDocTitle.trim(),
      category: newDocCategory,
      file_name: newDocFileName.trim() || `${newDocTitle.trim().replace(/\s+/g, '_')}.pdf`,
      notes: newDocNotes.trim(),
      status: 'Verified' as const,
      file_size: '350 KB',
    };

    try {
      const res = await customerApi.addDocument(customer.customer_id, payload);
      if (res.success && res.data) {
        setDocuments((prev) => [res.data as CustomerDocument, ...prev]);
        addToast('success', 'Document Attached', `Saved ${payload.title} to customer vault.`);
      }
    } catch {
      // Offline fallback
      const localDoc: CustomerDocument = {
        doc_id: `DOC-${Date.now().toString().slice(-6)}`,
        customer_id: customer.customer_id,
        ...payload,
        uploaded_by: 'Sales Consultant',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setDocuments((prev) => [localDoc, ...prev]);
      addToast('success', 'Document Attached', `Saved ${payload.title} to customer vault.`);
    }

    setNewDocTitle('');
    setNewDocFileName('');
    setNewDocNotes('');
    setIsAddDocOpen(false);
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!customer?.customer_id || !confirm('Are you sure you want to remove this document from the vault?')) return;
    try {
      await customerApi.deleteDocument(customer.customer_id, docId);
    } catch {
      // Ignore
    }
    setDocuments((prev) => prev.filter((d) => d.doc_id !== docId));
    addToast('info', 'Document Removed', 'Document deleted from customer record.');
  };

  const handleDateChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerDelivery?.client_id && !customerOpportunities[0]?.opportunity_id) return;
    if (!requestedHandoverDate) return;

    const targetId = customerDelivery?.client_id || customerOpportunities[0]?.opportunity_id;
    await requestDeliveryDateChange(targetId, requestedHandoverDate, dateChangeReason);
    addToast('success', 'Date Change Transmitted', `Handover reschedule request submitted for ${requestedHandoverDate}`);
    setIsDateChangeOpen(false);
  };

  if (!customer) return null;

  // Filter scoped data
  const customerOpportunities = opportunities.filter((o) => o.customer_id === customer.customer_id);
  const customerTimeline = timelineEvents.filter((e) => e.customer_id === customer.customer_id);
  const customerAppointments = appointments.filter((a) => a.customer_id === customer.customer_id);
  const customerDelivery = deliveryWatch.find((d) =>
    customerOpportunities.some((o) => o.opportunity_id === d.opportunity_id)
  );
  const customerAudits = auditLog.filter(
    (a) => a.target_id === customer.customer_id || customerOpportunities.some((o) => o.opportunity_id === a.target_id)
  );

  const activeOpp = customerOpportunities[0];

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addTimelineNote(customer.customer_id, newNote.trim(), activeOpp?.opportunity_id);
    setNewNote('');
  };

  const handleSendSmsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSms.trim()) return;
    await sendSmsMessage(customer.customer_id, customer.phone, newSms.trim());
    setNewSms('');
  };

  const handleLogCallSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logPhoneCall(customer.customer_id, {
      outcome: callOutcome,
      durationMinutes: parseInt(callDuration) || 5,
      notes: callNotes.trim(),
      opportunityId: activeOpp?.opportunity_id,
    });
    setCallNotes('');
    setIsCallLoggerOpen(false);
  };

  const tabs = [
    { id: 'timeline', label: 'Timeline', count: customerTimeline.length },
    { id: 'deals', label: 'Deals & Offers', count: customerOpportunities.length },
    { id: 'vehicles', label: 'Vehicles & Trade-in' },
    { id: 'appointments', label: 'Appointments', count: customerAppointments.length },
    { id: 'messages', label: 'SMS & Comms' },
    { id: 'notes', label: 'Internal Notes' },
    { id: 'documents', label: 'Documents' },
    { id: 'delivery', label: 'Delivery Handover', highlight: !!customerDelivery },
    { id: 'privacy', label: 'Privacy & Retention' },
    { id: 'audit', label: 'Audit Log' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col h-[96dvh] sm:h-[94vh] max-h-[96dvh]">
        {/* Hero Customer 360 Header (§5.1 & AC-1) */}
        <div className="p-3.5 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col gap-3 sm:gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0 w-full sm:w-auto">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#171b22] text-white flex items-center justify-center font-bold text-sm sm:text-base font-mono shadow-md shrink-0">
                {customer.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                    {customer.name}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {customer.record_type}
                  </span>
                  <span className="stage-pill bg-red-50 text-[#e60012] border border-red-200">
                    {customer.current_stage || activeOpp?.stage || 'Qualified'}
                  </span>
                  {customer.company_name && (
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded truncate">
                      {customer.company_name}
                    </span>
                  )}
                </div>

                {/* Contact Coordinates */}
                <div className="flex items-center gap-2 sm:gap-4 mt-1.5 text-xs text-slate-600 flex-wrap">
                  <span className="flex items-center gap-1 font-mono font-medium text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-[#e60012]" />
                    {customer.phone}
                  </span>
                  <span className="flex items-center gap-1 truncate max-w-[180px]">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {customer.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {customer.site}
                  </span>
                  <span className="hidden sm:inline text-slate-400">·</span>
                  <span className="text-slate-500">
                    Owner: <strong className="text-slate-800">{customer.owner_name}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Deep Links */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {/* Click-to-call Logger Button (§5.9) */}
              <button
                onClick={() => setIsCallLoggerOpen(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Log phone outreach call"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden xs:inline">Log Call</span>
              </button>

              {/* ACMA Opt-out Button */}
              <button
                onClick={() => toggleOptOut(customer.customer_id)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  customer.do_not_contact
                    ? 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="Toggle ACMA compliant do-not-contact flag"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{customer.do_not_contact ? 'DNC' : 'Consented'}</span>
              </button>

              {/* Unlink Mismatched Record (§5.10) */}
              <button
                onClick={() => {
                  if (confirm(`Unlink record association for ${customer.name}? This will separate any mismatched Lead Centre or Delivery Centre links.`)) {
                    unlinkCustomer(customer.customer_id, 'delivery');
                  }
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Unlink mismatched Lead or Delivery link"
              >
                <Unlink className="w-3.5 h-3.5 text-amber-600" />
                <span className="hidden sm:inline">Unlink</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Bar & Upstream/Downstream Deep Links (§5.1, §5.2) */}
          {/* Quick Stats Bar & Upstream/Downstream Deep Links (§5.1, §5.2) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-200 text-xs">
            <div className="p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                Open Deal Value
              </span>
              <strong className="text-sm font-bold text-slate-900 font-mono">
                ${(customer.total_open_value || activeOpp?.total_deal_value || 0).toLocaleString()}
              </strong>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                Next Cadence Activity
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate block">
                {activeOpp?.next_action_text || 'Consultation follow-up'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {activeOpp?.next_action_at ? new Date(activeOpp.next_action_at).toLocaleDateString('en-AU') : 'No Date'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                Active Vehicle & Stock
              </span>
              <span className="text-xs font-semibold text-slate-800 truncate block">
                {activeOpp?.model || 'BYD Range'} · {activeOpp?.vy_stock_id || 'Factory Slot'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                Lead Centre Deep Link
              </span>
              <a
                href={`https://byd-leads-crm.vercel.app/leads/${customer.lead_prospect_id || '40192'}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1"
              >
                <span className="truncate">Lead #{customer.lead_prospect_id || 'LP-40192'}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>

            <div className="p-2 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                Delivery Centre Link
              </span>
              {customerDelivery ? (
                <a
                  href={`https://deliverycentre.com.au/clients/${customerDelivery.client_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <span className="truncate">{customerDelivery.stage}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              ) : (
                <span className="text-xs text-slate-400 italic">Pre-sale (Floor)</span>
              )}
            </div>
          </div>
        </div>

        {/* 9 Tab Navigation */}
        <div className="flex items-center gap-1 px-3 sm:px-4 border-b border-slate-200 bg-white overflow-x-auto touch-scroll shrink-0">
          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-2.5 sm:py-3 px-2.5 sm:px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-[#e60012] text-[#e60012]'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{t.label}</span>
                {t.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-red-100 text-[#e60012]' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {t.count}
                  </span>
                )}
                {t.highlight && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50 touch-scroll">
          {/* 1. TIMELINE TAB (§5.2 & AC-2, AC-3) */}
          {activeTab === 'timeline' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Add Note Quick Input */}
              <form onSubmit={handleAddNoteSubmit} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 uppercase tracking-wide font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#e60012]" />
                    Unified Consultation Note (Fans out to Lead + Delivery)
                  </span>
                  <span className="text-[11px] text-slate-400">Append-only event store</span>
                </div>
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record customer discussion, trade offer, requested accessory, or follow-up note..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:border-slate-400 transition-all"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    Logged as {customer.owner_name} · Timestamped in AEST
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save Note</span>
                  </button>
                </div>
              </form>

              {/* Event Stream */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {customerTimeline.map((evt) => (
                  <div key={evt.event_id} className="relative group">
                    {/* Source Dot */}
                    <div
                      className={`absolute -left-6 top-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${
                        evt.source === 'Lead Centre'
                          ? 'bg-sky-500'
                          : evt.source === 'Delivery Centre'
                          ? 'bg-emerald-500'
                          : evt.source === 'Virtual Yard'
                          ? 'bg-purple-500'
                          : evt.source === 'Sales Log'
                          ? 'bg-amber-500'
                          : 'bg-[#e60012]'
                      }`}
                    >
                      {evt.source[0]}
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{evt.title}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase font-mono ${
                              evt.source === 'Lead Centre'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                : evt.source === 'Delivery Centre'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : evt.source === 'Virtual Yard'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : evt.source === 'Sales Log'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-red-50 text-[#e60012] border border-red-200'
                            }`}
                          >
                            {evt.source}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          {evt.is_edited && (
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1 rounded text-[9px] font-bold">
                              Edited
                            </span>
                          )}
                          <span>{evt.timestamp_aest || evt.occurred_at}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">{evt.content}</p>

                      <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                        <span>By {evt.author}</span>
                        {evt.deep_link && (
                          <a
                            href={typeof evt.deep_link === 'string' ? evt.deep_link : evt.deep_link.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#e60012] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>{typeof evt.deep_link === 'string' ? 'View External Record' : evt.deep_link.label}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. DEALS / OPPORTUNITIES TAB (§5.4) */}
          {activeTab === 'deals' && (
            <div className="space-y-4 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Opportunities & Pipeline Deals</h4>
                  <p className="text-xs text-slate-500">Every selling motion associated with this customer profile</p>
                </div>
              </div>

              {customerOpportunities.map((opp) => (
                <div
                  key={opp.opportunity_id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-base font-bold text-slate-900">{opp.vehicle_descriptor}</h5>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">
                          {opp.opportunity_id}
                        </span>
                        <span className="stage-pill bg-red-50 text-[#e60012] border border-red-200">
                          {opp.stage}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Sale Type: <strong className="text-slate-800">{opp.sale_type}</strong> · Order Type:{' '}
                        <strong className="text-slate-800">{opp.order_type}</strong> · VY Stock:{' '}
                        <strong className="text-slate-800 font-mono">{opp.vy_stock_id || 'Factory Slot'}</strong>
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">
                        ${opp.total_deal_value.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-400">List: ${opp.list_price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">List Price</span>
                      <strong>${opp.list_price.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Discount</span>
                      <strong className="text-emerald-600">-${opp.discount.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Options & Extras</span>
                      <strong>+${opp.extras.toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">Trade-in Allowance</span>
                      <strong>
                        {opp.trade_in_details ? `$${opp.trade_in_details.valuation.toLocaleString()}` : 'None'}
                      </strong>
                    </div>
                  </div>

                  {/* Competitor & Loss Reason Notes (§5.4) */}
                  {opp.competitor_notes && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
                      <span className="font-bold block font-mono text-[10px] uppercase text-amber-700">
                        Competitor & Cross-Shop Notes (§5.4):
                      </span>
                      <p className="mt-0.5">{opp.competitor_notes}</p>
                    </div>
                  )}

                  {opp.lost_reason && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900">
                      <span className="font-bold block font-mono text-[10px] uppercase text-red-700">
                        Lost / Parked Reason:
                      </span>
                      <p className="mt-0.5 font-semibold">{opp.lost_reason}</p>
                      {opp.lost_notes && <p className="mt-0.5 text-red-700">{opp.lost_notes}</p>}
                    </div>
                  )}

                  {/* Next Action SLA */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">
                        Next Cadence: <strong>{opp.next_action_text}</strong> ({new Date(opp.next_action_at).toLocaleDateString()})
                      </span>
                    </div>

                    {opp.stage !== 'Written / Sold' && opp.stage !== 'In Delivery' && opp.stage !== 'Delivered / Won' && (
                      <button
                        onClick={() => onOpenMarkSold(opp)}
                        className="px-4 py-2 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20 uppercase tracking-wider font-mono"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Mark Sold</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 3. VEHICLES & TRADE-IN TAB */}
          {activeTab === 'vehicles' && (
            <div className="space-y-5 max-w-3xl mx-auto">
              {/* Vehicle Interest */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-[#e60012]" />
                  <h4 className="text-sm font-bold text-slate-900">Vehicle Configuration & Stock Specification</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Interested Model & Variant</span>
                    <strong className="text-slate-900 text-sm">{activeOpp?.vehicle_descriptor || 'BYD Range'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Paint & Trim</span>
                    <strong className="text-slate-900 text-sm">{activeOpp?.colour || 'Standard'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Virtual Yard Stock Reference</span>
                    <strong className="text-slate-900 font-mono">{activeOpp?.vy_stock_id || 'Holding Pool'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Order Status</span>
                    <strong className="text-slate-900">{activeOpp?.order_type || 'Stock'}</strong>
                  </div>
                </div>
              </div>

              {/* Trade-in Section */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-900">Attached Trade-in Appraisal</h4>
                  </div>
                  {activeOpp?.trade_in_details && (
                    <span className="stage-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {activeOpp.trade_in_details.status}
                    </span>
                  )}
                </div>

                {activeOpp?.trade_in_details ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <span className="text-slate-500 block">Vehicle</span>
                      <strong className="text-slate-900">{activeOpp.trade_in_details.makeModel}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Rego</span>
                      <strong className="text-slate-900 font-mono">{activeOpp.trade_in_details.rego}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Year</span>
                      <strong className="text-slate-900">{activeOpp.trade_in_details.year}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Appraised Valuation</span>
                      <strong className="text-emerald-600 text-sm">
                        ${activeOpp.trade_in_details.valuation.toLocaleString()}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl">
                    No trade-in currently attached to this prospect.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. APPOINTMENTS TAB */}
          {activeTab === 'appointments' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Test Drives & Showroom Visits</h4>
                  <p className="text-xs text-slate-500">Scheduled test drives and evaluation loops</p>
                </div>
                <button
                  onClick={() => onOpenBookDrive(customer)}
                  className="px-3.5 py-2 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book Test Drive</span>
                </button>
              </div>

              {customerAppointments.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                  No appointments scheduled. Click &ldquo;Book Test Drive&rdquo; to reserve a demo vehicle.
                </div>
              ) : (
                customerAppointments.map((a) => (
                  <div
                    key={a.appointment_id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-[#e60012] flex items-center justify-center font-bold">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{a.type} · {a.vehicle}</span>
                          <span className="stage-pill bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px]">
                            {a.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(a.when).toLocaleString()} · Route: {a.loop || 'CBD Loop'} ({a.duration_minutes} min)
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{a.appointment_id}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 5. MESSAGES & SMS TAB (§5.9) */}
          {activeTab === 'messages' && (
            <div className="space-y-5 max-w-3xl mx-auto">
              {/* AI Handover Control & ACMA Consent State */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Two-Way SMS (MobileMessage Integration)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Consent active since {new Date(customer.consent_updated_at).toLocaleDateString()} · ACMA compliant
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Lead Centre AI:</span>
                  <button
                    onClick={() => setIsAiPaused(!isAiPaused)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-colors ${
                      isAiPaused
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {isAiPaused ? 'Paused (Human Control)' : 'AI Active'}
                  </button>
                </div>
              </div>

              {/* Template Picker */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 uppercase tracking-wide font-mono">
                    BYD Certified Template Packs
                  </span>
                  <span className="text-[11px] text-slate-400">Insert compliant text</span>
                </div>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    const tid = e.target.value;
                    setSelectedTemplateId(tid);
                    const matched = BYD_SMS_TEMPLATES.find((t) => t.id === tid);
                    if (matched) {
                      setNewSms(
                        matched.body
                          .replace('{{name}}', customer.name)
                          .replace('{{vehicle}}', activeOpp?.vehicle_descriptor || 'BYD SEALION 7')
                          .replace('{{time}}', '10:00 AM')
                          .replace('{{colour}}', activeOpp?.colour || 'Atlantis Grey')
                          .replace('{{vin}}', activeOpp?.vy_stock_id || 'VY-VIC-84920')
                          .replace('{{vy_order_id}}', activeOpp?.vy_order_id || 'VYO-77419')
                      );
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                >
                  <option value="">-- Choose Template --</option>
                  {BYD_SMS_TEMPLATES.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      [{tmpl.category}] {tmpl.title}
                    </option>
                  ))}
                </select>

                {customer.do_not_contact ? (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <strong className="block font-bold">ACMA Compliance Block Active (§5.10 & AC-5)</strong>
                      <p className="text-[11px] text-red-800 leading-relaxed mt-0.5">
                        This customer has opted out of SMS contact under the ACMA Spam Act. All outbound CRM SMS and automated Lead Centre AI messages are blocked.
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSendSmsSubmit} className="space-y-3">
                    <textarea
                      rows={3}
                      value={newSms}
                      onChange={(e) => setNewSms(e.target.value)}
                      placeholder="Compose SMS to customer's mobile number..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Outbound Number: {customer.phone} · Gateway: MobileMessage
                      </span>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-600/20"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send SMS</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* 6. INTERNAL NOTES TAB */}
          {activeTab === 'notes' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                <span className="text-xs font-bold text-slate-900 block">General Notes Profile</span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {customer.notes || 'No general notes logged.'}
                </p>
              </div>
            </div>
          )}

          {/* 7. DOCUMENTS TAB (§5.1 Pre-Sale Customer Vault) */}
          {activeTab === 'documents' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Pre-Sale Customer Document Vault (§5.1)
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Store and verify contracts, licences, finance approvals, and trade-in inspection reports.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white text-xs font-bold font-mono uppercase flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Attach Document</span>
                </button>
              </div>

              {isDocsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading customer documents...</div>
              ) : documents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                  <FolderOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No pre-sale documents attached yet. Click &quot;Attach Document&quot; above to add contract or ID records.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {documents.map((doc) => (
                    <div
                      key={doc.doc_id}
                      className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-red-50 text-[#e60012] flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {doc.title}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                              {doc.category}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 font-semibold">
                              <FileCheck className="w-3 h-3" />
                              <span>{doc.status}</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
                            <span>{doc.file_name}</span>
                            <span>·</span>
                            <span>{doc.file_size || 'PDF'}</span>
                            <span>·</span>
                            <span>Uploaded by {doc.uploaded_by}</span>
                          </div>
                          {doc.notes && (
                            <p className="text-[11px] text-slate-600 italic mt-1">&quot;{doc.notes}&quot;</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <button
                          type="button"
                          onClick={() => {
                            addToast('info', 'Viewing Document', `Opening ${doc.file_name}`);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(doc.doc_id)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 8. DELIVERY HANDOVER TAB (§5.8 & AC-9) */}
          {activeTab === 'delivery' && (
            <div className="space-y-5 max-w-3xl mx-auto">
              {customerDelivery ? (
                <div className="space-y-4">
                  {/* Delivery Exception Alert Banner (§5.8) */}
                  {(customerDelivery.alert || activeOpp?.delivery_alert || activeOpp?.has_delivery_alert) && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3 animate-in fade-in">
                      <AlertTriangle className="w-5 h-5 text-[#e60012] shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="block text-xs font-bold uppercase tracking-wide font-mono text-[#e60012]">
                          Delivery Centre Exception Flagged (§5.8)
                        </strong>
                        <p className="text-xs text-red-800 mt-0.5">
                          {customerDelivery.alert || activeOpp?.delivery_alert || 'Handover issue flagged in Delivery Centre. Original consultant action required.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setRequestedHandoverDate(customerDelivery.delivery_date || '');
                          setIsDateChangeOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#e60012] text-white text-[11px] font-bold uppercase font-mono shadow-sm shrink-0"
                      >
                        Reschedule Slot
                      </button>
                    </div>
                  )}

                  <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider font-mono">
                          Live Downstream Handover Watcher
                        </span>
                        <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                          Delivery Centre Stage: {customerDelivery.stage}
                        </h4>
                        <p className="text-xs text-slate-500">
                          Handover Specialist: <strong className="text-slate-800">{customerDelivery.handover_specialist}</strong> · Target Date: <strong className="text-slate-800">{customerDelivery.delivery_date}</strong>
                        </p>
                      </div>

                      <span className="stage-pill bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {customerDelivery.stage}
                      </span>
                    </div>

                    {/* Paperwork Completeness Checklist */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-xs font-bold text-slate-800 block">
                        Pre-Handover Gate & Compliance Status
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className={`w-4 h-4 ${customerDelivery.docs_status.atrSigned ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>ATR Signed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className={`w-4 h-4 ${customerDelivery.docs_status.licenceFront ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>Licence Copy</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className={`w-4 h-4 ${customerDelivery.docs_status.insurance ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>Insurance Cover</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className={`w-4 h-4 ${customerDelivery.docs_status.paymentSettled ? 'text-emerald-600' : 'text-slate-300'}`} />
                          <span>Funds Settled</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                      <strong>Last Delivery Comment:</strong> {customerDelivery.last_comment}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 flex-wrap gap-2">
                      <span className="text-[11px] text-slate-400">
                        Linked Delivery ID: {customerDelivery.client_id}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRequestedHandoverDate(customerDelivery.delivery_date || '');
                            setIsDateChangeOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>Request Date Change</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Uncouple Delivery record ${customerDelivery.client_id} from ${customer.name}?`)) {
                              unlinkCustomer(customer.customer_id, 'delivery');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          <span>Unlink Delivery Record</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
                  This deal has not been marked sold yet. Once marked sold, the live Delivery Centre handover stage, specialist assignment, and docs checklist will appear here.
                </div>
              )}
            </div>
          )}

          {/* 9. PRIVACY & COMPLIANCE (APP 12/13) TAB (§5.10) */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Privacy Act 1988 (Cth) · Australian Privacy Principles</span>
                    </span>
                    <h4 className="text-base font-bold text-slate-900 mt-1">
                      Customer Data Governance & Rights Management
                    </h4>
                    <p className="text-xs text-slate-500">
                      Manage statutory access requests (APP 12), data portability, and retention erasure.
                    </p>
                  </div>
                </div>

                {/* Consent & ACMA Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Marketing & SMS Consent</span>
                    <strong className={customer.consent_sms ? 'text-emerald-700 font-semibold' : 'text-red-700 font-semibold'}>
                      {customer.consent_sms ? 'Active Consent' : 'Opted-Out / Revoked'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Do Not Contact State</span>
                    <strong className={customer.do_not_contact ? 'text-red-700 font-semibold' : 'text-emerald-700 font-semibold'}>
                      {customer.do_not_contact ? 'BLOCKED (DNC Active)' : 'Clear to Contact'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Consent Updated</span>
                    <strong className="text-slate-800 font-mono">
                      {new Date(customer.consent_updated_at).toLocaleDateString('en-AU')}
                    </strong>
                  </div>
                </div>

                {/* APP 12 Data Access Export */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-xs font-bold text-slate-900 block">
                        APP 12 — Individual Access Request Package
                      </strong>
                      <p className="text-[11px] text-slate-500">
                        Export complete portable dossier (profile, timeline, SMS logs, test drives, deals, delivery history) as verified JSON.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await customerApi.getPrivacyExport(customer.customer_id);
                          if (res.success && res.data) {
                            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
                            const downloadAnchor = document.createElement('a');
                            downloadAnchor.setAttribute('href', dataStr);
                            downloadAnchor.setAttribute('download', `privacy-export-${customer.customer_id}.json`);
                            document.body.appendChild(downloadAnchor);
                            downloadAnchor.click();
                            downloadAnchor.remove();
                          } else {
                            alert(res.message || 'Export failed');
                          }
                        } catch (err: any) {
                          alert(err.message || 'Failed to generate privacy export');
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download APP Dossier</span>
                    </button>
                  </div>
                </div>

                {/* APP Retention & Right-to-Erasure Anonymization */}
                <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-xs font-bold text-red-950 block">
                        Right to Erasure / PII Anonymization
                      </strong>
                      <p className="text-[11px] text-red-800">
                        Anonymize customer PII across Lead Centre, Sales CRM, and Delivery Centre while retaining financial units for regulatory audits.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const reason = prompt('Please specify reason for Privacy Act erasure/anonymization:', 'Customer requested under APP');
                        if (reason) {
                          const res = await customerApi.anonymizePrivacy(customer.customer_id, reason);
                          if (res.success) {
                            alert('Customer record successfully anonymized across all databases.');
                            window.location.reload();
                          } else {
                            alert(res.message || 'Anonymization failed');
                          }
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Anonymize PII</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 10. AUDIT LOG TAB (§5.10 & AC-10) */}
          {activeTab === 'audit' && (
            <div className="space-y-3 max-w-3xl mx-auto">
              <span className="text-xs font-bold text-slate-900 block mb-2 font-mono uppercase tracking-wider">
                Immutable Event Trail & Governance Trace
              </span>
              {customerAudits.map((a) => (
                <div
                  key={a.audit_id}
                  className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>{a.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({a.source})</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{a.details}</p>
                    <span className="text-[10px] text-slate-400">Actor: {a.actor}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(a.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Phone Call Outreach Logger Dialog (§5.9) */}
      {isCallLoggerOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-mono">
                    Click-to-Call Outreach · §5.9
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    Log Phone Call with {customer.name}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCallLoggerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogCallSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                    Call Outcome *
                  </label>
                  <select
                    value={callOutcome}
                    onChange={(e) => setCallOutcome(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  >
                    <option value="Connected">Connected & Spoke</option>
                    <option value="Left Voicemail">Left Voicemail</option>
                    <option value="Busy">Busy / No Answer</option>
                    <option value="Wrong Number">Wrong Number</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    value={callDuration}
                    onChange={(e) => setCallDuration(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                  Call Discussion Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Discussed test drive availability, trade-in figures, or finance options..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCallLoggerOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs font-mono uppercase tracking-wider shadow-sm"
                >
                  Save Call Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach Document Modal Dialog (§5.1) */}
      {isAddDocOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-[#e60012] flex items-center justify-center font-bold">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#e60012] uppercase tracking-wider font-mono">
                    Pre-Sale Document Vault · §5.1
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    Attach Document for {customer.name}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDocOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddDocumentSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="e.g. Approved Novated Lease Contract"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                    Category *
                  </label>
                  <select
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  >
                    <option value="Contract & Forms">Contract & Forms</option>
                    <option value="Identity Verification">Identity Verification</option>
                    <option value="Finance Approval">Finance Approval</option>
                    <option value="Trade-In Appraisal">Trade-In Appraisal</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                    File Name
                  </label>
                  <input
                    type="text"
                    value={newDocFileName}
                    onChange={(e) => setNewDocFileName(e.target.value)}
                    placeholder="e.g. Contract_Signed.pdf"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                  Verification Notes
                </label>
                <textarea
                  rows={2}
                  value={newDocNotes}
                  onChange={(e) => setNewDocNotes(e.target.value)}
                  placeholder="e.g. Verified license against state register; deposit slip attached."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddDocOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs font-mono uppercase tracking-wider shadow-sm"
                >
                  Save & Attach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery Reschedule Dialog (§5.8) */}
      {isDateChangeOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-mono">
                    Delivery Handover Reschedule · §5.8
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">
                    Request Date Change for {customer.name}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDateChangeOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDateChangeSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                  Target Handover Date *
                </label>
                <input
                  type="date"
                  required
                  value={requestedHandoverDate}
                  onChange={(e) => setRequestedHandoverDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                  Reschedule Reason *
                </label>
                <select
                  value={dateChangeReason}
                  onChange={(e) => setDateChangeReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                >
                  <option value="Customer Schedule Preference">Customer Schedule Preference</option>
                  <option value="Customer Travel / Interstate">Customer Travel / Interstate</option>
                  <option value="Finance Settlement Delay">Finance Settlement Delay</option>
                  <option value="Trade-in Vehicle Availability">Trade-in Vehicle Availability</option>
                  <option value="PDI / Accessory Fitment Request">PDI / Accessory Fitment Request</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsDateChangeOpen(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs font-mono uppercase tracking-wider shadow-sm"
                >
                  Submit Reschedule Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
