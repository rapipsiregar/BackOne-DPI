// src/app/(dashboard)/user-accounts/columns.tsx
"use client";

import { Column } from "@/components/ui/DataTable";
import { type ManagedUser } from "@/lib/admin-api";
import { Eye, Loader2, Lock, Unlock } from "lucide-react";

interface GetColumnsProps {
  role: string | null;
  currentUsername?: string | null;
  viewAsLoading?: string | null;
  unlockLoading?: string | null;
  onEditClick: (user: ManagedUser) => void;
  onViewAsClick?: (user: ManagedUser) => void;
  onUnlockClick?: (user: ManagedUser) => void;
}

export function getColumns({
  role,
  currentUsername,
  viewAsLoading,
  unlockLoading,
  onEditClick,
  onViewAsClick,
  onUnlockClick,
}: GetColumnsProps): Column<ManagedUser>[] {
  return [
    {
      header: "#",
      className: "w-[5%] text-center",
      accessor: (_, i) => <span className="text-slate-400 font-mono">{i + 1}</span>
    },
    {
      header: "Account Name",
      className: "w-[20%] text-center",
      accessor: (row) => (
        <span className="text-sm font-medium text-slate-200">
          {row.account_name || row.username}
        </span>
      )
    },
    {
      header: "Username",
      className: "w-[16%] text-center",
      accessor: (row) => <code className="text-xs text-slate-400 font-mono">{row.username}</code>
    },
    {
      header: "Role",
      className: "w-[18%] text-center",
      accessor: (row) => {
        let badgeColor = "bg-slate-500/20 text-slate-400 border-slate-500/30";
        if (row.role === "COMPANY_ADMIN") badgeColor = "bg-purple-500/20 text-purple-400 border-purple-500/30";
        if (row.role === "COMPANY_OPERATOR") badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
        if (row.role === "COMPANY_VIEWER") badgeColor = "bg-blue-500/20 text-blue-400 border-blue-500/30";
        
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${badgeColor}`}>
            {row.role.replace(/_/g, " ")}
          </span>
        );
      }
    },
    {
      header: "Status",
      className: "w-[12%] text-center",
      accessor: (row) => {
        const isLocked = row.lockout_until && new Date(row.lockout_until) > new Date();
        if (isLocked) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
              <Lock className="w-3 h-3" /> Locked
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Active
          </span>
        );
      }
    },
    {
      header: "Assigned Devices",
      className: "w-[14%] text-center",
      accessor: (row) => {
        const uuids = row.agent_uuids || [];
        if (uuids.length === 0) return <span className="text-xs text-slate-500 italic">No device assigned</span>;
        return (
          <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded">
            {uuids.length} Device{uuids.length > 1 ? "s" : ""}
          </span>
        );
      }
    },
    {
      header: "View As",
      className: "w-[10%] text-center",
      accessor: (row) => {
        const isSelf = currentUsername && row.username === currentUsername;
        const isCompanyAdmin = row.role === "COMPANY_ADMIN";
        const canViewAs = onViewAsClick &&
          !isSelf &&
          !isCompanyAdmin &&
          (row.role === "COMPANY_OPERATOR" || row.role === "COMPANY_VIEWER") &&
          (role === "SUPER_ADMIN" || role === "COMPANY_ADMIN");

        if (!canViewAs) {
          return <span className="text-slate-600 text-xs">—</span>;
        }

        const isLoading = viewAsLoading === row.username;
        return (
          <button
            type="button"
            onClick={() => onViewAsClick(row)}
            disabled={isLoading}
            title={`View dashboard as ${row.account_name || row.username}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 hover:border-amber-400/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Eye className="w-3 h-3" />
            )}
            View As
          </button>
        );
      }
    },
    {
      header: "Actions",
      className: "w-[15%] text-center",
      accessor: (row) => {
        const isSelf = currentUsername && row.username === currentUsername;
        const isLocked = row.lockout_until && new Date(row.lockout_until) > new Date();
        const isDisabled = role === "EXECUTIVE" || isSelf;
        const isUnlocking = unlockLoading === row.id;

        return (
          <div className="flex items-center justify-center gap-2">
            {isLocked && onUnlockClick && (
              <button
                type="button"
                onClick={() => onUnlockClick(row)}
                disabled={isUnlocking}
                title="Unlock account access"
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 hover:bg-emerald-400/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUnlocking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlock className="w-3 h-3" />}
                <span>Unlock</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => !isSelf && onEditClick(row)}
              disabled={!!isDisabled}
              title={isSelf ? "Cannot edit your own account from here" : undefined}
              className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed hover:underline font-medium cursor-pointer"
            >
              {isSelf ? "👤 (You)" : "⚙️ Edit"}
            </button>
          </div>
        );
      }
    }
  ];
}
