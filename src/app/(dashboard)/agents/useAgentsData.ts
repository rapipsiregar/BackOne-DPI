"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAgents, Agent } from "@/lib/actions/agents";
import { getAdminUsers, startViewAs, getViewAsHeaders, type ManagedUser } from "@/lib/admin-api";
import { useTimeFilter } from "@/contexts/TimeFilterContext";
import { usePollingKey } from "@/lib/usePolling";

export function useAgentsData() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [uptimeMap, setUptimeMap] = useState<Record<string, number>>({});
  const [storageMap, setStorageMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalAgent, setAccountModalAgent] = useState<{ uuid: string; label: string } | null>(null);

  const [externalModalOpen, setExternalModalOpen] = useState(false);
  const [externalModalUser, setExternalModalUser] = useState<ManagedUser | null>(null);
  const [targetSiteUuid, setTargetSiteUuid] = useState<string | null>(null);
  const [targetCreatedBy, setTargetCreatedBy] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<string>("6681452d_9cae_4ff4_8ae8_0d504774265e");

  const [locations, setLocations] = useState<any[]>([]);
  const [isLocModalOpen, setIsLocModalOpen] = useState(false);
  const [locModalAgentUuid, setLocModalAgentUuid] = useState("");
  const [locModalAgentLabel, setLocModalAgentLabel] = useState("");
  const [locModalCurrentLoc, setLocModalCurrentLoc] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('backone_site_uuid');
      if (stored) setSelectedSite(stored);
    }
  }, []);

  const [viewAsLoading, setViewAsLoading] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { timeRange } = useTimeFilter();
  const refreshKey = usePollingKey(60000); // Auto-refresh every 60 seconds (1 minute)

  const loadUptime = async () => {
    try {
      const res = await fetch(`/api/dashboard/agents/uptime?timeRange=${timeRange}`, {
        headers: getViewAsHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.uptime) setUptimeMap(json.uptime);
      }
    } catch (err) {
      console.error("Failed to load uptime stats:", err);
    }
  };

  const loadStorage = async () => {
    try {
      const res = await fetch('/api/dashboard/agents/storage', {
        headers: getViewAsHeaders()
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.storage) setStorageMap(json.storage);
      }
    } catch (err) {
      console.error("Failed to load agent storage stats:", err);
    }
  };

  const loadLocations = async () => {
    try {
      const res = await fetch("/api/dashboard/agent-locations", {
        headers: getViewAsHeaders(),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ok && json.data) setLocations(json.data);
      }
    } catch (err) {
      console.error("Failed to load locations:", err);
    }
  };

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const siteUuid = localStorage.getItem("backone_site_uuid") || undefined;
      const [agentData, userData] = await Promise.allSettled([
        getAgents(siteUuid),
        getAdminUsers(),
      ]);
      if (agentData.status === 'fulfilled') setAgents(agentData.value);
      else setError((agentData.reason as Error).message);
      if (userData.status === 'fulfilled') setManagedUsers(userData.value);
      await loadUptime();
      await loadLocations();
    } catch (e: any) {
      setError(e.message);
    }
    setIsLoading(false);
  };

  const handleViewAs = async (agentUuid: string, agentLabel: string) => {
    setViewAsLoading(agentUuid);
    try {
      await startViewAs(agentUuid, agentLabel);
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      alert('Failed to enter View As mode: ' + err.message);
    } finally {
      setViewAsLoading(null);
    }
  };

  useEffect(() => {
    fetch('/api/auth/me', { headers: getViewAsHeaders() })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          const userRole = data.user.role || null;
          setRole(userRole);
          if (userRole !== 'SUPER_ADMIN' && userRole !== 'TENANT_ADMIN') {
            router.push('/');
          } else {
            loadAgents();
          }
        } else {
          setIsLoading(false);
        }
      })
      .catch(err => {
        console.error("Auth check failed:", err);
        setIsLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (role && role !== 'AGENT_VIEWER') loadUptime();
  }, [timeRange]);

  useEffect(() => {
    if (role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') {
      loadStorage();
    }
    if (role && role !== 'AGENT_VIEWER') {
      loadLocations();
    }
  }, [role]);

  useEffect(() => {
    if (role && role !== 'AGENT_VIEWER' && refreshKey > 0) {
      const siteUuid = localStorage.getItem("backone_site_uuid") || undefined;
      getAgents(siteUuid)
        .then(data => setAgents(data))
        .catch(err => console.warn("Failed to auto-refresh agents:", err));
      loadUptime();
      loadLocations();
      if (role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') {
        loadStorage();
      }
    }
  }, [refreshKey, role]);

  const openDelete = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDeleteOpen(true);
  };

  const handleEditLocation = (agentUuid: string, agentLabel: string) => {
    const loc = locations.find(l => l.agent_uuid === agentUuid) || null;
    setLocModalAgentUuid(agentUuid);
    setLocModalAgentLabel(agentLabel);
    setLocModalCurrentLoc(loc);
    setIsLocModalOpen(true);
  };

  return {
    role,
    agents,
    uptimeMap,
    storageMap,
    isLoading,
    error,
    isCreateOpen,
    setIsCreateOpen,
    isDeleteOpen,
    setIsDeleteOpen,
    detailAgent,
    setDetailAgent,
    managedUsers,
    accountModalOpen,
    setAccountModalOpen,
    accountModalAgent,
    setAccountModalAgent,
    externalModalOpen,
    setExternalModalOpen,
    externalModalUser,
    setExternalModalUser,
    targetSiteUuid,
    setTargetSiteUuid,
    targetCreatedBy,
    setTargetCreatedBy,
    locations,
    isLocModalOpen,
    setIsLocModalOpen,
    locModalAgentUuid,
    setLocModalAgentUuid,
    locModalAgentLabel,
    setLocModalAgentLabel,
    locModalCurrentLoc,
    setLocModalCurrentLoc,
    viewAsLoading,
    selectedAgent,
    loadAgents,
    loadLocations,
    handleViewAs,
    openDelete,
    handleEditLocation,
  };
}
