'use client';

import React, {
  useRef,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
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
import { confirmDealSold } from './dealActions';
import {
  customerApi,
  opportunityApi,
  allocationApi,
  vyApi,
  syncApi,
  crmMessageApi,
  authApi,
  boardApi,
  appointmentApi,
  runtimeApi,
  CrmReferenceData,
  getToken,
  getLockedSite,
} from './api';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
}

export function matchesSite(
  recordSiteOrYard?: string | null,
  targetSite?: string | null
): boolean {
  if (
    !targetSite ||
    targetSite === 'All Sites' ||
    targetSite === 'All Locations' ||
    targetSite === 'All Sites & Yards' ||
    targetSite === 'All Yards' ||
    targetSite === 'All Departments' ||
    targetSite === 'All'
  ) {
    return true;
  }
  if (!recordSiteOrYard) return false;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/^byd\s+/i, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

  const cleanTarget = normalize(targetSite);
  const cleanRecord = normalize(recordSiteOrYard);

  if (cleanTarget === cleanRecord) return true;
  if (cleanRecord.includes(cleanTarget) || cleanTarget.includes(cleanRecord))
    return true;
  return false;
}

interface CrmContextType {
  // Current Session & Tenancy
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  selectedSite: SiteLocation;
  setSelectedSite: (site: SiteLocation) => void;
  /** Site the logged-in user is restricted to ('' = unrestricted) */
  lockedSite: string;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  isOnline: boolean;
  reference: CrmReferenceData;
  sites: string[];
  fetchReferenceData: () => Promise<boolean>;
  dataErrors: Record<string, string>;
  refreshAll: () => Promise<void>;

  // Data Collections (Filtered by Site where applicable)
  customers: Customer[];
  customerOptions: Customer[];
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
  appointmentsPagination?: PaginationMeta;

  // Pagination Fetch Triggers
  fetchVyStock: (params?: Record<string, any>) => Promise<boolean>;
  fetchCustomers: (params?: Record<string, any>) => Promise<boolean>;
  fetchOpportunities: (params?: Record<string, any>) => Promise<boolean>;
  fetchAllocations: (params?: Record<string, any>) => Promise<boolean>;
  fetchSalesLog: (params?: Record<string, any>) => Promise<boolean>;
  fetchDeliveryWatch: (params?: Record<string, any>) => Promise<boolean>;
  fetchAppointments: (params?: Record<string, any>) => Promise<boolean>;

  // Actions: Customer & 360
  addCustomer: (data: Partial<Customer>) => Promise<Customer>;
  updateCustomer: (customerId: string, patch: Partial<Customer>) => void;
  mergeCustomers: (sourceId: string, targetId: string) => Promise<boolean>;
  unlinkCustomer: (
    customerId: string,
    linkType?: 'lead' | 'delivery' | 'all'
  ) => Promise<void>;
  toggleOptOut: (customerId: string) => void;
  addTimelineNote: (
    customerId: string,
    content: string,
    opportunityId?: string
  ) => Promise<boolean>;
  addTimelineEmail: (
    customerId: string,
    email: { subject: string; body: string; to?: string; direction?: string }
  ) => Promise<void>;
  fetchCustomerTimeline: (customerId: string) => Promise<void>;
  fetchCustomerAudit: (customerId: string) => Promise<void>;

  // Actions: Deals & Opportunities
  addOpportunity: (data: Partial<Opportunity>) => Promise<Opportunity>;
  updateOpportunityStage: (
    opportunityId: string,
    newStage: OpportunityStage,
    reason?: string
  ) => void;
  updateOpportunity: (
    opportunityId: string,
    patch: Partial<Opportunity>
  ) => void;
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
      is_factory_order?: boolean;
    }
  ) => Promise<{ success: boolean; message: string }>;

  // Actions: Lead Intake & Phone Logging (§5.3, §5.9)
  createAllocation: (
    data: Record<string, any>
  ) => Promise<AllocationItem | null>;
  acceptAllocation: (allocationId: string) => void;
  reassignAllocation: (allocationId: string, targetConsultant: string) => void;
  requestMoreLeads: () => void;
  logPhoneCall: (
    customerId: string,
    details: {
      outcome: string;
      durationMinutes: number;
      notes: string;
      opportunityId?: string;
    }
  ) => Promise<boolean>;

  // Actions: Virtual Yard Push/Pull (§5.6)
  holdStock: (stockId: string, opportunityId: string) => Promise<boolean>;
  releaseStock: (stockId: string) => void;

  // Actions: Sales Log Reconcile (§5.7)
  reconcileSalesLogRow: (salesLogId: string) => void;

  // Actions: Delivery Handover (§5.8)
  addDeliveryHandoverNote: (clientId: string, note: string) => void;
  requestDeliveryDateChange: (
    clientId: string,
    requestedDate: string,
    reason: string
  ) => Promise<void>;

  // Actions: Appointments & Targets (§5.5, §5.9)
  createAppointment: (appt: Partial<Appointment>) => Promise<Appointment>;
  updateConsultantTarget: (
    consultantName: string,
    newTarget: number,
    site?: string
  ) => Promise<boolean>;

  // Scoreboards & Monthly Quotas
  boardMe?: any;
  boardTeam?: any;
  fetchScoreboards: () => Promise<void>;

  // Actions: SMS Messaging (§5.9)
  sendSmsMessage: (
    customerId: string,
    phone: string,
    message: string
  ) => Promise<boolean>;

  // Toasts
  toasts: ToastMessage[];
  addToast: (
    type: ToastMessage['type'],
    title: string,
    description?: string
  ) => void;
  removeToast: (id: string) => void;
}

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    role: 'consultant',
    site: '',
    team: '',
    avatarInitials: '',
  });
  const [selectedSite, setSelectedSiteState] =
    useState<SiteLocation>('All Sites');
  const [lockedSite, setLockedSite] = useState('');
  const [currentRole, setCurrentRole] = useState<UserRole>('consultant');
  const [isOnline, setIsOnline] = useState(false);
  const [reference, setReference] = useState<CrmReferenceData>({
    sites: [],
    staff: [],
    models: [],
    smsTemplates: [],
    inventoryCount: 0,
    consultants: [],
    sources: [],
    links: { leadCentre: '', deliveryCentre: '' },
  });
  const [dataErrors, setDataErrors] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [allocations, setAllocations] = useState<AllocationItem[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [vyStock, setVyStock] = useState<VirtualYardStock[]>([]);
  const [salesLog, setSalesLog] = useState<SalesLogEntry[]>([]);
  const [deliveryWatch, setDeliveryWatch] = useState<DeliveryHandoverWatch[]>(
    []
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [vyStockPagination, setVyStockPagination] = useState<PaginationMeta>();
  const [customersPagination, setCustomersPagination] =
    useState<PaginationMeta>();
  const [opportunitiesPagination, setOpportunitiesPagination] =
    useState<PaginationMeta>();
  const [allocationsPagination, setAllocationsPagination] =
    useState<PaginationMeta>();
  const [salesLogPagination, setSalesLogPagination] =
    useState<PaginationMeta>();
  const [deliveryWatchPagination, setDeliveryWatchPagination] =
    useState<PaginationMeta>();
  const [appointmentsPagination, setAppointmentsPagination] =
    useState<PaginationMeta>();
  const [boardMe, setBoardMe] = useState<any>(null);
  const [boardTeam, setBoardTeam] = useState<any>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const sequence = useRef<Record<string, number>>({});
  const sessionScope = `${currentUser.id}:${selectedSite}`;
  const scopeRef = useRef(sessionScope);
  scopeRef.current = sessionScope;
  const site = selectedSite !== 'All Sites' ? selectedSite : undefined;

  const setSelectedSite = useCallback((value: SiteLocation) => {
    const lock = getLockedSite();
    setLockedSite(lock);
    const next = lock || value;
    setSelectedSiteState(next);
    if (typeof window !== 'undefined')
      localStorage.setItem('byd_crm_site', next);
  }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const lock = getLockedSite();
    setLockedSite(lock);
    setSelectedSiteState(
      lock || localStorage.getItem('byd_crm_site') || 'All Sites'
    );
  }, []);
  const addToast = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = crypto.randomUUID();
      setToasts((old) => [...old, { id, type, title, description }]);
      setTimeout(
        () => setToasts((old) => old.filter((toast) => toast.id !== id)),
        4500
      );
    },
    []
  );
  const removeToast = (id: string) =>
    setToasts((old) => old.filter((toast) => toast.id !== id));
  function must<T>(
    response: { success: boolean; data?: T; message?: string },
    requireData = true
  ): T {
    if (!response.success || (requireData && response.data === undefined))
      throw new Error(
        response.message || 'The request could not be completed.'
      );
    return response.data as T;
  }
  const load = useCallback(
    async (
      name: string,
      request: () => Promise<any>,
      setRows: (rows: any) => void,
      setPagination?: (pagination: PaginationMeta | undefined) => void
    ) => {
      const ticket = (sequence.current[name] =
        (sequence.current[name] || 0) + 1);
      const scope = scopeRef.current;
      try {
        const response = await request();
        if (scope !== scopeRef.current || ticket !== sequence.current[name])
          return false;
        const rows = must(response);
        setRows(rows);
        setPagination?.(response.pagination);
        setDataErrors((old) => {
          const next = { ...old };
          delete next[name];
          return next;
        });
        return true;
      } catch (error) {
        if (scope !== scopeRef.current || ticket !== sequence.current[name])
          return false;
        setRows([]);
        setPagination?.(undefined);
        setDataErrors((old) => ({
          ...old,
          [name]:
            error instanceof Error ? error.message : 'Unable to load data.',
        }));
        return false;
      }
    },
    []
  );
  const fetchCustomers = useCallback(
    async (params = {}) => {
      return await load(
        'Customers',
        () => customerApi.getCustomers(params),
        setCustomers,
        setCustomersPagination
      );
    },
    [load]
  );
  const fetchOpportunities = useCallback(
    async (params = {}) => {
      return await load(
        'Deals',
        () => opportunityApi.getOpportunities(params),
        setOpportunities,
        setOpportunitiesPagination
      );
    },
    [load]
  );
  const fetchAllocations = useCallback(
    async (params = {}) => {
      return await load(
        'Allocations',
        () => allocationApi.getAllocations(params),
        setAllocations,
        setAllocationsPagination
      );
    },
    [load]
  );
  const fetchVyStock = useCallback(
    async (params = {}) => {
      return await load(
        'Stock',
        () => vyApi.getStock(params),
        setVyStock,
        setVyStockPagination
      );
    },
    [load]
  );
  const fetchSalesLog = useCallback(
    async (params = {}) => {
      return await load(
        'Sales Log',
        () => syncApi.getSalesLog(params),
        setSalesLog,
        setSalesLogPagination
      );
    },
    [load]
  );
  const fetchDeliveryWatch = useCallback(
    async (params = {}) => {
      return await load(
        'Deliveries',
        () => syncApi.getDeliveryWatch(params),
        setDeliveryWatch,
        setDeliveryWatchPagination
      );
    },
    [load]
  );
  const mapAppointment = (a: any): Appointment => ({
    appointment_id: String(
      a.id || a._id || a.appointment_id || a.appointmentId
    ),
    customer_id: a.customer_id || a.leadId || '',
    customer_name: a.customer_name || a.prospectName || '',
    phone: a.phone || '',
    type: a.type || 'Test Drive',
    when: a.when || a.testDriveDate || '',
    duration_minutes: a.duration_minutes ?? a.durationMinutes,
    vehicle: a.vehicle || '',
    loop: a.loop || '',
    consultant: a.consultant || a.consultantName || a.bookedBy || '',
    site: a.site || a.dealership || a.location || '',
    status: a.status || '',
    notes: a.notes || '',
    virtualyardSync: a.virtualyardSync,
  });
  const fetchAppointments = useCallback(
    async (params = {}) => {
      return await load(
        'Appointments',
        () => appointmentApi.getAppointments(params),
        (rows) => setAppointments(rows.map(mapAppointment)),
        setAppointmentsPagination
      );
    },
    [load]
  );
  const fetchReferenceData = useCallback(async () => {
    const scope = scopeRef.current;
    try {
      const data = must(await runtimeApi.bootstrap(site));
      if (scope !== scopeRef.current) return false;
      setReference(data);
      setDataErrors((old) => {
        const next = { ...old };
        delete next.Reference;
        return next;
      });
      return true;
    } catch (error) {
      if (scope === scopeRef.current) {
        setReference({
          sites: [],
          staff: [],
          models: [],
          smsTemplates: [],
          inventoryCount: 0,
          consultants: [],
          sources: [],
          links: { leadCentre: '', deliveryCentre: '' },
        });
        setDataErrors((old) => ({
          ...old,
          Reference:
            error instanceof Error
              ? error.message
              : 'Unable to load reference data.',
        }));
      }
      return false;
    }
  }, [site]);
  const fetchScoreboards = useCallback(async () => {
    const requests: Promise<unknown>[] = [
      load('Your scoreboard', () => boardApi.getBoardMe({ site }), setBoardMe),
    ];
    if (['manager', 'site_admin', 'super_admin', 'bdc'].includes(currentRole))
      requests.push(
        load(
          'Team scoreboard',
          () => boardApi.getBoardTeam({ site }),
          setBoardTeam
        )
      );
    else setBoardTeam(null);
    await Promise.all(requests);
  }, [load, site, currentRole]);
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchReferenceData(),
      fetchScoreboards(),
      fetchCustomers({ limit: 50, site }),
      fetchOpportunities({ limit: 50, site }),
      fetchAllocations({ limit: 50, site }),
      fetchVyStock({ limit: 20, site }),
      fetchSalesLog({ limit: 50, site }),
      fetchDeliveryWatch({ limit: 20, site }),
      fetchAppointments({ limit: 50, timeframe: 'Today', site }),
    ]);
  }, [
    fetchReferenceData,
    fetchScoreboards,
    fetchCustomers,
    fetchOpportunities,
    fetchAllocations,
    fetchVyStock,
    fetchSalesLog,
    fetchDeliveryWatch,
    fetchAppointments,
    site,
  ]);
  useEffect(() => {
    setCustomers([]);
    setOpportunities([]);
    setAllocations([]);
    setVyStock([]);
    setSalesLog([]);
    setDeliveryWatch([]);
    setAppointments([]);
    setTimelineEvents([]);
    setAuditLog([]);
    setBoardMe(null);
    setBoardTeam(null);
    setDataErrors({});
    if (currentUser.id && getToken()) void refreshAll();
  }, [sessionScope, refreshAll]);
  useEffect(() => {
    const check = async () => {
      const response = await runtimeApi.health();
      setIsOnline(
        response.success === true &&
          (response.data?.databases || (response as any).databases)
            ?.leadCenter === 'connected' &&
          (response.data?.databases || (response as any).databases)
            ?.deliveryCenter === 'connected'
      );
    };
    void check();
    const timer = setInterval(check, 60000);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', check);
    window.addEventListener('offline', offline);
    return () => {
      clearInterval(timer);
      window.removeEventListener('online', check);
      window.removeEventListener('offline', offline);
    };
  }, []);
  const run = async (
    title: string,
    request: () => Promise<any>,
    after?: (data: any) => unknown | Promise<unknown>
  ) => {
    try {
      const response = await request();
      const data = must(response, false);
      await after?.(data);
      addToast('success', title, response.message || 'Saved to the server.');
      return true;
    } catch (error) {
      addToast(
        'error',
        title + ' failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
      return false;
    }
  };
  const actualSite = (requested?: string) => {
    const value = requested || site || currentUser.site;
    if (!value || /^all(?:\s|$)/i.test(value))
      throw new Error('Select a yard before saving.');
    return value;
  };
  const fetchCustomerTimeline = async (id: string) => {
    await load(
      'Timeline',
      () => customerApi.getTimeline(id, { paginate: 'false' }),
      (rows) =>
        setTimelineEvents((old) => [
          ...rows,
          ...old.filter((event) => event.customer_id !== id),
        ])
    );
  };
  const fetchCustomerAudit = async (id: string) => {
    await load(
      'Customer activity',
      () => runtimeApi.audit(site, id),
      setAuditLog
    );
  };
  const addCustomer = async (data: Partial<Customer>): Promise<Customer> => {
    try {
      const created = must(
        await customerApi.createCustomer({
          ...data,
          site: actualSite(data.site),
          owner_user_id: currentUser.id,
          owner_name: currentUser.name,
        })
      );
      setCustomers((old) => [created, ...old]);
      addToast('success', 'Customer saved');
      return created;
    } catch (error) {
      addToast(
        'error',
        'Customer not saved',
        error instanceof Error ? error.message : 'Please try again.'
      );
      throw error;
    }
  };
  const updateCustomer = (id: string, patch: Partial<Customer>) =>
    run(
      'Customer update',
      () => customerApi.updateCustomer(id, patch),
      () => fetchCustomers({ site, limit: 50 })
    );
  const mergeCustomers = (sourceId: string, targetId: string) =>
    run(
      'Customer merge',
      () => customerApi.mergeCustomers(sourceId, targetId),
      refreshAll
    );
  const unlinkCustomer = async (
    id: string,
    type: 'lead' | 'delivery' | 'all' = 'delivery'
  ) => {
    if (
      !(await run(
        'Customer unlink',
        () => customerApi.unlinkCustomer(id, type),
        refreshAll
      ))
    )
      throw new Error('Unlink was not saved.');
  };
  const toggleOptOut = async (id: string) => {
    const response = await customerApi.getCustomer(id);
    if (!response.success || !response.data) {
      addToast('error', 'Unable to load consent', response.message);
      return;
    }
    await updateCustomer(id, {
      do_not_contact: !response.data.do_not_contact,
      consent_sms: response.data.do_not_contact,
    });
  };
  const addTimelineNote = (
    id: string,
    content: string,
    opportunityId?: string
  ) =>
    run(
      'Note saved',
      () =>
        customerApi.addTimelineNote(id, {
          content,
          opportunityId,
          author: currentUser.name,
        } as any),
      () => fetchCustomerTimeline(id)
    );
  const addTimelineEmail = async (
    id: string,
    email: { subject: string; body: string; to?: string; direction?: string }
  ) => {
    if (
      !(await run(
        'Email log saved',
        () =>
          customerApi.addTimelineEmail(id, {
            ...email,
            author: currentUser.name,
          }),
        () => fetchCustomerTimeline(id)
      ))
    )
      throw new Error('Email log was not saved.');
  };
  const addOpportunity = async (
    data: Partial<Opportunity>
  ): Promise<Opportunity> => {
    try {
      const created = must(
        await opportunityApi.createOpportunity({
          ...data,
          site: actualSite(data.site),
          owner_user_id: currentUser.id,
          owner_name: currentUser.name,
          total_deal_value:
            Number(data.list_price || 0) -
            Number(data.discount || 0) +
            Number(data.extras || 0),
        })
      );
      const saved = must(
        await opportunityApi.getOpportunity(created.opportunity_id)
      );
      setOpportunities((old) => [saved, ...old]);
      addToast('success', 'Deal saved');
      return saved;
    } catch (error) {
      addToast(
        'error',
        'Deal not saved',
        error instanceof Error ? error.message : 'Please try again.'
      );
      throw error;
    }
  };
  const updateOpportunity = (id: string, patch: Partial<Opportunity>) =>
    run(
      'Deal update',
      () => opportunityApi.updateOpportunity(id, patch),
      refreshAll
    );
  const updateOpportunityStage = (
    id: string,
    stage: OpportunityStage,
    reason?: string
  ) => updateOpportunity(id, { stage, loss_reason: reason } as any);
  const executeMarkSold = async (
    id: string,
    details: Parameters<typeof opportunityApi.markSold>[1]
  ) => {
    try {
      const result = await confirmDealSold(id, details);
      await refreshAll();
      addToast(
        result.deliverySyncPending ? 'info' : 'success',
        'Deal marked as sold',
        result.message
      );
      return { success: true, message: result.message };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Save failed.';
      addToast('error', 'Mark Sold failed', message);
      return { success: false, message };
    }
  };
  const createAllocation = async (
    data: Record<string, any>
  ): Promise<AllocationItem | null> => {
    let saved: AllocationItem | null = null;
    await run(
      'Lead allocation',
      () => allocationApi.createAllocation(data),
      async (row) => {
        saved = row;
        await refreshAll();
      }
    );
    return saved;
  };
  const acceptAllocation = (id: string) =>
    run(
      'Allocation accepted',
      () => allocationApi.acceptAllocation(id, currentUser.name),
      refreshAll
    );
  const reassignAllocation = (id: string, name: string) =>
    run(
      'Allocation reassigned',
      () => allocationApi.reassignAllocation(id, name),
      refreshAll
    );
  const requestMoreLeads = () => {
    void run('Lead request recorded', () => runtimeApi.requestLeads(site));
  };
  const logPhoneCall = (
    id: string,
    details: {
      outcome: string;
      durationMinutes: number;
      notes: string;
      opportunityId?: string;
    }
  ) =>
    run(
      'Call log saved',
      () => runtimeApi.logCall(id, { ...details, author: currentUser.name }),
      () => fetchCustomerTimeline(id)
    );
  const updateConsultantTarget = (
    name: string,
    target: number,
    targetSite?: string
  ) =>
    run(
      'Monthly target saved',
      () =>
        boardApi.updateTarget({
          consultant: name,
          targetUnits: target,
          site: targetSite || actualSite(),
        } as any),
      fetchScoreboards
    );
  const holdStock = (stockId: string, opportunityId: string) =>
    run(
      'Stock reservation recorded',
      () => vyApi.holdStock(stockId, opportunityId, currentUser.name),
      refreshAll
    );
  const releaseStock = (stockId: string) =>
    run(
      'Stock reservation released',
      () => vyApi.releaseStock(stockId),
      refreshAll
    );
  const reconcileSalesLogRow = (id: string) =>
    run(
      'Reconciliation status saved',
      () => syncApi.reconcileSalesLog(id),
      () => fetchSalesLog({ site, limit: 50 })
    );
  const addDeliveryHandoverNote = (id: string, note: string) =>
    run(
      'Delivery note saved',
      () => syncApi.updateDeliveryNote(id, note),
      () => fetchDeliveryWatch({ site, limit: 20 })
    );
  const requestDeliveryDateChange = async (
    id: string,
    date: string,
    reason: string
  ) => {
    if (
      !(await run(
        'Date change request recorded',
        () => syncApi.requestDeliveryDateChange(id, date, reason),
        () => fetchDeliveryWatch({ site, limit: 20 })
      ))
    )
      throw new Error('The date change request was not saved.');
  };
  const createAppointment = async (appt: Partial<Appointment>) => {
    try {
      if (!appt.when || !appt.vehicle)
        throw new Error('A booking date, time and vehicle are required.');
      const yard = actualSite(appt.site);
      const data = must(
        await appointmentApi.createAppointment({
          ...appt,
          bookingRequestId: appt.bookingRequestId,
          virtualyard: appt.virtualyard,
          prospectName: appt.customer_name,
          consultantName: appt.consultant || currentUser.name,
          durationMinutes: appt.duration_minutes,
          site: yard,
          dealership: yard,
        })
      );
      const saved = mapAppointment(data);
      setAppointments((old) => [
        saved,
        ...old.filter((row) => row.appointment_id !== saved.appointment_id),
      ]);
      if (saved.virtualyardSync?.state === 'synced')
        addToast(
          'success',
          'Test drive saved',
          `Virtual Yard booking #${saved.virtualyardSync.externalId}`
        );
      else if (saved.type === 'Test Drive')
        addToast(
          'warning',
          'CRM booking saved; Virtual Yard needs attention',
          saved.virtualyardSync?.message
        );
      else addToast('success', 'Appointment saved');
      return saved;
    } catch (error) {
      addToast(
        'error',
        'Booking failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
      throw error;
    }
  };
  const sendSmsMessage = async (
    id: string,
    phone: string,
    message: string
  ): Promise<boolean> => {
    try {
      if (/\{\{.*?\}\}/.test(message))
        throw new Error('Complete all template fields before sending.');
      const sent = must(
        await crmMessageApi.sendSms({ phone, body: message, customerId: id })
      );
      if (!sent.messageId)
        throw new Error('The gateway did not confirm the message.');
      await fetchCustomerTimeline(id);
      addToast('success', 'SMS accepted by gateway');
      return true;
    } catch (error) {
      addToast(
        'error',
        'SMS failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
      return false;
    }
  };
  return (
    <CrmContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        selectedSite,
        setSelectedSite,
        lockedSite,
        currentRole,
        setCurrentRole,
        isOnline,
        reference,
        sites: reference.sites,
        dataErrors,
        fetchReferenceData,
        refreshAll,
        customers,
        customerOptions: customers,
        opportunities,
        allocations,
        timelineEvents,
        vyStock,
        salesLog,
        deliveryWatch,
        appointments,
        auditLog,
        boardMe,
        boardTeam,
        fetchScoreboards,
        vyStockPagination,
        customersPagination,
        opportunitiesPagination,
        allocationsPagination,
        salesLogPagination,
        deliveryWatchPagination,
        appointmentsPagination,
        fetchVyStock,
        fetchCustomers,
        fetchOpportunities,
        fetchAllocations,
        fetchSalesLog,
        fetchDeliveryWatch,
        fetchAppointments,
        addCustomer,
        updateCustomer,
        mergeCustomers,
        unlinkCustomer,
        toggleOptOut,
        addTimelineNote,
        addTimelineEmail,
        fetchCustomerTimeline,
        fetchCustomerAudit,
        addOpportunity,
        updateOpportunityStage,
        updateOpportunity,
        executeMarkSold,
        createAllocation,
        acceptAllocation,
        reassignAllocation,
        requestMoreLeads,
        logPhoneCall,
        holdStock,
        releaseStock,
        reconcileSalesLogRow,
        addDeliveryHandoverNote,
        requestDeliveryDateChange,
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
  if (!context) throw new Error('useCrm must be used within a CrmProvider');
  return context;
}
