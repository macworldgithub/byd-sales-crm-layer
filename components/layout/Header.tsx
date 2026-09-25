'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  ShieldCheck,
  Radio,
  Bell,
  User,
  X,
  ChevronDown,
  Building2,
  Users,
  Car,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  Menu,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { SiteLocation, UserRole, Customer, Opportunity } from '@/lib/types';

interface HeaderProps {
  onSelectCustomer: (customer: Customer) => void;
  onOpenQuickDeal?: () => void;
  onToggleMobileMenu?: () => void;
}

export function Header({ onSelectCustomer, onOpenQuickDeal, onToggleMobileMenu }: HeaderProps) {
  const {
    currentUser,
    setCurrentRole,
    currentRole,
    selectedSite,
    setSelectedSite,
    isOnline,
    customers,
    opportunities,
    vyStock,
    salesLog,
    addToast,
  } = useCrm();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);
  const [isSiteMenuOpen, setIsSiteMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const siteMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Global search filtering (§5.1 & AC-1)
  const q = searchQuery.toLowerCase().trim();
  const matchedCustomers = q.length >= 2
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
          c.email.toLowerCase().includes(q) ||
          c.customer_id.toLowerCase().includes(q) ||
          (c.company_name && c.company_name.toLowerCase().includes(q))
      )
    : [];

  const matchedDeals = q.length >= 2
    ? opportunities.filter(
        (o) =>
          o.opportunity_id.toLowerCase().includes(q) ||
          o.vehicle_descriptor.toLowerCase().includes(q) ||
          (o.vy_stock_id && o.vy_stock_id.toLowerCase().includes(q)) ||
          (o.vy_order_id && o.vy_order_id.toLowerCase().includes(q)) ||
          (o.sales_log_id && o.sales_log_id.toLowerCase().includes(q))
      )
    : [];

  const matchedStock = q.length >= 2
    ? vyStock.filter(
        (s) =>
          s.vin.toLowerCase().includes(q) ||
          s.stock_id.toLowerCase().includes(q) ||
          s.model.toLowerCase().includes(q)
      )
    : [];

  const totalResults = matchedCustomers.length + matchedDeals.length + matchedStock.length;

  // Click outside listeners
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (siteMenuRef.current && !siteMenuRef.current.contains(e.target as Node)) {
        setIsSiteMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const sites: SiteLocation[] = [
    'Fairfield',
    'Melbourne City',
    'Doncaster',
    'Nunawading',
    'Caroline Springs',
    'All Sites',
  ];

  const roles: { role: UserRole; title: string; badge: string }[] = [
    { role: 'consultant', title: 'Sales Consultant', badge: 'Fairfield' },
    { role: 'manager', title: 'Sales Manager', badge: 'Floor Sup' },
    { role: 'bdc', title: 'BDC / Controller', badge: 'Network' },
    { role: 'delivery', title: 'Delivery Consultant', badge: 'Handover' },
    { role: 'super_admin', title: 'Super Admin', badge: 'Harmony' },
  ];

  const renderSearchResults = () => {
    if (!isSearchOpen || q.length < 2) return null;
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-[460px] overflow-y-auto p-3 z-50 divide-y divide-slate-100 animate-in fade-in">
        {totalResults === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No matching customer, VIN, or order found for &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          <>
            {/* Customers section */}
            {matchedCustomers.length > 0 && (
              <div className="pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1.5 font-mono">
                  Customer 360 Profiles ({matchedCustomers.length})
                </span>
                <div className="space-y-1">
                  {matchedCustomers.map((c) => (
                    <div
                      key={c.customer_id}
                      onClick={() => {
                        onSelectCustomer(c);
                        setIsSearchOpen(false);
                        setIsMobileSearchVisible(false);
                        setSearchQuery('');
                      }}
                      className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">{c.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {c.site}
                          </span>
                          {c.company_name && (
                            <span className="text-[10px] text-slate-500 font-medium truncate">
                              ({c.company_name})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{c.phone}</span>
                          <span>·</span>
                          <span className="truncate">{c.email}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="stage-pill bg-red-50 text-[#e60012] border border-red-200 text-[9px]">
                          {c.current_stage || 'Active'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                          {c.customer_id}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deals section */}
            {matchedDeals.length > 0 && (
              <div className="py-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1.5 font-mono">
                  Opportunities & Orders ({matchedDeals.length})
                </span>
                <div className="space-y-1">
                  {matchedDeals.map((o) => (
                    <div
                      key={o.opportunity_id}
                      onClick={() => {
                        const found = customers.find((c) => c.customer_id === o.customer_id);
                        if (found) onSelectCustomer(found);
                        setIsSearchOpen(false);
                        setIsMobileSearchVisible(false);
                        setSearchQuery('');
                      }}
                      className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors border border-transparent hover:border-slate-200"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                          <span className="truncate">{o.vehicle_descriptor}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono">
                            {o.opportunity_id}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Buyer: {o.customer_name} · Rep: {o.owner_name}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-900 font-mono">
                          ${o.total_deal_value.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {o.vy_order_id || o.stage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock section */}
            {matchedStock.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1.5 font-mono">
                  Virtual Yard Inventory ({matchedStock.length})
                </span>
                <div className="space-y-1">
                  {matchedStock.map((s) => (
                    <div
                      key={s.stock_id}
                      className="p-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                          <span>{s.model} {s.variant}</span>
                          <span className="text-[10px] font-mono text-slate-500">VIN: ...{s.vin.slice(-6)}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {s.colour} · {s.location}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`stage-pill text-[9px] ${
                            s.status === 'Available'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : s.status === 'Held'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <header className="topbar">
      {/* Left: Hamburger (Mobile) + Branding Kicker & Site Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-200/60 md:hidden flex items-center justify-center shrink-0 transition-colors"
          aria-label="Open mobile navigation menu"
        >
          <Menu className="w-5 h-5 text-slate-800" />
        </button>

        <div className="min-w-0">
          <span className="topbar-kicker hidden sm:flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e60012] inline-block animate-pulse" />
            BYD SALES CRM · SALES-DESK
          </span>
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="hidden xs:inline truncate">Harmony Auto</span>
            <span className="hidden xs:inline text-slate-300">/</span>
            <span className="text-[#e60012] truncate font-bold">{selectedSite}</span>
          </h2>
        </div>

        {/* Site Selector Dropdown */}
        <div ref={siteMenuRef} className="relative">
          <button
            onClick={() => setIsSiteMenuOpen(!isSiteMenuOpen)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/70 border border-slate-200 text-xs font-semibold text-slate-700 transition-all shrink-0"
            title="Change site location"
          >
            <MapPin className="w-3.5 h-3.5 text-[#e60012]" />
            <span className="hidden md:inline">{selectedSite}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isSiteMenuOpen && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono">
                Dealership Location
              </div>
              {sites.map((site) => (
                <button
                  key={site}
                  onClick={() => {
                    setSelectedSite(site);
                    setIsSiteMenuOpen(false);
                    addToast('info', 'Dealership Scope Switched', `Filtered view to ${site}`);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                    selectedSite === site
                      ? 'bg-red-50 text-[#e60012] font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{site}</span>
                  {selectedSite === site && <span className="w-1.5 h-1.5 rounded-full bg-[#e60012]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center: Global Customer 360 Search Desktop (§5.1 & AC-1) */}
      <div ref={searchRef} className="relative flex-1 max-w-lg mx-3 sm:mx-4 hidden lg:block">
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 focus-within:bg-white focus-within:border-slate-400 focus-within:shadow-md transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            placeholder="Search customer, mobile, VIN, stock ID, VY order #, deal #..."
            className="w-full bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Desktop Global Search Results Dropdown */}
        {renderSearchResults()}
      </div>

      {/* Right Controls: Search Toggle (Mobile), Network Status, Role Switcher */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Search Toggle Button */}
        <button
          onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
          className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 lg:hidden flex items-center justify-center transition-colors"
          aria-label="Toggle search bar"
        >
          <Search className="w-4 h-4 text-slate-600" />
        </button>

        {/* Network Connectivity Pill */}
        <div
          className={`connection-pill ${isOnline ? 'online' : 'offline'}`}
          title={isOnline ? 'Connected to live event bus' : 'Offline floor mode active'}
        >
          <Radio className={`w-3.5 h-3.5 ${isOnline ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">{isOnline ? 'Live Mesh' : 'Yard Outbox'}</span>
        </div>

        {/* Role Selector Dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 sm:pr-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-sm"
          >
            <div className="w-7 h-7 rounded-lg bg-[#171b22] text-white flex items-center justify-center font-bold text-xs font-mono shrink-0">
              {currentUser.avatarInitials}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] font-semibold text-[#e60012] uppercase tracking-wider font-mono">
                {currentRole}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 font-mono">
                Switch Operational Persona
              </div>
              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    setCurrentRole(r.role);
                    setIsUserMenuOpen(false);
                    addToast('info', 'Active Role Changed', `Switched to ${r.title}`);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between ${
                    currentRole === r.role
                      ? 'bg-red-50 text-[#e60012] font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div>{r.title}</div>
                    <span className="text-[10px] text-slate-400 font-mono">{r.badge}</span>
                  </div>
                  {currentRole === r.role && (
                    <span className="w-2 h-2 rounded-full bg-[#e60012]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Expandable Search Bar Overlay */}
      {isMobileSearchVisible && (
        <div
          ref={mobileSearchRef}
          className="absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-3 shadow-lg z-40 lg:hidden animate-in slide-in-from-top-2 duration-150"
        >
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 focus-within:bg-white focus-within:border-slate-400">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search customer, mobile, VIN, stock ID, deal #..."
              className="w-full bg-transparent text-xs text-slate-900 outline-none placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsMobileSearchVisible(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 ml-1"
            >
              Cancel
            </button>
          </div>

          {/* Search results in mobile mode */}
          {renderSearchResults()}
        </div>
      )}
    </header>
  );
}
