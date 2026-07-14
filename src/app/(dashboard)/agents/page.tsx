"use client";

import { Loader2, Plus, Server } from "lucide-react";
import { getAgentColumns } from "./columns";
import { getExternalAccountColumns } from "./externalColumns";
import ExternalAccountsSection from "./ExternalAccountsSection";
import UptimeStatsCards from "./UptimeStatsCards";
import AgentsTableSection from "./AgentsTableSection";
import AgentsPageModals from "./AgentsPageModals";
import { useAgentsData } from "./useAgentsData";
import { HelpTrigger } from "@/components/help/HelpTrigger";
import dynamic from "next/dynamic";

const IndonesiaAgentMap = dynamic(
  () => import("@/components/dashboard/IndonesiaAgentMap").then(m => ({ default: m.IndonesiaAgentMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[320px] w-full rounded-2xl border border-white/5 bg-slate-900/40 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs text-slate-400">Loading Agent Location Map...</span>
        </div>
      </div>
    ),
  }
);

export default function AgentsPage() {
  const {
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
  } = useAgentsData();

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
    onEditLocation: handleEditLocation,
    locations,
  });

  const totalAgents = agents.length;
  const onlineAgents = agents.filter(a => a.last_seen_at?.human === 'Online').length;
  const offlineAgents = totalAgents - onlineAgents;
  const uptimeValues = agents.map(a => uptimeMap[a.uuid || a.serial] ?? 100);
  const avgUptime = uptimeValues.length > 0 ? uptimeValues.reduce((s, v) => s + v, 0) / uptimeValues.length : 100;

  const externalUsers = managedUsers.filter(u => u.role !== 'AGENT_VIEWER');
  const superadminUsers = externalUsers.filter(u => u.role === 'SUPER_ADMIN' || !u.site_uuid || u.site_uuid === 'default' || (u.site_uuid !== '6681452d_9cae_4ff4_8ae8_0d504774265e' && u.site_uuid !== 'd7902405_0dc2_458b_8584_ed4d24b64f24'));
  const siabUsers = externalUsers.filter(u => u.role !== 'SUPER_ADMIN' && u.site_uuid === '6681452d_9cae_4ff4_8ae8_0d504774265e');
  const nexusUsers = externalUsers.filter(u => u.role !== 'SUPER_ADMIN' && u.site_uuid === 'd7902405_0dc2_458b_8584_ed4d24b64f24');

  const externalColumns = getExternalAccountColumns((user) => {
    setExternalModalUser(user);
    setExternalModalOpen(true);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <Server className="w-6 h-6 text-primary" />
          Agents Inventory
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </h2>
        <div className="flex items-center gap-3">
          <HelpTrigger pageId="agents" />
          {(role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') && (
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/10"
            >
              <Plus className="w-4 h-4" />
              Provision Agent
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <UptimeStatsCards
        totalAgents={totalAgents}
        onlineAgents={onlineAgents}
        offlineAgents={offlineAgents}
        avgUptime={avgUptime}
      />

      {/* Indonesia Agent Geolocation & Flow Map */}
      {!isLoading && (
        <IndonesiaAgentMap
          agents={agents}
          locations={locations}
          onEditLocation={handleEditLocation}
          role={role}
        />
      )}

      <AgentsTableSection
        agents={agents}
        isLoading={isLoading}
        columns={columns}
      />

      <ExternalAccountsSection
        role={role}
        isLoading={isLoading}
        externalUsers={externalUsers}
        superadminUsers={superadminUsers}
        siabUsers={siabUsers}
        nexusUsers={nexusUsers}
        externalColumns={externalColumns}
        setExternalModalUser={setExternalModalUser}
        setTargetSiteUuid={setTargetSiteUuid}
        setTargetCreatedBy={setTargetCreatedBy}
        setExternalModalOpen={setExternalModalOpen}
      />

      <AgentsPageModals
        isCreateOpen={isCreateOpen}
        setIsCreateOpen={setIsCreateOpen}
        isDeleteOpen={isDeleteOpen}
        setIsDeleteOpen={setIsDeleteOpen}
        selectedAgent={selectedAgent}
        loadAgents={loadAgents}
        detailAgent={detailAgent}
        setDetailAgent={setDetailAgent}
        accountModalOpen={accountModalOpen}
        setAccountModalOpen={setAccountModalOpen}
        accountModalAgent={accountModalAgent}
        setAccountModalAgent={setAccountModalAgent}
        managedUsers={managedUsers}
        externalModalOpen={externalModalOpen}
        setExternalModalOpen={setExternalModalOpen}
        externalModalUser={externalModalUser}
        setExternalModalUser={setExternalModalUser}
        targetSiteUuid={targetSiteUuid}
        setTargetSiteUuid={setTargetSiteUuid}
        targetCreatedBy={targetCreatedBy}
        setTargetCreatedBy={setTargetCreatedBy}
        isLocModalOpen={isLocModalOpen}
        setIsLocModalOpen={setIsLocModalOpen}
        locModalAgentUuid={locModalAgentUuid}
        setLocModalAgentUuid={setLocModalAgentUuid}
        locModalAgentLabel={locModalAgentLabel}
        setLocModalAgentLabel={setLocModalAgentLabel}
        locModalCurrentLoc={locModalCurrentLoc}
        setLocModalCurrentLoc={setLocModalCurrentLoc}
        loadLocations={loadLocations}
      />
    </div>
  );
}
