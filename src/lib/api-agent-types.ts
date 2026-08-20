// src/lib/api-agent-types.ts
// ─────────────────────────────────────────────────────────────────────────────
// Agent Detail Interface Definitions
// ─────────────────────────────────────────────────────────────────────────────

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
