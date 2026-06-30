import { useState, useEffect } from 'react';

// Common Response Wrapper
export interface ApiResponse<T> {
  ok: boolean;
  data: T;
  message?: string;
}

// Data Types
export interface FlowStat {
  id: number;
  fetched_at: string;
  flow_id: string;
  src_ip: string;
  src_mac: string | null;
  dst_ip: string;
  dst_port: number;
  protocol: string;
  app_label: string | null;
  domain: string | null;
  bytes_download: number;
  bytes_upload: number;
  first_seen: string;
  last_seen: string;
}

export interface CountryStat {
  id: number;
  country_code: string;
  country_name: string;
  download: number;
  upload: number;
  flow_count: number;
}

export interface DnsStat {
  id: number;
  domain: string;
  query_count: number;
  app_label: string | null;
  category: string | null;
}

export interface EventStat {
  id: number;
  event_type: string;
  severity: string;
  message: string;
  source_ip: string | null;
  timestamp: string;
}

export interface TlsVersionStat {
  id: number;
  tls_version: string;
  download: number;
  upload: number;
  total: number;
}

export interface TlsCipherStat {
  id: number;
  tls_cipher: string;
  download: number;
  upload: number;
  total: number;
}

export interface TlsSecurityStat {
  id: number;
  tls_security: string;
  color: string;
  download: number;
  upload: number;
  total: number;
}

export interface IntelligenceStats {
  intel_crypto_mining: number;
  intel_device_discovery: number;
  intel_encryption_audit: number;
  intel_insecure_protocols: number;
  intel_ip_reputation: number;
  intel_server_discovery: number;
  intel_tor_detection: number;
  intel_unencrypted_passwords: number;
  intel_vpn_detection: number;
}

export interface DashboardSummary {
  total_devices: number;
  total_threats: number;
  total_events: number;
  last_fetch: string;
  bandwidth_down: number;
  bandwidth_up: number;
  active_flows: number;
}

export interface TimelinePoint {
  fetched_at: string;
  total_download: number;
  total_upload: number;
}

export interface AppStat {
  app_label: string;
  download: number;
  upload: number;
  favicon?: string;
  category?: string;
}

export interface ProtocolStat {
  protocol_label: string;
  download: number;
  upload: number;
}

export interface DeviceStat {
  id: number;
  ip_address: string;
  mac_address: string | null;
  device_label: string | null;
  device_type: string | null;
  os_label: string | null;
  manufacturer: string | null;
  download: number;
  upload: number;
  last_seen: string;
}

export interface ThreatStat {
  id: number;
  threat_type: string | null;
  severity: string | null;
  ip_address: string | null;
  dst_ip: string | null;
  mac_address: string | null;
  app_label: string | null;
  domain: string | null;
  detected_at: string | null;
}

export interface AppCategoryStat {
  id: number;
  category_label: string;
  download: number;
  upload: number;
  total: number;
}

export interface ContinentStat {
  id: number;
  continent_name: string;
  download: number;
  upload: number;
  total: number;
}

// Fetcher Function
export async function fetcher<T>(endpoint: string): Promise<T> {
  const url = `/api/dashboard${endpoint}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (!json.ok) {
    throw new Error(json.message || 'API responded with ok: false');
  }
  return json.data;
}

// Custom Hooks for React Components
export function useDashboardSummary() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<DashboardSummary>('/summary')
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  return { data, error, isLoading };
}

export function useTimeline(points: number = 60) {
  const [data, setData] = useState<TimelinePoint[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<TimelinePoint[]>(`/timeline?points=${points}`)
      .then((res) => {
        // Reverse array if backend sends newest first, so oldest is first for the chart
        setData(Array.isArray(res) ? res.slice().reverse() : []);
      })
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [points]);

  return { data, error, isLoading };
}

export function useTopApps(limit: number = 10) {
  const [data, setData] = useState<AppStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<AppStat[]>(`/apps?limit=${limit}`)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { data, error, isLoading };
}

export function useTopProtocols() {
  const [data, setData] = useState<ProtocolStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<ProtocolStat[]>('/protocols')
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  return { data, error, isLoading };
}

export function useDevices(limit: number = 50) {
  const [data, setData] = useState<DeviceStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<DeviceStat[]>(`/devices?limit=${limit}`)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { data, error, isLoading };
}

export function useThreats(limit: number = 20) {
  const [data, setData] = useState<ThreatStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<ThreatStat[]>(`/threats?limit=${limit}`)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { data, error, isLoading };
}

export function useAppCategories() {
  const [data, setData] = useState<AppCategoryStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<AppCategoryStat[]>('/app-categories')
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  return { data, error, isLoading };
}

export function useContinents() {
  const [data, setData] = useState<ContinentStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<ContinentStat[]>('/continents')
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  return { data, error, isLoading };
}

export function useFlows(limit: number = 50) {
  const [data, setData] = useState<FlowStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<FlowStat[]>(`/flows?limit=${limit}`)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { data, error, isLoading };
}

export function useCountries(limit: number = 50) {
  const [data, setData] = useState<CountryStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<CountryStat[]>(`/countries?limit=${limit}`)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { data, error, isLoading };
}

export function useDNS(limit: number = 50) {
  const [data, setData] = useState<DnsStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<DnsStat[]>(`/dns?limit=${limit}`)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { data, error, isLoading };
}

export function useEvents(limit: number = 50) {
  const [data, setData] = useState<EventStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<EventStat[]>(`/events?limit=${limit}`)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { data, error, isLoading };
}

export function useTlsVersions(limit: number = 10) {
  const [data, setData] = useState<TlsVersionStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<TlsVersionStat[]>(`/tls-versions?limit=${limit}`)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { data, error, isLoading };
}

export function useTlsCiphers(limit: number = 15) {
  const [data, setData] = useState<TlsCipherStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<TlsCipherStat[]>(`/tls-ciphers?limit=${limit}`)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { data, error, isLoading };
}

export function useTlsSecurity(limit: number = 10) {
  const [data, setData] = useState<TlsSecurityStat[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<TlsSecurityStat[]>(`/tls-security?limit=${limit}`)
      .then((res) => setData(res || []))
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, [limit]);

  return { data, error, isLoading };
}

export function useIntelligenceStats() {
  const [data, setData] = useState<IntelligenceStats | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetcher<IntelligenceStats>('/intelligence/stats')
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  return { data, error, isLoading };
}

// ─── LOOKUP APPLICATIONS ──────────────────────────────────────────────────────
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

// ─── INTERACTIVE DETAIL TYPES ──────────────────────────────────────────────────

export interface AgentDeviceItem {
  ip_address: string | null;
  mac_address: string | null;
  device_label: string | null;
  device_type: string | null;
  os_label: string | null;
  manufacturer: string | null;
  last_seen: string | null;
  download: number;
  upload: number;
  encrypted_pct: number | null;
  risk_level: string | null;
  has_insecure: boolean;
}

export interface AgentFlowItem {
  flow_id?: string | null;
  src_ip: string | null;
  dst_ip: string | null;
  dst_port: number | null;
  protocol: string | null;
  app_label?: string | null;
  domain?: string | null;
  download: number;
  upload: number;
  last_seen: string | null;
}

export interface AgentAppItem {
  app_id: number | null;
  app_label: string;
  category: string | null;
  favicon: string | null;
  download: number;
  upload: number;
}

export interface AgentSummary {
  total_devices: number;
  active_flows: number;
  bandwidth_down: number;
  bandwidth_up: number;
}

export interface AgentDetails {
  agent_uuid: string;
  agent_label: string;
  summary: AgentSummary | null;
  devices: AgentDeviceItem[];
  flows: AgentFlowItem[];
  top_apps: AgentAppItem[];
}

export interface DeviceFlowItem {
  dst_ip: string | null;
  dst_port: number | null;
  protocol: string | null;
  app_label?: string | null;
  domain?: string | null;
  download: number;
  upload: number;
  last_seen: string | null;
}

export interface SecurityInfo {
  encrypted_pct: number | null;
  encrypted_bytes: number | null;
  unencrypted_bytes: number | null;
  risk_level: string | null;
  insecure_protocols: { protocol: string; risk: string }[];
  device_type: string | null;
  os_label: string | null;
  manufacturer: string | null;
  device_label: string | null;
  reputation: string | null;
  rep_score: number | null;
  blacklisted: boolean;
}

export interface DeviceDetails {
  ip: string;
  total_download: number;
  total_upload: number;
  flow_count: number;
  top_apps: AgentAppItem[];
  flows: DeviceFlowItem[];
  security_info: SecurityInfo | null;
}

export interface AppAgentItem {
  agent_uuid: string | null;
  agent_label: string;
  download: number;
  upload: number;
  flow_count?: number;
}

export interface AppIpItem {
  ip_address: string | null;
  download: number;
  upload: number;
  flow_count?: number;
  reputation?: string | null;
  blacklisted?: boolean;
}

export interface AppDetails {
  app_label: string;
  total_download: number;
  total_upload: number;
  data_source?: string;
  has_domain_breakdown?: boolean;
  agent_scorecard: AppAgentItem[];
  top_ips: AppIpItem[];
}

export interface SecurityDevice {
  ip_address: string;
  mac_address: string | null;
  device_label: string | null;
  encrypted_pct: number;
  unencrypted: number;
  encrypted: number;
  total: number;
  risk_level: 'Rawan' | 'Sedang' | 'Aman';
  has_insecure: boolean;
  device_type: string | null;
  os_label: string | null;
  manufacturer: string | null;
}

// ─── DETAIL FETCH FUNCTIONS (one-shot, no polling) ───────────────────────────

export async function fetchAgentDetails(uuid: string): Promise<AgentDetails> {
  return fetcher<AgentDetails>(`/agent-details?uuid=${encodeURIComponent(uuid)}`);
}

export async function fetchDeviceDetails(ip: string): Promise<DeviceDetails> {
  return fetcher<DeviceDetails>(`/device-details?ip=${encodeURIComponent(ip)}`);
}

export async function fetchAppDetails(label: string): Promise<AppDetails> {
  return fetcher<AppDetails>(`/app-details?label=${encodeURIComponent(label)}`);
}

export async function fetchSecurityDevices(): Promise<SecurityDevice[]> {
  return fetcher<SecurityDevice[]>('/security-devices');
}

