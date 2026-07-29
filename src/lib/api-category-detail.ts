// src/lib/api-category-detail.ts
// ─────────────────────────────────────────────────────────────────────────────
// Frontend API hook for the BackOne Traffic Categories detail modal.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';

const API_BASE = '';

export interface CategoryDetailAppRow {
  app_label:  string;
  download:   number;
  upload:     number;
  flows:      number;
  agent_uuid: string;
  last_seen:  string;
}

export interface CategoryDetailDeviceRow {
  src_ip:       string;
  device_label: string;
  mac_address:  string;
  manufacturer: string;
  os_label:     string;
  download:     number;
  upload:       number;
  flows:        number;
  agent_uuid:   string;
  last_seen:    string;
}

export interface CategoryDetailResult {
  ok:       boolean;
  category: string;
  apps:     CategoryDetailAppRow[];
  devices:  CategoryDetailDeviceRow[];
}

export function useCategoryDetail(
  category: string | null,
  timeRange: string = '1d'
) {
  const [data, setData]       = useState<{ apps: CategoryDetailAppRow[], devices: CategoryDetailDeviceRow[] }>({ apps: [], devices: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!category) { setData({ apps: [], devices: [] }); return; }
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ category, timeRange });
      const response = await fetch(
        `${API_BASE}/api/dashboard/category-detail?${params}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: CategoryDetailResult = await response.json();
      if (result.ok) {
        setData({ apps: result.apps || [], devices: result.devices || [] });
      } else {
        throw new Error('Server error');
      }
    } catch (err: any) {
      setError(err.message);
      setData({ apps: [], devices: [] });
    } finally {
      setIsLoading(false);
    }
  }, [category, timeRange]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { data, isLoading, error, refetch: fetchDetail };
}
