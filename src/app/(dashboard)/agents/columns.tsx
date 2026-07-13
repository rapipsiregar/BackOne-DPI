"use client";

import { Column } from "@/components/ui/DataTable";
import { Agent } from "@/lib/actions/agents";
import { Badge } from "@/components/ui/Badge";
import { resolveAgentLabel, type ManagedUser } from "@/lib/admin-api";
import { Loader2, Trash2, CheckCircle2, XCircle, ChevronRight, UserCog, Eye } from "lucide-react";

interface GetColumnsProps {
  role: string | null;
  uptimeMap: Record<string, number>;
  storageMap?: Record<string, number>;
  managedUsers: ManagedUser[];
  viewAsLoading: string | null;
  setDetailAgent: (agent: Agent | null) => void;
  setAccountModalOpen: (open: boolean) => void;
  setAccountModalAgent: (agent: { uuid: string; label: string } | null) => void;
  handleViewAs: (uuid: string, label: string) => void;
  openDelete: (agent: Agent) => void;
}

export function getAgentColumns({
  role,
  uptimeMap,
  storageMap = {},
  managedUsers,
  viewAsLoading,
  setDetailAgent,
  setAccountModalOpen,
  setAccountModalAgent,
  handleViewAs,
  openDelete,
}: GetColumnsProps): Column<Agent>[] {
  const cols: Column<Agent>[] = [
    {
      header: "UUID / Serial",
      className: "w-[16%] text-center",
      accessor: (row) => (
        <button onClick={() => setDetailAgent(row)} className="flex items-center justify-center gap-2 group text-center mx-auto" title="Click to view agent details">
          <span className="font-mono text-xs text-blue-400 group-hover:text-blue-300 transition-colors">{row.uuid || row.serial}</span>
          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
        </button>
      )
    },
    {
      header: "Label",
      className: "w-[24%] text-center",
      accessor: (row) => {
        const uuid = row.uuid || row.serial;
        const dynamicLabel = resolveAgentLabel(uuid, managedUsers);
        const hasAccount = managedUsers.some(u => u.agent_uuid === uuid && u.role === 'AGENT_VIEWER');
        return (
          <div className="flex items-center justify-center gap-2 mx-auto max-w-full">
            <button onClick={() => setDetailAgent(row)} className="text-center hover:text-white transition-colors truncate">
              {dynamicLabel !== uuid ? dynamicLabel : (row.label || <span className="text-muted-foreground italic font-mono text-xs">{uuid}</span>)}
            </button>
            {!hasAccount && (role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') && (
              <Badge variant="orange" className="text-[10px] px-1.5 py-0.5 font-semibold shrink-0 whitespace-nowrap">No account yet</Badge>
            )}
          </div>
        );
      }
    },
    { 
      header: "Provisioned", 
      className: "w-[12%] text-center",
      accessor: (row) => row.provisioned ? <Badge variant="green"><CheckCircle2 className="w-3 h-3 mr-1" /> Yes</Badge> : <Badge variant="red"><XCircle className="w-3 h-3 mr-1" /> No</Badge> 
    },
    { 
      header: "Activated", 
      className: "w-[12%] text-center",
      accessor: (row) => row.activated ? <Badge variant="green"><CheckCircle2 className="w-3 h-3 mr-1" /> Yes</Badge> : <Badge variant="red"><XCircle className="w-3 h-3 mr-1" /> No</Badge> 
    },
    { 
      header: "Status", 
      className: "w-[11%] text-center",
      accessor: (row) => {
        const statusText = row.last_seen_at?.human || '-';
        if (statusText === 'Online') {
          return <span className="text-emerald-400 font-medium flex items-center justify-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Online</span>;
        } else if (statusText === 'Offline') {
          return <span className="text-red-400 font-medium">Offline</span>;
        } else {
          return <span className="text-slate-400 text-xs">{statusText}</span>;
        }
      }
    },
    {
      header: "Historical Uptime",
      className: "w-[12%] text-center",
      accessor: (row) => {
        const uuid = row.uuid || row.serial;
        const uptime = uptimeMap[uuid] ?? 100;
        let color = "text-emerald-400";
        if (uptime < 90) color = "text-red-400";
        else if (uptime < 98) color = "text-amber-400";
        return <span className={`font-mono font-bold ${color}`}>{uptime.toFixed(1)}%</span>;
      }
    },
    { 
      header: "Actions", 
      className: "w-[13%] text-center",
      accessor: (row) => {
        const uuid = row.uuid || row.serial;
        const dynamicLabel = resolveAgentLabel(uuid, managedUsers);
        const existingUser = managedUsers.find(u => u.agent_uuid === uuid && u.role === 'AGENT_VIEWER') || null;
        const isViewAsLoading = viewAsLoading === uuid;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button onClick={() => setDetailAgent(row)} className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 rounded transition-colors" title="Detail Agent">
              <ChevronRight className="w-4 h-4" />
            </button>
            {(role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setAccountModalAgent({ uuid, label: dynamicLabel !== uuid ? dynamicLabel : (row.label || uuid) }); setAccountModalOpen(true); }}
                  className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 rounded transition-colors"
                  title={existingUser ? 'Edit Agent Account' : 'Create Agent Account'}
                >
                  <UserCog className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleViewAs(uuid, dynamicLabel !== uuid ? dynamicLabel : (row.label || uuid)); }}
                  disabled={isViewAsLoading}
                  className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 rounded transition-colors disabled:opacity-50"
                  title="View As Agent"
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

  if (role === 'SUPER_ADMIN') {
    cols.splice(cols.length - 1, 0, {
      header: "Data Size",
      className: "w-[12%] text-center",
      accessor: (row) => {
        const uuid = row.uuid || row.serial;
        const sizeMB = storageMap[uuid] ?? 0;
        return <span className="font-mono text-slate-300 font-semibold">{sizeMB.toFixed(2)} MB</span>;
      }
    });
  }

  return cols;
}

export function getExternalAccountColumns(
  onManageAccount: (user: ManagedUser) => void
): Column<ManagedUser>[] {
  return [
    {
      header: "Account Name",
      className: "w-[25%] text-left",
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shrink-0 overflow-hidden">
            {row.profile_picture ? (
              <img src={`/api/uploads/${row.profile_picture}`} alt={row.account_name || row.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-slate-400">{(row.account_name || row.username).substring(0, 2).toUpperCase()}</span>
            )}
          </div>
          <span className="font-medium text-white">{row.account_name || "-"}</span>
        </div>
      )
    },
    {
      header: "Username",
      className: "w-[25%] text-left",
      accessor: (row) => <span className="text-slate-300 font-mono text-sm">{row.username}</span>
    },
    {
      header: "Role",
      className: "w-[20%] text-center",
      accessor: (row) => {
        let badgeColor = "bg-slate-500/20 text-slate-400 border-slate-500/30";
        if (row.role === 'SUPER_ADMIN') badgeColor = "bg-purple-500/20 text-purple-400 border-purple-500/30";
        if (row.role === 'SOC_ANALYST') badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
        if (row.role === 'ENGINEER') badgeColor = "bg-blue-500/20 text-blue-400 border-blue-500/30";
        if (row.role === 'TENANT_ADMIN') badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
        
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeColor}`}>
            {row.role.replace('_', ' ')}
          </span>
        );
      }
    },
    {
      header: "Status",
      className: "w-[15%] text-center",
      accessor: (row) => (
        <div className="flex items-center justify-center gap-2">
          {/* Defaulting to active since we don't have is_active explicitly in ManagedUser interface yet, though API returns it. We'll check if it exists, else assume Active */}
          {(row as any).is_active !== false ? (
            <Badge variant="green"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
          ) : (
            <Badge variant="red"><XCircle className="w-3 h-3 mr-1" /> Inactive</Badge>
          )}
        </div>
      )
    },
    {
      header: "Actions",
      className: "w-[15%] text-center",
      accessor: (row) => (
        <button 
          onClick={() => onManageAccount(row)}
          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 rounded transition-colors disabled:opacity-50"
          title="Manage Account"
          disabled={row.role === 'SUPER_ADMIN'}
        >
          <UserCog className="w-4 h-4" />
        </button>
      )
    }
  ];
}
