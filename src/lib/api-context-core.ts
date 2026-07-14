// src/lib/api-context-core.ts
'use client';

import { useState, useEffect } from 'react';
import { fetcher } from './api';

// Global memory cache to prevent UI reloading flicker when changing pages
export const globalCache: Record<string, any> = {};

// Auto-refresh interval: 1 minute (as requested by user)
export const REFRESH_INTERVAL_MS = 60 * 1000;

/**
 * Generic hook factory with:
 *   - timeRange from context
 *   - stale-while-revalidate caching (no spinner if cached data is present)
 *   - auto-refresh every 5 minutes
 */
export function useCtxFetch<T>(endpoint: string, timeRange: string, defaultValue: T, extraParams?: Record<string, string>): {
  data: T;
  error: Error | null;
  isLoading: boolean;
} {
  // Include extraParams in cache key so different date ranges are cached separately
  const extraKey = extraParams ? ':' + new URLSearchParams(extraParams).toString() : '';
  const cacheKey = `${endpoint}:${timeRange}${extraKey}`;

  // Initial state reads from global memory cache if present
  const [data, setData] = useState<T>(() => {
    return (globalCache[cacheKey] as T) ?? defaultValue;
  });
  const [error, setError] = useState<Error | null>(null);
  
  // Do not show loading state if we already have cached data in memory
  const [isLoading, setIsLoading] = useState(() => {
    return !globalCache[cacheKey];
  });
  const [tick, setTick] = useState(0);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  // Listen for device label updates to clear cache and reload in real-time
  useEffect(() => {
    const handleLabelUpdated = () => {
      delete globalCache[cacheKey];
      setTick(t => t + 1);
    };
    window.addEventListener("device-label-updated", handleLabelUpdated);
    return () => window.removeEventListener("device-label-updated", handleLabelUpdated);
  }, [cacheKey]);

  // Fetch on mount + timeRange change + auto-refresh tick
  useEffect(() => {
    if (!globalCache[cacheKey]) {
      setIsLoading(true);
    }
    setError(null);

    fetcher<T>(endpoint, timeRange, extraParams)
      .then(res => {
        const val = res ?? defaultValue;
        globalCache[cacheKey] = val;
        setData(val);
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, timeRange, extraKey, tick]);

  return { data, error, isLoading };
}
