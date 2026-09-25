'use client';

import React, { useState, useEffect } from 'react';
import {
  Car,
  Search,
  Lock,
  Unlock,
  Clock,
  Sparkles,
  MapPin,
  Tag,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useCrm } from '@/lib/crmContext';
import { VirtualYardStock } from '@/lib/types';
import { StockHoldModal } from '@/components/modals/StockHoldModal';
import { PaginationControls } from '@/components/ui/PaginationControls';

export function VirtualYardView() {
  const { vyStock, vyStockPagination, fetchVyStock, releaseStock, addToast } = useCrm();

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modelFilter, setModelFilter] = useState('All');
  const [selectedStockForHold, setSelectedStockForHold] = useState<VirtualYardStock | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Debounced server-side fetch on search, status, model, page or limit change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchVyStock({
        page: currentPage,
        limit: pageSize,
        q: searchFilter.trim() || undefined,
        status: statusFilter !== 'All' ? statusFilter : undefined,
        model: modelFilter !== 'All' ? modelFilter : undefined,
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, pageSize, searchFilter, statusFilter, modelFilter, fetchVyStock]);

  const handleRefreshFromVy = () => {
    setIsRefreshing(true);
    fetchVyStock({
      page: currentPage,
      limit: pageSize,
      q: searchFilter.trim() || undefined,
      status: statusFilter !== 'All' ? statusFilter : undefined,
      model: modelFilter !== 'All' ? modelFilter : undefined,
    }).finally(() => {
      setTimeout(() => {
        setIsRefreshing(false);
        addToast('success', 'Virtual Yard Synchronized', 'Polled latest stock changes and vessel ETA updates from VY API.');
      }, 400);
    });
  };

  const handleFilterChange = (type: 'search' | 'status' | 'model', val: string) => {
    setCurrentPage(1); // Reset to first page on filter change
    if (type === 'search') setSearchFilter(val);
    if (type === 'status') setStatusFilter(val);
    if (type === 'model') setModelFilter(val);
  };

  const models = ['All', 'ATTO 3', 'DOLPHIN', 'SEAL', 'SEALION 7', 'SHARK 6'];

  return (
    <div className="view-stack">
      {/* Intro Header */}
      <div className="page-intro">
        <div>
          <span className="eyebrow flex items-center gap-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            Inventory Link · Virtual Yard Push & Pull (§5.6)
          </span>
          <h1 className="page-title mt-1">Virtual Yard Live Inventory</h1>
          <p className="page-subtitle">
            Bidirectional synchronization with Virtual Yard stock ({vyStockPagination?.total?.toLocaleString() ?? '865'} active vehicles). Search inventory across yards, hold stock against active deals for 48 hours, and release on loss.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefreshFromVy}
            disabled={isRefreshing}
            className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center gap-1.5 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-purple-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Poll VY Changes</span>
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex items-center gap-2.5 flex-1 w-full">
          <div className="relative w-full lg:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search model, stock ID, VIN, colour..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white outline-none"
            />
          </div>

          <select
            value={modelFilter}
            onChange={(e) => handleFilterChange('model', e.target.value)}
            className="w-full lg:w-auto text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none"
          >
            <option value="All">All BYD Models</option>
            {models.filter((m) => m !== 'All').map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full lg:w-auto text-xs p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available for Sale</option>
            <option value="Held">Reserved / Held</option>
            <option value="Inbound">Inbound Port Vessel</option>
            <option value="Sold">Sold / Written</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-500 shrink-0 text-right sm:text-left pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          Showing <strong className="text-slate-900 font-bold">{vyStock.length}</strong> of{' '}
          <strong className="text-slate-900 font-bold">{vyStockPagination?.total?.toLocaleString() ?? vyStock.length}</strong> vehicles
        </span>
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {vyStock.map((stock) => (
          <div
            key={stock.stock_id}
            className="surface-card p-5 space-y-4 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider font-mono">
                  {stock.stock_id}
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  {stock.model} {stock.variant}
                </h4>
                <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                  {stock.colour} · {stock.battery_kwh} kWh Battery
                </span>
              </div>

              <span
                className={`stage-pill ${
                  stock.status === 'Available'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : stock.status === 'Held'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}
              >
                {stock.status}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>VIN:</span>
                <span className="font-mono text-slate-900 font-medium">{stock.vin}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Holding Yard:</span>
                <span className="font-medium text-slate-900">{stock.location}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Yard Status:</span>
                <span className="font-medium text-slate-900">{stock.eta}</span>
              </div>
            </div>

            {stock.held_by && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Reserved by {stock.held_by}</span>
                </div>
                {stock.hold_expires_at && (
                  <div className="text-[10px] text-amber-700 font-mono">
                    Hold active · 48h reservation window
                  </div>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
                  Driveaway MSRP
                </span>
                <strong className="text-sm font-bold text-slate-900">
                  ${stock.retail_price?.toLocaleString()}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                {stock.status === 'Available' ? (
                  <button
                    onClick={() => setSelectedStockForHold(stock)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hold Stock</span>
                  </button>
                ) : stock.status === 'Held' ? (
                  <button
                    onClick={() => releaseStock(stock.stock_id)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1"
                  >
                    <Unlock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Release</span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      <PaginationControls
        pagination={vyStockPagination}
        currentPage={currentPage}
        totalItems={vyStockPagination?.total ?? vyStock.length}
        pageSize={pageSize}
        pageSizeOptions={[12, 24, 48, 96]}
        itemLabel="vehicles"
        onPageChange={(p) => setCurrentPage(p)}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setCurrentPage(1);
        }}
      />

      {/* Stock Hold Modal */}
      <StockHoldModal
        isOpen={!!selectedStockForHold}
        onClose={() => setSelectedStockForHold(null)}
        stock={selectedStockForHold}
      />
    </div>
  );
}
