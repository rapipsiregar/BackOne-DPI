// src/lib/api/core.ts
"use client";

import { useState, useEffect } from 'react';
import { getViewAsHeaders } from '../admin-api';
import { DashboardSummary, TimelinePoint } from '../api-types';

export async function fetcher<T>(endpoint: string, timeRange?: string): Promise<T> {
  let url = `/api/dashboard${endpoint}`;
  if (timeRange) {
    const sep = url.includes('?') ? '&' : '?';
    url += sep + 'timeRange=' + timeRange;
  }
  const viewAsHeaders = getViewAsHeaders();
  const res = await fetch(url, { headers: viewAsHeaders });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.message || 'API responded with ok: false');
  }
  return json.data;
}

export function useDashboardSummary(timeRange?: string) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<DashboardSummary>('/summary', timeRange)
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [timeRange]);

  return { data, error, isLoading };
}

export function useTimeline(points: number = 60, timeRange?: string) {
  const [data, setData] = useState<TimelinePoint[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<TimelinePoint[]>(`/timeline?points=${points}`, timeRange)
      .then((res) => {
        setData(Array.isArray(res) ? res.slice().reverse() : []);
      })
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [points, timeRange]);

  return { data, error, isLoading };
}

export interface LookupApp {
  id: number;
  tag: string;
  label: string;
  name: string;
  full_name: string;
  description: string;
  favicon: string;
  icon: string;
  logo: string;
  application_category: { id: number; tag: string; label: string };
}

export interface LookupApplicationsResponse {
  applications: LookupApp[];
  pagination: {
    total_records: number;
    total_pages: number;
    current_page: number;
    start: number;
    length: number;
    limit: number;
  };
}

export function useLookupApplications(page: number = 1, limit: number = 25, search: string = '') {
  const [data, setData] = useState<LookupApplicationsResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetcher<LookupApplicationsResponse>(`/lookup/applications?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`)
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [page, limit, search]);

  return { data, error, isLoading };
}
