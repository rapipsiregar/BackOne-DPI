// src/lib/api-types.ts
// ─────────────────────────────────────────────────────────────────────────────
// Type and Interface definitions for the BackOne client-side API layer.
// Split from api.ts to respect the 256-line threshold limit.
// ─────────────────────────────────────────────────────────────────────────────

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
  mac_address: string | null;
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
  download_speed?: number;
  upload_speed?: number;
  flow_speed?: number;
}

export interface TimelinePoint {
  fetched_at: string;
  total_download: number;
  total_upload: number;
  packet_drops?: number;
  peak_flow_rate?: number;
  total_flows?: number;
  download_speed?: number;
  upload_speed?: number;
  cpu_usage?: number;
  memory_usage?: number;
  queue_depth?: number;
}

export interface AppStat {
  app_label: string;
  download: number;
  upload: number;
  favicon?: string;
  category?: string;
  first_seen?: string;
  last_seen?: string;
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
  agent_uuid?: string | null;
  is_gateway_routed?: number | null;
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
  description?: string | null;
}

export interface AppCategoryStat {
  id: number;
  category_label: string;
  download: number;
  upload: number;
  total: number;
}

export interface SslSanStat {
  alt_name: string;
  download: number;
  upload: number;
  flows: number;
  total: number;
}

export interface ContinentStat {
  id: number;
  continent_name: string;
  download: number;
  upload: number;
  total: number;
}
