/**
 * api.ts – Sales CRM Layer API Client
 * Interfaces with byd-panel / backend endpoints, handles authentication tokens,
 * resilient offline fallback, pagination parameters, and unified transactions (e.g. Mark Sold, VY Hold).
 */

import {
  Customer,
  Opportunity,
  TimelineEvent,
  AllocationItem,
  VirtualYardStock,
  SalesLogEntry,
  DeliveryHandoverWatch,
  PaginationMeta,
  PaginatedResponse,
} from './types';

// Dynamic production URL resolution for Vercel deployments
const getBaseUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    // If running in production browser on Vercel or custom domain
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return 'https://byd-sales-floor-backend.vercel.app/api';
    }
  }
  return 'https://byd-sales-floor-backend.vercel.app/api';
};

const TOKEN_KEY = 'byd_crm_token';

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const getToken = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY) || '';
  }
  return '';
};

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{
  success: boolean;
  data?: T;
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  pagination?: PaginationMeta;
  message?: string;
  existingCustomer?: any;
}> {
  try {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      clearToken();
    }

    const json = await response.json();
    return json;
  } catch (err: any) {
    // Return graceful failure for offline resilience
    return { success: false, message: err.message || 'Network error' };
  }
}

function buildQueryString(params?: Record<string, string | number | boolean | undefined | null>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

// ─── CRM Customers API ───────────────────────────────────────────────────────
export const customerApi = {
  getCustomers: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchApi<Customer[]>(`/crm/customers${buildQueryString(params)}`),
  getCustomer: (id: string) => fetchApi<Customer>(`/crm/customers/${id}`),
  createCustomer: (data: Partial<Customer>) =>
    fetchApi<Customer>('/crm/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: Partial<Customer>) =>
    fetchApi<Customer>(`/crm/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  mergeCustomers: (sourceId: string, targetId: string) =>
    fetchApi<Customer>(`/crm/customers/${targetId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ sourceId }),
    }),
  unlinkCustomer: (id: string, linkType: 'lead' | 'delivery' | 'all' = 'delivery') =>
    fetchApi<Customer>(`/crm/customers/${id}/unlink`, {
      method: 'POST',
      body: JSON.stringify({ linkType }),
    }),
  getTimeline: (customerId: string, params?: Record<string, string | number | boolean | undefined>) =>
    fetchApi<TimelineEvent[]>(`/crm/customers/${customerId}/timeline${buildQueryString(params)}`),
  addTimelineNote: (customerId: string, note: { author: string; content: string }) =>
    fetchApi<TimelineEvent>(`/crm/customers/${customerId}/notes`, {
      method: 'POST',
      body: JSON.stringify(note),
    }),
};

// ─── CRM Opportunities API ─────────────────────────────────────────────────
export const opportunityApi = {
  getOpportunities: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchApi<Opportunity[]>(`/crm/opportunities${buildQueryString(params)}`),
  getOpportunity: (id: string) => fetchApi<Opportunity>(`/crm/opportunities/${id}`),
  createOpportunity: (data: Partial<Opportunity>) =>
    fetchApi<Opportunity>('/crm/opportunities', { method: 'POST', body: JSON.stringify(data) }),
  updateOpportunity: (id: string, data: Partial<Opportunity>) =>
    fetchApi<Opportunity>(`/crm/opportunities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  // Single Orchestrated Mark Sold Transaction (§7.5)
  markSold: (
    id: string,
    payload: {
      vin: string;
      vy_stock_id?: string;
      vy_order_id?: string;
      sale_type: string;
      primary_salesperson: string;
      secondary_salesperson?: string;
      deposit: number;
      finance_method?: string;
    }
  ) =>
    fetchApi<{
      opportunity: Opportunity;
      salesLogId: string;
      deliveryClientId: string;
      vyOrderId: string;
    }>(`/crm/opportunities/${id}/mark-sold`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── Lead Intake & Allocations API ─────────────────────────────────────────
export const allocationApi = {
  getAllocations: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchApi<AllocationItem[]>(`/crm/allocations${buildQueryString(params)}`),
  acceptAllocation: (id: string, consultantName: string) =>
    fetchApi<AllocationItem>(`/crm/allocations/${id}/accept`, {
      method: 'POST',
      body: JSON.stringify({ consultantName }),
    }),
  reassignAllocation: (id: string, consultantName: string) =>
    fetchApi<AllocationItem>(`/crm/allocations/${id}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ consultantName }),
    }),
};

// ─── Virtual Yard Stock API ────────────────────────────────────────────────
export const vyApi = {
  getStock: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchApi<VirtualYardStock[]>(`/crm/vy/stock${buildQueryString(params)}`),
  holdStock: (stockId: string, opportunityId: string, consultantName: string) =>
    fetchApi<VirtualYardStock>('/crm/vy/hold', {
      method: 'POST',
      body: JSON.stringify({ stockId, opportunityId, consultantName }),
    }),
  releaseStock: (stockId: string) =>
    fetchApi<VirtualYardStock>('/crm/vy/release', {
      method: 'POST',
      body: JSON.stringify({ stockId }),
    }),
};

// ─── Sales Log & Delivery Sync API ─────────────────────────────────────────
export const syncApi = {
  getSalesLog: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchApi<SalesLogEntry[]>(`/crm/saleslog${buildQueryString(params)}`),
  reconcileSalesLog: (salesLogId: string) =>
    fetchApi<{ reconciled: boolean }>(`/crm/saleslog/${salesLogId}/reconcile`, {
      method: 'POST',
    }),
  getDeliveryWatch: (params?: Record<string, string | number | boolean | undefined>) =>
    fetchApi<DeliveryHandoverWatch[]>(`/crm/delivery-watch${buildQueryString(params)}`),
  updateDeliveryNote: (clientId: string, note: string) =>
    fetchApi(`/clients/${clientId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: note }),
    }),
  requestDeliveryDateChange: (clientId: string, requestedDate: string, reason: string) =>
    fetchApi<{ success: boolean; message?: string }>(`/clients/${clientId}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        body: `[DELIVERY DATE CHANGE REQUEST] Requested Date: ${requestedDate} | Reason: ${reason} | Action Required by Delivery Coordinator`,
      }),
    }),
};

// ─── Messaging & SMS API ───────────────────────────────────────────────────
export const crmMessageApi = {
  sendSms: (payload: { phone: string; body: string; customerId?: string; templateId?: string }) =>
    fetchApi<{ messageId: string; status: string }>('/messages/send', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// ─── Desk Session Authentication API ───────────────────────────────────────
export const authApi = {
  getDeskSession: async () => {
    const res = await fetchApi<{ access_token: string; user: any }>('/auth/crm-session');
    if (res.success && res.data?.access_token) {
      setToken(res.data.access_token);
    }
    return res;
  },
};

// ─── Dynamic Scoreboards & Targets API ───────────────────────────────────────
export const boardApi = {
  getBoardMe: () => fetchApi<any>('/crm/boards/me'),
  getBoardTeam: () => fetchApi<any>('/crm/boards/team'),
  getTargets: () => fetchApi<any>('/crm/targets'),
  updateTarget: (payload: { period?: string; targetUnitCount: number; targetRevenue?: number }) =>
    fetchApi<any>('/crm/targets', { method: 'POST', body: JSON.stringify(payload) }),
};
