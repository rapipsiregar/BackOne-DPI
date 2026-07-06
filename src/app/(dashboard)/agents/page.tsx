"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAgents, createAgent, updateAgent, deleteAgent, Agent } from "@/lib/actions/agents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable, Column } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { AgentDetailModal } from "@/components/ui/AgentDetailModal";
import { Loader2, Plus, Edit, Trash2, Server, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

export default function AgentsPage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Detail modal
  const [detailAgent, setDetailAgent] = useState<Agent | null>(null);

  // Known agent UUIDs with labels
  const AGENT_LABELS: Record<string, string> = {
    '2F-TF-1D-GK': 'JRP Cibubur',
    '8A-V3-PB-85': 'IFG LT.18',
    'F6-2V-DT-8A': 'CPI Balaraja',
    '1R-79-J9-YE': 'CPI Balaraja WAN',
  };

  // Form state
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [formData, setFormData] = useState({ agentId: "", label: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const data = await getAgents();
      setAgents(data);
    } catch (e: any) {
      setError(e.message);
    }
    setIsLoading(false);
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

  const openEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({ agentId: agent.uuid || agent.serial, label: agent.label || "" });
    setIsEditOpen(true);
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent) return;
    
    setIsSubmitting(true);
    const res = await updateAgent(selectedAgent.uuid || selectedAgent.serial, formData.label);
    setIsSubmitting(false);
    
    if (res.success) {
      setIsEditOpen(false);
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
        const friendlyLabel = AGENT_LABELS[row.uuid || row.serial];
        return (
          <button onClick={() => setDetailAgent(row)} className="text-left hover:text-white transition-colors">
            {friendlyLabel || row.label || <span className="text-muted-foreground italic">No label</span>}
          </button>
        );
      }
    },
    { header: "Provisioned", accessor: (row) => row.provisioned ? <Badge variant="green"><CheckCircle2 className="w-3 h-3 mr-1" /> Yes</Badge> : <Badge variant="red"><XCircle className="w-3 h-3 mr-1" /> No</Badge> },
    { header: "Activated", accessor: (row) => row.activated ? <Badge variant="green"><CheckCircle2 className="w-3 h-3 mr-1" /> Yes</Badge> : <Badge variant="red"><XCircle className="w-3 h-3 mr-1" /> No</Badge> },
    { header: "Last Seen", accessor: (row) => <span className="text-muted-foreground">{row.last_seen_at?.human || '-'}</span> },
    { 
      header: "Actions", 
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDetailAgent(row)}
            className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 rounded transition-colors"
            title="View details"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openEdit(row); }} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openDelete(row); }} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ) 
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <Server className="w-6 h-6 text-primary" />
          Agents Inventory
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
        </h2>
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
                <p className="font-semibold text-white">💡 Cara Mengatasinya:</p>
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

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Agent">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Agent UUID / Serial</label>
            <input 
              disabled
              type="text" 
              value={selectedAgent?.uuid || selectedAgent?.serial || ""} 
              className="w-full bg-slate-900/50 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Agent Label</label>
            <input 
              autoFocus
              type="text" 
              placeholder="e.g. Branch Office Gateway"
              value={formData.label} 
              onChange={e => setFormData({...formData, label: e.target.value})}
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save Changes
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
          agentLabel={AGENT_LABELS[detailAgent.uuid || detailAgent.serial] || detailAgent.label || detailAgent.uuid || detailAgent.serial}
          onClose={() => setDetailAgent(null)}
        />
      )}

    </div>
  );
}
