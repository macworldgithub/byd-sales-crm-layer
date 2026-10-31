'use client';

import { useEffect, useState } from 'react';
import { browseApi } from './api';
import { PaginationMeta } from './types';

export type BrowseMeta = {
  filters?: Record<string, string[]>;
  totalValue?: number;
  stages?: Record<string, { count: number; value: number }>;
  timezone?: string;
};
export type BrowseParams = Record<
  string,
  string | number | boolean | undefined
>;

// Used by calendar grids and exports: follow every server page, never a fixed cap.
export async function readAllPages<T>(
  request: (
    page: number
  ) => Promise<{
    success: boolean;
    data?: T[];
    pagination?: PaginationMeta;
    meta?: BrowseMeta;
    message?: string;
  }>,
  signal: AbortSignal
) {
  const rows: T[] = [];
  let page = 1;
  let expectedTotal: number | undefined;
  const seen = new Set<string>();
  let last: Awaited<ReturnType<typeof request>>;
  do {
    if (signal.aborted) throw new Error('Request cancelled.');
    last = await request(page);
    if (signal.aborted) throw new Error('Request cancelled.');
    if (!last.success || !last.data || !last.pagination)
      throw new Error(last.message || 'Unable to load records.');
    if (expectedTotal !== undefined && expectedTotal !== last.pagination.total)
      throw new Error('Records changed while loading. Please refresh.');
    expectedTotal = last.pagination.total;
    if (last.pagination.page !== page && last.pagination.total > 0)
      throw new Error('Records changed while loading. Please refresh.');
    for (const row of last.data) {
      const id =
        row && typeof row === 'object' && 'id' in row
          ? String(row.id)
          : undefined;
      if (id !== undefined && seen.has(id))
        throw new Error('Records changed while loading. Please refresh.');
      if (id !== undefined) seen.add(id);
    }
    rows.push(...last.data);
    if (!last.pagination.hasNextPage) break;
    if (!last.data.length)
      throw new Error(
        'Unable to finish loading calendar records. Please refresh.'
      );
    page++;
  } while (true);
  if (rows.length !== expectedTotal)
    throw new Error(
      'Unable to finish loading calendar records. Please refresh.'
    );
  return { ...last!, data: rows };
}

export function useBrowse<T>(
  resource: 'leads' | 'opportunities' | 'calendar',
  params: BrowseParams,
  allPages = false
) {
  const [revision, setRevision] = useState(0);
  const key = JSON.stringify([resource, params, allPages, revision]);
  const [result, setResult] = useState<{
    key: string;
    data: T[];
    pagination?: PaginationMeta;
    meta?: BrowseMeta;
    error?: string;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = allPages
          ? await readAllPages<T>(
              (page) =>
                browseApi.list<T>(
                  resource,
                  { ...params, page, limit: 100 },
                  controller.signal
                ),
              controller.signal
            )
          : await browseApi.list<T>(resource, params, controller.signal);
        if (controller.signal.aborted) return;
        if (!response.success || !response.data)
          throw new Error(response.message || 'Unable to load records.');
        setResult({
          key,
          data: response.data,
          pagination: response.pagination,
          meta: response.meta,
        });
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            key,
            data: [],
            error:
              error instanceof Error
                ? error.message
                : 'Unable to load records.',
          });
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // The serialized key represents the complete request, including filters and page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const ready = result?.key === key;
  return {
    data: ready ? result.data : [],
    pagination: ready ? result.pagination : undefined,
    meta: result?.meta,
    loading: !ready,
    error: ready ? result.error : undefined,
    reload: () => setRevision((value) => value + 1),
  };
}

export function useBrowseQuery<T extends Record<string, string>>(
  initial: T,
  scope: string
) {
  const [state, setState] = useState({
    filters: initial,
    page: 1,
    limit: 25,
    scope,
  });
  return {
    filters: state.filters,
    page: state.scope === scope ? state.page : 1,
    limit: state.limit,
    change: (key: keyof T, value: string) =>
      setState((old) => ({
        ...old,
        scope,
        page: 1,
        filters: { ...old.filters, [key]: value },
      })),
    setPage: (page: number) => setState((old) => ({ ...old, scope, page })),
    setLimit: (limit: number) =>
      setState((old) => ({ ...old, scope, page: 1, limit })),
    reset: () =>
      setState((old) => ({ ...old, scope, page: 1, filters: initial })),
  };
}
