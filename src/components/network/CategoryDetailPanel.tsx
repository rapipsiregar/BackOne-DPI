"use client";

// src/components/network/CategoryDetailPanel.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Detail modal for Traffic Categories.
// Displays Top Applications and Top Devices for a selected category.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, Database, LayoutGrid, Monitor, LayoutList, AlertCircle } from "lucide-react";
import { useCategoryDetail, CategoryDetailAppRow, CategoryDetailDeviceRow } from "@/lib/api-category-detail";
import { Pagination } from "@/components/ui/Pagination";
import { fmtBytes } from "@/lib/utils";

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

export function CategoryDetailPanel({
  category,
  onClose,
  timeRange = "1d"
}: {
  category: string;
  onClose: () => void;
  timeRange?: string;
}) {
  const { data, isLoading, error } = useCategoryDetail(category, timeRange);
  const [isClosing, setIsClosing] = useState(false);
  const [activeTab, setActiveTab] = useState<"apps" | "devices">("apps");
  const [page, setPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const PAGE_SIZE = 25;

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [handleClose]);

  useEffect(() => {
    setIsMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  const currentData = activeTab === "apps" ? data.apps : data.devices;
  const totalPages = Math.max(1, Math.ceil(currentData.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageStart  = (safePage - 1) * PAGE_SIZE;
  const pagedData  = currentData.slice(pageStart, pageStart + PAGE_SIZE);

  const totalDownload = currentData.reduce((s, r) => s + (r.download || 0), 0);
  const totalUpload   = currentData.reduce((s, r) => s + (r.upload   || 0), 0);

  if (!isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={handleClose}>
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
              <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full" />
              <div className="p-2.5 bg-white/[0.06] rounded-xl ring-1 ring-blue-500/30 relative">
                <LayoutGrid className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest mb-0.5 text-blue-400">Traffic Category</p>
              <h3 className="text-lg font-bold text-card-foreground truncate" title={category}>{category}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Top applications and devices</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="ml-4 flex-shrink-0 p-2 text-muted-foreground hover:text-card-foreground hover:bg-secondary rounded-xl transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-border bg-card/50 flex-shrink-0 px-4 pt-4">
          <button
            onClick={() => setActiveTab("apps")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "apps" 
                ? "border-blue-500 text-blue-400" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <LayoutList className="w-4 h-4" />
            Top Applications
          </button>
          <button
            onClick={() => setActiveTab("devices")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "devices" 
                ? "border-blue-500 text-blue-400" 
                : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <Monitor className="w-4 h-4" />
            Top Devices
          </button>
        </div>

        {/* ── Summary bar ── */}
        {!isLoading && currentData.length > 0 && (
          <div className="flex items-center gap-6 px-6 py-2.5 bg-white/[0.02] border-b border-white/[0.06] flex-shrink-0 text-xs">
            <span className="text-muted-foreground">
              <span className="font-semibold text-slate-200">{currentData.length.toLocaleString()}</span>
              {" "}{currentData.length === 1 ? "record" : "records"}
            </span>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-muted-foreground">
              Download: <span className="font-mono text-cyan-400">{fmtBytes(totalDownload)}</span>
            </span>
            <span className="text-muted-foreground">
              Upload: <span className="font-mono text-emerald-400">{fmtBytes(totalUpload)}</span>
            </span>
            <div className="h-3 w-px bg-white/10" />
            <span className="text-slate-500 text-[10px] uppercase tracking-wider">
              Sorted by bandwidth
            </span>
          </div>
        )}

        {/* ── Content Area ── */}
        <div className="flex-1 overflow-auto bg-black/20">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
              <p className="text-slate-400 text-sm font-medium">Loading data from Database...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-red-400">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : currentData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-500">
              <Database className="h-8 w-8" />
              <p className="text-base font-semibold text-slate-400">No Data</p>
              <p className="text-sm">No records found for this entry in Database</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-center whitespace-nowrap text-sm table-fixed">
              <thead className="sticky top-0 bg-secondary z-10 shadow-md">
                {activeTab === "apps" ? (
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center w-[33%]">Application</th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center w-[33%]">Download</th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center w-[33%]">Upload</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center w-[16%]">Source IP</th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center w-[16%]">MAC Address</th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center w-[20%]">Device Name</th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center w-[16%]">Manufacturer</th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center w-[16%]">Download</th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center w-[16%]">Upload</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {activeTab === "apps" ? (
                  (pagedData as CategoryDetailAppRow[]).map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.04] transition-colors duration-150">
                      <td className="px-3 py-2.5 text-sm text-center align-middle"><Cell value={row.app_label || "—"} className="text-slate-200" /></td>
                      <td className="px-3 py-2.5 text-sm text-center align-middle"><Cell value={fmtBytes(row.download)} className="text-cyan-400 font-mono text-xs" /></td>
                      <td className="px-3 py-2.5 text-sm text-center align-middle"><Cell value={fmtBytes(row.upload)} className="text-emerald-400 font-mono text-xs" /></td>
                    </tr>
                  ))
                ) : (
                  (pagedData as CategoryDetailDeviceRow[]).map((row, i) => (
                    <tr key={i} className="hover:bg-white/[0.04] transition-colors duration-150">
                      <td className="px-3 py-2.5 text-sm text-center align-middle"><Cell value={row.src_ip || "—"} className="text-blue-400 font-mono text-xs" /></td>
                      <td className="px-3 py-2.5 text-sm text-center align-middle"><Cell value={row.mac_address || "—"} className="font-mono text-xs text-slate-400" /></td>
                      <td className="px-3 py-2.5 text-sm text-center align-middle"><Cell value={row.device_label || row.src_ip || "—"} className="text-slate-200" /></td>
                      <td className="px-3 py-2.5 text-sm text-center align-middle"><Cell value={row.manufacturer || "—"} className="text-slate-400 text-xs" /></td>
                      <td className="px-3 py-2.5 text-sm text-center align-middle"><Cell value={fmtBytes(row.download)} className="text-cyan-400 font-mono text-xs" /></td>
                      <td className="px-3 py-2.5 text-sm text-center align-middle"><Cell value={fmtBytes(row.upload)} className="text-emerald-400 font-mono text-xs" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Footer Pagination ── */}
        {!isLoading && totalPages > 1 && (
          <div className="border-t border-border bg-card p-4 flex justify-end flex-shrink-0">
            <Pagination 
              currentPage={safePage} 
              totalPages={totalPages} 
              onPageChange={setPage} 
              totalResults={currentData.length}
              startIndex={(safePage - 1) * PAGE_SIZE}
              endIndex={Math.min(safePage * PAGE_SIZE, currentData.length)}
            />
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
