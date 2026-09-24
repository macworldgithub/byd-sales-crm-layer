'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { HomeView } from '@/components/views/HomeView';
import { PipelineView } from '@/components/views/PipelineView';
import { AllocationsView } from '@/components/views/AllocationsView';
import { CustomersView } from '@/components/views/CustomersView';
import { AppointmentsView } from '@/components/views/AppointmentsView';
import { VirtualYardView } from '@/components/views/VirtualYardView';
import { DeliveriesView } from '@/components/views/DeliveriesView';
import { SalesLogView } from '@/components/views/SalesLogView';
import { TeamScoreboardView } from '@/components/views/TeamScoreboardView';
import { AuditView } from '@/components/views/AuditView';
import { Customer360Modal } from '@/components/modals/Customer360Modal';
import { MarkSoldModal } from '@/components/modals/MarkSoldModal';
import { AddDealModal } from '@/components/modals/AddDealModal';
import { AddCustomerModal } from '@/components/modals/AddCustomerModal';
import { BookTestDriveModal } from '@/components/modals/BookTestDriveModal';
import { MergeCustomerModal } from '@/components/modals/MergeCustomerModal';
import { ToastContainer } from '@/components/ui/Toast';
import { useCrm } from '@/lib/crmContext';
import { Customer, Opportunity } from '@/lib/types';

export default function SalesCrmApp() {
  const { toasts, removeToast } = useCrm();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>('home');

  // Modal states
  const [selected360Customer, setSelected360Customer] = useState<Customer | null>(null);
  const [markSoldOpportunity, setMarkSoldOpportunity] = useState<Opportunity | null>(null);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isBookDriveOpen, setIsBookDriveOpen] = useState(false);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f4f5f7]">
      {/* Dark Graphite Sidebar matching byd-sales-floor */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickDeal={() => setIsAddDealOpen(true)}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header with Global Search, Site Switcher, Role Switcher */}
        <Header
          onSelectCustomer={(cust) => setSelected360Customer(cust)}
          onOpenQuickDeal={() => setIsAddDealOpen(true)}
        />

        {/* Scrollable Main Area */}
        <main className="app-main">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {activeTab === 'home' && (
                <HomeView
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  onSelectCustomer={(cust) => setSelected360Customer(cust)}
                  onOpenQuickDeal={() => setIsAddDealOpen(true)}
                  onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
                  onOpenBookDrive={() => setIsBookDriveOpen(true)}
                  onOpenMarkSold={(opp) => setMarkSoldOpportunity(opp)}
                />
              )}

              {activeTab === 'pipeline' && (
                <PipelineView
                  onSelectCustomer={(cust) => setSelected360Customer(cust)}
                  onOpenQuickDeal={() => setIsAddDealOpen(true)}
                  onOpenMarkSold={(opp) => setMarkSoldOpportunity(opp)}
                />
              )}

              {activeTab === 'inbox' && (
                <AllocationsView
                  onSelectCustomer={(cust) => setSelected360Customer(cust)}
                />
              )}

              {activeTab === 'customers' && (
                <CustomersView
                  onSelectCustomer={(cust) => setSelected360Customer(cust)}
                  onOpenAddCustomer={() => setIsAddCustomerOpen(true)}
                  onOpenMergeModal={() => setIsMergeModalOpen(true)}
                />
              )}

              {activeTab === 'appointments' && (
                <AppointmentsView
                  onOpenBookDrive={() => setIsBookDriveOpen(true)}
                />
              )}

              {activeTab === 'virtual-yard' && <VirtualYardView />}

              {activeTab === 'deliveries' && <DeliveriesView />}

              {activeTab === 'sales-log' && <SalesLogView />}

              {activeTab === 'team' && <TeamScoreboardView />}

              {activeTab === 'audit' && <AuditView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Hero Customer 360 Modal (§5.1 & AC-1) */}
      <Customer360Modal
        customer={selected360Customer}
        onClose={() => setSelected360Customer(null)}
        onOpenMarkSold={(opp) => {
          setSelected360Customer(null);
          setMarkSoldOpportunity(opp);
        }}
        onOpenBookDrive={() => setIsBookDriveOpen(true)}
      />

      {/* Orchestrated Mark Sold Modal (§7.5 & AC-7) */}
      <MarkSoldModal
        isOpen={!!markSoldOpportunity}
        onClose={() => setMarkSoldOpportunity(null)}
        opportunity={markSoldOpportunity}
      />

      {/* Add Deal Modal */}
      <AddDealModal
        isOpen={isAddDealOpen}
        onClose={() => setIsAddDealOpen(false)}
      />

      {/* Add Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onSelectExisting={(existing) => setSelected360Customer(existing)}
      />

      {/* Book Test Drive Modal */}
      <BookTestDriveModal
        isOpen={isBookDriveOpen}
        onClose={() => setIsBookDriveOpen(false)}
        preselectedCustomer={selected360Customer}
      />

      {/* Merge Duplicate Profiles Modal (§5.1) */}
      <MergeCustomerModal
        isOpen={isMergeModalOpen}
        onClose={() => setIsMergeModalOpen(false)}
        preselectedCustomer={selected360Customer}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
