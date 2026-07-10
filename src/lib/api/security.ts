// src/lib/api/security.ts
"use client";

import { useState, useEffect } from 'react';
import { fetcher } from './core';
import { ThreatStat, EventStat, TlsVersionStat, TlsCipherStat, TlsSecurityStat, IntelligenceStats } from '../api-types';

export function useThreats(limit: number = 20, timeRange?: string) {
  const [data, setData] = useState<ThreatStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<ThreatStat[]>(`/threats?limit=${limit}`, timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit, timeRange]);

  return { data, error, isLoading };
}

export function useEvents(limit: number = 0, timeRange?: string) {
  const [data, setData] = useState<EventStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<EventStat[]>(`/events?limit=${limit}`, timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit, timeRange]);

  return { data, error, isLoading };
}

export function useTlsVersions(limit: number = 10, timeRange?: string) {
  const [data, setData] = useState<TlsVersionStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<TlsVersionStat[]>(`/tls-versions?limit=${limit}`, timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit, timeRange]);

  return { data, error, isLoading };
}

export function useTlsCiphers(limit: number = 15, timeRange?: string) {
  const [data, setData] = useState<TlsCipherStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<TlsCipherStat[]>(`/tls-ciphers?limit=${limit}`, timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit, timeRange]);

  return { data, error, isLoading };
}

export function useTlsSecurity(limit: number = 10, timeRange?: string) {
  const [data, setData] = useState<TlsSecurityStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<TlsSecurityStat[]>(`/tls-security?limit=${limit}`, timeRange)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit, timeRange]);

  return { data, error, isLoading };
}

export function useIntelligenceStats(timeRange?: string) {
  const [data, setData] = useState<IntelligenceStats | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<IntelligenceStats>('/intelligence/stats', timeRange)
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [timeRange]);

  return { data, error, isLoading };
}
