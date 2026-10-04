'use client';

import React from 'react';
import { CalendarView, CalendarViewProps } from './CalendarView';
import { Customer } from '@/lib/types';

export interface AppointmentsViewProps {
  onOpenBookDrive?: () => void;
  onOpenQuickDeal?: () => void;
  onSelectCustomer?: (customer: Customer) => void;
}

export function AppointmentsView(props: AppointmentsViewProps) {
  return <CalendarView {...props} />;
}

export { CalendarView };
