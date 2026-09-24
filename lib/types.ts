export type SiteLocation =
  | 'Fairfield'
  | 'Melbourne City'
  | 'Doncaster'
  | 'Nunawading'
  | 'Caroline Springs'
  | 'All Sites';

export type UserRole =
  | 'consultant'
  | 'manager'
  | 'bdc'
  | 'delivery'
  | 'super_admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  site: SiteLocation;
  team: string;
  avatarInitials: string;
}

export type CustomerRecordType = 'Individual' | 'Company' | 'Fleet' | 'Household';

export interface Customer {
  customer_id: string;
  name: string;
  phone: string; // AU E.164 (+61)
  email: string;
  site: SiteLocation;
  owner_user_id: string;
  owner_name: string;
  source: 'Virtual Yard' | 'Autogate' | 'Manual' | 'Carsales' | 'Walk-in' | 'Web';
  record_type: CustomerRecordType;
  company_name?: string;
  lead_prospect_id?: string;
  delivery_client_id?: string;
  consent_sms: boolean;
  consent_updated_at: string;
  do_not_contact: boolean;
  notes?: string;
  created_at: string;
  total_open_value?: number;
  current_stage?: OpportunityStage;
  active_deal_id?: string;
  active_vy_stock?: string;
}

export type OpportunityStage =
  | 'New / Allocated'
  | 'Working'
  | 'Appointment'
  | 'Negotiation'
  | 'Written / Sold'
  | 'In Delivery'
  | 'Delivered / Won'
  | 'Lost / Parked';

export type SaleType =
  | 'Retail'
  | 'Lease'
  | 'Novated'
  | 'Fleet'
  | 'Government'
  | 'Rental'
  | 'Cash'
  | 'Demo'
  | 'Other';

export interface Opportunity {
  opportunity_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  site: SiteLocation;
  owner_user_id: string;
  owner_name: string;
  secondary_owner?: string;
  secondary_split?: number; // e.g. 50%
  stage: OpportunityStage;
  vehicle_descriptor: string;
  model: string;
  variant: string;
  colour: string;
  order_type: 'Stock' | 'Factory Order';
  vy_stock_id?: string;
  vy_order_id?: string;
  sale_type: SaleType;
  list_price: number;
  discount: number;
  extras: number;
  total_deal_value: number;
  trade_in_flag: boolean;
  trade_in_details?: {
    makeModel: string;
    rego: string;
    year: number;
    valuation: number;
    status: 'Pending' | 'Valued' | 'Accepted' | 'Settled';
  };
  expected_close: string;
  next_action_at: string;
  next_action_text: string;
  is_overdue?: boolean;
  sales_log_id?: string;
  delivery_client_id?: string;
  delivery_stage?: 'Scheduled' | 'Pre-Delivery Inspection' | 'In Transit' | 'Ready for Pickup' | 'Delivered';
  lost_reason?: 'Price' | 'Stock Unavailable' | 'Chose Competitor' | 'Finance Declined' | 'Opted Out' | 'Other';
  lost_notes?: string;
  sync_status: 'synced' | 'vy_pending' | 'delivery_pending' | 'failed';
  created_at: string;
  updated_at: string;
}

export type TimelineEventSource =
  | 'Sales CRM'
  | 'Lead Centre'
  | 'Delivery Centre'
  | 'Virtual Yard'
  | 'Sales Log'
  | 'System';

export type TimelineEventType =
  | 'note'
  | 'sms_in'
  | 'sms_out'
  | 'call_log'
  | 'email'
  | 'stage_change'
  | 'assignment'
  | 'appointment'
  | 'vy_stock_event'
  | 'sales_log_write'
  | 'delivery_stage_change'
  | 'document'
  | 'system';

export interface TimelineEvent {
  event_id: string;
  customer_id: string;
  opportunity_id?: string;
  occurred_at: string; // Humanized or AEST timestamp
  source: TimelineEventSource;
  type: TimelineEventType;
  author: string;
  title: string;
  content: string;
  visibility: 'internal' | 'customer-facing';
  deep_link?: {
    label: string;
    url: string;
  };
}

export interface AllocationItem {
  allocation_id: string;
  customer_id: string;
  prospect_name: string;
  phone: string;
  email: string;
  vehicle: string;
  source: string;
  site: SiteLocation;
  ai_score: number;
  last_sms_summary: string;
  allocated_at: string;
  sla_minutes: number;
  sla_deadline: string;
  status: 'pending' | 'accepted' | 'escalated' | 'reassigned';
  assigned_to: string;
  appointment_booked?: string;
  lead_prospect_id: string;
}

export interface VirtualYardStock {
  stock_id: string;
  vin: string;
  model: string;
  variant: string;
  colour: string;
  location: string;
  status: 'Available' | 'Held' | 'Inbound' | 'Sold' | 'Withdrawn';
  held_by?: string;
  held_by_consultant?: string;
  held_for_customer?: string;
  held_opportunity_id?: string;
  hold_expires_at?: string;
  eta?: string;
  eta_days: number;
  retail_price: number;
  battery_kwh?: number;
}

export interface SalesLogEntry {
  sales_log_id: string;
  deal_date: string;
  customer_name: string;
  vehicle: string;
  vin: string;
  stock_id: string;
  sale_type: SaleType;
  consultant: string;
  site: SiteLocation;
  amount: number;
  gross?: number;
  reconciled: boolean;
  crm_opportunity_id: string;
}

export interface DeliveryHandoverWatch {
  client_id: string;
  opportunity_id: string;
  customer_name: string;
  phone: string;
  vehicle: string;
  vin: string;
  rego: string;
  stage: 'Scheduled' | 'Pre-Delivery Inspection' | 'In Transit' | 'Ready for Pickup' | 'Delivered';
  delivery_date: string;
  delivery_consultant: string;
  handover_specialist: string;
  contact_status: string;
  docs_completeness: 'Requested' | 'Partial' | 'Complete';
  docs_status: {
    atrSigned: boolean;
    licenceFront: boolean;
    insurance: boolean;
    paymentSettled: boolean;
  };
  arrived: boolean;
  last_comment: string;
  alert?: string;
}

export interface Appointment {
  appointment_id: string;
  customer_id: string;
  customer_name: string;
  phone: string;
  type: 'Test Drive' | 'Showroom Visit' | 'Trade-in Appraisal' | 'Handover';
  when: string;
  duration_minutes: number;
  vehicle: string;
  loop?: string;
  consultant: string;
  site: SiteLocation;
  status: 'Confirmed' | 'Completed' | 'Cancelled' | 'No Show';
  notes?: string;
}

export interface ConsultantScore {
  name: string;
  site: SiteLocation;
  written_units_mtd: number;
  target_units: number;
  written_gross_mtd: number;
  open_deals_count: number;
  overdue_actions_count: number;
  conversion_rate_pct: number;
  avg_first_touch_minutes: number;
}

export interface AuditLogEntry {
  audit_id: string;
  actor: string;
  action: string;
  target_type: 'Customer' | 'Opportunity' | 'Stock' | 'Sales Log' | 'Delivery';
  target_id: string;
  details: string;
  source: string;
  timestamp: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T;
  count?: number;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  pagination?: PaginationMeta;
  message?: string;
}

