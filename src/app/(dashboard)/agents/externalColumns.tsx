"use client";

import { Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { SafeImage } from "@/components/ui/SafeImage";
import { type ManagedUser } from "@/lib/admin-api";
import { UserCog, CheckCircle2, XCircle } from "lucide-react";

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
              <SafeImage
                src={`/api/uploads/${row.profile_picture}`}
                alt={row.account_name || row.username}
                fallbackName={row.account_name || row.username}
                className="w-full h-full object-cover"
              />
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
        if (row.role === 'EXECUTIVE') badgeColor = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
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
