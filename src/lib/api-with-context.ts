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

export function useTopApps(limit: number = 10) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<AppStat[]>(`/apps?limit=${limit}`, timeRange, []);
}

export function useTopProtocols() {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<ProtocolStat[]>('/protocols', timeRange, []);
}

export function useSslSans(limit: number = 50) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<SslSanStat[]>(`/ssl-subject-alt-names?limit=${limit}`, timeRange, []);
}

export function useDevices(limit: number = 0) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<DeviceStat[]>(`/devices?limit=${limit}`, timeRange, []);
}

export function useThreats(limit: number = 0) {
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

export function useFlows(limit: number = 0) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<FlowStat[]>(`/flows?limit=${limit}`, timeRange, []);
}

export function useCountries(limit: number = 0) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<CountryStat[]>(`/countries?limit=${limit}`, timeRange, []);
}

export function useDNS(limit: number = 0) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<DnsStat[]>(`/dns?limit=${limit}`, timeRange, []);
}

export function useEvents(limit: number = 0) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<EventStat[]>(`/events?limit=${limit}`, timeRange, []);
}

export function useTlsVersions(limit: number = 10) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<TlsVersionStat[]>(`/tls-versions?limit=${limit}`, timeRange, []);
}

export function useTlsCiphers(limit: number = 15) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<TlsCipherStat[]>(`/tls-ciphers?limit=${limit}`, timeRange, []);
}

export function useTlsSecurity(limit: number = 10) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<TlsSecurityStat[]>(`/tls-security?limit=${limit}`, timeRange, []);
}

export function useIntelligenceStats() {
  const { timeRange } = useTimeFilter();
  const endpoint = '/intelligence/stats';
  const cacheKey = `${endpoint}:${timeRange}`;

  const [data, setData] = useState<IntelligenceStats | null>(() => {
    return (globalCache[cacheKey] as IntelligenceStats) ?? null;
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
    fetcher<IntelligenceStats>(endpoint, timeRange)
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

// Re-export utilities from api.ts
export { fetcher, fetchAgentDetails, fetchDeviceDetails, fetchAppDetails, fetchSecurityDevices } from './api';
export { useLookupApplications } from './api';
