"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { ShieldCheck, Loader2 } from "lucide-react";
import { ThreatStat } from "@/lib/api";
import { useThreats } from "@/lib/api-with-context";
import { DeviceDetailModal } from "@/components/ui/DeviceDetailModal";
import { ThreatFilters } from "@/components/threats/ThreatFilters";
import { ThreatRecommendationsDrawer } from "@/components/threats/ThreatRecommendationsDrawer";
import { useSearchParams } from "next/navigation";
import { HelpTrigger } from "@/components/help/HelpTrigger";
import { getThreatColumns } from "./threatColumns";

export default function ThreatsContent() {
  const [mounted, setMounted] = useState(false);
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [selectedMac, setSelectedMac] = useState<string | null>(null);
  const [selectedThreat, setSelectedThreat] = useState<ThreatStat | null>(null);
  
  const threats = useThreats();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  // Column dropdown filters state
  const [fType, setFType] = useState("All");
  const [fSev, setFSev] = useState("All");
  const [fSrcIp, setFSrcIp] = useState("All");
  const [fDstIp, setFDstIp] = useState("All");
  const [fMac, setFMac] = useState("All");
  const [fApp, setFApp] = useState("All");
  const [fDomain, setFDomain] = useState("All");

  // Date range filter state
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setMounted(true);
    document.title = "Detected Threats | BackOne - Deep Package Inspection";
  }, []);

  const all = threats.data || [];

  // Apply all filters
  const filtered = useMemo(() => {
    return all.filter((row) => {
      if (fType !== "All" && (row.threat_type || "") !== fType) return false;
      if (fSev !== "All" && (row.severity || "") !== fSev) return false;
      if (fSrcIp !== "All" && (row.ip_address || "") !== fSrcIp) return false;
      if (fDstIp !== "All" && (row.dst_ip || "") !== fDstIp) return false;
      if (fMac !== "All" && (row.mac_address || "") !== fMac) return false;
      if (fApp !== "All" && (row.app_label || "") !== fApp) return false;
      if (fDomain !== "All" && (row.domain || "") !== fDomain) return false;
      if (dateFrom || dateTo) {
        const d = row.detected_at
          ? new Date(row.detected_at).toISOString().slice(0, 10)
          : "";
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
      }
      return true;
    });
  }, [all, fType, fSev, fSrcIp, fDstIp, fMac, fApp, fDomain, dateFrom, dateTo]);

  // Default sort: newest detected threats first (for table display)
  const sortedFiltered = useMemo(() =>
    [...filtered].sort((a, b) =>
      new Date(b.detected_at || 0).getTime() - new Date(a.detected_at || 0).getTime()
    ),
    [filtered]
  );

  // Automatically select a threat if highlightId is passed
  useEffect(() => {
    if (highlightId && all.length > 0) {
      const match = all.find(r => r.id.toString() === highlightId);
      if (match) {
        setSelectedThreat(match);
      }
    }
  }, [highlightId, all]);

  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = async () => {
    setIsExporting(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { default: ThreatsSummaryPdfDocument } = await import("./ThreatsSummaryPdfDocument");

      const reportDateStr =
        new Date().toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " WIB";

      const doc = <ThreatsSummaryPdfDocument threatsData={filtered} reportDateStr={reportDateStr} />;

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Threat_Intelligence_Summary_Report.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Failed to generate PDF report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const columns = useMemo(() => getThreatColumns(setSelectedIp, setSelectedMac, setSelectedThreat, highlightId), [highlightId]);

  const activeFilterCount =
    [fType, fSev, fSrcIp, fDstIp, fMac, fApp, fDomain].filter((v) => v !== "All").length +
    (dateFrom || dateTo ? 1 : 0);

  const resetFilters = () => {
    setFType("All"); setFSev("All"); setFSrcIp("All"); setFDstIp("All");
    setFMac("All"); setFApp("All"); setFDomain("All"); setDateFrom(""); setDateTo("");
  };

  if (!mounted) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Detected Threats
            {threats.isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h2>
          <p className="text-muted-foreground mt-1">Monitor and respond to network security threats.</p>
        </div>
        <div className="flex items-center gap-3">
          <HelpTrigger pageId="threats" />
          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <ShieldCheck className="h-4 w-4" />
            <span>Active Monitoring</span>
          </div>
        </div>
      </div>

      <ThreatFilters
        all={all}
        fType={fType}
        setFType={setFType}
        fSev={fSev}
        setFSev={setFSev}
        fSrcIp={fSrcIp}
        setFSrcIp={setFSrcIp}
        fDstIp={fDstIp}
        setFDstIp={setFDstIp}
        fMac={fMac}
        setFMac={setFMac}
        fApp={fApp}
        setFApp={setFApp}
        fDomain={fDomain}
        setFDomain={setFDomain}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        activeFilterCount={activeFilterCount}
        onReset={resetFilters}
      />

      <Card
        className="bg-card/80 backdrop-blur-xl border-border/50 animate-slide-up relative z-10 overflow-visible"
        style={{ animationDelay: "100ms" }}
      >
        <CardHeader className="border-b border-border/50 pb-4 mb-4">
          <CardTitle className="text-lg text-white">
            Detected Threats
            <span className="ml-2 text-muted-foreground font-normal">
              ({filtered.length}
              {filtered.length !== all.length ? ` of ${all.length}` : ""})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={sortedFiltered}
            columns={columns}
            searchPlaceholder="Search threats by IP, domain, type..."
            searchFilter={(row, query) => {
              const q = query.toLowerCase();
              return (
                (row.ip_address || "").toLowerCase().includes(q) ||
                (row.domain || "").toLowerCase().includes(q) ||
                (row.threat_type || "").toLowerCase().includes(q) ||
                (row.app_label || "").toLowerCase().includes(q)
              );
            }}
            getRowClassName={(row) =>
              highlightId && row.id.toString() === highlightId
                ? "bg-red-500/15 border-l-2 border-red-500 animate-pulse font-semibold"
                : ""
            }
            csvExport={{
              filename: `threats-${new Date().toISOString().slice(0, 10)}.csv`,
              headers: ["Timestamp", "Type", "Severity", "Source IP", "Dest IP", "MAC Address", "App", "Domain"],
              rowSerializer: (row) => [
                row.detected_at ? new Date(row.detected_at).toISOString() : "",
                row.threat_type || "",
                row.severity || "",
                row.ip_address || "",
                row.dst_ip || "",
                row.mac_address || "",
                row.app_label || "",
                row.domain || "",
              ],
            }}
            pdfExport={{
              onExport: exportToPdf,
              isExporting,
            }}
          />
        </CardContent>
      </Card>

      {selectedIp && <DeviceDetailModal ip={selectedIp} onClose={() => setSelectedIp(null)} />}
      {selectedMac && <DeviceDetailModal ip="" mac={selectedMac} onClose={() => setSelectedMac(null)} />}
      
      <ThreatRecommendationsDrawer
        threat={selectedThreat}
        onClose={() => setSelectedThreat(null)}
      />
    </div>
  );
}
