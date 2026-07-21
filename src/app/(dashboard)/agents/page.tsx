"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAgents, Agent } from "@/lib/actions/agents";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { Cpu, History, Radio, Server, Activity, Plus, Loader2, CheckCircle2, XCircle } from "lucide-react";

import { getAdminUsers, startViewAs, resolveAgentLabel, getViewAsHeaders, type ManagedUser } from "@/lib/admin-api";
import { useTimeFilter } from "@/contexts/TimeFilterContext";
import { usePollingKey } from "@/lib/usePolling";
import { AgentModals } from "@/components/admin/AgentModals";
import ExternalAccountModal from "@/components/admin/ExternalAccountModal";
import { getAgentColumns, getExternalAccountColumns } from "./columns";
import { HelpTrigger } from "@/components/help/HelpTrigger";

export default function AgentsPage() {
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
          setRole(data.user.role || null);
          if (data.user.role === 'AGENT_VIEWER') {
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
    if (role === 'SUPER_ADMIN') {
      loadStorage();
    }
  }, [role]);

  useEffect(() => {
    if (role && role !== 'AGENT_VIEWER' && refreshKey > 0) {
      const siteUuid = localStorage.getItem("backone_site_uuid") || undefined;
      getAgents(siteUuid)
        .then(data => setAgents(data))
        .catch(err => console.warn("Failed to auto-refresh agents:", err));
      loadUptime();
      if (role === 'SUPER_ADMIN') {
        loadStorage();
      }
    }
  }, [refreshKey, role]);

  const openDelete = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDeleteOpen(true);
  };

  const columns = getAgentColumns({
    role,
    uptimeMap,
    storageMap,
    managedUsers,
    viewAsLoading,
    setDetailAgent,
    setAccountModalOpen,
    setAccountModalAgent,
    handleViewAs,
    openDelete,
  });

  const totalAgents = agents.length;
  const onlineAgents = agents.filter(a => a.last_seen_at?.human === 'Online').length;
  const offlineAgents = totalAgents - onlineAgents;
  const uptimeValues = agents.map(a => uptimeMap[a.uuid || a.serial] ?? 100);
  const avgUptime = uptimeValues.length > 0 ? uptimeValues.reduce((s, v) => s + v, 0) / uptimeValues.length : 100;

  const externalUsers = managedUsers.filter(u => u.role !== 'AGENT_VIEWER');
  const externalColumns = getExternalAccountColumns((user) => {
    setExternalModalUser(user);
    setExternalModalOpen(true);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Agents Inventory
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-muted-foreground mt-1">Managed DPI probes, remote collectors, and probe infrastructure.</p>
        </div>
        <div className="flex items-center gap-3">
          {(role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') && (
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" />
              Provision Agent
            </button>
          )}
          <HelpTrigger pageId="agents" />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {/* Historical Uptime Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-semibold">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Server className="w-12 h-12 text-blue-400" />
          </div>
          <span className="text-slate-400 uppercase tracking-wider mb-1">Total Agents</span>
          <span className="text-2xl font-black text-white tracking-tight">{totalAgents}</span>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <span className="text-slate-400 uppercase tracking-wider mb-1">Online Agents</span>
          <span className="text-2xl font-black text-emerald-400 tracking-tight">{onlineAgents}</span>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          <span className="text-slate-400 uppercase tracking-wider mb-1">Offline Agents</span>
          <span className="text-2xl font-black text-red-400 tracking-tight">{offlineAgents}</span>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/80 p-5 rounded-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-12 h-12 text-cyan-400" />
          </div>
          <span className="text-slate-400 uppercase tracking-wider mb-1">Avg. Historical Uptime</span>
          <span className="text-2xl font-black text-cyan-400 tracking-tight">{avgUptime.toFixed(2)}%</span>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white">Provisioned Network Agents ({agents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <DataTable
              data={agents}
              columns={columns}
              searchPlaceholder="Search agents..."
              searchFilter={(row, query) => {
                const q = query.toLowerCase();
                return (
                  (row.uuid || "").toLowerCase().includes(q) ||
                  (row.serial || "").toLowerCase().includes(q) ||
                  (row.label || "").toLowerCase().includes(q)
                );
              }}
            />
          )}
        </CardContent>
      </Card>

      {(role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') && (
        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white">External Accounts Inventory ({externalUsers.length})</CardTitle>
            <button
              onClick={() => {
                setExternalModalUser(null); // Mode Create
                setExternalModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add External Account
            </button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <DataTable
                data={externalUsers}
                columns={externalColumns}
                searchPlaceholder="Search accounts..."
                searchFilter={(row, query) => {
                  const q = query.toLowerCase();
                  return (
                    (row.username || "").toLowerCase().includes(q) ||
                    (row.account_name || "").toLowerCase().includes(q) ||
                    (row.role || "").toLowerCase().includes(q)
                  );
                }}
              />
            )}
          </CardContent>
        </Card>
      )}

      <AgentModals
        isCreateOpen={isCreateOpen}
        setIsCreateOpen={setIsCreateOpen}
        isDeleteOpen={isDeleteOpen}
        setIsDeleteOpen={setIsDeleteOpen}
        selectedAgent={selectedAgent}
        onSuccess={loadAgents}
        detailAgent={detailAgent}
        setDetailAgent={setDetailAgent}
        accountModalOpen={accountModalOpen}
        setAccountModalOpen={setAccountModalOpen}
        accountModalAgent={accountModalAgent}
        setAccountModalAgent={setAccountModalAgent}
        managedUsers={managedUsers}
      />

      <ExternalAccountModal
        isOpen={externalModalOpen}
        onClose={() => { setExternalModalOpen(false); setExternalModalUser(null); }}
        onSuccess={loadAgents}
        user={externalModalUser}
      />
    </div>
  );
}
