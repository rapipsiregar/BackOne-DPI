"use client";

// src/components/dpi/MetadataDetailPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Row-level detail modal for BackOne Metadata page.
// Matches animation style of DeviceDetailModal and AgentDetailModal.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Database, AlertCircle, Globe, Monitor, Cpu, Fingerprint, Hash, Terminal, Radio } from "lucide-react";
import { useMetadataDetail, MetadataDetailType, MetadataDetailRow } from "@/lib/api-metadata-detail";
import { Pagination } from "@/components/ui/Pagination";
import { fmtBytes } from "@/lib/utils";

// ─── Type config ───────────────────────────────────────────────────────────────
interface TypeConfig {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}

const TYPE_CONFIG: Record<MetadataDetailType, TypeConfig> = {
  sni_hostname:    { title: "SNI Hostname",      subtitle: "Devices that accessed this TLS hostname",      icon: Globe,        color: "blue" },
  ssl_server_cn:   { title: "SSL Common Name",   subtitle: "Devices that connected to this certificate",   icon: Globe,        color: "blue" },
  quic_hostname:   { title: "QUIC Hostname",     subtitle: "Devices using this QUIC destination",          icon: Globe,        color: "purple" },
  netbios_hostname:{ title: "NetBIOS Hostname",  subtitle: "Device records with this NetBIOS name",        icon: Monitor,      color: "cyan" },
  os_label:        { title: "Operating System",  subtitle: "Devices running this operating system",        icon: Cpu,          color: "emerald" },
  dhcp_fingerprint:{ title: "DHCP Fingerprint",  subtitle: "Agents with this device fingerprint class",    icon: Fingerprint,  color: "amber" },
  http_useragent:  { title: "HTTP User Agent",   subtitle: "Agent records for this User Agent string",     icon: Globe,        color: "orange" },
  bittorrent_hash: { title: "BitTorrent Hash",   subtitle: "Agent records for this torrent info hash",     icon: Hash,         color: "red" },
  ssh_version:     { title: "SSH Version",       subtitle: "SSH client and server connections",             icon: Terminal,     color: "violet" },
  mdns_hostname:   { title: "mDNS Hostname",     subtitle: "Agent records for this mDNS announcement",     icon: Radio,        color: "teal" },
};

const COLOR_MAP: Record<string, { icon: string; ring: string; glow: string }> = {
  blue:   { icon: "text-blue-400",    ring: "ring-blue-500/30",    glow: "bg-blue-500" },
  purple: { icon: "text-purple-400",  ring: "ring-purple-500/30",  glow: "bg-purple-500" },
  cyan:   { icon: "text-cyan-400",    ring: "ring-cyan-500/30",    glow: "bg-cyan-500" },
  emerald:{ icon: "text-emerald-400", ring: "ring-emerald-500/30", glow: "bg-emerald-500" },
  amber:  { icon: "text-amber-400",   ring: "ring-amber-500/30",   glow: "bg-amber-500" },
  orange: { icon: "text-orange-400",  ring: "ring-orange-500/30",  glow: "bg-orange-500" },
  red:    { icon: "text-red-400",     ring: "ring-red-500/30",     glow: "bg-red-500" },
  violet: { icon: "text-violet-400",  ring: "ring-violet-500/30",  glow: "bg-violet-500" },
  teal:   { icon: "text-teal-400",    ring: "ring-teal-500/30",    glow: "bg-teal-500" },
};

// ─── Cell with overflow ellipsis + title tooltip ────────────────────────────────
// ─── Cell with overflow ellipsis + title tooltip ────────────────────────────────
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

// ─── Column definitions with even percentage widths ────────────────────────────
type ColDef = { header: string; width: string; align?: "center" };

const COLS: Record<string, ColDef[]> = {
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

function getColGroup(type: MetadataDetailType): string {
  if (["sni_hostname", "ssl_server_cn", "quic_hostname"].includes(type)) return "domain";
  if (["netbios_hostname", "os_label"].includes(type)) return "device";
  if (type === "bittorrent_hash") return "torrent";
  if (type === "ssh_version") return "ssh";
  return "default";
}

// ─── Table Head ────────────────────────────────────────────────────────────────
function TableHead({ cols }: { cols: ColDef[] }) {
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

// ─── Table Row ─────────────────────────────────────────────────────────────────
function TableRow({ row, group }: { row: MetadataDetailRow; group: string }) {
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

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  type:      MetadataDetailType | null;
  value:     string | null;
  timeRange: string;
  onClose:   () => void;
}

const PAGE_SIZE = 50;

// ─── Main Modal ────────────────────────────────────────────────────────────────
export function MetadataDetailPanel({ type, value, timeRange, onClose }: Props) {
  const isOpen = !!(type && value);
  const { data, isLoading, error } = useMetadataDetail(type, value, timeRange);

  const [isMounted,  setIsMounted]  = useState(false);
  const [isClosing,  setIsClosing]  = useState(false);
  const [visible,    setVisible]    = useState(false);
  const [page,       setPage]       = useState(1);

  useEffect(() => { setIsMounted(true); }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setVisible(false);
      setIsClosing(false);
      document.body.style.overflow = "unset";
      onClose();
    }, 480);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setIsClosing(false);
      setPage(1);
      document.body.style.overflow = "hidden";
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleClose]);

  useEffect(() => () => { document.body.style.overflow = "unset"; }, []);

  if (!isMounted || !visible || !type || !value) return null;

  const cfg    = TYPE_CONFIG[type];
  const colors = COLOR_MAP[cfg.color];
  const Icon   = cfg.icon;
  const group  = getColGroup(type);
  const cols   = COLS[group];

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pagedData  = data.slice(pageStart, pageStart + PAGE_SIZE);

  const totalDownload = data.reduce((s, r) => s + (r.download || 0), 0);
  const totalUpload   = data.reduce((s, r) => s + (r.upload   || 0), 0);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      {/* Backdrop */}
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-md ${isClosing ? "animate-overlay-out" : "animate-overlay-in"}`} />

      {/* Dialog */}
      <div
        className={`relative bg-card border border-border rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl shadow-black/60 overflow-hidden ${isClosing ? "animate-modal-out" : "animate-modal-in"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-blue-900/30 to-purple-900/20 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className={`absolute inset-0 ${colors.glow} blur-xl opacity-20 rounded-full`} />
              <div className={`p-2.5 bg-white/[0.06] rounded-xl ring-1 ${colors.ring} relative`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold uppercase tracking-widest mb-0.5 ${colors.icon}`}>{cfg.title}</p>
              <h3 className="text-lg font-bold text-card-foreground truncate" title={value}>{value}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{cfg.subtitle}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="ml-4 flex-shrink-0 p-2 text-muted-foreground hover:text-card-foreground hover:bg-secondary rounded-xl transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Summary bar ── */}
        {!isLoading && data.length > 0 && (
          <div className="flex items-center gap-6 px-6 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex-shrink-0 text-xs">
            <span className="text-muted-foreground">
              <span className="font-semibold text-slate-200">{data.length.toLocaleString()}</span>
              {" "}{data.length === 1 ? "record" : "records"}
            </span>
            <span className="text-muted-foreground">
              Total Download:{" "}
              <span className="text-cyan-400 font-semibold font-mono">{fmtBytes(totalDownload)}</span>
            </span>
            <span className="text-muted-foreground">
              Total Upload:{" "}
              <span className="text-emerald-400 font-semibold font-mono">{fmtBytes(totalUpload)}</span>
            </span>
          </div>
        )}

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-slate-400 text-sm font-medium">Loading data from MongoDB...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-red-400">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
              <Database className="h-8 w-8" />
              <p className="text-base font-semibold text-slate-400">No Data</p>
              <p className="text-sm">No records found for this entry in MongoDB</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-center whitespace-nowrap text-sm table-fixed">
              <thead className="sticky top-0 bg-[#111827] z-10">
                <TableHead cols={cols} />
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {pagedData.map((row, i) => (
                  <TableRow key={pageStart + i} row={row} group={group} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Pagination ── */}
        {!isLoading && !error && data.length > 0 && (
          <div className="flex-shrink-0">
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={setPage}
              totalResults={data.length}
              startIndex={pageStart}
              endIndex={pageStart + PAGE_SIZE}
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
