// src/lib/api/details.ts
"use client";

import { fetcher } from "./core";
import { AgentDetails, DeviceDetails, AppDetails, SecurityDevice, RemoteIpDetails } from "../api-detail-types";

export async function fetchAgentDetails(uuid: string): Promise<AgentDetails> {
  return fetcher<AgentDetails>(`/agent-details?uuid=${encodeURIComponent(uuid)}`);
}

export async function fetchDeviceDetails(ip: string, timeRange: string = 'all', mac: string = '', agentUuid: string = ''): Promise<DeviceDetails> {
  const query = [];
  if (ip) query.push(`ip=${encodeURIComponent(ip)}`);
  if (mac) query.push(`mac=${encodeURIComponent(mac)}`);
  if (agentUuid) query.push(`agent_uuid=${encodeURIComponent(agentUuid)}`);
  query.push(`timeRange=${timeRange}`);
  return fetcher<DeviceDetails>(`/device-details?${query.join('&')}`);
}

export async function fetchRemoteIpDetails(ip: string, timeRange: string = 'all'): Promise<RemoteIpDetails> {
  const query = [];
  if (ip) query.push(`ip=${encodeURIComponent(ip)}`);
  query.push(`timeRange=${timeRange}`);
  return fetcher<RemoteIpDetails>(`/remote-ip-details?${query.join('&')}`);
}

export async function fetchAppDetails(label: string, timeRange: string = '1h', agentUuid?: string | null): Promise<AppDetails> {
  let url = `/app-details?label=${encodeURIComponent(label)}&timeRange=${timeRange}`;
  if (agentUuid) {
    url += `&agent_uuid=${encodeURIComponent(agentUuid)}`;
  }
  return fetcher<AppDetails>(url);
}

export async function fetchSecurityDevices(): Promise<SecurityDevice[]> {
  return fetcher<SecurityDevice[]>('/security-devices');
}
