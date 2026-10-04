'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserPlus,
  GitMerge,
  Filter,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { Customer, CustomerRecordType } from '@/lib/types';
import { PaginationControls } from '@/components/ui/PaginationControls';

interface CustomersViewProps {
  onSelectCustomer: (customer: Customer) => void;
  onOpenAddCustomer: () => void;
  onOpenMergeModal: () => void;
}

export function CustomersView({
  onSelectCustomer,
  onOpenAddCustomer,
  onOpenMergeModal,
}: CustomersViewProps) {
  const { customers, customersPagination, fetchCustomers, selectedSite, setSelectedSite } = useCrm();

  const [searchFilter, setSearchFilter] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('All');
  const [siteFilter, setSiteFilter] = useState<string>(() => (selectedSite !== 'All Sites' ? selectedSite : 'All Locations'));
  const [consultantFilter, setConsultantFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Sync siteFilter with global selectedSite
  useEffect(() => {
    if (selectedSite && selectedSite !== 'All Sites') {
      setSiteFilter(selectedSite);
    }
  }, [selectedSite]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const effectiveSite = siteFilter !== 'All Locations' ? siteFilter : (selectedSite !== 'All Sites' ? selectedSite : undefined);
      fetchCustomers({
        page: currentPage,
        limit: pageSize,
        q: searchFilter.trim() || undefined,
        record_type: recordTypeFilter !== 'All' ? recordTypeFilter : undefined,
        site: effectiveSite,
        yard: effectiveSite,
        location: effectiveSite,
        owner: consultantFilter !== 'All' ? consultantFilter : undefined,
        source: sourceFilter !== 'All' ? sourceFilter : undefined,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, searchFilter, recordTypeFilter, siteFilter, consultantFilter, sourceFilter, selectedSite, fetchCustomers]);

  const hasActiveFilters = Boolean(
    searchFilter.trim() ||
    recordTypeFilter !== 'All' ||
    (siteFilter !== 'All Locations' && siteFilter !== selectedSite) ||
    consultantFilter !== 'All' ||
    sourceFilter !== 'All'
  );

  const clearAllFilters = () => {
    setSearchFilter('');
    setRecordTypeFilter('All');
    setSiteFilter(selectedSite !== 'All Sites' ? selectedSite : 'All Locations');
    setConsultantFilter('All');
    setSourceFilter('All');
    setCurrentPage(1);
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>, val: string) => {
    setCurrentPage(1);
    setter(val);
  };

  const SITES = [
    'All Locations',
    'BYD Nunawading',
    'BYD Melbourne City',
    'BYD Fairfield',
    'BYD Caroline Springs',
    'BYD Doncaster',
    'Denza Melbourne',
    'Holding Yard VIC',
    'Nunawading',
    'Fairfield',
    'Melbourne City',
    'Caroline Springs',
  ];

  return (
    <div className="view-stack">
      {/* Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#e60012]" />
            Canonical Identity · Customer 360 Directory (§5.1)
          </span>
          <h1 className="page-title mt-1">Customer 360 Directory</h1>
          <p className="page-subtitle">
            One single customer record for the entire network. Shared timeline and identity across Lead Centre qualification, CRM deal management, and Delivery Centre handover.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <button
            onClick={onOpenMergeModal}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm min-w-[130px] cursor-pointer"
          >
            <GitMerge className="w-4 h-4 text-amber-600" />
            <span>Merge Duplicates</span>
          </button>
          <button
            onClick={onOpenAddCustomer}
            className="signal-button flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md uppercase tracking-wider font-mono min-w-[130px] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter Row 1 */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => handleFilterChange(setSearchFilter, e.target.value)}
              placeholder="Search name, mobile, email, company, ID..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <select
            value={siteFilter}
            onChange={(e) => handleFilterChange(setSiteFilter, e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
          >
            {SITES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={recordTypeFilter}
            onChange={(e) => handleFilterChange(setRecordTypeFilter, e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
          >
            <option value="All">All Customer Types</option>
            <option value="Individual">Individual Buyers</option>
            <option value="Company">Company / Commercial</option>
            <option value="Fleet">Fleet / Novated</option>
            <option value="Household">Household</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => handleFilterChange(setSourceFilter, e.target.value)}
            className="w-full text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
          >
            <option value="All">All Lead Sources</option>
            <option value="Virtual Yard">Virtual Yard</option>
            <option value="Lead Centre">Lead Centre</option>
            <option value="Showroom Walk-in">Showroom Walk-in</option>
            <option value="Website">Official Website</option>
            <option value="Direct Intake">Direct Intake / BDC</option>
          </select>
        </div>

        {/* Secondary Row: Consultant and Clear button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={consultantFilter}
              onChange={(e) => handleFilterChange(setConsultantFilter, e.target.value)}
              className="text-xs p-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 font-medium outline-none cursor-pointer"
            >
              <option value="All">All Assigned Consultants</option>
              <option value="Alex Rivers">Alex Rivers</option>
              <option value="Sarah Chen">Sarah Chen</option>
              <option value="Marcus Vance">Marcus Vance</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 font-semibold transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          <span className="font-mono text-slate-500 text-right sm:text-left">
            Showing <strong className="text-slate-900 font-bold">{customers.length}</strong> of{' '}
            <strong className="text-slate-900 font-bold">{customersPagination?.total ?? customers.length}</strong> records
          </span>
        </div>
      </div>

      {/* Directory Table */}
      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Customer Name & ID</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Type & Site</th>
                <th className="py-3 px-4">Active Deal / Stage</th>
                <th className="py-3 px-4">Owner Consultant</th>
                <th className="py-3 px-4">ACMA Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((cust) => (
                <tr
                  key={cust.customer_id}
                  onClick={() => onSelectCustomer(cust)}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {cust.customer_id}
                      {cust.company_name && (
                        <span className="text-slate-600 font-sans ml-1.5 font-medium">
                          · {cust.company_name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 space-y-0.5">
                    <div className="font-mono flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{cust.phone}</span>
                    </div>
                    {cust.email && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="truncate max-w-[180px]">{cust.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                      {cust.record_type}
                    </span>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{cust.site}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="stage-pill bg-slate-100 text-slate-800 font-semibold text-[11px]">
                      {cust.current_stage || 'Working'}
                    </span>
                    {cust.total_open_value ? (
                      <div className="text-[11px] font-mono text-slate-700 font-bold mt-1">
                        ${cust.total_open_value.toLocaleString()} AUD
                      </div>
                    ) : null}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">
                    {cust.owner_name}
                  </td>
                  <td className="py-3.5 px-4">
                    {cust.do_not_contact ? (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-[#e60012] font-mono font-bold text-[10px] inline-flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Opted Out</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-semibold text-[10px] inline-flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Consented</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectCustomer(cust);
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs inline-flex items-center gap-1"
                    >
                      <span>360 Record</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        pagination={customersPagination}
        currentPage={currentPage}
        totalItems={customersPagination?.total ?? customers.length}
        pageSize={pageSize}
        pageSizeOptions={[15, 30, 50, 100]}
        itemLabel="customers"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
      />
    </div>
  );
}
