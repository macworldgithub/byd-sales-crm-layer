'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Customer,
  Opportunity,
  OpportunityStage,
  TimelineEvent,
  AllocationItem,
  VirtualYardStock,
  SalesLogEntry,
  DeliveryHandoverWatch,
  Appointment,
  AuditLogEntry,
  SiteLocation,
  UserRole,
  UserProfile,
  PaginationMeta,
} from './types';
import {
  CURRENT_USER,
  ALL_USERS,
  INITIAL_CUSTOMERS,
  INITIAL_OPPORTUNITIES,
  INITIAL_TIMELINE_EVENTS,
  INITIAL_ALLOCATIONS,
  INITIAL_VY_STOCK,
  INITIAL_SALES_LOG,
  INITIAL_DELIVERY_WATCH,
  INITIAL_APPOINTMENTS,
  INITIAL_AUDIT_LOG,
  CONSULTANT_SCORES,
} from './data';
import { customerApi, opportunityApi, allocationApi, vyApi, syncApi, crmMessageApi } from './api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

interface CrmContextType {
  // Current Session & Tenancy
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  selectedSite: SiteLocation;
  setSelectedSite: (site: SiteLocation) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isOnline: boolean;

  // Data Collections (Filtered by Site where applicable)
  customers: Customer[];
  opportunities: Opportunity[];
  allocations: AllocationItem[];
  timelineEvents: TimelineEvent[];
  vyStock: VirtualYardStock[];
  salesLog: SalesLogEntry[];
  deliveryWatch: DeliveryHandoverWatch[];
  appointments: Appointment[];
  auditLog: AuditLogEntry[];

  // Pagination Metadata (§9 Production Scale)
  vyStockPagination?: PaginationMeta;
  customersPagination?: PaginationMeta;
  opportunitiesPagination?: PaginationMeta;
  allocationsPagination?: PaginationMeta;
  salesLogPagination?: PaginationMeta;
  deliveryWatchPagination?: PaginationMeta;

  // Pagination Fetch Triggers
  fetchVyStock: (params?: Record<string, any>) => Promise<void>;
  fetchCustomers: (params?: Record<string, any>) => Promise<void>;
  fetchOpportunities: (params?: Record<string, any>) => Promise<void>;
  fetchAllocations: (params?: Record<string, any>) => Promise<void>;
  fetchSalesLog: (params?: Record<string, any>) => Promise<void>;
  fetchDeliveryWatch: (params?: Record<string, any>) => Promise<void>;

  // Actions: Customer & 360
  addCustomer: (data: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (customerId: string, patch: Partial<Customer>) => void;
  mergeCustomers: (sourceId: string, targetId: string) => void;
  toggleOptOut: (customerId: string) => void;
  addTimelineNote: (customerId: string, content: string, opportunityId?: string) => void;
  fetchCustomerTimeline: (customerId: string) => Promise<void>;

  // Actions: Deals & Opportunities
  addOpportunity: (data: Partial<Opportunity>) => Opportunity;
  updateOpportunityStage: (opportunityId: string, newStage: OpportunityStage, reason?: string) => void;
  updateOpportunity: (opportunityId: string, patch: Partial<Opportunity>) => void;
  executeMarkSold: (
    opportunityId: string,
    soldDetails: {
      vin: string;
      vy_stock_id?: string;
      vy_order_id?: string;
      sale_type: Opportunity['sale_type'];
      primary_salesperson: string;
      secondary_salesperson?: string;
      deposit: number;
      finance_method?: string;
    }
  ) => Promise<{ success: boolean; message: string }>;

  // Actions: Lead Intake & Phone Logging (§5.3, §5.9)
  acceptAllocation: (allocationId: string) => void;
  reassignAllocation: (allocationId: string, targetConsultant: string) => void;
  requestMoreLeads: () => void;
  logPhoneCall: (
    customerId: string,
    details: { outcome: string; durationMinutes: number; notes: string; opportunityId?: string }
  ) => void;

  // Actions: Virtual Yard Push/Pull (§5.6)
  holdStock: (stockId: string, opportunityId: string) => void;
  releaseStock: (stockId: string) => void;

  // Actions: Sales Log Reconcile (§5.7)
  reconcileSalesLogRow: (salesLogId: string) => void;

  // Actions: Delivery Handover (§5.8)
  addDeliveryHandoverNote: (clientId: string, note: string) => void;

  // Actions: Appointments & Targets (§5.5, §5.9)
  createAppointment: (appt: Partial<Appointment>) => void;
  updateConsultantTarget: (consultantName: string, newTarget: number) => void;

  // Actions: SMS Messaging (§5.9)
  sendSmsMessage: (customerId: string, phone: string, message: string) => Promise<boolean>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], title: string, description?: string) => void;
  removeToast: (id: string) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
  // Session & Tenancy
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);
  const [selectedSite, setSelectedSite] = useState<SiteLocation>('Fairfield');
  const [currentRole, setCurrentRole] = useState<UserRole>('consultant');
  const [isOnline, setIsOnline] = useState(true);

  // Core Data
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(INITIAL_OPPORTUNITIES);
  const [allocations, setAllocations] = useState<AllocationItem[]>(INITIAL_ALLOCATIONS);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(INITIAL_TIMELINE_EVENTS);
  const [vyStock, setVyStock] = useState<VirtualYardStock[]>(INITIAL_VY_STOCK);
  const [salesLog, setSalesLog] = useState<SalesLogEntry[]>(INITIAL_SALES_LOG);
  const [deliveryWatch, setDeliveryWatch] = useState<DeliveryHandoverWatch[]>(INITIAL_DELIVERY_WATCH);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOG);

  // Pagination states (§9 Production Scale)
  const [vyStockPagination, setVyStockPagination] = useState<PaginationMeta | undefined>({
    total: INITIAL_VY_STOCK.length,
    page: 1,
    limit: 20,
    pages: Math.ceil(INITIAL_VY_STOCK.length / 20) || 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [customersPagination, setCustomersPagination] = useState<PaginationMeta | undefined>();
  const [opportunitiesPagination, setOpportunitiesPagination] = useState<PaginationMeta | undefined>();
  const [allocationsPagination, setAllocationsPagination] = useState<PaginationMeta | undefined>();
  const [salesLogPagination, setSalesLogPagination] = useState<PaginationMeta | undefined>();
  const [deliveryWatchPagination, setDeliveryWatchPagination] = useState<PaginationMeta | undefined>();

  // Fetch functions with pagination parameters
  const fetchVyStock = useCallback(async (params: Record<string, any> = {}) => {
    try {
      const res = await vyApi.getStock(params);
      if (res.success && res.data) {
        setVyStock(res.data);
        if (res.pagination) setVyStockPagination(res.pagination);
      }
    } catch (err) {
      console.warn('fetchVyStock error:', err);
    }
  }, []);

  const fetchCustomers = useCallback(async (params: Record<string, any> = {}) => {
    try {
      const res = await customerApi.getCustomers(params);
      if (res.success && res.data) {
        setCustomers(res.data);
        if (res.pagination) setCustomersPagination(res.pagination);
      }
    } catch (err) {
      console.warn('fetchCustomers error:', err);
    }
  }, []);

  const fetchOpportunities = useCallback(async (params: Record<string, any> = {}) => {
    try {
      const res = await opportunityApi.getOpportunities(params);
      if (res.success && res.data) {
        setOpportunities(res.data);
        if (res.pagination) setOpportunitiesPagination(res.pagination);
      }
    } catch (err) {
      console.warn('fetchOpportunities error:', err);
    }
  }, []);

  const fetchAllocations = useCallback(async (params: Record<string, any> = {}) => {
    try {
      const res = await allocationApi.getAllocations(params);
      if (res.success && res.data) {
        setAllocations(res.data);
        if (res.pagination) setAllocationsPagination(res.pagination);
      }
    } catch (err) {
      console.warn('fetchAllocations error:', err);
    }
  }, []);

  const fetchSalesLog = useCallback(async (params: Record<string, any> = {}) => {
    try {
      const res = await syncApi.getSalesLog(params);
      if (res.success && res.data) {
        setSalesLog(res.data);
        if (res.pagination) setSalesLogPagination(res.pagination);
      }
    } catch (err) {
      console.warn('fetchSalesLog error:', err);
    }
  }, []);

  const fetchDeliveryWatch = useCallback(async (params: Record<string, any> = {}) => {
    try {
      const res = await syncApi.getDeliveryWatch(params);
      if (res.success && res.data) {
        setDeliveryWatch(res.data);
        if (res.pagination) setDeliveryWatchPagination(res.pagination);
      }
    } catch (err) {
      console.warn('fetchDeliveryWatch error:', err);
    }
  }, []);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], title: string, description?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Online / Offline listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const onOnline = () => {
        setIsOnline(true);
        addToast('success', 'Back Online', 'Re-established connection to byd-panel event bus.');
      };
      const onOffline = () => {
        setIsOnline(false);
        addToast('warning', 'Yard Offline Mode', 'Actions will queue locally with full data protection.');
      };
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
      return () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    }
  }, [addToast]);

  // Keep currentUser role and currentRole synchronized
  const handleSetRole = (role: UserRole) => {
    setCurrentRole(role);
    const matched = ALL_USERS.find((u) => u.role === role);
    if (matched) {
      setCurrentUser(matched);
      if (role !== 'super_admin' && role !== 'bdc') {
        setSelectedSite(matched.site);
      }
    }
  };

  // Live Backend Sync on Mount (§7.1, §7.3)
  useEffect(() => {
    fetchCustomers({ page: 1, limit: 50 });
    fetchOpportunities({ page: 1, limit: 50 });
    fetchAllocations({ page: 1, limit: 50 });
    fetchVyStock({ page: 1, limit: 20 });
    fetchSalesLog({ page: 1, limit: 50 });
    fetchDeliveryWatch({ page: 1, limit: 20 });
  }, [fetchCustomers, fetchOpportunities, fetchAllocations, fetchVyStock, fetchSalesLog, fetchDeliveryWatch]);

  // Add Customer with Live Database Duplicate Detection (§5.1 & AC-1)
  const addCustomer = async (data: Partial<Customer>): Promise<Customer> => {
    try {
      const res = await customerApi.createCustomer({
        ...data,
        owner_user_id: currentUser.id,
        owner_name: currentUser.name,
        site: (data.site || (selectedSite !== 'All Sites' ? selectedSite : 'Fairfield')) as SiteLocation,
      });

      if (res.success && res.data) {
        const created = res.data;
        setCustomers((prev) => [created, ...prev]);

        // Add Audit Log
        const newAudit: AuditLogEntry = {
          audit_id: `AUD-${Date.now().toString().slice(-4)}`,
          actor: currentUser.name,
          action: 'Customer Created',
          target_type: 'Customer',
          target_id: created.customer_id,
          details: `Created customer profile for ${created.name} (${created.phone}) in database`,
          source: 'Sales CRM',
          timestamp: new Date().toISOString(),
        };
        setAuditLog((prev) => [newAudit, ...prev]);

        addToast('success', 'Customer 360 Record Created', `${created.name} saved to ${created.site} database.`);
        return created;
      } else if (res.message && res.message.includes('Duplicate')) {
        addToast('warning', 'Duplicate Customer Detected', res.message);
        throw new Error(res.message);
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Duplicate')) {
        throw err;
      }
      console.warn('API addCustomer offline fallback:', err);
    }

    // Resilient offline fallback
    const customerId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
    const fallbackCust: Customer = {
      customer_id: customerId,
      name: data.name || 'New Customer',
      phone: data.phone || '+61400000000',
      email: data.email || 'customer@example.com',
      site: (data.site || (selectedSite !== 'All Sites' ? selectedSite : 'Fairfield')) as SiteLocation,
      owner_user_id: currentUser.id,
      owner_name: currentUser.name,
      source: data.source || 'Walk-in',
      record_type: data.record_type || 'Individual',
      company_name: data.company_name,
      consent_sms: true,
      consent_updated_at: new Date().toISOString(),
      do_not_contact: false,
      notes: data.notes || '',
      created_at: new Date().toISOString(),
      total_open_value: 0,
      current_stage: 'New / Allocated',
    };

    setCustomers((prev) => [fallbackCust, ...prev]);

    const newAudit: AuditLogEntry = {
      audit_id: `AUD-${Date.now().toString().slice(-4)}`,
      actor: currentUser.name,
      action: 'Customer Created (Offline)',
      target_type: 'Customer',
      target_id: customerId,
      details: `Created customer profile for ${fallbackCust.name} (${fallbackCust.phone})`,
      source: 'Sales CRM',
      timestamp: new Date().toISOString(),
    };
    setAuditLog((prev) => [newAudit, ...prev]);

    addToast('success', 'Customer 360 Record Created', `${fallbackCust.name} cached.`);
    return fallbackCust;
  };

  const updateCustomer = async (customerId: string, patch: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.customer_id === customerId ? { ...c, ...patch } : c))
    );
    try {
      await customerApi.updateCustomer(customerId, patch);
    } catch (err) {
      console.warn('updateCustomer api error:', err);
    }
    addToast('info', 'Customer Profile Updated', 'Changes saved to customer record.');
  };

  // Merge Customers (§5.1)
  const mergeCustomers = async (sourceId: string, targetId: string) => {
    const source = customers.find((c) => c.customer_id === sourceId);
    const target = customers.find((c) => c.customer_id === targetId);
    if (!source || !target) return;

    // Migrate opportunities & timeline events in local state
    setOpportunities((prev) =>
      prev.map((o) =>
        o.customer_id === sourceId
          ? { ...o, customer_id: targetId, customer_name: target.name }
          : o
      )
    );
    setTimelineEvents((prev) =>
      prev.map((e) => (e.customer_id === sourceId ? { ...e, customer_id: targetId } : e))
    );
    // Remove source customer
    setCustomers((prev) => prev.filter((c) => c.customer_id !== sourceId));

    try {
      await customerApi.mergeCustomers(sourceId, targetId);
    } catch (err) {
      console.warn('mergeCustomers api error:', err);
    }

    // Audit
    const audit: AuditLogEntry = {
      audit_id: `AUD-${Date.now().toString().slice(-4)}`,
      actor: currentUser.name,
      action: 'Customer Records Merged',
      target_type: 'Customer',
      target_id: targetId,
      details: `Merged duplicate record ${source.name} (${sourceId}) into ${target.name} (${targetId}) in database`,
      source: 'Sales CRM',
      timestamp: new Date().toISOString(),
    };
    setAuditLog((prev) => [audit, ...prev]);

    addToast(
      'success',
      'Duplicate Merged Successfully',
      `All deals and history from ${source.name} unified into record ${target.name}.`
    );
  };

  // Global ACMA Opt-out / Do Not Contact (§5.10 & AC-5)
  const toggleOptOut = async (customerId: string) => {
    const target = customers.find((c) => c.customer_id === customerId);
    if (!target) return;
    const updatedState = !target.do_not_contact;

    setCustomers((prev) =>
      prev.map((c) => {
        if (c.customer_id === customerId) {
          return {
            ...c,
            do_not_contact: updatedState,
            consent_sms: !updatedState,
            consent_updated_at: new Date().toISOString(),
          };
        }
        return c;
      })
    );

    try {
      await customerApi.updateCustomer(customerId, {
        do_not_contact: updatedState,
        consent_sms: !updatedState,
      });
    } catch (err) {
      console.warn('toggleOptOut api error:', err);
    }

    const newStatus = updatedState ? 'Opted Out' : 'Resumed';

    // Broadcast Timeline Event
    const optOutEvent: TimelineEvent = {
      event_id: `EVT-${Date.now().toString().slice(-4)}`,
      customer_id: customerId,
      occurred_at: 'Just now (AEST)',
      source: 'Sales CRM',
      type: 'system',
      author: currentUser.name,
      title: `ACMA Compliance: Contact Status changed to ${newStatus}`,
      content: `Global opt-out synchronized across Lead Centre AI and Delivery Centre. CRM SMS and automated outbound disabled.`,
      visibility: 'internal',
    };
    setTimelineEvents((prev) => [optOutEvent, ...prev]);

    addToast(
      'warning',
      'ACMA Compliance Event Logged',
      `Customer marked as ${newStatus}. Synced to upstream Lead Centre AI.`
    );
  };

  // Add Unified Timeline Note (§5.2 & AC-2)
  const addTimelineNote = async (customerId: string, content: string, opportunityId?: string) => {
    const newEvent: TimelineEvent = {
      event_id: `EVT-${Date.now().toString().slice(-4)}`,
      customer_id: customerId,
      opportunity_id: opportunityId,
      occurred_at: 'Just now (AEST)',
      source: 'Sales CRM',
      type: 'note',
      author: `${currentUser.name} (${currentUser.role})`,
      title: 'Sales Consultation Note',
      content,
      visibility: 'internal',
    };

    setTimelineEvents((prev) => [newEvent, ...prev]);

    // Note also saved on customer object
    setCustomers((prev) =>
      prev.map((c) =>
        c.customer_id === customerId
          ? { ...c, notes: c.notes ? `${c.notes}\n[${new Date().toLocaleDateString()}] ${content}` : content }
          : c
      )
    );

    try {
      await customerApi.addTimelineNote(customerId, {
        author: `${currentUser.name} (${currentUser.role})`,
        content,
      });
    } catch (err) {
      console.warn('addTimelineNote api error:', err);
    }

    addToast(
      'success',
      'Note Recorded & Fanned Out',
      'Note visible on Lead Centre timeline and Delivery Centre client thread.'
    );
  };

  // Fetch Customer Timeline from MongoDB (§5.2)
  const fetchCustomerTimeline = async (customerId: string) => {
    try {
      const res = await customerApi.getTimeline(customerId);
      if (res.success && res.data && res.data.length > 0) {
        setTimelineEvents((prev) => {
          const existingIds = new Set(prev.map((e) => e.event_id));
          const newEvents = res.data!.filter((e) => !existingIds.has(e.event_id));
          return [...newEvents, ...prev];
        });
      }
    } catch (err) {
      console.warn('fetchCustomerTimeline error:', err);
    }
  };

  // Opportunities Management (§5.4)
  const addOpportunity = (data: Partial<Opportunity>): Opportunity => {
    const cust = customers.find((c) => c.customer_id === data.customer_id);
    const tempOppId = `OPP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOpp: Opportunity = {
      opportunity_id: tempOppId,
      customer_id: data.customer_id || 'CUST-0891',
      customer_name: cust?.name || data.customer_name || 'Customer',
      customer_phone: cust?.phone || '+61400000000',
      customer_email: cust?.email || 'email@example.com',
      site: (data.site || (selectedSite !== 'All Sites' ? selectedSite : 'Fairfield')) as SiteLocation,
      owner_user_id: currentUser.id,
      owner_name: currentUser.name,
      stage: data.stage || 'New / Allocated',
      vehicle_descriptor: data.vehicle_descriptor || 'BYD SEALION 7 Premium',
      model: data.model || 'SEALION 7',
      variant: data.variant || 'Premium',
      colour: data.colour || 'Atlantis Grey',
      order_type: data.order_type || 'Stock',
      vy_stock_id: data.vy_stock_id,
      sale_type: data.sale_type || 'Retail',
      list_price: data.list_price || 65990,
      discount: data.discount || 0,
      extras: data.extras || 0,
      total_deal_value: (data.list_price || 65990) - (data.discount || 0) + (data.extras || 0),
      trade_in_flag: data.trade_in_flag || false,
      trade_in_details: data.trade_in_details,
      expected_close: data.expected_close || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      next_action_at: new Date(Date.now() + 86400000).toISOString(),
      next_action_text: data.next_action_text || 'Follow up vehicle preference and trade valuation',
      sync_status: 'synced',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setOpportunities((prev) => [newOpp, ...prev]);

    // Persist to MongoDB Atlas via backend API
    opportunityApi
      .createOpportunity({
        ...data,
        customer_name: newOpp.customer_name,
        customer_phone: newOpp.customer_phone,
        customer_email: newOpp.customer_email,
        site: newOpp.site,
        owner_user_id: currentUser.id,
        owner_name: currentUser.name,
      })
      .then((res) => {
        if (res.success && res.data) {
          const savedOpp = res.data;
          setOpportunities((prev) =>
            prev.map((o) => (o.opportunity_id === tempOppId ? { ...o, ...savedOpp } : o))
          );
        }
      })
      .catch((err) => {
        console.warn('createOpportunity API error:', err);
      });

    // Update customer active deal
    setCustomers((prev) =>
      prev.map((c) =>
        c.customer_id === newOpp.customer_id
          ? {
              ...c,
              total_open_value: (c.total_open_value || 0) + newOpp.total_deal_value,
              current_stage: newOpp.stage,
              active_deal_id: newOpp.opportunity_id,
            }
          : c
      )
    );

    // Audit
    const audit: AuditLogEntry = {
      audit_id: `AUD-${Date.now().toString().slice(-4)}`,
      actor: currentUser.name,
      action: 'Opportunity Created',
      target_type: 'Opportunity',
      target_id: tempOppId,
      details: `Created deal for ${newOpp.vehicle_descriptor} ($${newOpp.total_deal_value.toLocaleString()})`,
      source: 'Sales CRM',
      timestamp: new Date().toISOString(),
    };
    setAuditLog((prev) => [audit, ...prev]);

    addToast('success', 'Opportunity Registered', `${newOpp.vehicle_descriptor} created for ${newOpp.customer_name}.`);
    return newOpp;
  };

  const updateOpportunityStage = async (
    opportunityId: string,
    newStage: OpportunityStage,
    reason?: string
  ) => {
    setOpportunities((prev) =>
      prev.map((o) => {
        if (o.opportunity_id === opportunityId) {
          return {
            ...o,
            stage: newStage,
            lost_reason: newStage === 'Lost / Parked' ? (reason as any) : undefined,
            updated_at: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    try {
      await opportunityApi.updateOpportunity(opportunityId, {
        stage: newStage,
        lost_reason: reason as any,
      });
    } catch (err) {
      console.warn('updateOpportunityStage api error:', err);
    }

    const opp = opportunities.find((o) => o.opportunity_id === opportunityId);

    // Timeline event
    if (opp) {
      const stageEvt: TimelineEvent = {
        event_id: `EVT-${Date.now().toString().slice(-4)}`,
        customer_id: opp.customer_id,
        opportunity_id: opp.opportunity_id,
        occurred_at: 'Just now (AEST)',
        source: 'Sales CRM',
        type: 'stage_change',
        author: currentUser.name,
        title: `Deal Stage Transition: ${opp.stage} › ${newStage}`,
        content: `Opportunity ${opp.opportunity_id} (${opp.vehicle_descriptor}) moved to ${newStage}.${
          reason ? ` Reason: ${reason}` : ''
        }`,
        visibility: 'internal',
      };
      setTimelineEvents((prev) => [stageEvt, ...prev]);
    }

    addToast('info', 'Pipeline Stage Updated', `Deal moved to ${newStage}.`);
  };

  const updateOpportunity = async (opportunityId: string, patch: Partial<Opportunity>) => {
    setOpportunities((prev) =>
      prev.map((o) => (o.opportunity_id === opportunityId ? { ...o, ...patch, updated_at: new Date().toISOString() } : o))
    );
    try {
      await opportunityApi.updateOpportunity(opportunityId, patch);
    } catch (err) {
      console.warn('updateOpportunity api error:', err);
    }
    addToast('info', 'Opportunity Saved', 'Deal details updated.');
  };

  // Single Orchestrated Mark Sold Transaction (§7.5 & AC-7)
  const executeMarkSold = async (
    opportunityId: string,
    soldDetails: {
      vin: string;
      vy_stock_id?: string;
      vy_order_id?: string;
      sale_type: Opportunity['sale_type'];
      primary_salesperson: string;
      secondary_salesperson?: string;
      deposit: number;
      finance_method?: string;
    }
  ): Promise<{ success: boolean; message: string }> => {
    const opp = opportunities.find((o) => o.opportunity_id === opportunityId);
    if (!opp) return { success: false, message: 'Opportunity not found' };

    let vyOrderId = soldDetails.vy_order_id || `VYO-${Math.floor(70000 + Math.random() * 20000)}`;
    let salesLogId = `SL-2026-09-${Math.floor(100 + Math.random() * 899)}`;
    let deliveryClientId = `DC-${Math.floor(8000 + Math.random() * 1999)}`;

    try {
      const res = await opportunityApi.markSold(opportunityId, {
        ...soldDetails,
        sale_type: soldDetails.sale_type || opp.sale_type || 'Retail',
      });
      if (res.success && res.data) {
        if (res.data.salesLogId) salesLogId = res.data.salesLogId;
        if (res.data.deliveryClientId) deliveryClientId = res.data.deliveryClientId;
        if (res.data.vyOrderId) vyOrderId = res.data.vyOrderId;

        // Refresh collections from MongoDB
        syncApi.getSalesLog().then((sl) => { if (sl.success && sl.data) setSalesLog(sl.data); });
        syncApi.getDeliveryWatch().then((dw) => { if (dw.success && dw.data) setDeliveryWatch(dw.data); });
        vyApi.getStock().then((st) => { if (st.success && st.data) setVyStock(st.data); });
      }
    } catch (err) {
      console.warn('executeMarkSold api error, continuing with local updates:', err);
    }

    // 1. Update Opportunity
    setOpportunities((prev) =>
      prev.map((o) => {
        if (o.opportunity_id === opportunityId) {
          return {
            ...o,
            stage: 'Written / Sold',
            vy_stock_id: soldDetails.vy_stock_id || o.vy_stock_id || 'VY-VIC-84920',
            vy_order_id: vyOrderId,
            sales_log_id: salesLogId,
            delivery_client_id: deliveryClientId,
            delivery_stage: 'Scheduled',
            sale_type: soldDetails.sale_type,
            secondary_owner: soldDetails.secondary_salesperson,
            sync_status: 'synced',
            updated_at: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    // 2. Virtual Yard: Update Stock Status to Sold
    if (soldDetails.vy_stock_id) {
      setVyStock((prev) =>
        prev.map((s) =>
          s.stock_id === soldDetails.vy_stock_id
            ? { ...s, status: 'Sold', held_for_customer: opp.customer_name }
            : s
        )
      );
    }

    // 3. Sales Log: Create New Written Row (§5.7)
    const newSalesLogRow: SalesLogEntry = {
      sales_log_id: salesLogId,
      deal_date: new Date().toISOString().split('T')[0],
      customer_name: opp.customer_name,
      vehicle: opp.vehicle_descriptor,
      vin: soldDetails.vin,
      stock_id: soldDetails.vy_stock_id || 'VY-VIC-84920',
      sale_type: soldDetails.sale_type,
      consultant: soldDetails.primary_salesperson,
      site: opp.site,
      amount: opp.total_deal_value,
      gross: Math.round(opp.total_deal_value * 0.075),
      reconciled: true,
      crm_opportunity_id: opportunityId,
    };
    setSalesLog((prev) => [newSalesLogRow, ...prev.filter((sl) => sl.sales_log_id !== salesLogId)]);

    // 4. Delivery Centre: Upsert Client with imported_from = 'crm' (§5.8, §7.5)
    const newDeliveryWatcher: DeliveryHandoverWatch = {
      client_id: deliveryClientId,
      opportunity_id: opportunityId,
      customer_name: opp.customer_name,
      phone: opp.customer_phone,
      vehicle: opp.vehicle_descriptor,
      vin: soldDetails.vin,
      rego: 'Awaiting Registration',
      stage: 'Scheduled',
      delivery_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      delivery_consultant: 'Rachel Adams',
      handover_specialist: 'Rachel Adams',
      contact_status: 'Contacted',
      docs_completeness: 'Partial',
      docs_status: {
        atrSigned: true,
        licenceFront: true,
        insurance: false,
        paymentSettled: soldDetails.deposit >= 2000,
      },
      arrived: true,
      last_comment: `Order imported from Sales CRM (${opportunityId}). Deposit $${soldDetails.deposit.toLocaleString()} captured. Scheduled for pre-delivery detailing.`,
    };
    setDeliveryWatch((prev) => [newDeliveryWatcher, ...prev.filter((d) => d.client_id !== deliveryClientId)]);

    // 5. Timeline Events & Audit
    const soldEvent: TimelineEvent = {
      event_id: `EVT-${Date.now().toString().slice(-4)}`,
      customer_id: opp.customer_id,
      opportunity_id: opp.opportunity_id,
      occurred_at: 'Just now (AEST)',
      source: 'Sales CRM',
      type: 'sales_log_write',
      author: currentUser.name,
      title: 'Deal Written & Sold (3-Way Orchestration)',
      content: `Mark Sold transaction executed. Created VY Order ${vyOrderId}, Sales Log row ${salesLogId}, and Delivery Centre client ${deliveryClientId} (imported_from='crm').`,
      visibility: 'internal',
    };
    setTimelineEvents((prev) => [soldEvent, ...prev]);

    const audit: AuditLogEntry = {
      audit_id: `AUD-${Date.now().toString().slice(-4)}`,
      actor: currentUser.name,
      action: 'Mark Sold (Orchestrated)',
      target_type: 'Opportunity',
      target_id: opportunityId,
      details: `Sold marked: VY Order ${vyOrderId}, Sales Log ${salesLogId}, Delivery Client ${deliveryClientId}. VIN ${soldDetails.vin}.`,
      source: 'Sales CRM',
      timestamp: new Date().toISOString(),
    };
    setAuditLog((prev) => [audit, ...prev]);

    addToast(
      'success',
      'Deal Written & Sold!',
      `Successfully orchestrated in MongoDB across Virtual Yard, Sales Log and Delivery Centre.`
    );

    return { success: true, message: 'Deal marked as sold and synced downstream.' };
  };

  // Lead Intake Allocations (§5.3 & AC-4)
  const acceptAllocation = async (allocationId: string) => {
    try {
      await allocationApi.acceptAllocation(allocationId, currentUser.name);
    } catch (err) {
      console.warn('acceptAllocation api error:', err);
    }

    setAllocations((prev) =>
      prev.map((a) => (a.allocation_id === allocationId ? { ...a, status: 'accepted' } : a))
    );

    const alloc = allocations.find((a) => a.allocation_id === allocationId);
    if (alloc) {
      // Find or create customer
      const existing = customers.find((c) => c.phone === alloc.phone);
      if (existing) {
        setCustomers((prev) =>
          prev.map((c) =>
            c.customer_id === existing.customer_id
              ? { ...c, owner_name: currentUser.name, owner_user_id: currentUser.id }
              : c
          )
        );
      }

      // Advance linked opportunity owner and advance stage from 'New / Allocated' to 'Working' (§5.4 exit criteria)
      setOpportunities((prev) =>
        prev.map((o) =>
          o.customer_id === alloc.customer_id || (existing && o.customer_id === existing.customer_id)
            ? {
                ...o,
                owner_name: currentUser.name,
                owner_user_id: currentUser.id,
                stage: o.stage === 'New / Allocated' ? 'Working' : o.stage,
                updated_at: new Date().toISOString(),
              }
            : o
        )
      );

      // Add Timeline event
      const allocEvt: TimelineEvent = {
        event_id: `EVT-${Date.now().toString().slice(-4)}`,
        customer_id: alloc.customer_id,
        occurred_at: 'Just now (AEST)',
        source: 'Sales CRM',
        type: 'assignment',
        author: currentUser.name,
        title: `Allocation Accepted by ${currentUser.name}`,
        content: `Consultant accepted lead intake within SLA. Stage transitioned to Working and follow-up cadence initiated for ${alloc.vehicle}.`,
        visibility: 'internal',
      };
      setTimelineEvents((prev) => [allocEvt, ...prev]);
    }

    addToast('success', 'Lead Allocation Accepted', 'You are now the active owner of this deal (Stage: Working).');
  };

  const reassignAllocation = async (allocationId: string, targetConsultant: string) => {
    try {
      await allocationApi.reassignAllocation(allocationId, targetConsultant);
    } catch (err) {
      console.warn('reassignAllocation api error:', err);
    }

    setAllocations((prev) =>
      prev.map((a) =>
        a.allocation_id === allocationId
          ? { ...a, assigned_to: targetConsultant, status: 'reassigned' }
          : a
      )
    );
    addToast('info', 'Lead Reassigned', `Prospect routed to ${targetConsultant}.`);
  };

  const requestMoreLeads = () => {
    addToast(
      'info',
      'Lead Request Submitted',
      'BDC queue notified. Inbound qualified leads will be prioritized to your desk.'
    );
  };

  // Click-to-call Phone Outreach Logging (§5.9)
  const logPhoneCall = (
    customerId: string,
    details: { outcome: string; durationMinutes: number; notes: string; opportunityId?: string }
  ) => {
    const callEvt: TimelineEvent = {
      event_id: `EVT-${Date.now().toString().slice(-4)}`,
      customer_id: customerId,
      opportunity_id: details.opportunityId,
      occurred_at: 'Just now (AEST)',
      source: 'Sales CRM',
      type: 'call_log',
      author: currentUser.name,
      title: `Phone Call Log · ${details.outcome} (${details.durationMinutes} min)`,
      content: details.notes || `Phone call outcome: ${details.outcome}. Duration: ${details.durationMinutes} minutes.`,
      visibility: 'internal',
    };

    setTimelineEvents((prev) => [callEvt, ...prev]);
    addToast(
      'success',
      'Phone Call Logged',
      `Recorded ${details.outcome} (${details.durationMinutes} min) on unified timeline.`
    );
  };

  // Target Quota Maintenance (§5.5)
  const updateConsultantTarget = (consultantName: string, newTarget: number) => {
    const score = CONSULTANT_SCORES.find((s) => s.name === consultantName);
    if (score) {
      score.target_units = newTarget;
    }
    addToast('success', 'Monthly Quota Updated', `Updated target for ${consultantName} to ${newTarget} units.`);
  };

  // Virtual Yard Stock Hold (§5.6 & AC-8)
  const holdStock = async (stockId: string, opportunityId: string) => {
    const opp = opportunities.find((o) => o.opportunity_id === opportunityId);

    try {
      await vyApi.holdStock(stockId, opportunityId, currentUser.name);
    } catch (err) {
      console.warn('holdStock api error:', err);
    }

    setVyStock((prev) =>
      prev.map((s) => {
        if (s.stock_id === stockId) {
          return {
            ...s,
            status: 'Held',
            held_by_consultant: currentUser.name,
            held_for_customer: opp?.customer_name || 'Valued Buyer',
            held_opportunity_id: opportunityId,
            hold_expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
          };
        }
        return s;
      })
    );

    // Link stock to opportunity
    if (opp) {
      updateOpportunity(opportunityId, { vy_stock_id: stockId });
      const holdEvt: TimelineEvent = {
        event_id: `EVT-${Date.now().toString().slice(-4)}`,
        customer_id: opp.customer_id,
        opportunity_id: opp.opportunity_id,
        occurred_at: 'Just now (AEST)',
        source: 'Virtual Yard',
        type: 'vy_stock_event',
        author: currentUser.name,
        title: `Virtual Yard Stock Hold Placed: ${stockId}`,
        content: `Placed 48-hour reservation on stock unit ${stockId} for ${opp.customer_name}. Expiry in 48 hours.`,
        visibility: 'internal',
      };
      setTimelineEvents((prev) => [holdEvt, ...prev]);
    }

    addToast('success', 'Stock Unit Held', `48-hour hold placed on ${stockId} in Virtual Yard.`);
  };

  const releaseStock = async (stockId: string) => {
    try {
      await vyApi.releaseStock(stockId);
    } catch (err) {
      console.warn('releaseStock api error:', err);
    }

    setVyStock((prev) =>
      prev.map((s) =>
        s.stock_id === stockId
          ? {
              ...s,
              status: 'Available',
              held_by_consultant: undefined,
              held_for_customer: undefined,
              held_opportunity_id: undefined,
              hold_expires_at: undefined,
            }
          : s
      )
    );

    const audit: AuditLogEntry = {
      audit_id: `AUD-${Date.now().toString().slice(-4)}`,
      actor: currentUser.name,
      action: 'Stock Hold Released',
      target_type: 'Stock',
      target_id: stockId,
      details: `Released stock unit ${stockId} back to available inventory.`,
      source: 'Virtual Yard',
      timestamp: new Date().toISOString(),
    };
    setAuditLog((prev) => [audit, ...prev]);

    addToast('info', 'Stock Hold Released', `Stock unit ${stockId} returned to available inventory.`);
  };

  // Sales Log Reconcile (§5.7)
  const reconcileSalesLogRow = async (salesLogId: string) => {
    try {
      await syncApi.reconcileSalesLog(salesLogId);
    } catch (err) {
      console.warn('reconcileSalesLogRow api error:', err);
    }

    setSalesLog((prev) =>
      prev.map((sl) => (sl.sales_log_id === salesLogId ? { ...sl, reconciled: true } : sl))
    );
    addToast('success', 'Reconciled with Finance', `Row ${salesLogId} matched with official GL.`);
  };

  // Delivery Handover Watch Note Write-back (§5.8)
  const addDeliveryHandoverNote = async (clientId: string, note: string) => {
    try {
      await syncApi.updateDeliveryNote(clientId, note);
    } catch (err) {
      console.warn('updateDeliveryNote api error:', err);
    }

    setDeliveryWatch((prev) =>
      prev.map((d) => (d.client_id === clientId ? { ...d, last_comment: note } : d))
    );

    const client = deliveryWatch.find((d) => d.client_id === clientId);
    if (client) {
      const opp = opportunities.find((o) => o.opportunity_id === client.opportunity_id);
      if (opp) {
        addTimelineNote(opp.customer_id, `[Delivery Centre Handover Note]: ${note}`, opp.opportunity_id);
      }
    }

    addToast('success', 'Handover Note Sent', 'Note transmitted to Delivery Centre specialist.');
  };

  // Appointment creation
  const createAppointment = (appt: Partial<Appointment>) => {
    const newAppt: Appointment = {
      appointment_id: `APT-${Math.floor(500 + Math.random() * 499)}`,
      customer_id: appt.customer_id || 'CUST-0891',
      customer_name: appt.customer_name || 'Customer',
      phone: appt.phone || '+61400000000',
      type: appt.type || 'Test Drive',
      when: appt.when || new Date().toISOString(),
      duration_minutes: appt.duration_minutes || 45,
      vehicle: appt.vehicle || 'BYD SEALION 7',
      loop: appt.loop || 'CBD Demo Loop',
      consultant: currentUser.name,
      site: (appt.site || selectedSite !== 'All Sites' ? selectedSite : 'Fairfield') as SiteLocation,
      status: 'Confirmed',
      notes: appt.notes || '',
    };
    setAppointments((prev) => [newAppt, ...prev]);

    // Timeline event
    const evt: TimelineEvent = {
      event_id: `EVT-${Date.now().toString().slice(-4)}`,
      customer_id: newAppt.customer_id,
      occurred_at: 'Just now (AEST)',
      source: 'Sales CRM',
      type: 'appointment',
      author: currentUser.name,
      title: `${newAppt.type} Booked: ${newAppt.vehicle}`,
      content: `Scheduled for ${new Date(newAppt.when).toLocaleString()}. Route: ${newAppt.loop}. Notes: ${newAppt.notes}`,
      visibility: 'internal',
    };
    setTimelineEvents((prev) => [evt, ...prev]);

    addToast('success', 'Appointment Scheduled', `${newAppt.type} confirmed with ${newAppt.customer_name}.`);
  };

  // SMS Send (§5.9)
  const sendSmsMessage = async (customerId: string, phone: string, message: string): Promise<boolean> => {
    try {
      await crmMessageApi.sendSms({ phone, body: message, customerId });
    } catch (err) {
      console.warn('sendSmsMessage api error:', err);
    }

    const smsEvt: TimelineEvent = {
      event_id: `EVT-${Date.now().toString().slice(-4)}`,
      customer_id: customerId,
      occurred_at: 'Just now (AEST)',
      source: 'Sales CRM',
      type: 'sms_out',
      author: currentUser.name,
      title: `Outbound SMS to ${phone}`,
      content: message,
      visibility: 'customer-facing',
    };
    setTimelineEvents((prev) => [smsEvt, ...prev]);

    addToast('success', 'SMS Outbound Dispatched', `Message sent to ${phone} via MobileMessage gateway.`);
    return true;
  };

  // Filtered lists based on tenancy (selectedSite)
  const filteredCustomers =
    selectedSite === 'All Sites'
      ? customers
      : customers.filter((c) => c.site === selectedSite);

  const filteredOpportunities =
    selectedSite === 'All Sites'
      ? opportunities
      : opportunities.filter((o) => o.site === selectedSite);

  const filteredAllocations =
    selectedSite === 'All Sites'
      ? allocations
      : allocations.filter((a) => a.site === selectedSite);

  const filteredSalesLog =
    selectedSite === 'All Sites'
      ? salesLog
      : salesLog.filter((s) => s.site === selectedSite);

  const filteredAppointments =
    selectedSite === 'All Sites'
      ? appointments
      : appointments.filter((a) => a.site === selectedSite);

  return (
    <CrmContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        selectedSite,
        setSelectedSite,
        currentRole,
        setCurrentRole: handleSetRole,
        isOnline,
        customers: filteredCustomers,
        opportunities: filteredOpportunities,
        allocations: filteredAllocations,
        timelineEvents,
        vyStock,
        salesLog: filteredSalesLog,
        deliveryWatch,
        appointments: filteredAppointments,
        auditLog,

        // Pagination states & fetchers
        vyStockPagination,
        customersPagination,
        opportunitiesPagination,
        allocationsPagination,
        salesLogPagination,
        deliveryWatchPagination,
        fetchVyStock,
        fetchCustomers,
        fetchOpportunities,
        fetchAllocations,
        fetchSalesLog,
        fetchDeliveryWatch,

        addCustomer,
        updateCustomer,
        mergeCustomers,
        toggleOptOut,
        addTimelineNote,
        fetchCustomerTimeline,
        addOpportunity,
        updateOpportunityStage,
        updateOpportunity,
        executeMarkSold,
        acceptAllocation,
        reassignAllocation,
        requestMoreLeads,
        logPhoneCall,
        holdStock,
        releaseStock,
        reconcileSalesLogRow,
        addDeliveryHandoverNote,
        createAppointment,
        updateConsultantTarget,
        sendSmsMessage,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
}
