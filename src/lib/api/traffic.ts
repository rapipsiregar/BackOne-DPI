// src/lib/api/traffic.ts
"use client";

import { useState, useEffect } from 'react';
import { fetcher } from './core';
import { AppStat, ProtocolStat, DeviceStat, AppCategoryStat, ContinentStat, FlowStat, CountryStat, DnsStat } from '../api-types';

export function useTopApps(limit: number = 10, timeRange?: string) {
  const [data, setData] = useState<AppStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<AppStat[]>(`/apps?limit=${limit}`, timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit, timeRange]);

  return { data, error, isLoading };
}

export function useTopProtocols(timeRange?: string) {
  const [data, setData] = useState<ProtocolStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<ProtocolStat[]>('/protocols', timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [timeRange]);

  return { data, error, isLoading };
}

export function useDevices(limit: number = 50, timeRange?: string) {
  const [data, setData] = useState<DeviceStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<DeviceStat[]>(`/devices?limit=${limit}`, timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit, timeRange]);

  return { data, error, isLoading };
}

export function useAppCategories(timeRange?: string) {
  const [data, setData] = useState<AppCategoryStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<AppCategoryStat[]>('/app-categories', timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [timeRange]);

  return { data, error, isLoading };
}

export function useContinents(timeRange?: string) {
  const [data, setData] = useState<ContinentStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<ContinentStat[]>('/continents', timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [timeRange]);

  return { data, error, isLoading };
}

export function useFlows(limit: number = 0, timeRange?: string) {
  const [data, setData] = useState<FlowStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<FlowStat[]>(`/flows?limit=${limit}`, timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit, timeRange]);

  return { data, error, isLoading };
}

export function useCountries(limit: number = 0, timeRange?: string) {
  const [data, setData] = useState<CountryStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<CountryStat[]>(`/countries?limit=${limit}`, timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit, timeRange]);

  return { data, error, isLoading };
}

export function useDNS(limit: number = 0, timeRange?: string) {
  const [data, setData] = useState<DnsStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<DnsStat[]>(`/dns?limit=${limit}`, timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit, timeRange]);

  return { data, error, isLoading };
}
