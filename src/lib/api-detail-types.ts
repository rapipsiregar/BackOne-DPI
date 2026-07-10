// src/lib/api-detail-types.ts
// ─────────────────────────────────────────────────────────────────────────────
// UI Detail Tab and Modal Interface Type Definitions for BackOne Client.
// Split from api.ts to respect the 256-line threshold limit.
// ─────────────────────────────────────────────────────────────────────────────

import { FlowStat, AppStat, ThreatStat } from "./api-types";

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

export interface AgentEncryptionItem {
  ip_address: string | null;
  mac_address: string | null;
  device_label: string | null;
  encrypted_pct: number | null;
  unencrypted: number | null;
  encrypted: number | null;
  total: number | null;
  risk_level: string | null;
  detected_at: string | null;
}

export interface AgentInsecureProtocolItem {
  ip_address: string | null;
  mac_address: string | null;
  protocol: string | null;
  risk: string | null;
  app_label: string | null;
  dst_ip: string | null;
  dst_port: number | null;
  download: number;
  upload: number;
  detected_at: string | null;
}

export interface AgentUnencryptedPwdItem {
  ip_address: string | null;
  mac_address: string | null;
  dst_ip: string | null;
  dst_port: number | null;
  protocol: string | null;
  username: string | null;
  severity: string | null;
  download: number;
  upload: number;
  detected_at: string | null;
}

export interface AgentIpReputationItem {
  ip_address: string | null;
  local_ip: string | null;
  mac_address: string | null;
  reputation: string | null;
  score: number | null;
  country: string | null;
  app_label: string | null;
  blacklisted: number | boolean;
  download: number;
  upload: number;
  detected_at: string | null;
}

export interface AgentTorItem {
  ip_address: string | null;
  mac_address: string | null;
  exit_node: string | null;
  circuit_id: string | null;
  country: string | null;
  download: number;
  upload: number;
  detected_at: string | null;
}

export interface AgentVpnItem {
  ip_address: string | null;
  mac_address: string | null;
  vpn_type: string | null;
  remote_ip: string | null;
  protocol: string | null;
  country: string | null;
  confidence: number | null;
  download: number;
  upload: number;
  detected_at: string | null;
}

export interface AgentSecurity {
  encryption_audit: AgentEncryptionItem[];
  insecure_protocols: AgentInsecureProtocolItem[];
  unencrypted_passwords: AgentUnencryptedPwdItem[];
  ip_reputation: AgentIpReputationItem[];
  tor_detections: AgentTorItem[];
  vpn_detections: AgentVpnItem[];
}

export interface AgentEventItem {
  event_id: string | null;
  event_type: string | null;
  severity: string | null;
  ip_address: string | null;
  mac_address: string | null;
  description: string | null;
  event_at: string | null;
}

export interface AgentMacBandwidthItem {
  mac_address: string;
  manufacturer: string | null;
  download: number;
  upload: number;
  total: number;
}

export interface AgentServerDiscoveryItem {
  ip_address: string | null;
  mac_address: string | null;
  server_type: string | null;
  hostname: string | null;
  port: number | null;
  protocol: string | null;
  os_label: string | null;
  download: number;
  upload: number;
  detected_at: string | null;
}

export interface AgentDetails {
  agent_uuid: string;
  agent_label: string;
  summary: AgentSummary | null;
  devices: AgentDeviceItem[];
  flows: AgentFlowItem[];
  top_apps: AgentAppItem[];
  security: AgentSecurity | null;
  events: AgentEventItem[];
  mac_bandwidth: AgentMacBandwidthItem[];
  server_discovery: AgentServerDiscoveryItem[];
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
}
