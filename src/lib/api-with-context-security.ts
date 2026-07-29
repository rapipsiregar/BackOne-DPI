'use client';

import { useState, useEffect } from 'react';
import { useTimeFilter } from '@/contexts/TimeFilterContext';
import { useCtxFetch, globalCache, REFRESH_INTERVAL_MS } from './api-context-core';
import { fetcher } from './api';
import type { TlsVersionStat, TlsCipherStat, TlsSecurityStat, IntelligenceStats } from './api';

export function useTlsVersions(limit: number = 1000000) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<TlsVersionStat[]>(`/tls-versions?limit=${limit}`, timeRange, []);
}

export function useTlsCiphers(limit: number = 1000000) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<TlsCipherStat[]>(`/tls-ciphers?limit=${limit}`, timeRange, []);
}

export function useTlsSecurity(limit: number = 1000000) {
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
