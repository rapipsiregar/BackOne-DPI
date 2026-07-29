"use client";

import { Column } from "@/components/ui/DataTable";

export interface DeviceLabelItem {
  mac_address: string;
  ip_address: string;
  device_type: string;
  manufacturer: string;
  default_label: string;
  custom_label: string | null;
  agent_uuid: string;
  agent_name: string;
  last_seen: string;
}

interface GetColumnsProps {
  userRole: string;
  onEditClick: (device: DeviceLabelItem) => void;
  onMacClick: (device: DeviceLabelItem) => void;
}

export function getColumns({
  userRole,
  onEditClick,
  onMacClick,
}: GetColumnsProps): Column<DeviceLabelItem>[] {
  return [
    { 
      header: "#", 
      className: "w-[4%] text-center",
      accessor: (_, i) => <span className="text-slate-400 font-mono">{i + 1}</span> 
    },
    {
      header: "MAC Address",
      className: "w-[15%] text-center",
      accessor: (row) => (
        <button
          type="button"
          onClick={() => onMacClick(row)}
          className="text-xs bg-white/5 border border-white/10 hover:border-amber-500/30 hover:bg-amber-500/5 px-2 py-0.5 rounded font-mono text-slate-300 hover:text-amber-400 transition-all cursor-pointer outline-none"
          title="Click to view device details & IP history"
        >
          {row.mac_address}
        </button>
      )
    },
    {
      header: "Custom Owner Label",
      className: "w-[20%] text-center",
      accessor: (row) => row.custom_label ? (
        <span className="text-xs font-semibold text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-1 rounded-full">
          {row.custom_label}
        </span>
      ) : (
        <span className="text-xs text-slate-500 italic">No label configured</span>
      )
    },
    {
      header: "Default System Label",
      className: "w-[20%] text-center",
      accessor: (row) => (
        <span className="text-xs text-slate-400">
          {row.default_label}
        </span>
      )
    },
    {
      header: "Network Agent",
      className: "w-[18%] text-center",
      accessor: (row) => (
        <span className="text-xs font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
          {row.agent_name}
        </span>
      )
    },
    {
      header: "Last IP Address",
      className: "w-[11%] text-center",
      accessor: (row) => (
        <span className="text-xs font-mono text-slate-400">
          {row.ip_address}
        </span>
      )
    },
    {
      header: "Action",
      className: "w-[12%] text-center",
      accessor: (row) => userRole === 'EXECUTIVE' ? (
        <span className="text-xs text-slate-500 italic">View Only</span>
      ) : (
        <button
          type="button"
          onClick={() => onEditClick(row)}
          className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 border border-blue-500/20 hover:border-blue-500/40 bg-blue-500/5 hover:bg-blue-500/10 px-3 py-1.5 rounded-lg transition-all font-medium cursor-pointer"
        >
          ✏️ Edit Owner
        </button>
      )
    }
  ];
}
