"use client";

import { MetadataDetailRow, MetadataDetailType } from "@/lib/api-metadata-detail";
import { fmtBytes } from "@/lib/utils";

export type ColDef = { header: string; width: string; align?: "center" };

export const COLS: Record<string, ColDef[]> = {
  domain: [
    { header: "Source IP",    width: "w-[12.5%]" },
    { header: "MAC Address",  width: "w-[12.5%]" },
    { header: "Device Name",  width: "w-[12.5%]" },
    { header: "Manufacturer", width: "w-[12.5%]" },
    { header: "OS",           width: "w-[12.5%]" },
    { header: "Download",     width: "w-[12.5%]", align: "center" },
    { header: "Upload",       width: "w-[12.5%]", align: "center" },
    { header: "Flows",        width: "w-[12.5%]", align: "center" },
  ],
  device: [
    { header: "IP Address",   width: "w-[16.6%]" },
    { header: "MAC Address",  width: "w-[16.6%]" },
    { header: "Device Name",  width: "w-[16.6%]" },
    { header: "Manufacturer", width: "w-[16.6%]" },
    { header: "Download",     width: "w-[16.6%]", align: "center" },
    { header: "Upload",       width: "w-[16.6%]", align: "center" },
  ],
  torrent: [
    { header: "Agent",          width: "w-[20%]" },
    { header: "Torrent Label",  width: "w-[20%]" },
    { header: "Download",       width: "w-[20%]", align: "center" },
    { header: "Upload",         width: "w-[20%]", align: "center" },
    { header: "Flows",          width: "w-[20%]", align: "center" },
  ],
  ssh: [
    { header: "Role",     width: "w-[20%]", align: "center" },
    { header: "Agent",    width: "w-[20%]" },
    { header: "Download", width: "w-[20%]", align: "center" },
    { header: "Upload",   width: "w-[20%]", align: "center" },
    { header: "Flows",    width: "w-[20%]", align: "center" },
  ],
  default: [
    { header: "Agent",    width: "w-[25%]" },
    { header: "Download", width: "w-[25%]", align: "center" },
    { header: "Upload",   width: "w-[25%]", align: "center" },
    { header: "Flows",    width: "w-[25%]", align: "center" },
  ],
};

export function getColGroup(type: MetadataDetailType): string {
  if (["sni_hostname", "ssl_server_cn", "quic_hostname"].includes(type)) return "domain";
  if (["netbios_hostname", "os_label"].includes(type)) return "device";
  if (type === "bittorrent_hash") return "torrent";
  if (type === "ssh_version") return "ssh";
  return "default";
}

function Cell({ value, className = "", center = true }: { value: string | number; className?: string; center?: boolean }) {
  const str = String(value ?? "—");
  return (
    <div
      className={`truncate whitespace-nowrap overflow-hidden text-ellipsis ${center ? "text-center" : ""} ${className}`}
      title={str}
    >
      {str || "—"}
    </div>
  );
}

export function TableHead({ cols }: { cols: ColDef[] }) {
  const base = "px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center";
  return (
    <tr>
      {cols.map((c) => (
        <th key={c.header} className={`${base} ${c.width}`}>
          {c.header}
        </th>
      ))}
    </tr>
  );
}

export function TableRow({ row, group }: { row: MetadataDetailRow; group: string }) {
  const tr = "border-b border-white/[0.04] hover:bg-white/[0.04] transition-colors duration-150";
  const tc = "px-3 py-2.5 text-sm text-center align-middle";

  if (group === "domain") return (
    <tr className={tr}>
      <td className={tc}><Cell value={row.src_ip || "—"} className="text-blue-400 font-mono text-xs" /></td>
      <td className={tc}><Cell value={row.mac_address || "—"} className="font-mono text-xs text-slate-400" /></td>
      <td className={tc}><Cell value={row.device_label || row.src_ip || "—"} className="text-slate-200" /></td>
      <td className={tc}><Cell value={row.manufacturer || "—"} className="text-slate-400 text-xs" /></td>
      <td className={tc}><Cell value={row.os_label || "—"} className="text-slate-400 text-xs" /></td>
      <td className={tc}><Cell value={fmtBytes(row.download)} className="text-cyan-400 font-mono text-xs" /></td>
      <td className={tc}><Cell value={fmtBytes(row.upload)} className="text-emerald-400 font-mono text-xs" /></td>
      <td className={tc}><Cell value={(row.flows ?? 0).toLocaleString()} className="text-slate-300 font-mono text-xs" /></td>
    </tr>
  );

  if (group === "device") return (
    <tr className={tr}>
      <td className={tc}><Cell value={row.ip_address || "—"} className="text-blue-400 font-mono text-xs" /></td>
      <td className={tc}><Cell value={row.mac_address || "—"} className="font-mono text-xs text-slate-400" /></td>
      <td className={tc}><Cell value={row.device_label || "—"} className="text-slate-200" /></td>
      <td className={tc}><Cell value={row.manufacturer || "—"} className="text-slate-400 text-xs" /></td>
      <td className={tc}><Cell value={fmtBytes(row.download)} className="text-cyan-400 font-mono text-xs" /></td>
      <td className={tc}><Cell value={fmtBytes(row.upload)} className="text-emerald-400 font-mono text-xs" /></td>
    </tr>
  );

  if (group === "torrent") return (
    <tr className={tr}>
      <td className={tc}><Cell value={row.agent_uuid || "—"} className="font-mono text-xs text-slate-400" /></td>
      <td className={tc}><Cell value={row.label || "Unknown"} className="text-slate-200" /></td>
      <td className={tc}><Cell value={fmtBytes(row.download)} className="text-cyan-400 font-mono text-xs" /></td>
      <td className={tc}><Cell value={fmtBytes(row.upload)} className="text-emerald-400 font-mono text-xs" /></td>
      <td className={tc}><Cell value={(row.flows ?? 0).toLocaleString()} className="text-slate-300 font-mono text-xs" /></td>
    </tr>
  );

  if (group === "ssh") return (
    <tr className={tr}>
      <td className={tc}>
        <div className="flex justify-center">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            row.role === "Client" ? "bg-blue-500/20 text-blue-300" : "bg-purple-500/20 text-purple-300"
          }`}>{row.role || "—"}</span>
        </div>
      </td>
      <td className={tc}><Cell value={row.agent_uuid || "—"} className="font-mono text-xs text-slate-400" /></td>
      <td className={tc}><Cell value={fmtBytes(row.download)} className="text-cyan-400 font-mono text-xs" /></td>
      <td className={tc}><Cell value={fmtBytes(row.upload)} className="text-emerald-400 font-mono text-xs" /></td>
      <td className={tc}><Cell value={(row.flows ?? 0).toLocaleString()} className="text-slate-300 font-mono text-xs" /></td>
    </tr>
  );

  return (
    <tr className={tr}>
      <td className={tc}><Cell value={row.agent_uuid || "—"} className="font-mono text-xs text-slate-400" /></td>
      <td className={tc}><Cell value={fmtBytes(row.download)} className="text-cyan-400 font-mono text-xs" /></td>
      <td className={tc}><Cell value={fmtBytes(row.upload)} className="text-emerald-400 font-mono text-xs" /></td>
      <td className={tc}><Cell value={(row.flows ?? 0).toLocaleString()} className="text-slate-300 font-mono text-xs" /></td>
    </tr>
  );
}
