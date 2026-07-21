import { useState, useEffect } from 'react';
import { fetcher } from './api';

// --- ADVANCED NETWORK INFRASTRUCTURE TYPES ---
export interface RegionStat { id: number; fetched_at: string; region_name: string; region_code: string; country_name: string; country_code: string; download: number; }
export interface CityStat { id: number; fetched_at: string; city_name: string; region_name: string; country_name: string; country_code: string; download: number; }
export interface VlanStat { id: number; fetched_at: string; vlan_id: number; vlan_label: string; download: number; upload: number; total: number; }
export interface InterfaceStat { id: number; fetched_at: string; iface_id: number; iface_name: string; iface_role: string; agent_id: string; download: number; upload: number; total: number; }
export interface IpVersionStat { id: number; fetched_at: string; ip_version_label: string; download: number; upload: number; total: number; }
export interface RemoteIpStat { id: number; fetched_at: string; remote_ip: string; ip_version: number; download: number; upload: number; total: number; }
export interface MacBandwidthStat { id: number; fetched_at: string; mac_address: string; manufacturer: string; download: number; upload: number; total: number; }
export interface FlowTypeStat { id: number; fetched_at: string; flow_type_label: string; download: number; upload: number; total: number; }
export interface FlowOriginStat { id: number; fetched_at: string; flow_origin_label: string; download: number; upload: number; total: number; }

// --- DPI ANALYTICS TYPES ---
export interface NetbiosStat { id: number; fetched_at: string; hostname: string; download: number; upload: number; total: number; }
export interface DiscoveryOsStat { id: number; fetched_at: string; os_label: string; download: number; upload: number; total: number; }
export interface DhcpFingerprintStat { id: number; fetched_at: string; fingerprint: string; download: number; upload: number; total: number; }
export interface HttpUserAgentStat { id: number; fetched_at: string; user_agent: string; download: number; upload: number; total: number; }
export interface SniHostnameStat { id: number; fetched_at: string; sni_hostname: string; download: number; upload: number; total: number; }
export interface SslServerCnStat { id: number; fetched_at: string; ssl_server_cn: string; download: number; upload: number; total: number; }
export interface QuicHostnameStat { id: number; fetched_at: string; quic_hostname: string; download: number; upload: number; total: number; }
export interface BittorrentHashStat { id: number; fetched_at: string; info_hash: string; label: string; download: number; upload: number; total: number; }
export interface SshVersionStat { id: number; fetched_at: string; ssh_version: string; download: number; upload: number; total: number; }
export interface MdnsHostnameStat { id: number; fetched_at: string; mdns_hostname: string; download: number; upload: number; total: number; }

// --- INTELLIGENCE DETAIL TYPES ---
export interface IntelCryptoMining { id: number; fetched_at: string; detected_at: string; ip_address: string; mac_address: string; pool_host: string; pool_ip: string; protocol: string; app_label: string; confidence: number; download: number; upload: number; }
export interface IntelDeviceDiscovery { id: number; fetched_at: string; detected_at: string; ip_address: string; mac_address: string; device_label: string; device_type: string; os_label: string; manufacturer: string; is_new: number; }
export interface IntelEncryptionAudit { id: number; fetched_at: string; detected_at: string; ip_address: string; mac_address: string; device_label: string; encrypted_pct: number; unencrypted: number; encrypted: number; total: number; risk_level: string; }
export interface IntelInsecureProtocol { id: number; fetched_at: string; detected_at: string; protocol: string; ip_address: string; mac_address: string; dst_ip: string; dst_port: number; app_label: string; download: number; upload: number; risk: string; source: string; }
export interface IntelIpReputation { id: number; fetched_at: string; detected_at: string; ip_address: string; local_ip: string; mac_address: string; reputation: string; score: number; country: string; app_label: string; download: number; upload: number; blacklisted: number; }
export interface IntelServerDiscovery { id: number; fetched_at: string; detected_at: string; ip_address: string; mac_address: string; server_type: string; hostname: string; port: number; protocol: string; os_label: string; download: number; upload: number; }
export interface IntelTorDetection { id: number; fetched_at: string; detected_at: string; ip_address: string; mac_address: string; exit_node: string; circuit_id: string; download: number; upload: number; country: string; }
export interface IntelUnencryptedPassword { id: number; fetched_at: string; detected_at: string; ip_address: string; mac_address: string; dst_ip: string; dst_port: number; protocol: string; username: string; download: number; upload: number; severity: string; }
export interface IntelVpnDetection { id: number; fetched_at: string; detected_at: string; ip_address: string; mac_address: string; vpn_type: string; remote_ip: string; protocol: string; download: number; upload: number; country: string; confidence: number; }

import { useTimeFilter } from '@/contexts/TimeFilterContext';
import { useCtxFetch } from './api-context-core';

function useGenericFetch<T>(endpoint: string, limit: number) {
  const { timeRange } = useTimeFilter();
  return useCtxFetch<T[]>(`${endpoint}?limit=${limit}`, timeRange, []);
}

// Network Infrastructure Hooks
export const useRegions = (limit = 50) => useGenericFetch<RegionStat>('/regions', limit);
export const useCities = (limit = 50) => useGenericFetch<CityStat>('/cities', limit);
export const useVlans = (limit = 50) => useGenericFetch<VlanStat>('/vlans', limit);
export const useInterfaces = (limit = 50) => useGenericFetch<InterfaceStat>('/interfaces', limit);
export const useIpVersions = (limit = 50) => useGenericFetch<IpVersionStat>('/ip-versions', limit);
export const useRemoteIps = (limit = 50) => useGenericFetch<RemoteIpStat>('/remote-ips', limit);
export const useMacBandwidth = (limit = 50) => useGenericFetch<MacBandwidthStat>('/mac-bandwidth', limit);
export const useFlowTypes = (limit = 50) => useGenericFetch<FlowTypeStat>('/flow-types', limit);
export const useFlowOrigins = (limit = 50) => useGenericFetch<FlowOriginStat>('/flow-origins', limit);

// DPI Analytics Hooks
export const useNetbios = (limit = 50) => useGenericFetch<NetbiosStat>('/netbios', limit);
export const useDiscoveryOs = (limit = 50) => useGenericFetch<DiscoveryOsStat>('/discovery-os', limit);
export const useDhcpFingerprints = (limit = 50) => useGenericFetch<DhcpFingerprintStat>('/dhcp-fingerprints', limit);
export const useHttpUserAgents = (limit = 50) => useGenericFetch<HttpUserAgentStat>('/http-user-agents', limit);
export const useSniHostnames = (limit = 50) => useGenericFetch<SniHostnameStat>('/sni-hostnames', limit);
export const useSslServerCn = (limit = 50) => useGenericFetch<SslServerCnStat>('/ssl-server-cn', limit);
export const useQuicHostnames = (limit = 50) => useGenericFetch<QuicHostnameStat>('/quic-hostnames', limit);
export const useBittorrentHashes = (limit = 50) => useGenericFetch<BittorrentHashStat>('/bittorrent-hashes', limit);
export const useSshVersions = (limit = 50) => useGenericFetch<SshVersionStat>('/ssh-versions', limit);
export const useMdnsHostnames = (limit = 50) => useGenericFetch<MdnsHostnameStat>('/mdns-hostnames', limit);

// Intelligence Detail Hooks
export const useIntelCryptoMining = (limit = 50) => useGenericFetch<IntelCryptoMining>('/intelligence/crypto-mining', limit);
export const useIntelDeviceDiscovery = (limit = 50) => useGenericFetch<IntelDeviceDiscovery>('/intelligence/device-discovery', limit);
export const useIntelEncryptionAudit = (limit = 50) => useGenericFetch<IntelEncryptionAudit>('/intelligence/encryption-audit', limit);
export const useIntelInsecureProtocols = (limit = 50) => useGenericFetch<IntelInsecureProtocol>('/intelligence/insecure-protocols', limit);
export const useIntelIpReputation = (limit = 50) => useGenericFetch<IntelIpReputation>('/intelligence/ip-reputation', limit);
export const useIntelServerDiscovery = (limit = 50) => useGenericFetch<IntelServerDiscovery>('/intelligence/server-discovery', limit);
export const useIntelTorDetection = (limit = 50) => useGenericFetch<IntelTorDetection>('/intelligence/tor', limit);
export const useIntelUnencryptedPasswords = (limit = 50) => useGenericFetch<IntelUnencryptedPassword>('/intelligence/unencrypted-passwords', limit);
export const useIntelVpnDetection = (limit = 50) => useGenericFetch<IntelVpnDetection>('/intelligence/vpn', limit);
