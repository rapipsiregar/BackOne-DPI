"use client";

import { AgentModals } from "@/components/admin/AgentModals";
import ExternalAccountModal from "@/components/admin/ExternalAccountModal";
import AgentLocationModal from "@/components/admin/AgentLocationModal";
import { Agent } from "@/lib/actions/agentsCore";
import { type ManagedUser } from "@/lib/admin-api";

interface AgentsPageModalsProps {
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
  isDeleteOpen: boolean;
  setIsDeleteOpen: (open: boolean) => void;
  selectedAgent: Agent | null;
  loadAgents: () => Promise<void>;
  detailAgent: Agent | null;
  setDetailAgent: (agent: Agent | null) => void;
  accountModalOpen: boolean;
  setAccountModalOpen: (open: boolean) => void;
  accountModalAgent: { uuid: string; label: string } | null;
  setAccountModalAgent: (agent: { uuid: string; label: string } | null) => void;
  managedUsers: ManagedUser[];
  externalModalOpen: boolean;
  setExternalModalOpen: (open: boolean) => void;
  externalModalUser: ManagedUser | null;
  setExternalModalUser: (user: ManagedUser | null) => void;
  targetSiteUuid: string | null;
  setTargetSiteUuid: (uuid: string | null) => void;
  targetCreatedBy: string | null;
  setTargetCreatedBy: (createdBy: string | null) => void;
  isLocModalOpen: boolean;
  setIsLocModalOpen: (open: boolean) => void;
  locModalAgentUuid: string;
  setLocModalAgentUuid: (uuid: string) => void;
  locModalAgentLabel: string;
  setLocModalAgentLabel: (label: string) => void;
  locModalCurrentLoc: any | null;
  setLocModalCurrentLoc: (loc: any | null) => void;
  loadLocations: () => Promise<void>;
}

export default function AgentsPageModals({
  isCreateOpen,
  setIsCreateOpen,
  isDeleteOpen,
  setIsDeleteOpen,
  selectedAgent,
  loadAgents,
  detailAgent,
  setDetailAgent,
  accountModalOpen,
  setAccountModalOpen,
  accountModalAgent,
  setAccountModalAgent,
  managedUsers,
  externalModalOpen,
  setExternalModalOpen,
  externalModalUser,
  setExternalModalUser,
  targetSiteUuid,
  setTargetSiteUuid,
  targetCreatedBy,
  setTargetCreatedBy,
  isLocModalOpen,
  setIsLocModalOpen,
  locModalAgentUuid,
  setLocModalAgentUuid,
  locModalAgentLabel,
  setLocModalAgentLabel,
  locModalCurrentLoc,
  setLocModalCurrentLoc,
  loadLocations,
}: AgentsPageModalsProps) {
  return (
    <>
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
        onClose={() => { 
          setExternalModalOpen(false); 
          setExternalModalUser(null);
          setTargetSiteUuid(null);
          setTargetCreatedBy(null);
        }}
        onSuccess={loadAgents}
        user={externalModalUser}
        targetSiteUuid={targetSiteUuid}
        targetCreatedBy={targetCreatedBy}
      />

      <AgentLocationModal
        isOpen={isLocModalOpen}
        onClose={() => {
          setIsLocModalOpen(false);
          setLocModalAgentUuid("");
          setLocModalAgentLabel("");
          setLocModalCurrentLoc(null);
        }}
        onSuccess={() => {
          loadLocations();
        }}
        agentUuid={locModalAgentUuid}
        agentLabel={locModalAgentLabel}
        currentLocation={locModalCurrentLoc}
      />
    </>
  );
}
