// src/lib/api-metadata-detail.ts
// ─────────────────────────────────────────────────────────────────────────────
// Frontend API hook for the BackOne Metadata row-detail panel.
// Fetches real MongoDB breakdown data when a user clicks a table row.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { getViewAsHeaders } from './admin-api';

const API_BASE = '';

export type MetadataDetailType =
  | 'sni_hostname'
  | 'ssl_server_cn'
  | 'quic_hostname'
  | 'netbios_hostname'
  | 'os_label'
  | 'dhcp_fingerprint'
  | 'http_useragent'
  | 'bittorrent_hash'
  | 'ssh_version'
  | 'mdns_hostname';

export interface MetadataDetailRow {
  // Domain-based (SNI, SSL CN, QUIC)
  src_ip?:       string;
  device_label?: string;
  mac_address?:  string;
  manufacturer?: string;
  os_label?:     string;

  // Device-based (NetBIOS, OS Discovery)
  ip_address?:   string;
  device_type?:  string;

  // BitTorrent
  info_hash?: string;
  label?:     string;

  // SSH
  role?: string;

  // Agent info
  agent_uuid?: string;
  timestamp?:  string;
  last_seen?:  string;

  // Bandwidth (all types)
  download: number;
  upload:   number;
  flows?:   number;
}

export interface MetadataDetailResult {
  ok:    boolean;
  type:  string;
  value: string;
  count: number;
  data:  MetadataDetailRow[];
}

export function useMetadataDetail(
  type: MetadataDetailType | null,
  value: string | null,
  timeRange: string = '1d'
) {
  const [data, setData]       = useState<MetadataDetailRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!type || !value) { setData([]); return; }
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ type, value, timeRange });
      const response = await fetch(
        `${API_BASE}/api/dashboard/metadata-detail?${params}`,
        {
          headers: getViewAsHeaders(),
          credentials: 'include'
        }
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result: MetadataDetailResult = await response.json();
      if (result.ok) setData(result.data);
      else throw new Error(result.ok === false ? 'Server error' : 'Unknown error');
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [type, value, timeRange]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { data, isLoading, error, refetch: fetchDetail };
}
