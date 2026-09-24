'use client';

import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Phone, Mail, Building2, MapPin } from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { CustomerRecordType, SiteLocation } from '@/lib/types';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExisting?: (existingCustomer: any) => void;
}

export function AddCustomerModal({ isOpen, onClose, onSelectExisting }: AddCustomerModalProps) {
  const { customers, selectedSite, addCustomer } = useCrm();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [recordType, setRecordType] = useState<CustomerRecordType>('Individual');
  const [companyName, setCompanyName] = useState('');
  const [site, setSite] = useState<SiteLocation>(
    selectedSite !== 'All Sites' ? selectedSite : 'Fairfield'
  );
  const [source, setSource] = useState<'Walk-in' | 'Carsales' | 'Virtual Yard' | 'Autogate' | 'Web'>('Walk-in');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Duplicate Check (§5.1)
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const duplicateMatch = cleanPhone.length >= 8
    ? customers.find((c) => c.phone.replace(/[^0-9+]/g, '') === cleanPhone)
    : email.trim().length >= 4
    ? customers.find((c) => c.email.toLowerCase() === email.trim().toLowerCase())
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Name and phone number are required.');
      return;
    }

    // Normalise AU phone to E.164 (+61)
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith('04')) {
      formattedPhone = '+61' + formattedPhone.substring(1);
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+61' + formattedPhone;
    }

    await addCustomer({
      name: name.trim(),
      phone: formattedPhone,
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      record_type: recordType,
      company_name: companyName.trim() || undefined,
      site,
      source,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-[#e60012] flex items-center justify-center font-bold">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#e60012] uppercase tracking-wider font-mono">
                Customer 360 Record
              </span>
              <h3 className="text-lg font-bold text-slate-900">Create New Customer</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Warning Prompt (§5.1) */}
        {duplicateMatch && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs flex-1">
              <strong className="block font-bold">Duplicate Match Detected</strong>
              <p className="mt-0.5">
                A customer already exists with this phone/email:{' '}
                <strong>{duplicateMatch.name}</strong> ({duplicateMatch.site} · {duplicateMatch.customer_id}).
              </p>
              {onSelectExisting && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectExisting(duplicateMatch);
                  }}
                  className="mt-2 text-xs font-bold text-amber-800 underline hover:text-amber-950"
                >
                  Open Existing Customer Record ›
                </button>
              )}
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
              Full Name or Contact Person *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sarah Mitchell"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                AU Mobile Number *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="0412 890 234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Email Address
              </label>
              <input
                type="email"
                placeholder="sarah.m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Record Type (§5.1)
              </label>
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value as CustomerRecordType)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Individual">Individual Buyer</option>
                <option value="Company">Company / Business</option>
                <option value="Fleet">Fleet / Novated Lease Entity</option>
                <option value="Household">Household (Related Buyers)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Preferred Dealership
              </label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value as SiteLocation)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              >
                <option value="Fairfield">Fairfield</option>
                <option value="Melbourne City">Melbourne City</option>
                <option value="Doncaster">Doncaster</option>
                <option value="Nunawading">Nunawading</option>
                <option value="Caroline Springs">Caroline Springs</option>
              </select>
            </div>
          </div>

          {(recordType === 'Company' || recordType === 'Fleet') && (
            <div>
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
                Company / Organization Name
              </label>
              <input
                type="text"
                placeholder="e.g. Apex Logistics Pty Ltd"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
              Inbound Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            >
              <option value="Walk-in">Showroom Walk-in</option>
              <option value="Carsales">Carsales.com.au</option>
              <option value="Virtual Yard">Virtual Yard / Web Inventory</option>
              <option value="Autogate">Autogate</option>
              <option value="Web">BYD Official Website</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block mb-1 font-mono">
              Initial Notes & Consultation Context
            </label>
            <textarea
              rows={2}
              placeholder="Vehicle interest, timeline, trade-in intention..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#e60012] hover:bg-[#c91c2f] text-white font-bold text-xs shadow-md shadow-red-600/20 font-mono uppercase tracking-wider"
            >
              Create Customer Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
