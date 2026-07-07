"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAgents, createAgent, deleteAgent, Agent } from "@/lib/actions/agents";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { AgentDetailModal } from "@/components/ui/AgentDetailModal";
import AgentAccountModal from "@/components/admin/AgentAccountModal";
import { Loader2, Plus, Trash2, Server, CheckCircle2, XCircle, ChevronRight, UserCog, Eye } from "lucide-react";

import { getAdminUsers, startViewAs, resolveAgentLabel, type ManagedUser } from "@/lib/admin-api";

export default function AgentsPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Detail modal
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);

  // Admin: managed users (for label resolution + account management)
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);

  // Admin: AgentAccountModal state
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountModalAgent, setAccountModalAgent] = useState<{ uuid: string; label: string } | null>(null);

  // View-as loading state
  const [viewAsLoading, setViewAsLoading] = useState<string | null>(null);

  // Form state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({ agentId: "", label: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const [agentData, userData] = await Promise.allSettled([
        getAgents(),
        getAdminUsers(),
      ]);
      if (agentData.status === 'fulfilled') setAgents(agentData.value);
      else setError((agentData.reason as Error).message);
      if (userData.status === 'fulfilled') setManagedUsers(userData.value);
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
    fetch('/api/auth/me')
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

  const openCreate = () => {
    setFormData({ agentId: "", label: "" });
    setIsCreateOpen(true);
  };

  const openDelete = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await createAgent(formData.agentId, formData.label);
    setIsSubmitting(false);
    if (res.success) {
      setIsCreateOpen(false);
      loadAgents();
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
      loadAgents();
    } else {
      alert(res.message);
    }
  };

  const columns: Column<Agent>[] = [
    {
      header: "UUID / Serial",
      accessor: (row) => (
        <button
          onClick={() => setDetailAgent(row)}
          className="flex items-center gap-2 group text-left"
          title="Click to view agent details"
        >
          <span className="font-mono text-xs text-blue-400 group-hover:text-blue-300 transition-colors">{row.uuid || row.serial}</span>
          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
        </button>
      )
    },
    {
      header: "Label",
      accessor: (row) => {
        // Ambil label dari account_name user yang terhubung ke agent ini
        const uuid = row.uuid || row.serial;
        const dynamicLabel = resolveAgentLabel(uuid, managedUsers);
        const hasAccount = managedUsers.some(u => u.agent_uuid === uuid && u.role === 'AGENT_VIEWER');
        return (
          <div className="flex items-center gap-2">
            <button onClick={() => setDetailAgent(row)} className="text-left hover:text-white transition-colors">
              {dynamicLabel !== uuid ? dynamicLabel : (row.label || <span className="text-muted-foreground italic font-mono text-xs">{uuid}</span>)}
            </button>
            {!hasAccount && role === 'SUPER_ADMIN' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/40 border border-amber-700/50 text-amber-400">Belum ada akun</span>
            )}
          </div>
        );
      }
    },
    { header: "Provisioned", accessor: (row) => row.provisioned ? <Badge variant="green"><CheckCircle2 className="w-3 h-3 mr-1" /> Yes</Badge> : <Badge variant="red"><XCircle className="w-3 h-3 mr-1" /> No</Badge> },
    { header: "Activated", accessor: (row) => row.activated ? <Badge variant="green"><CheckCircle2 className="w-3 h-3 mr-1" /> Yes</Badge> : <Badge variant="red"><XCircle className="w-3 h-3 mr-1" /> No</Badge> },
    { 
      header: "Status", 
      accessor: (row) => {
        const statusText = row.last_seen_at?.human || '-';
        if (statusText === 'Online') {
          return <span className="text-emerald-400 font-medium flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Online</span>;
        } else if (statusText === 'Offline') {
          return <span className="text-red-400 font-medium">Offline</span>;
        } else {
          return <span className="text-slate-400 text-xs">{statusText}</span>; // Last Seen ...
        }
      }
    },
    { 
      header: "Actions", 
      accessor: (row) => {
        const uuid = row.uuid || row.serial;
        const dynamicLabel = resolveAgentLabel(uuid, managedUsers);
        const existingUser = managedUsers.find(u => u.agent_uuid === uuid && u.role === 'AGENT_VIEWER') || null;
        const isViewAsLoading = viewAsLoading === uuid;
        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setDetailAgent(row)}
              className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 rounded transition-colors"
              title="Detail Agent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {role === 'SUPER_ADMIN' && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setAccountModalAgent({ uuid, label: dynamicLabel !== uuid ? dynamicLabel : (row.label || uuid) }); setAccountModalOpen(true); }}
                  className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 rounded transition-colors"
                  title={existingUser ? 'Edit Akun Agent' : 'Buat Akun Agent'}
                >
                  <UserCog className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleViewAs(uuid, dynamicLabel !== uuid ? dynamicLabel : (row.label || uuid)); }}
                  disabled={isViewAsLoading}
                  className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 rounded transition-colors disabled:opacity-50"
                  title="Lihat Sebagai Agent Ini"
                >
                  {isViewAsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); openDelete(row); }} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        );
      }
    },
  ];

  return (
    <div className="space-y-6">
<h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <Server className="w-6 h-6 text-primary" />
          Agents Inventory
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </h2>
      <div className="flex items-center justify-between">
        
        <button 
          onClick={openCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Provision Agent
        </button>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-white">Active Agents {agents.length > 0 ? `(${agents.length})` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-xl space-y-4 text-slate-300">
              <div className="flex items-center gap-2 text-red-400 font-semibold">
                <XCircle className="w-5 h-5" />
                <span>Akses Agents Ditolak (403 Forbidden)</span>
              </div>
              <p className="text-sm leading-relaxed">
                API Key yang Anda gunakan saat ini (<code className="bg-red-950/40 text-red-300 px-1.5 py-0.5 rounded font-mono text-xs">sk_db_live_...</code>) adalah <strong>Site-scoped API Key</strong>. BackOne membatasi kunci ini agar hanya dapat membaca data statistik jaringan (Informatics), sehingga tidak memiliki izin untuk mengelola inventaris Agents global.
              </p>
              <div className="bg-slate-900/60 rounded-lg p-4 border border-border/40 text-xs space-y-2 leading-relaxed">
                <p className="font-semibold text-white">ðŸ’¡ Cara Mengatasinya:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-400">
                  <li>Buka dan login ke portal <a href="https://portal.netify.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">BackOne Portal</a>.</li>
                  <li>Di menu sebelah kiri, navigasikan ke <strong>Settings</strong> &gt; <strong>API Keys</strong>.</li>
                  <li>Buat atau salin kunci tipe <strong>Standard API Key</strong>.</li>
                  <li>Buka file <code className="text-slate-200">.env.local</code> di proyek Anda, lalu ganti nilai <code className="text-slate-200">BACKONE_API_KEY</code> (atau <code className="text-slate-200">NETIFY_API_KEY</code>) dengan kunci baru tersebut.</li>
                </ol>
              </div>
            </div>
          ) : (
            <DataTable 
              data={agents} 
              columns={columns} 
              searchPlaceholder="Search agents by UUID or label..."
              searchFilter={(row, query) => {
                const q = query.toLowerCase();
                return (row.uuid || "").toLowerCase().includes(q) || 
                       (row.serial || "").toLowerCase().includes(q) ||
                       (row.label || "").toLowerCase().includes(q);
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Provision New Agent">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Agent UUID / Serial *</label>
            <input 
              required
              type="text" 
              placeholder="e.g. EX-AM-PL-ES"
              value={formData.agentId} 
              onChange={e => setFormData({...formData, agentId: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Agent Label</label>
            <input 
              type="text" 
              placeholder="e.g. Branch Office Gateway"
              value={formData.label} 
              onChange={e => setFormData({...formData, label: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Agent
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete the agent <span className="font-bold text-white">{selectedAgent?.label || selectedAgent?.uuid}</span>? This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={isSubmitting} className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50">
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
          onSuccess={() => { loadAgents(); }}
          agentUuid={accountModalAgent.uuid}
          agentLabel={accountModalAgent.label}
          existingUser={managedUsers.find(u => u.agent_uuid === accountModalAgent.uuid && u.role === 'AGENT_VIEWER') || null}
        />
      )}

    </div>
  );
}

