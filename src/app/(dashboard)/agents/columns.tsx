"use client";

import { Column } from "@/components/ui/DataTable";
import { Agent } from "@/lib/actions/agentsCore";
import { Badge } from "@/components/ui/Badge";
import { resolveAgentLabel, type ManagedUser } from "@/lib/admin-api";
import { Loader2, Trash2, CheckCircle2, XCircle, ChevronRight, UserCog, Eye, MapPin } from "lucide-react";

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
  handleEditLocation?: (agentUuid: string, agentLabel: string) => void;
  /** Set of agent UUIDs that already have a location saved */
  locationUuids?: Set<string>;
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
  handleEditLocation,
  locationUuids = new Set(),
}: GetColumnsProps): Column<Agent>[] {
  const cols: Column<Agent>[] = [
    {
      header: "UUID / Serial",
      className: "w-[12%] text-center",
      accessor: (row) => (
        <button onClick={() => setDetailAgent(row)} className="flex items-center justify-center gap-2 group text-center mx-auto" title="Click to view agent details">
          <span className="font-mono text-xs text-blue-400 group-hover:text-blue-300 transition-colors">{row.uuid || row.serial}</span>
          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400 transition-colors" />
        </button>
      )
    },
    {
      header: "Label",
      className: "w-[15%] text-center",
      accessor: (row) => {
        const uuid = row.uuid || row.serial;
        const dynamicLabel = resolveAgentLabel(uuid, managedUsers);
        const hasAccount = managedUsers.some(u => u.agent_uuid === uuid && u.role === 'AGENT_VIEWER');
        const displayLabel = dynamicLabel !== uuid ? dynamicLabel : (row.label || uuid);
        return (
          <div className="flex items-center justify-center gap-2 mx-auto max-w-full">
            <button 
              onClick={() => setDetailAgent(row)} 
              className="text-center hover:text-white transition-colors truncate"
              title={displayLabel}
            >
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
      className: "w-[11%] text-center",
      accessor: (row) => row.provisioned ? <Badge variant="green"><CheckCircle2 className="w-3 h-3 mr-1" /> Yes</Badge> : <Badge variant="red"><XCircle className="w-3 h-3 mr-1" /> No</Badge> 
    },
    { 
      header: "Activated", 
      className: "w-[11%] text-center",
      accessor: (row) => row.activated ? <Badge variant="green"><CheckCircle2 className="w-3 h-3 mr-1" /> Yes</Badge> : <Badge variant="red"><XCircle className="w-3 h-3 mr-1" /> No</Badge> 
    },
    { 
      header: "Traffic Status", 
      className: "w-[15%] text-center",
      accessor: (row) => {
        const statusText = row.last_seen_at?.human || '-';
        if (statusText.startsWith('Last seen:')) {
          return (
            <span className="text-emerald-400 font-medium flex items-center justify-center gap-1.5 mx-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              {statusText}
            </span>
          );
        } else {
          return <span className="text-slate-400 text-xs font-normal">{statusText}</span>;
        }
      }
    },
    {
      header: "Avg Uptime",
      className: "w-[10%] text-center",
      accessor: (row) => {
        const uuid = row.uuid || row.serial;
        const uptime = uptimeMap[uuid] ?? 100;
        let color = "text-emerald-400";
        if (uptime < 90) color = "text-red-400";
        else if (uptime < 98) color = "text-amber-400";
        return <span className={`font-mono font-medium text-xs tracking-wide ${color}`}>{uptime.toFixed(1)}%</span>;
      }
    },
    { 
      header: "Actions", 
      className: "w-[16%] text-center",
      accessor: (row) => {
        const uuid = row.uuid || row.serial;
        const dynamicLabel = resolveAgentLabel(uuid, managedUsers);
        const existingUser = managedUsers.find(u => u.agent_uuid === uuid && u.role === 'AGENT_VIEWER') || null;
        const isViewAsLoading = viewAsLoading === uuid;
        const agentLabel = dynamicLabel !== uuid ? dynamicLabel : (row.label || uuid);
        return (
          <div className="flex items-center justify-center gap-1 mx-auto">
            <button onClick={() => setDetailAgent(row)} className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-950/30 rounded transition-colors" title="Detail Agent">
              <ChevronRight className="w-4 h-4" />
            </button>
            {(role === 'SUPER_ADMIN' || role === 'TENANT_ADMIN') && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setAccountModalAgent({ uuid, label: agentLabel }); setAccountModalOpen(true); }}
                  className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 rounded transition-colors"
                  title={existingUser ? 'Edit Agent Account' : 'Create Agent Account'}
                >
                  <UserCog className="w-4 h-4" />
                </button>
                {handleEditLocation && (() => {
                    const hasLocation = locationUuids.has(uuid);
                    return (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleEditLocation(uuid, agentLabel); }}
                        className={`relative p-1 rounded transition-colors ${
                          hasLocation
                            ? "text-teal-400 hover:text-teal-300 hover:bg-teal-950/30"
                            : "text-slate-500 hover:text-indigo-400 hover:bg-indigo-950/30"
                        }`}
                        title={hasLocation ? "✅ Location set — click to update" : "⚠️ No location — click to set coordinates"}
                      >
                        <MapPin className="w-4 h-4" />
                        {hasLocation && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-400 border border-slate-900" />
                        )}
                      </button>
                    );
                  })()}
                <button
                  onClick={(e) => { e.stopPropagation(); handleViewAs(uuid, agentLabel); }}
                  disabled={isViewAsLoading}
                  className="p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 rounded transition-colors disabled:opacity-50"
                  title="View As Agent"
                >
                  {isViewAsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); openDelete(row); }} className="p-1 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            {/* COMPANY_ADMIN dan COMPANY_OPERATOR: hanya View-As */}
            {(role === 'COMPANY_ADMIN' || role === 'COMPANY_OPERATOR') && (
              <button
                onClick={(e) => { e.stopPropagation(); handleViewAs(uuid, agentLabel); }}
                disabled={isViewAsLoading}
                className="p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-950/30 rounded transition-colors disabled:opacity-50"
                title="View As Agent — see dashboard from this agent's perspective"
              >
                {isViewAsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              </button>
            )}
          </div>
        );
      }
    },
  ];

  if (role === 'SUPER_ADMIN') {
    cols.splice(cols.length - 1, 0, {
      header: "Data Size",
      className: "w-[10%] text-center",
      accessor: (row) => {
        const uuid = row.uuid || row.serial;
        const sizeMB = storageMap[uuid] ?? 0;
        let displaySize = "";
        if (sizeMB >= 1024 * 1024) {
          displaySize = `${(sizeMB / (1024 * 1024)).toFixed(2)} TB`;
        } else if (sizeMB >= 1024) {
          displaySize = `${(sizeMB / 1024).toFixed(2)} GB`;
        } else {
          displaySize = `${sizeMB.toFixed(2)} MB`;
        }
        return <span className="font-mono text-xs font-normal text-slate-300 tracking-wide">{displaySize}</span>;
      }
    });
  }

  return cols;
}


