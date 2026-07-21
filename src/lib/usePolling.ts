/**
 * usePolling.ts
 * 
 * Utility hook for triggering periodic re-fetches in the BackOne dashboard.
 * Used to achieve "realtime-like" updates without WebSockets.
 * 
 * Default interval: 5 minutes (matching proxy collection schedule)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Returns a `refreshKey` that increments every `intervalMs` milliseconds.
 * Pass this key as a dependency to any useEffect to trigger re-fetch.
 * 
 * @param intervalMs - Polling interval in ms. Default: 5 minutes.
 * @param immediate  - If true, also trigger immediately on mount.
 */
export function usePollingKey(intervalMs: number = 5 * 60 * 1000): number {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (intervalMs <= 0) return;
    const timer = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return refreshKey;
}

/**
 * Returns a manual refresh function + auto-polling refresh key.
 * Combine with hooks by passing refreshKey as a dependency.
 * 
 * @param intervalMs - Auto-refresh interval in ms. Default: 5 minutes.
 */
export function useRefresh(intervalMs: number = 5 * 60 * 1000) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Auto-refresh timer
  useEffect(() => {
    if (intervalMs <= 0) return;
    const timer = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      setLastRefreshed(new Date());
    }, intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  // Manual refresh
  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    setLastRefreshed(new Date());
  }, []);

  return { refreshKey, lastRefreshed, refresh };
}
