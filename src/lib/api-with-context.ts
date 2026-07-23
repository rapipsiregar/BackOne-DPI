// src/lib/api-with-context.ts
'use client';

/**
 * api-with-context.ts
 * 
 * Re-exports all API hooks from api.ts with automatic injection of:
 *   1. `timeRange` — from TimeFilterContext (global time filter selector)
 *   2. Auto-refresh — every 5 minutes to stay in sync with proxy collection
 *   3. Client-side memory caching — data renders instantly on tab switches (no loading spinner)
 *      while revalidation happens in the background.
 */

import { useState, useEffect } from 'react';
import { useTimeFilter } from '@/contexts/TimeFilterContext';
import { fetcher } from './api';
import { useCtxFetch, globalCache, REFRESH_INTERVAL_MS } from './api-context-core';
import type {
  DashboardSummary, TimelinePoint, AppStat, ProtocolStat, DeviceStat, ThreatStat,
  AppCategoryStat, ContinentStat, FlowStat, CountryStat, DnsStat, EventStat,
  TlsVersionStat, TlsCipherStat, TlsSecurityStat, IntelligenceStats, SslSanStat,
} from './api';

export type {
  DashboardSummary, TimelinePoint, AppStat, ProtocolStat, DeviceStat, ThreatStat,
  AppCategoryStat, ContinentStat, FlowStat, CountryStat, DnsStat, EventStat,
  TlsVersionStat, TlsCipherStat, TlsSecurityStat, IntelligenceStats, SslSanStat,
};

export function useDashboardSummary() {
  const { timeRange } = useTimeFilter();
  const endpoint = '/summary';
  const cacheKey = `${endpoint}:${timeRange}`;

  const [data, setData] = useState<DashboardSummary | null>(() => {
    return (globalCache[cacheKey] as DashboardSummary) ?? null;
  });
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    return !globalCache[cacheKey];
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!globalCache[cacheKey]) {
      setIsLoading(true);
    }
    fetcher<DashboardSummary>(endpoint, timeRange)
      .then(res => {
        globalCache[cacheKey] = res;
        setData(res);
      })
      .catch(setError)
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, tick]);

  return { data, error, isLoading };
}

export function useTimeline(points: number = 60, agentUuid?: string) {
  const { timeRange } = useTimeFilter();
  const endpoint = agentUuid 
    ? `/timeline?points=${points}&agent_uuid=${agentUuid}` 
    : `/timeline?points=${points}`;
  const cacheKey = `${endpoint}:${timeRange}`;

  const [data, setData] = useState<TimelinePoint[]>(() => {
    return (globalCache[cacheKey] as TimelinePoint[]) ?? [];
  });
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(() => {
    return !globalCache[cacheKey];
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), REFRESH_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!globalCache[cacheKey]) {
      setIsLoading(true);
    }
    fetcher<TimelinePoint[]>(endpoint, timeRange)
      .then(res => {
        const val = Array.isArray(res) ? res.slice().reverse() : [];
        globalCache[cacheKey] = val;
        setData(val);
      })
      .catch(setError)
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, agentUuid, timeRange, tick]);

  return { data, error, isLoading };
}

export function useTopApps(limit: number = 1000000) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<AppStat[]>(`/apps?limit=${limit}`, timeRange, []);
}

export function useTopProtocols() {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<ProtocolStat[]>('/protocols', timeRange, []);
}

export function useSslSans(limit: number = 1000000) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<SslSanStat[]>(`/ssl-subject-alt-names?limit=${limit}`, timeRange, []);
}

export function useDevices(limit: number = 1000000) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<DeviceStat[]>(`/devices?limit=${limit}`, timeRange, []);
}

export function useThreats(limit: number = 1000000) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<ThreatStat[]>(`/threats?limit=${limit}`, timeRange, []);
}

export function useAppCategories() {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<AppCategoryStat[]>('/app-categories', timeRange, []);
}

export function useContinents() {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<ContinentStat[]>('/continents', timeRange, []);
}

export function useFlows(page: number = 1, pageSize: number = 50, filters: any = {}) {
  const { timeRange } = useTimeFilter();
  const queryParts = [
    `limit=${pageSize}`,
    `skip=${(page - 1) * pageSize}`
  ];
  if (filters.protocol) queryParts.push(`protocol=${encodeURIComponent(filters.protocol)}`);
  if (filters.src_ip) queryParts.push(`src_ip=${encodeURIComponent(filters.src_ip)}`);
  if (filters.dst_ip) queryParts.push(`dst_ip=${encodeURIComponent(filters.dst_ip)}`);
  if (filters.dst_port) queryParts.push(`dst_port=${encodeURIComponent(filters.dst_port)}`);
  if (filters.app) queryParts.push(`app=${encodeURIComponent(filters.app)}`);
  if (filters.domain) queryParts.push(`domain=${encodeURIComponent(filters.domain)}`);
  if (filters.sort_download) queryParts.push(`sort_download=${encodeURIComponent(filters.sort_download)}`);
  if (filters.sort_upload) queryParts.push(`sort_upload=${encodeURIComponent(filters.sort_upload)}`);
  if (filters.dateFrom) queryParts.push(`date_from=${encodeURIComponent(filters.dateFrom)}`);
  if (filters.dateTo) queryParts.push(`date_to=${encodeURIComponent(filters.dateTo)}`);
  if (filters.search) queryParts.push(`search=${encodeURIComponent(filters.search)}`);

  const endpoint = `/flows?${queryParts.join('&')}`;
  const { data: res, error, isLoading } = useCtxFetch<{ flows: FlowStat[], total: number }>(endpoint, timeRange, { flows: [], total: 0 });
  return {
    data: res.flows || [],
    total: res.total || 0,
    error,
    isLoading
  };
}

export interface FlowOptions {
  protocols: string[];
  srcIps: string[];
  dstIps: string[];
  dstPorts: string[];
  apps: string[];
  domains: string[];
}

export function useFlowsOptions() {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<FlowOptions>('/flows-options', timeRange, {
    protocols: [],
    srcIps: [],
    dstIps: [],
    dstPorts: [],
    apps: [],
    domains: []
  });
}

export function useCountries(limit: number = 1000000) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<CountryStat[]>(`/countries?limit=${limit}`, timeRange, []);
}

export function useDNS(limit: number = 1000000) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<DnsStat[]>(`/dns?limit=${limit}`, timeRange, []);
}

export function useEvents(limit: number = 1000000) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<EventStat[]>(`/events?limit=${limit}`, timeRange, []);
}

// Re-export security-specific hooks
export { useTlsVersions, useTlsCiphers, useTlsSecurity, useIntelligenceStats } from './api-with-context-security';

// Re-export utilities from api.ts
export { fetcher, fetchAgentDetails, fetchDeviceDetails, fetchAppDetails, fetchSecurityDevices } from './api';
export { useLookupApplications } from './api';
