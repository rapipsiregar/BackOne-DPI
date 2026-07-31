"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { fetchAppDetails, AppDetails } from "@/lib/api";
import { useTimeFilter } from "@/contexts/TimeFilterContext";
import { fmtBytes } from "@/lib/utils";
import { Loader2, X, Globe, Server, Monitor } from "lucide-react";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import ActiveDurationDisplay from "./ActiveDurationDisplay";
import { Pagination } from "./Pagination";

interface ColDef {
  header: string;
  width: string;
  align?: "center" | "right";
}

function TableWrap({ children, cols }: { children: React.ReactNode; cols: ColDef[] }) {
  return (
    <div className="rounded-xl border border-border/50 bg-[#090D16] overflow-x-auto overflow-y-auto max-h-[55vh] custom-scrollbar">
      <table className="w-full text-xs text-center table-fixed whitespace-nowrap min-w-[700px] border-collapse">
        <thead className="bg-[#111827] border-b border-border/80 sticky top-0 z-10">
          <tr className="bg-[#111827]">
            {cols.map((c) => (
              <th
                key={c.header}
                className={`px-3 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-[10px] text-center bg-[#111827] border-b border-border/80 ${c.width}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {children}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ value, className = "", center = true, right = false }: { value: string | number; className?: string; center?: boolean; right?: boolean }) {
  const str = String(value ?? "—");
  const align = center ? "text-center" : right ? "text-right" : "text-center";
  return (
    <div className={`truncate overflow-hidden text-ellipsis flex items-center justify-center w-full ${align} ${className}`} title={str}>
      {str || "—"}
    </div>
  );
}

interface Props {
  appLabel: string;
  favicon?: string | null;
  category?: string | null;
  agentUuid?: string | null;
  onClose: () => void;
}

export function AppDetailModal({ appLabel, favicon, category, agentUuid, onClose }: Props) {
  const [data, setData] = useState<AppDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const { timeRange } = useTimeFilter();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  const [page, setPage] = useState(1);
  const pageSize = 50;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => { onClose(); }, 480);
  };

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setPage(1); // Reset page on query updates
    fetchAppDetails(appLabel, timeRange, agentUuid)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [appLabel, timeRange, agentUuid]);

  const topIps = data?.top_ips || [];
  const totalPages = Math.ceil(topIps.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const paginatedIps = topIps.slice(startIndex, startIndex + pageSize);

  if (!isMounted) return null;

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4" onClick={handleClose}>
          <div 
            className={`fixed inset-0 bg-slate-950/80 backdrop-blur-md z-0 ${isClosing ? 'animate-overlay-out' : 'animate-overlay-in'}`}
            style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
          />
          <div
            className={`relative z-10 bg-card border border-border rounded-2xl sm:rounded-3xl w-full max-w-3xl h-[88vh] sm:h-[85vh] flex flex-col shadow-2xl shadow-black/60 overflow-hidden ${isClosing ? 'animate-modal-out' : 'animate-modal-in'}`}
            onClick={(e) => e.stopPropagation()}
          >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 sm:px-6 py-3 sm:py-4 border-b border-border bg-gradient-to-r from-green-900/30 to-emerald-900/20 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="p-2 bg-green-500/20 rounded-lg ring-1 ring-green-500/30 shrink-0">
                {favicon ? (
                  <img src={favicon} alt={appLabel} className="w-4 h-4 sm:w-5 sm:h-5 rounded" />
                ) : (
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-lg font-bold text-card-foreground truncate">{appLabel}</h3>
                {category && <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{category}</p>}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 text-muted-foreground hover:text-card-foreground hover:bg-secondary rounded-lg transition-all flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-green-400" />
                <p className="text-muted-foreground text-sm">Loading application data...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-400 text-sm">{error}</div>
            ) : data ? (
              <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
                {/* Total Summary */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3 p-3 sm:p-4 bg-white/[0.03] border border-border/50 rounded-xl">
                  <div className="text-center">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Total Download</p>
                    <p className="text-base sm:text-xl font-bold text-cyan-400 truncate">{fmtBytes(data.total_download ?? 0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Total Upload</p>
                    <p className="text-base sm:text-xl font-bold text-green-400 truncate">{fmtBytes(data.total_upload ?? 0)}</p>
                  </div>
                </div>

                {/* Devices list */}
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-300 mb-2 sm:mb-3 flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                    Devices Accessing {appLabel}
                  </h4>
                  {topIps.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-4">No active devices found for this app in the selected time range.</p>
                  ) : (
                    <div className="space-y-3">
                      <TableWrap cols={[
                        { header: "#",                  width: "w-[5%]", align: "center" },
                        { header: "Status / Last Seen", width: "w-[20%]", align: "center" },
                        { header: "IP Address",         width: "w-[20%]", align: "center" },
                        { header: "Domain",             width: "w-[25%]", align: "center" },
                        { header: "Download",           width: "w-[15%]", align: "center" },
                        { header: "Upload",             width: "w-[15%]", align: "center" },
                      ]}>
                        {paginatedIps.map((row: any, i: number) => (
                          <tr key={i} className="hover:bg-white/[0.04] transition-colors duration-150">
                            <td className="px-3 py-2.5"><Cell value={startIndex + i + 1} center /></td>
                            <td className="px-3 py-2.5">
                              <ActiveDurationDisplay firstSeen={row.first_seen} lastSeen={row.last_seen} className="border-0 bg-transparent p-0 mb-0 flex justify-center" />
                            </td>
                            <td className="px-3 py-2.5">
                              <button
                                onClick={() => setSelectedIp(row.ip_address || row.dst_ip)}
                                className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-xs focus:outline-none w-full block text-center"
                                title={row.ip_address || row.dst_ip || '-'}
                              >
                                {row.ip_address || row.dst_ip || '-'}
                              </button>
                            </td>
                            <td className="px-3 py-2.5">
                              <Cell value={row.domain || '-'} className="text-slate-300" center />
                            </td>
                            <td className="px-3 py-2.5">
                              <Cell value={fmtBytes(row.download)} className="text-cyan-400 font-mono" center />
                            </td>
                            <td className="px-3 py-2.5">
                              <Cell value={fmtBytes(row.upload)} className="text-green-400 font-mono" center />
                            </td>
                          </tr>
                        ))}
                      </TableWrap>
                      <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        totalResults={topIps.length}
                        startIndex={startIndex}
                        endIndex={startIndex + pageSize}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>,
      document.body
      )}

      {selectedIp && (
        <DeviceDetailModal
          ip={selectedIp}
          onClose={() => setSelectedIp(null)}
        />
      )}
    </>
  );
}
