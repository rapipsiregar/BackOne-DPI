"use client";

import { useEffect } from "react";
import { Plus, Loader2, MapPin } from "lucide-react";
import { HelpTrigger } from "@/components/help/HelpTrigger";
import { useAgentsData } from "./useAgentsData";
import { getAgentColumns } from "./columns";
import { getExternalAccountColumns } from "./externalColumns";
import UptimeStatsCards from "./UptimeStatsCards";
import AgentsTableSection from "./AgentsTableSection";
import ExternalAccountsSection from "./ExternalAccountsSection";
import AgentsPageModals from "./AgentsPageModals";
import AgentLocationMap from "@/components/admin/AgentLocationMap";
import { resolveAgentLabel } from "@/lib/admin-api";

export default function AgentsPage() {
  useEffect(() => {
    document.title = "Agents | BackOne - Deep Package Inspection";
  }, []);
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
    handleEditLocation,
    locationUuids: new Set(locations.map((l: any) => l.agent_uuid)),
  });

  const externalColumns = getExternalAccountColumns((user) => {
    setExternalModalUser(user);
    setExternalModalOpen(true);
  });

  const totalAgents = agents.length;
  const onlineAgents = agents.filter(a => {
    const hum = a.last_seen_at?.human;
    return hum === 'Online' || hum === 'Flows Detected' || (hum && hum.startsWith('Last seen:'));
  }).length;
  const offlineAgents = totalAgents - onlineAgents;
  const uptimeValues = agents.map(a => uptimeMap[a.uuid || a.serial] ?? 100);
  const avgUptime = uptimeValues.length > 0 ? uptimeValues.reduce((s, v) => s + v, 0) / uptimeValues.length : 100;

  const externalUsers = managedUsers.filter(u => u.role !== 'AGENT_VIEWER');
  const superadminUsers = externalUsers.filter(u => u.role === 'SUPER_ADMIN' || !u.site_uuid);
  const siabUsers = externalUsers.filter(u => u.site_uuid === '6681452d_9cae_4ff4_8ae8_0d504774265e');
  const nexusUsers = externalUsers.filter(u => u.site_uuid === 'd7902405_0dc2_458b_8584_ed4d24b64f24');

  return (
    <div className="space-y-6" style={{ fontFamily: "Georgia, serif" }}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-3">
            Agents Inventory
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Managed DPI probes, remote collectors, and probe infrastructure.</p>
        </div>
        <HelpTrigger pageId="agents" />
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

      {/* Agent Location Map */}
      {(role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') && (
        <div className="rounded-2xl border border-white/8 bg-slate-900/40 overflow-hidden relative z-0">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-semibold text-white">Agent Network Map</span>
              <span className="text-xs text-slate-500">
                {locations.length > 0
                  ? `${locations.length} of ${agents.length} agent${agents.length !== 1 ? 's' : ''} positioned`
                  : 'No positions configured yet'}
              </span>
            </div>
            {agents.length > locations.length && (
              <span className="text-[11px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                {agents.length - locations.length} agent{agents.length - locations.length !== 1 ? 's' : ''} without location — click 📍 in the table
              </span>
            )}
          </div>
          <div className="p-3">
            <AgentLocationMap
              pins={locations
                .filter(loc => agents.some(a => (a.uuid || a.serial) === loc.agent_uuid))
                .map(loc => {
                  const agent = agents.find(a => (a.uuid || a.serial) === loc.agent_uuid);
                  const agentLabel = agent
                    ? (resolveAgentLabel(loc.agent_uuid, managedUsers) !== loc.agent_uuid
                        ? resolveAgentLabel(loc.agent_uuid, managedUsers)
                        : (agent.label || loc.label || loc.agent_uuid))
                    : (loc.label || loc.agent_uuid);
                  const isOnline = !!(agent?.last_seen_at?.human === 'Online' ||
                                     agent?.last_seen_at?.human === 'Flows Detected' ||
                                     (agent?.last_seen_at?.human && agent.last_seen_at.human.startsWith('Last seen:')));
                  const uptime = uptimeMap[loc.agent_uuid];
                  return {
                    agent_uuid: loc.agent_uuid,
                    label: agentLabel,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    isOnline,
                    uptimePercent: uptime,
                  };
                })}
              onEditLocation={handleEditLocation}
              canEdit={role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN'}
            />
          </div>
        </div>
      )}

      <AgentsTableSection
        agents={agents}
        isLoading={isLoading}
        columns={columns}
        role={role}
        onProvisionClick={() => setIsCreateOpen(true)}
      />

      {(role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') && (
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
      )}

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
