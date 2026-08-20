// src/lib/api-device-types.ts
// ─────────────────────────────────────────────────────────────────────────────
// Device, App & Remote IP Detail Interface Definitions
// ─────────────────────────────────────────────────────────────────────────────

import { FlowStat, AppStat, ThreatStat } from "./api-types";

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

export interface DeviceInfo {
  device_label: string | null;
  device_type: string | null;
  os_label: string | null;
  manufacturer: string | null;
  mac_address: string | null;
  is_new: number | null;
}

export interface DeviceAppItem {
  label: string;
  sub_label: string | null;
  type: 'domain' | 'protocol' | 'port';
  download: number;
  upload: number;
  flow_count: number;
}

export interface DeviceDomainItem {
  domain: string;
  download: number;
  upload: number;
  flow_count: number;
}

export interface DeviceEncryption {
  encrypted_pct: number | null;
  encrypted_bytes: number | null;
  unencrypted_bytes: number | null;
  total_bytes: number | null;
  risk_level: string | null;
}

export interface DeviceServerItem {
  server_type: string | null;
  hostname: string | null;
  port: number | null;
  protocol: string | null;
  os_label: string | null;
  download: number;
  upload: number;
  detected_at: string | null;
}

export interface DevicePwdItem {
  dst_ip: string | null;
  dst_port: number | null;
  protocol: string | null;
  username: string | null;
  severity: string | null;
  download: number;
  upload: number;
  detected_at: string | null;
}

export interface DeviceReputationItem {
  remote_ip: string | null;
  local_ip: string | null;
  reputation: string | null;
  score: number | null;
  country: string | null;
  app_label: string | null;
  blacklisted: boolean;
  download: number;
  upload: number;
}

export interface DeviceVpnItem {
  vpn_type: string | null;
  remote_ip: string | null;
  protocol: string | null;
  country: string | null;
  confidence: number | null;
  download: number;
  upload: number;
  detected_at: string | null;
}

export interface DeviceEventItem {
  event_type: string | null;
  severity: string | null;
  ip_address: string | null;
  mac_address: string | null;
  description: string | null;
  event_at: string | null;
}

export interface DeviceMacBandwidth {
  mac_address: string;
  manufacturer: string | null;
  download: number;
  upload: number;
  total: number;
}

export interface DeviceDetails {
  ip_address: string;
  mac_address: string | null;
  device_label: string | null;
  device_type: string | null;
  os_label: string | null;
  manufacturer: string | null;
  last_seen: string | null;
  first_seen?: string | null;
  total_download: number;
  total_upload: number;
  agent_uuid?: string | null;
  agent_label?: string | null;
  flows: FlowStat[];
  apps: AppStat[];
  protocols: AppStat[];
  domains: AppStat[];
  destinations: AppStat[];
  threats: ThreatStat[];
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
  dst_ip?: string | null;
  domain?: string | null;
  last_seen?: string | null;
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
  risk_level: 'Vulnerable' | 'Moderate' | 'Safe';
  has_insecure: boolean;
  device_type: string | null;
  os_label: string | null;
  manufacturer: string | null;
  timestamp?: string | null;
}

export interface RemoteIpDetails {
  ip_address: string;
  ip_version: number;
  total_download: number;
  total_upload: number;
  last_seen: string | null;
  first_seen: string | null;
  protocols: { app_label: string; download: number; upload: number; last_seen: string; first_seen: string }[];
  domains: { app_label: string; download: number; upload: number; last_seen: string; first_seen: string }[];
  local_devices: { app_label: string; download: number; upload: number; last_seen: string; first_seen: string }[];
  flows: FlowStat[];
  threats: ThreatStat[];
}
