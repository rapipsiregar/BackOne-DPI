"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";
import { createAgent, deleteAgent, Agent } from "@/lib/actions/agents";
import { AgentDetailModal } from "@/components/ui/AgentDetailModal";
import AgentAccountModal from "@/components/admin/AgentAccountModal";
import { resolveAgentLabel, type ManagedUser } from "@/lib/admin-api";

interface Props {
  isCreateOpen: boolean;
  setIsCreateOpen: (open: boolean) => void;
  isDeleteOpen: boolean;
  setIsDeleteOpen: (open: boolean) => void;
  selectedAgent: Agent | null;
  onSuccess: () => void;
  // Detail modal state
  detailAgent: Agent | null;
  setDetailAgent: (agent: Agent | null) => void;
  // Account modal state
  accountModalOpen: boolean;
  setAccountModalOpen: (open: boolean) => void;
  accountModalAgent: { uuid: string; label: string } | null;
  setAccountModalAgent: (agent: { uuid: string; label: string } | null) => void;
  managedUsers: ManagedUser[];
}

export function AgentModals({
  isCreateOpen,
  setIsCreateOpen,
  isDeleteOpen,
  setIsDeleteOpen,
  selectedAgent,
  onSuccess,
  detailAgent,
  setDetailAgent,
  accountModalOpen,
  setAccountModalOpen,
  accountModalAgent,
  setAccountModalAgent,
  managedUsers
}: Props) {
  const [formData, setFormData] = useState({ agentId: "", label: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createAgent(formData.agentId, formData.label);
    setIsSubmitting(false);
    if (res.success) {
      setIsCreateOpen(false);
      setFormData({ agentId: "", label: "" });
      onSuccess();
    } else {
      alert(res.message);
    }
  };

  const handleDelete = async () => {
    if (!selectedAgent) return;
    setIsSubmitting(true);
    const res = await deleteAgent(selectedAgent.uuid || selectedAgent.serial);
    setIsSubmitting(false);
    if (res.success) {
      setIsDeleteOpen(false);
      onSuccess();
    } else {
      alert(res.message);
    }
  };

  return (
    <>
      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Provision New Agent">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Agent UUID / Serial *</label>
            <input 
              required
              type="text" 
              placeholder="e.g. EX-AM-PL-ES"
              value={formData.agentId} 
              onChange={e => setFormData({...formData, agentId: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Agent Label</label>
            <input 
              type="text" 
              placeholder="e.g. Branch Office Gateway"
              value={formData.label} 
              onChange={e => setFormData({...formData, label: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Agent
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Deletion">
        <div className="space-y-4 text-xs">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete the agent <span className="font-bold text-white">{selectedAgent?.label || selectedAgent?.uuid}</span>? This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={isSubmitting} className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Delete Agent
            </button>
          </div>
        </div>
      </Modal>

      {/* Agent Detail Modal */}
      {detailAgent && (
        <AgentDetailModal
          agentUuid={detailAgent.uuid || detailAgent.serial}
          agentLabel={resolveAgentLabel(detailAgent.uuid || detailAgent.serial, managedUsers) !== (detailAgent.uuid || detailAgent.serial)
            ? resolveAgentLabel(detailAgent.uuid || detailAgent.serial, managedUsers)
            : (detailAgent.label || detailAgent.uuid || detailAgent.serial)}
          onClose={() => setDetailAgent(null)}
        />
      )}

      {/* Agent Account Modal */}
      {accountModalOpen && accountModalAgent && (
        <AgentAccountModal
          isOpen={accountModalOpen}
          onClose={() => { setAccountModalOpen(false); setAccountModalAgent(null); }}
          onSuccess={onSuccess}
          agentUuid={accountModalAgent.uuid}
          agentLabel={accountModalAgent.label}
          existingUser={managedUsers.find(u => u.agent_uuid === accountModalAgent.uuid && u.role === 'AGENT_VIEWER') || null}
        />
      )}
    </>
  );
}
